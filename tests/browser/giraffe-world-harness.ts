import {Scene,OrthographicCamera,WebGLRenderer,AmbientLight,DirectionalLight,Vector3,SRGBColorSpace,type BufferGeometry,type Material} from 'three';
import {createTropicalDiorama} from '../../src/game/render3d/tropical-diorama.ts';
import {createHabitatScene} from '../../src/game/render3d/habitat-scene.ts';
import {createElephantHabitatScene} from '../../src/game/render3d/elephant-habitat-scene.ts';
import {createLionWorldScene} from '../../src/game/render3d/lion/world-scene.ts';
import {createLionResidentsScene} from '../../src/game/render3d/lion/residents-scene.ts';
import {createElephantResidentsScene} from '../../src/game/render3d/elephant-residents-scene.ts';
import {createAutonomousBirds} from '../../src/game/render3d/macaw/autonomous-birds.ts';
import {createPathScene} from '../../src/game/render3d/path-scene.ts';
import {mountCameraControls} from '../../src/game/render3d/camera-controls.ts';
import {createScenePicker,raycastScene} from '../../src/game/render3d/scene-picking.ts';
import {expandGiraffeWorld} from '../../src/game/world/giraffe-expansion.ts';
import {sceneOrigin,toScene} from '../../src/game/world/scene-coordinates.ts';
import {parseSaveV3} from '../../src/game/persistence/save-v3.ts';
import {isMacaw,isElephant,isLion,elephantResources} from '../../src/game/core/species.ts';
import type {Resource} from '../../src/game/core/state.ts';
import frozen from '../fixtures/giraffe-v3-golden.json';
declare const __GIRAFFE_QA_SOURCE__:string;
const parsed=parseSaveV3(JSON.stringify(frozen.state));if(!parsed.ok)throw Error('Invalid frozen QA source');
const state=parsed.value,world=expandGiraffeWorld(state.world),host=document.querySelector<HTMLElement>('#world')!,out=document.querySelector<HTMLElement>('#result')!,canvas=document.createElement('canvas');canvas.style.cssText='display:block;width:100%;height:100%';host.append(canvas);
const renderer=new WebGLRenderer({canvas,antialias:true});renderer.outputColorSpace=SRGBColorSpace;renderer.setPixelRatio(1);const scene=new Scene(),camera=new OrthographicCamera(),diorama=createTropicalDiorama(world);scene.add(diorama.group,new AmbientLight('#fff6dd',2));const sun=new DirectionalLight('#fff4db',2);sun.position.set(8,16,10);scene.add(sun);
const geometries:BufferGeometry[]=[],materials:Material[]=[],habitat=createHabitatScene(diorama.catalog,(g,m)=>{geometries.push(g);materials.push(m);}),elephantHabitat=createElephantHabitatScene(diorama.catalog),lionWorld=createLionWorldScene(diorama.catalog),lionModels=createLionResidentsScene(diorama.catalog),elephantModels=createElephantResidentsScene(diorama.catalog),birds=createAutonomousBirds(),paths=createPathScene(diorama.catalog);
habitat.sync({...world,habitats:world.habitats.filter(h=>h.kind==='macaw-aviary'),resources:world.resources.filter((r):r is Resource=>r.kind==='food'||r.kind==='water'||r.kind==='perch')});elephantHabitat.sync(world);lionWorld.sync(world);lionModels.sync(state.animals.filter(isLion),24,26);elephantModels.sync(state.animals.filter(isElephant),24,26,elephantResources(world.resources));birds.sync(state.animals.filter(isMacaw),world.habitats,24,26,state.gameTimeMs);paths.sync(world);
scene.add(habitat.group,elephantHabitat.group,lionWorld.group,lionModels.group,elephantModels.group,birds.group,paths.group);scene.updateMatrixWorld(true);lionModels.update(1,state.gameTimeMs,true);elephantModels.update(1,state.gameTimeMs,true,true);birds.update(1,state.gameTimeMs);scene.updateMatrixWorld(true);
let disposed=false,selected:unknown=null,checks:unknown=null,draws=0;
const picker=createScenePicker(diorama.catalog,camera,()=>canvas.getBoundingClientRect(),identity=>{selected=identity;render();});scene.add(picker.group);
const controls=mountCameraControls(host,canvas,camera,diorama.bounds,world,p=>{picker.pick(p);render();},()=>{picker.clear();render();});
host.addEventListener('camera-view-change',()=>render());
function report(){out.textContent=JSON.stringify({source:__GIRAFFE_QA_SOURCE__,at:new Date().toISOString(),method:'Actual original renderer modules on a frozen expanded synthetic world; static scene only, no simulation/save activation',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth},world:{width:world.width,height:world.height,tiles:world.tiles.length,origin:sceneOrigin(world)},canvas:host.querySelectorAll('canvas').length,selected,checks,draws,disposed,controls:controls.inspect(),geometryCount:renderer.info.memory.geometries,textureCount:renderer.info.memory.textures},null,2);}
function render(){if(disposed)return;scene.updateMatrixWorld(true);renderer.render(scene,camera);draws++;report();}
const resize=new ResizeObserver(()=>{if(disposed)return;const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);controls.resize(r.width,r.height);render();});resize.observe(host);
document.querySelector('#rotate')!.addEventListener('click',()=>{controls.command('rotate-right');render();});document.querySelector('#focus')!.addEventListener('click',()=>{const o=sceneOrigin(world);controls.focusArea({x:13-o.x,z:2-o.z,width:7,depth:7});render();});document.querySelector('#all')!.addEventListener('click',()=>{controls.command('reset');render();});
document.querySelector('#check')!.addEventListener('click',()=>{controls.command('reset');const rows=[];for(let angle=0;angle<8;angle++){if(angle)controls.command('rotate-right');render();for(const cell of [{x:4,z:7},{x:22,z:13}]){const r=canvas.getBoundingClientRect(),p=toScene(cell,world),v=new Vector3(p.x,.022,p.z).project(camera),hit=raycastScene(diorama.catalog,camera,{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2},r);rows.push({angle:angle*45,cell,actual:hit?.id??null,pass:hit?.id===`tile-${cell.x}-${cell.z}`});}}checks={method:'labelled projected raycaster checks, not physical taps',pass:rows.every(r=>r.pass),rows};controls.command('reset');render();});
function close(){if(disposed)return;disposed=true;resize.disconnect();controls.dispose();picker.dispose();habitat.dispose();elephantHabitat.dispose();lionWorld.dispose();lionModels.dispose();elephantModels.dispose();birds.dispose();paths.dispose();for(const g of [...diorama.geometries,...geometries,elephantHabitat.geometry,paths.geometry,...picker.geometries])g.dispose();for(const m of [...diorama.materials,...materials,elephantHabitat.material,paths.material,...picker.materials])m.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();report();}
document.querySelector('#close')!.addEventListener('click',close);window.addEventListener('pagehide',close,{once:true});
