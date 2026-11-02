/** Original procedural ambience. No recording, network, microphone or external asset. */
export const AMBIENCE_RATE = 22050;
export const AMBIENCE_SECONDS = 8;
export function ambienceSamples() {
  const samples = new Float32Array(AMBIENCE_RATE * AMBIENCE_SECONDS);
  let seed = 613, smooth = 0;
  for (let i = 0; i < samples.length; i++) {
    const t = i / AMBIENCE_RATE;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    smooth = .94 * smooth + .06 * (seed / 4294967296 * 2 - 1);
    const edge = Math.min(1, t * 4, (AMBIENCE_SECONDS - t) * 4);
    let sound = smooth * .6 * (.8 + .2 * Math.sin(t * 1.2));
    for (const [start, duration, frequency, sweep] of [[1.1,.16,1650,1800],[1.36,.22,2400,-1300],[4.8,.2,1900,2100],[5.08,.26,2600,-1700]]) {
      const x = t - start;
      if (x >= 0 && x < duration) sound += .12 * Math.sin(Math.PI * x / duration) ** 2 * Math.sin(2 * Math.PI * (frequency * x + sweep * x * x));
    }
    samples[i] = Math.max(-1, Math.min(1, sound * edge));
  }
  return samples;
}
export type AmbienceStatus = 'muted' | 'waiting' | 'paused' | 'playing' | 'unavailable' | 'disposed';
export function createAmbience(options: {factory?: () => AudioContext; changed?: () => void} = {}) {
  let disposed = false, muted = true, allowed = false, unlocked = false, failed = false;
  let syncing = false, again = false, created = 0, closed = 0;
  type Graph = {context:AudioContext; source:AudioBufferSourceNode; gain:GainNode; analyser:AnalyserNode; stateChange:()=>void};
  let graph: Graph | undefined;
  const notify = () => { if (!disposed) options.changed?.(); };
  function release() {
    const old = graph; graph = undefined;
    if (!old) return;
    old.context.removeEventListener('statechange', old.stateChange);
    old.gain.gain.value = 0;
    try { old.source.stop(); } catch { /* Already stopped during browser interruption. */ }
    old.source.disconnect(); old.gain.disconnect(); old.analyser.disconnect();
    void old.context.close().then(() => { closed++; notify(); }).catch(() => { failed = true; notify(); });
  }
  function construct() {
    if (graph || disposed) return;
    let context:AudioContext|undefined;
    try {
      context = options.factory ? options.factory() : new AudioContext({latencyHint:'playback'});
      const source = context.createBufferSource(), gain = context.createGain(), analyser = context.createAnalyser();
      gain.gain.value = 0; analyser.fftSize = 512;
      const buffer = context.createBuffer(1, AMBIENCE_RATE * AMBIENCE_SECONDS, AMBIENCE_RATE);
      buffer.copyToChannel(ambienceSamples(), 0); source.buffer = buffer; source.loop = true;
      source.connect(gain); gain.connect(analyser); analyser.connect(context.destination);
      const stateChange = () => notify();
      graph = {context,source,gain,analyser,stateChange}; created++; failed = false;
      context.addEventListener('statechange',stateChange); source.start();
    } catch {
      failed = true;
      if (graph) release(); else if (context) void context.close().catch(() => {});
    }
  }
  async function reconcile() {
    again = true;
    if (syncing) return;
    syncing = true;
    try {
      while (again && !disposed) {
        again = false;
        const current = graph;
        if (!current) break;
        const audible = allowed && !muted && unlocked;
        current.gain.gain.value = audible ? .18 : 0;
        try {
          if (audible && current.context.state !== 'running') await current.context.resume();
          else if (!audible && current.context.state === 'running') await current.context.suspend();
          if (graph === current) failed = false;
        } catch { if (graph === current) { failed = true; current.gain.gain.value = 0; } }
        if (graph === current && audible !== (allowed && !muted && unlocked)) again = true;
      }
    } finally { syncing = false; notify(); }
  }
  function status(): AmbienceStatus {
    if (disposed) return 'disposed';
    if (muted) return 'muted';
    if (failed) return 'unavailable';
    if (!unlocked || !graph) return 'waiting';
    if (!allowed) return 'paused';
    return graph.context.state === 'running' ? 'playing' : 'waiting';
  }
  return {
    setMuted(value:boolean) { if (disposed || value === muted) return; muted = value; if(muted && graph)graph.gain.gain.value=0; void reconcile(); },
    setPlaying(value:boolean) { if (disposed || value === allowed) return; allowed = value; if(!allowed && graph)graph.gain.gain.value=0; void reconcile(); },
    /** Invoke only from a trusted user click/keyboard activation; never on load or Continue hydration. */
    gesture() { if (disposed || muted) return; unlocked = true; construct(); void reconcile(); },
    stopSession() { if(disposed)return;allowed=false;unlocked=false;release();notify(); },
    dispose() { if(disposed)return;disposed=true;allowed=false;release(); },
    inspect() {
      const values = new Float32Array(512);
      if(graph)graph.analyser.getFloatTimeDomainData(values);
      const rms = Math.sqrt(values.reduce((sum,value)=>sum+value*value,0)/values.length);
      return {status:status(),muted,allowed,unlocked,contextState:graph?.context.state??'absent',contextsCreated:created,contextsClosed:closed,liveContexts:graph?1:0,liveNodes:graph?3:0,looping:graph?.source.loop??false,gain:graph?.gain.gain.value??0,signalRms:rms,analyserSampleActive:graph?.context.state==='running',disposed,failed};
    },
  };
}
