import {
  AppEvents,
  declareIndexPlugin,
  ReactRNPlugin,
  Rem,
  RemType, RichTextInterface,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';


const OBJECTPWCODE="O_O_N"
const PARTIAL_SLOT=OBJECTPWCODE+"slot"
const USE_REF="REF"
const USE_PORTAL="PORTAL"
let refOrPortal=USE_REF
async function onActivate(plugin: ReactRNPlugin) {

  await plugin.app.registerPowerup(
    'Object',
    OBJECTPWCODE,
    "A set of PowerUps enabling you to take notes like using OOP(Object Orient Programming) language based on the support of RN's native tag-slot system",
    {slots:[
      {code:'extends', name:'Extends', onlyProgrammaticModifying:false,hidden:false },
      {code:'rewrite', name:'Rewrite', onlyProgrammaticModifying:false,hidden:false },
      {code:'partial', name:'Partial', onlyProgrammaticModifying:false,hidden:false },
      ]}
  );

  await plugin.app.registerPowerup(
    'PartialSlot',
    PARTIAL_SLOT,
    "To Tag portals 'partial' function brings",
    {slots:[]
      }
  );

  let OONTag=await plugin.powerup.getPowerupByCode(OBJECTPWCODE);
  //let rewriter=await plugin.powerup.getPowerupSlotByCode(OBJECTPWCODE,"rewrite");
  let combiner=await plugin.powerup.getPowerupSlotByCode(OBJECTPWCODE,"partial");


  // A command that toggles whether a rem is a 'partial' rem
  await plugin.app.registerCommand({
    id: 'togglePartial',
    name: 'TogglePartial',
    keywords:'tgp',
    action: async () => {
      plugin.focus.getFocusedRem().then(async (focusedRem)=>{
        let p=await focusedRem?.getPowerupProperty(OBJECTPWCODE,"extends");
        if(!(p&&p.length)&&combiner)
        {
          focusedRem?.setPowerupProperty(OBJECTPWCODE,"extends",await plugin.richText.rem(combiner).value())
        }
        else
        {
          focusedRem?.setPowerupProperty(OBJECTPWCODE,"extends",[]).then(()=>{focusedRem?.removePowerup(OBJECTPWCODE);});
        }
      })
    },

  });





  const addPortal2=async (parentRem:Rem,portalContent:Rem[])=>{
    let portal=await plugin.rem.createPortal();
    if(portal)
      portalContent.forEach(content=>{
        if(portal)
          content.addToPortal(portal);
      })
    await portal?.setParent(parentRem);
    return portal
  }

  //get "remote slots"(A parent has children whose type is portal and the portal contains the "remote slot")
  const getSlotPortal=async (remAsClass:Rem)=>
  {
    let children=await remAsClass.getChildrenRem();
    return (await Promise.all(children.map(async (child)=>{
      return (await child.getType())===RemType.PORTAL&&(await child.hasPowerup(PARTIAL_SLOT))? child :undefined
    }))).flat(1).filter(t=>t);
  }

//Attain the BaseClass Rems the 'rem' has inherited from('rem' has reference to its BaseClass rem)
  const getInherited = async (rem:Rem|undefined)=>{
    let refs=await rem?.remsBeingReferenced();
    return new Map(refs?.map(t=>[t._id,t]))

  }

  const getValidPartialInPortal=async (parentRem:Rem|undefined)=>{
    if(!parentRem)return false;
    let children=await parentRem.getChildrenRem();
    for(let child of children)
    {
      if((await child.getType())===RemType.PORTAL)
      {
        let mayBeSlots=await Promise.all((await child.getPortalDirectlyIncludedRem()).map(async (re)=>await plugin.rem.findOne(re._id)));
        let slots_Parent=await mayBeSlots[0]?.getParentRem()
        if(mayBeSlots.length&&await slots_Parent?.getPowerupProperty(OBJECTPWCODE,"extends")==='Partial')
        {
          return mayBeSlots;
        }
      }

    }

    return null;
  }

  const isValidPartialPointer=async (pointer:Rem)=>{
    let projectRem=await (await pointer.remsBeingReferenced())[0].getParentRem();
    return (await projectRem?.getPowerupProperty(OBJECTPWCODE,"extends")==="Partial")
  }
  //Inspired by a Y combinator ^_^
  const yFork= (x:any)=>
  {
    return x(x)
  }

  const usePointer=async (pointer:Rem,pointFrom:Rem,pointTo:Rem)=>
  {
    await pointFrom.setText(await replaceTextObj(pointFrom.text));
    if(pointFrom.backText)
      await pointFrom.setBackText(await replaceTextObj(pointFrom.backText))
    async function replaceTextObj(textObj:RichTextInterface)
    {
      return await plugin.richText.replaceAllRichText(textObj,await plugin.richText.rem(pointer).value(),await plugin.richText.rem(pointTo).value())
    }
  }

  const AddAutomateSlotPointer=(RefOfSlot:Rem)=>
  {
      const AutomateSlotPointer=(HandleItself:any)=>{
        return async ()=>{
          if(!(await isValidPartialPointer(RefOfSlot)))
          {
            plugin.event.removeListener(AppEvents.RemChanged,RefOfSlot._id,HandleItself)
            return;
          }
          let pointTo=(await RefOfSlot.remsBeingReferenced())[0];
          let pointFrom=await RefOfSlot.remsReferencingThis();
          pointFrom.forEach((p)=>{
            usePointer(RefOfSlot,p,pointTo)
          })
        }
    }

    return yFork(AutomateSlotPointer)
  }

  const AddAutomateSlotLoader= (hostRem:string|Rem|undefined,slotPortal:Rem|undefined)=>{

    plugin.app.toast("SlotLoader Ready!");
    const automateDetector=async (DetectorItself:any)=>
    {
      return async ()=>{
        await plugin.app.toast("SlotLoader Start!")
        if(!hostRem)return;
        if(typeof hostRem==="string")
        {
          hostRem=await plugin.rem.findOne(hostRem);
        }
        await plugin.app.toast("SlotLoader Effected:"+hostRem?.text.toString())
        console.warn("SlotLoader Effected:"+hostRem)
        let slots=await getValidPartialInPortal(hostRem);
        if(hostRem&&!slots)
        {
          plugin.event.removeListener(AppEvents.RemChanged,hostRem._id,DetectorItself)
        }
        else if(hostRem)
        {
          for(let instanceRem of await hostRem.taggedRem())
          {
            await addSlotsFromPartialPortal(instanceRem,slotPortal);

          }
        }

      }
    }
    return yFork(automateDetector);
  }

  let PartialHandlerRecord={
    prev:new Map(),
    current:new Set()
  }
  const AddAutomateObNHandler=(r:Rem|undefined)=>
  {
    const AutomateObNHandler=(HandlerItself:any)=>{
      return async ()=>{

        await plugin.app.toast("Tagged Rem Triggered the Listener!")
        let state=await r?.getPowerupProperty(OBJECTPWCODE,"extends");

        if(!state)
        {
          plugin.event.removeListener(AppEvents.RemChanged,r?._id,HandlerItself)
        }
        else if(state)
        {
          let targets=await getInherited(r);
          if(state.includes("Partial"))
          {
            let target:Rem|undefined,targetId:string|undefined;
            if(refOrPortal===USE_PORTAL)
            {
              for([targetId,target] of targets.entries())
              {
                plugin.app.toast(target?.text.toString()||"[NULL CONTENT]");
                if(!targetId||!target)continue
                let slotPortal;
                await plugin.app.toast("Target Found!");
                //Add special portals being tagged with PowerUp to display the slots under the 'partial' rem
                let slotPortals=(await getSlotPortal(target));
                slotPortal=slotPortals.length? slotPortals[0]:undefined
                let children=await r?.getChildrenRem();
                if(children&&slotPortal)
                  for(let child of children)
                  {
                    if(await child.isSlot())
                    {
                      await child.addToPortal(slotPortal)
                    }
                  }
                else if(!slotPortal&&children)
                {
                  let portal=await addPortal2(target,children);
                  await portal?.addPowerup(PARTIAL_SLOT);
                  slotPortal=portal;
                }

                PartialHandlerRecord.current.add(targetId);
                if(!PartialHandlerRecord.prev.has(targetId)) {
                  let handle = await AddAutomateSlotLoader(target, slotPortal)
                  handle();
                  PartialHandlerRecord.prev.set(targetId, handle)
                  plugin.event.addListener(AppEvents.RemChanged, target._id, handle)
                }
              }
              PartialHandlerRecord.prev.forEach((r,i,map)=>{
                if(!PartialHandlerRecord.current.has(r))
                {
                  plugin.event.removeListener(AppEvents.RemChanged,r,PartialHandlerRecord.prev.get(r))
                  map.delete(r);
                }
              })
            }
            else if(refOrPortal===USE_REF)
            {
              for(target of targets.values())
              {
                let children=await r?.getChildrenRem();
                if(children&&(await children).length&&target)
                for(let child of children)
                {
                  let referencedAlready=false;
                  let newRem;
                  for(let rr of await child.remsReferencingThis())
                  {
                    if(rr.parent===target?._id)
                    {
                      referencedAlready=true;
                      newRem=rr;
                    }
                  }
                  if(!await child.isSlot())continue

                  if(!referencedAlready)
                  {
                    newRem=await plugin.rem.createRem();
                    await newRem?.setText(await plugin.richText.rem(child).value());
                    await newRem?.setParent(target);
                    await newRem?.setIsSlot(true);
                  }
                  PartialHandlerRecord.current.add(newRem?._id);
                  if(newRem&&!PartialHandlerRecord.prev.has(newRem?._id))
                  {
                    let handle=await AddAutomateSlotPointer(newRem)
                    handle();
                    PartialHandlerRecord.prev.set(newRem._id,handle);
                    plugin.event.addListener(AppEvents.RemChanged,newRem._id,handle)
                  }
                }
                PartialHandlerRecord.prev.forEach((value, key)=>{
                  if(!PartialHandlerRecord.current.has(key))
                  {
                    PartialHandlerRecord.prev.delete(key);
                  }
                })
              }
            }
          }
          PartialHandlerRecord.current= new Set();
        }
      }
    }

    return yFork(AutomateObNHandler)
  }

  const addSlotsFromPartialPortal=async (hostRem:Rem|undefined,slotPortal:Rem|undefined)=>
  {
    let slots=await slotPortal?.getPortalDirectlyIncludedRem();
    if(slots)
      slots=await plugin.rem.findMany(slots.map(slot=>slot._id));

    if(hostRem&&slots)
      await Promise.all(slots?.map(async (slot)=>{
        if((await slot.getPowerupProperty(OBJECTPWCODE,"extends"))==="Partial")return;
        let newRem=await plugin.rem.createRem();
        await newRem?.setText(await plugin.richText.rem(slot).value())
        await newRem?.setParent(hostRem);
      }))
  }

  let ListenerRecord={
    prev:new Map(),
    current:new Set()
  };
  //the process watching over all the rems tagged with "Object"
  const ObjectNProcess=async ()=>{
    let rs=await OONTag?.taggedRem();
    if(rs&&(await rs).length)
    {
      for(let r of rs)
      {
        if(!ListenerRecord.prev.has(r._id))
        {
          let handle=await AddAutomateObNHandler(r)
          handle();
          ListenerRecord.prev.set(r._id,handle);
          plugin.event.addListener(AppEvents.RemChanged,r._id,handle)

        }
        ListenerRecord.current.add(r._id);
      }
      ListenerRecord.prev.forEach((r,i,map)=>{
        if(!ListenerRecord.current.has(r))
        {
          plugin.event.removeListener(AppEvents.RemChanged,r,ListenerRecord.prev.get(r))
          map.delete(r);
        }

      })
    }
    ListenerRecord.current=new Set();
  }

  await ObjectNProcess();
  plugin.event.addListener(AppEvents.RemChanged,combiner?._id,ObjectNProcess)

}






async function onDeactivate(_: ReactRNPlugin) {

}

declareIndexPlugin(onActivate, onDeactivate);
