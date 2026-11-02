import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createSimulation} from '../src/game/core/simulation.ts';
import {serializeSave,parseSave,validateSave} from '../src/game/persistence/save-v1.ts';
import {MONEY_RULES} from '../src/game/economy/prices.ts';

const path=[[1,7],[2,7],[3,7],[3,6],[3,5]],branch={x:4,z:7};
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const key=p=>p.x+','+p.z;
function setup(){const s=createSimulation();assert.ok(s.buildHabitat({x:4,z:4},'habitat-trace',s.commandRevision()).ok);for(const[x,z]of path)assert.ok(s.buildPath({x,z},s.commandRevision()).ok);for(const kind of ['food','water','perch'])assert.ok(s[kind]('place',0,s.commandRevision()).ok);for(const kind of ['food','water'])assert.ok(s[kind]('refill',s[kind+'View']().revision,s.commandRevision()).ok);assert.ok(s.birds('welcome'));assert.ok(s.visitors(true));assert.equal(s.snapshot().currency,893);return s;}

// Separate cell-set flood fill, not the application's topology implementation.
function assertWorld(s){
 const x=s.snapshot(),w=x.world,tiles=new Map(w.tiles.map(t=>[key(t.cell),t])),open=new Set(),pending=[key(w.gate)];
 while(pending.length){const k=pending.pop();if(open.has(k))continue;const t=tiles.get(k);if(!t?.path||t.terrain!=='land'||t.occupantId!==null)continue;open.add(k);const{x,z}=t.cell;for(const p of [{x:x-1,z},{x:x+1,z},{x,z:z-1},{x,z:z+1}])pending.push(key(p));}
 const occupied=new Map();let connected=0;
 for(const h of w.habitats){for(const c of h.cells){assert.ok(!occupied.has(key(c)));occupied.set(key(c),h.id);}if(h.cells.some(({x,z})=>[{x:x-1,z},{x:x+1,z},{x,z:z-1},{x,z:z+1}].some(p=>open.has(key(p)))))connected++;}
 for(const t of w.tiles){assert.equal(t.occupantId,occupied.get(key(t.cell))??null);if(t.path)assert.ok(t.terrain==='land'&&t.occupantId===null);}
 assert.equal(s.access().connected,connected);assert.equal(s.access().reachablePathTiles,open.size);assert.equal(s.access().pathTiles,w.tiles.filter(t=>t.path).length);
 for(const h of s.pathTopology().habitats){if(!h.connected){assert.equal(h.route.length,0);continue;}assert.equal(key(h.route[0]),key(w.gate));assert.equal(key(h.route.at(-1)),key(h.viewingCell));h.route.forEach((p,i)=>{assert.ok(open.has(key(p)));if(i)assert.equal(Math.abs(p.x-h.route[i-1].x)+Math.abs(p.z-h.route[i-1].z),1);});}
 for(const a of x.animals){for(const field of ['hunger','thirst','energy','habitatFit','enrichment','welfare'])assert.ok(Number.isFinite(a[field])&&a[field]>=0&&a[field]<=100,field);if(a.habitatId)assert.equal(occupied.get(key({x:Math.floor(a.position.x),z:Math.floor(a.position.z)})),a.habitatId);}
 for(const r of w.resources){assert.equal(occupied.get(key(r.cell)),r.habitatId);assert.ok(r.stock>=0&&r.stock<=r.capacity);if(r.portions)assert.equal(r.stock,r.portions.reduce((n,x)=>n+x,0));}
 const valid=validateSave(x);assert.ok(valid.ok,JSON.stringify(valid));assert.equal(s.inspect().listenerErrors,0);
}
function assertMoney(s,expected){const x=s.snapshot();let running=x.economy.checkpoint.balance;for(const e of x.ledger){running+=e.amount;assert.equal(e.balanceAfter,running);}assert.equal(x.currency,running);assert.equal(x.currency,expected);assert.ok(Number.isSafeInteger(x.currency)&&x.currency>=0);assert.ok(x.ledger.length<MONEY_RULES.journalEntries);}

