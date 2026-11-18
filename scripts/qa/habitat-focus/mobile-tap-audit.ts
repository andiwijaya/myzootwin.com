import {Mesh,SkinnedMesh,Raycaster,Vector2,Vector3,type Camera,type Object3D} from 'three';
import type {ZooSave} from '../../../src/game/core/zoo-state.ts';
import {validateSaveV5} from '../../../src/game/persistence/save-v5.ts';
type Context={root:HTMLElement;host:HTMLElement;read:()=>ZooSave;session:()=>Record<string,number|boolean>|undefined;camera:()=>Camera|undefined;scene:()=>Object3D|undefined;errors:string[]};

/** The expected target is the first visible ray hit on the actual posed GLB, independently of the picker. */
export async function runMobileTapAudit({root,host,read,session,camera,scene,errors}:Context){
 const out=document.createElement('pre');out.id='qa-mobile-tap-result';out.dataset.status='RUNNING';document.querySelector('#qa-actions')!.append(out);
 const checks:{name:string;passed:boolean;detail?:unknown}[]=[],cases:unknown[]=[],touchCosts:number[]=[],seen=new Set<string>();
 const delay=(ms=70)=>new Promise<void>(r=>setTimeout(r,ms)),frame=()=>new Promise<void>(r=>requestAnimationFrame(()=>r()));
 const wait=async(p:()=>boolean,label:string)=>{const end=performance.now()+45000;while(!p()){if(performance.now()>end)throw Error('Timeout '+label);await delay();}};
 const check=(name:string,passed:boolean,detail?:unknown)=>{checks.push({name,passed,detail});if(!passed)throw Error(name+' '+JSON.stringify(detail));};
 const button=(s:string)=>root.querySelector<HTMLButtonElement>(s)!;
 const click=(s:string)=>{const b=button(s);if(!b?.checkVisibility()||b.matches(':disabled'))throw Error('Unavailable UI '+s);b.click();};
 const canvas=()=>host.querySelector('canvas')!,rect=()=>canvas().getBoundingClientRect();
 const pointer=(type:string,id:number,x:number,y:number,pointerType='touch')=>canvas().dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,pointerType,button:0,buttons:type==='pointerup'||type==='pointercancel'?0:1,clientX:x,clientY:y,isPrimary:id===201}));
 const tap=(p:{x:number;y:number},pointerType='touch',drift=0)=>{const start=performance.now();pointer('pointerdown',201,p.x,p.y,pointerType);pointer('pointerup',201,p.x+drift,p.y,pointerType);if(pointerType==='touch')touchCosts.push(performance.now()-start);};
 const clear=()=>{if(host.dataset.selectedId){const b=button('[data-clear-selection]');if(!b?.checkVisibility())throw Error('Selection close must be visible');b.click();}};
 const view=()=>({angle:Number(host.dataset.cameraAzimuth),zoom:Number(host.dataset.cameraZoom),x:Number(host.dataset.cameraPanX),z:Number(host.dataset.cameraPanZ)});
 const dump=(status:string,error?:unknown)=>{out.dataset.status=status;out.textContent=JSON.stringify({at:new Date().toISOString(),status,error:error?String(error):undefined,method:'Internal browser only. Synthetic UUID V5 save, original WebGL GLBs/camera/frame driver/UI; injected canvas touch and mouse PointerEvents. Expected IDs come from independent raw raycasts on visible, clipped, posed render triangles. Not a physical-device touch/FPS claim.',viewport:{width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,devicePixelRatio},checks,cases,touchCosts,distinctAnimals:[...seen].sort(),errors,final:{view:view(),selected:host.dataset.selectedId??null,paused:session()?.simulationPaused,valid:validateSaveV5(read()).ok,animals:read().animals.length,habitats:read().world.habitats.length,canvas:host.querySelectorAll('canvas').length}},null,2);};
 const project=(p:Vector3)=>{const r=rect();p.project(camera()!);return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2,z:p.z};};
 const inside=(p:{x:number;y:number;z?:number})=>{const r=rect();return p.x>r.left+1&&p.x<r.right-1&&p.y>Math.max(1,r.top+1)&&p.y<Math.min(innerHeight-1,r.bottom-1)&&(p.z===undefined||Math.abs(p.z)<1);};
 const raycaster=new Raycaster();
 function visibleMeshes(){const meshes:Mesh[]=[];scene()!.traverseVisible(o=>{if(!(o instanceof Mesh))return;for(let p:Object3D|null=o;p;p=p.parent)if(p.name==='Selection indicator')return;meshes.push(o);});return meshes;}
 function rawHit(p:{x:number;y:number}){const r=rect();raycaster.setFromCamera(new Vector2((p.x-r.left)/r.width*2-1,1-(p.y-r.top)/r.height*2),camera()!);return raycaster.intersectObjects(visibleMeshes(),false).find(hit=>{const mesh=hit.object as Mesh,m=Array.isArray(mesh.material)?mesh.material[hit.face?.materialIndex??0]:mesh.material;return m?.visible!==false&&(!m?.clippingPlanes?.length||m.clippingPlanes.every(plane=>plane.distanceToPoint(hit.point)>=-1e-6));});}
 function bodyPoint(mesh:SkinnedMesh){
  const g=mesh.geometry,index=g.index,faces=(index?.count??g.getAttribute('position').count)/3,step=Math.max(1,Math.floor(faces/100));
  for(let face=0;face<faces;face+=step){const p=new Vector3();for(let k=0;k<3;k++)p.add(mesh.getVertexPosition(index?index.getX(face*3+k):face*3+k,new Vector3()));p.multiplyScalar(1/3).applyMatrix4(mesh.matrixWorld);const screen=project(p);if(inside(screen)&&rawHit(screen)?.object===mesh)return screen;}
 }
 function nearMiss(mesh:SkinnedMesh,body:{x:number;y:number}){
  // A screen scan starts on a proven visible surface and steps off its silhouette.
  for(const [dx,dy]of [[1,0],[-1,0],[0,-1],[0,1]]){
   let last=body;
   for(let distance=2;distance<100;distance+=2){const p={x:body.x+dx!*distance,y:body.y+dy!*distance};if(!inside(p))break;const hit=rawHit(p);if(hit?.object===mesh){last=p;continue;}
    const point={x:last.x+dx!*7,y:last.y+dy!*7};if(!inside(point))break;
    const nearby=new Set<string>();for(const [x,y]of [[0,0],[8,0],[-8,0],[0,8],[0,-8],[6,6],[-6,6],[6,-6],[-6,-6]]){const id=rawHit({x:point.x+x!,y:point.y+y!})?.object.name;if(id&&/^(elephant|lion|giraffe|zebra)-/.test(id))nearby.add(id);}
    if(nearby.size===1&&nearby.has(mesh.name)&&rawHit(point)?.object!==mesh)return point;break;
   }
  }
 }
 function rotate(){const b=rect(),x=b.left+b.width*.4,y=b.top+b.height*.5;pointer('pointerdown',201,x,y);pointer('pointermove',201,x+b.width*.19,y);pointer('pointerup',201,x+b.width*.19,y);}
 function pair(factor=1,dx=0,dy=0){const b=rect(),x=b.left+b.width*.5,y=b.top+b.height*.5,r=Math.min(b.width,b.height)*.16;pointer('pointerdown',201,x-r,y);pointer('pointerdown',202,x+r,y);pointer('pointermove',201,x-r*factor+dx,y+dy);pointer('pointermove',202,x+r*factor+dx,y+dy);pointer('pointerup',201,x-r*factor+dx,y+dy);pointer('pointerup',202,x+r*factor+dx,y+dy);}
 try{
  await wait(()=>button('[data-continue]')?.checkVisibility()&&!button('[data-continue]').matches(':disabled'),'Continue ready');click('[data-continue]');await wait(()=>button('[data-save-resume-button]')?.checkVisibility()||!!canvas(),'resume UI');if(button('[data-save-resume-button]')?.checkVisibility())click('[data-save-resume-button]');
  await wait(()=>!!camera()&&session()?.assetsWaiting===false,'models');if(root.dataset.sessionPaused==='true')click('[data-pause-toggle]');await wait(()=>session()?.simulationPaused===false,'playing');await document.fonts.ready;
  for(const kind of ['elephant-grove','lion-savanna','giraffe-plains','zebra-grasslands']){
   click(`[data-zoo-destination="${kind}"]`);click('[data-hud-tab="build"]');await wait(()=>session()?.assetsWaiting===false,'habitat assets');host.scrollIntoView({block:'center',behavior:'instant'});await delay();
   for(const pose of ['fit','rotate','pinch','pan','combined']){
    clear();if(!button('[data-camera-command="reset"]').matches(':disabled'))click('[data-camera-command="reset"]');await frame();
    const taps=session()?.cameraTapCount,command=session()?.commandRevision;
    if(pose==='rotate'||pose==='combined')rotate();
    if(pose==='pinch'||pose==='pan'||pose==='combined'){pair(1.7);await frame();}
    if(pose==='pan'||pose==='combined')pair(1,16,9);
    await frame();check(kind+' '+pose+' gestures cannot select an object',!host.dataset.selectedId&&session()?.cameraTapCount===taps&&session()?.cameraPointers===0);
    const meshes=visibleMeshes().filter((m):m is SkinnedMesh=>m instanceof SkinnedMesh&&new RegExp('^'+kind.split('-')[0]+'-').test(m.name)),selected:unknown[]=[],misses:unknown[]=[];
    let count=0,fuzzy=0;
    for(const mesh of meshes){const body=bodyPoint(mesh);if(!body)continue;clear();const before=session()?.cameraTapCount;tap(body,'touch',3);check(kind+' '+pose+' exact posed animal '+mesh.name,host.dataset.selectedId===mesh.name&&session()?.cameraTapCount===Number(before)+1,{expected:mesh.name,actual:host.dataset.selectedId,body,view:view()});seen.add(mesh.name);selected.push({id:mesh.name,point:body,upDrift:3});count++;
     if(fuzzy===0){const miss=nearMiss(mesh,body);if(miss){clear();tap(miss,'mouse');const oldExact=host.dataset.selectedId??null;
       if(!oldExact||oldExact.startsWith('tile-')||read().world.habitats.some(h=>h.id===oldExact)){clear();tap(miss);check(kind+' '+pose+' near silhouette selects visible animal '+mesh.name,host.dataset.selectedId===mesh.name,{expected:mesh.name,actual:host.dataset.selectedId,oldExact,point:miss});misses.push({id:mesh.name,point:miss,oldExact,method:'independent visible surface scan, seven CSS pixels beyond its final visible sample'});fuzzy++;}
      }}
    }
    check(kind+' '+pose+' has a proven visible animal',count>0,{view:view(),meshes:meshes.map(m=>m.name)});
    const selectedBefore=host.dataset.selectedId,b=rect(),x=b.left+b.width*.45,y=b.top+b.height*.5,counter=session()?.cameraTapCount;
    pointer('pointerdown',201,x,y);pointer('pointermove',201,x+4,y);pointer('pointerup',201,x+4,y);check(kind+' '+pose+' small drag preserves selected animal',host.dataset.selectedId===selectedBefore&&session()?.cameraTapCount===counter);
    pointer('pointerdown',201,x,y);pointer('pointercancel',201,x,y);pointer('pointerup',201,x,y);check(kind+' '+pose+' cancelled tap preserves selection',host.dataset.selectedId===selectedBefore&&session()?.cameraTapCount===counter);
    clear();tap({x:b.left+1,y:b.top+1});check(kind+' '+pose+' empty corner does not snap to a distant animal',!/^(elephant|lion|giraffe|zebra)-/.test(host.dataset.selectedId??''));
    check(kind+' '+pose+' inspection does not mutate the command ledger',session()?.commandRevision===command);
    cases.push({kind,pose,view:view(),selected,misses});dump('RUNNING');
   }
  }
  check('all four selectable resident species have successful near-silhouette taps',['elephant','lion','giraffe','zebra'].every(species=>cases.some(row=>{const c=row as {kind:string;misses:unknown[]};return c.kind.startsWith(species)&&c.misses.length>0;})));
  check('no overflow',document.documentElement.scrollWidth<=innerWidth);check('valid V5, fourteen animals, five habitats',validateSaveV5(read()).ok&&read().animals.length===14&&read().world.habitats.length===5);check('one world canvas',host.querySelectorAll('canvas').length===1);check('no application errors',errors.length===0);
  clear();click('[data-zoo-destination="giraffe-plains"]');await frame();host.scrollIntoView({block:'center',behavior:'instant'});await delay();const target=visibleMeshes().find((m):m is SkinnedMesh=>m instanceof SkinnedMesh&&m.name.startsWith('giraffe-')&&!!bodyPoint(m));if(target)tap(bodyPoint(target)!);if(session()?.simulationPaused===false)click('[data-pause-toggle]');dump('PASS');
 }catch(error){if(session()?.simulationPaused===false&&button('[data-pause-toggle]')?.checkVisibility())click('[data-pause-toggle]');dump('FAIL',error);}
}
