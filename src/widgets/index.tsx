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

} from '../lib/constants';
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


export   //Inspired by a Y combinator ^_^
const yFork= (x:any)=>
{
  return x(x)
}




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
      for (let op in options)
      {
        let pw2Remove=optionsDict[op];
        if(await hostRem?.hasPowerup(pw2Remove))
        {
          await hostRem?.removePowerup(pw2Remove)
        }
      }
    },
  });

  const AddAutomateObNHandler=async (r:Rem|undefined,ObjTagCode:string)=>
  {
    let HandlerRecord={
      prev:new Map(),
      current:new Set()
    }
    let handler=handlers[ObjTagCode];
    const AutomateObNHandler=(ThisActionItself:any)=>{
      return async ()=>{
        let state=r?.hasPowerup(ObjTagCode)
        if(!state)
        {
          plugin.event.removeListener(AppEvents.RemChanged,r?._id,ThisActionItself)
        }
        else
        {
          handler(r,HandlerRecord);
        }
      }
    }
    return yFork(AutomateObNHandler)
  }

  //the process watching over all the rems tagged with power-up rems from OON
  const getObjectNotingProcess= async (ObjPowerUpCode:string)=>{
    let ObjPowerUp=await plugin.powerup.getPowerupByCode(ObjPowerUpCode)
    let ListenerRecord={
      prev:new Map(),
      current:new Set()
    };
    return async ()=>{
      let remsOONed=await ObjPowerUp?.taggedRem();
      if(remsOONed&&(await remsOONed).length)
      {
        for(let taggedWithOON of remsOONed)
        {
          for(let op of options)
          {
            let pw2Remove=optionsDict[op];
            if(pw2Remove===ObjPowerUpCode)continue;
            if(await taggedWithOON?.hasPowerup(pw2Remove))
            {
              await taggedWithOON?.removePowerup(pw2Remove)
            }
          }
          if(!ListenerRecord.prev.has(taggedWithOON._id))
          {
            let handle=await AddAutomateObNHandler(taggedWithOON,ObjPowerUpCode)
            handle();
            ListenerRecord.prev.set(taggedWithOON._id,handle);
            plugin.event.addListener(AppEvents.RemChanged,taggedWithOON._id,handle)

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
    plugin.event.addListener(AppEvents.RemChanged,combiner?._id,partialHandle)
  }

  if(pointer)
  {
    let pointerHandle=await  getObjectNotingProcess(POINTER_PW_CODE);
    await pointerHandle();
    plugin.event.addListener(AppEvents.RemChanged,pointer?._id,pointerHandle);
  }



  await plugin.app.toast("Act 3:3 Freeze!")
  // await openOONOptionPanel()
}






async function onDeactivate(_: ReactRNPlugin) {

}

declareIndexPlugin(onActivate, onDeactivate);
