import {WebGLRenderer,Vector3,type Camera} from 'three';
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
if(fresh){const seed=url.searchParams.get('seed')==='fresh'?migrateToV5(createInitialState()):validateSaveV5(await(await fetch('/focus-fixture.json')).json());if(!seed.ok)throw Error('Invalid focus seed');await backend.commit(0,serializeSaveV5(seed.value),'focus-synthetic-qa',Date.now());}
let current:ZooSave|undefined,camera:Camera|undefined,renderer:WebGLRenderer|undefined,focus:HabitatFocusView|undefined,closed=false;
const errors:string[]=[],checks:{name:string;passed:boolean;detail?:unknown}[]=[],selections:unknown[]=[];
window.addEventListener('error',e=>errors.push(e.message));window.addEventListener('unhandledrejection',e=>errors.push(String(e.reason)));
host.addEventListener('scene-habitat-focus-change',event=>{focus=(event as CustomEvent<HabitatFocusView>).detail;});
const handle=mountGameEntry(root,{backend,broadcast:false,allowRecoveryDownload:false,preferenceStorage:null,browserLanguage:'id-ID',loadRenderer:async store=>failure=>{
  current=store.read();return mountFoundationScene(host,failure,{stateStore:{...store,write(value){current=structuredClone(value);store.write(value);},checkpoint(reader,critical){current=structuredClone(reader());store.checkpoint?.(()=>current!,critical);}},createRenderer(canvas,context){const r=new WebGLRenderer({canvas,context,antialias:true,alpha:false}),draw=r.render.bind(r);renderer=r;r.render=(scene,c)=>{camera=c;draw(scene,c);};return r;}});
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
    if(focus?.selectedHabitatId===h.id){selections.push({kind,x,y,method:'injected actual canvas PointerEvents'});return;}
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
    for(const kind of ['macaw-aviary','elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){click(`[data-zoo-destination="${kind}"]`);await delay();expect(kind+' paused navigation',focus?.kind===kind&&session()?.simulationPaused===true);}
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
document.querySelector('#qa-suite')!.addEventListener('click',()=>{void runSuite();});
document.querySelector('#qa-inspect')!.addEventListener('click',()=>{void report();});
document.querySelector('#qa-context')!.addEventListener('click',()=>{renderer?.getContext().getExtension('WEBGL_lose_context')?.loseContext();});
window.addEventListener('pagehide',()=>{closed=true;handle.dispose();},{once:true});
await handle.ready;await report();
