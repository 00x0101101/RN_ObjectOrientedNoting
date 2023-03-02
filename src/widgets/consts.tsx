export const REWRITE_PW_CODE:string="Override"
export const PARTIAL_PW_CODE:string="Partial"
export const POINTER_PW_CODE:string="Pointer"
export const INSTANCE_PW_CODE:string="Instance"
export const EXTEND_PW_CODE:string="Extending"
export const MOUNT_PW_CODE:string="Mount"
export const OBJECT_PW_CODE:string="O_O_N_"
export const SLOT_OBJ_IS = "ObjIs"


export const PARTIAL_SLOT=OBJECT_PW_CODE+"slot"


export const pwList=[PARTIAL_PW_CODE,POINTER_PW_CODE,INSTANCE_PW_CODE,EXTEND_PW_CODE,REWRITE_PW_CODE,MOUNT_PW_CODE]
//the state of inheritance, an instance or an extension of source Rem?
export const inheritList=[INSTANCE_PW_CODE,EXTEND_PW_CODE]
export const recordedList=[PARTIAL_PW_CODE,MOUNT_PW_CODE]
export const combinationList=[PARTIAL_PW_CODE,MOUNT_PW_CODE]