import { OrthographicCamera,Vector3 } from 'three';
import { createTropicalDiorama } from '../../src/game/render3d/tropical-diorama.ts';
import { createInitialState } from '../../src/game/core/initial-state.ts';
import { fitIsometricCamera } from '../../src/game/render3d/isometric-camera.ts';
export function projection(root,inspect) {
  const canvas=root.querySelector('canvas');if(!canvas)throw Error('Open native preview first');
  const world=createTropicalDiorama(createInitialState().world),camera=new OrthographicCamera();
  return {canvas,
    point(xyz){const b=canvas.getBoundingClientRect(),s=inspect();fitIsometricCamera(camera,world.bounds,b.width/b.height);camera.position.add(new Vector3(s.cameraPanX,0,s.cameraPanZ));camera.zoom=s.cameraZoom;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);const p=new Vector3(...xyz).project(camera);return {x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};},
    dispose(){world.geometries.forEach(g=>g.dispose());world.materials.forEach(m=>m.dispose());},
  };
}
function pointer(target,type,id,p,pointerType='touch'){target.dispatchEvent(new PointerEvent(type,{pointerId:id,pointerType,button:0,buttons:type==='pointerup'?0:1,clientX:p.x,clientY:p.y,bubbles:true,cancelable:true}));}
export function selectGateForFixture(root,inspect){const ctx=projection(root,inspect);try{const p=ctx.point([-4.5,1.4516,3.82]);pointer(ctx.canvas,'pointerdown',901,p);pointer(ctx.canvas,'pointerup',901,p);}finally{ctx.dispose();}}

