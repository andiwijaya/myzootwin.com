import {BufferGeometry,Color,CylinderGeometry,Float32BufferAttribute,MeshStandardMaterial,Quaternion,SphereGeometry,Vector3} from 'three';
type V=[number,number,number];
export const MACAW_SCALE=.62;
export const MACAW_PARTS=['body','head','jaw','wingLeft','wingRight','foreLeft','foreRight','tail','flatFoot','gripFoot','eyelids'] as const;
export type MacawPart=typeof MACAW_PARTS[number];
const palette={blue:'#1587c3',deep:'#17679e',sky:'#37a3d2',gold:'#f6bf3c',warm:'#dba02e',green:'#41955a',ivory:'#fff2d9',charcoal:'#24333b',feet:'#565b61',iris:'#f4cf6a',shine:'#ffffff'};
type Tone=keyof typeof palette;
/** Original closed, vertex-coloured geometry. No downloaded mesh/texture or study GLB is loaded. */
class Shape{
 p:number[]=[];c:number[]=[];
 triangle(a:V,b:V,c:V,tone:Tone){const cross=new Vector3().subVectors(new Vector3(...b),new Vector3(...a)).cross(new Vector3().subVectors(new Vector3(...c),new Vector3(...a)));if(cross.lengthSq()<1e-14)return;const color=new Color(palette[tone]);for(const v of [a,b,c]){this.p.push(...v);this.c.push(color.r,color.g,color.b);}}
 sphere(center:V,size:V,tone:Tone|((p:V)=>Tone),segments=12,rings=8){const indexed=new SphereGeometry(1,segments,rings),g=indexed.toNonIndexed();indexed.dispose();g.scale(...size);g.translate(...center);const p=g.getAttribute('position');for(let i=0;i<p.count;i+=3){const points=[0,1,2].map(n=>[p.getX(i+n),p.getY(i+n),p.getZ(i+n)]as V);const mid=points.reduce((a,b)=>a.map((v,k)=>v+b[k]/3)as V,[0,0,0]as V);this.triangle(points[0],points[1],points[2],typeof tone==='string'?tone:tone(mid));}g.dispose();}
 tube(a:V,b:V,radius:number,tone:Tone,segments=5){const start=new Vector3(...a),end=new Vector3(...b),axis=end.clone().sub(start);const indexed=new CylinderGeometry(radius,radius,axis.length(),segments,1,false),g=indexed.toNonIndexed();indexed.dispose();g.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),axis.clone().normalize()));g.translate(...start.add(end).multiplyScalar(.5).toArray());const p=g.getAttribute('position');for(let i=0;i<p.count;i+=3)this.triangle([p.getX(i),p.getY(i),p.getZ(i)],[p.getX(i+1),p.getY(i+1),p.getZ(i+1)],[p.getX(i+2),p.getY(i+2),p.getZ(i+2)],tone);g.dispose();}
 feather(base:V,tip:V,width:number,thickness:number,normal:V,top:Tone,bottom:Tone){const a=new Vector3(...base),b=new Vector3(...tip),n=new Vector3(...normal).normalize(),d=b.clone().sub(a),side=new Vector3().crossVectors(d,n).normalize().multiplyScalar(width);const mid=a.clone().lerp(b,.52);let points=[a.clone().addScaledVector(side,-.38),a.clone().addScaledVector(side,.38),mid.clone().addScaledVector(side,.5),b,mid.clone().addScaledVector(side,-.5)];if(points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).dot(n)<0)points=points.reverse();const up=points.map(p=>p.clone().addScaledVector(n,thickness).toArray()as V),down=points.map(p=>p.clone().addScaledVector(n,-thickness).toArray()as V);for(let i=1;i<4;i++){this.triangle(up[0],up[i],up[i+1],top);this.triangle(down[0],down[i+1],down[i],bottom);}for(let i=0;i<5;i++){const j=(i+1)%5;this.triangle(up[i],down[i],down[j],top);this.triangle(up[i],down[j],up[j],top);}}
 geometry(pivot:V=[0,0,0]){const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(this.p,3));g.setAttribute('color',new Float32BufferAttribute(this.c,3));g.translate(-pivot[0],-pivot[1],-pivot[2]);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();return g;}
}
export const MACAW_PIVOTS={body:[0,.16,0],head:[0,.66,.09],jaw:[0,.729,.249],wingLeft:[-.14,.58,.005],wingRight:[.14,.58,.005],tail:[0,.22,-.10]} as const;
export function createMacawAssets(){
 const shapes=Object.fromEntries(MACAW_PARTS.map(p=>[p,new Shape()])) as Record<MacawPart,Shape>;
 const body=shapes.body;
 body.sphere([0,.40,0],[.162,.30,.15],p=>p[2]>-.015?'gold':'blue');
 body.sphere([0,.65,.055],[.112,.13,.112],p=>p[2]>.025?'gold':'blue',12,7);
 const head=shapes.head;
 head.sphere([0,.783,.125],[.134,.137,.137],p=>p[1]>.863&&p[2]>.09?'green':'blue',14,8);
 head.sphere([0,.685,.198],[.085,.048,.036],'charcoal',10,5);
 for(const sign of [-1,1]){
  head.sphere([sign*.124,.788,.176],[.023,.076,.075],'ivory',12,7);
  head.sphere([sign*.148,.822,.208],[.008,.018,.018],'iris',10,6);
  head.sphere([sign*.155,.822,.210],[.004,.010,.010],'charcoal',8,5);
  head.sphere([sign*.158,.827,.215],[.0025,.0035,.0035],'shine',6,4);
  for(let row=0;row<3;row++)head.tube([sign*.146,.778-row*.014,.137],[sign*.148,.770-row*.014,.175],.0023,'charcoal',4);
  shapes.eyelids.sphere([sign*.160,.822,.208],[.006,.020,.021],'ivory',10,6);
  shapes.eyelids.tube([sign*.166,.821,.194],[sign*.166,.819,.223],.0023,'charcoal',4);
 }
 // Five closed cross-sections form a curved hook and rounded upper mandible.
 const sections=[[.209,.797,.060,.056],[.255,.795,.066,.060],[.302,.774,.052,.055],[.329,.733,.029,.038],[.322,.686,.004,.007]];
 const rings=sections.map(([z,y,rx,ry])=>Array.from({length:10},(_,i)=>[rx*Math.cos(i*Math.PI/5),y+ry*Math.sin(i*Math.PI/5),z]as V));
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<10;i++){const k=(i+1)%10;head.triangle(rings[j][i],rings[j+1][k],rings[j+1][i],'charcoal');head.triangle(rings[j][i],rings[j][k],rings[j+1][k],'charcoal');}
 for(let i=0;i<10;i++){const k=(i+1)%10;head.triangle([0,sections[0][1],sections[0][0]],rings[0][k],rings[0][i],'charcoal');head.triangle([0,sections.at(-1)![1],sections.at(-1)![0]],rings.at(-1)![i],rings.at(-1)![k],'charcoal');}
 shapes.jaw.sphere([0,.719,.263],[.043,.026,.056],'charcoal',10,6);
 for(const [sign,upperName,foreName]of [[-1,'wingLeft','foreLeft'],[1,'wingRight','foreRight']]as const){
  const upper=shapes[upperName],fore=shapes[foreName];
  upper.sphere([sign*.10,-.012,-.022],[.14,.029,.094],'blue',10,6);
  fore.sphere([sign*.10,-.005,-.025],[.145,.024,.084],p=>p[1]>-.005?'blue':'gold',10,6);
  for(let i=0;i<4;i++)upper.feather([sign*.015,0,.063-i*.041],[sign*(.25-i*.009),-.004,.02-i*.05],.052,.008,[0,1,0],i===0?'sky':'blue','gold');
  for(let i=0;i<6;i++)fore.feather([0,0,.035-i*.023],[sign*(.32-Math.abs(i-2)*.017),-.013,-.025-i*.016],.044,.007,[0,1,0],i===0||i===5?'deep':i===2?'sky':'blue',i<3?'gold':'warm');
 }
 for(let i=-2;i<=2;i++)shapes.tail.feather([i*.027,0,0],[i*.015,-.60+Math.abs(i)*.035,-.16-Math.abs(i)*.012],.052,.007,[0,0,-1],i===0?'sky':'blue','warm');
 for(const grip of [false,true]){
  const foot=shapes[grip?'gripFoot':'flatFoot'];
  foot.tube([0,.215,-.018],[0,.075,0],.015,'feet',6);foot.tube([0,.075,0],[0,.018,0],.011,'feet',6);
  for(const side of [-1,1])for(const direction of [-1,1]){
   const a:[number,number,number]=[side*.012,.018,0],b:V=[side*.020,grip?-.010:.009,direction*.026],c:V=[side*.023,grip?-.035:.008,direction*(grip?.039:.058)],d:V=[side*.022,grip?-.057:.004,direction*(grip?.026:.071)];
   foot.tube(a,b,.0055,'feet',5);foot.tube(b,c,.0045,'feet',5);foot.tube(c,d,.0035,'charcoal',5);
  }
 }
 const geometries=Object.fromEntries(MACAW_PARTS.map(name=>[name,shapes[name].geometry(['body','head','jaw'].includes(name)?[...MACAW_PIVOTS[name as keyof typeof MACAW_PIVOTS]]as V:name==='eyelids'?[...MACAW_PIVOTS.head]as V:undefined)]))as Record<MacawPart,BufferGeometry>;
 const material=new MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.88,metalness:0});material.name='Original macaw palette';let disposed=false;
 return {geometries,material,dispose(){if(disposed)return;disposed=true;Object.values(geometries).forEach(g=>g.dispose());material.dispose();},inspect:()=>({macawAssetsDisposed:disposed,macawAssetGeometries:disposed?0:MACAW_PARTS.length,macawMaterials:disposed?0:1,macawTextures:0,macawTriangles:MACAW_PARTS.filter(p=>p!=='flatFoot'&&p!=='gripFoot'&&p!=='eyelids').reduce((n,p)=>n+geometries[p].getAttribute('position').count/3,0)+2*geometries.gripFoot.getAttribute('position').count/3+geometries.eyelids.getAttribute('position').count/3})};
}
export type MacawAssets=ReturnType<typeof createMacawAssets>;
