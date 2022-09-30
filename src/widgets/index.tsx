import {
  AppEvents,
  declareIndexPlugin,
  ReactRNPlugin,
  Rem,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';

import {useHandlers} from './Handlers';

const OBJECT_PW_CODE="O_O_N"
export const PARTIAL_SLOT=OBJECT_PW_CODE+"slot"


export const REWRITE_PW_CODE:string="Override"
export const PARTIAL_PW_CODE:string="Partial"
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


  let combiner=await plugin.powerup.getPowerupByCode(PARTIAL_PW_CODE);
  let rewriter=await plugin.powerup.getPowerupByCode(REWRITE_PW_CODE);

  // A command that toggles whether a rem is a 'partial' rem
  await plugin.app.registerCommand({
    id: 'togglePartial',
    name: 'TogglePartial',
    keywords:'tgp',
    action: async () => {
      plugin.focus.getFocusedRem().then(async (focusedRem)=>{
        let p=await focusedRem?.hasPowerup(PARTIAL_PW_CODE)
        if(!p)
        {
            await focusedRem?.addPowerup(PARTIAL_PW_CODE)
        }
        else
        {
          focusedRem?.removePowerup(PARTIAL_PW_CODE)
        }
      })
    },

  });
  const AddAutomateObNHandler=async (r:Rem|undefined,ObjTagCode:string,handler:any)=>
  {
    let HandlerRecord={
      prev:new Map(),
      current:new Set()
    }
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

  //the process watching over all the rems tagged with "Object"
  const ObjectNProcess= async (ObjPowerUpCode:string)=>{
    let ObjPowerUp=await plugin.powerup.getPowerupByCode(ObjPowerUpCode)
    let ListenerRecord={
      prev:new Map(),
      current:new Set()
    };
    return async ()=>{
      let rs=await ObjPowerUp?.taggedRem();
      if(rs&&(await rs).length)
      {
        for(let r of rs)
        {
          if(!ListenerRecord.prev.has(r._id)&&ObjPowerUpCode in handlers)
          {
            let handle=await AddAutomateObNHandler(r,ObjPowerUpCode,Object.getOwnPropertyDescriptor(handlers,ObjPowerUpCode)?.value)
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
  }

  if(combiner)
  {
    let partialHandle=await ObjectNProcess(PARTIAL_PW_CODE);
    await partialHandle()
    plugin.event.addListener(AppEvents.RemChanged,combiner?._id,partialHandle)
  }

  if(rewriter)
  {
    let rewriteHandle=await ObjectNProcess(REWRITE_PW_CODE);
    await rewriteHandle()
    plugin.event.addListener(AppEvents.RemChanged,combiner?._id,rewriteHandle)
  }
}






async function onDeactivate(_: ReactRNPlugin) {

}

declareIndexPlugin(onActivate, onDeactivate);
