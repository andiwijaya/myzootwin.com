import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OrthographicCamera,Box3} from 'three';
import {appendElephantZone} from '../src/game/world/elephant-expansion.ts';
import {createInitialState} from '../src/game/core/initial-state.ts';
import {validateSpeciesHabitatPlacement,prepareSpeciesHabitat} from '../src/game/world/species-habitat.ts';
import {validateHabitatPlacement,habitatBlockerKeys,prepareHabitat} from '../src/game/world/build-habitat.ts';
import {createPlacementPlanner,validatePlacement} from '../src/game/world/placement-preview.ts';
import {createPlacementPreview} from '../src/game/render3d/placement-preview.ts';
import {createTropicalDiorama} from '../src/game/render3d/tropical-diorama.ts';
import {fitIsometricCamera} from '../src/game/render3d/isometric-camera.ts';
const legacy=JSON.parse(readFileSync(new URL('./fixtures/elephant-legacy-v1.json',import.meta.url),'utf8')).entries.q04Claimed.state;
const fresh=()=>appendElephantZone(legacy.world),anchor={x:3,z:11};

test('six-by-six preview and authoritative preparation agree on all 36 occupancy cells while preserving legacy structures',()=>{
  const world=fresh(),before=structuredClone(world),preview=validateSpeciesHabitatPlacement(world,anchor,'elephant-grove');
  assert.equal(preview.reason,'ready');assert.equal(preview.proposal.width,6);assert.equal(preview.proposal.height,6);assert.equal(preview.proposal.cells.length,36);
  const built=prepareSpeciesHabitat(world,anchor,'habitat-grove','elephant-grove');assert.equal(built.ok,true);
  assert.deepEqual(built.world.habitats.at(-1),{id:'habitat-grove',kind:'elephant-grove',cells:preview.proposal.cells,viewingCell:null});
  assert.equal(built.world.tiles.filter(t=>t.occupantId==='habitat-grove').length,36);assert.deepEqual(built.world.tiles.slice(0,120),world.tiles.slice(0,120));assert.deepEqual(world,before);
  assert.deepEqual(built.world.resources,world.resources);assert.deepEqual(built.world.gate,world.gate);
});

test('species caps allow one grove beside an aviary and one aviary beside a grove, then deny an independent second habitat',()=>{
  const withAviary=fresh();assert.equal(prepareSpeciesHabitat(withAviary,anchor,'habitat-grove','elephant-grove').ok,true);
  assert.equal(validateHabitatPlacement(withAviary,{x:6,z:3}).reason,'limit');
  const empty=fresh();empty.habitats=[];empty.resources=[];empty.tiles.forEach(t=>t.occupantId=null);
  const first=prepareSpeciesHabitat(empty,{x:0,z:10},'habitat-grove','elephant-grove');assert.equal(first.ok,true);
  assert.equal(validateSpeciesHabitatPlacement(first.world,{x:6,z:10},'elephant-grove').reason,'limit');
  const bird=prepareHabitat(first.world,{x:4,z:4},'habitat-bird');assert.equal(bird.ok,true);assert.equal(bird.world.habitats.length,2);
});

test('six-by-six boundary creek path occupant and scenery failures reject without partial occupancy or mutation',()=>{
  for(const [point,mutate,reason]of [[{x:7,z:13},()=>{},'outside'],[{x:4,z:2},()=>{},'creek'],[{x:0,z:0},()=>{},'scenery'],[anchor,w=>w.tiles.find(t=>t.cell.x===3&&t.cell.z===11).path=true,'path'],[anchor,w=>w.tiles.find(t=>t.cell.x===3&&t.cell.z===11).occupantId='reserved-prop','occupied']]){
    const world=reason==='scenery'?appendElephantZone(createInitialState().world):fresh();mutate(world);const before=structuredClone(world);assert.equal(validateSpeciesHabitatPlacement(world,point,'elephant-grove').reason,reason);
    assert.deepEqual(prepareSpeciesHabitat(world,point,'habitat-grove','elephant-grove'),{ok:false,reason});assert.deepEqual(world,before);
  }
  assert.equal(validatePlacement(fresh(),anchor,new Set(),'habitat',7).reason,'command');
  assert.equal(prepareSpeciesHabitat(fresh(),anchor,'bad id','elephant-grove').reason,'command');
});

