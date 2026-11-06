import type {LionResourceKind} from '../game/core/species.ts';
import {LION_PRICES} from '../game/animals/lions/rules.ts';
import {lionResourceLabel} from './lion-copy.ts';

/** Keep an open native picker intact while unrelated simulation values change. */
export function syncLionFacilitySelect(select:HTMLSelectElement,locale:'en'|'id',label:string,disabled:boolean){
 if(select.getAttribute('aria-label')!==label)select.setAttribute('aria-label',label);
 for(const option of select.options){
  const text=`${lionResourceLabel(option.value as LionResourceKind,locale)} · ${LION_PRICES[option.value as LionResourceKind]} ZC`;
  if(option.textContent!==text)option.textContent=text;
 }
 if(select.disabled!==disabled)select.disabled=disabled;
}
