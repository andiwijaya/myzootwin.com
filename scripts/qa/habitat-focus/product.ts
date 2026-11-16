import {WebGLRenderer,Vector3,SkinnedMesh,type Camera,type Object3D} from 'three';
import {createFrameMetrics} from '../../../tests/browser/frame-metrics.mjs';
import {mountGameEntry} from '../../../src/game-entry/game-entry.ts';
import {mountFoundationScene} from '../../../src/game/render3d/foundation-scene.ts';
import {createIndexedDbBackend} from '../../../src/game/persistence/durable-backend.ts';
import {ZEBRA_CHECKPOINT_CODEC,validateSaveV5,serializeSaveV5,migrateToV5} from '../../../src/game/persistence/save-v5.ts';
import {createInitialState} from '../../../src/game/core/initial-state.ts';
import {sceneOrigin} from '../../../src/game/world/scene-coordinates.ts';
import {habitatKind,type HabitatFocusView} from '../../../src/game/render3d/habitat-focus.ts';
import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {lionCopy} from '../../../src/game-entry/lion-copy.ts';
import {giraffeCopy} from '../../../src/game-entry/giraffe-copy.ts';

if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Loopback QA only');
const root=document.querySelector<HTMLElement>('[data-play-entry]')!,host=root.querySelector<HTMLElement>('[data-preview-stage]')!,out=document.querySelector<HTMLElement>('#qa-result')!;
const url=new URL(location.href);let db=url.searchParams.get('qaDb');const fresh=!db;
if(db&&!/^myzootwin-focus-qa-[a-f0-9-]{36}$/.test(db))throw Error('QA UUID database required');
db??='myzootwin-focus-qa-'+crypto.randomUUID();url.searchParams.set('qaDb',db);history.replaceState(null,'',url);
const backend=createIndexedDbBackend<ZooSave>(indexedDB,db,{codec:ZEBRA_CHECKPOINT_CODEC,databaseVersion:5});
if(fresh){const seed=url.searchParams.get('seed')==='fresh'?migrateToV5(createInitialState()):validateSaveV5(await(await fetch(url.searchParams.get('bench')==='1'?'/performance-fixture.json':'/focus-fixture.json')).json());if(!seed.ok)throw Error('Invalid focus seed');await backend.commit(0,serializeSaveV5(seed.value),'focus-synthetic-qa',Date.now());}
let current:ZooSave|undefined,camera:Camera|undefined,renderer:WebGLRenderer|undefined,focus:HabitatFocusView|undefined,closed=false;
let renderScene:Object3D|undefined,measuring=false;const frameMetrics=createFrameMetrics(600),renderCpu:number[]=[],simulationCpu:number[]=[],sceneCpu:number[]=[];
const perfFrames={request(callback:(time:number)=>void){return requestAnimationFrame(time=>{const started=performance.now();callback(time);if(measuring)frameMetrics.record(time,performance.now()-started);});},cancel(id:number){cancelAnimationFrame(id);}};
const errors:string[]=[],checks:{name:string;passed:boolean;detail?:unknown}[]=[],selections:unknown[]=[];
window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
host.addEventListener('scene-habitat-focus-change',event=>{focus=(event as CustomEvent<HabitatFocusView>).detail;});
const handle=mountGameEntry(root,{backend,broadcast:false,allowRecoveryDownload:false,preferenceStorage:null,browserLanguage:'id-ID',loadRenderer:async store=>failure=>{
  current=store.read();return mountFoundationScene(host,failure,{frames:perfFrames,onFrameTiming:sample=>{if(measuring&&simulationCpu.length<600){simulationCpu.push(sample.simulationMs);sceneCpu.push(sample.sceneMs);}},stateStore:{...store,write(value){current=structuredClone(value);store.write(value);},checkpoint(reader,critical){current=structuredClone(reader());store.checkpoint?.(()=>current!,critical);}},createRenderer(canvas,context){const r=new WebGLRenderer({canvas,context,antialias:true,alpha:false}),draw=r.render.bind(r);renderer=r;r.render=(scene,c)=>{camera=c;renderScene=scene;const started=performance.now();draw(scene,c);if(measuring&&renderCpu.length<600)renderCpu.push(performance.now()-started);};return r;}});
}});
const visible=(e:Element)=>e.checkVisibility();
const click=(selector:string)=>{const b=root.querySelector<HTMLButtonElement>(selector);if(!b||b.disabled||!visible(b))throw Error('Unavailable UI '+selector);b.click();};
const delay=(ms=70)=>new Promise<void>(resolve=>setTimeout(resolve,ms));
async function waitFor(predicate:()=>boolean,label:string,timeout=20000){const end=performance.now()+timeout;while(!predicate()){if(performance.now()>end)throw Error('Timed out '+label);await delay();}}
const session=()=>handle.inspectRenderer()?.session;
function expect(name:string,passed:boolean,detail?:unknown){checks.push({name,passed,detail});if(!passed)throw Error(name+': '+JSON.stringify(detail));}
function pointer(type:string,id:number,x:number,y:number,buttons:number,pointerType='mouse'){host.querySelector('canvas')!.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,button:0,buttons,clientX:x,clientY:y,pointerType,isPrimary:id===1}));}

