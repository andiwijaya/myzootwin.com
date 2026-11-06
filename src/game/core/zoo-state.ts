import type {ZooSaveV1} from './state.ts';
import type {V2ZooAnimal,V2ZooWorld,ZooAnimal,ZooWorld} from './species.ts';

export const EH_IDS=['EH01','EH02','EH03','EH04'] as const;
export type ElephantMissionId=typeof EH_IDS[number];
export interface ConservationGrant {id:'elephant-expansion-grant-v1';ledgerEntryId:string;tick:number;command:number;}
export interface ElephantMissionReward {missionId:ElephantMissionId;tick:number;command:number;ledgerEntryId:string|null;award:'elephant-keeper'|'elephant-water-lilies'|'gentle-giants'|null;}
export interface ElephantMissions {
  currentId:ElephantMissionId|null;
  completedIds:ElephantMissionId[];
  rewards:ElephantMissionReward[];
  objectives:{fedIds:string[];wateredIds:string[];comfortableTicks:number;baths:number;enrichments:number;thrivingTicks:number;viewedVisitorIds:string[]};
}
/** One serialized world, population, clock, ledger and admission system. */
export interface ZooSaveV2 extends Omit<ZooSaveV1,'schemaVersion'|'world'|'animals'> {
  schemaVersion:2;
  world:V2ZooWorld;
  animals:V2ZooAnimal[];
  elephantGrove:{grant:ConservationGrant|null;missions:ElephantMissions};
}
export const LQ_IDS=['LQ01','LQ02','LQ03','LQ04'] as const;
export type LionMissionId=typeof LQ_IDS[number];
export interface LionMissionReward {missionId:LionMissionId;tick:number;command:number;ledgerEntryId:string|null;award:'pride-founder'|'savanna-wildflowers'|'savanna-guardian'|null;}
export interface LionSavannaProgress {
 grant:null|{id:'lion-savanna-grant-v1';ledgerEntryId:string;tick:number;command:number};
 missions:{currentId:LionMissionId|null;completedIds:LionMissionId[];rewards:LionMissionReward[];objectives:{fedIds:string[];wateredIds:string[];comfortableTicks:number;roars:number;scentInvestigations:number;thrivingTicks:number;viewedVisitorIds:string[]}};
}
export interface ZooSaveV3 extends Omit<ZooSaveV2,'schemaVersion'|'world'|'animals'> {
 schemaVersion:3;world:ZooWorld;animals:ZooAnimal[];lionSavanna:LionSavannaProgress;
}
export type MultiSpeciesSave=ZooSaveV2|ZooSaveV3;
export type ZooSave=ZooSaveV1|MultiSpeciesSave;
export const initialLionProgress=():LionSavannaProgress=>({grant:null,missions:{currentId:'LQ01',completedIds:[],rewards:[],objectives:{fedIds:[],wateredIds:[],comfortableTicks:0,roars:0,scentInvestigations:0,thrivingTicks:0,viewedVisitorIds:[]}}});
export const initialElephantMissions=():ElephantMissions=>({currentId:'EH01',completedIds:[],rewards:[],objectives:{fedIds:[],wateredIds:[],comfortableTicks:0,baths:0,enrichments:0,thrivingTicks:0,viewedVisitorIds:[]}});
