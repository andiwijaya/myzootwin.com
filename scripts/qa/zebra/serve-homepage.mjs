import {createServer} from 'node:http';
import {readFile,stat,writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname,sep} from 'node:path';

// Actual built pages/assets, with an inert Play destination for navigation QA.
// This is server-only test behavior: product bytes are never rewritten, and no
// default game database or engine is opened merely by testing a homepage CTA.
const root=resolve(process.argv[2]??''),workspace=resolve('.qa'),port=Number(process.argv[3]??52907);
if(!root.startsWith(workspace+sep)||!Number.isSafeInteger(port)||port<0||port>65535)throw Error('Explicit repository .qa root and loopback port required');
const receiptPath=resolve(process.argv[4]??'.qa/zebra-audit/hp6-02-server.json');
if(!receiptPath.startsWith(workspace+sep))throw Error('Server receipt must stay inside repository .qa');
const tracePath=process.argv[5]?resolve(process.argv[5]):null;
if(tracePath&&!tracePath.startsWith(workspace+sep))throw Error('Request trace must stay inside repository .qa');
if(tracePath)await writeFile(tracePath,'',{flag:'wx'});
let traceWrites=Promise.resolve();
function trace(record){if(tracePath)traceWrites=traceWrites.then(()=>appendFile(tracePath,JSON.stringify({at:new Date().toISOString(),...record})+'\n'));}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
const play=await readFile(resolve(root,'play/index.html'),'utf8'),suppressedPlayScripts=[...play.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[1]);
if(!suppressedPlayScripts.length)throw Error('Expected actual game scripts to suppress for navigation-only QA');
const server=createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);let file=resolve(root,'.'+pathname);
 if(file!==root&&!file.startsWith(root+sep))throw Error('Unsafe path');
 if((await stat(file)).isDirectory())file=resolve(file,'index.html');
 const inertPlay=file===resolve(root,'play/index.html');let body=await readFile(file);
 if(inertPlay){body=Buffer.from(body.toString('utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''));res.setHeader('Content-Security-Policy',"script-src 'none'");}
 res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 trace({method:req.method,url:req.url,status:200,bytes:body.length,sha256:createHash('sha256').update(body).digest('hex'),inertPlay});
 }catch{res.writeHead(404);res.end('Not found');trace({method:req.method,url:req.url,status:404,bytes:9});}});
server.listen(port,'127.0.0.1',async()=>{const receipt={origin:'http://127.0.0.1:'+server.address().port,pid:process.pid,root,inertPlay:true,suppressedPlayScripts,tracePath,scope:'Actual built homepage and destination markup. Play scripts suppressed only in this QA server response; navigation/path proof, not gameplay acceptance. Optional trace records local HTTP responses, not external requests or timing/FPS.'};await writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify(receipt));});
process.stdin.setEncoding('utf8');process.stdin.on('data',s=>{if(s.trim()==='stop')server.close(()=>{void traceWrites.then(()=>process.exit(0),error=>{console.error(error);process.exit(1);});});});
