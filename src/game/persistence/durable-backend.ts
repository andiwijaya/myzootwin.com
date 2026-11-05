import { createInitialState } from '../core/initial-state.ts';
import { SaveFault, checkedCheckpoint as checkRecord, inspectCheckpoint as inspectRecord, stateFromCheckpoint as decodeRecord, encodeCheckpointState as encodeRecord, generationOf, summarize as summarizeRecord, rawSignature, LEGACY_CHECKPOINT_CODEC, type CheckpointCodec, type StorageFault, type StoredCheckpoint, type CheckpointProblem, type CheckpointSummary } from './checkpoint.ts';
export { SaveFault, checkedCheckpoint, stateFromCheckpoint, encodeCheckpointState } from './checkpoint.ts';
export type { StoredCheckpoint, StorageFault };
export const SAVE_DATABASE = 'myzootwin-progress-v1', SAVE_STORE = 'checkpoints';
export interface RecoveryInspection {
    kind: 'none' | 'migrate' | 'restore' | 'blocked';
    problem: CheckpointProblem | null;
    quote: string | null;
    source: CheckpointSummary | null;
    hasPreserved: boolean;
}
export interface RestartInspection {
    kind: 'reset' | 'undo-reset' | 'blocked';
    quote: string | null;
    source: CheckpointSummary | null;
    hasBackup: boolean;
}
export interface DurableBackend {
    readonly codec?:CheckpointCodec;
    read(): Promise<StoredCheckpoint | null>;
    commit(expected: number, payload: string, writer: string, writtenAt: number): Promise<StoredCheckpoint>;
    inspectRecovery?(): Promise<RecoveryInspection>;
    transition?(quote: string, writer: string, writtenAt: number): Promise<StoredCheckpoint>;
    exportPreserved?(): Promise<string>;
    inspectRestart?(kind: 'reset' | 'undo-reset'): Promise<RestartInspection>;
    restart?(quote: string, writer: string, writtenAt: number): Promise<StoredCheckpoint>;
    close(): void;
}
const fault = (e: unknown): SaveFault => e instanceof SaveFault ? e : new SaveFault(e instanceof DOMException && e.name === 'QuotaExceededError' ? 'quota' : e instanceof DOMException && e.name === 'VersionError' ? 'unreadable' : 'unavailable');
export interface BackendOptions {codec?:CheckpointCodec;databaseVersion?:1|2;minimumSchema?:2;preserveV1BeforeMigration?:boolean;}
export const ELEPHANT_V1_BACKUP='elephant-v1-backup';
export function createIndexedDbBackend(factory: IDBFactory | undefined, database = SAVE_DATABASE,options:BackendOptions={}): DurableBackend {
    const codec=options.codec??LEGACY_CHECKPOINT_CODEC;
    const checkedCheckpoint=(raw:unknown)=>checkRecord(raw,codec),inspectCheckpoint=(raw:unknown)=>inspectRecord(raw,codec),stateFromCheckpoint=(raw:StoredCheckpoint)=>decodeRecord(raw,codec),encodeCheckpointState=(state:import('../core/state.ts').ZooSaveV1)=>encodeRecord(state,codec),summarize=(raw:StoredCheckpoint)=>summarizeRecord(raw,codec);
    let connection: IDBDatabase | undefined, opening: Promise<IDBDatabase> | undefined, closed = false, observedGeneration = 'empty';
    let quoted: {
        id: string;
        kind: 'migrate' | 'restore';
        primary: string;
        previous: string;
        source: StoredCheckpoint;
    } | undefined;
    let restartQuote: {
        id: string;
        kind: 'reset' | 'undo-reset';
        primary: string;
        previous: string;
        backup: string;
        payload: string;
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
            const req = factory.open(database, options.databaseVersion??1), fail = (e: unknown) => {
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
            restart: unknown;
            migrationBackup:unknown;
        }>('readonly', (store, _tx, set) => { const a = store.get('primary'), b = store.get('previous'), c = store.get('preserved'), d = store.get('restart'),e=store.get(ELEPHANT_V1_BACKUP); e.onsuccess = () => set({ primary: a.result, previous: b.result, preserved: c.result, restart: d.result,migrationBackup:e.result }); });
    }
    async function mutate(run: (raw: unknown, previous: unknown, store: IDBObjectStore, tx: IDBTransaction, set: (x: StoredCheckpoint) => void, backup: unknown,migrationBackup:unknown) => void) {
        try {
            const db = await open();
            return await new Promise<StoredCheckpoint>((resolve, reject) => { const tx = db.transaction(SAVE_STORE, 'readwrite'), store = tx.objectStore(SAVE_STORE), a = store.get('primary'), b = store.get('previous'), c = store.get('restart'),d=store.get(ELEPHANT_V1_BACKUP); let result: StoredCheckpoint; tx.oncomplete = () => resolve(result); tx.onabort = tx.onerror = () => reject(fault(throwLater.get(tx) ?? tx.error)); d.onsuccess = () => guarded(tx, () => run(a.result, b.result, store, tx, v => { result = v; }, c.result,d.result)); });
        }
        catch (e) {
            throw fault(e);
        }
    }
    return {
        codec,
        async read() {
            const { primary, previous, preserved, restart,migrationBackup } = await records();
            if (primary === undefined && (previous !== undefined || preserved !== undefined || restart !== undefined||migrationBackup!==undefined))
                throw new SaveFault('unreadable');
            const value = primary === undefined ? null : checkedCheckpoint(primary);
            observedGeneration = generationOf(value);
            return value;
        },
        async commit(expected, payload, writer, writtenAt) {
            if (!codec.parse(payload).ok||(options.minimumSchema===2&&JSON.parse(payload).schemaVersion!==2))
                throw new SaveFault('unreadable');
            const next = await mutate((raw, _previous, store, _tx, set,_backup,migrationBackup) => {
                const old = raw === undefined ? null : checkedCheckpoint(raw), revision = old?.revision ?? 0;
                if (revision !== expected || generationOf(old) !== observedGeneration || revision === Number.MAX_SAFE_INTEGER)
                    throw new SaveFault('conflict');
                if (old?.format === 1)
                    throw new SaveFault('unreadable');
                const value = checkedCheckpoint({ format: 2, generation: old?.generation ?? crypto.randomUUID(), revision: revision + 1, writtenAt, writer, payload });
                if (old)
                    store.put(old, 'previous');
                if(options.preserveV1BeforeMigration&&old&&JSON.parse(old.payload).schemaVersion===1&&migrationBackup===undefined)store.put(old,ELEPHANT_V1_BACKUP);
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
            else if (main.problem === 'missing' && previous.problem === 'missing' && raw.preserved === undefined && raw.restart === undefined&&raw.migrationBackup===undefined) {
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
            const value = await mutate((raw, previous, store, _tx, set,_backup,migrationBackup) => {
                if (rawSignature(raw) !== quote.primary || rawSignature(previous) !== quote.previous)
                    throw new SaveFault('conflict');
                const current = inspectCheckpoint(raw);
                if (quote.kind === 'migrate' && current.record?.format !== 1 || quote.kind === 'restore' && (current.record || current.problem === 'unsupported-format' || current.problem === 'unsupported-schema'))
                    throw new SaveFault('conflict');
                const source = quote.kind === 'migrate' ? checkedCheckpoint(raw) : checkedCheckpoint(previous);
                const payload=options.minimumSchema===2?codec.serialize(stateFromCheckpoint(source)):source.payload;
                const next = checkedCheckpoint({ format: 2, generation: crypto.randomUUID(), revision: source.revision === Number.MAX_SAFE_INTEGER ? 1 : source.revision + 1, writtenAt, writer, payload });
                if(options.preserveV1BeforeMigration&&JSON.parse(source.payload).schemaVersion===1&&migrationBackup===undefined)store.put(source,ELEPHANT_V1_BACKUP);
                store.put({ format: 1, reason: quote.kind, capturedAt: writtenAt, primary: raw, previous }, 'preserved');
                store.put(next, 'primary');
                set(next);
            });
            observedGeneration = generationOf(value);
            return value;
        },
        async inspectRestart(kind) {
            restartQuote = undefined;
            const raw = await records(), current = inspectCheckpoint(raw.primary);
            const backup = raw.restart as {
                format?: number;
                used?: boolean;
                primary?: unknown;
                previous?: unknown;
            } | undefined;
            const safeBackup = Boolean(backup && Object.getPrototypeOf(backup) === Object.prototype && Object.keys(backup).sort().join(',') === 'format,previous,primary,used' && backup.format === 1 && typeof backup.used === 'boolean' && inspectCheckpoint(backup.primary).record);
            if (!current.record || current.record.format !== 2 || (kind === 'undo-reset' && (!safeBackup || backup!.used)))
                return { kind: 'blocked', quote: null, source: null, hasBackup: safeBackup && !backup!.used };
            const source = kind === 'reset' ? current.record : checkedCheckpoint(backup!.primary);
            let payload = options.minimumSchema===2?codec.serialize(stateFromCheckpoint(source)):source.payload;
            if (kind === 'reset') {
                const fresh = createInitialState(), old = stateFromCheckpoint(source);
                fresh.preferences = { ...old.preferences, speed: 1 };
                payload = encodeCheckpointState(fresh);
            }
            try {
                restartQuote = { id: crypto.randomUUID(), kind, primary: rawSignature(raw.primary), previous: rawSignature(raw.previous), backup: rawSignature(raw.restart), payload };
            }
            catch {
                return { kind: 'blocked', quote: null, source: null, hasBackup: safeBackup && !backup!.used };
            }
            return { kind, quote: restartQuote.id, source: summarize(source), hasBackup: safeBackup && !backup!.used };
        },
        async restart(id, writer, writtenAt) {
            const quote = restartQuote;
            if (!quote || quote.id !== id)
                throw new SaveFault('conflict');
            restartQuote = undefined;
            const value = await mutate((raw, previous, store, _tx, set, backup,migrationBackup) => {
                if (rawSignature(raw) !== quote.primary || rawSignature(previous) !== quote.previous || rawSignature(backup) !== quote.backup)
                    throw new SaveFault('conflict');
                const current = checkedCheckpoint(raw);
                if (current.format !== 2)
                    throw new SaveFault('conflict');
                const next = checkedCheckpoint({ format: 2, generation: crypto.randomUUID(), revision: 1, writtenAt, writer, payload: quote.payload });
                if(options.preserveV1BeforeMigration&&JSON.parse(current.payload).schemaVersion===1&&migrationBackup===undefined)store.put(current,ELEPHANT_V1_BACKUP);
                if (quote.kind === 'reset')
                    store.put({ format: 1, used: false, primary: raw, previous }, 'restart');
                else
                    store.put({ ...(backup as object), used: true }, 'restart');
                store.put(current, 'previous');
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
        close() { closed = true; quoted = undefined; restartQuote = undefined; connection?.close(); connection = undefined; }
    };
}
