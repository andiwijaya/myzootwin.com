import {createServer} from 'node:http';
import {readFile,stat,writeFile} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
const id=process.argv[2];if(!/^[a-z0-9-]{1,60}$/.test(id??''))throw Error('Pass QA ID');
const base=resolve('.qa/habitat-focus',id),root=join(base,'lab');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.br':'model/gltf-binary','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{if(req.method!=='GET')throw Error('GET only');const url=new URL(req.url,'http://127.0.0.1');let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+sep))throw Error('Outside QA root');if((await stat(file)).isDirectory())file=join(file,'index.html');const bytes=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',...(file.endsWith('.br')?{'Content-Encoding':'br'}:{}),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
server.listen(0,'127.0.0.1',async()=>{const origin='http://127.0.0.1:'+server.address().port;await writeFile(join(base,'server.json'),JSON.stringify({origin,pid:process.pid}));console.log(origin+'/');});
process.stdin.setEncoding('utf8');process.stdin.on('data',value=>{if(value.trim()==='stop')server.close(()=>process.exit(0));});