async function selectHome(kind:string){
  await waitFor(()=>!!camera&&session()?.assetsWaiting===false,'renderer assets');if(focus?.active)click('[data-habitat-zoom-exit]');
  const h=current!.world.habitats.find(h=>habitatKind(h)===kind)!;if(!h)throw Error('Missing test habitat');
  const origin=sceneOrigin(current!.world),rect=host.getBoundingClientRect(),cells=[h.cells[Math.floor(h.cells.length/2)]!,...h.cells];
  for(const cell of cells){
    const p=new Vector3(cell.x+.5-origin.x,.15,cell.z+.5-origin.z).project(camera!);if(Math.abs(p.x)>.99||Math.abs(p.y)>.99)continue;
    const x=rect.left+(p.x+1)*rect.width/2,y=rect.top+(1-p.y)*rect.height/2;
    pointer('pointerdown',1,x,y,1);pointer('pointerup',1,x,y,0);await delay();
    if(focus?.selectedHabitatId===h.id||focus?.habitatId===h.id){selections.push({kind,x,y,method:'injected actual canvas PointerEvents'});return;}
  }
  throw Error('Cannot select '+kind+' through visible source triangles');
}

async function report(){
  const stored=await backend.read();const data={at:new Date().toISOString(),scope:'Actual game UI/renderer with synthetic QA save. Suite input is injected DOM/PointerEvents; screenshots are actual WebGL pixels. Mobile viewport is not a physical phone.',database:db,viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},focus,session:session(),checks:[...checks],selections:[...selections],errors:[...errors],state:current?{tick:current.tick,cash:current.currency,habitats:current.world.habitats.length,animals:current.animals.length,valid:validateSaveV5(current).ok}:null,durable:stored?{revision:stored.revision,valid:validateSaveV5(JSON.parse(stored.payload)).ok}:null,closed};out.textContent=JSON.stringify(data,null,2);return data;
}
for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
  const b=document.createElement('button');b.textContent='Select test '+kind;b.dataset.qaSelect=kind;document.querySelector('#qa-actions')!.append(b);b.addEventListener('click',()=>{void selectHome(kind).then(report).catch(e=>{errors.push(String(e));void report();});});
}

async function construction(kind:string){
  const before=current!.world.resources.length,locale=root.lang==='en'?'en':'id';
  click('[data-zoo-build]');await delay();expect(kind+' catalog in Build',root.dataset.hudTab==='build');
  if(kind==='macaw-aviary'){if(current!.world.resources.some(r=>r.kind==='food'))return;click('[data-food-command="preview"]');click('[data-food-command="confirm"]');}
  else if(kind==='elephant-grove'){if(current!.world.resources.some(r=>r.kind==='elephant-log'))return;click('[data-elephant-place="log"]');await delay();click('[data-elephant-care-action="confirm"]');}
  else if(kind==='zebra-grasslands'){if(current!.world.resources.some(r=>r.kind==='zebra-enrichment'))return;click('[data-zebra-plan="zebra-enrichment"]');await delay();click('[data-zebra-preview="confirm"]');}
  else{
    const species=kind==='lion-savanna'?'lion':'giraffe',value=species==='lion'?'lion-scent':'giraffe-enrichment';if(current!.world.resources.some(r=>r.kind===value))return;
    const section=root.querySelector(`[data-${species}-panel="build"]`)!;
    const c=species==='lion'?lionCopy[locale]:giraffeCopy[locale],buttons=()=>[...section.querySelectorAll<HTMLButtonElement>('button')];
    click(`[data-${species}-panel="build"] [data-facility-kind="${value}"]`);await delay();const confirm=buttons().find(b=>b.textContent===c.confirm)!;if(confirm.disabled)throw Error('No available construction cell '+kind);confirm.click();
  }
  await waitFor(()=>current!.world.resources.length===before+1,'construction '+kind);await waitFor(()=>session()?.zebraBuildBusy===false,'construction commit completed');expect(kind+' paid construction stays focused',focus?.kind===kind&&current!.world.resources.length===before+1);
}

