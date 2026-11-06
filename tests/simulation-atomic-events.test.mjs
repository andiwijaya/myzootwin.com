import test from 'node:test';
import assert from 'node:assert/strict';
import {lionHome} from './fixtures/lion-home.mjs';
import {validateZooSave} from '../src/game/persistence/save.ts';

test('every domain notification exposes a fully valid shared tick, including visitors arriving during animal care and maintenance',()=>{
 const sim=lionHome({pride:true,enrichment:true}),failures=[],seen=new Set();
 sim.subscribe(event=>{if(event.type==='tick')return;seen.add(event.type);const result=validateZooSave(sim.snapshot());if(!result.ok)failures.push({event:event.type,tick:event.tick,path:result.path});});
 for(let i=0;i<2400&&failures.length===0;i++)sim.advance(100);
 assert.ok(validateZooSave(sim.snapshot()).ok,'Completed tick must also remain valid');
 assert.deepEqual(failures,[],'No observer or eager save may receive the earlier visitor position with the new tick');
 assert.ok(seen.has('economy-changed'));assert.ok(seen.has('animal-fed'));assert.ok(seen.has('animal-drank'));sim.dispose();
});
