import { parseSave } from './save-v1.ts';
import { SaveFault, checkedCheckpoint, inspectCheckpoint, stateFromCheckpoint, encodeCheckpointState, generationOf, summarize, rawSignature, type StorageFault, type StoredCheckpoint, type CheckpointProblem, type CheckpointSummary } from './checkpoint.ts';
export { SaveFault, checkedCheckpoint, stateFromCheckpoint, encodeCheckpointState };
export type { StoredCheckpoint, StorageFault };
export const SAVE_DATABASE = 'myzootwin-progress-v1', SAVE_STORE = 'checkpoints';
export interface RecoveryInspection {
    kind: 'none' | 'migrate' | 'restore' | 'blocked';
    problem: CheckpointProblem | null;
    quote: string | null;
    source: CheckpointSummary | null;
    hasPreserved: boolean;
}
export interface DurableBackend {
    read(): Promise<StoredCheckpoint | null>;
    commit(expected: number, payload: string, writer: string, writtenAt: number): Promise<StoredCheckpoint>;
    inspectRecovery?(): Promise<RecoveryInspection>;
    transition?(quote: string, writer: string, writtenAt: number): Promise<StoredCheckpoint>;
    exportPreserved?(): Promise<string>;
    close(): void;
}
const fault = (e: unknown): SaveFault => e instanceof SaveFault ? e : new SaveFault(e instanceof DOMException && e.name === 'QuotaExceededError' ? 'quota' : e instanceof DOMException && e.name === 'VersionError' ? 'unreadable' : 'unavailable');
export function createIndexedDbBackend(factory: IDBFactory | undefined, database = SAVE_DATABASE): DurableBackend {
    let connection: IDBDatabase | undefined, opening: Promise<IDBDatabase> | undefined, closed = false, observedGeneration = 'empty';
    let quoted: {
        id: string;
        kind: 'migrate' | 'restore';
        primary: string;
        previous: string;
        source: StoredCheckpoint;
    } | undefined;
    function open(): Promise<IDBDatabase> {
        if (closed || !factory)
            return Promise.reject(new SaveFault('unavailable'));
        if (connection)
            return Promise.resolve(connection);
        if (opening)
            return opening;
        opening = new Promise<IDBDatabase>((resolve, reject) => {
            let settled = false;
            const req = factory.open(database, 1), fail = (e: unknown) => {
                if (settled)
                    return;
                settled = true;
                reject(fault(e));
            };
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(SAVE_STORE))
                    req.result.createObjectStore(SAVE_STORE);
            };
            req.onblocked = () => fail(new SaveFault('unavailable'));
            req.onerror = () => fail(req.error);
            req.onsuccess = () => {
                if (settled || closed) {
                    req.result.close();
                    if (!settled) {
                        settled = true;
                        reject(new SaveFault('unavailable'));
                    }
                    return;
                }
                settled = true;
                connection = req.result;
                connection.onversionchange = () => { connection?.close(); connection = undefined; };
                resolve(connection);
            };
        }).finally(() => { opening = undefined; });
        return opening!;
    }
    async function transaction<T>(mode: IDBTransactionMode, body: (store: IDBObjectStore, tx: IDBTransaction, set: (value: T) => void) => void): Promise<T> {
        try {
            const db = await open();
            return await new Promise<T>((resolve, reject) => {
                const tx = db.transaction(SAVE_STORE, mode);
                let value: T, error: unknown;
                tx.oncomplete = () => resolve(value);
                tx.onabort = tx.onerror = () => reject(fault(error ?? tx.error));
                try {
                    body(tx.objectStore(SAVE_STORE), tx, v => { value = v; });
                }
                catch (e) {
                    error = e;
                    tx.abort();
                }
                tx.addEventListener('error', () => { }, { once: true });
            });
        }
        catch (e) {
            throw fault(e);
        }
    }
    // Async request callbacks must abort on validation errors; don't let errors escape into the browser event loop.
    function guarded(tx: IDBTransaction, run: () => void) {
        try {
            run();
        }
        catch (e) {
            tx.abort();
            throwLater.set(tx, e);
        }
    }
    const throwLater = new WeakMap<IDBTransaction, unknown>();
    async function records() {
        return transaction<{
            primary: unknown;
            previous: unknown;
            preserved: unknown;
        }>('readonly', (store, _tx, set) => { const a = store.get('primary'), b = store.get('previous'), c = store.get('preserved'); c.onsuccess = () => set({ primary: a.result, previous: b.result, preserved: c.result }); });
    }
    async function mutate(run: (raw: unknown, previous: unknown, store: IDBObjectStore, tx: IDBTransaction, set: (x: StoredCheckpoint) => void) => void) {
        try {
            const db = await open();
            return await new Promise<StoredCheckpoint>((resolve, reject) => { const tx = db.transaction(SAVE_STORE, 'readwrite'), store = tx.objectStore(SAVE_STORE), a = store.get('primary'), b = store.get('previous'); let result: StoredCheckpoint; tx.oncomplete = () => resolve(result); tx.onabort = tx.onerror = () => reject(fault(throwLater.get(tx) ?? tx.error)); b.onsuccess = () => guarded(tx, () => run(a.result, b.result, store, tx, v => { result = v; })); });
        }
        catch (e) {
            throw fault(e);
        }
    }
    return {
        async read() {
            const { primary, previous, preserved } = await records();
            if (primary === undefined && (previous !== undefined || preserved !== undefined))
                throw new SaveFault('unreadable');
            const value = primary === undefined ? null : checkedCheckpoint(primary);
            observedGeneration = generationOf(value);
            return value;
        },
        async commit(expected, payload, writer, writtenAt) {
            if (!parseSave(payload).ok)
                throw new SaveFault('unreadable');
            const next = await mutate((raw, _previous, store, _tx, set) => {
                const old = raw === undefined ? null : checkedCheckpoint(raw), revision = old?.revision ?? 0;
                if (revision !== expected || generationOf(old) !== observedGeneration || revision === Number.MAX_SAFE_INTEGER)
                    throw new SaveFault('conflict');
                if (old?.format === 1)
                    throw new SaveFault('unreadable');
                const value = checkedCheckpoint({ format: 2, generation: old?.generation ?? crypto.randomUUID(), revision: revision + 1, writtenAt, writer, payload });
                if (old)
                    store.put(old, 'previous');
                store.put(value, 'primary');
                set(value);
            });
            observedGeneration = generationOf(next);
            return next;
        },
        async inspectRecovery() {
            const raw = await records(), main = inspectCheckpoint(raw.primary), previous = inspectCheckpoint(raw.previous);
            quoted = undefined;
            let kind: RecoveryInspection['kind'] = 'none', source: StoredCheckpoint | null = null;
            if (main.record?.format === 1) {
                kind = 'migrate';
                source = main.record;
            }
            else if (main.record) {
                kind = 'none';
            }
            else if (main.problem === 'missing' && previous.problem === 'missing' && raw.preserved === undefined) {
                kind = 'none';
            }
            else if (main.problem === 'unsupported-format' || main.problem === 'unsupported-schema') {
                kind = 'blocked';
            }
            else if (previous.record) {
                kind = 'restore';
                source = previous.record;
            }
            else
                kind = 'blocked';
            if (source) {
                try {
                    quoted = { id: crypto.randomUUID(), kind: kind as 'migrate' | 'restore', primary: rawSignature(raw.primary), previous: rawSignature(raw.previous), source };
                }
                catch {
                    kind = 'blocked';
                    source = null;
                }
            }
            return { kind, problem: main.problem, quote: quoted?.id ?? null, source: source ? summarize(source) : null, hasPreserved: raw.preserved !== undefined };
        },
        async transition(id, writer, writtenAt) {
            const quote = quoted;
            if (!quote || quote.id !== id)
                throw new SaveFault('conflict');
            quoted = undefined;
            const value = await mutate((raw, previous, store, _tx, set) => {
                if (rawSignature(raw) !== quote.primary || rawSignature(previous) !== quote.previous)
                    throw new SaveFault('conflict');
                const current = inspectCheckpoint(raw);
                if (quote.kind === 'migrate' && current.record?.format !== 1 || quote.kind === 'restore' && (current.record || current.problem === 'unsupported-format' || current.problem === 'unsupported-schema'))
                    throw new SaveFault('conflict');
                const source = quote.kind === 'migrate' ? checkedCheckpoint(raw) : checkedCheckpoint(previous);
                const next = checkedCheckpoint({ format: 2, generation: crypto.randomUUID(), revision: source.revision === Number.MAX_SAFE_INTEGER ? 1 : source.revision + 1, writtenAt, writer, payload: source.payload });
                store.put({ format: 1, reason: quote.kind, capturedAt: writtenAt, primary: raw, previous }, 'preserved');
                store.put(next, 'primary');
                set(next);
            });
            observedGeneration = generationOf(value);
            return value;
        },
        async exportPreserved() {
            const { preserved } = await records();
            if (preserved === undefined)
                throw new SaveFault('unreadable');
            const out = rawSignature(preserved);
            return JSON.stringify({ type: 'myzootwin-recovery-copy', encoding: 'bounded-tagged-data', data: JSON.parse(out) });
        },
        close() { closed = true; quoted = undefined; connection?.close(); connection = undefined; }
    };
}