async function runSuite(){
  const button=document.querySelector<HTMLButtonElement>('#qa-suite')!;button.disabled=true;
  try{
    if(!host.querySelector('canvas'))click('[data-save-resume-button]');
    await waitFor(()=>session()?.assetsWaiting===false&&session()?.simulationPaused===false,'active source');
    if(current!.world.habitats.length===0){
      click('[data-pause-toggle]');await delay(250);const initial=JSON.stringify(current),tick=session()?.simulationTick;
      for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
        click(`[data-zoo-destination="${kind}"]`);await delay();expect(kind+' locked menu explains prerequisites',root.dataset.hudTab==='build'&&visible(root.querySelector('[data-zoo-navigation-note]')!)&&!focus?.active);
      }
      expect('locked navigation is read only',JSON.stringify(current)===initial&&session()?.simulationTick===tick&&current!.currency===1500&&current!.world.habitats.length===0&&root.querySelector('[data-hud-animals]')?.textContent==='0');await report();return;
    }
    expect('six primary destinations',root.querySelectorAll('[data-zoo-destination]').length===6);
    click('[data-pause-toggle]');await waitFor(()=>session()?.simulationPaused===true,'pause');await delay(250);
    const paused={tick:session()?.simulationTick,command:session()?.commandRevision,cash:current!.currency,animals:JSON.stringify(current!.animals),resources:JSON.stringify(current!.world.resources)};
    for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
      click(`[data-zoo-destination="${kind}"]`);await delay();expect(kind+' paused navigation',focus?.kind===kind&&session()?.simulationPaused===true);
      const pane=root.querySelector<HTMLElement>('[data-hud-pane="care"]')!,cards=[...pane.querySelectorAll<HTMLElement>('.zoo-animal-card')].filter(visible),expected:Record<string,number>={'macaw-aviary':2,'elephant-grove':2,'lion-savanna':3,'giraffe-plains':3,'zebra-grasslands':4};
      expect(kind+' complete individual condition cards',cards.length===expected[kind]&&cards.every(card=>card.querySelectorAll('[role="meter"]').length===4));
      const section=cards[0]!.closest<HTMLElement>('[data-bird-tools],[data-elephant-care],[data-lion-panel="care"],[data-giraffe-panel="care"],[data-zebra-care]')!,offset=cards[0]!.getBoundingClientRect().top-section.getBoundingClientRect().top;expect(kind+' conditions immediately below species heading',offset>=0&&offset<180,{offset,paneOffset:cards[0]!.getBoundingClientRect().top-pane.getBoundingClientRect().top});
      expect(kind+' readable indicator labels and values',cards.every(card=>[...card.querySelectorAll<HTMLElement>('.zoo-metric')].every(metric=>{const label=metric.firstElementChild!,value=metric.querySelector('strong')!,l=label.getBoundingClientRect(),v=value.getBoundingClientRect();return l.height<24&&v.top>=l.bottom&&metric.scrollWidth<=metric.clientWidth+1&&parseFloat(getComputedStyle(value).fontSize)>=15;})));
    }
    click('[data-zoo-back]');await delay(250);
    expect('paused menu preserves clock, ledger and population',JSON.stringify(paused)===JSON.stringify({tick:session()?.simulationTick,command:session()?.commandRevision,cash:current!.currency,animals:JSON.stringify(current!.animals),resources:JSON.stringify(current!.world.resources)}));
    click('[data-pause-toggle]');await waitFor(()=>session()?.simulationPaused===false,'resume');
    expect('fourteen placed animals in global summary',root.querySelector('[data-hud-animals]')?.textContent==='14');
    for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
      await waitFor(()=>session()?.assetsWaiting===false,'assets before habitat navigation');
      const previous={zoom:Number(host.dataset.cameraZoom),angle:Number(host.dataset.cameraAzimuth)};click(`[data-zoo-destination="${kind}"]`);await delay();await waitFor(()=>session()?.assetsWaiting===false,'focused habitat assets');
      expect(kind+' entered through primary menu',root.dataset.habitatFocus===kind&&session()?.habitatFocusPlanes===4);
      expect(kind+' other species panels hidden',[...root.querySelectorAll<HTMLElement>('[data-focus-kind]')].filter(e=>e.dataset.focusKind!==kind).every(e=>!visible(e)));
      expect(kind+' one canvas and running simulation',host.querySelectorAll('canvas').length===1&&session()?.simulationPaused===false);
      const start=structuredClone(current!),tick=start.tick;await waitFor(()=>current!.tick>=tick+3,'offscreen simulation ticks');
      expect(kind+' offscreen needs advance',current!.animals.some(a=>a.habitatId!==focus?.habitatId&&JSON.stringify(a)!==JSON.stringify(start.animals.find(b=>b.id===a.id))));
      click('[data-camera-command="zoom-in"]');click('[data-camera-command="rotate-right"]');await delay();expect(kind+' zoom and rotate',Number(host.dataset.cameraZoom)>1&&host.dataset.cameraAzimuth==='45');
      await waitFor(()=>session()?.assetsWaiting===false,'rotated view assets');click('[data-zoo-pan-toggle]');const panBefore=[host.dataset.cameraPanX,host.dataset.cameraPanZ];click('[data-camera-command="pan-right"]');await delay();expect(kind+' toolbar pan',JSON.stringify(panBefore)!==JSON.stringify([host.dataset.cameraPanX,host.dataset.cameraPanZ]));
      // Camera input uses the production gesture adapter, with explicitly synthetic two-finger input.
      const rect=host.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
      pointer('pointerdown',2,x-20,y,1,'touch');pointer('pointerdown',3,x+20,y,1,'touch');pointer('pointermove',3,x+45,y,1,'touch');pointer('pointerup',3,x+45,y,0,'touch');pointer('pointerup',2,x-20,y,0,'touch');
      expect(kind+' pinch preserves mode and releases pointers',focus?.kind===kind&&session()?.cameraPointers===0);
      click('[data-camera-command="reset"]');await delay();expect(kind+' reset fits current habitat',host.dataset.cameraZoom==='1'&&host.dataset.cameraAzimuth==='0'&&focus?.active===true);
      await construction(kind);click('[data-hud-tab="care"]');await delay();
      expect(kind+' four honest condition gauges per resident',[...root.querySelectorAll<HTMLElement>('[data-hud-pane="care"] .zoo-animal-card')].filter(visible).every(card=>card.querySelectorAll('[role="meter"]').length===4));
      const beforeIds=new Set(current!.ledger.map(e=>e.id));let attempts=0;
      const supplied=()=>current!.ledger.some(e=>e.kind==='supplies'&&!beforeIds.has(e.id));
      for(;attempts<4&&!supplied();attempts++){
        const refill=kind==='macaw-aviary'?root.querySelector<HTMLButtonElement>('[data-food-command="refill"]'):[...root.querySelectorAll<HTMLButtonElement>('[data-hud-pane="care"] button')].find(b=>visible(b)&&!b.disabled&&b.textContent?.startsWith(localeRefill()));
        if(!refill||refill.disabled)break;refill.click();await waitFor(()=>session()?.zebraBuildBusy===false,'refill commit completed');await delay(180);
      }
      expect(kind+' paid care stays focused',supplied()&&focus?.kind===kind,{attempts});
      click('[data-habitat-zoom-exit]');await delay();expect(kind+' restores zoo view',!root.hasAttribute('data-habitat-focus')&&Number(host.dataset.cameraZoom)===previous.zoom&&Number(host.dataset.cameraAzimuth)===previous.angle);
      expect(kind+' no page overflow',document.documentElement.scrollWidth<=innerWidth);
    }
    click('[data-hud-tab="visitors"]');await delay();expect('visitors explicitly global',visible(root.querySelector('[data-zoo-guests-scope]')!));await report();
  }catch(error){checks.push({name:'suite exception',passed:false,detail:String(error)});await report();}finally{button.disabled=false;}
}
const localeRefill=()=>root.lang==='en'?'Refill':'Isi ulang';
const controlsButton=document.createElement('button');controlsButton.id='qa-controls';controlsButton.textContent='Run camera and menu checks';document.querySelector('#qa-actions')!.append(controlsButton);
async function runControlsSuite(){
  controlsButton.disabled=true;
  const cam=()=>({zoom:Number(host.dataset.cameraZoom),angle:Number(host.dataset.cameraAzimuth),x:Number(host.dataset.cameraPanX),z:Number(host.dataset.cameraPanZ)});
  const same=(a:ReturnType<typeof cam>,b:ReturnType<typeof cam>)=>Object.keys(a).every(k=>Math.abs(a[k as keyof typeof a]-b[k as keyof typeof b])<1e-7);
  const command=(value:string)=>click(`[data-camera-command="${value}"]`);
  try{
    await waitFor(()=>session()?.assetsWaiting===false&&!!camera,'control assets');
    const cold=root.querySelector<HTMLElement>('[data-save-resume]')!;
    if(visible(cold)){
      expect('cold Continue keeps camera and world gated',host.inert&&root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-in"]')!.matches(':disabled'));
      click('[data-save-resume-button]');
    }
    if(root.dataset.sessionPaused==='false')click('[data-pause-toggle]');
    await waitFor(()=>session()?.simulationPaused===true,'manual pause');await delay(250);
    const before=JSON.stringify(current),tick=session()?.simulationTick,commandRevision=session()?.commandRevision;
    expect('manual pause leaves read-only camera enabled',!host.inert&&!root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-in"]')!.matches(':disabled')&&session()?.cameraInputEnabled===true);
    expect('manual pause still disables all gameplay fieldsets',[...root.querySelectorAll<HTMLFieldSetElement>('[data-hud-controls]:not([data-hud-camera-controls])')].every(g=>g.disabled));
    let zooView=cam();
    for(const kind of ['zoo','macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
      click(`[data-zoo-destination="${kind}"]`);await delay();await waitFor(()=>session()?.assetsWaiting===false,'control context assets');
      const expected=kind==='zoo'?null:kind,submissions=session()!.renderSubmissions;
      expect(kind+' primary navigation has one selected destination',(focus?.kind??null)===expected&&root.querySelectorAll('[data-zoo-destination][aria-pressed="true"]').length===1);
      for(const tab of ['missions','care','visitors','build']){click(`[data-hud-tab="${tab}"]`);expect(kind+' '+tab+' panel',root.dataset.hudTab===tab&&visible(root.querySelector(`[data-hud-pane="${tab}"]`)!));}
      click('[data-hud-tab="care"]');click('[data-zoo-build]');expect(kind+' arrange opens contextual Build',root.dataset.hudTab==='build'&&(focus?.kind??null)===expected);
      if(!root.querySelector<HTMLButtonElement>('[data-camera-command="reset"]')!.disabled)command('reset');
      command('zoom-in');const zoomed=cam();command('zoom-out');expect(kind+' plus and minus change zoom',zoomed.zoom>1&&cam().zoom===1);
      command('rotate-left');expect(kind+' rotate left is 315 degrees',cam().angle===315);command('rotate-right');
      for(let i=0;i<8;i++)command('rotate-right');expect(kind+' eight right turns restore orientation',cam().angle===0);
      for(let i=0;i<10&&!root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-in"]')!.disabled;i++)command('zoom-in');expect(kind+' zoom clamps at 300 percent',cam().zoom===3&&root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-in"]')!.disabled);
      for(let i=0;i<10&&!root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-out"]')!.disabled;i++)command('zoom-out');expect(kind+' zoom clamps at 100 percent',cam().zoom===1&&root.querySelector<HTMLButtonElement>('[data-camera-command="zoom-out"]')!.disabled);
      click('[data-zoo-pan-toggle]');expect(kind+' pan opens and provides room from overview',visible(root.querySelector('[data-zoo-pan-pad]')!)&&cam().zoom>1&&root.querySelector('[data-zoo-pan-toggle]')!.getAttribute('aria-expanded')==='true');
      expect(kind+' camera and pan touch targets are at least 44 pixels',[...root.querySelectorAll<HTMLElement>('.zoo-camera-toolbar button,[data-zoo-pan-pad] button')].every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44;}));
      for(const direction of ['left','up','down','right']){const old=cam();command('pan-'+direction);expect(kind+' pan '+direction+' moves camera',!same(old,cam()));}
      click('[data-zoo-pan-toggle]');expect(kind+' pan toggle closes controls',!visible(root.querySelector('[data-zoo-pan-pad]')!));
      command('reset');command('zoom-in');
      const rect=host.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2,start=cam();
      pointer('pointerdown',20,x,y,1,'touch');pointer('pointermove',20,x+25,y+10,1,'touch');pointer('pointerup',20,x+25,y+10,0,'touch');expect(kind+' drag pans while paused and releases pointers',!same(start,cam())&&session()?.cameraPointers===0);
      const pinchStart=cam().zoom;pointer('pointerdown',21,x-25,y,1,'touch');pointer('pointerdown',22,x+25,y,1,'touch');pointer('pointermove',22,x+45,y,1,'touch');pointer('pointerup',22,x+45,y,0,'touch');pointer('pointerup',21,x-25,y,0,'touch');expect(kind+' pinch zooms while paused and releases pointers',cam().zoom>pinchStart&&session()?.cameraPointers===0);
      command('rotate-right');command('reset');expect(kind+' Fit restores whole current scope',same(cam(),{zoom:1,angle:0,x:0,z:0})&&(focus?.kind??null)===expected);
      expect(kind+' camera submits actual paused renders',session()!.renderSubmissions>submissions);
      expect(kind+' camera keeps simulation paused with one renderer',session()?.simulationPaused===true&&session()?.pendingFrames===0&&host.querySelectorAll('canvas').length===1&&session()?.simulationSubscribers===1);
      if(kind==='zoo'){command('zoom-in');command('rotate-right');zooView=cam();}
      else{click('[data-zoo-back]');expect(kind+' Back restores prior zoo camera',!focus?.active&&same(cam(),zooView));}
    }
    for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){click(`[data-zoo-destination="${kind}"]`);expect(kind+' direct switch keeps correct scope',focus?.kind===kind);}
    click('[data-zoo-destination="zoo"]');expect('Zoo destination restores original zoo view',!focus?.active&&same(cam(),zooView));
    expect('all paused camera and menu input preserves full save and ledger',JSON.stringify(current)===before&&session()?.simulationTick===tick&&session()?.commandRevision===commandRevision);
    const saved=await backend.read();expect('paused camera leaves durable save valid',!!saved&&validateSaveV5(JSON.parse(saved.payload)).ok);
    expect('all camera scopes stay within page',document.documentElement.scrollWidth<=innerWidth);
    await report();
  }catch(error){checks.push({name:'controls suite exception',passed:false,detail:String(error)});await report();}finally{controlsButton.disabled=false;}
}
controlsButton.addEventListener('click',()=>{void runControlsSuite();});
const performanceButton=document.createElement('button'),performanceOut=document.createElement('pre');performanceButton.id='qa-performance';performanceButton.textContent='Run moving navigation and performance checks';performanceOut.id='qa-performance-result';performanceOut.textContent='NOT RUN';document.querySelector('#qa-actions')!.append(performanceButton,performanceOut);
function numericStats(values:number[]){const sorted=[...values].sort((a,b)=>a-b);return{samples:values.length,p50Ms:sorted.length?sorted[Math.ceil(sorted.length*.5)-1]:null,p95Ms:sorted.length?sorted[Math.ceil(sorted.length*.95)-1]:null,maxMs:sorted.at(-1)??null};}
function animalPoses(){
 return current!.animals.map(a=>{const object=renderScene?.getObjectByName(a.id),bones=new Set<import('three').Bone>();object?.traverse(o=>{if(o instanceof SkinnedMesh)for(const b of o.skeleton.bones)bones.add(b);});let hash=2166136261;for(const b of bones)for(const n of [...b.position.toArray(),...b.quaternion.toArray()])hash=Math.imul(hash^Math.round(n*100000),16777619)>>>0;return{id:a.id,habitatId:a.habitatId,species:a.speciesId,behavior:a.currentBehavior,bones:bones.size,poseHash:hash,position:object?.position.toArray()??null};});
}
async function runNavigationPerformance(){
 performanceButton.disabled=true;const rows:unknown[]=[],tests:{name:string;passed:boolean;detail?:unknown}[]=[],longTasks:{start:number;duration:number}[]=[];let observer:PerformanceObserver|undefined,phaseStarted=0;
 const check=(name:string,passed:boolean,detail?:unknown)=>{tests.push({name,passed,detail});if(!passed)throw Error(name+': '+JSON.stringify(detail));};
 const dump=(status:string,error?:unknown)=>{performanceOut.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,scope:'Actual game renderer/simulation; synthetic full-care V5 fixture, injected canvas PointerEvents and native DOM handlers. Timings exclude browser automation and pose inspection. RAF callback Hz is not presented FPS; render CPU is synchronous submit, not GPU duration. No physical phone, CPU throttle or presentation timing claim.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,dpr:devicePixelRatio},graphics:{low:session()?.graphicsLow,pixelRatio:session()?.pixelRatio,reducedMotion:session()?.reducedMotion},tests,rows,errors:[...errors]},null,2);};
 try{
  if(visible(root.querySelector('[data-save-resume]')!))click('[data-save-resume-button]');
  if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');
  await waitFor(()=>session()?.assetsWaiting===false&&session()?.simulationPaused===false,'performance renderer');
  if(PerformanceObserver.supportedEntryTypes.includes('longtask')){observer=new PerformanceObserver(list=>{for(const e of list.getEntries())if(measuring&&e.startTime>=phaseStarted)longTasks.push({start:e.startTime,duration:e.duration});});observer.observe({type:'longtask'});}
  for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
   if(focus?.active)click('[data-zoo-back]');await delay(100);host.scrollIntoView({block:'center',behavior:'instant'});
   const scrollBefore=scrollY,navigationStarted=performance.now();await selectHome(kind);const navigationMs=performance.now()-navigationStarted;
   check(kind+' canvas tap enters correct habitat',focus?.kind===kind&&root.dataset.habitatFocus===kind);
   check(kind+' canvas tap keeps page on world',Math.abs(scrollY-scrollBefore)<2,{before:scrollBefore,after:scrollY});
   const worldRect=host.getBoundingClientRect();check(kind+' timed world is inside the viewport',worldRect.top>=0&&worldRect.bottom<=innerHeight,{top:worldRect.top,bottom:worldRect.bottom,height:innerHeight});
   await waitFor(()=>session()?.assetsWaiting===false,'performance focused assets');await delay(500);
   // Select a real resident through its visible body where possible, then keep another tab selected.
   let residentSelected=false;for(const a of current!.animals.filter(a=>a.habitatId===focus?.habitatId)){
    const object=renderScene?.getObjectByName(a.id);if(!object)continue;const p=object.getWorldPosition(new Vector3()).add(new Vector3(0,kind==='giraffe-plains'?1.7:kind==='elephant-grove'?.9:kind==='macaw-aviary'?.3:.6,0)).project(camera!),r=host.getBoundingClientRect();if(Math.abs(p.x)>.98||Math.abs(p.y)>.98)continue;
    const x=r.left+(p.x+1)*r.width/2,y=r.top+(1-p.y)*r.height/2;pointer('pointerdown',41,x,y,1,'touch');pointer('pointerup',41,x,y,0,'touch');if(host.dataset.selectedId===a.id){residentSelected=true;break;}
   }
   const stableTab=url.searchParams.get('panel')==='care'?'care':'visitors';click(`[data-hud-tab="${stableTab}"]`);const stableScroll=scrollY,startTick=session()!.simulationTick,startPoses=animalPoses(),startResources={geometries:renderer!.info.memory.geometries,textures:renderer!.info.memory.textures};
   check(kind+' all 14 GLB residents are mounted',startPoses.length===14&&startPoses.every(p=>p.bones>0),startPoses.filter(p=>!p.bones));
   frameMetrics.reset();renderCpu.length=0;simulationCpu.length=0;sceneCpu.length=0;longTasks.length=0;phaseStarted=performance.now();measuring=true;const inputs:{action:string;cpuMs:number}[]=[];
   for(const action of ['zoom-in','rotate-right','pan-open','pan-right','pan-close','reset']){await delay(400);const started=performance.now();click(action.startsWith('pan-o')||action==='pan-close'?'[data-zoo-pan-toggle]':`[data-camera-command="${action}"]`);inputs.push({action,cpuMs:performance.now()-started});}
   await delay(1600);measuring=false;const elapsedMs=performance.now()-phaseStarted,metrics=frameMetrics.summary(),endPoses=animalPoses(),changed=endPoses.filter(p=>startPoses.find(b=>b.id===p.id)?.poseHash!==p.poseHash),focusedChanged=changed.filter(p=>p.habitatId===focus?.habitatId);
   const row={kind,visible:document.visibilityState,elapsedMs,navigationMs,metrics,simulationCpu:numericStats(simulationCpu),sceneCpu:numericStats(sceneCpu),renderSubmitCpu:numericStats(renderCpu),inputCpu:numericStats(inputs.map(i=>i.cpuMs)),inputs,longTasks:[...longTasks],startTick,endTick:session()?.simulationTick,residentSelected,selectionRefreshes:session()?.selectionRevision,startPoses,endPoses,changedResidentIds:changed.map(p=>p.id),focusedChangedIds:focusedChanged.map(p=>p.id),drawCalls:renderer!.info.render.calls,triangles:renderer!.info.render.triangles,startResources,endResources:{geometries:renderer!.info.memory.geometries,textures:renderer!.info.memory.textures}};rows.push(row);
   check(kind+' active timing sample is valid',document.visibilityState==='visible'&&metrics.callbacksObserved>=20&&elapsedMs>=3900,{callbacks:metrics.callbacksObserved,elapsedMs});
   check(kind+' chosen menu and scroll stay stable across animation updates',root.dataset.hudTab===stableTab&&Math.abs(scrollY-stableScroll)<2,{tab:root.dataset.hudTab,scrollBefore:stableScroll,scrollAfter:scrollY,residentSelected});
   check(kind+' simulation and focused GLB poses keep advancing',Number(session()?.simulationTick)>Number(startTick)&&focusedChanged.length>0,{startTick,endTick:session()?.simulationTick,focusedChanged:focusedChanged.map(p=>p.id)});
   check(kind+' one renderer and bounded GPU allocations',host.querySelectorAll('canvas').length===1&&session()?.simulationSubscribers===1&&session()?.pendingFrames===1&&row.endResources.geometries<=startResources.geometries+8&&row.endResources.textures===startResources.textures,{startResources,endResources:row.endResources,liveEffectGeometryAllowance:8});
   dump('RUNNING');
  }
  click('[data-zoo-destination="zoo"]');check('timed run leaves all five species and fourteen residents',current!.animals.length===14&&animalPoses().every(p=>p.bones>0));dump('PASS');
 }catch(error){dump('FAIL',error);}finally{measuring=false;observer?.disconnect();if(session()?.simulationPaused===false)click('[data-pause-toggle]');performanceButton.disabled=false;}
}
performanceButton.addEventListener('click',()=>{void runNavigationPerformance();});
document.querySelector('#qa-suite')!.addEventListener('click',()=>{void runSuite();});
document.querySelector('#qa-inspect')!.addEventListener('click',()=>{void report();});
document.querySelector('#qa-context')!.addEventListener('click',()=>{renderer?.getContext().getExtension('WEBGL_lose_context')?.loseContext();});
window.addEventListener('pagehide',()=>{closed=true;handle.dispose();},{once:true});
await handle.ready;await report();
