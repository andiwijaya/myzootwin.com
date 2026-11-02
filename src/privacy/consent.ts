export const CONSENT_KEY = 'myzootwin.site.analytics.v1';
export type ConsentChoice = 'unknown' | 'allowed' | 'denied';
export type ConsentView = Readonly<{choice: ConsentChoice; phase: 'off' | 'starting' | 'on' | 'error'; fault: 'storage' | 'invalid' | 'load' | 'reload' | null; reloading: boolean}>;
export interface ConsentStorage {getItem(key: string): string | null; setItem(key: string, value: string): void}
export interface AnalyticsRuntime {start(): Promise<void>; stop(clearCookies: boolean): void}
export function parseConsent(raw: string | null): ConsentChoice {
  if (raw === null || raw.length > 256) return 'unknown';
  try {
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || Object.keys(value).sort().join(',') !== 'analytics,version' || value.version !== 1) return 'unknown';
    return value.analytics === 'allowed' || value.analytics === 'denied' ? value.analytics : 'unknown';
  } catch {return 'unknown';}
}
export function createConsent(options: {storage?: ConsentStorage; eligible: boolean; analytics: AnalyticsRuntime; reload: () => void; changed?: (view: ConsentView) => void}) {
  let choice: ConsentChoice = 'unknown', phase: ConsentView['phase'] = 'off', fault: ConsentView['fault'] = null;
  let generation = 0, attempted = false, touched = false, disposed = false, reloading = false;
  const view = (): ConsentView => Object.freeze({choice, phase, fault, reloading});
  const notify = () => options.changed?.(view());
  function off(clear: boolean) {
    generation++;
    if (attempted || clear) options.analytics.stop(clear);
    attempted = false; phase = 'off';
  }
  function reload() {reloading = true; notify(); if (disposed) return; try {options.reload();} catch {reloading = false; fault = 'reload'; notify();}}
  function start() {
    if (disposed || reloading || attempted || choice !== 'allowed' || !options.eligible) {notify(); return;}
    const token = ++generation; attempted = true; touched = true; phase = 'starting'; fault = null; notify();
    Promise.resolve().then(() => {
      if (disposed || token !== generation || choice !== 'allowed') return;
      return options.analytics.start();
    }).then(() => {if (!disposed && token === generation && choice === 'allowed') {phase = 'on'; notify();}}, () => {
      if (!disposed && token === generation) {phase = 'error'; fault = 'load'; notify();}
    });
  }
  function refresh(initial = false) {
    if (disposed || reloading) return;
    const previous = choice, wasAttempted = attempted;
    let raw: string | null = null;
    try {if (!options.storage) throw Error('storage'); raw = options.storage.getItem(CONSENT_KEY); choice = parseConsent(raw); fault = raw !== null && choice === 'unknown' ? 'invalid' : null;}
    catch {choice = 'unknown'; fault = 'storage';}
    if (choice === 'allowed') {
      if (initial) start();
      else if (!attempted && options.eligible) reload();
      else notify();
    } else {off(previous === 'allowed' || wasAttempted); if (touched && fault !== 'storage') reload(); else notify();}
  }
  function choose(next: 'allowed' | 'denied') {
    if (disposed || (next !== 'allowed' && next !== 'denied')) return false;
    if (reloading || (next === 'allowed' && choice === 'allowed' && (phase === 'on' || phase === 'starting'))) return true;
    const previous = choice, wasAttempted = attempted;
    // Stop first on withdrawal, even when preference persistence subsequently fails.
    if (next === 'denied') {off(previous === 'allowed' || wasAttempted); choice = 'denied';}
    const encoded = JSON.stringify({version: 1, analytics: next});
    try {
      if (!options.storage) throw Error('storage');
      options.storage.setItem(CONSENT_KEY, encoded);
      if (options.storage.getItem(CONSENT_KEY) !== encoded) throw Error('unverified write');
    } catch {off(false); if (next === 'allowed') choice = 'unknown'; fault = 'storage'; notify(); return false;}
    choice = next; fault = null;
    // A fresh document prevents third-party listeners/queues surviving a changed choice.
    if ((next === 'allowed' && options.eligible) || (next === 'denied' && touched)) reload(); else notify();
    return true;
  }
  refresh(true);
  return {view, choose, refresh: () => refresh(false), dispose() {if (disposed) return; disposed = true; off(false);}};
}
