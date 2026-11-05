import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {migrateSaveV1,ZOO_CHECKPOINT_CODEC,validateSaveV2,serializeSaveV2} from '../src/game/persistence/save-v2.ts';
import {conservationGrantView,prepareConservationGrant,CONSERVATION_GRANT_ID} from '../src/game/economy/conservation-grant.ts';
import {createAutosave} from '../src/game/persistence/autosave.ts';
import {SaveFault} from '../src/game/persistence/checkpoint.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {ledgerProof} from '../src/game/economy/journal.ts';
const frozen=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8'));
const source=()=>migrateSaveV1(frozen.entries.q04Claimed.state).value;
const record=s=>({format:2,generation:'grant-generation',revision:1,writtenAt:1,writer:'qa-grant',payload:serializeSaveV2(s)});

test('grant requires actually claimed Q04, is a pure quoted candidate, and migration never credits money',()=>{
  for(const entry of Object.values(frozen.entries)){const s=migrateSaveV1(entry.state).value;assert.equal(s.currency,entry.state.currency);assert.equal(s.elephantGrove.grant,null);}
  const ready=migrateSaveV1(frozen.entries.q04Ready.state).value;assert.equal(conservationGrantView(ready).canClaim,false);assert.equal(prepareConservationGrant(ready,{command:ready.economy.nextCommand}).ok,false);
  const s=source(),before=structuredClone(s),q={command:s.economy.nextCommand},candidate=prepareConservationGrant(s,q);assert.equal(candidate.ok,true);assert.deepEqual(s,before);assert.equal(candidate.state.currency,s.currency+1400);assert.equal(validateSaveV2(candidate.state).ok,true);assert.equal(candidate.state.ledger.filter(e=>e.id===CONSERVATION_GRANT_ID).length,1);assert.equal(prepareConservationGrant(candidate.state,q).reason,'claimed');assert.equal(prepareConservationGrant(s,{command:q.command-1}).reason,'stale');
});

test('candidate checkpoint publishes no optimistic credit before native/backend confirmation',async()=>{
  const s=source();let stored=record(s),release,entered;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
  const backend={codec:ZOO_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},async commit(expected,payload,writer,writtenAt){entered();await gate;assert.equal(expected,stored.revision);stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);},close(){}};
  const save=createAutosave(backend,{writer:'grant-pending'});await save.load();await save.continueSaved();const candidate=prepareConservationGrant(s,{command:s.economy.nextCommand}).state,pending=save.session.commitCandidate(candidate,{tick:s.tick,command:s.economy.nextCommand});await ready;
  assert.equal(save.session.read().currency,s.currency);assert.equal(save.session.read().elephantGrove.grant,null);assert.equal(save.session.canCommit(),false);release();const committed=await pending;assert.equal(committed.currency,s.currency+1400);assert.equal(save.session.read().currency,s.currency+1400);save.dispose();
});

test('failed candidate commit leaves both current session and primary untouched; explicit retry can claim once',async()=>{
  const s=source();let stored=record(s),fail=true;
  const backend={codec:ZOO_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},async commit(expected,payload,writer,writtenAt){if(fail)throw new SaveFault('quota');assert.equal(expected,stored.revision);stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);},close(){}};
  const save=createAutosave(backend,{writer:'grant-quota'});await save.load();await save.continueSaved();const candidate=prepareConservationGrant(s,{command:s.economy.nextCommand}).state,before=stored.payload;
  assert.equal(await save.session.commitCandidate(candidate,{tick:s.tick,command:s.economy.nextCommand}),undefined);assert.equal(stored.payload,before);assert.equal(save.session.read().currency,s.currency);assert.equal(save.session.read().elephantGrove.grant,null);fail=false;await save.retry();const committed=await save.session.commitCandidate(candidate,{tick:s.tick,command:s.economy.nextCommand});assert.equal(committed.currency,s.currency+1400);assert.equal(JSON.parse(stored.payload).ledger.filter(e=>e.id===CONSERVATION_GRANT_ID).length,1);save.dispose();
});

