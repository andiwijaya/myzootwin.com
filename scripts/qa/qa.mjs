import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, readFile, writeFile, appendFile, readdir, rm, realpath, lstat } from 'node:fs/promises';
import { spawn, execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { BROWSER_CASES, now, sha256, childPath, json, readJson, identities, assessRun, runNode, portFree, stopChild, safeRunDirectories, browserVerdict, sourceFingerprint, pageMetadata, fixtureIdentityMatches } from './tooling.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const output=join(root,'.qa'),runs=join(output,'runs');
const astro=join(root,'node_modules/astro/astro.js'),vite=join(root,'node_modules/vite/bin/vite.js');
const command=process.argv[2]??'local';
const owned=new Set();let aborted=false,releaseServe;
process.once('SIGINT',()=>{aborted=true;for(const child of owned)child.kill('SIGTERM');releaseServe?.();});
process.once('SIGTERM',()=>{aborted=true;for(const child of owned)child.kill('SIGTERM');releaseServe?.();});
const runIdPattern=/^\d{8}T\d{6}Z-[a-f0-9]{8}$/;
async function latest() {
  const id=process.argv[3]??(await readJson(join(output,'latest.json'))).runId;
  if(!runIdPattern.test(id))throw Error('Expected a QA run ID, not a filesystem path');
  const directory=childPath(runs,id),owner=await readJson(join(directory,'qa-owner.json'));
  if(owner.owner!=='myzootwin-local-qa-v1'||owner.runId!==id)throw Error('Not an owned QA run');
  return {directory,report:await readJson(join(directory,'report.json'))};
}
async function unchanged(report) {
  const current=await identities(root);
  if(current.build.id!==report.build.id||current.source.id!==report.source.id)throw Error('Source/build changed since this run. Run qa:local again; old browser evidence cannot pass.');
}
function preview(args,log) {
  const child=spawn(process.execPath,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,NO_COLOR:'1',FORCE_COLOR:'0'}});
  owned.add(child);let bytes=0;
  for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{bytes+=data.length;if(bytes>2_000_000){child.kill();log.overflow=true;}else log.text+=data.toString();});
  child.once('error',error=>{log.error=error.message;});child.once('close',()=>owned.delete(child));return child;
}
async function waitFor(url,child) {
  for(let attempt=0;attempt<100;attempt++) {
    if(aborted||child.exitCode!==null||child.signalCode!==null)throw Error('Owned preview stopped before readiness');
    try { const response=await fetch(url,{signal:AbortSignal.timeout(500)});if(response.ok)return; } catch { /* bounded readiness, not a test PASS */ }
    await new Promise(done=>setTimeout(done,100));
  }
  throw Error('Owned loopback preview readiness timed out');
}
async function stopAll() { await Promise.all([...owned].map(child=>stopChild(child))); }
async function requireFree() { for(const port of [4321,4322])if(!await portFree(port))throw Error(`Loopback port ${port} is occupied; no unowned process will be stopped.`); }
async function routeChecks(report) {
  const baseline=await readJson(join(root,'docs/qa/m0-02/baseline-results.json'));
  const routes=['/','/animals/','/wildlife/','/pets/','/learn/','/adventures/','/gear/','/about/','/play/'];
  const observations=[];
  for(const path of routes) {
    const response=await fetch('http://127.0.0.1:4321'+path,{signal:AbortSignal.timeout(5000)}),html=await response.text();
    const built=await readFile(join(root,'dist',path,'index.html'),'utf8');
    if(response.status!==200||sha256(html)!==sha256(built))throw Error(`Wrong/non-current built route: ${path}`);
    const meta=pageMetadata(html);
    if(meta.canonical!=='https://myzootwin.com'+path)throw Error(`Canonical regression ${path}`);
    const prior=baseline.desktopRoutes.find(x=>x.path===path)?.direct;
    const normalize=text=>text.replaceAll('â€”','-').replace(/\s+/g,'');
    if(prior&&(normalize(meta.title)!==normalize(prior.title)||normalize(meta.h1)!==normalize(prior.h1)))throw Error(`Baseline journal metadata regression ${path}`);
    observations.push({path,status:response.status,sha256:sha256(html),...meta});
  }
  const direct=await fetch('http://127.0.0.1:4321/play',{signal:AbortSignal.timeout(5000)});
  if(!direct.ok||pageMetadata(await direct.text()).canonical!=='https://myzootwin.com/play/')throw Error('Direct /play regression');
  const sitemap=await (await fetch('http://127.0.0.1:4321/sitemap-0.xml')).text();
  if([...sitemap.matchAll(/<loc>/g)].length!==9||!routes.every(path=>sitemap.includes('https://myzootwin.com'+path)))throw Error('Nine-route sitemap regression');
  return {status:'PASS',observedAt:now(),routes:observations,directPlay:true,sitemapCount:9,buildId:report.build.id};
}
async function local() {
  await mkdir(runs,{recursive:true});
  if((await safeRunDirectories(runs)).length>=5)throw Error('Five generated QA runs already exist. Review/archive receipts, then qa:prune (dry-run first); historical docs/qa is never pruned.');
  const runId=now().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')+'-'+randomUUID().slice(0,8);
  const directory=childPath(runs,runId);await mkdir(directory);await json(join(directory,'qa-owner.json'),{owner:'myzootwin-local-qa-v1',runId});
  const inputSource=await sourceFingerprint(root);
  const testFiles=(await readdir(join(root,'tests'))).filter(name=>name.endsWith('.test.mjs')).sort().map(name=>'tests/'+name);
  const report={schemaVersion:1,runId,startedAt:now(),node:process.version,platform:process.platform,head:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim(),testFiles,sourceStart:inputSource,stages:{unit:{status:'UNRUN'},check:{status:'UNRUN'},build:{status:'UNRUN'},routes:{status:'UNRUN'},browser:{status:'UNRUN',required:BROWSER_CASES},cleanup:{status:'UNRUN'}},status:'UNRUN'};
  const save=()=>json(join(directory,'report.json'),report);await save();await json(join(output,'latest.json'),{runId});
  let current='unit';
  try {
    for(const [kind,args] of [['unit',['--experimental-strip-types','--test','--test-reporter=tap',...testFiles]],['check',[astro,'check']],['build',[astro,'build']]]) {
      current=kind;const startedAt=now();console.log(`QA ${runId}: ${kind}...`);
      const result=await runNode(args,{cwd:root,children:owned,environment:kind==='build'?{MYZOO_QA_ANALYZE:'1'}:{}});
      const log=(result.stdout+'\n'+result.stderr).split(/\r?\n/).map(x=>x.trimEnd()).join('\n').trimEnd()+'\n';
      await writeFile(join(directory,kind+'.log'),log);
      const summary=assessRun(result,kind);
      report.stages[kind]={status:'PASS',startedAt,finishedAt:now(),exitCode:result.exitCode,log:kind+'.log',logSha256:sha256(log),logBytes:Buffer.byteLength(log),summary};await save();
    }
    const identity=await identities(root);if(identity.source.id!==inputSource.id)throw Error('Source changed during local checks; rerun the workflow');report.source=identity.source;report.build=identity.build;
    const play=await readFile(join(root,'dist/play/index.html'),'utf8');
    report.entryScript=play.match(/<script[^>]+src="([^"]*PlayEntry[^"\s]+\.js)"/)?.[1];if(!report.entryScript)throw Error('Missing built entry script');
    current='routes';await requireFree();const log={text:''},child=preview([astro,'preview','--host','127.0.0.1','--port','4321'],log);
    try {await waitFor('http://127.0.0.1:4321/play/',child);report.stages.routes=await routeChecks(report);if(log.overflow||log.error)throw Error('Preview log incomplete');}
    finally {await stopChild(child);await writeFile(join(directory,'preview.log'),log.text);}
    const prepared=await runNode([join(root,'tests/browser/prepare-preview-harness.mjs'),runId,report.build.id,report.source.id],{cwd:root,children:owned});assessRun(prepared,'fixture');
    if(!fixtureIdentityMatches(await readFile(join(root,'tests/browser/.generated/preview-harness.html'),'utf8'),report))throw Error('Generated fixture is missing the exact run/build/source identity');
    await json(join(directory,'browser-template.json'),{runId,buildId:report.build.id,sourceId:report.source.id,method:'approved-cua-isolated-browser',physicalDevice:false,startedAt:null,finishedAt:null,ownedTabsClosed:false,viewportReset:false,console:{entries:[],limit:200,capped:false},cases:BROWSER_CASES.map(id=>({id,status:'UNRUN',observedAt:null,data:{}}))});
  } catch(error) { report.stages[current]={...report.stages[current],status:'FAIL',error:error.message};report.status='FAIL';process.exitCode=1; }
  finally {
    try {await stopAll();await requireFree();report.stages.cleanup={status:'PASS',observedAt:now(),ports:[4321,4322],note:'Only this command-owned processes were stopped.'};}
    catch(error){report.stages.cleanup={status:'FAIL',error:error.message};report.status='FAIL';process.exitCode=1;}
    report.finishedAt=now();await save();
  }
  console.log(JSON.stringify({runId,status:report.status,stages:Object.fromEntries(Object.entries(report.stages).map(([k,v])=>[k,v.status])),directory,browser:'UNRUN until supported browser receipt is verified'},null,2));
}
async function serve() {
  const {directory,report}=await latest();for(const key of ['unit','check','build','routes'])if(report.stages[key].status!=='PASS')throw Error('Local checks must PASS first');
  await unchanged(report);if(!fixtureIdentityMatches(await readFile(join(root,'tests/browser/.generated/preview-harness.html'),'utf8'),report))throw Error('Regenerate fixture with this run identity');await requireFree();
  const logs=[{text:''},{text:''}];
  const children=[preview([astro,'preview','--host','127.0.0.1','--port','4321'],logs[0]),preview([vite,'--host','127.0.0.1','--port','4322','--strictPort'],logs[1])];
  try {
    await Promise.all([waitFor('http://127.0.0.1:4321/play/',children[0]),waitFor('http://127.0.0.1:4322/tests/browser/.generated/preview-harness.html',children[1])]);
    await json(join(directory,'serve.json'),{runId:report.runId,startedAt:now(),status:'RUNNING',ownedPids:children.map(x=>x.pid),urls:['http://127.0.0.1:4321/play/','http://127.0.0.1:4322/tests/browser/.generated/preview-harness.html']});
    console.log(`Run ${report.runId}\nBuild ${report.build.id}\nSource ${report.source.id}\nEvidence directory ${directory}\nPreview 4321 + labelled fixture 4322 ready on 127.0.0.1. Use the approved isolated browser recipe; type stop then Enter for verified graceful cleanup.`);
    await new Promise(done=>{releaseServe=done;process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>{if(chunk.trim()==='stop'){aborted=true;done();}});process.stdin.resume();for(const child of children)child.once('close',done);});
    process.stdin.pause();
    if(!aborted)throw Error('A preview exited before requested cleanup');
  } finally {
    await stopAll();await requireFree();
    await json(join(directory,'serve.json'),{runId:report.runId,finishedAt:now(),status:'STOPPED',portsFree:true,logOverflow:logs.some(x=>x.overflow)});
    for(let i=0;i<logs.length;i++)await writeFile(join(directory,`browser-preview-${i+1}.log`),logs[i].text);
    console.log('Owned previews stopped; both loopback ports are free.');
  }
}
async function verify() {
  const {directory,report}=await latest();let verdict;
  try {
    await unchanged(report);
    for(const key of ['unit','check','build']) {
      const stage=report.stages[key];if(stage.log!==key+'.log')throw Error('Unexpected stage log path');const log=await readFile(childPath(directory,stage.log),'utf8');
      if(stage.status!=='PASS'||sha256(log)!==stage.logSha256)throw Error(`Changed/incomplete ${key} log`);
      assessRun({exitCode:stage.exitCode,stdout:log},key);
    }
    let receipt;try{const receiptPath=join(directory,'browser-receipt.json');if((await lstat(receiptPath)).size>1_000_000)throw Error('Browser receipt exceeds size budget');receipt=await readJson(receiptPath);}catch(error){if(error.code!=='ENOENT')throw error;}
    verdict=browserVerdict(receipt,report);
    const screenshots=[];
    if(receipt)for(const row of receipt.cases??[])if(row.screenshot) {
      if(!/^screens\/[a-z0-9-]+\.jpg$/.test(row.screenshot))throw Error('Unexpected screenshot path');
      const path=childPath(directory,row.screenshot);if((await lstat(path)).isSymbolicLink())throw Error('Screenshot symlink refused');childPath(await realpath(directory),await realpath(path));
      const data=await readFile(path);if(data.length<1000||data.length>2_000_000||data[0]!==0xff||data[1]!==0xd8||data.at(-2)!==0xff||data.at(-1)!==0xd9)throw Error('Missing/oversize/non-JPEG screenshot');
      screenshots.push({path:row.screenshot,bytes:data.length,sha256:sha256(data)});
    }
    if(screenshots.length>8)throw Error('Screenshot budget exceeded');if(new Set(screenshots.map(x=>x.sha256)).size!==screenshots.length)throw Error('Duplicate screenshots cannot prove different browser cases');
    try {if((await readJson(join(directory,'serve.json'))).logOverflow)throw Error('Browser preview log was capped');}catch(error){if(error.code!=='ENOENT')throw error;}
    report.stages.browser={...verdict,verifiedAt:now(),screenshots,receiptSha256:receipt?sha256(JSON.stringify(receipt)):null,method:'manual approved-runtime observations + automated receipt consistency checks; not an automated browser driver'};
    await requireFree();report.stages.cleanup={status:'PASS',observedAt:now(),ports:[4321,4322],tabs:'Operator must close owned tabs and reset viewport; see browser receipt.'};
    report.status=Object.values(report.stages).some(x=>x.status==='FAIL')?'FAIL':Object.values(report.stages).every(x=>x.status==='PASS')?'PASS':'UNRUN';
  }catch(error){report.stages.browser={status:'FAIL',verifiedAt:now(),error:error.message};report.status='FAIL';}
  await appendFile(join(directory,'verification-attempts.jsonl'),JSON.stringify({at:now(),status:report.status,browser:report.stages.browser})+'\n');
  await json(join(directory,'report.json'),report);
  console.log(JSON.stringify({runId:report.runId,status:report.status,browser:report.stages.browser,tests:report.stages.unit.summary},null,2));
  process.exitCode=report.status==='PASS'?0:report.status==='UNRUN'?2:1;
}
async function prune() {
  await mkdir(runs,{recursive:true});const list=await safeRunDirectories(runs),remove=list.slice(0,-3);
  const apply=process.argv.includes('--apply');console.log(JSON.stringify({mode:apply?'APPLY':'DRY RUN',keep:3,remove,scope:'.qa/runs only; never docs/qa, source, media or rollback history'},null,2));
  if(apply)for(const path of remove) { const real=await realpath(path),base=await realpath(runs),expected=join(await realpath(root),'.qa','runs');if(base.toLowerCase()!==expected.toLowerCase())throw Error('QA runs root resolves outside its named location');childPath(base,real);if(basename(real)!==basename(path))throw Error('Resolved run path changed');await rm(real,{recursive:true,force:false}); }
}
try {if(command==='local')await local();else if(command==='serve')await serve();else if(command==='verify')await verify();else if(command==='prune')await prune();else throw Error('Expected local, serve, verify or prune');}
catch(error){console.error(error.message);process.exitCode=1;await stopAll();}
