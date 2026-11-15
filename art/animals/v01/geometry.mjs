import {BufferGeometry,Float32BufferAttribute,Uint16BufferAttribute,MeshStandardMaterial,Vector3,SphereGeometry,Quaternion} from 'three';
import {MarchingCubes} from 'three/addons/objects/MarchingCubes.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';

export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const mix=(a,b,t)=>a+(b-a)*t;
const smoothMin=(a,b,k)=>{const h=clamp(.5+.5*(b-a)/k);return mix(b,a,h)-k*h*(1-h);};
export const ellipsoid=(center,radii,joint='body',angle=0)=>({center,radii,joint,angle});
export function distance(p,s){let x=p[0]-s.center[0],y=p[1]-s.center[1],z=p[2]-s.center[2];if(s.angle){const c=Math.cos(s.angle),n=Math.sin(s.angle);[y,z]=[c*y+n*z,-n*y+c*z];}const r=s.radii,k0=Math.hypot(x/r[0],y/r[1],z/r[2]),k1=Math.hypot(x/(r[0]*r[0]),y/(r[1]*r[1]),z/(r[2]*r[2]));return k1>1e-9?k0*(k0-1)/k1:-Math.min(...r);}

/** Analytic volumes define new anatomy. Marching cubes only samples this editable surface. */
export function implicitSkin(shapes,bounds,joints,low){
 const resolution=low?44:76,material=new MeshStandardMaterial(),march=new MarchingCubes(resolution,material,false,false,250000),center=bounds[0].map((v,i)=>(v+bounds[1][i])/2),half=bounds[0].map((v,i)=>(bounds[1][i]-v)/2),p=[0,0,0];march.isolation=0;
 for(let z=0;z<resolution;z++)for(let y=0;y<resolution;y++)for(let x=0;x<resolution;x++){p[0]=center[0]+(2*x/resolution-1)*half[0];p[1]=center[1]+(2*y/resolution-1)*half[1];p[2]=center[2]+(2*z/resolution-1)*half[2];let d=10;for(const shape of shapes)d=smoothMin(d,distance(p,shape),.035);march.field[x+resolution*(y+resolution*z)]=-d;}
 march.update();const count=march.count,pos=march.geometry.getAttribute('position'),nor=march.geometry.getAttribute('normal'),vertices=[],normals=[],bindings=[];
 for(let i=0;i<count;i++){const point=[pos.getX(i),pos.getY(i),pos.getZ(i)].map((v,k)=>center[k]+v*half[k]);vertices.push(...point);const n=new Vector3(nor.getX(i)/half[0],nor.getY(i)/half[1],nor.getZ(i)/half[2]).normalize();normals.push(n.x,n.y,n.z);
  const distances=shapes.map(s=>({s,d:distance(point,s)})).sort((a,b)=>a.d-b.d),nearest=distances[0].d,weights=new Map();for(const {s,d}of distances){if(d-nearest>.13)continue;const index=joints.findIndex(j=>j.name===s.joint);if(index<0)throw Error('Missing anatomical joint '+s.joint);weights.set(index,(weights.get(index)??0)+Math.exp(-(d-nearest)*45));}const chosen=[...weights].sort((a,b)=>b[1]-a[1]).slice(0,4),sum=chosen.reduce((n,w)=>n+w[1],0);bindings.push({indices:chosen.map(w=>w[0]),weights:chosen.map(w=>w[1]/sum)});
 }
 march.geometry.dispose();material.dispose();return {vertices,normals,bindings,colors:Array(count).fill(null)};
}

