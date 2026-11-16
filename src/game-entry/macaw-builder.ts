import {entryMessages,type EntryLocale} from './locale.ts';
import {zooUiCopy} from './zoo-ui-copy.ts';

export function mountMacawBuilder(root:HTMLElement,signal:AbortSignal){
  const section=document.createElement('section'),title=document.createElement('h3'),gate=document.createElement('fieldset');
  section.dataset.macawBuilding='';section.className='macaw-tools zoo-builder-catalog';gate.dataset.hudControls='';gate.className='hud-control-gate';section.append(title,gate);
  root.querySelector('[data-hud-pane="build"]')?.append(section);
  const headings:{node:HTMLElement;key:'foodTitle'|'waterTitle'|'perchTitle';card:HTMLElement;note:HTMLElement}[]=[];
  for(const kind of ['food','water','perch']as const){
    const card=document.createElement('div'),heading=document.createElement('h4'),note=document.createElement('small');card.className='zoo-resource-card';card.dataset.macawFacility=kind;card.append(heading);headings.push({node:heading,key:(kind+'Title')as 'foodTitle'|'waterTitle'|'perchTitle',card,note});
    for(const node of root.querySelectorAll(`[data-${kind}-command="preview"],[data-${kind}-preview]`))card.append(node);
    card.append(note);gate.append(card);
  }
  signal.addEventListener('abort',()=>section.remove(),{once:true});
  return {show(ready:boolean,locale:EntryLocale){section.hidden=!ready;title.textContent=zooUiCopy[locale].catalog;for(const {node,key,card,note}of headings){node.textContent=entryMessages[locale][key];note.textContent=locale==='id'?'Sudah tersedia · kelola di Rawat':'Already built · manage in Care';note.hidden=Boolean(card.querySelector('button:not([hidden]),[data-food-preview]:not([hidden]),[data-water-preview]:not([hidden]),[data-perch-preview]:not([hidden])'));}}};
}
