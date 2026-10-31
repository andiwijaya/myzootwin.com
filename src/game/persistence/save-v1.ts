import {validRefunds} from '../economy/refunds.ts';
import { MAX_TICK, MISSION_IDS, SPECIES_ID, TICK_MS, type ZooSaveV1 } from '../core/state.ts';

export const MAX_SAVE_CHARS = 1_000_000;
type Rule = (value: unknown, path: string) => void;
class Invalid extends Error { path: string; constructor(path: string) { super('Invalid save'); this.path = path; } }
const requireValue = (valid: boolean, path: string) => { if (!valid) throw new Invalid(path); };
const number = (min: number, max: number, integer = false): Rule => (v,p) => requireValue(typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max && (!integer || Number.isSafeInteger(v)),p);
const integer = (max = Number.MAX_SAFE_INTEGER) => number(0,max,true);
const percent = number(0,100);
const oneOf = (...values: Array<string | number>): Rule => (v,p) => requireValue(values.includes(v as string | number),p);
const bool: Rule = (v,p) => requireValue(typeof v === 'boolean',p);
const id: Rule = (v,p) => requireValue(typeof v === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(v),p);
const referenceId: Rule = (v,p) => { if (!(MISSION_IDS as readonly unknown[]).includes(v)) id(v,p); };
const nullable = (rule: Rule): Rule => (v,p) => { if (v !== null) rule(v,p); };
const array = (rule: Rule, max: number): Rule => (v,p) => { requireValue(Array.isArray(v) && Object.getPrototypeOf(v) === Array.prototype && v.length <= max,p); const values=v as unknown[]; requireValue(Object.keys(values).length===values.length,p); for(let i=0;i<values.length;i++) { requireValue(Object.hasOwn(values,i),`${p}[${i}]`); rule(values[i],`${p}[${i}]`); } };
const object = (fields: Record<string,Rule>): Rule => (v,p) => {
  requireValue(typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype,p);
  const record = v as Record<string,unknown>;
  requireValue(Object.keys(record).length === Object.keys(fields).length && Object.keys(record).every(key => Object.hasOwn(fields,key)),p);
  for (const [key,rule] of Object.entries(fields)) rule(record[key],`${p}.${key}`);
};
const point = object({ x: number(0,32), z: number(0,32) });
const cell = object({ x: integer(31), z: integer(31) });
const tick = integer(MAX_TICK);
const missionId = oneOf(...MISSION_IDS);
const schema = object({
  schemaVersion: oneOf(1), randomSeed: number(1,0xffffffff,true), randomState: number(1,0xffffffff,true), tick, gameTimeMs: integer(), currency: integer(),
  world: object({ width: number(1,32,true), height: number(1,32,true), gate: cell,
    tiles: array(object({ cell, terrain: oneOf('land','creek'), occupantId: nullable(id), path: bool }),1024),
    habitats: array(object({ id, cells: array(cell,256), viewingCell: nullable(cell) }),8),
    resources: array(object({ id, kind: oneOf('food','water','perch'), habitatId: id, cell, stock: integer(10000), capacity: number(1,10000,true) }),32),
  }),
  animals: array(object({ id, speciesId: oneOf(SPECIES_ID), habitatId: nullable(id), position: nullable(point), target: nullable(point), targetResourceId: nullable(id), hunger: percent, thirst: percent, energy: percent, habitatFit: percent, enrichment: percent, welfare: percent, currentBehavior: oneOf('idle','wander','perch','seek-food','eat','seek-water','drink','rest') }),2),
  visitors: array(object({ id, position: point, route: array(cell,1024), routeIndex: integer(1023), phase: oneOf('entering','viewing','leaving'), satisfaction: percent, admissionId: id }),32),
  admissions: array(object({ id, visitorId: id, tick, ledgerEntryId: id }),8192),
  ledger: array(object({ id, operationId: id, kind: oneOf('starter','build','supplies','maintenance','ticket','reward','refund','restore'), amount: number(-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,true), balanceAfter: integer(), tick, relatedId: nullable(referenceId) }),8192),
  missions: object({ currentId: nullable(missionId), completedIds: array(missionId,4), rewards: array(object({ missionId, ledgerEntryId: id }),4),
    objectives: object({ habitatConnected: bool, birdsFedIds: array(id,2), birdsWateredIds: array(id,2), comfortableTicks: tick, viewedVisitorIds: array(id,8192), thrivingTicks: tick }),
  }),
  preferences: object({ locale: oneOf('id','en'), graphics: oneOf('auto','low','high'), muted: bool, reducedMotion: bool }),
});

