import {MISSION_RULES} from '../missions/engine.ts';
import {ATTRACTION_RULES} from '../visitors/attraction.ts';
import {coherentMoney,admissionProofs,ledgerProof,LEDGER_KINDS} from '../economy/journal.ts';
import {PRICES,MONEY_RULES} from '../economy/prices.ts';
import {SATISFACTION_RULES} from '../visitors/satisfaction.ts';
import {visitorPaths,visitorRoute,visitorCell,ownsCorridor} from '../visitors/navigation.ts';
import {arrivalPosition,ARRIVAL_RULES} from '../visitors/arrivals.ts';
import {restPort,restGround} from '../animals/resting.ts';
import {waterPort,waterHeading,isWaterPhase} from '../animals/watering.ts';
import {foodPort} from '../animals/feeding.ts';
import {BIRD_PERCH_HEIGHT,birdHome,supportsBirds} from '../animals/autonomy.ts';
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
const feedback=object({visitorId:id,habitatId:nullable(id),tick,outcome:oneOf('comfortable','concerned','empty','no-habitat','unreachable','interrupted'),reason:oneOf('none','closed','access-lost','habitat-removed','time-limit'),score:nullable(integer(100)),observedWelfare:nullable(integer(100)),samples:integer(30),occupiedSamples:integer(30),welfareHundredths:integer(300000)});
const ledgerEntry=object({ id, operationId: id, kind: oneOf('starter','build','supplies','maintenance','ticket','reward','refund','restore'), amount: number(-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,true), balanceAfter: integer(), tick, relatedId: nullable(referenceId) });
const admissionRule=object({ id, visitorId: id, tick, ledgerEntryId: id,entry:nullable(object({habitatId:id,gate:cell,cell,price:number(1,Number.MAX_SAFE_INTEGER,true)})) });
const ticketProof=object({admission:admissionRule,entry:ledgerEntry});
const financeCheckpoint=object({version:oneOf(1),balance:integer(),entries:integer(),lastTick:tick,compactions:integer(),commandThrough:integer(),visitorThrough:tick,openSerials:array(number(1,MAX_TICK,true),3),maintenancePeriod:tick,
totals:object(Object.fromEntries(LEDGER_KINDS.map(k=>[k,number(-Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER,true)]))),counts:object(Object.fromEntries(LEDGER_KINDS.map(k=>[k,integer()]))),purchases:array(object({entry:ledgerEntry,refunded:integer()}),256),refunds:array(object({entry:ledgerEntry,restored:integer()}),256),tickets:array(ticketProof,35),rewards:array(ledgerEntry,4),lastTicket:nullable(ticketProof)});
const schema = object({
  schemaVersion: oneOf(1), randomSeed: number(1,0xffffffff,true), randomState: number(1,0xffffffff,true), tick, gameTimeMs: integer(), currency: integer(), economy:object({maintenancePeriod:tick,nextCommand:number(1,Number.MAX_SAFE_INTEGER,true),checkpoint:financeCheckpoint,recovery:object({lastRationTick:nullable(tick),rationBatches:integer(),equipmentGrants:integer(),habitatGrant:nullable(object({id,tick}))})}),
  world: object({ width: number(1,32,true), height: number(1,32,true), gate: cell,
    tiles: array(object({ cell, terrain: oneOf('land','creek'), occupantId: nullable(id), path: bool }),1024),
    habitats: array(object({ id, cells: array(cell,256), viewingCell: nullable(cell) }),8),
    resources: array(object({ id, kind: oneOf('food','water','perch'), habitatId: id, cell, stock: integer(10000), capacity: number(1,10000,true),revision:tick,portions:nullable(array(integer(10000),2)) }),32),
  }),
  animals: array(object({ id, speciesId: oneOf(SPECIES_ID), habitatId: nullable(id), position: nullable(point), target: nullable(point), targetResourceId: nullable(id), hunger: percent, thirst: percent, energy: percent, habitatFit: percent, enrichment: percent, welfare: percent, care:object({low:bool,hungry:bool,thirsty:bool,tired:bool,bored:bool}), currentBehavior: oneOf('idle','wander','perch','seek-food','eat','seek-water','drink','rest','enrich','seek-rest'),motion:object({phase:oneOf('idle','look','walk-out','walk-home','ascend','perch','descend','seek-food','eat','leave-food','seek-water','drink','water-back','water-hop','leave-water','water-home','water-abort','seek-rest','rest','enrich'),ticksLeft:integer(120),sequence:tick,heading:number(-Math.PI*2,Math.PI*2),elevation:number(0,.2604000001)}),foodEaten:tick,waterDrunk:tick,restedTicks:tick,enrichedTicks:tick }),2),
  visitors: array(object({ id, position: point, route: array(cell,1024), routeIndex: integer(1023), phase: oneOf('arrival','queued','entering','viewing','leaving','exiting'), satisfaction: nullable(percent),entry:nullable(object({status:oneOf('pending','paid','free'),tick:nullable(tick),reason:oneOf('none','no-animals')})),experience:nullable(object({samples:integer(30),occupiedSamples:integer(30),welfareHundredths:integer(300000),feedback:nullable(feedback)})), admissionId: nullable(id),arrival:nullable(object({serial:number(1,MAX_TICK,true),slot:integer(2),spawnTick:tick})),journey:nullable(object({habitatId:nullable(id),heading:number(-Math.PI,Math.PI),dwellTicks:integer(30),queuedTicks:integer(6000),viewed:bool,startedTick:nullable(tick)})) }),32),
  visitorFlow:object({open:bool,nextSerial:number(1,MAX_TICK,true),cooldownTicks:integer(ATTRACTION_RULES.maxIntervalTicks),viewedTotal:tick,feedback:object({evaluated:tick,scored:tick,scoreSum:integer(),positive:tick,negative:tick,interrupted:tick,recent:array(feedback,4)})}),
  admissions: array(admissionRule,8192),
  ledger: array(ledgerEntry,8192),
  missions: object({ currentId: nullable(missionId), completedIds: array(missionId,4), rewards: array(object({ missionId, ledgerEntryId: id }),4),
    objectives: object({ habitatConnected: bool, birdsFedIds: array(id,2), birdsWateredIds: array(id,2), comfortableTicks: tick, viewedVisitorIds: array(id,32), thrivingTicks: tick }),
  }),
  preferences: object({ locale: oneOf('id','en'), graphics: oneOf('auto','low','high'), muted: bool, reducedMotion: bool }),
});

