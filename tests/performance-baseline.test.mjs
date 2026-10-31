import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameMetrics, legacyMemory, probeStatus, isRenderProbeActive } from './browser/frame-metrics.mjs';
import { analysisMatches } from '../scripts/qa/payload.mjs';

test('baseline reports callback/JS-submit statistics without promoting them to presentation FPS',()=>{
  const metrics=createFrameMetrics(3);[0,10,20,30,40].forEach(time=>metrics.record(time,2));const result=metrics.summary();
  assert.equal(result.callbacksObserved,5);assert.equal(result.retainedIntervals,3);assert.equal(result.retainedCpuSamples,3);assert.equal(result.callbackHz,100);assert.equal(result.cpuP95Ms,2);assert.equal(result.actualPresentationFPS,'UNMEASURED');
});
test('baseline collector rejects invalid/backward samples and reset discards the preceding window',()=>{
  const metrics=createFrameMetrics();metrics.record(10,1);for(const [time,cpu] of [[9,1],[NaN,1],[20,-1],[20,Infinity]])assert.throws(()=>metrics.record(time,cpu));metrics.reset();assert.equal(metrics.summary().callbacksObserved,0);assert.equal(metrics.summary().callbackHz,null);
});
test('unsupported memory remains unavailable and supported heap numbers retain their uncertainty label',()=>{
  assert.equal(legacyMemory(undefined).status,'UNAVAILABLE');assert.equal(legacyMemory({usedJSHeapSize:NaN,totalJSHeapSize:1,jsHeapSizeLimit:2}).status,'UNAVAILABLE');const data=legacyMemory({usedJSHeapSize:2,totalJSHeapSize:3,jsHeapSizeLimit:4});assert.equal(data.status,'OBSERVED_NONSTANDARD');assert.ok(data.note.includes('not tab-exclusive'));
});
test('payload baseline refuses stale module-analysis bytes for the current built chunks',()=>{
  const entries=new Map([['_astro/foundation.js',{sha256:'fresh'}]]);assert.equal(analysisMatches({chunks:[{fileName:'_astro/foundation.js',sha256:'fresh'}]},entries),true);assert.equal(analysisMatches({chunks:[{fileName:'_astro/foundation.js',sha256:'old'}]},entries),false);assert.equal(analysisMatches({chunks:[]},entries),false);
});

test('probe collection cannot finish successfully while closed, paused, hidden or too short',()=>{
  const valid={callbacks:100,active:true,visible:true,elapsedMs:5000};assert.equal(probeStatus(valid),'COMPLETE');
  for(const change of [{active:false},{visible:false},{elapsedMs:100},{callbacks:0}])assert.notEqual(probeStatus({...valid,...change}),'COMPLETE');
});

test('renderer callback eligibility accepts an active model with paused world but rejects stopped/disposed/unready renderers',()=>{assert.equal(isRenderProbeActive('ready',{pendingFrames:1,disposed:false,simulationPaused:true,macawStudioActive:true}),true);assert.equal(isRenderProbeActive('ready',{pendingFrames:1,disposed:false,simulationPaused:false}),true);for(const [status,session]of [['ready',{pendingFrames:0,disposed:false}],['ready',{pendingFrames:1,disposed:true}],['closed',{pendingFrames:1,disposed:false}],['ready',undefined]])assert.equal(isRenderProbeActive(status,session),false);});
