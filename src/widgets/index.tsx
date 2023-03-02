import {
	declareIndexPlugin,
	ReactRNPlugin,
} from '@remnote/plugin-sdk';
import '../style.css';
import '../App.css';
import { useInitializer } from './Initializer';
import { useUtil } from './Utilities';
import  './consts';
import {
	combinationList,
	EXTEND_PW_CODE,
	inheritList,
	INSTANCE_PW_CODE, MOUNT_PW_CODE, OBJECT_PW_CODE,
	PARTIAL_PW_CODE, PARTIAL_SLOT,
	POINTER_PW_CODE, pwList,
	REWRITE_PW_CODE, SLOT_OBJ_IS,
} from './consts';






// export   //Inspired by a Y combinator ^_^
// const yFork= (x:any)=>
// {
//   return x(x)
// }




async function onActivate(plugin: ReactRNPlugin) {

	const initializer=useInitializer(plugin)
	const cmdUtils=useUtil(plugin)

	const clearOONOf=cmdUtils.clearOONOf;
	const mkPointer2This=cmdUtils.mkPointer2This;


	//register PowerUps
	//region
	await plugin.app.registerPowerup(
		'Object',
		OBJECT_PW_CODE,
		"A set of PowerUps enabling you to take notes like using OOP(Object Orient Programming) language based on the support of RN's native tag-slot system",
		{slots:[
				{code:SLOT_OBJ_IS, name:'This object is', onlyProgrammaticModifying:true,hidden:true },
			]})

	await plugin.app.registerPowerup(
		'~Partial',
		PARTIAL_PW_CODE,
		"To Tag rems where the preserved word 'partial' effects",
		{slots:[]
			}
	);

	await plugin.app.registerPowerup(
		'~Mount',
		MOUNT_PW_CODE,
		"To Tag rems which is to be a 'mount load' on other rems. Making rems this rem referring to having a pointer to this rem.\n" +
		"Another way to implement ~Partial, inspired by `Mount Point` in Linux and `Callback` in C++",
		{slots:[]
		}
	);



	await plugin.app.registerPowerup(
		'~PartialSlot',
		PARTIAL_SLOT,
		"To Tag portals 'partial' function brings",
		{slots:[]
		}
	);

	await plugin.app.registerPowerup('~Pointer',
		POINTER_PW_CODE,
		"To make a reference to Rem to be a 'pointer' rem",
		{slots:[]
		})
	await plugin.app.registerPowerup('~Extending',
		EXTEND_PW_CODE,
		'To tag a rem as a `class extend` ',
		{
			slots: [],
		});

	await plugin.app.registerPowerup('~Instance',
		INSTANCE_PW_CODE,
		"To tag a rem as a `instance` ",
		{slots:[]
		})
	
	await plugin.app.registerPowerup('~Rewrite',
		REWRITE_PW_CODE,
		"To Tag rems where the preserved word 'override' effects. (Implementation of polymorphism, enable derived rems)",
		{slots:[]
		})
		//endregion
	
	//register commands
	//region
	// A command that clear all the OON powerUp tags
	await plugin.app.registerCommand({
		id: 'startOON',
		name: 'Clear OON tags',
		quickCode:'oon',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			await clearOONOf(hostRem,null);
		},
	});



	await plugin.app.registerCommand({
		id: 'AsInstance',
		name: 'Turn to a instance',
		quickCode:'OIns',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			await clearOONOf(hostRem,inheritList);
			hostRem?.addPowerup(INSTANCE_PW_CODE);
			
		},
	});

	await plugin.app.registerCommand({
		id: 'AsExtension',
		name: "Tag a extend class",
		quickCode:'OExt',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			await clearOONOf(hostRem,inheritList);
			hostRem?.addPowerup(EXTEND_PW_CODE);
		},
	});

	await plugin.app.registerCommand({
		id: 'AsPointer',
		name: "Tag a pointer rem",
		quickCode:'OPtr',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			hostRem?.addPowerup(POINTER_PW_CODE);

		},
	});

	await plugin.app.registerCommand({
		id: 'AsPartial',
		name: "Tag with '~Partial' ",
		description:"Tag a rem as a 'partial' rem, like a 'partial class' in C#",
		quickCode:'OPrl',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			await clearOONOf(hostRem,combinationList);
			hostRem?.addPowerup(PARTIAL_PW_CODE);

		},
	});

	await plugin.app.registerCommand({
		id: 'AsRewriter',
		name: "Tag with '~Rewrite'",
		description:"Tag a rem as a 'rewrite' rem, like a '@override class' in JAVA(Implementation of polymorphism)",
		quickCode:'ORwt',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			hostRem?.addPowerup(PARTIAL_PW_CODE);

		},
	});

	await plugin.app.registerCommand({
		id: 'AsMount',
		name: "Tag with '~Mount'",
		description:"Making rems this rem referring to having a pointer to this rem.\nAnother way to implement ~Partial, inspired by `Mount Point` in Linux and `Callback` in C++",
		quickCode:'OMnt',
		action: async () => {
			let hostRem=await plugin.focus.getFocusedRem();
			await clearOONOf(hostRem,combinationList);
			hostRem?.addPowerup(MOUNT_PW_CODE);

		},
	});


	//endregion


for(const pwCode of pwList)
{
	await initializer.initializePowerUp(pwCode);
}
	
}






async function onDeactivate(_: ReactRNPlugin) {

}

declareIndexPlugin(onActivate, onDeactivate);
