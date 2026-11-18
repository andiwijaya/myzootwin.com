import { Box3, Box3Helper, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera } from 'three';
import type { SceneCatalog, SceneIdentity } from './scene-selection.ts';
export interface PickRect {left:number;top:number;width:number;height:number;}
export interface SceneTapPoint {x:number;y:number;id?:number;pointerType?:string;}
const animalKinds=new Set<SceneIdentity['kind']>(['elephant','lion','giraffe','zebra']);
const visible=(mesh:Mesh)=>{for(let object:import('three').Object3D|null=mesh;object;object=object.parent)if(!object.visible)return false;return true;};
const validPoint=(point:{x:number;y:number},rect:PickRect)=>[point.x,point.y,rect.left,rect.top,rect.width,rect.height].every(Number.isFinite)&&rect.width>0&&rect.height>0&&point.x>=rect.left&&point.x<=rect.left+rect.width&&point.y>=rect.top&&point.y<=rect.top+rect.height;

/** Visible triangle ownership, not broad bounding-box proxies or a plane through occluders. */
export function raycastScene(catalog:SceneCatalog,camera:Camera,point:{x:number;y:number},rect:PickRect,raycaster=new Raycaster(),accept?:(identity:SceneIdentity,point:Vector3)=>boolean):SceneIdentity|null {
  if(!validPoint(point,rect))return null;
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new Vector2((point.x-rect.left)/rect.width*2-1,1-(point.y-rect.top)/rect.height*2),camera);
  const meshes=catalog.batches.map(b=>b.mesh).filter(visible);for(const mesh of meshes)mesh.updateWorldMatrix(true,false);
  const hits=raycaster.intersectObjects(meshes,false);
  const hit=hits.find(h=>{const mesh=h.object as Mesh,material=Array.isArray(mesh.material)?mesh.material[h.face?.materialIndex??0]:mesh.material;if(material?.visible===false)return false;if(!accept)return true;const batch=catalog.batches.find(b=>b.mesh===mesh),owner=batch?.ranges.find(r=>h.faceIndex!=null&&h.faceIndex>=r.first&&h.faceIndex<r.first+r.count),identity=owner?.id?catalog.identities.get(owner.id):undefined;return identity&&accept(identity,h.point);});
  if(!hit||hit.faceIndex===undefined)return null;
  const owner=catalog.batches.find(b=>b.mesh===hit.object)?.ranges.find(r=>hit.faceIndex!>=r.first&&hit.faceIndex!<r.first+r.count);
  const identity=owner?.id?catalog.identities.get(owner.id):undefined;
  return identity?{...identity,cell:{...identity.cell}}:null;
}

/** Closest point on the projected triangle, in CSS pixels rather than world units or DPR. */
function closestTriangle(point:SceneTapPoint,a:Vector3,b:Vector3,c:Vector3){
  const cross=(p:SceneTapPoint,q:SceneTapPoint,r:SceneTapPoint)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);
  if(Math.abs(cross(a,b,c))<1e-8)return null;
  const sides=[cross(a,b,point),cross(b,c,point),cross(c,a,point)];
  let best={x:point.x,y:point.y,distance:0};
  if(!sides.every(v=>v>=0)&&!sides.every(v=>v<=0)){
    best.distance=Infinity;
    for(const [u,v]of [[a,b],[b,c],[c,a]]){const dx=v!.x-u!.x,dy=v!.y-u!.y,length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((point.x-u!.x)*dx+(point.y-u!.y)*dy)/length)):0,x=u!.x+t*dx,y=u!.y+t*dy,distance=Math.hypot(point.x-x,point.y-y);if(distance<best.distance)best={x,y,distance};}
  }
  // Move just inside the real triangle so the final visibility ray is stable at shared edges.
  const dx=(a.x+b.x+c.x)/3-best.x,dy=(a.y+b.y+c.y)/3-best.y,step=Math.min(1,.08/(Math.hypot(dx,dy)||1));
  return {...best,x:best.x+dx*step,y:best.y+dy*step};
}

/** A small touch-only allowance around actual posed animal triangles. Boxes only cull work. */
export function resolveSceneTap(catalog:SceneCatalog,camera:Camera,point:SceneTapPoint,rect:PickRect,raycaster=new Raycaster(),accept?:(identity:SceneIdentity,point:Vector3)=>boolean):SceneIdentity|null{
  const exact=raycastScene(catalog,camera,point,rect,raycaster,accept);
  if(point.pointerType!=='touch'||!validPoint(point,rect)||exact&&(animalKinds.has(exact.kind)||exact.category==='object'&&exact.kind!=='habitat'))return exact;
  const radius=12,candidates=new Map<string,{id:string;x:number;y:number;distance:number}>(),vertex=new Vector3();
  const project=(p:Vector3)=>{p.project(camera);p.x=rect.left+(p.x+1)*rect.width/2;p.y=rect.top+(1-p.y)*rect.height/2;return p;};
  for(const batch of catalog.batches){
    const ranges=batch.ranges.filter(r=>r.id&&animalKinds.has(catalog.identities.get(r.id)?.kind!));if(!ranges.length||!visible(batch.mesh))continue;
    const box=new Box3();for(const range of ranges){const bounds=catalog.bounds.get(range.id!);if(bounds)box.union(bounds);}
    if(box.isEmpty())continue;
    let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){project(vertex.set(x,y,z));left=Math.min(left,vertex.x);right=Math.max(right,vertex.x);top=Math.min(top,vertex.y);bottom=Math.max(bottom,vertex.y);}
    if(point.x<left-radius||point.x>right+radius||point.y<top-radius||point.y>bottom+radius)continue;
    const geometry=batch.mesh.geometry,index=geometry.index,vertices=new Map<number,Vector3>(),draw=geometry.drawRange;
    const at=(i:number)=>{const n=index?index.getX(i):i;let p=vertices.get(n);if(!p){p=project(batch.mesh.getVertexPosition(n,new Vector3()).applyMatrix4(batch.mesh.matrixWorld));vertices.set(n,p);}return p;};
    for(const range of ranges)for(let face=range.first;face<range.first+range.count;face++){
      const i=face*3;if(i<draw.start||i+2>=draw.start+draw.count)continue;
      const a=at(i),b=at(i+1),c=at(i+2);if([a,b,c].every(p=>p.z<-1)||[a,b,c].every(p=>p.z>1))continue;
      const nearest=closestTriangle(point,a,b,c);if(!nearest||nearest.distance>radius||nearest.distance>=(candidates.get(range.id!)?.distance??Infinity))continue;
      candidates.set(range.id!,{id:range.id!,...nearest});
    }
  }
  const owned=[...candidates.values()].sort((a,b)=>a.distance-b.distance||a.id.localeCompare(b.id));
  const hits=owned.filter(candidate=>raycastScene(catalog,camera,candidate,rect,raycaster,accept)?.id===candidate.id);
  if(!hits.length)return exact;
  // Do not guess between touching silhouettes at effectively the same screen distance.
  if(hits[1]&&hits[1].distance-hits[0]!.distance<.75)return null;
  const identity=catalog.identities.get(hits[0]!.id);return identity?{...identity,cell:{...identity.cell}}:exact;
}

