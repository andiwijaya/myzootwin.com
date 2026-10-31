export const TICK_MS = 100;
export const MAX_TICK = Math.floor(Number.MAX_SAFE_INTEGER / TICK_MS);
export const SPECIES_ID = 'ara-ararauna' as const;
export const MISSION_IDS = ['Q01', 'Q02', 'Q03', 'Q04'] as const;
export type EntityId = string;
export type MissionId = typeof MISSION_IDS[number];
export interface Point { x: number; z: number; }
export interface Tile { cell: Point; terrain: 'land' | 'creek'; occupantId: EntityId | null; path: boolean; }
export interface Habitat { id: EntityId; cells: Point[]; viewingCell: Point | null; }
export interface Resource { id: EntityId; kind: 'food' | 'water' | 'perch'; habitatId: EntityId; cell: Point; stock: number; capacity: number; }
export interface WorldState { width: number; height: number; gate: Point; tiles: Tile[]; habitats: Habitat[]; resources: Resource[]; }
export type AnimalBehavior = 'idle' | 'wander' | 'perch' | 'seek-food' | 'eat' | 'seek-water' | 'drink' | 'rest';
export interface Animal {
  id: EntityId; speciesId: typeof SPECIES_ID; habitatId: EntityId | null;
  position: Point | null; target: Point | null; targetResourceId: EntityId | null;
  hunger: number; thirst: number; energy: number; habitatFit: number; enrichment: number; welfare: number;
  currentBehavior: AnimalBehavior;
}
export interface Visitor { id: EntityId; position: Point; route: Point[]; routeIndex: number; phase: 'entering' | 'viewing' | 'leaving'; satisfaction: number; admissionId: EntityId; }
export interface Admission { id: EntityId; visitorId: EntityId; tick: number; ledgerEntryId: EntityId; }
export type LedgerKind = 'starter' | 'build' | 'supplies' | 'maintenance' | 'ticket' | 'reward' | 'refund';
export interface LedgerEntry { id: EntityId; operationId: EntityId; kind: LedgerKind; amount: number; balanceAfter: number; tick: number; relatedId: EntityId | null; }
export interface Missions {
  currentId: MissionId | null; completedIds: MissionId[];
  rewards: Array<{ missionId: MissionId; ledgerEntryId: EntityId }>;
  objectives: { habitatConnected: boolean; birdsFedIds: EntityId[]; birdsWateredIds: EntityId[]; comfortableTicks: number; viewedVisitorIds: EntityId[]; thrivingTicks: number; };
}
export interface Preferences { locale: 'id' | 'en'; graphics: 'auto' | 'low' | 'high'; muted: boolean; reducedMotion: boolean; }
/** Serializable data only. No mesh/DOM/class references or runtime accumulator. */
export interface ZooSaveV1 {
  schemaVersion: 1; randomSeed: number; randomState: number; tick: number; gameTimeMs: number;
  currency: number; world: WorldState; animals: Animal[]; visitors: Visitor[];
  admissions: Admission[]; ledger: LedgerEntry[]; missions: Missions; preferences: Preferences;
}
