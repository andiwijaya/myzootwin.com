export const TICK_MS = 100;
export type {RuntimeState,RuntimeWorld} from './runtime-state.ts';
export const MAX_TICK = Math.floor(Number.MAX_SAFE_INTEGER / TICK_MS);
export const SPECIES_ID = 'ara-ararauna' as const;
export const MISSION_IDS = ['Q01', 'Q02', 'Q03', 'Q04'] as const;
export type EntityId = string;
export type MissionId = typeof MISSION_IDS[number];
export interface Point { x: number; z: number; }
export interface Tile { cell: Point; terrain: 'land' | 'creek'; occupantId: EntityId | null; path: boolean; }
export interface Habitat { id: EntityId; cells: Point[]; viewingCell: Point | null; }
export interface Resource { id: EntityId; kind: 'food' | 'water' | 'perch'; habitatId: EntityId; cell: Point; stock: number; capacity: number; revision:number; portions:[number,number]|null; }
export interface WorldState { width: number; height: number; gate: Point; tiles: Tile[]; habitats: Habitat[]; resources: Resource[]; }
export type AnimalBehavior = 'idle' | 'wander' | 'perch' | 'seek-food' | 'eat' | 'seek-water' | 'drink' | 'rest' | 'enrich' | 'seek-rest';
export interface AnimalMotion {phase:'idle'|'look'|'walk-out'|'walk-home'|'ascend'|'perch'|'descend'|'seek-food'|'eat'|'leave-food'|'seek-water'|'drink'|'water-back'|'water-hop'|'leave-water'|'water-home'|'water-abort'|'seek-rest'|'rest'|'enrich';ticksLeft:number;sequence:number;heading:number;elevation:number;}
export interface Animal {
  id: EntityId; speciesId: typeof SPECIES_ID; habitatId: EntityId | null;
  position: Point | null; target: Point | null; targetResourceId: EntityId | null;
  hunger: number; thirst: number; energy: number; habitatFit: number; enrichment: number; welfare: number;
  care:{low:boolean;hungry:boolean;thirsty:boolean;tired:boolean;bored:boolean};
  currentBehavior: AnimalBehavior; motion:AnimalMotion; foodEaten:number; waterDrunk:number; restedTicks:number; enrichedTicks:number;
}
export type VisitorOutcome='comfortable'|'concerned'|'empty'|'no-habitat'|'unreachable'|'interrupted';
export type VisitorInterruption='none'|'closed'|'access-lost'|'habitat-removed'|'time-limit';
export interface VisitorFeedback {visitorId:EntityId;habitatId:EntityId|null;tick:number;outcome:VisitorOutcome;reason:VisitorInterruption;score:number|null;observedWelfare:number|null;samples:number;occupiedSamples:number;welfareHundredths:number;}
export interface VisitorExperience {samples:number;occupiedSamples:number;welfareHundredths:number;feedback:VisitorFeedback|null;}
export interface VisitorFeedbackSummary {evaluated:number;scored:number;scoreSum:number;positive:number;negative:number;interrupted:number;recent:VisitorFeedback[];}
export interface Visitor { id: EntityId; position: Point; route: Point[]; routeIndex: number; phase: 'arrival' | 'queued' | 'entering' | 'viewing' | 'leaving' | 'exiting'; satisfaction: number|null; experience:VisitorExperience|null; entry:{status:'pending'|'paid'|'free';tick:number|null;reason:'none'|'no-animals'}|null; admissionId: EntityId|null; arrival:{serial:number;slot:number;spawnTick:number}|null; journey:{habitatId:EntityId|null;heading:number;dwellTicks:number;queuedTicks:number;viewed:boolean;startedTick:number|null}|null; }
export interface Admission { id: EntityId; visitorId: EntityId; tick: number; ledgerEntryId: EntityId; entry:{habitatId:EntityId;gate:Point;cell:Point;price:number}|null; }
export type LedgerKind = 'starter' | 'build' | 'supplies' | 'maintenance' | 'ticket' | 'reward' | 'refund' | 'restore';
export interface LedgerEntry { id: EntityId; operationId: EntityId; kind: LedgerKind; amount: number; balanceAfter: number; tick: number; relatedId: EntityId | null; }
export interface PurchaseProof {entry:LedgerEntry;refunded:number;}
export interface RefundProof {entry:LedgerEntry;restored:number;}
export interface TicketProof {admission:Admission;entry:LedgerEntry;}
export interface FinanceCheckpoint {
 version:1;balance:number;entries:number;lastTick:number;compactions:number;commandThrough:number;visitorThrough:number;openSerials:number[];maintenancePeriod:number;
 totals:Record<LedgerKind,number>;counts:Record<LedgerKind,number>;
 purchases:PurchaseProof[];refunds:RefundProof[];tickets:TicketProof[];rewards:LedgerEntry[];lastTicket:TicketProof|null;
}
export interface ThrivingProof {startTick:number;lastTick:number;baselineRevenue:number;baselineAdmissions:number;earnedRevenue:number;earnedAdmissions:number;}
export interface Missions {
  currentId: MissionId | null; completedIds: MissionId[];
  rewards: Array<{ missionId: MissionId; ledgerEntryId: EntityId } | { missionId: MissionId; unlockId: "aviary-blossoms"; tick:number; command:number } | { missionId: MissionId; ledgerEntryId:EntityId; badgeId:"first-visitors"; tick:number; command:number } | {missionId:MissionId;unlockId:"sanctuary-banner";badgeId:"thriving-sanctuary";tick:number;command:number}>;
  objectives: { habitatConnected: boolean; birdsFedIds: EntityId[]; birdsWateredIds: EntityId[]; comfortableTicks: number; viewedVisitorIds: EntityId[]; admittedVisitorIds:EntityId[]; viewingEvidence:VisitorFeedback|null; thrivingTicks: number; thriving:ThrivingProof|null; };
}
export type SimulationSpeed=1|10;
export interface Preferences { speed:SimulationSpeed; locale: 'id' | 'en'; graphics: 'auto' | 'low' | 'high'; muted: boolean; reducedMotion: boolean; }
/** Serializable data only. No mesh/DOM/class references or runtime accumulator. */
export interface ZooSaveV1 {
  schemaVersion: 1; randomSeed: number; randomState: number; tick: number; gameTimeMs: number;
  currency: number; economy:{maintenancePeriod:number;nextCommand:number;checkpoint:FinanceCheckpoint;recovery:{lastRationTick:number|null;rationBatches:number;equipmentGrants:number;habitatGrant:{id:EntityId;tick:number}|null}}; world: WorldState; animals: Animal[]; visitors: Visitor[];
  visitorFlow:{open:boolean;nextSerial:number;cooldownTicks:number;viewedTotal:number;feedback:VisitorFeedbackSummary};
  admissions: Admission[]; ledger: LedgerEntry[]; missions: Missions; preferences: Preferences;
}
