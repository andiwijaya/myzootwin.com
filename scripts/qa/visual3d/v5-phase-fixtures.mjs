import {readFile,writeFile,mkdir,readdir,access} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {setPriority,constants} from 'node:os';
import {preparedZebraCare} from '../../../tests/helpers/zebra-care-play.mjs';
import {zebraCodecFixture} from '../../../tests/helpers/zebra-v5-fixture.mjs';
import {zebras} from '../../../src/game/core/zebra-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
import {zebraAccessView} from '../../../src/game/world/zebra-access.ts';
import {zebraGroomAmount} from '../../../src/game/animals/zebras/groom-contact.ts';
import {files,fingerprint,sha256} from '../tooling.mjs';
import {canonical} from '../zebra/baseline-fixtures.mjs';

export const V5_PHASE_IDS=['v5-zoo-baseline','v5-zebra-empty','v5-zebra-idle','v5-zebra-walk','v5-zebra-graze','v5-zebra-drink','v5-zebra-rest','v5-zebra-enrich','v5-zebra-follow','v5-zebra-trot','v5-zebra-approach','v5-zebra-groom-first','v5-zebra-groom-neutral','v5-zebra-groom-second','v5-zebra-groom-last','v5-zebra-groom-completion','v5-visitor-walk','v5-visitor-view'];
export async function prepareV5PhaseFixtures(){
 const root=resolve('.'),runtime=await fingerprint(root,[...await files('src/game'),...await files('src/game-entry'),'package-lock.json']),producerHash=sha256(await readFile('scripts/qa/visual3d/v5-phase-fixtures.mjs')),helperHash=sha256(await readFile('tests/helpers/zebra-care-play.mjs')),baseHash=sha256(await readFile('tests/fixtures/giraffe-v4-golden.json')),key=sha256(JSON.stringify({runtime:runtime.id,producerHash,helperHash,baseHash})),cache=resolve('.qa/visual3d-v5-phase-fixtures');await mkdir(cache,{recursive:true});
 for(const name of(await readdir(cache)).filter(n=>n===key||n.startsWith(key+'-')).sort().reverse()){
  const directory=join(cache,name),manifest=JSON.parse(await readFile(join(directory,'manifest.json'),'utf8').catch(e=>{if(e.code==='ENOENT')return'null';throw e;}));if(!manifest||manifest.status!=='COMPLETE'||manifest.key!==key)continue;
  if(manifest.records.length!==V5_PHASE_IDS.length||V5_PHASE_IDS.some(id=>!manifest.records.some(r=>r.id===id)))throw Error('V5 cached phase coverage mismatch');for(const r of manifest.records)if(sha256(await readFile(join(directory,r.id+'.json')))!==r.fileHash)throw Error('V5 phase cache hash mismatch');return{directory,manifest,reused:true};
 }
 let directory=join(cache,key);try{await access(directory);directory+='-'+Date.now();}catch(e){if(e.code!=='ENOENT')throw e;}await mkdir(directory);setPriority(process.pid,constants.priority.PRIORITY_BELOW_NORMAL);
 const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),records=[],seen=new Set(),refills=[],events=[],stepEvents=[],sim=preparedZebraCare();
 const save=async(id,state,actor=null,detail={})=>{
  if(seen.has(id))return;const checked=validateSaveV5(state);if(!checked.ok)throw Error('Invalid causal V5 case '+id+' '+checked.path);
  const {preferences,...gameplay}=state,metadata={id,schema:5,tick:state.tick,species:actor?.speciesId??null,phase:actor?.motion.phase??null,actors:actor?[{id:actor.id,ticksLeft:actor.motion.ticksLeft,position:actor.position}]:[],stateHash:sha256(canonical(state)),gameplayHash:sha256(canonical(gameplay)),producerSource:source,productionFingerprint:runtime.id,producerHash,baseHash,helperHash,mode:id==='v5-zebra-empty'?'validation-only-empty-data':'canonical-engine-after-labelled-validation-prerequisite',recipe:'Original V4 preserved. Historical synthetic grant/home prerequisite only; residents/facilities/refills/connection use real source commands, then sole advance100ms. No actor pose/need/position injection, free refill, new grant claim or public adoption acceptance.',detail,events:events.slice(-20)};
  const text=JSON.stringify({metadata,state})+'\n';await writeFile(join(directory,id+'.json'),text);records.push({...metadata,fileHash:sha256(text),bytes:Buffer.byteLength(text)});seen.add(id);console.log(JSON.stringify({v5PhaseFixture:id,tick:state.tick,actor:actor?.id??null}));
 };
 const unsubscribe=sim.subscribe(e=>{if(e.type!=='tick'){stepEvents.push(e);events.push(e);if(events.length>100)events.shift();}});
 try{
  for(let i=0;i<8&&!zebraAccessView(sim.snapshot()).connected;i++){const q=zebraAccessView(sim.snapshot());if(!q.path||!sim.buildPath(q.path.cell,sim.commandRevision()).ok)throw Error('V5 source connection refused');}if(!zebraAccessView(sim.snapshot()).connected)throw Error('V5 fifth route missing');
  await save('v5-zoo-baseline',sim.snapshot());await save('v5-zebra-empty',zebraCodecFixture({population:0,resources:false,habitat:false}));await save('v5-zebra-idle',sim.snapshot(),zebras(sim.snapshot().animals)[0]);
  for(let i=0;i<16000&&seen.size<V5_PHASE_IDS.length;i++){
   if(i%50===0)for(const r of sim.snapshot().world.resources){if(r.kind==='perch'||r.stock>=r.capacity/2)continue;const q={id:r.id,revision:r.revision,command:sim.commandRevision()};let ok;if(r.kind.startsWith('zebra-')){if(r.kind==='zebra-shade')continue;const p=sim.prepareZebraRefill(q);ok=p.ok&&sim.acceptCommittedZebraCare(p.state,q);}else ok=(r.kind==='food'?sim.food('refill',q.revision,q.command):r.kind==='water'?sim.water('refill',q.revision,q.command):r.kind.startsWith('elephant-')?sim.refillElephantCare(q):r.kind.startsWith('lion-')?sim.refillLionCare(q):sim.refillGiraffeCare(q)).ok;if(!ok)throw Error('Paid V5 phase refill refused '+r.id);refills.push({id:r.id,tick:sim.inspect().tick,command:q.command});}
   stepEvents.length=0;sim.advance(100);const state=sim.snapshot(),herd=zebras(state.animals);
   for(const a of herd){const p=a.motion.phase,left=a.motion.ticksLeft,step=Math.hypot(a.motion.lastStep.x,a.motion.lastStep.z);if(p==='wander'&&step>.01)await save('v5-zebra-walk',state,a);if(p==='graze'&&left===16)await save('v5-zebra-graze',state,a);if(p==='drink'&&left===20)await save('v5-zebra-drink',state,a);if(p==='rest'&&left===40)await save('v5-zebra-rest',state,a);if(p==='enrich'&&left===30)await save('v5-zebra-enrich',state,a);if(p==='follow-herd'&&step>.01)await save('v5-zebra-follow',state,a);if(p==='trot'&&step>.05&&(a.motion.trotDistance??0)>.15)await save('v5-zebra-trot',state,a);if(p==='approach-companion'&&step>.01)await save('v5-zebra-approach',state,a);if(p==='groom'){if(left===64&&zebraGroomAmount(a)===1)await save('v5-zebra-groom-first',state,a);if(left===40&&zebraGroomAmount(a)===0)await save('v5-zebra-groom-neutral',state,a);if(left===16&&zebraGroomAmount(a)===1)await save('v5-zebra-groom-second',state,a);if(left===1)await save('v5-zebra-groom-last',state,a);}}
   if(stepEvents.some(e=>e.type==='zebra-groomed'))await save('v5-zebra-groom-completion',state,null,{actualEvent:events.findLast(e=>e.type==='zebra-groomed')});
   const home=state.world.habitats.find(h=>h.kind==='zebra-grasslands');for(const v of state.visitors)if(v.journey?.habitatId===home?.id&&v.entry?.status==='paid'){if(v.phase==='entering')await save('v5-visitor-walk',state,null,{visitorId:v.id,phase:v.phase});if(v.phase==='viewing')await save('v5-visitor-view',state,null,{visitorId:v.id,phase:v.phase});}
   if(i%25===24)await new Promise(resolve=>setTimeout(resolve,5));
  }
 }finally{unsubscribe();sim.dispose();}
 const missing=V5_PHASE_IDS.filter(id=>!seen.has(id));if(missing.length)throw Error('Bounded actual V5 phase search missed '+missing.join(','));
 const manifest={version:1,status:'COMPLETE',key,source,productionFingerprint:runtime.id,producerHash,helperHash,baseHash,scope:'Source-command synthetic QA cases, not native render/real-time/grant-budget acceptance',refills,records};await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');return{directory,manifest,reused:false};
}
