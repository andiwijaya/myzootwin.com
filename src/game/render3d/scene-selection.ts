import type {GiraffeBehavior,GiraffeResourceKind} from '../core/giraffe-state.ts';
import type {ElephantBehavior,LionBehavior,HabitatKind,LionResourceKind} from '../core/species.ts';
import type { Box3, Mesh } from 'three';
export type SceneIdentityKind='land'|'creek'|'path'|'palm'|'tree'|'rock'|'reeds'|'gate'|'habitat'|'elephant'|'elephant-facility'|'lion'|'lion-facility'|'giraffe'|'giraffe-facility'|'zebra';
/** Plain view data, never a mesh reference or a gameplay/save mutation. */
export interface SceneIdentity {id:string;category:'tile'|'object';kind:SceneIdentityKind;habitatKind?:HabitatKind;residentName?:string;residentNeeds?:{hunger:number;thirst:number;welfare:number;energy:number;enrichment:number;socialComfort:number;behavior:ElephantBehavior|LionBehavior|GiraffeBehavior;backing:boolean};facilityKind?:'elephant-browse'|'elephant-water'|'elephant-pond'|'elephant-shade'|'elephant-log'|LionResourceKind|GiraffeResourceKind;stock?:number;capacity?:number;ordinal:number;connected?:boolean;cell:{x:number;z:number};}
export interface FaceOwner {first:number;count:number;id:string|null;}
export interface SceneCatalog {identities:Map<string,SceneIdentity>;bounds:Map<string,Box3>;batches:Array<{mesh:Mesh;ranges:FaceOwner[]}>;}
