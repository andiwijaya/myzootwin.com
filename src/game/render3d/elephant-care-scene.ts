import {Box3,BoxGeometry,Group,Mesh,MeshStandardMaterial,type BufferGeometry} from 'three';
import type {ElephantResource} from '../core/species.ts';
import type {SceneCatalog} from './scene-selection.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {Batch} from './tropical-diorama.ts';
type CareResource=ElephantResource&{kind:'elephant-browse'|'elephant-water'};
import type {ElephantCarePreviewView} from './elephant-care-preview.ts';
function basket(){const b=new Batch(),box=(color:string,p:number[],size:number[])=>b.add(new BoxGeometry(1,1,1),color,p,size);box('#896641',[0,.30,0],[.78,.10,.65]);for(const x of [-.31,.31])for(const z of [-.24,.24])box('#6e573a',[x,.18,z],[.08,.32,.08]);for(const z of [-.32,.32])box('#a78955',[0,.43,z],[.84,.17,.055]);for(const x of [-.40,.40])box('#a78955',[x,.43,0],[.055,.17,.65]);return b.geometry();}
function trough(){const b=new Batch(),box=(color:string,p:number[],size:number[])=>b.add(new BoxGeometry(1,1,1),color,p,size);box('#7b8a84',[0,.10,0],[.92,.12,.56]);for(const z of [-.26,.26])box('#a9b2a1',[0,.23,z],[.94,.25,.075]);for(const x of [-.43,.43])box('#a9b2a1',[x,.23,0],[.075,.25,.53]);return b.geometry();}
function browsePortion(){const b=new Batch();b.add(new BoxGeometry(1,1,1),'#c8b05b',[0,0,0],[.13,.09,.17]);for(const x of [-.035,.025])b.add(new BoxGeometry(1,1,1),'#7f9a4f',[x,.03,0],[.035,.04,.19]);return b.geometry();}
/** Original, bounded shared facility pool. Visible portions/level read actual saved stock only. */
export function createElephantCareScene(catalog:SceneCatalog){
 const group=new Group();group.name='Elephant browse and drinking care';let disposed=false,signature='';
 let assets:{browse:BufferGeometry;water:BufferGeometry;portion:BufferGeometry;liquid:BufferGeometry;body:MeshStandardMaterial;food:MeshStandardMaterial;blue:MeshStandardMaterial;ghost:MeshStandardMaterial}|undefined;
 const records=new Map<string,{root:Group;body:Mesh;stock:Mesh[];entry:SceneCatalog['batches'][number];kind:CareResource['kind']}>();let ghost:Mesh|undefined;
 function allocate(){if(assets)return;assets={browse:basket(),water:trough(),portion:browsePortion(),liquid:new BoxGeometry(.74,.025,.36),body:new MeshStandardMaterial({vertexColors:true,roughness:1}),food:new MeshStandardMaterial({vertexColors:true,roughness:1}),blue:new MeshStandardMaterial({color:'#62a7ac',roughness:.4}),ghost:new MeshStandardMaterial({vertexColors:true,transparent:true,opacity:.45,depthWrite:false,roughness:1})};ghost=new Mesh(assets.browse,assets.ghost);ghost.name='Unpaid elephant facility preview';ghost.visible=false;group.add(ghost);}
 function remove(id:string){const r=records.get(id);if(!r)return;group.remove(r.root);catalog.batches=catalog.batches.filter(b=>b!==r.entry);catalog.identities.delete(id);catalog.bounds.delete(id);records.delete(id);}
 function release(){for(const id of [...records.keys()])remove(id);group.clear();if(assets){for(const g of [assets.browse,assets.water,assets.portion,assets.liquid])g.dispose();for(const m of [assets.body,assets.food,assets.blue,assets.ghost])m.dispose();}assets=undefined;ghost=undefined;}
 return {group,sync(resources:ElephantResource[],width:number,height:number,preview:ElephantCarePreviewView|null){
  if(disposed)return false;const rows=resources.filter((r):r is CareResource=>r.kind==='elephant-browse'||r.kind==='elephant-water'),next=JSON.stringify(rows.map(r=>[r.id,r.kind,r.cell,r.stock,r.capacity,r.revision])),changed=signature!==next;signature=next;
  if(!rows.length&&!preview?.active){if(assets)release();return changed;}allocate();const a=assets!,origin=sceneOrigin({width,height});
  for(const id of records.keys())if(!rows.some(r=>r.id===id))remove(id);
  for(const r of rows){let record=records.get(r.id);if(!record){const root=new Group(),geometry=r.kind==='elephant-browse'?a.browse:a.water,body=new Mesh(geometry,a.body),stock:Mesh[]=[];body.name=r.id;body.castShadow=true;body.receiveShadow=true;root.add(body);
    if(r.kind==='elephant-browse'){for(let i=0;i<8;i++){const portion=new Mesh(a.portion,a.food);portion.position.set(-.24+(i%4)*.16,.47,-.12+Math.floor(i/4)*.24);stock.push(portion);root.add(portion);}}
    else {const water=new Mesh(a.liquid,a.blue);stock.push(water);root.add(water);}
    const entry={mesh:body,ranges:[{first:0,count:geometry.getAttribute('position').count/3,id:r.id}]};record={root,body,stock,entry,kind:r.kind};records.set(r.id,record);catalog.batches.push(entry);group.add(root);
   }
   record.root.position.set(r.cell.x+.5-origin.x,.079,r.cell.z+.5-origin.z);if(r.kind==='elephant-browse')record.stock.forEach((m,i)=>{m.visible=i<r.stock;});else {const water=record.stock[0]!;water.visible=r.stock>0;water.position.y=.15+.12*r.stock/r.capacity;}
   record.root.updateMatrixWorld(true);const ordinal=rows.filter(q=>q.kind===r.kind).findIndex(q=>q.id===r.id)+1;catalog.identities.set(r.id,{id:r.id,category:'object',kind:'elephant-facility',facilityKind:r.kind,stock:r.stock,capacity:r.capacity,ordinal,cell:{...r.cell}});catalog.bounds.set(r.id,new Box3().setFromObject(record.body));
  }
  ghost!.visible=Boolean(preview?.active&&preview.cell);if(preview?.active&&preview.cell){ghost!.geometry=preview.kind==='elephant-browse'?a.browse:a.water;ghost!.position.set(preview.cell.x+.5-origin.x,.079,preview.cell.z+.5-origin.z);a.ghost.color.set(preview.reason==='ready'?'#8bd5a1':'#e58c79');}group.updateMatrixWorld(true);return changed;
 },dispose(){if(disposed)return;disposed=true;release();},inspect:()=>({elephantCareFacilities:records.size,elephantCareGeometries:assets?4:0,elephantCareMaterials:assets?4:0,elephantCareGhostVisible:Boolean(ghost?.visible),elephantCareVisibleFoodPortions:[...records.values()].filter(r=>r.kind==='elephant-browse').reduce((n,r)=>n+r.stock.filter(s=>s.visible).length,0),elephantCareWaterVisible:[...records.values()].some(r=>r.kind==='elephant-water'&&r.stock[0]?.visible),elephantCareSceneDisposed:disposed})};
}
