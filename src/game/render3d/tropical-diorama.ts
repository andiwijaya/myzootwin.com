import { Box3, BoxGeometry, BufferGeometry, Color, CircleGeometry, CylinderGeometry, Float32BufferAttribute, Group, IcosahedronGeometry, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Quaternion, Vector3, type Material } from 'three';
import type { FaceOwner, SceneCatalog, SceneIdentityKind } from './scene-selection.ts';
import type { WorldState } from '../core/state.ts';
import {sceneOrigin,sceneToCell,toScene} from '../world/scene-coordinates.ts';

/** Original code-authored scenery. Dressing is not a player structure or a habitat. */
export class Batch {
  positions: number[] = []; normals: number[] = []; colors: number[] = [];
  owner:string|null=null; ranges:FaceOwner[]=[];
  add(source: BufferGeometry, color: string, position: number[], scale = [1, 1, 1], yaw = 0) {
    const geometry = source.index ? source.toNonIndexed() : source.clone();
    const transform = new Matrix4().compose(new Vector3(...position), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw), new Vector3(...scale));
    geometry.applyMatrix4(transform);
    const p = geometry.getAttribute('position'), n = geometry.getAttribute('normal'), c = new Color(color);
    this.ranges.push({first:this.positions.length/9,count:p.count/3,id:this.owner});
    for (let i = 0; i < p.count; i++) {
      this.positions.push(p.getX(i), p.getY(i), p.getZ(i));
      this.normals.push(n.getX(i), n.getY(i), n.getZ(i));
      this.colors.push(c.r, c.g, c.b);
    }
    geometry.dispose(); source.dispose();
  }
  triangle(points: number[][], color: string) {
    const g = new BufferGeometry(); g.setAttribute('position', new Float32BufferAttribute(points.flat(), 3)); g.computeVertexNormals(); this.add(g, color, [0,0,0]);
  }
  geometry() {
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(this.positions, 3));
    g.setAttribute('normal', new Float32BufferAttribute(this.normals, 3));
    g.setAttribute('color', new Float32BufferAttribute(this.colors, 3));
    g.computeBoundingBox(); g.computeBoundingSphere(); return g;
  }
}

