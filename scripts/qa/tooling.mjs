import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir, writeFile, lstat } from 'node:fs/promises';
import { join, relative, resolve, isAbsolute } from 'node:path';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';

export const BROWSER_CASES=['desktop-native','portrait-native-id','landscape-native-id','native-lifecycle','injected-failure-retry','navigation-reload'];
export const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
export const now=()=>new Date().toISOString();
export function within(root,path) { const part=relative(resolve(root),resolve(path));return part!==''&&!isAbsolute(part)&&part!=='..'&&!part.startsWith('..\\')&&!part.startsWith('../'); }
export function childPath(root,path) { const target=resolve(root,path);if(!within(root,target))throw Error('Path leaves the named QA directory');return target; }
export async function json(path,value) { await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,JSON.stringify(value,null,2)+'\n'); }
export const readJson=async path=>JSON.parse(await readFile(path,'utf8'));
export async function files(root,exclude=()=>false) {
  const result=[];
  async function walk(directory) {
    for(const entry of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
      const path=join(directory,entry.name);if(exclude(path))continue;
      if(entry.isSymbolicLink())throw Error(`Symlink not accepted in QA input: ${path}`);
      if(entry.isDirectory())await walk(path);else if(entry.isFile())result.push(path);
    }
  }
  await walk(root);return result;
}
export async function fingerprint(root,paths) {
  const entries=[];for(const path of [...paths].sort())entries.push({path:relative(root,path).replaceAll('\\','/'),sha256:sha256(await readFile(path))});
  return {id:sha256(JSON.stringify(entries)),entries};
}
export async function sourceFingerprint(root) {
  const source=[];
  for(const folder of ['src','tests','scripts','public'])source.push(...await files(join(root,folder),p=>p.includes(`${join('browser','.generated')}`)));
  for(const file of ['package.json','package-lock.json','astro.config.mjs','tsconfig.json','docs/qa/m0-02/baseline-results.json'])source.push(join(root,file));
  return fingerprint(root,source);
}
export async function identities(root) {
  return {source:await sourceFingerprint(root),build:await fingerprint(root,await files(join(root,'dist')))};
}
export function parseTap(text) {
  const names=['tests','pass','fail','cancelled','skipped','todo'];const counts={};
  for(const name of names) { const found=[...text.matchAll(new RegExp(`^# ${name} (\\d+)\\r?$`,'gm'))];if(found.length!==1)throw Error(`Missing/duplicate TAP ${name} summary`);counts[name]=Number(found[0][1]); }
  const plans=[...text.matchAll(/^1\.\.(\d+)\r?$/gm)];
  const completed=[...text.matchAll(/^(?:ok|not ok) \d+\b/gm)];
  if(!text.startsWith('TAP version 13')||plans.length!==1||Number(plans[0][1])!==completed.length||counts.tests<36||counts.pass!==counts.tests||counts.fail||counts.cancelled||counts.skipped||counts.todo||/^not ok /m.test(text))throw Error('Incomplete or unsuccessful TAP run');
  return counts;
}
export function assessRun(result,kind) {
  if(result.exitCode!==0||result.signal||result.overflow||result.timedOut)throw Error(`${kind} process failed, timed out or exceeded its log budget`);
  if(kind==='unit')return parseTap(result.stdout);
  const plain=result.stdout.replace(/\x1b\[[0-9;]*m/g,'');
  if(kind==='check'&&!/0 errors[\s\S]*0 warnings[\s\S]*0 hints/.test(plain))throw Error('Incomplete Astro check summary');
  if(kind==='build'&&(!/9 page\(s\) built/.test(plain)||!plain.includes('[build] Complete!')))throw Error('Incomplete nine-route build summary');
  return null;
}
/** Full capture up to a hard limit; reaching it always fails, never a capped-log PASS. */
export function runNode(args,{cwd,limit=2_000_000,timeoutMs=180_000,children,environment={}}={}) {
  return new Promise((done,reject)=>{
    const child=spawn(process.execPath,args,{cwd,windowsHide:true,env:{...process.env,NO_COLOR:'1',FORCE_COLOR:'0',...environment},stdio:['ignore','pipe','pipe']});
    children?.add(child);
    let stdout='',stderr='',bytes=0,overflow=false,timedOut=false;
    const consume=key=>data=>{bytes+=data.length;if(bytes>limit){overflow=true;child.kill();return;}if(key==='stdout')stdout+=data.toString();else stderr+=data.toString();};
    child.stdout.on('data',consume('stdout'));child.stderr.on('data',consume('stderr'));
    const timer=setTimeout(()=>{timedOut=true;child.kill();},timeoutMs);
    child.once('error',error=>{clearTimeout(timer);children?.delete(child);reject(error);});
    child.once('close',(exitCode,signal)=>{clearTimeout(timer);children?.delete(child);done({exitCode,signal,stdout,stderr,bytes,overflow,timedOut});});
  });
}
export async function portFree(port) {
  return new Promise(resolve=>{const server=createServer();server.once('error',()=>resolve(false));server.listen({host:'127.0.0.1',port,exclusive:true},()=>server.close(()=>resolve(true)));});
}
export async function stopChild(child) {
  if(child.exitCode!==null||child.signalCode!==null)return;
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Owned preview did not stop')),5000);child.once('close',()=>{clearTimeout(timer);resolve();});child.kill('SIGTERM');});
}
export async function safeRunDirectories(runs) {
  const result=[];
  for(const entry of await readdir(runs,{withFileTypes:true})) {
    const path=childPath(runs,entry.name);if(!entry.isDirectory()||entry.isSymbolicLink())throw Error('Unexpected QA run entry');
    const owner=await readJson(join(path,'qa-owner.json'));
    if(owner.owner!=='myzootwin-local-qa-v1'||owner.runId!==entry.name||(await lstat(path)).isSymbolicLink())throw Error('Refusing non-owned QA output');
    result.push(path);
  }
  return result.sort();
}
export function browserVerdict(receipt,report) {
  const errors=[],missing=[];const fail=message=>errors.push(message);
  if(!receipt)return {status:'UNRUN',errors:[],missing:BROWSER_CASES};
  if(receipt.runId!==report.runId||receipt.buildId!==report.build.id||receipt.sourceId!==report.source.id)fail('Stale/mismatched run, build or source identity');
  if(receipt.method!=='approved-cua-isolated-browser'||receipt.physicalDevice!==false)fail('Browser method/device claims are not this viewport recipe');
  const validTime=value=>Number.isFinite(Date.parse(value))&&Date.parse(value)>=Date.parse(report.startedAt)&&Date.parse(value)<=Date.now()+60_000;
  if(!validTime(receipt.startedAt)||!validTime(receipt.finishedAt)||Date.parse(receipt.finishedAt)<Date.parse(receipt.startedAt))fail('Missing/stale browser timestamps');
  if(receipt.ownedTabsClosed!==true||receipt.viewportReset!==true)fail('Browser cleanup was not confirmed');
  const consoleLog=receipt.console;
  if(!consoleLog||!Array.isArray(consoleLog.entries)||consoleLog.entries.length||!Number.isSafeInteger(consoleLog.limit)||consoleLog.limit<100||consoleLog.entries.length>=consoleLog.limit||consoleLog.capped!==false)fail('Missing, capped or nonempty native console observations');
  for(const id of BROWSER_CASES) {
    const matches=receipt.cases?.filter(x=>x.id===id)??[];if(matches.length!==1){missing.push(id);continue;}
    const row=matches[0];if(row.status==='UNRUN'){missing.push(id);continue;}if(row.status!=='PASS'||!validTime(row.observedAt)||Date.parse(row.observedAt)<Date.parse(receipt.startedAt)||Date.parse(row.observedAt)>Date.parse(receipt.finishedAt)){fail(`${id}: non-PASS/missing timestamp`);continue;}
    const d=row.data??{};
    if(id.endsWith('native')||id.endsWith('native-id')) {
      const [width,height]=id==='desktop-native'?[1366,768]:id==='portrait-native-id'?[360,780]:[780,360];
      if(d.width!==width||d.height!==height||!Number.isFinite(d.documentWidth)||d.documentWidth<=0||d.documentWidth>width||d.state!=='ready'||d.canvas!==1||d.visualReviewed!==true||row.screenshot!==`screens/${id}.jpg`||d.entryScript!==report.entryScript)fail(`${id}: viewport/render/build/screenshot mismatch`);
      if(id.endsWith('-id')&&d.lang!=='id')fail(`${id}: missing Indonesian state`);
    }
    if(id==='native-lifecycle') {
      if(d.harnessRunId!==report.runId||d.harnessBuildId!==report.build.id||d.harnessSourceId!==report.source.id)fail('Fixture identity mismatch');
      const samples=d.samples??[];
      if(!['ready','paused','still-paused','resumed','closed'].every(name=>samples.some(x=>x.name===name)))fail('Missing lifecycle phases');
      for(const sample of samples) {
        if(sample.maxActiveSessions!==1||sample.maxPendingRAFs!==1)fail('Duplicate session/RAF detected');
        if(sample.session) { const s=sample.session;if(s.simulationSubscribers!==1||s.simulationEvents!==s.simulationTick||s.simulationGameTimeMs!==s.simulationTick*100||Math.abs(s.markerRotation-s.simulationGameTimeMs*.00025)>1e-8)fail('Core/event/renderer integration mismatch'); }
        if(sample.name==='closed'&&(sample.canvasCount!==0||sample.pendingRAFs!==0||!sample.lastDisposed?.simulationDisposed||sample.lastDisposed?.simulationSubscribers!==0))fail('Core cleanup failed');
      }
      const paused=samples.find(x=>x.name==='paused')?.session,later=samples.find(x=>x.name==='still-paused')?.session,resumed=samples.find(x=>x.name==='resumed')?.session;
      if(!paused||!later||!resumed||paused.simulationTick!==later.simulationTick||paused.pendingFrames!==0||later.pendingFrames!==0||resumed.simulationTick<=later.simulationTick)fail('Pause/resume did not hold and resume fixed ticks');
    }
    if(id==='injected-failure-retry'&&(d.source!=='WEBGL_lose_context'||d.failedState!=='error'||d.failedReason!=='context-lost'||d.failedCanvas!==0||d.failedSubscribers!==0||d.retryState!=='ready'||d.retryCanvas!==1))fail('Injected failure/retry evidence invalid');
    if(id==='navigation-reload'&&(d.journalPath!=='/animals/'||d.returnPath!=='/play/'||d.returnCanvas!==0||d.reloadCanvas!==0||d.canonical!=='https://myzootwin.com/play/'))fail('Navigation/reload regression');
  }
  return {status:errors.length?'FAIL':missing.length?'UNRUN':'PASS',errors,missing};
}

export function pageMetadata(html) {
  const decode=text=>text.replace(/&(amp|lt|gt|quot|apos|#39|#\d+|#x[a-f0-9]+);/gi,(entity,name)=>{
    const common={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",'#39':"'"};
    if(common[name])return common[name];
    const value=name.toLowerCase().startsWith('#x')?parseInt(name.slice(2),16):parseInt(name.slice(1),10);
    return Number.isFinite(value)&&value>=0&&value<=0x10ffff?String.fromCodePoint(value):entity;
  });
  const read=(pattern,label)=>{const match=html.match(pattern);if(!match)throw Error(`Missing ${label}`);return decode(match[1].replace(/<[^>]+>/g,'').trim());};
  return {title:read(/<title>([\s\S]*?)<\/title>/,'title'),canonical:read(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/,'canonical'),h1:read(/<h1[^>]*>([\s\S]*?)<\/h1>/,'h1')};
}

export function fixtureIdentityMatches(html,report) {
  const value=id=>html.match(new RegExp(`id="${id}">([^<]+)</code>`))?.[1];
  return value('qa-run-id')===report.runId&&value('qa-build-id')===report.build.id&&value('qa-source-id')===report.source.id;
}
