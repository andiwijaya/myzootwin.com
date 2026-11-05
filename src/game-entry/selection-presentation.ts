import {elephantCatalogCopy} from './elephant-catalog.ts';
import type { SceneIdentity, SceneIdentityKind } from '../game/render3d/scene-selection.ts';
import { entryMessages, type EntryLocale, type EntryMessage } from './locale.ts';
const titles:Record<Exclude<SceneIdentityKind,'elephant'>,EntryMessage>={land:'selectionTile',creek:'selectionTile',path:'selectionTile',palm:'selectionPalm',tree:'selectionTree',rock:'selectionRock',reeds:'selectionReeds',gate:'selectionGate',habitat:'selectionHabitat'};
export function presentSelection(identity:SceneIdentity,locale:EntryLocale) {
  const copy=entryMessages[locale],params={x:identity.cell.x+1,z:identity.cell.z+1,n:identity.ordinal};
  const format=(message:string)=>message.replace(/\{(x|z|n)\}/g,(_,key:keyof typeof params)=>String(params[key]));
  if(identity.kind==='elephant'){const c=elephantCatalogCopy[locale];return {title:identity.residentName??c.residentTitle,location:format(copy.selectionLocation),detail:c.residentDetail};}
  if(identity.habitatKind==='elephant-grove'){const c=elephantCatalogCopy[locale];return {title:c.selection,location:format(copy.selectionLocation),detail:identity.connected?c.connected:c.detail};}
  return {title:format(copy[titles[identity.kind]]),location:format(copy.selectionLocation),detail:copy[identity.kind==='habitat'?(identity.connected?'selectionHabitatConnectedDetail':'selectionHabitatDetail'):identity.kind==='land'?'selectionLandDetail':identity.kind==='creek'?'selectionCreekDetail':identity.kind==='path'?(identity.connected?'selectionPathConnectedDetail':'selectionPathDetail'):identity.kind==='gate'?'selectionGateDetail':'selectionSceneryDetail']};
}
