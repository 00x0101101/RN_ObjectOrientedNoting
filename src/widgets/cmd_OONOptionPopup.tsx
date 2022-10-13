import {
  AppEvents,
  Rem,
  renderWidget,
  // RichTextInterface,
  useAPIEventListener,
  usePlugin,
  useRunAsync,
  useTracker,
  WidgetLocation,
} from "@remnote/plugin-sdk";
import clsx from "clsx";
import * as R from "react";
// import { sortBy, } from "remeda";
import {
  insertSelectedKeyId, partialOption, pointerOption,
  selectNextKeyId,
  selectPrevKeyId,
} from '../lib/constants';
import { useSyncWidgetPositionWithCaret } from "../lib/hooks";
import { JSObject } from './Handlers';
import { PARTIAL_PW_CODE, POINTER_PW_CODE } from './index';

// interface UniversalSlot {
//   _id: string;
//   aliasId: string;
//   text: string;
//   matchText: string;
// }


const options=[partialOption,pointerOption]
const optionsDict:JSObject={}
optionsDict[partialOption]=PARTIAL_PW_CODE;
optionsDict[pointerOption]=POINTER_PW_CODE;



function CmdOONOptionPopup(){
  const plugin = usePlugin();

  /***
  const ctx = useRunAsync(
    async () => await plugin.widget.getWidgetContext<WidgetLocation.FloatingWidget>(),
    []
  );
   ***/


  // console.error("fuck!");
  // async function getUniversalSlotsForRem(rem: Rem): Promise<UniversalSlot[]> {
  //   return await Promise.all(
  //     [rem, ...(await rem.getAliases())].map(async (r: Rem) => ({
  //       _id: rem._id,
  //       aliasId: r._id,
  //       matchText: (await plugin.richText.toString(r.text)).trim(),
  //       text: `${await plugin.richText.toString(rem.text)} ${await aliasText(
  //         rem,
  //         r
  //       )}`,
  //     }))
  //   );
  // }

  // async function aliasText(rem: Rem, r: Rem) {
  //   return rem._id == r._id
  //     ? ""
  //     : ` (${await plugin.richText.toString(r.text)})`;
  // }

  // const universalSlots: UniversalSlot[] =
  //   useTracker(async (r) => {
  //     const tilde = await r.rem.findByName(["~"], null);
  //     const universalSlotChildren = (await tilde?.getChildrenRem()) || [];
  //
  //     return sortBy(
  //       (await Promise.all(universalSlotChildren.map(getUniversalSlotsForRem)))
  //         .flat()
  //         .filter((e) => e.matchText.length > 0 && e.text.length > 0),
  //       (q:any) => q.matchText.length
  //     );
  //   }, []) || [];

  // The last partial word is the current part of a word before the
  // caret that the user has not yet finished typing. We use the
  // lastPartialWord to filter down the autocomplete suggestions to
  // show in the popup window.

  // const [lastPartialWord, setLastPartialWord] = R.useState<string>();

  // const matches: UniversalSlot[] = lastPartialWord?.startsWith("~")
  //   ? // _.sortBy(
  //     universalSlots.filter((u) =>
  //       u.matchText
  //         .replaceAll("~", "")
  //         .toLowerCase()
  //         .startsWith(lastPartialWord.toLowerCase().substring(1))
  //     )
  //   : [];




  // const hidden = matches.length == 0;

  /****
  const floatingWidgetId = ctx?.floatingWidgetId;
   ****/

  // useSyncWidgetPositionWithCaret(floatingWidgetId, false);




  // Reactively get hotkey strings - if the user updates these in
  // the settings this component will re-render with the latest
  // values without requiring the user to refresh / reload.
    /***
  const selectNextKey = useTracker(
    async (reactivePlugin) =>
      await reactivePlugin.settings.getSetting(selectNextKeyId)
  ) as string;
  const selectPrevKey = useTracker(
    async (reactivePlugin) =>
      await reactivePlugin.settings.getSetting(selectPrevKeyId)
  ) as string;
  const insertSelectedKey = useTracker(
    async (reactivePlugin) =>
      await reactivePlugin.settings.getSetting(insertSelectedKeyId)
  ) as string;
 ***/

  // Steal autocomplete navigation and insertion keys from the editor
  // while the floating autocomplete window is open.

  // if (floatingWidgetId)
  // {
  //   const keys = [selectNextKey, selectPrevKey, insertSelectedKey];
  //   plugin.window.stealKeys(floatingWidgetId, keys);
  // }

  //
  // R.useEffect(() => {
  //   const keys = [selectNextKey, selectPrevKey, insertSelectedKey];
  //   if (!floatingWidgetId) {
  //     return;
  //   }
  //   if (!hidden) {
  //     plugin.window.stealKeys(floatingWidgetId, keys);
  //   } else {
  //     plugin.window.releaseKeys(floatingWidgetId, keys);
  //   }
  // }, [hidden]);



  //todo
  /******
  useAPIEventListener(AppEvents.StealKeyEvent, floatingWidgetId, ({ key }) => {
    if (key === selectNextKey) {
      selectAdjacentWord("down");
    } else if (key === selectPrevKey) {
      selectAdjacentWord("up");
    } else if (key === insertSelectedKey) {
      selectByKey();
    }
  });
  ******/


  // function selectAdjacentWord(direction: "up" | "down") {
  //   const newIdx = selectedIdx + (direction === "up" ? -1 : 1);
  //   if (newIdx >= 0 && newIdx < options.length) {
  //     setSelectedIdx(newIdx);
  //   }
  // }
  //
  //
  async function applyOption(optionName:string){
    let hostRem=useTracker(async (plugin)=>{return await plugin.focus.getFocusedRem();})
    let pwCode2Toggle=optionsDict[optionName];
    //remove old OON tags
    for(let op of options)
    {
      let pw2Remove=optionsDict[op];
      if(pw2Remove===pwCode2Toggle)continue;
      if(await hostRem?.hasPowerup(pw2Remove))
      {
        await hostRem?.removePowerup(pw2Remove)
      }
    }

    let p=await hostRem?.hasPowerup(pwCode2Toggle)
    if(!p)
    {
      await hostRem?.addPowerup(pwCode2Toggle)
    }
    else
    {
      await hostRem?.removePowerup(pwCode2Toggle)
    }
    // if(floatingWidgetId)
    // await plugin.window.closeFloatingWidget(floatingWidgetId)

  }
  //
  // async function selectByKey() {
  //   applyOption(options[selectedIdx]);
  // }




  const [selectedIdx, setSelectedIdx] = R.useState(0);



  return (
    <div className={clsx("p-[3px] rounded-lg")}>
      <div
        className={clsx(
          "flex flex-col content-start gap-[0.5] w-full box-border p-2",
          "rounded-lg rn-clr-background-primary rn-clr-content-primary shadow-md border border-gray-100"
        )}
      >
        {/*{options.map((optionName, idx) => (*/}
        {/*  <div*/}
        {/*    key={optionsDict[optionName]}*/}
        {/*    className={clsx(*/}
        {/*      "rounded-md p-2 truncate",*/}
        {/*      idx === selectedIdx && "rn-clr-background--hovered"*/}
        {/*    )}*/}
        {/*    // onMouseEnter={() => setSelectedIdx(idx)}*/}
        {/*    // onClick={() => applyOption(optionName)}*/}
        {/*  >*/}
        {/*    {optionName}*/}
        {/*  </div>*/}
        {/*))}*/}
      </div>
    </div>
  );


}



// renderWidget(CmdOONOptionPopup);