const key = (p: {x:number;z:number}) => `${p.x},${p.z}`;
function unique(values: string[], path: string) { requireValue(new Set(values).size === values.length,path); }
function relationships(s: ZooSaveV1) {
  requireValue(s.gameTimeMs === s.tick * TICK_MS,'$.gameTimeMs');
  const w=s.world;
  const inBounds=(p:{x:number;z:number}) => p.x < w.width && p.z < w.height;
  requireValue(w.tiles.length === w.width*w.height,'$.world.tiles');
  unique(w.tiles.map(t=>key(t.cell)),'$.world.tiles');
  const tiles=new Map(w.tiles.map(t=>[key(t.cell),t]));
  const habitats=new Map(w.habitats.map(h=>[h.id,h]));
  unique([...w.habitats.map(h=>h.id),...w.resources.map(r=>r.id),...s.animals.map(a=>a.id),...s.visitors.map(v=>v.id)],'$.entityIds');
  const occupied=new Map<string,string>();
  for (const h of w.habitats) {
    requireValue(h.cells.length > 0,`$.habitat.${h.id}.cells`);
    unique(h.cells.map(key),`$.habitat.${h.id}.cells`);
    for(const c of h.cells) { requireValue(inBounds(c) && !occupied.has(key(c)),`$.habitat.${h.id}.cells`); occupied.set(key(c),h.id); }
    if(h.viewingCell) requireValue(tiles.get(key(h.viewingCell))?.path===true,`$.habitat.${h.id}.viewingCell`);
  }
  for(const t of w.tiles) {
    requireValue(inBounds(t.cell) && t.occupantId === (occupied.get(key(t.cell))??null),'$.world.tiles.occupancy');
    requireValue((t.terrain==='land' || (!t.path && !t.occupantId)) && !(t.path && t.occupantId),'$.world.tiles.terrain');
  }
  requireValue(inBounds(w.gate) && tiles.get(key(w.gate))?.path===true,'$.world.gate');
  unique(w.resources.map(r=>key(r.cell)),'$.world.resources.cells');
  for(const r of w.resources) requireValue(r.stock<=r.capacity && habitats.has(r.habitatId) && occupied.get(key(r.cell))===r.habitatId,`$.resource.${r.id}`);
  const resourceById=new Map(w.resources.map(r=>[r.id,r]));
  requireValue(s.animals.length===2,'$.animals');
  for(const a of s.animals) {
    const inHabitat=(p:{x:number;z:number})=>inBounds(p) && occupied.get(key({x:Math.floor(p.x),z:Math.floor(p.z)}))===a.habitatId;
    if(a.habitatId===null) requireValue(a.position===null && a.target===null && a.targetResourceId===null && a.currentBehavior==='idle',`$.animal.${a.id}.reserve`);
    else {
      requireValue(habitats.has(a.habitatId) && a.position!==null && inHabitat(a.position),`$.animal.${a.id}.position`);
      if(a.target)requireValue(inHabitat(a.target),`$.animal.${a.id}.target`);
      if(a.targetResourceId)requireValue(resourceById.get(a.targetResourceId)?.habitatId===a.habitatId,`$.animal.${a.id}.targetResourceId`);
      if(['seek-food','eat','seek-water','drink'].includes(a.currentBehavior)) {
        const kind=['seek-food','eat'].includes(a.currentBehavior)?'food':'water';
        requireValue(a.target!==null && a.targetResourceId!==null && resourceById.get(a.targetResourceId)?.kind===kind,`$.animal.${a.id}.resourceBehavior`);
      }
    }
  }
  unique(s.ledger.map(e=>e.id),'$.ledger.ids'); unique(s.ledger.map(e=>e.operationId),'$.ledger.operations');
  const ledger=new Map(s.ledger.map(e=>[e.id,e]));
  let balance=0,lastTick=0;
  for(const e of s.ledger) {
    balance+=e.amount;
    requireValue(Number.isSafeInteger(balance) && balance>=0 && balance===e.balanceAfter && e.tick>=lastTick && e.tick<=s.tick,'$.ledger.balance');
    requireValue(e.amount!==0 && (['build','supplies','maintenance','restore'].includes(e.kind) ? e.amount<0 : e.amount>0),'$.ledger.amount');
    lastTick=e.tick;
  }
  requireValue(balance===s.currency,'$.currency');
  requireValue(validRefunds(s.ledger),'$.ledger.refund');
  unique(s.admissions.map(a=>a.id),'$.admissions.ids'); unique(s.admissions.map(a=>a.visitorId),'$.admissions.visitors'); unique(s.admissions.map(a=>a.ledgerEntryId),'$.admissions.ledger');
  const admissions=new Map(s.admissions.map(a=>[a.id,a]));
  for(const a of s.admissions) { const e=ledger.get(a.ledgerEntryId); requireValue(a.tick<=s.tick && e?.kind==='ticket' && e.relatedId===a.id && e.tick===a.tick,'$.admissions.reference'); }
  for(const e of s.ledger)if(e.kind==='ticket')requireValue(e.relatedId!==null && admissions.get(e.relatedId)?.ledgerEntryId===e.id,'$.ledger.ticket');
  for(const v of s.visitors) {
    requireValue(inBounds(v.position) && tiles.get(key({x:Math.floor(v.position.x),z:Math.floor(v.position.z)}))?.path===true && admissions.get(v.admissionId)?.visitorId===v.id && v.route.length>0 && v.routeIndex<v.route.length,'$.visitors.reference');
    for(let i=0;i<v.route.length;i++) { const p=v.route[i]; requireValue(tiles.get(key(p))?.path===true,'$.visitors.route'); if(i)requireValue(Math.abs(p.x-v.route[i-1].x)+Math.abs(p.z-v.route[i-1].z)===1,'$.visitors.route.adjacency'); }
  }
  const m=s.missions;
  requireValue(m.completedIds.every((id,i)=>id===MISSION_IDS[i]) && m.currentId===(MISSION_IDS[m.completedIds.length]??null),'$.missions.order');
  unique(m.rewards.map(r=>r.missionId),'$.missions.rewards'); unique(m.rewards.map(r=>r.ledgerEntryId),'$.missions.rewardLedger');
  for(const r of m.rewards) { const e=ledger.get(r.ledgerEntryId); requireValue(m.completedIds.includes(r.missionId) && e?.kind==='reward' && e.relatedId===r.missionId,'$.missions.rewards.reference'); }
  for(const e of s.ledger)if(e.kind==='reward')requireValue(m.rewards.some(r=>r.ledgerEntryId===e.id),'$.ledger.reward');
  const birdIds=new Set(s.animals.map(a=>a.id)); const visitorIds=new Set(s.admissions.map(a=>a.visitorId));
  for(const values of [m.objectives.birdsFedIds,m.objectives.birdsWateredIds]) { unique(values,'$.missions.birds'); requireValue(values.every(id=>birdIds.has(id)),'$.missions.birds.reference'); }
  unique(m.objectives.viewedVisitorIds,'$.missions.visitors'); requireValue(m.objectives.viewedVisitorIds.every(id=>visitorIds.has(id)),'$.missions.visitors.reference');
  requireValue(m.objectives.comfortableTicks<=s.tick && m.objectives.thrivingTicks<=s.tick,'$.missions.duration');
}

