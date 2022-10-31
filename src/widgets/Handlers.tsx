import {
	EXTEND_PW_CODE,
	INSTANCE_PW_CODE,

	PARTIAL_PW_CODE,
	PARTIAL_SLOT, POINTER_PW_CODE,
} from './index';
import {
	ReactRNPlugin, RemType, RichTextInterface,
} from '@remnote/plugin-sdk';

import { AppEvents, Rem } from '@remnote/plugin-sdk';
import { updateELRecord } from './EventListenerRecorder';

const USE_REF="REF"
const USE_PORTAL="PORTAL"
let refOrPortal=USE_REF
export interface JSObject {
	[key: string]: any
}

// export const partialOption="toggle partial"
// export const pointerOption="toggle pointer"
// export const instanceOption="toggle instance"
// export const extendingOption="toggle extending"

//  const options=[partialOption,pointerOption,instanceOption,extendingOption]
//  const optionsDict:JSObject={}
//  optionsDict[partialOption]=PARTIAL_PW_CODE;
//  optionsDict[pointerOption]=POINTER_PW_CODE;
//  optionsDict[instanceOption]=INSTANCE_PW_CODE;
//  optionsDict[extendingOption]=EXTEND_PW_CODE;



export const useHandlers=(plugin:ReactRNPlugin)=>{
	async function addPortal2 (parentRem:Rem,portalContent:Rem[]){
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
		async function AutomateSlotPointer(){
			if((!(await isValidPartialPointer(RefOfSlot)))&&(!(await isValidPointerRem(RefOfSlot))))
			{
				plugin.event.removeListener(AppEvents.RemChanged,RefOfSlot._id,AutomateSlotPointer)
				return;
			}
			await usePointerBatchFor(RefOfSlot);
		}
		return AutomateSlotPointer
	}

	const addAutomateSlotLoader= (hostRem:string|Rem|undefined,slotPortal:Rem|undefined)=>{

		// plugin.app.toast("SlotLoader Ready!");
		async function automateDetector()
		{
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
				plugin.event.removeListener(AppEvents.RemChanged,hostRem._id,automateDetector)
			}
			else if(hostRem)
			{
				for(let instanceRem of await hostRem.taggedRem())
				{
					await addSlotsFromPartialPortal(instanceRem,slotPortal);

				}
			}
		}
		return automateDetector;
	}



	const isValidPartialPointer=async (pointer:Rem)=>{
		let p=(await pointer.remsBeingReferenced())[0];
		if(!p)return false;
		let projectRem=await p.getParentRem();
		return (await projectRem?.hasPowerup(PARTIAL_PW_CODE));
	}

	const isValidPointerRem=async (pointer:Rem)=>{
		return await pointer.hasPowerup(POINTER_PW_CODE);
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

	const usePointerBatchFor=async (remAsPointer:Rem)=>
	{
		let pointTo=(await remAsPointer.remsBeingReferenced())[0];
		let pointFrom=await remAsPointer.remsReferencingThis();
		pointFrom.forEach((p)=>{
			usePointer(remAsPointer,p,pointTo)
		})
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

	//Work as a lock to prevent dirty write to the database
	const remsReferencedAlready=new Set();

	let partialHandle=async (remPartial:any,PartialHandlerRecord:{prev:Map<any, any>,current:Set<any>})=>{
		let targets=await getInherited(remPartial);
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
				let children=await remPartial?.getChildrenRem();
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
					await handle();
					PartialHandlerRecord.prev.set(targetId, handle)
					plugin.event.addListener(AppEvents.RemChanged, target._id, handle)
				}
			}
			updateELRecord(PartialHandlerRecord,(remId:string,handle:any)=>plugin.event.removeListener(AppEvents.RemChanged,remId,handle))
			
		}
		else if(refOrPortal===USE_REF)
		{
			for([targetId,target] of targets.entries())
			{
				let childrenRemPartial=await remPartial?.getChildrenRem();
				if(childrenRemPartial&&(await childrenRemPartial).length&&target)
					for(let child of childrenRemPartial)
					{
						let newRem=undefined;
						// let needs2unlock=false;
						for(let rr of await child.remsReferencingThis())
						{
							if(rr.parent===target?._id)
							{
								newRem=rr;
								PartialHandlerRecord.current.add(newRem?._id);
								// New rem has been written to database correctly, clear the lock!
								remsReferencedAlready.delete(child._id+targetId);
							}
						}
						if(!await child.isSlot())continue

						if(!newRem&&!remsReferencedAlready.has(child._id+targetId))
						{
							//add the lock when new rem beginning to create
							console.log(child.text+":"+child._id+">>"+targetId+":"+target?.text);
							remsReferencedAlready.add(child._id+targetId);
							PartialHandlerRecord.current.add(newRem?._id);
							newRem=await plugin.rem.createRem();
							await newRem?.setText(await plugin.richText.rem(child).value());
							await newRem?.setParent(target);
							await newRem?.setIsSlot(true);

						}

						if(newRem&&!PartialHandlerRecord.prev.has(newRem?._id))
						{
							let handle=addAutomateSlotPointer(newRem)
							await handle();
							PartialHandlerRecord.prev.set(newRem._id,handle);
							plugin.event.addListener(AppEvents.RemChanged,newRem._id,handle)
						}
						PartialHandlerRecord.current.add(newRem?._id);
					}
				updateELRecord(PartialHandlerRecord,(remId:string,handle:any)=>plugin.event.removeListener(AppEvents.RemChanged,remId,handle));
				
			}
		}

		PartialHandlerRecord.current= new Set();
	}
	const pointerHandle=async (remAsPointer:any,pointerHandlerRecord:{prev:Map<any, any>,current:Set<any>})=>{
		await usePointerBatchFor(remAsPointer);

	}


	const instanceHandle = () => {

	}


	const extendingHandle = () => {

	}

	let obj:JSObject={
		// TS engine would be confused by the key:  plaintext or a variable name?
		// U want it to be a variable name, but TS engine regards it as plaintext like obj["POINTER_PW_CODE"]
		// PARTIAL_PW_CODE:partialHandle,
		// POINTER_PW_CODE:pointerHandle
	}
	obj[PARTIAL_PW_CODE]=partialHandle;
	obj[POINTER_PW_CODE]=pointerHandle;
	obj[INSTANCE_PW_CODE]=instanceHandle;
	obj[EXTEND_PW_CODE]=extendingHandle;
	return obj
}

