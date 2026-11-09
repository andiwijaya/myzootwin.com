import {Vector3,type Camera} from 'three';
import type {SceneCatalog} from '../../../src/game/render3d/scene-selection.ts';
import {raycastScene} from '../../../src/game/render3d/scene-picking.ts';

/** Read-only original catalogue projections for browser-driven QA, never a picker. */
export function interactionTargets(catalog:SceneCatalog,camera:Camera,rect:{left:number;top:number;width:number;height:number},nativeSafe=false){
 const result=[];
 for(const identity of catalog.identities.values()){
  if(identity.category!=='object'||identity.kind!=='zebra-facility'&&identity.kind!=='habitat')continue;
  const bounds=catalog.bounds.get(identity.id);if(!bounds)continue;
  let point:{x:number;y:number}|null=null,tries=0,unstable:unknown=null;
  // Bounded samples in actual world bounds; only a genuine frontmost triangle counts.
  for(const height of [.15,.5,.85])for(const x of [.5,.2,.8])for(const z of [.5,.2,.8]){
   if(point)continue;tries++;
   const p=new Vector3(bounds.min.x+(bounds.max.x-bounds.min.x)*x,bounds.min.y+(bounds.max.y-bounds.min.y)*height,bounds.min.z+(bounds.max.z-bounds.min.z)*z).project(camera);
   if(p.x<-.98||p.x>.98||p.y<-.98||p.y>.98)continue;
   const candidate={x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
   if(raycastScene(catalog,camera,candidate,rect)?.id!==identity.id)continue;
   // Native browser input rounds CSS coordinates. Reject a subpixel sliver at an
   // occlusion boundary rather than reporting its fractional hit as a safe click.
   if(!nativeSafe){point=candidate;continue;}
   const neighbours=[-1,-.5,0,.5,1].flatMap(dx=>[-1,-.5,0,.5,1].map(dy=>({dx,dy,id:raycastScene(catalog,camera,{x:candidate.x+dx,y:candidate.y+dy},rect)?.id??null})));
   if(neighbours.every(n=>n.id===identity.id))point=candidate;
   else unstable??={point:candidate,neighbours};
  }
  result.push({id:identity.id,kind:identity.kind,facilityKind:identity.facilityKind,cell:identity.cell,point,tries,unstable,safetyMarginCssPx:nativeSafe?1:0,method:nativeSafe?'Original full-catalogue raycast at25 samples in1CSSpx neighbourhood, rejecting fractional occlusion slivers. Read-only QA target; native click still needs observed identity.':'Original full-catalogue fractional triangle projection only; no native rounding safety claim.'});
 }
 return result;
}
