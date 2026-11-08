/** Match the production deferred checkpoint contract instead of eagerly parsing a save per event.
 * Readers must return owned snapshots, as the real simulation.snapshot does. Trace/inspection
 * consumes the most recent reader once; no extra clock, cache mutation or stale tick projection.
 */
export function createQaSnapshotObserver<State>(initial:State){
 let value=structuredClone(initial),queued:(()=>State)|undefined,reads=0,writes=0,queuedCalls=0;
 return {checkpoint(reader:()=>State){queued=reader;queuedCalls++;},write(snapshot:State){value=structuredClone(snapshot);queued=undefined;writes++;},read(){if(queued){const next=queued();queued=undefined;value=next;reads++;}return value;},inspect:()=>({queued:!!queued,reads,writes,queuedCalls,scope:'Deferred QA observation. Source snapshot reader is consumed once per trace tick or explicit inspection, not once per event.'})};
}