const key = (p: {x:number;z:number}) => `${p.x},${p.z}`;
function unique(values: string[], path: string) { requireValue(new Set(values).size === values.length,path); }
function relationships(s: ZooSaveV1) {
  requireValue(s.gameTimeMs === s.tick * TICK_MS,'$.gameTimeMs');
  requireValue(s.economy.maintenancePeriod<=Math.floor(s.tick/MONEY_RULES.maintenanceTicks),'$.economy.maintenancePeriod');
  const w=s.world;
  if(w.habitats.length&&s.economy.maintenancePeriod>0){const since=s.economy.maintenancePeriod*MONEY_RULES.maintenanceTicks,covered=s.economy.maintenancePeriod<=s.economy.checkpoint.maintenancePeriod||s.ledger.some(e=>e.kind==='maintenance'&&e.operationId===`maintenance-${s.economy.maintenancePeriod}`&&e.tick>=since&&e.amount<=-PRICES.maintenance&&e.amount%PRICES.maintenance===0&&e.relatedId===null)||w.habitats.every(h=>s.economy.recovery.habitatGrant?.id===h.id&&s.economy.recovery.habitatGrant.tick>=since||s.ledger.some(e=>{if(e.tick<since)return false;if(e.kind==='build')return e.relatedId===h.id;if(e.kind!=='restore')return false;const refund=e.relatedId?ledgerProof(s,e.relatedId):undefined,paid=refund?.relatedId?ledgerProof(s,refund.relatedId):undefined;return paid?.kind==='build'&&paid.relatedId===h.id;}));requireValue(covered,'$.economy.maintenanceProof');}
      const relief=s.economy.recovery;requireValue(relief.lastRationTick===null?relief.rationBatches===0:relief.rationBatches>0&&relief.lastRationTick<=s.tick,'$.economy.recovery.rations');if(relief.habitatGrant){const grant=relief.habitatGrant,n=/^habitat-support-([1-9][0-9]*)$/.exec(grant.id);requireValue(Boolean(n)&&Number(n![1])<s.economy.nextCommand&&grant.tick<=s.tick&&relief.equipmentGrants>0,'$.economy.recovery.habitatGrant');}
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
  for(const r of w.resources)requireValue(r.kind!=='perch'?r.portions!==null&&r.portions.length===2&&r.portions[0]+r.portions[1]===r.stock&&r.portions[0]<=Math.ceil(r.capacity/2)&&r.portions[1]<=Math.floor(r.capacity/2):r.portions===null,`$.resource.${r.id}.portions`);
  const resourceById=new Map(w.resources.map(r=>[r.id,r]));
  requireValue(s.animals.length===2,'$.animals');
  for(const a of s.animals) {
    requireValue(a.foodEaten<=s.tick&&a.waterDrunk<=s.tick&&a.restedTicks+a.enrichedTicks<=s.tick,`$.animal.${a.id}.foodEaten`);
    if(['seek-rest','rest','enrich'].includes(a.motion.phase))requireValue(a.motion.ticksLeft>0,`$.animal.${a.id}.restCounter`);
    const inHabitat=(p:{x:number;z:number})=>inBounds(p) && occupied.get(key({x:Math.floor(p.x),z:Math.floor(p.z)}))===a.habitatId;
    if(a.habitatId===null) requireValue(a.position===null && a.target===null && a.targetResourceId===null && a.currentBehavior==='idle' && a.motion.phase==='idle' && a.motion.ticksLeft===0 && a.motion.elevation===0,`$.animal.${a.id}.reserve`);
    else {
      requireValue(habitats.has(a.habitatId) && a.position!==null && inHabitat(a.position),`$.animal.${a.id}.position`);
      if(a.target)requireValue(inHabitat(a.target),`$.animal.${a.id}.target`);
      if(a.motion.ticksLeft>0&&['idle','wander','perch','seek-food','eat','seek-water','drink','seek-rest','rest','enrich'].includes(a.currentBehavior)){
        const h=habitats.get(a.habitatId)!,slot=[...s.animals].sort((a,b)=>a.id.localeCompare(b.id)).findIndex(b=>b.id===a.id),home=birdHome(h,slot),m=a.motion;
        requireValue(supportsBirds(h)&&Math.abs(a.position!.x-home.ground.x)<=.090001&&a.position!.z>=home.perch.z&&a.position!.z<=home.ground.z+.25,`$.animal.${a.id}.motion.bounds`);
        const grounded=['idle','look','walk-out','walk-home','seek-food','eat','leave-food'].includes(m.phase),walking=m.phase==='walk-out'||m.phase==='walk-home'||m.phase==='leave-food',feeding=m.phase==='seek-food'||m.phase==='eat',watering=isWaterPhase(a),resting=m.phase==='rest'||m.phase==='enrich',seekingRest=m.phase==='seek-rest';
        requireValue(a.currentBehavior===(resting||seekingRest?m.phase:watering?(m.phase==='seek-water'||m.phase==='drink'?m.phase:'wander'):feeding?m.phase:grounded?(walking?'wander':'idle'):'perch')&&(!grounded||m.elevation===0),`$.animal.${a.id}.motion.phase`);
        requireValue((seekingRest||watering||walking||feeding||m.phase==='ascend'||m.phase==='descend')?a.target!==null:a.target===null,`$.animal.${a.id}.motion.target`);
        if(a.target)requireValue(Math.abs(a.target.x-home.ground.x)<=.090001&&a.target.z>=home.perch.z&&a.target.z<=home.ground.z+.25,`$.animal.${a.id}.motion.targetBounds`);
        if(grounded&&a.target)requireValue(a.target.z>=home.ground.z-.30,`$.animal.${a.id}.motion.groundTarget`);
        if(watering){const p=waterPort(h,slot);requireValue(m.phase==='water-hop'?m.elevation<=.040001:m.elevation===0,`$.animal.${a.id}.waterHeight`);if(m.phase==='seek-water'||m.phase==='drink')requireValue(a.target?.x===p.x&&a.target.z===p.z,`$.animal.${a.id}.waterPort`);if(m.phase==='drink')requireValue(a.position!.x===p.x&&a.position!.z===p.z&&Math.abs(m.heading-waterHeading(slot))<.001,`$.animal.${a.id}.waterContact`);}
        if(resting||seekingRest){const p=resting?restPort(h,slot):restGround(h,slot);requireValue(m.ticksLeft>0,`$.animal.${a.id}.restCounter`);if(resting)requireValue(a.position!.x===p.x&&a.position!.z===p.z&&m.elevation===BIRD_PERCH_HEIGHT&&Math.abs(m.heading-Math.PI)<.001&&a.target===null,`$.animal.${a.id}.restContact`);else requireValue(a.target?.x===p.x&&a.target.z===p.z&&m.elevation===0,`$.animal.${a.id}.restTarget`);requireValue(a.targetResourceId!==null&&resourceById.get(a.targetResourceId)?.kind==='perch',`$.animal.${a.id}.restResource`);}
        if(feeding){const p=foodPort(h,slot);requireValue(a.target?.x===p.x&&a.target.z===p.z,`$.animal.${a.id}.foodPort`);if(m.phase==='eat')requireValue(a.position!.x===p.x&&a.position!.z===p.z&&Math.abs(m.heading)<.001,`$.animal.${a.id}.foodContact`);}
        if(m.phase==='perch')requireValue(m.elevation===BIRD_PERCH_HEIGHT&&a.position!.z===home.perch.z,`$.animal.${a.id}.motion.contact`);
      }
      if(a.targetResourceId)requireValue(resourceById.get(a.targetResourceId)?.habitatId===a.habitatId,`$.animal.${a.id}.targetResourceId`);
      if(['seek-food','eat','seek-water','drink'].includes(a.currentBehavior)) {
        const kind=['seek-food','eat'].includes(a.currentBehavior)?'food':'water';
        requireValue(a.target!==null && a.targetResourceId!==null && resourceById.get(a.targetResourceId)?.kind===kind,`$.animal.${a.id}.resourceBehavior`);
      }
    }
  }
  requireValue(coherentMoney(s),'$.economy.journal');
  const allAdmissions=admissionProofs(s),ledger=new Map<string,ZooSaveV1['ledger'][number]>();
  for(const e of [...s.economy.checkpoint.purchases.map(p=>p.entry),...s.economy.checkpoint.refunds.map(p=>p.entry),...s.economy.checkpoint.tickets.map(p=>p.entry),...s.economy.checkpoint.rewards,...s.ledger])ledger.set(e.id,e);
  const admissions=new Map(allAdmissions.map(a=>[a.id,a]));
  for(const a of allAdmissions){const e=ledger.get(a.ledgerEntryId)!;requireValue(a.tick<=s.tick&&e?.kind==='ticket'&&e.relatedId===a.id&&e.tick===a.tick,'$.admissions.reference');
    if(a.entry){const p=a.entry,serial=Number(a.visitorId.slice(8));requireValue(/^arrival-[1-9][0-9]*$/.test(a.visitorId)&&Number.isSafeInteger(serial)&&serial<s.visitorFlow.nextSerial&&a.id===`admission-${a.visitorId}`&&e.id===`ticket-${a.visitorId}`&&e.operationId===`admit-${a.visitorId}`&&e.amount===p.price&&key(p.gate)===key(w.gate)&&inBounds(p.cell)&&p.cell.x===p.gate.x&&Math.abs(p.cell.z-p.gate.z)===1,'$.admissions.entry');}
    else requireValue(!a.visitorId.startsWith('arrival-'),'$.admissions.generatedProof');
  }
  const fs=s.visitorFlow.feedback;
  requireValue(fs.evaluated===fs.scored+fs.interrupted&&fs.scored===fs.positive+fs.negative&&fs.evaluated<s.visitorFlow.nextSerial&&fs.scoreSum>=fs.positive*SATISFACTION_RULES.comfortableThreshold&&fs.scoreSum<=fs.positive*100+fs.negative*(SATISFACTION_RULES.comfortableThreshold-1)&&fs.recent.length===Math.min(fs.evaluated,SATISFACTION_RULES.recentLimit),'$.visitorFlow.feedback');
  unique(fs.recent.map(f=>f.visitorId),'$.visitorFlow.feedback.ids');
  const feedbackValid=(f:ZooSaveV1['visitorFlow']['feedback']['recent'][number])=>{
    requireValue(/^arrival-[1-9][0-9]*$/.test(f.visitorId)&&Number(f.visitorId.slice(8))<s.visitorFlow.nextSerial&&f.tick<=s.tick&&f.occupiedSamples<=f.samples&&f.welfareHundredths<=f.occupiedSamples*10000,'$.visitors.feedback.reference');
    const observed=f.occupiedSamples?Math.round(f.welfareHundredths/f.occupiedSamples/100):null;
    requireValue(f.observedWelfare===observed,'$.visitors.feedback.welfare');
    if(f.outcome==='interrupted')requireValue(f.score===null&&f.reason!=='none','$.visitors.feedback.interrupted');
    else{
      requireValue(f.reason==='none'&&f.score!==null,'$.visitors.feedback.reason');
      if(f.outcome==='comfortable'||f.outcome==='concerned')requireValue(f.samples===30&&f.occupiedSamples>0&&f.habitatId!==null&&f.score===Math.round(f.welfareHundredths/f.samples/100)&&(f.outcome==='comfortable')===(f.score!>=SATISFACTION_RULES.comfortableThreshold),'$.visitors.feedback.score');
      else requireValue(f.score===0&&(f.outcome==='empty'?f.samples===30&&f.occupiedSamples===0&&f.habitatId!==null:f.samples===0&&f.occupiedSamples===0),'$.visitors.feedback.access');
    }
  };
  fs.recent.forEach(feedbackValid);
  if(fs.evaluated<=SATISFACTION_RULES.recentLimit){requireValue(fs.scoreSum===fs.recent.reduce((n,f)=>n+(f.score??0),0)&&fs.scored===fs.recent.filter(f=>f.score!==null).length&&fs.positive===fs.recent.filter(f=>f.outcome==='comfortable').length&&fs.interrupted===fs.recent.filter(f=>f.outcome==='interrupted').length,'$.visitorFlow.feedback.recentTotals');}

  requireValue(s.visitors.length<=ARRIVAL_RULES.capacity,'$.visitors.capacity');
  requireValue(s.visitorFlow.viewedTotal<s.visitorFlow.nextSerial,'$.visitorFlow.viewedTotal');
  unique(s.visitors.flatMap(v=>v.arrival&&!ownsCorridor(v)?[String(v.arrival.slot)]:[]),'$.visitors.slots');
  requireValue(s.visitors.filter(ownsCorridor).length<=1,'$.visitors.corridor');
  const safePaths=visitorPaths(w);
  for(const v of s.visitors) {
    if(v.arrival){
      const a=v.arrival,j=v.journey,age=s.tick-a.spawnTick;
      requireValue(v.entry!==null&&v.experience!==null&&v.id===`arrival-${a.serial}`&&a.serial<s.visitorFlow.nextSerial&&age>=0,'$.visitors.generated');
      const entry=v.entry;requireValue(entry!==null,'$.visitors.entry');if(!entry)continue;
      const receipt=allAdmissions.find(a=>a.visitorId===v.id);
      requireValue(a.serial>s.economy.checkpoint.visitorThrough||s.economy.checkpoint.openSerials.includes(a.serial),'$.visitors.retired');
      if(entry.status==='paid')requireValue(receipt?.id===v.admissionId&&receipt.entry!==null&&entry.reason==='none'&&entry.tick===receipt.tick&&entry.tick>=a.spawnTick,'$.visitors.entry.paid');
      else{
        requireValue(v.admissionId===null&&!receipt,'$.visitors.entry.unpaid');
        if(entry.status==='pending')requireValue(entry.tick===null&&entry.reason==='none'&&key(visitorCell(v))===key(w.gate),'$.visitors.entry.pending');
        else requireValue(entry.tick!==null&&entry.tick>=a.spawnTick&&entry.tick<=s.tick&&entry.reason==='no-animals','$.visitors.entry.free');
      }
      const e=v.experience;if(!e)continue;
      requireValue(e.occupiedSamples<=e.samples&&e.welfareHundredths<=e.occupiedSamples*10000,'$.visitors.experience');
      if(e.feedback){feedbackValid(e.feedback);const f=e.feedback;requireValue(f.visitorId===v.id&&f.score===v.satisfaction&&f.samples===e.samples&&f.occupiedSamples===e.occupiedSamples&&f.welfareHundredths===e.welfareHundredths,'$.visitors.experience.feedback');}
      else requireValue(v.satisfaction===null,'$.visitors.experience.pending');
      if(v.phase==='arrival'){
        const p=arrivalPosition(w.gate,a.slot,age);
        requireValue(j===null&&age<ARRIVAL_RULES.lifetimeTicks&&Math.abs(v.position.x-p.x)<1e-9&&Math.abs(v.position.z-p.z)<1e-9&&v.routeIndex===0&&v.route.length===1&&key(v.route[0])===key(w.gate),'$.visitors.arrival.position');
        continue;
      }
      requireValue(j!==null,'$.visitors.journey');if(!j)continue;
      requireValue(j.startedTick===null||j.startedTick<=s.tick,'$.visitors.journey.tick');
      requireValue(inBounds(v.position)&&safePaths.has(key(visitorCell(v)))&&v.route.length>0&&v.routeIndex<v.route.length,'$.visitors.journey.position');
      for(let i=0;i<v.route.length;i++){requireValue(safePaths.has(key(v.route[i])),'$.visitors.route');if(i)requireValue(Math.abs(v.route[i].x-v.route[i-1].x)+Math.abs(v.route[i].z-v.route[i-1].z)===1,'$.visitors.route.adjacency');}
      requireValue(visitorRoute(w,visitorCell(v),w.gate).length>0,'$.visitors.escape');
      const waypoint=v.route[v.routeIndex],previous=v.route[Math.max(0,v.routeIndex-1)],p=v.position;
      if(v.phase==='entering'||v.phase==='leaving'){
        if(v.routeIndex===0)requireValue(key(visitorCell(v))===key(waypoint),'$.visitors.route.start');
        else requireValue((previous.x===waypoint.x&&Math.abs(p.x-waypoint.x-.5)<1e-9&&p.z>=Math.min(previous.z,waypoint.z)+.5-1e-9&&p.z<=Math.max(previous.z,waypoint.z)+.5+1e-9)||(previous.z===waypoint.z&&Math.abs(p.z-waypoint.z-.5)<1e-9&&p.x>=Math.min(previous.x,waypoint.x)+.5-1e-9&&p.x<=Math.max(previous.x,waypoint.x)+.5+1e-9),'$.visitors.route.segment');
      }

      if(!ownsCorridor(v)){
        requireValue((v.phase==='queued'||v.phase==='exiting')&&j.habitatId===null&&!j.viewed&&key(visitorCell(v))===key(w.gate)&&Math.abs(v.position.x-(w.gate.x+.19+a.slot*.31))<1e-9&&v.position.z>=w.gate.z+.58-1e-9&&v.position.z<=w.gate.z+.88+1e-9,'$.visitors.queue');
      }else{
        requireValue(['entering','viewing','leaving','exiting'].includes(v.phase),'$.visitors.phase');
        if(v.phase==='entering'||v.phase==='viewing')requireValue(j.habitatId!==null&&habitats.has(j.habitatId),'$.visitors.target');
        if(v.phase==='viewing')requireValue(v.routeIndex===v.route.length-1&&Math.abs(v.position.x-v.route.at(-1)!.x-.5)<1e-9&&Math.abs(v.position.z-v.route.at(-1)!.z-.5)<1e-9,'$.visitors.viewing');
      }
      continue;
    }
    requireValue(v.journey===null&&v.experience===null&&v.entry===null,'$.visitors.legacyJourney');
    requireValue(v.arrival===null&&v.satisfaction!==null&&v.admissionId!==null,'$.visitors.admission');
    requireValue(inBounds(v.position) && tiles.get(key({x:Math.floor(v.position.x),z:Math.floor(v.position.z)}))?.path===true && admissions.get(v.admissionId!)?.visitorId===v.id && v.route.length>0 && v.routeIndex<v.route.length,'$.visitors.reference');
    for(let i=0;i<v.route.length;i++) { const p=v.route[i]; requireValue(tiles.get(key(p))?.path===true,'$.visitors.route'); if(i)requireValue(Math.abs(p.x-v.route[i-1].x)+Math.abs(p.z-v.route[i-1].z)===1,'$.visitors.route.adjacency'); }
  }
  const m=s.missions;
  requireValue(m.completedIds.every((id,i)=>id===MISSION_IDS[i]) && m.currentId===(MISSION_IDS[m.completedIds.length]??null),'$.missions.order');
  requireValue(m.rewards.length===m.completedIds.length,'$.missions.claims');
  unique(m.rewards.map(r=>r.missionId),'$.missions.rewards'); unique(m.rewards.map(r=>r.ledgerEntryId),'$.missions.rewardLedger');
  for(const r of m.rewards) { const e=ledger.get(r.ledgerEntryId); requireValue(m.completedIds.includes(r.missionId) && MISSION_RULES[r.missionId].enabled && e?.kind==='reward' && e.relatedId===r.missionId && e.amount===MISSION_RULES[r.missionId].coins,'$.missions.rewards.reference'); }
  for(const e of [...s.economy.checkpoint.rewards,...s.ledger])if(e.kind==='reward')requireValue(m.rewards.some(r=>r.ledgerEntryId===e.id),'$.ledger.reward');
  requireValue(s.economy.checkpoint.rewards.length===s.economy.checkpoint.counts.reward,'$.missions.archivedRewards');
  const birdIds=new Set(s.animals.map(a=>a.id)); const visitorIds=new Set(allAdmissions.map(a=>a.visitorId));
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
