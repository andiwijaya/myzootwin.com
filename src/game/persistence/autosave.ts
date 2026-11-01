import { createInitialState } from '../core/initial-state.ts';
import { generationOf } from './checkpoint.ts';
import type { ZooSaveV1 } from '../core/state.ts';
import type { SanctuarySessionState } from '../core/session-state.ts';
import type { EditorState } from '../world/editing.ts';
import { SaveFault, checkedCheckpoint, stateFromCheckpoint, encodeCheckpointState, type RecoveryInspection, type DurableBackend, type StoredCheckpoint, type StorageFault } from './durable-backend.ts';
export const AUTOSAVE_DELAY_MS = 2000;
export type SavePhase = 'loading' | 'empty' | 'available' | 'dirty' | 'saving' | 'saved' | 'unavailable' | 'unreadable' | 'error' | 'conflict';
export interface SaveView {
    phase: SavePhase;
    active: boolean;
    hasSave: boolean;
    revision: number;
    savedTick: number | null;
    savedAt: number | null;
    savedCurrency: number | null;
    savedMissions: number | null;
    savedBirds: number | null;
    fault: StorageFault | null;
    generation: string;
    recovery: RecoveryInspection | null;
    recoveryBusy: boolean;
}
interface Options {
    writer: string;
    now?: () => number;
    schedule?: (fn: () => void, ms: number) => unknown;
    cancel?: (id: unknown) => void;
    changed?: (view: SaveView) => void;
    committed?: (revision: number, generation: string) => void;
}
/** Single bounded timer + one in-flight write + latest reader. No simulation/render scheduling. */
export function createAutosave(backend: DurableBackend, options: Options) {
    const now = options.now ?? Date.now, schedule = options.schedule ?? ((f, ms) => setTimeout(f, ms)), cancel = options.cancel ?? (id => clearTimeout(id as ReturnType<typeof setTimeout>));
    let phase: SavePhase = 'loading', active = false, record: StoredCheckpoint | null = null, data: ZooSaveV1 | undefined, editor: EditorState | undefined, revision = 0, savedTick: number | null = null, savedAt: number | null = null, savedCurrency: number | null = null, savedMissions: number | null = null, savedBirds: number | null = null, error: StorageFault | null = null, disposed = false, closing = false, storageReady = false, dirty = false, reader: (() => ZooSaveV1) | undefined, timer: unknown, pendingCritical = false, inflight: Promise<void> | undefined, loadSerial = 0;
    const view = (): SaveView => ({ phase, active, hasSave: Boolean(record), revision, savedTick, savedAt, savedCurrency, savedMissions, savedBirds, fault: error, generation: generationOf(record), recovery, recoveryBusy });
    let recovery: RecoveryInspection | null = null, recoveryBusy = false;
    let previous = '';
    const notify = () => {
        if (disposed)
            return;
        const v = view(), key = JSON.stringify(v);
        if (key !== previous) {
            previous = key;
            options.changed?.(v);
        }
    };
    const stopTimer = () => {
        if (timer !== undefined) {
            cancel(timer);
            timer = undefined;
        }
    };
    const failed = (e: unknown) => { error = e instanceof SaveFault ? e.code : 'write'; phase = error === 'conflict' ? 'conflict' : error === 'unreadable' ? 'unreadable' : 'error'; stopTimer(); notify(); };
    const requiresTransition = () => Boolean(recovery && recovery.kind !== 'none');
    const blocked = () => disposed || recoveryBusy || phase === 'conflict' || phase === 'unreadable';
    function queue(critical = false) {
        if (closing || blocked() || !storageReady || phase === 'error')
            return;
        if (inflight)
            return;
        if (timer !== undefined && !critical)
            return;
        stopTimer();
        timer = schedule(() => { timer = undefined; void flush(); }, critical ? 0 : AUTOSAVE_DELAY_MS);
    }
    async function flush() {
        stopTimer();
        if (blocked() || phase === 'error' || !storageReady || !active || !dirty || !reader)
            return;
        if (inflight)
            return inflight;
        let payload: string, snapshot: ZooSaveV1;
        try {
            snapshot = reader();
            payload = encodeCheckpointState(snapshot);
            data = structuredClone(snapshot);
        }
        catch (e) {
            failed(e);
            return;
        }
        dirty = false;
        pendingCritical = false;
        phase = 'saving';
        error = null;
        notify();
        inflight = (async () => {
            try {
                const next = checkedCheckpoint(await backend.commit(revision, payload, options.writer, now()));
                const conflicted = view().phase === 'conflict';
                record = next;
                revision = next.revision;
                savedTick = snapshot.tick;
                savedAt = next.writtenAt;
                savedCurrency = snapshot.currency;
                savedMissions = snapshot.missions.completedIds.length;
                savedBirds = snapshot.animals.filter(a => a.habitatId !== null).length;
                phase = conflicted ? 'conflict' : dirty ? 'dirty' : 'saved';
                // A closed BroadcastChannel must never turn a committed checkpoint into a write failure.
                try {
                    options.committed?.(revision, generationOf(record));
                }
                catch { /* CAS remains authoritative; notification is best effort. */ }
            }
            catch (e) {
                dirty = true;
                failed(e);
            }
            finally {
                inflight = undefined;
                notify();
                if (dirty && !blocked())
                    queue(pendingCritical);
            }
        })();
        return inflight;
    }
    async function drain() {
        await flush();
        if (dirty && !blocked() && phase !== 'error' && storageReady)
            await flush();
    }
    async function load() {
        if (active || disposed)
            return;
        const serial = ++loadSerial;
        phase = 'loading';
        error = null;
        notify();
        try {
            const found = await backend.read();
            if (disposed || serial !== loadSerial)
                return;
            record = found ? checkedCheckpoint(found) : null;
            revision = record?.revision ?? 0;
            savedAt = record?.writtenAt ?? null;
            const loaded = record ? stateFromCheckpoint(record) : null;
            savedTick = loaded?.tick ?? null;
            savedCurrency = loaded?.currency ?? null;
            savedMissions = loaded?.missions.completedIds.length ?? null;
            savedBirds = loaded?.animals.filter(a => a.habitatId !== null).length ?? null;
            storageReady = true;
            recovery = backend.inspectRecovery ? await backend.inspectRecovery() : null;
            phase = record ? 'available' : 'empty';
        }
        catch (e) {
            if (disposed || serial !== loadSerial)
                return;
            error = e instanceof SaveFault ? e.code : 'unavailable';
            storageReady = false;
            phase = error === 'unreadable' ? 'unreadable' : 'unavailable';
            record = null;
            revision = 0;
            savedTick = savedAt = savedCurrency = savedMissions = savedBirds = null;
            recovery = null;
            if (error === 'unreadable' && backend.inspectRecovery) {
                try {
                    recovery = await backend.inspectRecovery();
                }
                catch { /* Read failure cannot justify an overwrite. */ }
            }
        }
        notify();
    }
    const session: SanctuarySessionState = { read: () => data ? structuredClone(data) : undefined, write(value) { data = structuredClone(value); }, readEditor: () => editor ? structuredClone(editor) : undefined, writeEditor(value) { editor = structuredClone(value); }, checkpoint(next, critical = false) {
            if (!active || closing || blocked())
                return;
            reader = next;
            dirty = true;
            pendingCritical ||= critical;
            if (storageReady && phase !== 'error' && phase !== 'saving')
                phase = 'dirty';
            notify();
            queue(critical);
        }, flush: () => { void drain(); } };
    return { session, view, load, flush: drain, savedLocale: () => record ? stateFromCheckpoint(record).preferences.locale : undefined, canOpen: () => !blocked() && phase !== 'loading' && !requiresTransition() && (active || !record),
        startNew(locale: 'en' | 'id') {
            if (blocked() || phase === 'loading' || record || active || requiresTransition())
                return false;
            data = createInitialState();
            data.preferences.locale = locale;
            editor = undefined;
            active = true;
            reader = () => structuredClone(data!);
            dirty = true;
            if (storageReady)
                phase = 'dirty';
            notify();
            queue(true);
            return true;
        },
        async continueSaved() {
            if (blocked() || phase === 'loading' || disposed)
                return false;
            if (active)
                return true;
            await load();
            if (!record || blocked() || phase === 'unavailable' || requiresTransition())
                return false;
            data = stateFromCheckpoint(record);
            editor = undefined;
            active = true;
            reader = () => structuredClone(data!);
            phase = 'saved';
            notify();
            return true;
        },
        async retry() {
            if (blocked() && phase !== 'unreadable')
                return;
            if (!active) {
                await load();
                return;
            }
            if (!storageReady) {
                try {
                    const old = await backend.read();
                    if (old) {
                        failed(new SaveFault('conflict'));
                        return;
                    }
                    storageReady = true;
                    revision = 0;
                    phase = 'dirty';
                    error = null;
                }
                catch (e) {
                    failed(e);
                    return;
                }
            }
            else if (phase === 'error') {
                phase = 'dirty';
                error = null;
            }
            await flush();
        },
        async reviewRecovery() {
            if (disposed || recoveryBusy || !backend.inspectRecovery)
                return null;
            try {
                recovery = await backend.inspectRecovery();
                if (recovery.kind === 'none') {
                    if (active)
                        failed(new SaveFault('conflict'));
                    else
                        await load();
                }
                notify();
                return recovery;
            }
            catch (e) {
                failed(e);
                return null;
            }
        },
        async recover(quote: string) {
            if (disposed || recoveryBusy || !backend.transition || quote !== recovery?.quote)
                return false;
            recoveryBusy = true;
            notify();
            try {
                const restored = await backend.transition(quote, options.writer, now());
                record = restored;
                revision = restored.revision;
                active = false;
                dirty = false;
                reader = undefined;
                data = undefined;
                editor = undefined;
                storageReady = false;
                stopTimer();
                try {
                    options.committed?.(revision, generationOf(restored));
                }
                catch { /* Optional notification. */ }
                recoveryBusy = false;
                await load();
                return phase === 'available';
            }
            catch (e) {
                recoveryBusy = false;
                failed(e);
                return false;
            }
        },
        exportRecoveryCopy: () => backend.exportPreserved ? backend.exportPreserved() : Promise.reject(new SaveFault('unavailable')),
        externalRevision(next: number, generation?: string) {
            if (disposed || !Number.isSafeInteger(next) || (next <= revision && (!generation || generation === generationOf(record))))
                return;
            if (active)
                failed(new SaveFault('conflict'));
            else
                void load();
        },
        dispose() {
            if (disposed || closing)
                return;
            closing = true;
            stopTimer();
            void (async () => {
                await flush();
                if (dirty && !blocked() && storageReady)
                    await flush();
                disposed = true;
                stopTimer();
                backend.close();
            })();
        }, inspect: () => ({ ...view(), dirty, pendingTimer: timer !== undefined, inflight: Boolean(inflight), storageReady, disposed }), };
}
