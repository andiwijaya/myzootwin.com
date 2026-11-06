export interface CameraFrame {
  width: number; height: number; halfWidth: number; halfHeight: number;
  rightX: number; rightZ: number; upX: number; upZ: number;
  originX: number; originZ: number; mapWidth: number; mapHeight: number;
  mapCenterX?:number;mapCenterZ?:number;upY?:number;
}
export type CameraCommand = 'zoom-in' | 'zoom-out' | 'reset' | 'rotate-left' | 'rotate-right';
const clamp = (value:number, min:number, max:number) => Math.max(min,Math.min(max,value));

/** Ground-plane navigation only: no simulation, renderer loop, picking or placement. */
export function createCameraNavigation(onChange:()=>void = ()=>{}) {
  let frame:CameraFrame|undefined, zoom=1, x=0, z=0;
  function limits() {
    if(!frame)return {minX:0,maxX:0,minZ:0,maxZ:0};
    const t=1-1/zoom, f=frame;
    // At overview no pan; zoom progressively exposes travel, always inside the map.
    return {minX:((f.mapCenterX??0)-f.mapWidth/2+.6-f.originX)*t,maxX:((f.mapCenterX??0)+f.mapWidth/2-.6-f.originX)*t,minZ:((f.mapCenterZ??0)-f.mapHeight/2+.6-f.originZ)*t,maxZ:((f.mapCenterZ??0)+f.mapHeight/2-.6-f.originZ)*t};
  }
  function commit() {const b=limits();x=clamp(x,b.minX,b.maxX);z=clamp(z,b.minZ,b.maxZ);onChange();}
  function ground(u:number,v:number) {
    const f=frame!;const determinant=f.rightX*f.upZ-f.rightZ*f.upX;
    return {x:(u*f.upZ-f.rightZ*v)/determinant,z:(f.rightX*v-u*f.upX)/determinant};
  }
  function zoomBy(factor:number, anchorX=0, anchorY=0) {
    if(!frame||!Number.isFinite(factor)||factor<=0||![anchorX,anchorY].every(Number.isFinite))return;
    const next=clamp(zoom*factor,1,3),delta=1/zoom-1/next;
    const p=ground(clamp(anchorX,-1,1)*frame.halfWidth*delta,clamp(anchorY,-1,1)*frame.halfHeight*delta);
    x+=p.x;z+=p.z;zoom=next;commit();
  }
  return {
    configure(next:CameraFrame, preserveFocus=false) {
      if(!Object.values(next).every(Number.isFinite)||next.width<=0||next.height<=0||next.halfWidth<=0||next.halfHeight<=0||next.mapWidth<=2||next.mapHeight<=2||Math.abs(next.originX-(next.mapCenterX??0))>next.mapWidth/2-.6||Math.abs(next.originZ-(next.mapCenterZ??0))>next.mapHeight/2-.6||Math.abs(next.rightX*next.upZ-next.rightZ*next.upX)<.01)throw new RangeError('Invalid camera frame');
      const previous=frame?{x:frame.originX+x,z:frame.originZ+z}:undefined;
      frame={...next};if(preserveFocus&&previous&&zoom>1){x=previous.x-frame.originX;z=previous.z-frame.originZ;}commit();
    },
    panPixels(dx:number,dy:number) {
      if(!frame||![dx,dy].every(Number.isFinite))return;
      const p=ground(-dx*2*frame.halfWidth/(zoom*frame.width),dy*2*frame.halfHeight/(zoom*frame.height));x+=p.x;z+=p.z;commit();
    },
    focus(point:{x:number;z:number}){if(!frame||![point.x,point.z].every(Number.isFinite))return;zoom=2.5;x=point.x-frame.originX;z=point.z-frame.originZ;commit();},
    /** Fit a whole habitat with padding using the existing bounded pan policy. Existing close-up focus is unchanged. */
    focusArea(area:{x:number;z:number;width:number;depth:number}){
      if(!frame||!Object.values(area).every(Number.isFinite)||area.width<=0||area.depth<=0)return;
      const f=frame,center={x:area.x+area.width/2,z:area.z+area.depth/2};
      for(let step=80;step>=0;step--){zoom=1+step/40;const b=limits();x=clamp(center.x-f.originX,b.minX,b.maxX);z=clamp(center.z-f.originZ,b.minZ,b.maxZ);const fits=[area.x-1,area.x+area.width+1].every(px=>[area.z-1,area.z+area.depth+1].every(pz=>{const dx=px-f.originX-x,dz=pz-f.originZ-z;return Math.abs(dx*f.rightX+dz*f.rightZ)<=f.halfWidth/zoom*.94&&[0,3.4].every(y=>Math.abs(dx*f.upX+dz*f.upZ+y*(f.upY??0))<=f.halfHeight/zoom*.94);}));if(fits||step===0)break;}
      commit();
    },
    zoomBy,
    command(command:CameraCommand) {if(command==='reset'){zoom=1;x=z=0;commit();}else if(command==='zoom-in'||command==='zoom-out')zoomBy(command==='zoom-in'?1.25:.8);},
    inspect:()=>({zoom,x,z,focusX:(frame?.originX??0)+x,focusZ:(frame?.originZ??0)+z,...limits()}),
  };
}
