import type {ZooSaveV1,LedgerEntry} from '../../src/game/core/state.ts';
import type {ZooSaveV2} from '../../src/game/core/zoo-state.ts';
import {migrateSaveV1,validateSaveV2} from '../../src/game/persistence/save-v2.ts';
import {prepareSpeciesHabitat} from '../../src/game/world/species-habitat.ts';
import {preparePath,reconcilePathAccess} from '../../src/game/world/paths.ts';
import type {ElephantAnimal,ElephantResource,ElephantResourceKind} from '../../src/game/core/species.ts';

/** Explicit synthetic persistence fixture. NOT implemented player construction/care commands. */
export function syntheticElephantSave(source:unknown):ZooSaveV2 {
  const migrated=migrateSaveV1(source);if(!migrated.ok)throw Error(`Invalid fixture source: ${migrated.path}`);
  const s=migrated.value;
  const entry=(id:string,operationId:string,kind:LedgerEntry['kind'],amount:number,relatedId:string)=>{s.currency+=amount;s.ledger.push({id,operationId,kind,amount,relatedId,balanceAfter:s.currency,tick:s.tick});s.economy.nextCommand++;};
  const grantCommand=s.economy.nextCommand;
  entry('elephant-expansion-grant-v1','elephant-expansion-grant-v1','reward',1400,'elephant-expansion');
  s.elephantGrove.grant={id:'elephant-expansion-grant-v1',ledgerEntryId:'elephant-expansion-grant-v1',tick:s.tick,command:grantCommand};
  const built=prepareSpeciesHabitat(s.world,{x:3,z:11},'habitat-qa-v2','elephant-grove');if(!built.ok)throw Error('Fixture grove placement');s.world=built.world;
  entry('qa-grove-payment','qa-grove-payment','build',-650,built.habitatId);
  for(const [x,z] of [[1,9],[1,10],[2,10],[2,11],[2,12],[2,13]]){const result=preparePath(s.world,{x:x!,z:z!});if(!result.ok)throw Error('Fixture connector');s.world=result.world;if(!result.duplicate)entry(`qa-path-${x}-${z}`,`qa-path-${x}-${z}`,'build',-15,`path-${x}-${z}`);}
  s.world=reconcilePathAccess(s.world).world;
  const kinds:ElephantResourceKind[]=['elephant-browse','elephant-browse','elephant-water','elephant-pond','elephant-shade','elephant-log'];
  const cells=[[3,11],[8,11],[3,13],[6,15],[7,11],[8,14]],prices=[80,80,90,170,80,60];
  for(let i=0;i<kinds.length;i++){const [x,z]=cells[i]!,r:ElephantResource={id:`qa-elephant-resource-${i}`,kind:kinds[i]!,habitatId:built.habitatId,cell:{x:x!,z:z!},stock:i<4?8:0,capacity:8,revision:s.tick,approaches:[{x:4.5,z:12.5},{x:6.5,z:12.5}]};s.world.resources.push(r);entry(`qa-resource-payment-${i}`,`qa-resource-payment-${i}`,'build',-prices[i]!,r.id);}
  for(const [i,name] of ['Ayu','Nara'].entries()){
    const model=(source as ZooSaveV1).animals[0]!;
    const animal:ElephantAnimal={...structuredClone(model),id:i===0?'elephant-ayu':'elephant-nara',speciesId:'elephas-maximus',name,sex:'female',habitatId:built.habitatId,position:{x:4.5+i*2,z:12.5},target:null,targetResourceId:null,currentBehavior:'idle',motion:{phase:'idle',ticksLeft:0,sequence:0,heading:0,waypoints:[],waypointIndex:0},hunger:20,thirst:20,energy:80,enrichment:50,welfare:70,habitatFit:100,foodEaten:0,waterDrunk:0,restedTicks:0,enrichedTicks:0,socialComfort:70,shadeRest:0,bathCooldownTicks:0,logCooldownTicks:0,socialCooldownTicks:0,baths:0,socialInteractions:0};s.animals.push(animal);
  }
  const command=s.economy.nextCommand++;
  s.elephantGrove.missions.completedIds=['EH01'];s.elephantGrove.missions.currentId='EH02';s.elephantGrove.missions.rewards=[{missionId:'EH01',tick:s.tick,command,ledgerEntryId:null,award:'elephant-keeper'}];
  const result=validateSaveV2(s);if(!result.ok)throw Error(`Invalid synthetic V2 fixture: ${result.path}`);return result.value;
}
