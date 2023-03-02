import { AppEvents, ReactRNPlugin, Rem } from '@remnote/plugin-sdk';
import { useHandlers } from './Handlers';
import { JSObject } from './typeDefs';
import { EventListenerRecorder } from './EventListenerRecorder';
import { MOUNT_PW_CODE, OBJECT_PW_CODE, PARTIAL_PW_CODE, recordedList, SLOT_OBJ_IS } from './consts';

export const useInitializer=(plugin:ReactRNPlugin)=>{

  let handlers=useHandlers(plugin)
  //Attach corresponding handlers to the tagged rems and store these handlers
  const useAutomateObNHandler= (r:Rem|undefined,ObjTagCode:string,recorder:EventListenerRecorder)=>
  {
    const handlerRecorder=new EventListenerRecorder(plugin)
    let handler=handlers[ObjTagCode];
    let AutomateObNHandler=async (event:any)=>{
      let state=await r?.hasPowerup(ObjTagCode)
      if(!state)
      {
        recorder.removeOneListener(r?._id)
      }
      else
      {
        if(ObjTagCode===PARTIAL_PW_CODE||ObjTagCode===MOUNT_PW_CODE)
          handler(r,handlerRecorder);
        else
          handler(r);
      }

    }
    return AutomateObNHandler
  }

  //the process will return a function in closure watching over all the rems tagged with power-up rems from OON
  const getObjectNotingMainProcess= async (ObjPowerUpCode:string)=>{
    let ObjPowerUp=await plugin.powerup.getPowerupByCode(ObjPowerUpCode)
    const recorder=new EventListenerRecorder(plugin);

    //Triggered when Obj PowerUp has been changed(due to some rem has been tag with this),
    //all changes to the rem tagged by the PowerUp whose code is "ObjPowerUpCode" will trigger the event listener
    //the callback of the event listener can auto-terminate themselves after corresponding PowerUp tags were removed
    return async ()=>{
      let remsOONed=await ObjPowerUp?.taggedRem();
      if(remsOONed&&(await remsOONed).length)
      {
        for(let taggedWithOON of remsOONed)
        {

          if(!recorder.findListened(taggedWithOON._id))
          {
            let handle=useAutomateObNHandler(taggedWithOON,ObjPowerUpCode,recorder)
            await recorder.addNewListener(taggedWithOON._id,handle)
            if(ObjPowerUp)
            {
              await taggedWithOON.addPowerup(OBJECT_PW_CODE);
              await taggedWithOON.setPowerupProperty(OBJECT_PW_CODE,SLOT_OBJ_IS,await plugin.richText.rem(ObjPowerUp).value())
            }
          }
          recorder.signInListenerInReason(taggedWithOON._id);
        }
        recorder.removeRedundantListeners();

      }
      recorder.flushListenersInReason();
    }
  }



  const initializePowerUp=async (pwCode:string) => {
    let pwRem=await plugin.powerup.getPowerupByCode(pwCode);
    if(pwRem)
    {
      //find powerUp rem itself and attach event listener to it
      let pwHandle=await getObjectNotingMainProcess(pwCode);
      await pwHandle();
      plugin.event.addListener(AppEvents.RemChanged,pwRem?._id,pwHandle)
    }
  }
  let obj:JSObject={}
  obj.initializePowerUp=initializePowerUp
  return obj
}
