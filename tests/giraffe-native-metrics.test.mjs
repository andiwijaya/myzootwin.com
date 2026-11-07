import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNativeGiraffeMetrics} from '../scripts/qa/giraffe-native-metrics.ts';

test('native soak instrumentation forwards the existing RAF unchanged, owns no extra chain, bounds observations and requires both real wall time and9000valid1x ticks',t=>{
 const originalRequest=globalThis.requestAnimationFrame,originalCancel=globalThis.cancelAnimationFrame;let callback,clock=1000,cancelled=0;
 globalThis.requestAnimationFrame=cb=>{callback=cb;return 17;};globalThis.cancelAnimationFrame=id=>{assert.equal(id,17);cancelled++;};
 t.after(()=>{globalThis.requestAnimationFrame=originalRequest;globalThis.cancelAnimationFrame=originalCancel;});t.mock.method(performance,'now',()=>clock);
 Object.defineProperty(globalThis,'document',{value:{visibilityState:'visible'},configurable:true});t.after(()=>delete globalThis.document);
 const metrics=createNativeGiraffeMetrics(),view={simulationTick:100,simulationSpeed:1,simulationPaused:true};metrics.bind(()=>view);
 assert.equal(metrics.start(),false);view.simulationPaused=false;assert.equal(metrics.start(),true);assert.equal(metrics.start(),false);
 metrics.frames.request(time=>{assert.equal(time,42.25);clock+=5;});callback(42.25);
 const first=metrics.report();assert.equal(first.callbacks,1);assert.equal(first.callbackCpu.meanMs,5);assert.equal(first.pending,0);assert.equal(first.maxPending,1);
 view.simulationTick=9100;assert.notEqual(metrics.report().status,'ACTIVE_TARGET_REACHED');clock=901000;assert.equal(metrics.report().status,'ACTIVE_TARGET_REACHED');
 const state=JSON.parse(readFileSync(new URL('./fixtures/giraffe-v4-golden.json',import.meta.url))).state;state.preferences.speed=10;state.tick=9100;metrics.note(state);assert.notEqual(metrics.report().status,'ACTIVE_TARGET_REACHED');
 metrics.frames.request(()=>{});metrics.frames.cancel(17);assert.equal(cancelled,1);metrics.stop();assert.equal(metrics.report().pending,0);assert.equal(metrics.start(),false);
});