test('seeded mixed public-command traces preserve independent money/topology oracles, exact events and codec replay across speed partitions and journal folds',t=>{
 const summaries=[];
 for(const seed of [0x10203040,0x9e3779b9,0x6132026]){
  let rng=seed>>>0;const pick=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng;};
  let a=setup(),b=createSimulation(a.snapshot(),a.editorSnapshot()),expected=893,serial=0,resumes=0,edits=0,staleChecks=0,admissions=0;
  const streams=[[],[]],paid=new Set(),claimed=new Set(),stale=[];
  const attach=()=>[a,b].map((s,i)=>s.subscribe(e=>{streams[i].push(structuredClone(e));if(i===0&&e.type==='visitor-admitted'){assert.equal(e.amount,10);assert.ok(!paid.has(e.visitorId));paid.add(e.visitorId);expected+=10;admissions++;}if(i===0&&e.type==='mission-claimed'){assert.ok(!claimed.has(e.missionId));claimed.add(e.missionId);}if(i===0&&e.type==='tick'&&e.tick%61===0){assert.equal(s.frame(1_000_000+e.tick),0);assert.equal(s.advance(0),0);const copy=s.worldSnapshot();copy.tiles[0].path=!copy.tiles[0].path;}}));
  let off=attach();const op=()=>`edit-${(++serial).toString(16).padStart(32,'0')}`;
  const same=()=>{assert.deepEqual(a.snapshot(),b.snapshot());assert.deepEqual(a.editorSnapshot(),b.editorSnapshot());assertWorld(a);assertWorld(b);assertMoney(a,expected);assertMoney(b,expected);};
  const both=fn=>{const ra=fn(a),rb=fn(b);assert.deepEqual(ra,rb);return ra;};
  try{
   for(let group=0;group<150;group++){
    const rate=pick()%2?1:10;both(s=>s.setSpeed(rate));
    const quoted=a.commandRevision(),built=both(s=>s.buildPath(branch,s.commandRevision()));assert.ok(built.ok&&!built.duplicate,JSON.stringify(built));expected-=15;
    const removal=a.quoteRemoval({kind:'path',cell:branch});assert.ok(removal.ok);assert.equal(removal.quote.refund,15);const removeId=op();assert.ok(both(s=>s.remove(removal.quote,removeId)).ok);expected+=15;edits+=2;stale.push(quoted);
    if(group%5===0){const undoId=op();assert.ok(both(s=>s.undo(undoId,s.commandRevision())).ok);expected-=15;const q=a.quoteRemoval({kind:'path',cell:branch});assert.ok(q.ok);assert.equal(q.quote.refund,15);const id=op();assert.ok(both(s=>s.remove(q.quote,id)).ok);expected+=15;edits+=2;}
    for(const kind of ['food','water'])if(a[kind+'View']().stock<=3){assert.ok(both(s=>s[kind]('refill',s[kind+'View']().revision,s.commandRevision())).ok);expected-=kind==='food'?8:4;}
    const mission=a.missionView().rows.find(x=>x.status==='ready');if(mission){const quote={id:mission.id,command:a.commandRevision()};assert.ok(both(s=>s.claimMission(quote)).ok);expected+=({Q01:20,Q02:0,Q03:40,Q04:0})[mission.id];const encoded=serializeSave(a.snapshot());assert.equal(both(s=>s.claimMission(quote)).ok,false);assert.equal(serializeSave(a.snapshot()),encoded);}
    const beforeAdvance=a.snapshot();
    for(let n=0;n<10;n++){a.advance(100/rate);for(const ms of [17,23,60])b.advance(ms/rate);}
    expected-=(Math.floor(a.snapshot().tick/600)-Math.floor(beforeAdvance.tick/600))*2;
    same();
    const beforeReject=serializeSave(a.snapshot()),old=stale[pick()%stale.length];assert.equal(both(s=>s.buildPath(branch,old)).ok,false);assert.equal(serializeSave(a.snapshot()),beforeReject);staleChecks++;
    if(group%19===0){const before=serializeSave(a.snapshot());both(s=>s.setPaused(true));both(s=>s.advance(1e6));assert.equal(serializeSave(a.snapshot()),before);both(s=>s.setPaused(false));same();}
    if(group%23===22){const state=parseSave(serializeSave(a.snapshot()));assert.ok(state.ok);const editor=a.editorSnapshot();off.forEach(fn=>fn());a.dispose();b.dispose();assert.equal(a.inspect().subscribers+b.inspect().subscribers,0);a=createSimulation(state.value,editor);b=createSimulation(state.value,editor);off=attach();resumes++;same();}
   }
   same();assert.equal(a.snapshot().tick,1500);assert.ok(admissions>=3,JSON.stringify({admissions,visitor:a.visitorView(),mission:a.missionView(),birds:a.birdInspect()}));assert.ok(a.snapshot().missions.completedIds.length>=3);assert.ok(a.inspect().journalCompactions>=2);assert.deepEqual(streams[0],streams[1]);
   summaries.push({seed,groups:150,simulationTicks:1500,successfulEditOperations:edits,staleChecks,resumes,admissions,completed:a.snapshot().missions.completedIds,compactions:a.inspect().journalCompactions,currency:a.snapshot().currency,eventSHA256:hash(streams[0]),saveSHA256:hash(a.snapshot())});
  }finally{off.forEach(fn=>fn());a.dispose();b.dispose();assert.equal(a.inspect().subscribers+b.inspect().subscribers,0);}
 }
 t.diagnostic(JSON.stringify({scope:'Three seeded cross-module traces; actual fixed ticks, commands and codec, not real-time play or physical FPS',summaries}));
});

// Unrelated editing must not rewind either leg or erase an in-progress observation.
test('isolated path edits preserve the exact active visitor route, position, progress and observation',()=>{
 const s=setup();let serial=0;try{
  for(const phase of ['entering','viewing','leaving']){
   for(let n=0;n<900&&!s.snapshot().visitors.some(v=>v.phase===phase&&(phase!=='entering'||v.routeIndex>1));n++)s.advance(100);
   const before=s.snapshot().visitors;assert.ok(before.some(v=>v.phase===phase),phase);
   assert.ok(s.buildPath(branch,s.commandRevision()).ok);assert.deepEqual(s.snapshot().visitors,before);
   const q=s.quoteRemoval({kind:'path',cell:branch});assert.ok(q.ok);
   assert.ok(s.remove(q.quote,'edit-'+(++serial).toString(16).padStart(32,'0')).ok);assert.deepEqual(s.snapshot().visitors,before);assertWorld(s);
  }
 }finally{s.dispose();assert.equal(s.inspect().subscribers,0);}
});
