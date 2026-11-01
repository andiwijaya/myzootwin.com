import { parseSave, serializeSave, MAX_SAVE_CHARS } from './save-v1.ts';
import type { ZooSaveV1 } from '../core/state.ts';
export const SAVE_DATABASE = 'myzootwin-progress-v1', SAVE_STORE = 'checkpoints';
export type StorageFault = 'unavailable' | 'unreadable' | 'quota' | 'conflict' | 'write';
export class SaveFault extends Error {
    code: StorageFault;
    constructor(code: StorageFault) { super(code); this.code = code; }
}
export interface StoredCheckpoint {
    format: 1;
    revision: number;
    writtenAt: number;
    writer: string;
    payload: string;
}
export interface DurableBackend {
    read(): Promise<StoredCheckpoint | null>;
    commit(expected: number, payload: string, writer: string, writtenAt: number): Promise<StoredCheckpoint>;
    close(): void;
}
/** Validate the envelope AND every authoritative state invariant before opening or replacing a save. */
export function checkedCheckpoint(raw: unknown): StoredCheckpoint { if (!raw || typeof raw !== 'object' || Object.getPrototypeOf(raw) !== Object.prototype)
    throw new SaveFault('unreadable'); const x = raw as StoredCheckpoint; if (Object.keys(x).sort().join(',') !== 'format,payload,revision,writer,writtenAt' || x.format !== 1 || !Number.isSafeInteger(x.revision) || x.revision < 1 || !Number.isSafeInteger(x.writtenAt) || x.writtenAt < 0 || x.writtenAt > 8640000000000000 || typeof x.writer !== 'string' || !/^[a-z0-9-]{1,64}$/.test(x.writer) || typeof x.payload !== 'string' || x.payload.length > MAX_SAVE_CHARS || !parseSave(x.payload).ok)
    throw new SaveFault('unreadable'); return { ...x }; }
export function stateFromCheckpoint(raw: StoredCheckpoint): ZooSaveV1 { const x = checkedCheckpoint(raw), s = parseSave(x.payload); if (!s.ok)
    throw new SaveFault('unreadable'); return s.value; }
export function encodeCheckpointState(state: ZooSaveV1) { return serializeSave(state); }
const fault = (error: unknown): SaveFault => error instanceof SaveFault ? error : new SaveFault(error instanceof DOMException && error.name === 'QuotaExceededError' ? 'quota' : error instanceof DOMException && error.name === 'VersionError' ? 'unreadable' : 'unavailable');
/** Dedicated DB; read-modify-write CAS and bounded previous-good copy share ONE atomic transaction. */
export function createIndexedDbBackend(factory: IDBFactory | undefined, database = SAVE_DATABASE): DurableBackend {
    let connection: IDBDatabase | undefined, opening: Promise<IDBDatabase> | undefined, closed = false;
    function open(): Promise<IDBDatabase> { if (closed || !factory)
        return Promise.reject(new SaveFault('unavailable')); if (connection)
        return Promise.resolve(connection); if (opening)
        return opening; opening = new Promise<IDBDatabase>((resolve, reject) => { let settled = false; const request = factory.open(database, 1); const fail = (e: unknown) => { if (settled)
        return; settled = true; reject(fault(e)); }; request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(SAVE_STORE))
        request.result.createObjectStore(SAVE_STORE); }; request.onblocked = () => fail(new SaveFault('unavailable')); request.onerror = () => fail(request.error); request.onsuccess = () => { if (settled || closed) {
        request.result.close();
        if (!settled) {
            settled = true;
            reject(new SaveFault('unavailable'));
        }
        return;
    } settled = true; connection = request.result; connection.onversionchange = () => { connection?.close(); connection = undefined; }; resolve(connection); }; }).finally(() => { opening = undefined; }); return opening!; }
    return { async read() { try {
            const db = await open();
            return await new Promise<StoredCheckpoint | null>((resolve, reject) => { const tx = db.transaction(SAVE_STORE, 'readonly'), request = tx.objectStore(SAVE_STORE).get('primary'); let result: StoredCheckpoint | null = null, error: unknown; request.onsuccess = () => { try {
                result = request.result === undefined ? null : checkedCheckpoint(request.result);
            }
            catch (e) {
                error = e;
                tx.abort();
            } }; tx.oncomplete = () => resolve(result); tx.onabort = tx.onerror = () => reject(fault(error ?? tx.error)); });
        }
        catch (e) {
            throw fault(e);
        } },
        async commit(expected, payload, writer, writtenAt) { if (!parseSave(payload).ok)
            throw new SaveFault('unreadable'); try {
            const db = await open();
            return await new Promise<StoredCheckpoint>((resolve, reject) => { const tx = db.transaction(SAVE_STORE, 'readwrite'), store = tx.objectStore(SAVE_STORE), request = store.get('primary'); let result: StoredCheckpoint, error: unknown; request.onsuccess = () => { try {
                const old = request.result === undefined ? null : checkedCheckpoint(request.result), revision = old?.revision ?? 0;
                if (revision !== expected || revision === Number.MAX_SAFE_INTEGER)
                    throw new SaveFault('conflict');
                result = checkedCheckpoint({ format: 1, revision: revision + 1, writtenAt, writer, payload });
                if (old)
                    store.put(old, 'previous');
                store.put(result, 'primary');
            }
            catch (e) {
                error = e;
                tx.abort();
            } }; tx.oncomplete = () => resolve(result); tx.onabort = tx.onerror = () => reject(fault(error ?? tx.error)); });
        }
        catch (e) {
            throw fault(e);
        } }, close() { closed = true; connection?.close(); connection = undefined; } };
}
