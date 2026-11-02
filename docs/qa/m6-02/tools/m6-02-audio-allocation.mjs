import {createAmbience} from 'file:///C:/MyZooTwin/src/game/audio/ambience.ts';
import {writeFile} from 'node:fs/promises';
const label=process.argv[2];if(!['before','after'].includes(label))throw Error('Explicit measurement label required');
const sound=createAmbience(),Original=globalThis.Float32Array;let allocations=0,bytes=0,last;
try{globalThis.Float32Array=new Proxy(Original,{construct(target,args){const value=Reflect.construct(target,args);allocations++;bytes+=value.byteLength;return value;}});for(let i=0;i<10000;i++)last=sound.inspect();}finally{globalThis.Float32Array=Original;sound.dispose();}
if(last.status!=='muted'||last.signalRms!==0||last.liveContexts!==0||last.liveNodes!==0)throw Error('Inspection changed unstarted audio');
const result={at:new Date().toISOString(),label,scope:'Isolated Node process counts actual Float32Array constructions in10000 inspections of muted unstarted audio; transient allocation, not retained heap or user session frequency. No AudioContext or sound.',inspections:10000,sampleArrayAllocations:allocations,transientBytesAllocated:bytes,observed:last};
await writeFile(new URL('./m6-02-audio-allocation-'+label+'.json',import.meta.url),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
