import {Box3,Vector3,OrthographicCamera} from 'three';
/** Report the actual QA camera yaw, including production reset and free orbit.
 * Round diagnostic degrees only; camera/model coordinates remain untouched. */
export function viewerAzimuth(camera:OrthographicCamera,target:Vector3){return Math.round(((Math.atan2(camera.position.x-target.x,camera.position.z-target.z)*180/Math.PI+360)%360)*1e9)/1e9%360;}
/** QA camera only. Original production objects and their authoritative coordinates never move. */
export function fitViewerCamera(camera:OrthographicCamera,bounds:Box3,width:number,height:number,degrees:number,zoom=1){
 if(bounds.isEmpty()||![width,height,degrees,zoom].every(Number.isFinite)||width<=0||height<=0||zoom<=0)throw Error('Invalid viewer camera bounds');
 const center=bounds.getCenter(new Vector3()),size=bounds.getSize(new Vector3()),radius=Math.max(.25,size.length()/2),aspect=width/height,half=radius*1.2/Math.min(1,aspect),a=degrees*Math.PI/180;
 camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.near=.01;camera.far=1000;camera.zoom=zoom;camera.position.copy(center).add(new Vector3(Math.sin(a)*radius*4,radius*2.6,Math.cos(a)*radius*4));camera.up.set(0,1,0);camera.lookAt(center);camera.updateProjectionMatrix();camera.updateMatrixWorld(true);return center;
}
