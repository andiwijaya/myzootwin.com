const percentile=(values,fraction)=>{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);return sorted[Math.ceil(sorted.length*fraction)-1];};
export function createFrameMetrics(capacity=300) {
  if(!Number.isInteger(capacity)||capacity<2||capacity>1000)throw RangeError('Invalid metrics capacity');
  let durations=[],intervals=[],previous=null,callbacks=0;
  return {
    record(timestamp,cpuMs) {
      if(!Number.isFinite(timestamp)||timestamp<0||!Number.isFinite(cpuMs)||cpuMs<0)throw RangeError('Invalid measurement');
      if(previous!==null&&timestamp<previous)throw RangeError('Backwards measurement');
      if(previous!==null&&timestamp>previous){intervals.push(timestamp-previous);if(intervals.length>capacity)intervals.shift();}
      previous=timestamp;callbacks++;durations.push(cpuMs);if(durations.length>capacity)durations.shift();
    },
    reset(){durations=[];intervals=[];previous=null;callbacks=0;},
    summary(){const elapsed=intervals.reduce((a,b)=>a+b,0);return {kind:'RAF callback intervals and synchronous JS/core/render-submit duration; NOT presented FPS or GPU time',callbacksObserved:callbacks,retainedIntervals:intervals.length,retainedCpuSamples:durations.length,capacity,retainedWindowMs:elapsed,callbackHz:elapsed>0?1000*intervals.length/elapsed:null,intervalP50Ms:percentile(intervals,.5),intervalP95Ms:percentile(intervals,.95),cpuP50Ms:percentile(durations,.5),cpuP95Ms:percentile(durations,.95),actualPresentationFPS:'UNMEASURED'};},
  };
}
export function legacyMemory(memory) {
  if(!memory||![memory.usedJSHeapSize,memory.totalJSHeapSize,memory.jsHeapSizeLimit].every(n=>Number.isFinite(n)&&n>=0))return {status:'UNAVAILABLE',reason:'Non-standard performance.memory is absent or invalid; no GC/permission/header changes attempted'};
  return {status:'OBSERVED_NONSTANDARD',usedJSHeapSize:memory.usedJSHeapSize,totalJSHeapSize:memory.totalJSHeapSize,jsHeapSizeLimit:memory.jsHeapSizeLimit,note:'Potentially shared/quantized JS heap estimate; not tab-exclusive retained memory, GPU bytes or a leak proof'};
}

export function probeStatus({callbacks,active,visible,elapsedMs}) {
  return callbacks>=20&&active&&visible&&elapsedMs>=4900?'COMPLETE':'INSUFFICIENT_CALLBACKS_OR_INACTIVE';
}
