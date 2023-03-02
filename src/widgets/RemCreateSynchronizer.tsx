export class RemCreateSynchronizer {
  redSemaphores=new Set<string>()

  createLock(semaphoreId:string)
  {
     this.redSemaphores.add(semaphoreId);
  }

  ifLocked(semaphoreId:string)
  {
    return this.redSemaphores.has(semaphoreId)
  }

  removeLock(semaphoreId:string)
  {
    this.redSemaphores.delete(semaphoreId)
  }
}