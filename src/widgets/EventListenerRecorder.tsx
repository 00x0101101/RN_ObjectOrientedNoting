export const updateELRecord = (recordBook:{prev:Map<any, any>,current:Set<any>},callback:(key:string,val:any)=>void) => {
  recordBook.prev.forEach((value, key)=>{
    if(!recordBook.current.has(key))
    {
      callback(key,value);
      recordBook.prev.delete(key);

    }

  })
}