export function createTropicalDiorama(world: WorldState) {
  const group = new Group(); group.name = 'Tropical Creek Sanctuary';
  const geometries: BufferGeometry[] = [], materials: Material[] = [];
  const terrain = new Batch(), plants = new Batch(), props = new Batch(), water = new Batch(), sparkle = new Batch(), shadows = new Batch();
  const catalog:SceneCatalog={identities:new Map(),bounds:new Map(),batches:[]};
  const selectable=[terrain,plants,props,water];
  function object(kind:SceneIdentityKind,ordinal:number,x:number,z:number,draw:()=>void) {
    const id=`${kind}-${ordinal}`,before=selectable.map(b=>b.positions.length),old=selectable.map(b=>b.owner);
    selectable.forEach(b=>b.owner=id);draw();selectable.forEach((b,i)=>b.owner=old[i]);
    const bounds=new Box3();
    selectable.forEach((batch,i)=>{for(let v=before[i];v<batch.positions.length;v+=3)bounds.expandByPoint(new Vector3(batch.positions[v],batch.positions[v+1],batch.positions[v+2]));});
    catalog.identities.set(id,{id,category:'object',kind,ordinal,cell:sceneToCell({x,z},world)});catalog.bounds.set(id,bounds);
  }
  const point = (x: number, z: number) => {const p=toScene({x,z},world);return [p.x,p.z];};
  const box = (batch: Batch, color: string, p: number[], s: number[], yaw=0) => batch.add(new BoxGeometry(1,1,1), color,p,s,yaw);
  const rockGeometry = (x: number,z: number,s=.35) => props.add(new IcosahedronGeometry(1,0),'#a3ad91',[x,.12,z],[s,s*.65,s*.8],x);
  const shadow = (x:number,z:number,s:number) => {
    // Two flat translucent fans soften contact without textures, GPU shadows or extra draws.
    for(const [spread,y]of [[1.12,.011],[.78,.013]])shadows.add(new CircleGeometry(1,20).rotateX(-Math.PI/2),'#294f3d',[x,y,z],[s*spread,1,s*.68*spread]);
  };
  const quad=(batch:Batch,color:string,a:number[],b:number[],c:number[],d:number[])=>{batch.triangle([a,b,c],color);batch.triangle([a,c,d],color);};
  function fernClump(x:number,z:number,yaw:number){
    for(let i=0;i<5;i++){
      const a=yaw+i*Math.PI*2/5,dx=Math.cos(a),dz=Math.sin(a),px=-dz*.055,pz=dx*.055;
      const root=[x,.034,z],mid=[x+dx*.18,.27,z+dz*.18],tip=[x+dx*.39,.10,z+dz*.39];
      plants.triangle([root,[mid[0]+px,mid[1]-.04,mid[2]+pz],mid],i%2?'#4b875b':'#65986a');
      plants.triangle([root,mid,[mid[0]-px,mid[1]-.04,mid[2]-pz]],'#76a777');
      plants.triangle([mid,[mid[0]+px,mid[1]-.04,mid[2]+pz],tip],'#4c8a61');
      plants.triangle([mid,tip,[mid[0]-px,mid[1]-.04,mid[2]-pz]],'#71a472');
    }
  }
  // A raised soil slice, with layered faceted edges and a continuous open lawn.
  const origin=sceneOrigin(world),centerX=world.width/2-origin.x,centerZ=world.height/2-origin.z;
  box(terrain,'#94724e',[centerX,-.37,centerZ],[world.width,.68,world.height]);
  box(terrain,'#c5a77b',[centerX,-.08,centerZ],[world.width+.04,.16,world.height+.04]);
  for (const tile of world.tiles) {
    const [x,z] = point(tile.cell.x,tile.cell.z),id=`tile-${tile.cell.x}-${tile.cell.z}`;
    catalog.identities.set(id,{id,category:'tile',kind:tile.path?'path':tile.terrain,ordinal:0,cell:{...tile.cell}});
    catalog.bounds.set(id,new Box3(new Vector3(x-.5,0,z-.5),new Vector3(x+.5,.055,z+.5)));
    selectable.forEach(b=>b.owner=id);
    if (tile.terrain === 'land') {
      const greens = ['#87ac68','#8caf6b','#90b16f','#89ab69'];
      box(terrain,greens[(tile.cell.x*7+tile.cell.z*3)%4],[x,-.018,z],[1,.08,1]);
      if (tile.path&&tile.cell.x===world.gate.x&&tile.cell.z===world.gate.z) box(props,'#edcd91',[x,.04,z],[.94,.06,.94]);
    } else {
      box(terrain,'#cbbd8f',[x,-.025,z],[1,.06,1]);
      // Shared boundary samples make a continuous, gently irregular creek inside its real occupied tiles.
      const z0=z-.5,z1=z+.5,left=(v:number)=>-.39+.035*Math.sin(v*1.3),right=(v:number)=>.39+.035*Math.sin(v*.95+1);
      const l0=x+left(z0),l1=x+left(z1),r0=x+right(z0),r1=x+right(z1),y=.029;
      quad(terrain,'#b9bd85',[x-.5,.021,z0],[x-.5,.021,z1],[l1,.024,z1],[l0,.024,z0]);
      quad(terrain,'#c7c493',[r0,.024,z0],[r1,.024,z1],[x+.5,.021,z1],[x+.5,.021,z0]);
      quad(water,'#79bdae',[l0,y,z0],[l1,y,z1],[l1+.075,y,z1],[l0+.075,y,z0]);
      quad(water,['#399fa8','#3ca4ab','#3aa0a8'][(tile.cell.x+tile.cell.z)%3],[l0+.075,y,z0],[l1+.075,y,z1],[r1-.075,y,z1],[r0-.075,y,z0]);
      quad(water,'#68b6ac',[r0-.075,y,z0],[r1-.075,y,z1],[r1,y,z1],[r0,y,z0]);
      box(sparkle,'#c6ead6',[x-.09,.036,z-.13],[.23,.004,.018],-.14);
      box(sparkle,'#a7e0d2',[x+.13,.036,z+.26],[.12,.004,.014],-.14);
    }
  }
  selectable.forEach(b=>b.owner=null);
  // Trunks and tapered folded fronds make palms readable without textures.
  function palmGeometry(x:number,z:number,height:number,yaw:number) {
    shadow(x+.22,z+.15,.65);fernClump(x,z,yaw);
    for (let i=0;i<5;i++) plants.add(new CylinderGeometry(.085-i*.006,.10-i*.006,height/5,6),'#96734e',[x+i*.035,height*(i+.5)/5,z+i*.016]);
    const cx=x+.17, cy=height, cz=z+.08;
    for(let i=0;i<7;i++) {
      const a=yaw+i*Math.PI*2/7, dx=Math.cos(a),dz=Math.sin(a), px=-dz*.19,pz=dx*.19;
      const root=[cx,cy,cz], mid=[cx+dx*.65,cy+.20,cz+dz*.65], tip=[cx+dx*1.18,cy-.17,cz+dz*1.18];
      plants.triangle([root,[mid[0]+px,mid[1]-.07,mid[2]+pz],mid],i%2?'#478957':'#387650');
      plants.triangle([root,mid,[mid[0]-px,mid[1]-.07,mid[2]-pz]],'#53985d');
      plants.triangle([mid,[mid[0]+px,mid[1]-.07,mid[2]+pz],tip],'#3f8052');
      plants.triangle([mid,tip,[mid[0]-px,mid[1]-.07,mid[2]-pz]],'#589e63');
    }
    plants.add(new IcosahedronGeometry(.16,0),'#c9b366',[cx,cy-.1,cz]);
  }
  function treeGeometry(x:number,z:number,height:number) {
    shadow(x+.2,z+.15,.8);fernClump(x,z,x);
    plants.add(new CylinderGeometry(.10,.16,height*.7,6),'#866847',[x,height*.35,z]);
    for(let i=0;i<3;i++) plants.add(new IcosahedronGeometry(1,0),['#4d875a','#669b60','#7aa969'][i],[x+(i-1)*.36,height-.3+((i+1)%2)*.26,z+(i%2)*.25],[.72,.65,.72],i);
  }
  [[-4.8,-3.8,1.9,.2],[-2.8,-3.9,2.15,1.2],[.7,-3.9,1.8,0],[4.6,-3.4,1.95,.6],[4.8,2.6,1.75,1],[-5.1,.4,1.8,2]].forEach((p,i)=>object('palm',i+1,p[0],p[1],()=>palmGeometry(p[0],p[1],p[2],p[3])));
  [[-4.8,-2.1,1.7],[-.8,-4,1.6],[4.8,.2,1.65],[1.7,3.9,1.5]].forEach((p,i)=>object('tree',i+1,p[0],p[1],()=>treeGeometry(p[0],p[1],p[2])));
  [[2.8,-3.8,.4],[3,-2.5,.25],[4.2,-.5,.32],[2.8,1.4,.3],[4.2,3.7,.45],[-4.7,-3.2,.4],[-1.8,-3.9,.3]].forEach(([x,z,s],i)=>object('rock',i+1,x,z,()=>rockGeometry(x,z,s)));
  [[2.9,-3.3],[4.15,-1.5],[2.85,.3],[4.15,2.3]].forEach(([x,z],n)=>object('reeds',n+1,x,z,()=>{for(let i=0;i<4;i++)plants.add(new CylinderGeometry(.018,.028,.36+i*.05,4),'#67916a',[x+(i%2)*.10,.20+i*.025,z+Math.floor(i/2)*.09]);}));
  // Entrance canopy at the state's real gate; no decorative visitor path is invented.
  const [gx,gz]=point(world.gate.x,world.gate.z);
  object('gate',1,gx,gz,()=>{
  for (const dx of [-.68,.68]) {
    box(props,'#c2aa7d',[gx+dx,.12,gz],[.30,.25,.38]);
    box(props,'#76583d',[gx+dx,.72,gz],[.14,1.10,.16]);
  }
  box(props,'#795c40',[gx,1.25,gz],[1.65,.15,.26]);
  // Pitched terracotta roof, front and back slopes.
  for(const sign of [-1,1]) {
    const a=[gx-.98,1.34,gz+sign*.50], b=[gx+.98,1.34,gz+sign*.50], c=[gx+.98,1.65,gz],d=[gx-.98,1.65,gz];
    props.triangle(sign===1?[a,b,c]:[b,a,d],sign===1?'#d38a5b':'#bd744e');
    props.triangle(sign===1?[a,c,d]:[b,d,c],sign===1?'#d38a5b':'#bd744e');
  }
  box(props,'#f0ddab',[gx,1.02,gz+.18],[.75,.28,.05]);
  plants.add(new IcosahedronGeometry(.11,0),'#4c8558',[gx,1.03,gz+.22],[1,.65,.2],-.4);
  shadow(gx,gz,.9);
  });

  function mesh(batch:Batch,name:string,material:Material) {
    const geometry=batch.geometry(); geometries.push(geometry); materials.push(material);
    const object=new Mesh(geometry,material); object.name=name; object.castShadow=batch===plants||batch===props;object.receiveShadow=selectable.includes(batch)&&batch!==water; group.add(object);if(selectable.includes(batch))catalog.batches.push({mesh:object,ranges:batch.ranges});return object;
  }
  const standard=()=>new MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:0,flatShading:true});
  mesh(terrain,'land and creek banks',standard()); const canopyMaterial=standard();const canopy=mesh(plants,'tropical canopy and reeds',canopyMaterial); mesh(props,'gate and rocks',standard());
  mesh(water,'creek water',new MeshStandardMaterial({vertexColors:true,roughness:.38,metalness:.02}));
  const glints=mesh(sparkle,'water glints',new MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.62,depthWrite:false}));
  const contactShade=mesh(shadows,'soft contact shade',new MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.08,depthWrite:false}));
  group.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(group);
  let visualGameTimeMs=0, waterFlowOffset=0;
  return { group, bounds, geometries, materials, catalog,
    setLowGraphics(low:boolean){glints.visible=!low;contactShade.visible=true;canopy.material=canopyMaterial;},
    update(gameTimeMs:number,reducedMotion:boolean) { visualGameTimeMs=gameTimeMs; waterFlowOffset=reducedMotion?0:Math.sin(gameTimeMs*.0006)*.06; glints.position.z=waterFlowOffset; },
    inspect:()=>({sceneryGlintsVisible:glints.visible,sceneryShadeVisible:contactShade.visible,scenerySimpleLighting:canopy.material===glints.material,sceneryCanopyLit:canopy.material===canopyMaterial,visualGameTimeMs,waterFlowOffset,terrainTiles:world.tiles.length,creekTiles:world.tiles.filter(t=>t.terrain==='creek').length,palmTrees:6,broadleafTrees:4,understoryClumps:10,riverbankSegments:world.tiles.filter(t=>t.terrain==='creek').length,entranceGates:1}),
  };
}
