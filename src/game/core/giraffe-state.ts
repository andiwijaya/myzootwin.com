import type {Animal,Habitat,Point} from './state.ts';
import type {V3ZooAnimal as ZooAnimal,V3ZooHabitat as ZooHabitat,V3ZooResource as ZooResource,V3ZooWorld as ZooWorld} from './species.ts';
import type {ZooSaveV3} from './zoo-state.ts';
import type {ZebraAnimal,ZebraResource} from './zebra-state.ts';

export const GIRAFFE_SPECIES_ID='giraffa-sp' as const;
export const GIRAFFE_HABITAT_KIND='giraffe-plains' as const;
export const GIRAFFE_RESOURCE_KINDS=['giraffe-browse','giraffe-water','giraffe-shade','giraffe-enrichment'] as const;
export type GiraffeResourceKind=typeof GIRAFFE_RESOURCE_KINDS[number];
export const GIRAFFE_BEHAVIORS=['idle','wander','seek-browse','browse','seek-water','drink','seek-shade','rest','ruminate','approach-companion','social','seek-enrichment','enrich'] as const;
export type GiraffeBehavior=typeof GIRAFFE_BEHAVIORS[number];
export interface GiraffeMotion {
 phase:GiraffeBehavior;ticksLeft:number;sequence:number;heading:number;
 waypoints:Point[];waypointIndex:number;partnerId:string|null;
 lastStep:Point;distanceWalked:number;blockedTicks:number;
}
export interface GiraffeAnimal extends Omit<Animal,'speciesId'|'habitatId'|'position'|'currentBehavior'|'motion'> {
 speciesId:typeof GIRAFFE_SPECIES_ID;name:'Dira'|'Sora'|'Lila';sex:'female';habitatId:string;position:Point;
 currentBehavior:GiraffeBehavior;motion:GiraffeMotion;
 socialComfort:number;shadeRest:number;socialCooldownTicks:number;enrichmentCooldownTicks:number;
 socialInteractions:number;highBrowses:number;
}
export type GiraffeHabitat=Habitat&{kind:typeof GIRAFFE_HABITAT_KIND};
export interface GiraffeResource {id:string;kind:GiraffeResourceKind;habitatId:string;cell:Point;stock:number;capacity:number;revision:number;approaches:Point[];}
export const GQ_IDS=['GQ01','GQ02','GQ03','GQ04'] as const;
export type GiraffeMissionId=typeof GQ_IDS[number];
export type GiraffeAward='giraffe-keeper'|'acacia-blooms'|'giraffe-safari-banner';
export interface GiraffeProgress {
 grant:null|{id:'giraffe-plains-grant-v1';ledgerEntryId:string;tick:number;command:number};
 missions:{currentId:GiraffeMissionId|null;completedIds:GiraffeMissionId[];
  rewards:{missionId:GiraffeMissionId;tick:number;command:number;ledgerEntryId:string|null;award:GiraffeAward|null}[];
  objectives:{fedIds:string[];wateredIds:string[];comfortableTicks:number;highBrowses:number;socialInteractions:number;thrivingTicks:number;viewedVisitorIds:string[]}};
}
export const initialGiraffeProgress=():GiraffeProgress=>({grant:null,missions:{currentId:'GQ01',completedIds:[],rewards:[],objectives:{fedIds:[],wateredIds:[],comfortableTicks:0,highBrowses:0,socialInteractions:0,thrivingTicks:0,viewedVisitorIds:[]}}});
/** Explicit V4 unions keep old serialized V1/V2/V3 input contracts unchanged. */
export type V4ZooAnimal=ZooAnimal|GiraffeAnimal;
export type V4ZooHabitat=ZooHabitat|GiraffeHabitat;
export type V4ZooResource=ZooResource|GiraffeResource;
export interface V4ZooWorld extends Omit<ZooWorld,'habitats'|'resources'> {habitats:V4ZooHabitat[];resources:V4ZooResource[];}
export interface ZooSaveV4 extends Omit<ZooSaveV3,'schemaVersion'|'world'|'animals'> {schemaVersion:4;world:V4ZooWorld;animals:V4ZooAnimal[];giraffePlains:GiraffeProgress;}
export const isGiraffe=(animal:V4ZooAnimal|ZebraAnimal):animal is GiraffeAnimal=>animal.speciesId===GIRAFFE_SPECIES_ID;
export const giraffes=(animals:readonly (V4ZooAnimal|ZebraAnimal)[])=>animals.filter(isGiraffe);
export const giraffeResources=(resources:readonly (V4ZooResource|ZebraResource)[]):GiraffeResource[]=>resources.filter((r):r is GiraffeResource=>GIRAFFE_RESOURCE_KINDS.includes(r.kind as GiraffeResourceKind));
export const GIRAFFE_SPECIES=Object.freeze({id:GIRAFFE_SPECIES_ID,habitatKind:GIRAFFE_HABITAT_KIND,footprint:7 as const,residents:3 as const,movement:'giraffe-ground' as const});
