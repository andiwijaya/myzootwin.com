import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAutosave} from '../src/game/persistence/autosave.ts';
import {SaveFault} from '../src/game/persistence/checkpoint.ts';
import {migrateToV3,LION_CHECKPOINT_CODEC,serializeSaveV3} from '../src/game/persistence/save-v3.ts';
import {prepareLionGrant} from '../src/game/economy/lion-grant.ts';

test('a reward candidate joins a follow-up autosave started by another already-running drain before using its revision',async()=>{
 const state=migrateToV3(JSON.parse(readFileSync(new URL('./fixtures/lion-v2-golden.json',import.meta.url),'utf8')).state).value;
 let stored={format:2,generation:'overlapping-drain',revision:1,writtenAt:1,writer:'seed',payload:serializeSaveV3(state)},calls=0,serial=Promise.resolve(),releaseFirst,releaseSecond,enterFirst,enterSecond;
 const firstGate=new Promise(resolve=>releaseFirst=resolve),secondGate=new Promise(resolve=>releaseSecond=resolve),firstStarted=new Promise(resolve=>enterFirst=resolve),secondStarted=new Promise(resolve=>enterSecond=resolve);
 const backend={codec:LION_CHECKPOINT_CODEC,async read(){return structuredClone(stored);},commit(expected,payload,writer,writtenAt){
  const call=++calls;const work=serial.then(async()=>{if(call===1){enterFirst();await firstGate;}if(call===2){enterSecond();await secondGate;}if(expected!==stored.revision)throw new SaveFault('conflict');stored={...stored,revision:expected+1,payload,writer,writtenAt};return structuredClone(stored);});serial=work.catch(()=>{});return work;
 },close(){}};
 const save=createAutosave(backend,{writer:'single-actual-tab'});await save.load();await save.continueSaved();
 save.session.checkpoint(()=>state,true);const existingDrain=save.flush();await firstStarted;
 save.session.checkpoint(()=>state,true);const quote={command:state.economy.nextCommand},candidate=prepareLionGrant(state,quote);assert.ok(candidate.ok);
 const claim=save.session.commitCandidate(candidate.state,{tick:state.tick,command:quote.command});releaseFirst();await secondStarted;
 for(let step=0;step<8;step++)await Promise.resolve();const callsBeforeFollowUpCompleted=calls;
 releaseSecond();const [accepted]=await Promise.all([claim,existingDrain]);save.dispose();
 assert.equal(callsBeforeFollowUpCompleted,2,'The candidate must not submit a competing write while the second autosave owns the transaction queue');
 assert.ok(accepted);assert.equal(accepted.currency,state.currency+1800);assert.equal(save.view().phase,'saved');
 assert.equal(JSON.parse(stored.payload).ledger.filter(entry=>entry.id==='lion-savanna-grant-v1').length,1);
});
