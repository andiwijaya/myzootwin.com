import type {EntryLocale} from './locale.ts';
import {zooUiCopy} from './zoo-ui-copy.ts';

/** Native select/plan handlers remain the only command path. Catalog cards choose an option. */
export function mountFacilityCatalog(parent:HTMLElement,select:HTMLSelectElement,plan:HTMLButtonElement,preview:HTMLElement[],signal:AbortSignal){
  const section=document.createElement('section'),title=document.createElement('h4'),cards=document.createElement('div'),feedback=document.createElement('p');
  section.className='zoo-builder-catalog';cards.className='zoo-catalog-cards';feedback.setAttribute('role','status');
  section.append(title,cards,select,plan,...preview,feedback);parent.append(section);select.hidden=true;plan.hidden=true;
  const buttons=new Map<string,HTMLButtonElement>();
  for(const option of select.options){const button=document.createElement('button');button.type='button';button.dataset.facilityKind=option.value;button.addEventListener('click',event=>{if(event.detail>1||button.disabled)return;select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));plan.click();},{signal});cards.append(button);buttons.set(option.value,button);}
  return {section,update(locale:EntryLocale,hidden:boolean,unavailable:(kind:string)=>boolean,message:string){section.hidden=hidden;title.textContent=zooUiCopy[locale].catalog;feedback.textContent=message;feedback.hidden=!message;for(const option of select.options){const b=buttons.get(option.value)!;b.textContent=option.textContent;b.disabled=plan.disabled||select.disabled||option.disabled||unavailable(option.value);}}};
}
