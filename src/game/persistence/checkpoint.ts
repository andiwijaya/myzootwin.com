import { parseSave, serializeSave, MAX_SAVE_CHARS } from './save-v1.ts';
import type { ZooSaveV1 } from '../core/state.ts';
import type {ZooSave} from '../core/zoo-state.ts';
export type StorageFault = 'unavailable' | 'unreadable' | 'quota' | 'conflict' | 'write';
export class SaveFault extends Error {
    code: StorageFault;
    constructor(code: StorageFault) { super(code); this.code = code; }
}
export interface StoredCheckpoint {
    format: 1 | 2;
    generation?: string;
    revision: number;
    writtenAt: number;
    writer: string;
    payload: string;
}
export interface CheckpointCodec<State extends ZooSave=ZooSaveV1> {
    parse(text:string):{ok:true;value:State}|Extract<ReturnType<typeof parseSave>,{ok:false}>;
    serialize(state:State):string;
    prepare?(state:ZooSaveV1):State;
}
export const LEGACY_CHECKPOINT_CODEC:CheckpointCodec={parse:parseSave,serialize:serializeSave};
export type CheckpointProblem = 'missing' | 'invalid-envelope' | 'unsupported-format' | 'unsupported-schema' | 'invalid-json' | 'invalid-state' | 'too-large';
export function inspectCheckpoint<State extends ZooSave=ZooSaveV1>(raw: unknown,codec:CheckpointCodec<State>=LEGACY_CHECKPOINT_CODEC as unknown as CheckpointCodec<State>): {
    record: StoredCheckpoint | null;
    problem: CheckpointProblem | null;
} {
    if (raw === undefined)
        return { record: null, problem: 'missing' };
    if (!raw || typeof raw !== 'object' || Object.getPrototypeOf(raw) !== Object.prototype)
        return { record: null, problem: 'invalid-envelope' };
    const x = raw as StoredCheckpoint;
    if (typeof x.format === 'number' && x.format !== 1 && x.format !== 2)
        return { record: null, problem: 'unsupported-format' };
    const keys = x.format === 1 ? 'format,payload,revision,writer,writtenAt' : 'format,generation,payload,revision,writer,writtenAt';
    if (Object.keys(x).sort().join(',') !== keys || (x.format !== 1 && x.format !== 2) || !Number.isSafeInteger(x.revision) || x.revision < 1 || !Number.isSafeInteger(x.writtenAt) || x.writtenAt < 0 || x.writtenAt > 8640000000000000 || typeof x.writer !== 'string' || !/^[a-z0-9-]{1,64}$/.test(x.writer) || (x.format === 2 && (typeof x.generation !== 'string' || !/^[a-z0-9-]{1,64}$/.test(x.generation))) || typeof x.payload !== 'string')
        return { record: null, problem: 'invalid-envelope' };
    const parsed = codec.parse(x.payload);
    if (!parsed.ok)
        return { record: null, problem: parsed.code };
    return { record: { ...x }, problem: null };
}
export function checkedCheckpoint<State extends ZooSave=ZooSaveV1>(raw: unknown,codec:CheckpointCodec<State>=LEGACY_CHECKPOINT_CODEC as unknown as CheckpointCodec<State>): StoredCheckpoint {
    const x = inspectCheckpoint(raw,codec);
    if (!x.record)
        throw new SaveFault('unreadable');
    return x.record;
}
export function stateFromCheckpoint<State extends ZooSave=ZooSaveV1>(raw: StoredCheckpoint,codec:CheckpointCodec<State>=LEGACY_CHECKPOINT_CODEC as unknown as CheckpointCodec<State>): State {
    const x = checkedCheckpoint(raw,codec), s = codec.parse(x.payload);
    if (!s.ok)
        throw new SaveFault('unreadable');
    return s.value;
}
export const encodeCheckpointState = <State extends ZooSave=ZooSaveV1>(state:State,codec:CheckpointCodec<State>=LEGACY_CHECKPOINT_CODEC as unknown as CheckpointCodec<State>) => codec.serialize(state);
export const generationOf = (r: StoredCheckpoint | null) => r ? r.format === 1 ? 'legacy' : r.generation! : 'empty';
export interface CheckpointSummary {
    revision: number;
    tick: number;
    currency: number;
    missions: number;
    birds: number;
    locale: 'id' | 'en';
    writtenAt: number;
}
export function summarize<State extends ZooSave=ZooSaveV1>(r: StoredCheckpoint,codec:CheckpointCodec<State>=LEGACY_CHECKPOINT_CODEC as unknown as CheckpointCodec<State>): CheckpointSummary { const s = stateFromCheckpoint(r,codec); return { revision: r.revision, tick: s.tick, currency: s.currency, missions: s.missions.completedIds.length, birds: s.animals.filter(a => a.speciesId==='ara-ararauna'&&a.habitatId !== null).length, locale: s.preferences.locale, writtenAt: r.writtenAt }; }
/** Exact bounded tagged encoding, not a lossy JSON hash. Unsupported/cyclic values refuse automatic repair. */
export function rawSignature(raw: unknown): string {
    let nodes = 0, chars = 0;
    const seen = new Set<object>();
    function walk(x: unknown, depth: number): unknown {
        if (++nodes > 50000 || depth > 64)
            throw new SaveFault('unreadable');
        if (typeof x === 'string') {
            chars += x.length;
            if (chars > MAX_SAVE_CHARS * 3)
                throw new SaveFault('unreadable');
            return ['string', x];
        }
        if (typeof x === 'number')
            return ['number', Object.is(x, -0) ? '-0' : String(x)];
        if (x === null)
            return ['null'];
        if (x === undefined)
            return ['undefined'];
        if (typeof x === 'boolean')
            return ['boolean', x];
        if (typeof x !== 'object' || seen.has(x))
            throw new SaveFault('unreadable');
        seen.add(x);
        try {
            if (Array.isArray(x)) {
                if (x.length > 50000 || Object.keys(x).length !== x.length)
                    throw new SaveFault('unreadable');
                return ['array', x.map(v => walk(v, depth + 1))];
            }
            if (Object.getPrototypeOf(x) !== Object.prototype)
                throw new SaveFault('unreadable');
            return ['object', Object.keys(x).sort().map(k => { chars += k.length; return [k, walk((x as Record<string, unknown>)[k], depth + 1)]; })];
        }
        finally {
            seen.delete(x);
        }
    }
    const out = JSON.stringify(walk(raw, 0));
    if (out.length > MAX_SAVE_CHARS * 4)
        throw new SaveFault('unreadable');
    return out;
}
