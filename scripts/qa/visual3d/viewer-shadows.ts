import {DirectionalLight,PointLight,SpotLight,type Scene,type WebGLRenderer} from 'three';

/** QA visibility changes must invalidate both caches without enabling continuous shadows. */
export function invalidateViewerShadows(scene:Scene,renderer:Pick<WebGLRenderer,'shadowMap'>){
 if(!renderer.shadowMap.enabled)return;
 renderer.shadowMap.needsUpdate=true;
 scene.traverse(object=>{
  if((object instanceof DirectionalLight||object instanceof PointLight||object instanceof SpotLight)&&object.castShadow)object.shadow.needsUpdate=true;
 });
}