test('repeated build identity is idempotent; changed species or position cannot reuse it',()=>{
  const first=prepareSpeciesHabitat(fresh(),anchor,'habitat-grove','elephant-grove'),before=structuredClone(first.world);
  const duplicate=prepareSpeciesHabitat(first.world,anchor,'habitat-grove','elephant-grove');assert.equal(duplicate.ok,true);assert.equal(duplicate.duplicate,true);assert.deepEqual(duplicate.world,before);
  for(const [p,kind]of [[{x:2,z:11},'elephant-grove'],[anchor,'macaw-aviary']])assert.equal(prepareSpeciesHabitat(first.world,p,'habitat-grove',kind).reason,'command');
  assert.deepEqual(first.world,before);
});

test('actual planner revalidates six-by-six world on Confirm; Cancel and stale or duplicate input cannot commit',()=>{
  let world=fresh(),commits=0;const before=structuredClone(world),planner=createPlacementPlanner(()=>world,habitatBlockerKeys(),()=>{},{validate:(w,a)=>validateSpeciesHabitatPlacement(w,a,'elephant-grove'),operationId:()=> 'habitat-grove',commit:(p,id)=>{commits++;const r=prepareSpeciesHabitat(world,p.anchor,id,'elephant-grove');if(r.ok)world=r.world;return r.ok;}});
  planner.begin();planner.choose(anchor);planner.cancel();assert.equal(commits,0);assert.deepEqual(world,before);
  planner.begin();planner.choose(anchor);const revision=planner.snapshot().revision;assert.equal(planner.confirm(revision-1),false);
  world.tiles.find(t=>t.cell.x===8&&t.cell.z===16).path=true;assert.equal(planner.confirm(revision),false);assert.equal(commits,0);
  world.tiles.find(t=>t.cell.x===8&&t.cell.z===16).path=false;planner.choose(anchor);const current=planner.snapshot().revision;assert.equal(planner.confirm(current),true);assert.equal(planner.confirm(current),false);assert.equal(commits,1);assert.equal(world.tiles.filter(t=>t.occupantId==='habitat-grove').length,36);planner.dispose();
});

test('rendered six-by-six ghost has 36 cells and exact anchored bounds; repeated size switches use a bounded shared pool',()=>{
  const world=fresh(),scene=createTropicalDiorama(world),camera=new OrthographicCamera();let kind='elephant-grove',view;
  fitIsometricCamera(camera,scene.bounds,1366/768);const preview=createPlacementPreview(()=>world,scene.catalog,camera,()=>({left:0,top:0,width:1366,height:768}),v=>view=v,undefined,undefined,()=>kind);
  try{preview.guide('habitat',anchor);assert.equal(view.reason,'ready');const ghost=preview.group.children[0];assert.equal(ghost.children.filter(c=>c.isMesh&&c.visible).length,36);assert.equal(ghost.children.length,37);
    const b=new Box3().setFromObject(ghost);assert.equal(b.min.x,-3);assert.equal(b.max.x,3);assert.equal(b.min.z,6);assert.equal(b.max.z,12);
    for(let i=0;i<20;i++){kind='macaw-aviary';preview.guide('habitat',{x:6,z:3});assert.equal(view.proposal.cells.length,4);assert.equal(ghost.children.filter(c=>c.isMesh&&c.visible).length,4);kind='elephant-grove';preview.guide('habitat',anchor);assert.equal(ghost.children.length,37);}
    preview.command('cancel');assert.equal(preview.inspect().placementGhostVisible,false);assert.equal(preview.geometries.length,2);assert.equal(preview.materials.length,3);
  }finally{preview.dispose();for(const g of [...preview.geometries,...scene.geometries])g.dispose();for(const m of [...preview.materials,...scene.materials])m.dispose();}
});
