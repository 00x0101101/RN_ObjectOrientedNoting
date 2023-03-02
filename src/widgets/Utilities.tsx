import { ReactRNPlugin, Rem, RemId } from '@remnote/plugin-sdk';

import { JSObject } from './typeDefs';
import { OBJECT_PW_CODE, POINTER_PW_CODE, pwList, SLOT_OBJ_IS } from './consts';


export const useUtil = (plugin:ReactRNPlugin) => {
  const clearOONOf=async (hostRem:Rem|undefined,pwCodeArr:string[]|undefined|null)=>{
    await hostRem?.setPowerupProperty(OBJECT_PW_CODE,SLOT_OBJ_IS,[])
    await hostRem?.removePowerup(OBJECT_PW_CODE);
    for (let pwCode of pwCodeArr||pwList)
    {
      let pw2Remove=pwCode;
      if(await hostRem?.hasPowerup(pw2Remove))
      {
        await hostRem?.removePowerup(pw2Remove)

      }
    }
  }



  const mkPointer2This=async (r:Rem|undefined)=>{
    const getRemsWithChildPointing2This=async (r:Rem|undefined)=>{
      const result=new Set<string>()
      const pss = await r?.remsReferencingThis();
      if(pss&&r)
      for(const ps of pss)
      {
        if(await ps.hasPowerup(POINTER_PW_CODE)&&ps.parent)
        {
          result.add(ps.parent)
        }
      }
      return result
    }

    const pointersFrom=await r?.remsBeingReferenced();
    if(pointersFrom&&r)//todo: remove duplicated code
    {
      const excludes=await getRemsWithChildPointing2This(r)
      for(const ptrF of pointersFrom)
      {
        if(excludes.has(ptrF._id))continue;
        const newRem=await plugin.rem.createRem();
        await newRem?.setText(await plugin.richText.rem(r).value())
        await newRem?.setParent(ptrF)
        newRem?.addPowerup(POINTER_PW_CODE);
      }
    }
  }

  const addNewRefRem=async (parentOfRef:Rem|RemId,referenceTowards:Rem)=>{
    let newRem=await plugin.rem.createRem();
    await newRem?.setText(await plugin.richText.rem(referenceTowards).value());
    await newRem?.setParent(parentOfRef);
    return newRem;
  }



  let exportUtils:JSObject={};
  exportUtils.clearOONOf=clearOONOf;
  exportUtils.mkPointer2This=mkPointer2This;
  exportUtils.addNewRefRem=addNewRefRem;
  return exportUtils
}