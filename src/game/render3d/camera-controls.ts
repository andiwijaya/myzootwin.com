import { Vector3, type Box3, type OrthographicCamera } from 'three';
import { fitIsometricCamera } from './isometric-camera.ts';
import { createCameraNavigation, type CameraCommand } from './camera-navigation.ts';
import { createCameraGestures, type CameraPointer } from './camera-gestures.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';

export function mountCameraControls(host:HTMLElement, canvas:HTMLCanvasElement, camera:OrthographicCamera, bounds:Box3, map:{width:number;height:number}, onTap?:(point:CameraPointer)=>void,onCancel?:()=>void) {
  let disposed=false,enabled=true;const events=new AbortController();
  let basePosition=new Vector3(),width=0,height=0,azimuthStep=0;
  const navigation=createCameraNavigation(()=>{
    if(disposed)return;const view=navigation.inspect();
    camera.position.copy(basePosition).add(new Vector3(view.x,0,view.z));camera.zoom=view.zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
    host.dataset.cameraZoom=String(view.zoom);host.dataset.cameraPanX=String(view.x);host.dataset.cameraPanZ=String(view.z);host.dataset.cameraAzimuth=String(azimuthStep*45);
    host.dispatchEvent(new CustomEvent('camera-view-change',{detail:{zoom:view.zoom,azimuth:azimuthStep*45},bubbles:false}));
  });
  const gestures=createCameraGestures(navigation,()=>canvas.getBoundingClientRect(),onTap);
  function release(id:number) {try{if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}catch{/* Already released by the browser. */}}
  function cancelAll() {const ids=gestures.ids();gestures.cancelAll();for(const id of ids)release(id);canvas.style.cursor='grab';}
  const point=(event:PointerEvent)=>({id:event.pointerId,x:event.clientX,y:event.clientY});
  canvas.style.touchAction='none';canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',event=>{
    if(!enabled||disposed||event.button!==0||!gestures.down(point(event)))return;
    event.preventDefault();host.focus({preventScroll:true});canvas.style.cursor='grabbing';
    try{canvas.setPointerCapture(event.pointerId);}catch{/* Injected non-native pointers cannot be captured. */}
  },{signal:events.signal});
  canvas.addEventListener('pointermove',event=>{
    if(!enabled||disposed||!gestures.ids().includes(event.pointerId))return;
    if(event.pointerType==='mouse'&&(event.buttons&1)===0){cancelAll();return;}
    event.preventDefault();gestures.move(point(event));
  },{signal:events.signal});
  function up(event:PointerEvent) {if(disposed)return;gestures.up(point(event));release(event.pointerId);if(!gestures.inspect().pointers)canvas.style.cursor='grab';}
  canvas.addEventListener('pointerup',up,{signal:events.signal});
  window.addEventListener('pointerup',up,{signal:events.signal});
  for(const name of ['pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{gestures.cancel((event as PointerEvent).pointerId);release((event as PointerEvent).pointerId);if(!gestures.inspect().pointers)canvas.style.cursor='grab';},{signal:events.signal});
  canvas.addEventListener('wheel',event=>{
    if(!enabled||disposed||!Number.isFinite(event.deltaY))return;event.preventDefault();cancelAll();
    const b=canvas.getBoundingClientRect(),delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?b.height:1);
    navigation.zoomBy(Math.exp(-Math.max(-300,Math.min(300,delta))*.0025),(event.clientX-b.left)/b.width*2-1,1-(event.clientY-b.top)/b.height*2);
  },{signal:events.signal,passive:false});
  host.addEventListener('keydown',event=>{
    if(!enabled||disposed||event.target!==host||event.ctrlKey||event.metaKey||event.altKey)return;
    const key=event.key;
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','_','Home','Escape','Enter',' ','q','Q','e','E'].includes(key))return;
    event.preventDefault();cancelAll();
    const step=event.shiftKey?80:40;
    if(key.startsWith('Arrow'))navigation.panPixels(key==='ArrowLeft'?step:key==='ArrowRight'?-step:0,key==='ArrowUp'?step:key==='ArrowDown'?-step:0);
    else if(key==='Home')command('reset');
    else if(key.toLowerCase()==='q'||key.toLowerCase()==='e'){if(!event.repeat)command(key.toLowerCase()==='q'?'rotate-left':'rotate-right');}
    else if(key==='Escape')onCancel?.();
    else if(key==='Enter'||key===' ') {
      if(!event.repeat){const b=canvas.getBoundingClientRect();onTap?.({id:0,x:b.left+b.width/2,y:b.top+b.height/2});}
    } else navigation.command(key==='+'||key==='='?'zoom-in':'zoom-out');
  },{signal:events.signal});
  window.addEventListener('blur',cancelAll,{signal:events.signal});
  // Refit only on an explicit view/size change, never per simulation/render frame.
  function reframe(preserveFocus=false){
    if(width<=0||height<=0)return;
    const frame=fitIsometricCamera(camera,bounds,width/height,azimuthStep*Math.PI/4);basePosition=camera.position.clone();
    const right=new Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new Vector3(0,1,0).applyQuaternion(camera.quaternion);
    const origin=sceneOrigin(map);
    navigation.configure({width,height,halfWidth:frame.halfWidth,halfHeight:frame.halfHeight,rightX:right.x,rightZ:right.z,upX:up.x,upZ:up.z,upY:up.y,originX:frame.originX,originZ:frame.originZ,mapWidth:map.width,mapHeight:map.height,mapCenterX:map.width/2-origin.x,mapCenterZ:map.height/2-origin.z},preserveFocus);
  }
  function command(value:CameraCommand){
    if(!enabled||disposed||!width||!height)return;cancelAll();
    if(value==='rotate-left'||value==='rotate-right'){azimuthStep=(azimuthStep+(value==='rotate-left'?7:1))%8;reframe(true);}
    else if(value==='reset'){azimuthStep=0;reframe();navigation.command('reset');}
    else navigation.command(value);
  }
  return {
    resize(nextWidth:number,nextHeight:number) {
      if(disposed||!Number.isFinite(nextWidth)||!Number.isFinite(nextHeight)||nextWidth<=0||nextHeight<=0)return;
      cancelAll();width=nextWidth;height=nextHeight;reframe();
    },
    focus(point:{x:number;z:number}){if(enabled&&!disposed){cancelAll();navigation.focus(point);}},
    focusArea(area:{x:number;z:number;width:number;depth:number}){if(enabled&&!disposed){cancelAll();navigation.focusArea(area);}},
    command,
    setEnabled(value:boolean) {enabled=value;if(!enabled)cancelAll();},
    dispose(){if(disposed)return;cancelAll();disposed=true;events.abort();delete host.dataset.cameraZoom;delete host.dataset.cameraPanX;delete host.dataset.cameraPanZ;delete host.dataset.cameraAzimuth;},
    inspect:()=>{const v=navigation.inspect();return {cameraControlsDisposed:disposed,cameraInputEnabled:enabled&&!disposed,cameraZoom:v.zoom,cameraAzimuth:azimuthStep*45,cameraPanX:v.x,cameraPanZ:v.z,cameraFocusX:v.focusX,cameraFocusZ:v.focusZ,cameraMinPanX:v.minX,cameraMaxPanX:v.maxX,cameraMinPanZ:v.minZ,cameraMaxPanZ:v.maxZ,cameraPointers:gestures.inspect().pointers,cameraPinching:gestures.inspect().pinching};},
  };
}
