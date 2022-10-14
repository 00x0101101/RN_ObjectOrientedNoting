import {
  AppEvents,
  declareIndexPlugin,
  ReactRNPlugin,
  Rem,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';


import {
  partialOption,
  pointerOption,

} from './Handlers';
import { JSObject, useHandlers } from './Handlers';


const OBJECT_PW_CODE="O_O_N"
export const PARTIAL_SLOT=OBJECT_PW_CODE+"slot"


export const REWRITE_PW_CODE:string="Override"
export const PARTIAL_PW_CODE:string="Partial"
export const POINTER_PW_CODE:string="Pointer"


const options=[partialOption,pointerOption]
const optionsDict:JSObject={}
optionsDict[partialOption]=PARTIAL_PW_CODE;
optionsDict[pointerOption]=POINTER_PW_CODE;


// export   //Inspired by a Y combinator ^_^
// const yFork= (x:any)=>
// {
//   return x(x)
// }




async function onActivate(plugin: ReactRNPlugin) {
  let handlers=useHandlers(plugin)


  await plugin.app.registerPowerup(
    'Partial',
    PARTIAL_PW_CODE,
    "To Tag rems where the preserved word 'partial' effects",
    {slots:[]
      }
  );

  await plugin.app.registerPowerup('Rewrite',
    REWRITE_PW_CODE,
    "To Tag rems where the preserved word 'override' effects",
    {slots:[]
    })

  await plugin.app.registerPowerup(
    'PartialSlot',
    PARTIAL_SLOT,
    "To Tag portals 'partial' function brings",
    {slots:[]
    }
  );

  await plugin.app.registerPowerup('Pointer',
    POINTER_PW_CODE,
    "To make a reference to Rem to be a 'pointer' rem",
    {slots:[]
    })





  let combiner=await plugin.powerup.getPowerupByCode(PARTIAL_PW_CODE);
  let pointer=await plugin.powerup.getPowerupByCode(PARTIAL_PW_CODE);

  // A command that toggles whether a rem is a 'partial' rem
  await plugin.app.registerCommand({
    id: 'startOON',
    name: 'Clear OON tags',
    keywords:'oon',
    action: async () => {
      let hostRem=await plugin.focus.getFocusedRem();
      for (let op of options)
      {
        let pw2Remove=optionsDict[op];
        if(await hostRem?.hasPowerup(pw2Remove))
        {
          await hostRem?.removePowerup(pw2Remove)
        }
      }
    },
  });

  const AddAutomateObNHandler= (r:Rem|undefined,ObjTagCode:string)=>
  {
    let HandlerRecord={
      prev:new Map(),
      current:new Set()
    }
    let handler=handlers[ObjTagCode];
    let AutomateObNHandler=async ()=>{
      let state=r?.hasPowerup(ObjTagCode)
      if(!state)
      {
        plugin.event.removeListener(AppEvents.RemChanged,r?._id,AutomateObNHandler)
      }
      else
      {
        handler(r,HandlerRecord);
      }

    }
    return AutomateObNHandler
  }

  //the process will return a function in closure watching over all the rems tagged with power-up rems from OON
  const getObjectNotingProcess= async (ObjPowerUpCode:string)=>{
    let ObjPowerUp=await plugin.powerup.getPowerupByCode(ObjPowerUpCode)
    let ListenerRecord={
      prev:new Map(),
      current:new Set()
    };


    //Triggered when Obj PowerUp has been changed(due to some rem has been tag with this),
    //all changes to the rem tagged by the PowerUp whose code is "ObjPowerUpCode" will trigger the event listener
    //the callback of the event listener can auto-terminate themselves after corresponding PowerUp tags were removed
    return async ()=>{
      let remsOONed=await ObjPowerUp?.taggedRem();
      if(remsOONed&&(await remsOONed).length)
      {
        for(let taggedWithOON of remsOONed)
        {

          if(!ListenerRecord.prev.has(taggedWithOON._id))
          {
            let handle=AddAutomateObNHandler(taggedWithOON,ObjPowerUpCode)
            await handle();
            plugin.event.addListener(AppEvents.RemChanged,taggedWithOON._id,handle)
            ListenerRecord.prev.set(taggedWithOON._id,handle);


          }
          ListenerRecord.current.add(taggedWithOON._id);
        }
        ListenerRecord.prev.forEach((r,i,map)=>{
          if(!ListenerRecord.current.has(i))
          {
            plugin.event.removeListener(AppEvents.RemChanged,i,r)
            map.delete(i);
          }

        })
      }
      ListenerRecord.current=new Set();
    }
  }

  if(combiner)
  {
    let partialHandle=await getObjectNotingProcess(PARTIAL_PW_CODE);
    await partialHandle()
    //Each time when the "Partial" PowerUp changed due to some rem use "Partial" PowerUp as a tag, the "partialHandle" was triggered
    plugin.event.addListener(AppEvents.RemChanged,combiner?._id,partialHandle)
  }

  if(pointer)
  {
    let pointerHandle=await  getObjectNotingProcess(POINTER_PW_CODE);
    await pointerHandle();

    plugin.event.addListener(AppEvents.RemChanged,pointer?._id,pointerHandle);
  }


}






async function onDeactivate(_: ReactRNPlugin) {

}

declareIndexPlugin(onActivate, onDeactivate);
