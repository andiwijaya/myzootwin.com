import {SPECIES_ID, type Animal, type Habitat, type Point, type Resource, type WorldState} from './state.ts';

export const MACAW_SPECIES_ID = SPECIES_ID;
export const ELEPHANT_SPECIES_ID = 'elephas-maximus' as const;
export type SpeciesId = typeof MACAW_SPECIES_ID | typeof ELEPHANT_SPECIES_ID;
export type HabitatKind = 'macaw-aviary' | 'elephant-grove';
export type ElephantResourceKind = 'elephant-browse' | 'elephant-water' | 'elephant-pond' | 'elephant-shade' | 'elephant-log';

/** V1 stays the exact serialized input contract. Its Animal/Resource aliases are macaw-only. */
export type MacawAnimal = Animal;
export type MacawResource = Resource;
export type MacawHabitat = Habitat & {kind:'macaw-aviary'};
export type ElephantHabitat = Habitat & {kind:'elephant-grove'};
export type ZooHabitat = MacawHabitat | ElephantHabitat;

/** Ground motion cannot represent a bird's flight/perch/elevation phases. */
export type ElephantBehavior = 'idle' | 'wander' | 'seek-food' | 'eat' | 'seek-water' | 'drink' | 'seek-bath' | 'bathe' | 'spray' | 'seek-shade' | 'rest' | 'seek-log' | 'enrich' | 'approach-companion' | 'trunk-touch';
export interface ElephantMotion {
  /** Last actual fixed-tick transform delta; optional for lossless older V2 reads. */
  lastStep?:Point&{heading:number};
  /** Short reverse clearance step when a companion pins the turn; absent in older V2 saves. */
  backing?:true;
  phase:ElephantBehavior;
  ticksLeft:number;
  sequence:number;
  heading:number;
  waypoints:Point[];
  waypointIndex:number;
}
export interface ElephantAnimal extends Omit<Animal,'speciesId'|'habitatId'|'position'|'currentBehavior'|'motion'> {
  speciesId:typeof ELEPHANT_SPECIES_ID;
  name:string;
  sex:'female';
  habitatId:string;
  position:Point;
  currentBehavior:ElephantBehavior;
  motion:ElephantMotion;
  socialComfort:number;
  shadeRest:number;
  bathCooldownTicks:number;
  logCooldownTicks:number;
  socialCooldownTicks:number;
  baths:number;
  socialInteractions:number;
}
export interface ElephantResource extends Omit<Resource,'kind'|'portions'> {
  kind:ElephantResourceKind;
  approaches:Point[];
}
export type ZooAnimal = MacawAnimal | ElephantAnimal;
export type ZooResource = MacawResource | ElephantResource;
export interface ZooWorld extends Omit<WorldState,'habitats'|'resources'> {
  habitats:ZooHabitat[];
  resources:ZooResource[];
}

/** Species ownership is explicit; callers must narrow before using a species FSM or rig. */
export const isMacaw = (animal:ZooAnimal):animal is MacawAnimal => animal.speciesId===MACAW_SPECIES_ID;
export const isElephant = (animal:ZooAnimal):animal is ElephantAnimal => animal.speciesId===ELEPHANT_SPECIES_ID;
export const macaws = (animals:readonly ZooAnimal[]):MacawAnimal[] => animals.filter(isMacaw);
export const elephants = (animals:readonly ZooAnimal[]):ElephantAnimal[] => animals.filter(isElephant);

export const SPECIES = Object.freeze({
  [MACAW_SPECIES_ID]:Object.freeze({habitatKind:'macaw-aviary' as const,footprint:2 as const,residents:2 as const,movement:'avian' as const}),
  [ELEPHANT_SPECIES_ID]:Object.freeze({habitatKind:'elephant-grove' as const,footprint:6 as const,residents:2 as const,movement:'ground' as const}),
});
export function habitatSpecies(kind:HabitatKind):SpeciesId|null {
  return kind==='macaw-aviary'?MACAW_SPECIES_ID:kind==='elephant-grove'?ELEPHANT_SPECIES_ID:null;
}
export function resourceSpecies(kind:ZooResource['kind']):SpeciesId|null {
  if(kind==='food'||kind==='water'||kind==='perch')return MACAW_SPECIES_ID;
  return kind==='elephant-browse'||kind==='elephant-water'||kind==='elephant-pond'||kind==='elephant-shade'||kind==='elephant-log'?ELEPHANT_SPECIES_ID:null;
}
export function compatibleHabitat(animal:ZooAnimal,habitat:ZooHabitat):boolean {
  return animal.speciesId===habitatSpecies(habitat.kind);
}
export function compatibleResource(resource:ZooResource,habitat:ZooHabitat):boolean {
  const species=resourceSpecies(resource.kind);
  return species!==null&&resource.habitatId===habitat.id&&species===habitatSpecies(habitat.kind);
}
