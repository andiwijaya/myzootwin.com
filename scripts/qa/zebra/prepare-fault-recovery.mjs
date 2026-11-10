import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {sourceFingerprint,sha256} from '../tooling.mjs';

// Static preparation only: imports no simulation, browser, backend or test module.
// Execution of any test/build/native probe requires the separately coordinated slot.
if(process.argv.length!==2)throw Error('Static preparation accepts no execution options');
const root=process.cwd(),dir='docs/qa/zebra/r7-03';
const targets=[
 'tests/zebra-save-v5.test.mjs','tests/zebra-storage-v5.test.mjs',
 'tests/autosave.test.mjs','tests/autosave-candidate-drain.test.mjs',
 'tests/save-recovery.test.mjs','tests/pause-restart.test.mjs',
 'tests/conservation-grant.test.mjs','tests/giraffe-storage-v4.test.mjs',
 'tests/lion-storage-v3.test.mjs','tests/zebra-economy.test.mjs',
 'tests/zebra-missions.test.mjs','tests/zebra-visitors.test.mjs',
 'tests/zebra-capacity.test.mjs','tests/zebra-baseline.test.mjs'
];
const sources=[
 'src/game/persistence/save-v5.ts','src/game/persistence/zebra-backend.ts',
 'src/game/persistence/durable-backend.ts','src/game/persistence/autosave.ts',
 'src/game/persistence/checkpoint.ts','src/game/economy/journal.ts',
 'src/game/economy/tickets.ts','src/game/missions/zebra-missions.ts',
 'scripts/qa/visual3d/v5-storage.ts','tests/helpers/zebra-v5-fixture.mjs',
 'tests/helpers/zebra-care-play.mjs'
];
const evidence=async path=>{const bytes=await readFile(path);return {path,bytes:bytes.length,sha256:sha256(bytes)};};
const testFiles=[];
for(const path of targets){const s=await readFile(path,'utf8');const titles=[...s.matchAll(/\btest\(\s*(['"])(.*?)\1\s*,/gs)].map(m=>m[2]);assert.ok(titles.length,'No explicit test titles in '+path);testFiles.push({...await evidence(path),declaredTitles:titles,status:'INVENTORY_ONLY_NOT_EXECUTED'});}
const productionAndQaSources=[];for(const path of sources)productionAndQaSources.push(await evidence(path));
const matrix=[
 ['F01','Strict V5 parse boundary','zebra-save-v5,save-recovery,zebra-capacity','Representative native readonly codec probe: malformed/future/unknown/oversized/invalid relationships; source unchanged.'],
 ['F02','All frozen V1-V4 migrations','zebra-save-v5,zebra-storage-v5,zebra-baseline','Native representative V4 migration; exact legacy projections for all12 remain source-level coverage.'],
 ['F03','First V5 write atomic backup','zebra-storage-v5','Before/after eight known checkpoint keys; original V4 envelope and existing historical backup exact.'],
 ['F04','Quota before first V5 write','zebra-storage-v5','Synthetic target-primary quota error in actual native transaction; complete raw rows unchanged; retry succeeds once.'],
 ['F05','Actual transaction abort','zebra-storage-v5','Call actual target transaction.abort; no escaped second-abort error; all rows unchanged.'],
 ['F06','Two independent V5 tab owners','zebra-storage-v5,autosave-candidate-drain','Prepare same revision/generation, race real candidates, exactly one winner; loser memory unchanged/conflict.'],
 ['F07','Held and stale V4 binary barrier','zebra-storage-v5,giraffe-storage-v4','Owned held connection blocks then releases; current old V4 client cannot reopen/write over version5.'],
 ['F08','Post-migration quota/abort and retry','zebra-economy,zebra-missions','Original command candidate fails atomically then explicit retry/cold; no optimistic cash/stock/reward.'],
 ['F09','Corrupt primary with valid previous','zebra-storage-v5,save-recovery','Read refuses; review/cancel do not write; explicit restore preserves corrupt original and exact archival backups.'],
 ['F10','Future schema/envelope and unknown content','zebra-save-v5,zebra-storage-v5,save-recovery','Future schema/envelope blocked even with valid previous. Unknown-content refusal follows actual codec/recovery policy; no silent normalization.'],
 ['F11','Missing or corrupt migration provenance','zebra-storage-v5','Separate disposable branches for V4/V3 backup missing/corrupt; read/write/reset/recovery blocked without reconstruction.'],
 ['F12','Stale reviewed recovery quote','save-recovery,zebra-storage-v5','Second native tab changes the source; first quote cannot overwrite primary/previous/backups.'],
 ['F13','Generation/reset ABA and single-use Undo','zebra-storage-v5,pause-restart','Fresh disposable branch only: reset reaches revision1/new generation; stale writer rejected; Undo once/cold retains V5 and exact V4 archive.'],
 ['F14','Pending autosave drain and closing candidate','autosave,autosave-candidate-drain,conservation-grant','Original autosave serializes candidate and final checkpoint; saved/clean drain required before cold equality.'],
 ['F15','Actual Zebra mission award race/replay','zebra-missions','Real source ZQ01 candidate/expected command; one durable reward, no losing-tab adoption, quota/retry/cold exact.'],
 ['F16','Legacy grants and Zebra grant dependency','conservation-grant,zebra-economy,zebra-save-v5','Legacy grant/reward objects unchanged. No Zebra grant command exists; synthetic claimed-grant fixture does not close Z2-06 or prove1700ZC once-only.'],
 ['F17','One paid ticket per real admission','zebra-economy,zebra-visitors','Source-caused paid admission, cold duplicate check and compacted receipt history; no duplicate revenue, identities or reward viewer credit.'],
 ['F18','Final isolation, diagnostics and closure','all selected source files plus native receipts','Only fresh fault UUIDs; named lineage reads before write; no owner/default/carried/profile clearing; zero owned processes/owners/pending writes after close.']
].map(([id,title,sourceCoverage,nativePlan])=>({id,title,sourceCoverage:sourceCoverage.split(','),nativePlan,status:'NOT_RUN',nativeEvidence:null}));
await mkdir(dir,{recursive:true});
await writeFile(dir+'/matrix.json',JSON.stringify({status:'PREPARED_NOT_RUN',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),groups:matrix.length,scope:'Static plan and source inventory only; no case status inferred from historical tests.',cases:matrix},null,2)+'\n');
const inputs=await sourceFingerprint(root),prep={at:new Date().toISOString(),status:'PREPARED_STATIC_ONLY_NOT_RUN',verified:46,total:54,pendingUnit:'R7-03',checkpoint:'a979e11ae0136a009189386cfcbce9c0e493a0da',source:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceIdentity:'HEAD baseline plus complete current input fingerprint; this preparation script may be uncommitted at capture. Not a built or tested source claim.',sourceFingerprint:inputs.id,inputs,testFiles,declaredTitles:testFiles.reduce((n,t)=>n+t.declaredTitles.length,0),titleScope:'Static explicit test title extraction, not executed tests/assertions or a complete dependency inventory.',productionAndQaSources,plan:await evidence(dir+'/matrix.json'),design:await evidence(dir+'/design.md'),resources:{newBrowserTabs:0,newServers:0,testWorkers:0,builds:0,benchmarks:0,simulationTicks:0,userPreviewTouched:false,slot:'FARM_OWNS_HEAVY_AND_BROWSER'},execution:{testArgs:['--experimental-strip-types','--test','--test-reporter=tap','--test-concurrency=1',...targets],timeoutSeconds:900,outputLimitBytes:2000000,enabled:false,reason:'Wait for explicit Farm slot release. A later bounded runner must record before/after fingerprints, complete TAP and actual exit/timeout; this file does not run tests.'},open:['Current source/native R7-03 cases NOT_RUN','Dedicated QA fault/recovery controls not implemented or built; old storage probe is insufficient','Actual Zebra grant command/budget/exactly-once/public V5 gate Z2-06 remains open','R7-04 active soak/performance, V5 maintenance and R7-08 explicit publish authorization remain open'],noPushOrDeploy:true};
await writeFile(dir+'/preparation.json',JSON.stringify(prep,null,2)+'\n');
console.log(JSON.stringify({status:prep.status,verified:'46/54',plannedGroups:matrix.length,testFiles:testFiles.length,declaredTitles:prep.declaredTitles,source:prep.source,input:inputs.id,executed:0,browserOrBuildsStarted:0}));
