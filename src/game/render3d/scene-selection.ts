import type { Box3, Mesh } from 'three';
export type SceneIdentityKind='land'|'creek'|'path'|'palm'|'tree'|'rock'|'reeds'|'gate'|'habitat'|'elephant'|'elephant-facility';
/** Plain view data, never a mesh reference or a gameplay/save mutation. */
export interface SceneIdentity {id:string;category:'tile'|'object';kind:SceneIdentityKind;habitatKind?:'macaw-aviary'|'elephant-grove';residentName?:string;facilityKind?:'elephant-browse'|'elephant-water'|'elephant-pond'|'elephant-shade'|'elephant-log';stock?:number;capacity?:number;ordinal:number;connected?:boolean;cell:{x:number;z:number};}
export interface FaceOwner {first:number;count:number;id:string|null;}
export interface SceneCatalog {identities:Map<string,SceneIdentity>;bounds:Map<string,Box3>;batches:Array<{mesh:Mesh;ranges:FaceOwner[]}>;}
