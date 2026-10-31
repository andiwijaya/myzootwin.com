import { Box3, Box3Helper, DoubleSide, Group, Mesh, MeshBasicMaterial, PlaneGeometry, Raycaster, Vector2, Vector3, type Camera } from 'three';
import type { SceneCatalog, SceneIdentity } from './scene-selection.ts';
export interface PickRect {left:number;top:number;width:number;height:number;}

/** Visible triangle ownership, not broad bounding-box proxies or a plane through occluders. */
export function raycastScene(catalog:SceneCatalog,camera:Camera,point:{x:number;y:number},rect:PickRect,raycaster=new Raycaster()):SceneIdentity|null {
  if(![point.x,point.y,rect.left,rect.top,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0||point.x<rect.left||point.x>rect.left+rect.width||point.y<rect.top||point.y>rect.top+rect.height)return null;
  camera.updateMatrixWorld(true);
  raycaster.setFromCamera(new Vector2((point.x-rect.left)/rect.width*2-1,1-(point.y-rect.top)/rect.height*2),camera);
  const hit=raycaster.intersectObjects(catalog.batches.map(b=>b.mesh),false)[0];
  if(!hit||hit.faceIndex===undefined)return null;
  const owner=catalog.batches.find(b=>b.mesh===hit.object)?.ranges.find(r=>hit.faceIndex!>=r.first&&hit.faceIndex!<r.first+r.count);
  const identity=owner?.id?catalog.identities.get(owner.id):undefined;
  return identity?{...identity,cell:{...identity.cell}}:null;
}

export function createScenePicker(catalog:SceneCatalog,camera:Camera,rect:()=>PickRect,onChange:(identity:SceneIdentity|null)=>void) {
  const group=new Group();group.name='Selection indicator';group.visible=false;
  const outline=new Box3Helper(new Box3(),'#284d42');
  const outlineMaterials=Array.isArray(outline.material)?outline.material:[outline.material];
  for(const material of outlineMaterials)material.depthTest=false;outline.renderOrder=21;
  const fill=new Mesh(new PlaneGeometry(1,1),new MeshBasicMaterial({color:'#ffe4a0',transparent:true,opacity:.28,side:DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}));
  fill.rotation.x=-Math.PI/2;fill.renderOrder=20;group.add(fill,outline);
  const raycaster=new Raycaster();let current:SceneIdentity|null=null,enabled=true,disposed=false,revision=0;
  function select(next:SceneIdentity|null) {
    if(disposed||current?.id===next?.id)return;
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
    pick(point:{x:number;y:number}) {if(enabled&&!disposed)select(raycastScene(catalog,camera,point,rect(),raycaster));},
    clear(){select(null);},
    setEnabled(value:boolean){enabled=value;},
    dispose(){if(disposed)return;select(null);disposed=true;group.visible=false;},
    inspect:()=>({selectionActive:Boolean(current),selectionRevision:revision,selectionMarkerVisible:group.visible,selectionDisposed:disposed,selectableTiles:[...catalog.identities.values()].filter(i=>i.category==='tile').length,selectableObjects:[...catalog.identities.values()].filter(i=>i.category==='object').length}),
  };
}
