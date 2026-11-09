import type {Animal,Habitat,Point} from './state.ts';
import type {V4ZooAnimal,V4ZooHabitat,V4ZooResource,V4ZooWorld,ZooSaveV4} from './giraffe-state.ts';

export const ZEBRA_SPECIES_ID='equus-quagga' as const;
export const ZEBRA_HABITAT_KIND='zebra-grasslands' as const;
export const ZEBRA_RESOURCE_KINDS=['zebra-graze','zebra-water','zebra-shade','zebra-enrichment'] as const;
export type ZebraResourceKind=typeof ZEBRA_RESOURCE_KINDS[number];
/** This species owns its FSM. No bird flight, elephant bathing, lion roaring or giraffe browsing. */
export const ZEBRA_BEHAVIORS=['idle','wander','seek-graze','graze','seek-water','drink','seek-shade','rest','follow-herd','trot','approach-companion','groom','seek-enrichment','enrich'] as const;
export type ZebraBehavior=typeof ZEBRA_BEHAVIORS[number];
export const ZEBRA_RESIDENTS=Object.freeze([
 Object.freeze({id:'zebra-zaki',name:'Zaki',sex:'male'} as const),
 Object.freeze({id:'zebra-zuri',name:'Zuri',sex:'female'} as const),
 Object.freeze({id:'zebra-mira',name:'Mira',sex:'female'} as const),
 Object.freeze({id:'zebra-kira',name:'Kira',sex:'female'} as const),
]);
export interface ZebraMotion {
 phase:ZebraBehavior;ticksLeft:number;sequence:number;heading:number;
 waypoints:Point[];waypointIndex:number;partnerId:string|null;herdLeaderId:string|null;
 lastStep:Point;distanceWalked:number;blockedTicks:number;
 /** Optional accumulated forward ground distance during an actual trot episode. */
 trotDistance?:number;
}
interface ZebraAnimalState extends Omit<Animal,'id'|'speciesId'|'habitatId'|'position'|'currentBehavior'|'motion'> {
 speciesId:typeof ZEBRA_SPECIES_ID;
 habitatId:string;position:Point;currentBehavior:ZebraBehavior;motion:ZebraMotion;
 socialComfort:number;shadeRest:number;groomCooldownTicks:number;trotCooldownTicks:number;enrichmentCooldownTicks:number;
 grazes:number;groomings:number;trots:number;
}
/** Identity, name and sex are one discriminant: Zaki cannot silently become another resident. */
export type ZebraAnimal=ZebraAnimalState&typeof ZEBRA_RESIDENTS[number];
export type ZebraHabitat=Habitat&{kind:typeof ZEBRA_HABITAT_KIND};
export interface ZebraResource {
 id:string;kind:ZebraResourceKind;habitatId:string;cell:Point;stock:number;capacity:number;revision:number;approaches:Point[];
}
export const ZQ_IDS=['ZQ01','ZQ02','ZQ03','ZQ04'] as const;
export type ZebraMissionId=typeof ZQ_IDS[number];
export type ZebraAward='grassland-founder'|'striped-meadow'|'zebra-keeper';
/** References the original claimed GQ04 reward, including its durable finance identity. */
export interface ZebraUnlockProof {missionId:'GQ04';ledgerEntryId:string;tick:number;command:number;}
export interface ZebraProgress {
 unlock:ZebraUnlockProof|null;
 grant:null|{id:'zebra-grasslands-grant-v1';ledgerEntryId:string;tick:number;command:number};
 missions:{currentId:ZebraMissionId|null;completedIds:ZebraMissionId[];
  rewards:{missionId:ZebraMissionId;tick:number;command:number;ledgerEntryId:string|null;award:ZebraAward|null;connection?:{habitatId:string;viewingCell:Point;route:Point[]}}[];
  objectives:{fedIds:string[];wateredIds:string[];comfortableTicks:number;groomings:number;restedIds:string[];enrichedIds:string[];thrivingTicks:number;viewedVisitorIds:string[]}};
}
export const initialZebraProgress=():ZebraProgress=>({unlock:null,grant:null,missions:{currentId:'ZQ01',completedIds:[],rewards:[],objectives:{fedIds:[],wateredIds:[],comfortableTicks:0,groomings:0,restedIds:[],enrichedIds:[],thrivingTicks:0,viewedVisitorIds:[]}}});
/** Exact historical unions remain closed; only V5 admits the fifth species and namespace. */
export type V5ZooAnimal=V4ZooAnimal|ZebraAnimal;
export type V5ZooHabitat=V4ZooHabitat|ZebraHabitat;
export type V5ZooResource=V4ZooResource|ZebraResource;
export interface V5ZooWorld extends Omit<V4ZooWorld,'habitats'|'resources'> {habitats:V5ZooHabitat[];resources:V5ZooResource[];}
export interface ZooSaveV5 extends Omit<ZooSaveV4,'schemaVersion'|'world'|'animals'> {schemaVersion:5;world:V5ZooWorld;animals:V5ZooAnimal[];zebraGrasslands:ZebraProgress;}
export const isZebra=(animal:V5ZooAnimal):animal is ZebraAnimal=>animal.speciesId===ZEBRA_SPECIES_ID;
export const zebras=(animals:readonly V5ZooAnimal[]):ZebraAnimal[]=>animals.filter(isZebra);
export const zebraResources=(resources:readonly V5ZooResource[]):ZebraResource[]=>resources.filter((r):r is ZebraResource=>ZEBRA_RESOURCE_KINDS.includes(r.kind as ZebraResourceKind));
/** Fictional game footprint and population; no real animal-care dimensions are implied. */
export const ZEBRA_SPECIES=Object.freeze({id:ZEBRA_SPECIES_ID,habitatKind:ZEBRA_HABITAT_KIND,footprint:8 as const,residents:4 as const,movement:'zebra-ground' as const});
