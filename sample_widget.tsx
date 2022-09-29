import {
  renderWidget,
  RemRichTextEditor,
} from '@remnote/plugin-sdk';
import React from 'react';

export const SampleWidget = () => {

  // let name = useTracker(() => plugin.settings.getSetting<string>('name'));
  // let likesPizza = useTracker(() => plugin.settings.getSetting<boolean>('pizza'));
  // let favoriteNumber = useTracker(() => plugin.settings.getSetting<number>('favorite-number'));

  return (
    <div>
      {/*<div className="p-2 m-2 rounded-lg rn-clr-background-light-positive rn-clr-content-positive">*/}
      {/*  <h1 className="text-xl">Sample Plugin</h1>*/}
      {/*  <div>*/}
      {/*    Hi {name}, you {!!likesPizza ? 'do' : "don't"} like pizza and your favorite number is{' '}*/}
      {/*    {favoriteNumber}!*/}
      {/*  </div>*/}
      {/*</div>*/}
      <RemRichTextEditor readOnly={false} remId='PMRDZB50sLPC9boHy' width='50%' height={50}/>
      <div data-search-result="search-result-item" id="search-results__result" className="cursor-pointer rounded">

      </div>
    </div>

  );
};




renderWidget(SampleWidget);
