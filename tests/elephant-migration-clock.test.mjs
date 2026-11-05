import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runMigrationClockSoak} from './fixtures/elephant-migration-clock.ts';
import {serializeSaveV2,parseSaveV2} from '../src/game/persistence/save-v2.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));

for(const id of ['q04Claimed','longLedger'])test(`V2 ${id}: 30 simulated minutes,60 reloads,1x/10x/pause and actual command compaction match original V1 exactly`,()=>{
  const source=structuredClone(frozen.entries[id].state),before=structuredClone(source),{save,summary}=runMigrationClockSoak(source);
  assert.equal(summary.referenceExact,true);assert.equal(summary.reloads,60);assert.equal(summary.pauses,60);assert.equal(summary.editTransactions,1200);assert.ok(summary.newCompactions>=9);assert.ok(summary.maxJournal<128);assert.ok(summary.maxPayload<100000);assert.equal(summary.disposedSubscribers,0);assert.equal(save.tick,source.tick+18000);assert.equal(save.preferences.speed,10);assert.equal(save.elephantGrove.grant,null);assert.deepEqual(save.missions.completedIds,source.missions.completedIds);assert.deepEqual(parseSaveV2(serializeSaveV2(save)).value,save);assert.deepEqual(source,before);if(id==='q04Claimed'){assert.ok(summary.careCommands>0);assert.ok(summary.ticketAdmissions>2);}
});

for(const id of ['new','midVisitor','zeroCash'])test(`V2 ${id}: repeated migration across speed and pause boundaries preserves low-cash/visitor semantics`,()=>{
  const {save,summary}=runMigrationClockSoak(frozen.entries[id].state,1800,150);assert.equal(summary.reloads,12);assert.equal(summary.referenceExact,true);assert.equal(save.animals.length,2);assert.equal(save.elephantGrove.grant,null);assert.equal(summary.disposedSubscribers,0);
});