export function createScenePicker(catalog:SceneCatalog,camera:Camera,rect:()=>PickRect,onChange:(identity:SceneIdentity|null)=>void,accept?:(identity:SceneIdentity,point:Vector3)=>boolean) {
  const group=new Group();group.name='Selection indicator';group.visible=false;
  const outline=new Box3Helper(new Box3(),'#284d42');
  const outlineMaterials=Array.isArray(outline.material)?outline.material:[outline.material];
  for(const material of outlineMaterials)material.depthTest=false;outline.renderOrder=21;
  const fill=new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial({color:'#ffe4a0',transparent:true,opacity:.28,side:DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  fill.rotation.x=-Math.PI/2;fill.renderOrder=20;group.add(fill,outline);
  const raycaster=new Raycaster();let current:SceneIdentity|null=null,enabled=true,disposed=false,revision=0;
  let presented:Camera|undefined,tapCamera:Camera|undefined,viewRevision=0,prepared:{point:SceneTapPoint;rect:PickRect;revision:number}|undefined;
  function select(next:SceneIdentity|null,force=false) {
    if(disposed||(!force&&current?.id===next?.id&&current?.kind===next?.kind&&current?.connected===next?.connected))return;
    current=next;revision++;group.visible=Boolean(next);
    const bounds=next?catalog.bounds.get(next.id):undefined;
    if(bounds){
      outline.box.copy(bounds).expandByScalar(.035);outline.box.min.y=Math.max(.025,outline.box.min.y);
      const center=bounds.getCenter(new Vector3()),size=bounds.getSize(new Vector3());
      fill.position.set(center.x,.07,center.z);fill.scale.set(size.x+.07,size.z+.07,1);group.updateMatrixWorld(true);
    }
    onChange(next?{...next,cell:{...next.cell}}:null);
  }
  return {group,geometries:[outline.geometry,fill.geometry],materials:[...outlineMaterials,fill.material],
    captureView(){if(disposed)return;if(!presented||!presented.matrixWorld.equals(camera.matrixWorld)||!presented.projectionMatrix.equals(camera.projectionMatrix)){presented??=camera.clone();presented.copy(camera);viewRevision++;}},
    prepareTap(point:SceneTapPoint){if(disposed||point.pointerType!=='touch')return;tapCamera??=camera.clone();tapCamera.copy(presented??camera);const bounds=rect();prepared={point:{...point},rect:{left:bounds.left,top:bounds.top,width:bounds.width,height:bounds.height},revision:viewRevision};},
    pick(point:SceneTapPoint,handle?:(identity:SceneIdentity|null)=>boolean) {
      if(disposed||(!enabled&&!handle))return;const currentRect=rect(),start=prepared;prepared=undefined;
      const captured=point.pointerType==='touch'&&start&&start.point.id===point.id&&tapCamera;
      if(captured&&(start!.revision!==viewRevision||(['left','top','width','height'] as const).some(key=>start!.rect[key]!==currentRect[key])))return;
      const identity=resolveSceneTap(catalog,captured?tapCamera!:presented&&point.pointerType==='touch'?presented:camera,captured?start!.point:point,currentRect,raycaster,accept);if(!handle?.(identity)&&enabled)select(identity);
    },
    selection:()=>current?structuredClone(current):null,
    setFilter(value?:typeof accept){prepared=undefined;accept=value;},
    clear(){prepared=undefined;select(null);},
    refresh(){if(current){const next=catalog.identities.get(current.id);select(next?{...next,cell:{...next.cell}}:null,true);}},
    setEnabled(value:boolean){enabled=value;},
    dispose(){if(disposed)return;prepared=undefined;presented=tapCamera=undefined;select(null);disposed=true;group.visible=false;},
    inspect:()=>({selectionActive:Boolean(current),selectionRevision:revision,selectionMarkerVisible:group.visible,selectionDisposed:disposed,selectableTiles:[...catalog.identities.values()].filter(i=>i.category==='tile').length,selectableObjects:[...catalog.identities.values()].filter(i=>i.category==='object').length}),
  };
}
