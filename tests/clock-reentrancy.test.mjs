import test from 'node:test';
import assert from 'node:assert/strict';
import {createFixedClock} from '../src/game/core/fixed-clock.ts';
import {createSimulation} from '../src/game/core/simulation.ts';
import {validateSave} from '../src/game/persistence/save-v1.ts';

test('nested elapsed-time submissions during an atomic clock batch cannot mint ticks or alter its accounting at1x/10x',()=>{
 for(const speed of [1,10]){
  let clock,count=0,nested=[];
  clock=createFixedClock(()=>{count++;assert.equal(clock.isAdvancing(),true);nested.push(clock.advance(0),clock.advance(100));},speed);
  assert.equal(clock.advance(100),speed);assert.equal(count,speed);
  assert.ok(nested.every(x=>x===0));assert.equal(clock.inspect().accumulatorMs,0);
  assert.equal(clock.inspect().lastAdvanceSteps,speed);assert.equal(clock.inspect().droppedMs,0);
  assert.equal(clock.isAdvancing(),false);assert.equal(clock.advance(0),0);clock.dispose();
 }
});

test('nested future frame input cannot poison the next real frame anchor or change full simulation/events',()=>{
 for(const speed of [1,10]){
  const a=createSimulation(),b=createSimulation();a.setSpeed(speed);b.setSpeed(speed);
  let attempted=false,traceA=[],traceB=[];
  a.subscribe(e=>{traceA.push(structuredClone(e));if(e.type==='tick'&&!attempted){attempted=true;assert.equal(a.frame(1_000_000),0);assert.equal(a.advance(0),0);}});
  b.subscribe(e=>traceB.push(structuredClone(e)));
  for(const t of [0,100,200,217,240,300]){assert.equal(a.frame(t),b.frame(t));assert.deepEqual(a.snapshot(),b.snapshot());}
  assert.equal(a.inspect().tick,3*speed);assert.deepEqual(traceA,traceB);assert.equal(a.inspect().listenerErrors,0);
  assert.ok(validateSave(a.snapshot()).ok);a.dispose();b.dispose();
 }
});

test('a tick observer disposing the simulation ends a fast batch after the completed atomic tick and releases subscribers',()=>{
 const a=createSimulation(),b=createSimulation();a.setSpeed(10);b.setSpeed(10);let ticks=0;
 a.subscribe(e=>{if(e.type==='tick'){ticks++;a.dispose();}});
 assert.equal(a.advance(250),1);b.advance(10);assert.equal(ticks,1);assert.deepEqual(a.snapshot(),b.snapshot());
 const saved=a.snapshot();assert.equal(a.advance(250),0);assert.equal(a.frame(999_999),0);assert.deepEqual(a.snapshot(),saved);
 assert.equal(a.inspect().subscribers,0);assert.ok(a.inspect().disposed);assert.ok(validateSave(saved).ok);b.dispose();
});

test('pause/resume inside a clock callback discards pending catch-up without recursive steps or a locked batch',()=>{
 let c,steps=0;c=createFixedClock(()=>{steps++;if(steps===1){c.setPaused(true);c.setPaused(false);assert.equal(c.advance(250),0);}},10);
 assert.equal(c.advance(250),1);assert.equal(steps,1);assert.equal(c.inspect().accumulatorMs,0);assert.equal(c.isAdvancing(),false);
 assert.equal(c.advance(10),1);assert.equal(steps,2);c.dispose();
});

test('a failed clock step releases its non-reentrancy lock and can be explicitly reset or disposed',()=>{
 let fail=true,steps=0;const c=createFixedClock(()=>{if(fail)throw Error('bounded QA step failure');steps++;});
 assert.throws(()=>c.advance(100),/bounded QA/);assert.equal(c.isAdvancing(),false);c.reset();fail=false;
 assert.equal(c.advance(100),1);assert.equal(steps,1);c.dispose();assert.equal(c.advance(100),0);
});
