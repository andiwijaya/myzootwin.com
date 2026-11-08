import {giraffeCopy,giraffeResourceLabel,giraffeBehaviorLabel} from './giraffe-copy.ts';
import {zebraConstructionCopy} from './zebra-copy.ts';
import type {GiraffeBehavior,GiraffeResourceKind} from '../game/core/giraffe-state.ts';
import {lionCopy,lionResourceLabel,lionBehaviorLabel} from './lion-copy.ts';
import type {ElephantBehavior,LionBehavior,LionResourceKind} from '../game/core/species.ts';
import {elephantCareCopy,elephantBehaviorLabel} from './elephant-care-panel.ts';
import {formatNumber} from './i18n-format.ts';
import {elephantCatalogCopy} from './elephant-catalog.ts';
import type { SceneIdentity, SceneIdentityKind } from '../game/render3d/scene-selection.ts';
import { entryMessages, type EntryLocale, type EntryMessage } from './locale.ts';
const titles:Record<Exclude<SceneIdentityKind,'elephant'|'elephant-facility'|'lion'|'lion-facility'|'giraffe'|'giraffe-facility'|'zebra'>,EntryMessage>={land:'selectionTile',creek:'selectionTile',path:'selectionTile',palm:'selectionPalm',tree:'selectionTree',rock:'selectionRock',reeds:'selectionReeds',gate:'selectionGate',habitat:'selectionHabitat'};
export function presentSelection(identity:SceneIdentity,locale:EntryLocale) {
  const copy=entryMessages[locale],params={x:identity.cell.x+1,z:identity.cell.z+1,n:identity.ordinal};
  const format=(message:string)=>message.replace(/\{(x|z|n)\}/g,(_,key:keyof typeof params)=>String(params[key]));
  if(identity.kind==='zebra')return{title:identity.residentName??'Zebra',location:format(copy.selectionLocation),detail:locale==='id'?'Zebra dataran dewasa · Equus quagga':'Adult plains zebra · Equus quagga'};
  if(identity.habitatKind==='zebra-grasslands'){const c=zebraConstructionCopy[locale];return{title:c.title,location:format(copy.selectionLocation),detail:identity.connected?c.connected:c.disconnected};}
  if(identity.kind==='giraffe'){const c=giraffeCopy[locale],n=identity.residentNeeds;return {title:identity.residentName??c.title,location:format(copy.selectionLocation),detail:n?`${giraffeBehaviorLabel(n.behavior as GiraffeBehavior,locale)} · ${c.welfare} ${n.welfare}/100 · ${c.hunger} ${n.hunger} · ${c.thirst} ${n.thirst}`:c.intro};}
  if(identity.kind==='giraffe-facility'){const c=giraffeCopy[locale];return {title:giraffeResourceLabel(identity.facilityKind as GiraffeResourceKind,locale),location:format(copy.selectionLocation),detail:`${c.stock}: ${identity.stock}/${identity.capacity}. ${c.guide}`};}
  if(identity.habitatKind==='giraffe-plains'){const c=giraffeCopy[locale];return {title:c.title,location:format(copy.selectionLocation),detail:identity.connected?c.connected:c.disconnected};}
  if(identity.kind==='lion'){const c=lionCopy[locale],n=identity.residentNeeds;return {title:identity.residentName??c.title,location:format(copy.selectionLocation),detail:n?`${lionBehaviorLabel(n.behavior as LionBehavior,locale)} · ${c.welfare} ${n.welfare}/100 · ${c.hunger} ${n.hunger} · ${c.thirst} ${n.thirst}`:c.intro};}
  if(identity.kind==='lion-facility'){const c=lionCopy[locale];return {title:lionResourceLabel(identity.facilityKind as LionResourceKind,locale),location:format(copy.selectionLocation),detail:`${c.stock}: ${identity.stock}/${identity.capacity}. ${c.guide}`};}
  if(identity.habitatKind==='lion-savanna'){const c=lionCopy[locale];return {title:c.title,location:format(copy.selectionLocation),detail:identity.connected?c.connected:c.disconnected};}
  if(identity.kind==='elephant-facility'){const c=elephantCareCopy[locale],stock=(identity.facilityKind==='elephant-pond'?c.pondStock:c.stock).replace('{stock}',formatNumber(identity.stock??0,locale)).replace('{capacity}',formatNumber(identity.capacity??8,locale));return {title:identity.facilityKind==='elephant-shade'?c.shade:identity.facilityKind==='elephant-log'?c.log:identity.facilityKind==='elephant-pond'?c.pond:identity.facilityKind==='elephant-water'?c.water:format(c.browse),location:format(copy.selectionLocation),detail:(identity.facilityKind==='elephant-shade'||identity.facilityKind==='elephant-log'?c.prepared:stock)+'. '+c.facilityDetail};}
  if(identity.kind==='elephant'){const c=elephantCatalogCopy[locale],care=elephantCareCopy[locale],needs=identity.residentNeeds,name=identity.residentName??c.residentTitle,summary=needs?c.residentSpecies+' '+care.needs.replace(/\{(name|hunger|thirst|welfare)\}/g,(_,key:'name'|'hunger'|'thirst'|'welfare')=>key==='name'?name:formatNumber(needs[key],locale))+' '+elephantBehaviorLabel(needs.behavior as ElephantBehavior,needs.backing,locale)+'. '+care.inspectHelp.replace('{name}',name):c.residentDetail;return {title:name,location:format(copy.selectionLocation),detail:summary};}
  if(identity.habitatKind==='elephant-grove'){const c=elephantCatalogCopy[locale];return {title:c.selection,location:format(copy.selectionLocation),detail:identity.connected?c.connected:c.detail};}
  return {title:format(copy[titles[identity.kind]]),location:format(copy.selectionLocation),detail:copy[identity.kind==='habitat'?(identity.connected?'selectionHabitatConnectedDetail':'selectionHabitatDetail'):identity.kind==='land'?'selectionLandDetail':identity.kind==='creek'?'selectionCreekDetail':identity.kind==='path'?(identity.connected?'selectionPathConnectedDetail':'selectionPathDetail'):identity.kind==='gate'?'selectionGateDetail':'selectionSceneryDetail']};
}