test('two candidate writers produce one committed grant, one conflict, and no losing-tab optimistic credit',async()=>{
  const s=source();let stored=record(s);const make=()=>({codec:ZOO_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},async commit(expected,payload,writer,writtenAt){if(expected!==stored.revision)throw new SaveFault('conflict');stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);},close(){}});
  const a=createAutosave(make(),{writer:'grant-tab-a'}),b=createAutosave(make(),{writer:'grant-tab-b'});await Promise.all([a.load(),b.load()]);await Promise.all([a.continueSaved(),b.continueSaved()]);const candidate=prepareConservationGrant(s,{command:s.economy.nextCommand}).state,expected={tick:s.tick,command:s.economy.nextCommand},results=await Promise.all([a.session.commitCandidate(candidate,expected),b.session.commitCandidate(candidate,expected)]);
  assert.equal(results.filter(Boolean).length,1);const loser=results[0]?b:a;assert.equal(loser.view().phase,'conflict');assert.equal(loser.session.read().currency,s.currency);assert.equal(loser.session.read().elephantGrove.grant,null);assert.equal(JSON.parse(stored.payload).currency,s.currency+1400);assert.equal(JSON.parse(stored.payload).ledger.filter(e=>e.id===CONSERVATION_GRANT_ID).length,1);a.dispose();b.dispose();
});

test('canonical runtime accepts only the exact committed grant mutation, preserves preferences, and compaction cannot erase/replay its proof',()=>{
  const s=createSimulation(source()),q={command:s.commandRevision()},candidate=s.prepareConservationGrant(q);assert.equal(candidate.ok,true);const tampered=structuredClone(candidate.state);tampered.world.tiles.at(-1).path=true;assert.equal(s.acceptCommittedGrant(tampered,q),false);assert.equal(s.snapshot().elephantGrove.grant,null);
  s.setLocale('id');assert.equal(s.acceptCommittedGrant(candidate.state,q),true);assert.equal(s.snapshot().preferences.locale,'id');assert.equal(s.acceptCommittedGrant(candidate.state,q),false);
  for(let i=0;i<180;i++){assert.equal(s.buildPath({x:0,z:17},s.commandRevision()).ok,true);const quote=s.quoteRemoval({kind:'path',cell:{x:0,z:17}});assert.equal(s.remove(quote.quote,`edit-${(i+1).toString(16).padStart(32,'0')}`).ok,true);}
  assert.ok(s.inspect().journalCompactions>=2);assert.equal(ledgerProof(s.snapshot(),CONSERVATION_GRANT_ID).amount,1400);assert.equal(s.conservationGrantView().claimed,true);assert.equal(s.prepareConservationGrant({command:s.commandRevision()}).reason,'claimed');assert.equal(validateSaveV2(s.snapshot()).ok,true);s.dispose();
});

test('grant candidate waits for an existing non-dirty in-flight autosave instead of racing its own revision',async()=>{
  const s=source();let stored=record(s),release,entered,calls=0;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
  const backend={codec:ZOO_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},async commit(expected,payload,writer,writtenAt){calls++;if(calls===1){entered();await gate;}if(expected!==stored.revision)throw new SaveFault('conflict');stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);},close(){}};
  const save=createAutosave(backend,{writer:'grant-serial'});await save.load();await save.continueSaved();save.session.checkpoint(()=>s,true);const ordinary=save.flush();await ready;assert.equal(save.inspect().dirty,false);const candidate=prepareConservationGrant(s,{command:s.economy.nextCommand}).state,pending=save.session.commitCandidate(candidate,{tick:s.tick,command:s.economy.nextCommand});await Promise.resolve();await Promise.resolve();assert.equal(calls,1);release();await ordinary;assert.equal((await pending).currency,s.currency+1400);assert.equal(save.view().phase,'saved');assert.equal(JSON.parse(stored.payload).elephantGrove.grant.id,CONSERVATION_GRANT_ID);save.dispose();
});

test('closing or flushing during a pending candidate cannot overwrite its committed grant with the pre-claim reader',async()=>{
  const original=source(),current=structuredClone(original);let stored=record(original),release,entered,closed=0;const ready=new Promise(r=>entered=r),gate=new Promise(r=>release=r);
  const backend={codec:ZOO_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},async commit(expected,payload,writer,writtenAt){if(JSON.parse(payload).elephantGrove.grant){entered();await gate;}if(expected!==stored.revision)throw new SaveFault('conflict');stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);},close(){closed++;}};
  const save=createAutosave(backend,{writer:'grant-close'});await save.load();await save.continueSaved();const candidate=prepareConservationGrant(original,{command:original.economy.nextCommand}).state,pending=save.session.commitCandidate(candidate,{tick:original.tick,command:original.economy.nextCommand});await ready;current.preferences.locale='id';save.session.write(current);save.session.checkpoint(()=>current,true);const flushing=save.flush();save.dispose();release();await pending;await flushing;for(let i=0;i<8;i++)await Promise.resolve();const result=JSON.parse(stored.payload);assert.equal(result.currency,original.currency+1400);assert.equal(result.elephantGrove.grant.id,CONSERVATION_GRANT_ID);assert.equal(result.preferences.locale,'id');assert.equal(closed,1);
});