export function appendEllipsoid(target,center,radii,joint,joints,color=null,low=false,angle=0){const source=new SphereGeometry(1,low?12:24,low?8:16),g=source.toNonIndexed();source.dispose();g.scale(...radii);if(angle)g.rotateX(angle);g.translate(...center);const pos=g.getAttribute('position'),normal=g.getAttribute('normal'),index=joints.findIndex(j=>j.name===joint);if(index<0)throw Error('Missing detail joint '+joint);for(let i=0;i<pos.count;i++){target.vertices.push(pos.getX(i),pos.getY(i),pos.getZ(i));target.normals.push(normal.getX(i),normal.getY(i),normal.getZ(i));target.bindings.push({indices:[index],weights:[1]});target.colors.push(color);}g.dispose();}

export function appendTube(target,points,radii,joint,joints,color=null,low=false){const sides=low?8:14,index=joints.findIndex(j=>j.name===joint);const rings=points.map((p,i)=>{const a=new Vector3(...points[Math.max(0,i-1)]),b=new Vector3(...points[Math.min(points.length-1,i+1)]),q=new Quaternion().setFromUnitVectors(new Vector3(0,1,0),b.sub(a).normalize());return Array.from({length:sides},(_,c)=>{const t=c/sides*Math.PI*2,n=new Vector3(Math.cos(t),0,Math.sin(t)).applyQuaternion(q);return{p:n.clone().multiplyScalar(radii[i]).add(new Vector3(...p)),n};});});
 const add=v=>{target.vertices.push(...v.p.toArray());target.normals.push(...v.n.toArray());target.bindings.push({indices:[index],weights:[1]});target.colors.push(color);};
 for(let r=0;r<rings.length-1;r++)for(let c=0;c<sides;c++){const a=rings[r][c],b=rings[r][(c+1)%sides],d=rings[r+1][c],e=rings[r+1][(c+1)%sides];[a,d,b,b,d,e].forEach(add);}
 for(const r of [0,rings.length-1])for(let c=1;c<sides-1;c++){const t=[rings[r][0],rings[r][c],rings[r][c+1]];if(r===0)t.reverse();t.forEach(add);}
}

/** Box-projected atlas. Surface painting samples world coordinates, including between vertices. */
export function unwrap(data,bounds){
 const count=data.vertices.length/3,uv=[],faces=[];
 for(let i=0;i<count;i+=3){const n=[0,0,0];for(let k=0;k<3;k++)for(let v=0;v<3;v++)n[k]+=data.normals[(i+v)*3+k];let axis=0;for(let k=1;k<3;k++)if(Math.abs(n[k])>Math.abs(n[axis]))axis=k;const face=axis*2+(n[axis]>0?0:1),axes=axis===0?[2,1]:axis===1?[0,2]:[0,1];faces.push(face);
  for(let v=0;v<3;v++){const at=data.vertices.slice((i+v)*3,(i+v)*3+3);const u=clamp((at[axes[0]]-bounds[0][axes[0]])/(bounds[1][axes[0]]-bounds[0][axes[0]])),w=clamp((at[axes[1]]-bounds[0][axes[1]])/(bounds[1][axes[1]]-bounds[0][axes[1]]));uv.push((face%3+(4+u*504)/512)/3,(Math.floor(face/3)+(4+w*504)/512)/2);}
 }
 const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(data.vertices,3));geometry.setAttribute('normal',new Float32BufferAttribute(data.normals,3));geometry.setAttribute('uv',new Float32BufferAttribute(uv,2));geometry.setAttribute('skinIndex',new Uint16BufferAttribute(data.bindings.flatMap(b=>[...b.indices,...Array(4-b.indices.length).fill(0)]),4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(data.bindings.flatMap(b=>[...b.weights,...Array(4-b.weights.length).fill(0)]),4));const merged=mergeVertices(geometry,1e-5);geometry.dispose();merged.computeBoundingBox();merged.computeBoundingSphere();return{geometry:merged,uv,faces};
}

