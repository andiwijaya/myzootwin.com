/** Build-QA-only side table. Returns the original object; no gameplay/Three properties change. */
import type {SceneCatalog} from '../../../src/game/render3d/scene-selection.ts';
import type {Object3D} from 'three';
import type {createSimulation} from '../../../src/game/core/simulation.ts';
export type CanonicalSimulation=ReturnType<typeof createSimulation>;
let canonicalOwner:CanonicalSimulation|undefined;
const sites=new WeakMap<object,string>();
const constructed=new Map<string,number>();
const catalogues=new WeakMap<object,SceneCatalog>();
export function tagVisual3d<T>(value:T,assetId:string):T {if(value!==null&&(typeof value==='object'||typeof value==='function')){sites.set(value as object,assetId);constructed.set(assetId,(constructed.get(assetId)??0)+1);}return value;}
export function visualSite(value:object):string|undefined{return sites.get(value);}
export const visualConstructions=()=>[...constructed.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([assetId,instances])=>({assetId,instances}));
export const resetVisualConstructions=()=>constructed.clear();
export function captureVisualFactory<T>(value:T):T {const v=value as {group?:object;catalog?:SceneCatalog};if(v?.group&&v.catalog?.identities instanceof Map&&v.catalog?.bounds instanceof Map)catalogues.set(v.group,v.catalog);return value;}
export function visualCatalogues(scene:Object3D){const found:SceneCatalog[]=[];scene.traverse(o=>{const c=catalogues.get(o);if(c)found.push(c);});return found;}
export function captureCanonicalSimulation(value:CanonicalSimulation){if(canonicalOwner&&!canonicalOwner.inspect().disposed){value.dispose();throw Error('More than one live canonical QA owner');}canonicalOwner=value;return value;}
export function capturedCanonicalSimulation(){if(!canonicalOwner||canonicalOwner.inspect().disposed)throw Error('No live production canonical simulation');return canonicalOwner;}
export function releaseCanonicalSimulation(){if(canonicalOwner&&!canonicalOwner.inspect().disposed)throw Error('Cannot forget a live production simulation');canonicalOwner=undefined;}
export const canonicalOwnerStatus=()=>({present:!!canonicalOwner,disposed:canonicalOwner?.inspect().disposed??null});
