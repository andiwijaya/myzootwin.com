import {AmbientLight,DirectionalLight,OrthographicCamera,Scene,WebGLRenderer,type BufferGeometry,type Material} from 'three';
import {parseSave} from '../../src/game/persistence/save-v1.ts';
import {appendElephantZone} from '../../src/game/world/elephant-expansion.ts';
import {prepareSpeciesHabitat} from '../../src/game/world/species-habitat.ts';
import {createTropicalDiorama} from '../../src/game/render3d/tropical-diorama.ts';
import {createPlacementPreview} from '../../src/game/render3d/placement-preview.ts';
import {createHabitatScene} from '../../src/game/render3d/habitat-scene.ts';
import {fitIsometricCamera} from '../../src/game/render3d/isometric-camera.ts';
import type {PlacementView} from '../../src/game/world/placement-preview.ts';
import frozen from '../fixtures/elephant-legacy-v1.json';
const parsed=parseSave(JSON.stringify(frozen.entries.q04Claimed.state));if(!parsed.ok)throw Error('Invalid fixture');
const original=appendElephantZone(parsed.value.world);let world=structuredClone(original),view:PlacementView|undefined,disposed=false;
const host=document.querySelector<HTMLElement>('#world')!,output=document.querySelector<HTMLElement>('#result')!,scene=new Scene(),camera=new OrthographicCamera(),renderer=new WebGLRenderer({antialias:true});
renderer.setClearColor('#e9efe5');renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.domElement.style.cssText='display:block;width:100%;height:100%';host.append(renderer.domElement);
scene.add(new AmbientLight('#ffffff',1.7));const sun=new DirectionalLight('#fff4d7',2);sun.position.set(5,10,8);scene.add(sun);
const diorama=createTropicalDiorama(world);scene.add(diorama.group);const extra:Array<{g:BufferGeometry;m:Material}>=[],habitat=createHabitatScene(diorama.catalog,(g,m)=>extra.push({g,m}));habitat.sync(world);scene.add(habitat.group);
let preview:ReturnType<typeof createPlacementPreview>|undefined;
function update(){output.textContent=JSON.stringify({method:'actual placement geometry + world-only authority; synthetic fixture; no ledger/storage',at:new Date().toISOString(),width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,reason:view?.reason??'choose',active:view?.active??false,footprint:view?.proposal?[view.proposal.width,view.proposal.height]:null,cells:view?.proposal?.cells.length??0,groveOccupancy:world.tiles.filter(t=>t.occupantId==='habitat-qa-grove').length,legacyExact:JSON.stringify(world.tiles.slice(0,120))===JSON.stringify(original.tiles.slice(0,120)),currency:parsed.ok?parsed.value.currency:null,canvas:host.querySelectorAll('canvas').length,disposed},null,2);}
function render(){if(disposed)return;renderer.render(scene,camera);update();}
preview=createPlacementPreview(()=>world,diorama.catalog,camera,()=>renderer.domElement.getBoundingClientRect(),value=>{view=value;},undefined,undefined,()=> 'elephant-grove');scene.add(preview.group);
function resize(){if(disposed)return;const r=host.getBoundingClientRect();renderer.setSize(r.width,r.height,false);fitIsometricCamera(camera,diorama.bounds,r.width/r.height);render();}
const observer=new ResizeObserver(resize);observer.observe(host);
document.querySelector('#valid')!.addEventListener('click',()=>{preview?.guide('habitat',{x:3,z:11});render();});
document.querySelector('#edge')!.addEventListener('click',()=>{preview?.guide('habitat',{x:7,z:13});render();});
document.querySelector('#creek')!.addEventListener('click',()=>{preview?.guide('habitat',{x:4,z:2});render();});
document.querySelector('#cancel')!.addEventListener('click',()=>{preview?.command('cancel');render();});
document.querySelector('#commit')!.addEventListener('click',()=>{if(view?.active&&view.proposal){const r=prepareSpeciesHabitat(world,view.proposal.anchor,'habitat-qa-grove','elephant-grove');if(r.ok)world=r.world;preview?.refresh();}render();});
document.querySelector('#reset')!.addEventListener('click',()=>{world=structuredClone(original);preview?.command('cancel');render();});
function close(){if(disposed)return;disposed=true;observer.disconnect();preview?.dispose();habitat.dispose();for(const g of new Set([...diorama.geometries,...(preview?.geometries??[]),...extra.map(e=>e.g)]))g.dispose();for(const m of new Set([...diorama.materials,...(preview?.materials??[]),...extra.map(e=>e.m)]))m.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();update();}
document.querySelector('#close')!.addEventListener('click',close);window.addEventListener('pagehide',close);resize();