export type SaveResult = {ok:true;value:ZooSaveV1} | {ok:false;code:'invalid-json'|'unsupported-schema'|'invalid-state'|'too-large';path:string};
export function validateSave(value: unknown): SaveResult {
  try {
    if(typeof value==='object' && value!==null && 'schemaVersion' in value && value.schemaVersion!==1)return {ok:false,code:'unsupported-schema',path:'$.schemaVersion'};
    schema(value,'$'); const save=value as ZooSaveV1; relationships(save); return {ok:true,value:structuredClone(save)};
  }
  catch(error) { return {ok:false,code:'invalid-state',path:error instanceof Invalid?error.path:'$'}; }
}
export function parseSave(text: string): SaveResult {
  if(text.length>MAX_SAVE_CHARS)return {ok:false,code:'too-large',path:'$'};
  let value:unknown;
  try { value=JSON.parse(text); } catch { return {ok:false,code:'invalid-json',path:'$'}; }
  return validateSave(value);
}
export function serializeSave(value: ZooSaveV1): string {
  const result=validateSave(value);
  if(!result.ok)throw new Error(`Invalid save at ${result.path}`);
  const text=JSON.stringify(result.value);
  if(text.length>MAX_SAVE_CHARS)throw new Error('Save exceeds size budget');
  return text;
}
