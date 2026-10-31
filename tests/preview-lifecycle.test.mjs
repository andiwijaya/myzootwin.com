import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameLoop } from '../src/game/render3d/frame-loop.ts';
import { createPreviewController, PreviewFailure } from '../src/game/render3d/preview-controller.ts';

function driver() {
  let next = 0;
  const pending = new Map();
  return { pending, request(fn) { const id = ++next; pending.set(id, fn); return id; }, cancel(id) { pending.delete(id); }, fire(id) { const fn = pending.get(id); pending.delete(id); fn?.(100); } };
}
function deferred() { let resolve; let reject; const promise = new Promise((a,b) => { resolve=a; reject=b; }); return { promise, resolve, reject }; }

test('RAF start is idempotent and stale cancelled callbacks cannot duplicate a restarted loop', () => {
  const frames = driver(); let draws = 0;
  const loop = createFrameLoop(frames, () => draws++, () => assert.fail('unexpected error'));
  loop.start(); loop.start(); assert.equal(frames.pending.size,1);
  const [oldId, old] = [...frames.pending][0];
  loop.stop(); loop.start(); old(5);
  assert.equal(frames.pending.has(oldId),false);
  assert.equal(frames.pending.size,1); assert.equal(draws,0);
  frames.fire([...frames.pending.keys()][0]);
  assert.equal(draws,1); assert.equal(frames.pending.size,1);
  loop.dispose(); assert.equal(frames.pending.size,0);
});

test('disposed RAF loop cannot render or restart', () => {
  const frames=driver(); let draws=0;
  const loop=createFrameLoop(frames,()=>draws++,()=>{});
  loop.start(); const callback=[...frames.pending.values()][0]; loop.dispose(); callback(1); loop.start();
  assert.equal(draws,0); assert.equal(frames.pending.size,0); assert.equal(loop.inspect().disposed,true);
});

test('render exceptions stop the RAF chain and report once', () => {
  const frames=driver(); let errors=0;
  const loop=createFrameLoop(frames,()=>{throw Error('render');},()=>errors++);
  loop.start(); frames.fire([...frames.pending.keys()][0]); loop.start();
  assert.equal(errors,1); assert.equal(frames.pending.size,0);
});

test('request failures become an explicit stopped error', () => {
  let errors=0;
  const loop=createFrameLoop({request(){throw Error('request');},cancel(){}},()=>{},()=>errors++);
  loop.start(); assert.equal(errors,1); assert.equal(loop.inspect().pendingFrames,0);
});

test('lazy session opens once, closes once, and can reopen without overlap', async () => {
  const load=deferred(); let loads=0, mounts=0, active=0, disposed=0;
  const states=[];
  const controller=createPreviewController(()=>{loads++;return load.promise;},s=>states.push(s.status));
  assert.equal(loads,0);
  const first=controller.open(); await controller.open(); assert.equal(loads,1);
  load.resolve(()=>{mounts++;active++;let done=false;return {dispose(){if(!done){done=true;active--;disposed++;}}};});
  await first; assert.equal(controller.getState().status,'ready'); assert.equal(active,1);
  controller.close(); controller.close(); assert.equal(disposed,1); assert.equal(active,0);
  await controller.open(); assert.equal(mounts,2); assert.equal(active,1);
  controller.dispose(); await controller.open(); assert.equal(active,0); assert.equal(disposed,2);
  assert.deepEqual(states.slice(0,3),['closed','loading','ready']);
});

test('closing during import prevents a late mount and ready transition', async () => {
  const load=deferred();let mounts=0;
  const controller=createPreviewController(()=>load.promise,()=>{});
  const opening=controller.open(); controller.close(); load.resolve(()=>{mounts++;return {dispose(){}};});await opening;
  assert.equal(mounts,0);assert.equal(controller.getState().status,'closed');
});

test('a failed lazy load is visible and a later attempt can recover', async () => {
  let attempt=0;
  const controller=createPreviewController(async()=>{if(++attempt===1)throw Error('network');return ()=>({dispose(){}});},()=>{});
  await controller.open();assert.deepEqual(controller.getState(),{status:'error',reason:'load'});
  await controller.open();assert.equal(controller.getState().status,'ready');assert.equal(attempt,2);controller.dispose();
});

test('unsupported WebGL has its own fallback and retry state', async () => {
  let attempt=0;
  const controller=createPreviewController(async()=>()=>{if(++attempt===1)throw new PreviewFailure('unsupported');return {dispose(){}};},()=>{});
  await controller.open();assert.equal(controller.getState().status,'unsupported');
  await controller.open();assert.equal(controller.getState().status,'ready');controller.dispose();
});

test('initialization exceptions do not become false ready states', async () => {
  const controller=createPreviewController(async()=>()=>{throw Error('init');},()=>{});
  await controller.open();assert.deepEqual(controller.getState(),{status:'error',reason:'init'});controller.dispose();
});

test('context loss disposes the active session once and supports a fresh retry', async () => {
  let fault;let active=0,disposed=0;
  const controller=createPreviewController(async()=>onFailure=>{fault=onFailure;active++;let done=false;return {dispose(){if(!done){done=true;active--;disposed++;}}};},()=>{});
  await controller.open();const stale=fault;fault('context-lost');stale('render');
  assert.deepEqual(controller.getState(),{status:'error',reason:'context-lost'});assert.equal(active,0);assert.equal(disposed,1);
  await controller.open();stale('context-lost');assert.equal(controller.getState().status,'ready');assert.equal(active,1);
  controller.dispose();assert.equal(active,0);assert.equal(disposed,2);
});

test('synchronous failure while mounting still disposes the late-created session', async () => {
  let disposals=0;
  const controller=createPreviewController(async()=>fault=>{fault('render');return {dispose(){disposals++;}};},()=>{});
  await controller.open();assert.deepEqual(controller.getState(),{status:'error',reason:'render'});assert.equal(disposals,1);
});

test('pause state is applied to newly loaded sessions without changing lifecycle status', async () => {
  const changes=[];
  const controller=createPreviewController(async()=>()=>({dispose(){},setPaused(value){changes.push(value);}}),()=>{});
  controller.setPaused(true);await controller.open();controller.setPaused(false);
  assert.deepEqual(changes,[true,false]);assert.equal(controller.getState().status,'ready');controller.dispose();
});

test('disposing a pending import prevents later renderer creation', async () => {
  const load=deferred();let mounts=0;
  const controller=createPreviewController(()=>load.promise,()=>{});
  const opening=controller.open();controller.dispose();load.resolve(()=>{mounts++;return {dispose(){}};});await opening;
  assert.equal(mounts,0);assert.equal(controller.getState().status,'closed');
});
