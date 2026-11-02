import{files,fingerprint,sourceFingerprint,portFree}from'file:///C:/MyZooTwin/scripts/qa/tooling.mjs';
import{readFile,writeFile}from'node:fs/promises';
const root='C:/MyZooTwin',run='s20261102T091845Z',report=JSON.parse(await readFile(root+'/.qa/blackbox-m6-03/'+run+'/report.json','utf8'));
const source=await sourceFingerprint(root),build=await fingerprint(root,await files(root+'/'+report.buildDirectory)),owner=await fingerprint(root,await files(root+'/dist'));
const response=await fetch('http://127.0.0.1:4345/play/'),ports=[];
for(const port of[4322,4323,4346,4354,4355,4356,4358,4359,4360])ports.push({port,free:await portFree(port)});
const result={at:new Date().toISOString(),status:'PASS',sourceId:source.id,expectedSourceId:report.source.id,buildId:build.id,expectedBuildId:report.build.id,ownerBuildId:owner.id,ownerPreview:{url:'http://127.0.0.1:4345/play/',expectedPID:18816,http:response.status,unchangedBuild:owner.id,browserActions:'NONE',saveAccess:'NONE'},cleanup:{ports,normalQATabs:'Closed and viewport reset on valid QA context',oldQATab46:'Close UNRUN after previous policy block; not revisited',download:'BLOCKED/UNRUN, not attempted'}};
if(source.id!==report.source.id||build.id!==report.build.id||owner.id!=='e06d975a30b49470a1e80e915fbe39ce22ba102f16447dbef8776e7088d38b05'||response.status!==200||ports.some(x=>!x.free)){result.status='FAIL';process.exitCode=1;}
await writeFile(new URL('./m6-03-blackbox/final-guard.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
