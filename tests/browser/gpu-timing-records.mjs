/** QA-only summaries. GPU elapsed/RAF cadence are never converted to presentation FPS. */
export function timingStats(values) {
  const ordered=values.filter(x=>Number.isFinite(x)&&x>=0).sort((a,b)=>a-b),p=f=>ordered.length?ordered[Math.ceil(ordered.length*f)-1]:null;
  return {samples:ordered.length,p50Ms:p(.5),p95Ms:p(.95),maxMs:ordered.at(-1)??null};
}
export function summarizeGpuRecords(rows,{start,end,disjoint=0,overflow=false,counterBits=0,glError=0}={}) {
  const submitted=rows.filter(x=>x.submittedAt>=start&&x.submittedAt<end),valid=submitted.filter(x=>x.completedAt!==null&&Number.isSafeInteger(x.nanoseconds)&&x.nanoseconds>=0);
  const invalid=disjoint>0||overflow||counterBits<=0||glError!==0;
  const stats=items=>invalid?{samples:0,p50Ms:null,p95Ms:null,maxMs:null}:timingStats(items.map(x=>x.nanoseconds/1e6));
  return {status:invalid?'INVALID_OR_UNAVAILABLE':valid.length?'OBSERVED_GPU_ELAPSED':'NO_COMPLETED_RESULTS',counterBits,disjoint,overflow,glError,submitted:submitted.length,completed:valid.length,pending:submitted.filter(x=>x.completedAt===null).length,invalidValues:submitted.filter(x=>x.completedAt!==null&&!valid.includes(x)).length,
    all:stats(valid),rafOnly:stats(valid.filter(x=>x.kind==='raf')),cameraOnly:stats(valid.filter(x=>x.kind==='camera')),replayOnly:stats(valid.filter(x=>x.kind==='replay')),
    legacyRetained:stats(valid.filter(x=>x.completedWhileCollecting).slice(-300)),legacyExcludedLate:valid.filter(x=>!x.completedWhileCollecting).length,
    legacyNote:'Same current-window rows: completion while collecting and last300 emulate old retention only; not the denied historical build or a full old-probe A/B.',presentationFPS:'UNMEASURED'};
}
