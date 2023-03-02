import {
	ReactRNPlugin, RemType, RichTextInterface,
} from '@remnote/plugin-sdk';
import { useUtil } from './Utilities';
import { AppEvents, Rem } from '@remnote/plugin-sdk';
import { EventListenerRecorder } from './EventListenerRecorder';
import {JSObject} from './typeDefs';
import {
	EXTEND_PW_CODE,
	INSTANCE_PW_CODE, MOUNT_PW_CODE,
	PARTIAL_PW_CODE,
	PARTIAL_SLOT,
	POINTER_PW_CODE,
	REWRITE_PW_CODE,
} from './consts';
import { RemCreateSynchronizer } from './RemCreateSynchronizer';

const USE_REF="REF"
const USE_PORTAL="PORTAL"
let refOrPortal=USE_REF


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
	const utils=useUtil(plugin);



	/*utilities functions for `##~Pointer`*/
	//region
	async function usePointer(pointer:Rem,pointFrom:Rem,pointTo:Rem){
		await pointFrom.setText(await replaceTextObj(pointFrom.text));
		if(pointFrom.backText)
			await pointFrom.setBackText(await replaceTextObj(pointFrom.backText))
		async function replaceTextObj(textObj:RichTextInterface)
		{
			return await plugin.richText.replaceAllRichText(textObj,await plugin.richText.rem(pointer).value(),await plugin.richText.rem(pointTo).value())
		}
	}
	const usePointerBatchFor=async (remAsPointer:Rem)=>{
		let pointTo=(await remAsPointer.remsBeingReferenced())[0];
		let pointFrom=await remAsPointer.remsReferencingThis();
		pointFrom.forEach((p)=>{
			usePointer(remAsPointer,p,pointTo)
		})
	}

	const isValidPointerRem=async (pointer:Rem)=>{
		return await pointer.hasPowerup(POINTER_PW_CODE);
	}
	//endregion

	//Work as a lock to prevent dirty write to the database
	const tuner=new RemCreateSynchronizer();

	//Handlers
	//region
	const partialHandle=async (remPartial:any,partialRecorder:EventListenerRecorder)=>{

		/*utilities functions for `##~Partial`*/
		//region
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
					partialRecorder.removeOneListener(RefOfSlot._id)
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
					partialRecorder.removeOneListener(hostRem._id)
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
		const addSlotsFromPartialPortal=async (hostRem:Rem|undefined,slotPortal:Rem|undefined)=>  {
			let slots=await slotPortal?.getPortalDirectlyIncludedRem();
			if(slots)
				slots=await plugin.rem.findMany(slots.map(slot=>slot._id));

			if(hostRem&&slots)
				await Promise.all(slots?.map(async (slot)=>{
					if((await slot.hasPowerup(PARTIAL_PW_CODE)))return;
					await utils.addNewRefRem(hostRem,slot)
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
		//endregion

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

				partialRecorder.signInListenerInReason(targetId);
				if(!partialRecorder.findListened(targetId)) {
					let handle = await addAutomateSlotLoader(target, slotPortal)
					await partialRecorder.addNewListener(targetId,handle);
				}
			}
			partialRecorder.removeRedundantListeners()
			
		}
		else 
		if(refOrPortal===USE_REF)
		{
			for([targetId,target] of targets.entries())
			{
				let childrenRemPartial=await remPartial?.getChildrenRem();
				if(childrenRemPartial&&(await childrenRemPartial).length&&target)
					for(let child of childrenRemPartial)
					{
						const semaphoreId='partial_'+child._id+targetId
						let newRem=undefined;
						for(let rr of await child.remsReferencingThis())
						{
							//for rems whose slot pointer has already created.
							if((await rr.getParentRem())._id===target?._id)
							{
								newRem=rr;
								if(newRem._id)
								partialRecorder.signInListenerInReason(newRem._id)
								// New rem has been written to database correctly, clear the lock!
								tuner.removeLock(semaphoreId);
							}
						}
						//To avoid conflict with `~Rewrite`
						if(!await child.isSlot()||await child.hasPowerup(REWRITE_PW_CODE))continue;

						//for rems whose slot pointer hasn't created yet
						if(!newRem&&!tuner.ifLocked(semaphoreId))
						{
							//add the lock when new rem beginning to create
							console.log(child.text+":"+child._id+">>"+targetId+":"+target?.text);
							tuner.createLock(semaphoreId);
							partialRecorder.signInListenerInReason(newRem?._id);
							newRem=await utils.addNewRefRem(target,child);
							await newRem?.setIsSlot(true);
						}
						if(newRem&&!partialRecorder.findListened(newRem?._id))
						{
							let handle=addAutomateSlotPointer(newRem)
							await partialRecorder.addNewListener(newRem._id,handle)
						}
						partialRecorder.signInListenerInReason(newRem?._id)
					}
				partialRecorder.removeRedundantListeners();

			}
		}
		partialRecorder.flushListenersInReason();
	}

	const pointerHandle=async (remAsPointer:any)=>{
		await usePointerBatchFor(remAsPointer);

	}

	const instanceHandle = () => {

	}

	const extendingHandle = () => {

	}

	//the rewriter rem is a child rem, one of whose ancestors has a "##prototype" and the rewriter rem has referred to one of the "prototype's" descendants
	const rewritingHandle= async (rewriterRem:Rem) =>{

		let rewrittenRemsCandidates=await rewriterRem.remsBeingReferenced();
		for(let r of rewrittenRemsCandidates)
		{
			let pq=await findInherit(rewriterRem,r);
			if(pq)
			{
				let rewrittenHandler=((k:Rem,rerOwner:Rem,clanTreeDepth:number)=>{
					let clanTreeIndex=clanTreeDepth+1;
					return async ()=>{
						if(!await rewriterRem.hasPowerup(REWRITE_PW_CODE))
						{
							plugin.event.removeListener(AppEvents.RemChanged,k._id,rewrittenHandler);
							return;
						}
						let candidates=await k.remsReferencingThis()
						for(let candidate of candidates)
						{
							//Candidates themselves cannot be rewriter rems or dead loops will occur.
							if(!await candidate.hasPowerup(REWRITE_PW_CODE))
							{
								let parent=await candidate.getParentRem();
								while(clanTreeIndex>0&&parent)
								{
									for(const tag of await parent.getTagRems())
									{
										if(tag._id===rerOwner._id)
										{
											await usePointer(k,candidate,rewriterRem);
										}
									}
									parent=await parent.getParentRem();
									clanTreeIndex--;
								}
							}
							clanTreeIndex=clanTreeDepth;
						}
						
					}
				})(r,pq[0],pq[2]);
				plugin.event.addListener(AppEvents.RemChanged,r._id,rewrittenHandler);
				
			}
			
		}
		


		
		
		async function findInherit(rewriter:Rem,rewritten:Rem):Promise<[Rem,Rem,number]|null>
		{
			let p:Rem|undefined=rewriter;
			let q:Rem|undefined=rewritten;
			let protectorLock=256;
			let i=0;
			let chainIsIntact=true;
			while(p&&q&&i<=protectorLock&&chainIsIntact)
			{
				let classTags=await p.getTagRems();
				for(let t of classTags)
				{
					if(t._id===q._id)
					return [p,q,i+1];
				}
				let ss=await p.remsBeingReferenced();
				
				let flag=false;
				for(let s of ss)
				{
					if(s._id===q._id)
					{
						flag=true;
						break;
					}
				}
				chainIsIntact=flag;
				p=await p.getParentRem();
				q=await q.getParentRem();
				i++;
			}
			if(i>protectorLock)
			{
				console.error("Oops,Is there a parentship loop?")
			}
			return null;
		}

	}

	const mountHandle=async (mountLoad:Rem,mountPointRecorder:EventListenerRecorder)=>{
		const mountCreateSemaphoreId=(rId:string|null|undefined)=>{

			return `mount_${rId}_${mountLoad._id}`
		}



		const getRemsToSettleMountPoint=async ()=>{
			return mountLoad?.remsBeingReferenced();
		}
		const getMountHostsStillBeAssigned=async ()=>{
			if(!await mountLoad.hasPowerup(MOUNT_PW_CODE))return null;
			const currentMPHosts=await getRemsToSettleMountPoint();
			if(!currentMPHosts)return null;
			return new Map(currentMPHosts.map(r=>[r._id,r]));
		}

		//MP stands for "mount point"
		const whetherMPStillAssignedToHost=async (mountHostId:string)=>{
			const map=await getMountHostsStillBeAssigned();
			return map&&map.has(mountHostId);
		}


		const addMountPoint=async (mountedHost:Rem)=>{
			return await utils.addNewRefRem(mountedHost,mountLoad);
		}

		//Add listeners to existing mount points
		//region
		const map4MountedHosts=mountPointRecorder.RemsHaveBeenListenedTo();

		const candidates2AddListener=new Map((await mountLoad.remsReferencingThis()).map(r=>[r._id,r]));
		const mapCurrentMP=await getMountHostsStillBeAssigned();
		const useMountingRemHandler=async (mountPoint:Rem,mLoad:Rem)=>{
			return async ()=>{
				if(!mountPoint||!(await mountPoint.getParentRem())?._id)
				{
					mountPointRecorder.removeOneListener(mountPoint._id);
					return;
				}
				const mountL=(await mountPoint.remsBeingReferenced())[0]
				const pp=(await mountPoint.getParentRem())?._id
				if(pp)
				tuner.removeLock(mountCreateSemaphoreId(pp));
				if(pp&&!await whetherMPStillAssignedToHost(pp)||!mountL||mountL._id!==mLoad._id)
				{
					mountPointRecorder.removeOneListener(mountPoint._id);
				}
				else
				{
					await usePointerBatchFor(mountPoint);
				}
			}
		}
		if(mapCurrentMP)
		{

			console.log('mapCurrentMP:',mapCurrentMP)
			console.log('candidates2Listen:',candidates2AddListener)
			for(const [rId,candidate] of candidates2AddListener.entries())
			{
				let cp=(await candidate.getParentRem())?._id

				const semaphoreId=mountCreateSemaphoreId(cp)
				//for mount points that have been existing
				if(cp&&mapCurrentMP.has(cp))
				{
					//and haven't added listeners yet
					if(!mountPointRecorder.findListened(candidate._id))
						await mountPointRecorder.addNewListener(candidate._id,await useMountingRemHandler(candidate,mountLoad))
					mountPointRecorder.signInListenerInReason(candidate._id)

					mapCurrentMP.delete(cp)
				}
				tuner.removeLock(semaphoreId);

			}


			//Add mount points to mount hosts in need
			for(const [rId,hostRem] of mapCurrentMP)
			{

				const semaphoreId=mountCreateSemaphoreId(hostRem._id);
				if(!candidates2AddListener.size)
				{
					tuner.removeLock(semaphoreId);
				}
				if(!tuner.ifLocked(semaphoreId))
				{
							tuner.createLock(semaphoreId)
							const mountPoint=await addMountPoint(hostRem);
							const mountingRemHandler=await useMountingRemHandler(mountPoint,mountLoad)
							await mountPointRecorder.addNewListener(mountPoint._id,mountingRemHandler)
							// await mountPoint.setIsSlot(true);
				}
			}
		}

		//endregion


	}
	//endregion


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
	obj[REWRITE_PW_CODE]=rewritingHandle;
	obj[MOUNT_PW_CODE]=mountHandle;
	return obj
}

