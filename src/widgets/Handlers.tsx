import {
  REWRITE_PW_CODE,
  PARTIAL_PW_CODE,
  PARTIAL_SLOT,
  yFork
} from './index';
import {
  ReactRNPlugin, RemType, RichTextInterface,
} from '@remnote/plugin-sdk';

import { AppEvents, Rem } from '@remnote/plugin-sdk';

const USE_REF="REF"
const USE_PORTAL="PORTAL"
let refOrPortal=USE_REF




export const useHandlers=(plugin:ReactRNPlugin)=>{
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

  const addAutomateSlotPointer=(RefOfSlot:Rem)=>{
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

  const addAutomateSlotLoader= (hostRem:string|Rem|undefined,slotPortal:Rem|undefined)=>{

    // plugin.app.toast("SlotLoader Ready!");
    const automateDetector=async (DetectorItself:any)=>
    {
      return async ()=>{
        // await plugin.app.toast("SlotLoader Start!")
        if(!hostRem)return;
        if(typeof hostRem==="string")
        {
          hostRem=await plugin.rem.findOne(hostRem);
        }
        // await plugin.app.toast("SlotLoader Effected:"+hostRem?.text.toString())
        // console.warn("SlotLoader Effected:"+hostRem)
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



  const isValidPartialPointer=async (pointer:Rem)=>{
    let projectRem=await (await pointer.remsBeingReferenced())[0].getParentRem();
    return (await projectRem?.hasPowerup(PARTIAL_PW_CODE))
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
        if(mayBeSlots.length&&await slots_Parent?.hasPowerup(PARTIAL_PW_CODE))
        {
          return mayBeSlots;
        }
      }

    }

    return null;
  }

  async function usePointer(pointer:Rem,pointFrom:Rem,pointTo:Rem){
    await pointFrom.setText(await replaceTextObj(pointFrom.text));
    if(pointFrom.backText)
      await pointFrom.setBackText(await replaceTextObj(pointFrom.backText))
    async function replaceTextObj(textObj:RichTextInterface)
    {
      return await plugin.richText.replaceAllRichText(textObj,await plugin.richText.rem(pointer).value(),await plugin.richText.rem(pointTo).value())
    }
  }

  const addSlotsFromPartialPortal=async (hostRem:Rem|undefined,slotPortal:Rem|undefined)=>  {
    let slots=await slotPortal?.getPortalDirectlyIncludedRem();
    if(slots)
      slots=await plugin.rem.findMany(slots.map(slot=>slot._id));

    if(hostRem&&slots)
      await Promise.all(slots?.map(async (slot)=>{
        if((await slot.hasPowerup(PARTIAL_PW_CODE)))return;
        let newRem=await plugin.rem.createRem();
        await newRem?.setText(await plugin.richText.rem(slot).value())
        await newRem?.setParent(hostRem);
      }))
  }
  //get "remote slots"(A parent has children whose type is portal and the portal contains the "remote slot")
  const getSlotPortal=async (remAsClass:Rem)=>{
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

  let partialHandle=async (r:any,PartialHandlerRecord:{prev:Map<any, any>,current:Set<any>})=>{
    let targets=await getInherited(r);
    let target:Rem|undefined,targetId:string|undefined;
    if(refOrPortal===USE_PORTAL)
    {
      for([targetId,target] of targets.entries())
      {
        // plugin.app.toast(target?.text.toString()||"[NULL CONTENT]");
        if(!targetId||!target)continue
        let slotPortal;
        // await plugin.app.toast("Target Found!");
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
          let handle = await addAutomateSlotLoader(target, slotPortal)
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
              let handle=await addAutomateSlotPointer(newRem)
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

    PartialHandlerRecord.current= new Set();
  }
  let rewriteHandle=async (r:any,RewriteHandlerRecord:{prev:Map<any, any>,current:Set<any>})=>{
    let targets=await getInherited(r);

    let target:Rem|undefined,targetId:string|undefined;
    for([targetId,target] of targets.entries())
    {

    }
  }


  return {
    PARTIAL_PW_CODE:partialHandle
  }
}

