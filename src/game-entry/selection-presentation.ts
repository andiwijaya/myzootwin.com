import type { SceneIdentity, SceneIdentityKind } from '../game/render3d/scene-selection.ts';
import { entryMessages, type EntryLocale, type EntryMessage } from './locale.ts';
const titles:Record<SceneIdentityKind,EntryMessage>={land:'selectionTile',creek:'selectionTile',path:'selectionTile',palm:'selectionPalm',tree:'selectionTree',rock:'selectionRock',reeds:'selectionReeds',gate:'selectionGate'};
export function presentSelection(identity:SceneIdentity,locale:EntryLocale) {
  const copy=entryMessages[locale],params={x:identity.cell.x+1,z:identity.cell.z+1,n:identity.ordinal};
  const format=(message:string)=>message.replace(/\{(x|z|n)\}/g,(_,key:keyof typeof params)=>String(params[key]));
  return {title:format(copy[titles[identity.kind]]),location:format(copy.selectionLocation),detail:copy[identity.kind==='land'?'selectionLandDetail':identity.kind==='creek'?'selectionCreekDetail':identity.kind==='path'?'selectionPathDetail':identity.kind==='gate'?'selectionGateDetail':'selectionSceneryDetail']};
}
