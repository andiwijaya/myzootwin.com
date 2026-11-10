import test from 'node:test';import assert from 'node:assert/strict';
import {createSourceStress} from '../scripts/qa/visual3d/source-stress.ts';
import {createTimelineDriver} from '../scripts/qa/visual3d/timeline-driver.ts';
import {createFrameLoop} from '../src/game/render3d/frame-loop.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {zebraCodecFixture} from './helpers/zebra-v5-fixture.mjs';
import {validateSaveV5} from '../src/game/persistence/save-v5.ts';
test('bounded yielding QA batch forwards100ms through the sole actual V5 simulation loop at10x',async()=>{
 const state=zebraCodecFixture({population:4,resources:true}),sim=createSimulation(state),driver=createTimelineDriver({request(){assert.fail('No native clock in explicit recipe');},cancel(){}});driver.setMode('manual');sim.setSpeed(10);let failed;
 const loop=createFrameLoop(driver,t=>sim.frame(t),e=>failed=e);loop.start();driver.dispatchManual(0);let yields=0;
 const stress=createSourceStress({canRun:()=>!sim.inspect().disposed,dispatch:ms=>driver.dispatchManual(ms),tick:()=>sim.inspect().tick,yieldTask:async()=>{yields++;assert.equal(driver.inspect().pending,1);}});
 const r=await stress.run(100);assert.equal(r.delivered,100);assert.equal(r.after-r.before,1000);assert.equal(yields,100);assert.equal(r.cancelled,false);assert.equal(failed,undefined);assert.equal(validateSaveV5(sim.snapshot()).ok,true);assert.equal(driver.inspect().nativeDeliveries,0);assert.equal(driver.inspect().pending,1);loop.dispose();sim.dispose();driver.dispose();stress.dispose();assert.equal(driver.inspect().pending,0);
});
test('yield permits cancellation and refuses interleaving or unbounded recipes without extra time',async()=>{
 let ticks=0,can=true,stress;stress=createSourceStress({canRun:()=>can,dispatch:ms=>{assert.equal(ms,100);ticks+=10;return true;},tick:()=>ticks,yieldTask:async()=>{await assert.rejects(stress.run(),/sole manual10x/);stress.cancel();}});
 for(const n of [0,101,1.5])await assert.rejects(stress.run(n),/Bounded/);assert.equal(ticks,0);
 const r=await stress.run(100);assert.equal(r.delivered,1);assert.equal(r.after-r.before,10);assert.equal(r.cancelled,true);assert.equal(stress.inspect().busy,false);can=false;await assert.rejects(stress.run(),/sole manual10x/);stress.dispose();can=true;await assert.rejects(stress.run(),/sole manual10x/);
});
test('source pause between yielded callbacks stops batch and missing owner fails closed',async()=>{
 let ticks=0,can=true;const stress=createSourceStress({canRun:()=>can,dispatch:()=>{ticks+=10;return true;},tick:()=>ticks,yieldTask:async()=>{can=false;}});const r=await stress.run(100);assert.equal(r.delivered,1);assert.equal(r.cancelled,true);assert.equal(ticks,10);
 const missing=createSourceStress({canRun:()=>true,dispatch:()=>false,tick:()=>0,yieldTask:async()=>assert.fail('Missing callback must not yield credit')});await assert.rejects(missing.run(),/unavailable/);assert.equal(missing.inspect().busy,false);assert.equal(missing.inspect().last.delivered,0);
});
