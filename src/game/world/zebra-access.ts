import type {RuntimeState} from '../core/runtime-state.ts';
import {missingConnection} from '../economy/elephant-recovery.ts';
import {PRICES} from '../economy/prices.ts';
import {analyzePaths} from './paths.ts';
import {visitTargetForState} from '../visitors/graph.ts';
/** Read-only reuse of the real outside-path topology and paid route proposal. No auto-build. */
export function zebraAccessView(s:RuntimeState){
 const h=s.world.habitats.find(h=>h.kind==='zebra-grasslands'),access=h?analyzePaths(s.world).habitats.find(a=>a.habitatId===h.id):null,connected=access?.connected===true;
 return{exists:Boolean(h),habitatId:h?.id??null,connected,populated:Boolean(h&&s.animals.some(a=>a.speciesId==='equus-quagga'&&a.habitatId===h.id)),visitorEligible:Boolean(h&&visitTargetForState(s,h.id)),viewingCell:access?.viewingCell??null,route:access?.route??[],path:h&&!connected?missingConnection(s,h.id):null,price:PRICES.path,balance:s.currency,command:s.economy.nextCommand};
}
