import {Vector3,type Camera} from 'three';
import type {SceneCatalog} from '../../../src/game/render3d/scene-selection.ts';
import {raycastScene} from '../../../src/game/render3d/scene-picking.ts';

/** Read-only original catalogue projections for browser-driven QA, never a picker. */
export function interactionTargets(catalog:SceneCatalog,camera:Camera,rect:{left:number;top:number;width:number;height:number}){
 const result=[];
 for(const identity of catalog.identities.values()){
  if(identity.category!=='object'||identity.kind!=='zebra-facility'&&!(identity.kind==='habitat'&&identity.habitatKind==='zebra-grasslands'))continue;
  const bounds=catalog.bounds.get(identity.id);if(!bounds)continue;
  let point:{x:number;y:number}|null=null,tries=0;
  // Bounded samples in actual world bounds; only a genuine frontmost triangle counts.
  for(const height of [.15,.5,.85])for(const x of [.5,.2,.8])for(const z of [.5,.2,.8]){
   if(point)continue;tries++;
   const p=new Vector3(bounds.min.x+(bounds.max.x-bounds.min.x)*x,bounds.min.y+(bounds.max.y-bounds.min.y)*height,bounds.min.z+(bounds.max.z-bounds.min.z)*z).project(camera);
   if(p.x<-.98||p.x>.98||p.y<-.98||p.y>.98)continue;
   const candidate={x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
   if(raycastScene(catalog,camera,candidate,rect)?.id===identity.id)point=candidate;
  }
  result.push({id:identity.id,kind:identity.kind,facilityKind:identity.facilityKind,cell:identity.cell,point,tries,method:'Actual catalogue bounds projected through original camera; original full-catalogue triangle raycast confirms frontmost identity. Read-only, not a browser input.'});
 }
 return result;
}