/** QA-projected coordinates/injected DOM events; never native or physical touch evidence. */
export function runSelectionDomScenarios(root,inspect,setPaused,setLocale) {
  const ctx=projection(root,inspect),canvas=ctx.canvas,host=root.querySelector('[data-preview-stage]'),panel=root.querySelector('[data-scene-selection]');
  const previousLocale=root.querySelector('[data-renderer-panel]').lang,cases=[];let id=910;
  const check=(ok,message)=>{if(!ok)throw Error(message);};
  const selected=()=>host.dataset.selectedId??null;
  const snap=()=>({selectedId:selected(),panelHidden:panel.hidden,title:root.querySelector('[data-selection-title]').textContent,locale:root.querySelector('[data-renderer-panel]').lang,session:inspect()});
  const reset=()=>root.querySelector('[data-camera-command="reset"]').click();
  const clear=()=>{if(!panel.hidden)root.querySelector('[data-clear-selection]').click();};
  const tap=(xyz,type='touch')=>{const p=ctx.point(xyz),token=id++;pointer(canvas,'pointerdown',token,p,type);pointer(canvas,'pointerup',token,p,type);};
  const key=value=>host.dispatchEvent(new KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true}));
  const run=(name,fn)=>{fn();cases.push({id:name,status:'PASS',...snap()});};
  function dragAndPinch(){const b=canvas.getBoundingClientRect(),p={x:b.left+b.width/2,y:b.top+b.height/2};root.querySelector('[data-camera-command="zoom-in"]').click();const t=id++;pointer(canvas,'pointerdown',t,p);pointer(canvas,'pointermove',t,{x:p.x+30,y:p.y+15});pointer(canvas,'pointerup',t,{x:p.x+30,y:p.y+15});const a=id++,c=id++;pointer(canvas,'pointerdown',a,{x:p.x-30,y:p.y});pointer(canvas,'pointerdown',c,{x:p.x+30,y:p.y});pointer(canvas,'pointermove',a,{x:p.x-45,y:p.y});pointer(canvas,'pointermove',c,{x:p.x+45,y:p.y});pointer(canvas,'pointerup',a,{x:p.x-45,y:p.y});pointer(canvas,'pointerup',c,{x:p.x+45,y:p.y});}
  try {
    reset();clear();
    run('terrain-identities',()=>{tap([-.5,.022,.5]);check(selected()==='tile-5-5'&&!panel.hidden&&inspect().selectionMarkerVisible,'grass pick failed');tap([3.5,.031,-2.5]);check(selected()==='tile-9-2','water pick failed');});
    run('visible-object-identities',()=>{for(const [name,xyz] of [['gate-1',[-4.5,1.4516,3.82]],['palm-6',[-5.03,.9,.432]],['tree-4',[1.7,1.25,4]],['rock-5',[4.2,.12,3.7]],['reeds-4',[4.25,.26,2.39]]]){tap(xyz,'mouse');check(selected()===name,'object pick mismatch: '+name);}});
    run('repeat-tap-idempotence',()=>{tap([-.5,.022,.5]);const revision=inspect().selectionRevision;tap([-.5,.022,.5]);check(inspect().selectionRevision===revision,'duplicate selection emitted');});
    run('drag-pinch-preserve-selection',()=>{const before=selected(),revision=inspect().selectionRevision;dragAndPinch();check(selected()===before&&inspect().selectionRevision===revision,'camera gesture selected beneath');});
    run('empty-space-deselect',()=>{reset();const b=canvas.getBoundingClientRect(),p={x:b.left+3,y:b.top+3},t=id++;pointer(canvas,'pointerdown',t,p);pointer(canvas,'pointerup',t,p);check(!selected()&&panel.hidden&&!inspect().selectionMarkerVisible&&!root.querySelector('[data-selection-title]').textContent,'empty space did not clear');});
    run('camera-without-selection',()=>{dragAndPinch();check(!selected()&&panel.hidden,'gesture created selection');reset();});
    run('panel-isolation-and-dismiss',()=>{tap([-.5,.022,.5]);const before=selected(),p=ctx.point([3.5,.031,-2.5]),t=id++;pointer(panel,'pointerdown',t,p);pointer(panel,'pointerup',t,p);check(selected()===before,'panel event fell through');root.querySelector('[data-camera-command="zoom-in"]').click();check(selected()===before,'toolbar changed selection');root.querySelector('[data-clear-selection]').click();check(!selected()&&panel.hidden&&!inspect().selectionMarkerVisible&&!root.querySelector('[data-selection-title]').textContent,'dismiss failed');reset();});
    run('locale-keeps-identity',()=>{tap([-4.5,1.4516,3.82]);const revision=inspect().selectionRevision;setLocale('en');check(root.querySelector('[data-selection-title]').textContent==='Sanctuary entrance','EN title missing');setLocale('id');check(selected()==='gate-1'&&root.querySelector('[data-selection-title]').textContent==='Gerbang suaka'&&inspect().selectionRevision===revision,'ID selection changed');});
    run('cancel-and-late-release',()=>{const before=selected(),revision=inspect().selectionRevision,p=ctx.point([-.5,.022,.5]),t=id++;pointer(canvas,'pointerdown',t,p);pointer(canvas,'pointercancel',t,p);pointer(canvas,'pointerup',t,p);check(selected()===before&&inspect().selectionRevision===revision,'cancelled pointer picked');});
    run('paused-picks-rejected',()=>{const before=selected(),revision=inspect().selectionRevision;setPaused(true);tap([-.5,.022,.5]);root.querySelector('[data-clear-selection]').click();check(selected()===before&&inspect().selectionRevision===revision,'paused UI mutated selection');setPaused(false);});
    run('keyboard-center-and-escape',()=>{reset();clear();key('Enter');check(Boolean(selected())&&inspect().selectionMarkerVisible,'keyboard center failed');key('Escape');check(!selected()&&panel.hidden,'Escape did not dismiss');});
    run('bounded-marker-reuse',()=>{const before=inspect();for(let i=0;i<40;i++){tap([-.5,.022,.5]);tap([-4.5,1.4516,3.82]);clear();}const after=inspect();check(after.ownedMaterialsLive===before.ownedMaterialsLive&&after.geometries===before.geometries&&after.ownedMaterialsLive===12,'selection grew resource pool');});
    return {status:'PASS',method:'QA-projected coordinates + injected PointerEvent/KeyboardEvent through labelled buttons',physicalTouch:false,cases};
  }catch(error){return {status:'FAIL',method:'injected selection scenarios',physicalTouch:false,cases,error:String(error)};}
  finally{setPaused(false);clear();reset();setLocale(previousLocale);ctx.dispose();}
}
