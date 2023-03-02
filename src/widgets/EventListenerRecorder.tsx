import { AppEvents, EventCallbackFn, ReactRNPlugin } from '@remnote/plugin-sdk';
import _ from "lodash"




export class EventListenerRecorder{
	recordBook={
		RemsListenedTo:new Map<any,any>(),
		//Rems deserving to be listened, whether the rems have been listened in reality or not.
		RemsShouldListenTo:new Set<any>()
	}
	plugin:ReactRNPlugin|null=null;

	constructor(plugin:ReactRNPlugin) {
		this.plugin=plugin
	}
	//return a copy of `this.recordBook.RemsShouldListenTo`
	RemsShouldBeListenedTo(){
		return _.clone(this.recordBook.RemsShouldListenTo)
	}

	//return a copy of `this.recordBook.RemsListenedTo`
	RemsHaveBeenListenedTo(){
		return _.clone(this.recordBook.RemsListenedTo);
	}

	findListened(RemId:string)
	{
		return this.recordBook.RemsListenedTo.get(RemId);
	}

	async addNewListener(remId:string,handler:EventCallbackFn)
	{
		await handler(null);
		this.plugin?.event.addListener(AppEvents.RemChanged,remId,handler);
		this.recordBook.RemsListenedTo.set(remId,handler);
		this.signInListenerInReason(remId);
	}

	signInListenerInReason(remId:string)
	{
		this.recordBook.RemsShouldListenTo.add(remId)
	}

	removeRedundantListeners(){
		this.recordBook.RemsListenedTo.forEach((r,i,map)=>{
			if(!this.recordBook.RemsShouldListenTo.has(i))
			{
				this.plugin?.event.removeListener(AppEvents.RemChanged,i,r)
				map.delete(i);
			}
		})
	}

	removeOneListener(remId:string|undefined)
	{
		const handler=this.recordBook.RemsListenedTo.get(remId);
		if(handler)
		this.plugin?.event.removeListener(AppEvents.RemChanged,remId,handler)
		this.recordBook.RemsListenedTo.delete(remId);
		this.recordBook.RemsShouldListenTo.delete(remId);
	}

	flushListenersInReason(){
		this.recordBook.RemsShouldListenTo=new Set<any>();
	}

}