export const rgb=hex=>{const n=parseInt(hex.replace('#',''),16);return[n>>16&255,n>>8&255,n&255];};
export function coat(species,p,variant,forced){const [x,y,z]=p,noise=Math.sin(x*523+y*311+z*199)*Math.sin(x*877-y*663+z*317),fine=Math.sin(x*1900+z*600)*Math.sin(y*1400-z*700);let c;
 if(forced)c=rgb(forced);
 else if(species==='zebra'){
  const leg=y<.72,head=y>1.29&&z>.36,neck=y>1.13&&z>.13;
  const rump=clamp((-z-.19)/.29),bodyPhase=mix(z*43+y*4,y*26+Math.abs(x)*17+z*12-32,rump);
  let phase=leg?y*53+z*5:head?x*74+z*21+y*8:neck?y*36-z*17:bodyPhase;
  phase+=variant*.61+.43*Math.sin(y*13+z*8+variant)+.21*Math.sin(z*31-y*10);const stripe=clamp(.5+Math.sin(phase)*9),belly=clamp((.86-y)*10)*clamp((.19-Math.abs(x))*16)*clamp((.42-Math.abs(z+.06))*8);let ink=stripe*(1-.86*belly);if(y<.095||y>1.18&&y<1.37&&z>.754)ink=1;if(Math.abs(x)<.035&&y>1.2&&z<.25)ink=1;c=rgb('#eee9da').map((v,i)=>mix(v,rgb('#282928')[i],ink));
 }else if(species==='giraffe'){
  const px=x*14,py=y*10,pz=z*14;let first=10,second=10,hash=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(let d=-1;d<=1;d++){const ix=Math.floor(px)+a,iy=Math.floor(py)+b,iz=Math.floor(pz)+d;let h=(Math.imul(ix,73856093)^Math.imul(iy,19349663)^Math.imul(iz,83492791)^Math.imul(variant+1,1013))>>>0;h=Math.imul(h^(h>>>16),0x45d9f3b)>>>0;const sx=.15+(h&1023)/1023*.7,sy=.15+((h>>>10)&1023)/1023*.7,sz=.15+((h>>>20)&1023)/1023*.7,n=Math.hypot(px-ix-sx,py-iy-sy,pz-iz-sz);if(n<first){second=first;first=n;hash=sx;}else second=Math.min(second,n);}const patch=clamp((second-first-.065)*24)*(1-clamp((.33-y)*8));c=rgb('#e2c995').map((v,i)=>mix(v,rgb(hash>.5?'#88512b':'#9a6134')[i],patch));if(y<.125)c=rgb('#6d6654');
 }else if(species==='elephant'){
  c=rgb(variant%2?'#85878a':'#94918a');const fold=Math.pow(Math.abs(Math.sin(y*155+Math.sin(z*70)*.45+x*71)),17)*Math.pow(Math.abs(Math.sin(z*95+x*43)),2);c=c.map(v=>v*(1-.075*fold));const pink=clamp((Math.abs(x)-.36)*3)*clamp((y-1.22)*4)*clamp((.94-z)*7);c=c.map((v,i)=>mix(v,rgb('#ad9285')[i],pink*.65));
 }else if(species==='lion'){
  const pale=clamp((.34-y)*10)*clamp((.18-Math.abs(x))*20);c=rgb(variant===0?'#b5915a':variant===1?'#c2a06a':'#b79965').map((v,i)=>mix(v,rgb('#dbccb0')[i],pale*.7));
 }else {const blue=z<.015||y>.74,green=y>.858&&z>.06,cheek=Math.abs(x)>.078&&y>.731&&y<.849&&z>.107;c=rgb(green?'#4f8854':blue?'#197ead':'#efb33e');if(cheek){const line=Math.pow(Math.max(0,Math.cos(y*205+z*35)),18)*clamp((.815-y)*35);c=rgb('#e9e2cf').map((v,i)=>mix(v,rgb('#384442')[i],line));}if(y>.668&&y<.716&&z>.156)c=rgb('#2a3839');}
 return c.map(v=>clamp(Math.round(v+noise*3+fine*1.4),0,255));
}
