export type PreviewFailureKind = 'unsupported' | 'load' | 'init' | 'context-lost' | 'render';
export type PreviewState =
  | { status: 'closed' | 'loading' | 'ready' }
  | { status: 'unsupported' }
  | { status: 'error'; reason: Exclude<PreviewFailureKind, 'unsupported'> };

export class PreviewFailure extends Error {
  readonly kind: PreviewFailureKind;
  constructor(kind: PreviewFailureKind) { super(kind); this.name = 'PreviewFailure'; this.kind = kind; }
}

export interface PreviewSession {
  dispose(): void;
  setPaused?(paused: boolean): void;
  inspect?(): Record<string, number | boolean>;
}

export type PreviewFactory = (onFailure: (kind: PreviewFailureKind) => void) => PreviewSession;
export type PreviewLoader = () => Promise<PreviewFactory>;

/** Owns exactly one session, including cancellation of late lazy-load results. */
export function createPreviewController(load: PreviewLoader, onState: (state: PreviewState) => void) {
  let state: PreviewState = { status: 'closed' };
  let session: PreviewSession | undefined;
  let generation = 0;
  let disposed = false;
  let paused = false;

  function emit(next: PreviewState) { state = next; onState(next); }
  function release() { const old = session; session = undefined; old?.dispose(); }
  function fail(token: number, kind: PreviewFailureKind) {
    if (disposed || token !== generation) return;
    generation++;
    release();
    emit(kind === 'unsupported' ? { status: 'unsupported' } : { status: 'error', reason: kind });
  }

  function close() {
    generation++;
    release();
    emit({ status: 'closed' });
  }

  onState(state);
  return {
    async open() {
      if (disposed || state.status === 'loading' || state.status === 'ready') return;
      const token = ++generation;
      release();
      emit({ status: 'loading' });
      let factory: PreviewFactory;
      try { factory = await load(); }
      catch { fail(token, 'load'); return; }
      if (disposed || token !== generation) return;
      try {
        const created = factory((kind) => fail(token, kind));
        if (disposed || token !== generation) { created.dispose(); return; }
        session = created;
        session.setPaused?.(paused);
        emit({ status: 'ready' });
      } catch (error) {
        fail(token, error instanceof PreviewFailure ? error.kind : 'init');
      }
    },
    close,
    setPaused(value: boolean) { paused = value; session?.setPaused?.(value); },
    dispose() { if (disposed) return; close(); disposed = true; },
    getState: () => state,
    inspectSession: () => session?.inspect?.(),
  };
}
