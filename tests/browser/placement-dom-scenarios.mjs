import {projection} from './selection-dom-scenarios.mjs';
/** Labelled fixture-only DOM event injection; not native/physical touch testing. */
export function runPlacementDomScenarios(root,inspect,setPaused,setLocale){
 const ctx=projection(root,inspect),canvas=ctx.canvas,host=root.querySelector('[data-preview-stage]'),cases=[];let id=1200;
 const button=c=>root.querySelector(`[data-placement-command="${c}"]`),command=c=>button(c).click();
 const check=(v,message)=>{if(!v)throw Error(message);};
 const snap=()=>({anchor:host.dataset.planAnchor,reason:host.dataset.planReason,confirmed:host.dataset.planConfirmed,session:inspect()});
 const pointer=(target,type,token,p)=>target.dispatchEvent(new PointerEvent(type,{pointerId:token,pointerType:'touch',button:0,buttons:type==='pointerup'?0:1,clientX:p.x,clientY:p.y,bubbles:true,cancelable:true}));
 const tap=xyz=>{const p=ctx.point(xyz),token=id++;pointer(canvas,'pointerdown',token,p);pointer(canvas,'pointerup',token,p);};
 const run=(name,fn)=>{fn();check(root.querySelectorAll('canvas').length===1&&!host.hidden,'placement command removed or hid canvas');cases.push({id:name,status:'PASS',...snap()});};
 const cancel=()=>{if(inspect().placementActive)command('cancel');};
 const key=k=>host.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true}));
 const oldLocale=root.querySelector('[data-renderer-panel]').lang;
 try{
  cancel();root.querySelector('[data-camera-command="reset"]').click();
  run('begin-needs-anchor',()=>{command('begin');check(inspect().placementActive&&!inspect().placementGhostVisible&&button('confirm').disabled,'begin fabricated valid ghost');});
  run('touch-valid-grid-ghost',()=>{tap([-.5,.022,.5]);check(host.dataset.planAnchor==='5,5'&&host.dataset.planReason==='ready'&&inspect().placementGhostVisible&&!button('confirm').disabled,'valid tap did not snap');});
  run('touch-water-invalid-never-confirms',()=>{tap([3.5,.031,-2.5]);const n=inspect().placementConfirmations;check(host.dataset.planReason==='creek'&&button('confirm').disabled,'water accepted');command('confirm');check(inspect().placementConfirmations===n&&inspect().placementActive,'invalid confirmed');});
  run('scenery-and-boundary-invalid',()=>{tap([-4.5,1.4516,3.82]);check(['path','scenery'].includes(host.dataset.planReason),'scenery accepted');for(let n=0;n<18;n++)command('left');check(host.dataset.planReason==='outside'&&button('confirm').disabled,'edge accepted');});
  run('cancel-no-plan-created',()=>{command('cancel');check(!inspect().placementActive&&!inspect().placementGhostVisible&&inspect().placementConfirmedCount===0,'cancel created plan');});
  run('confirm-and-repeat-exactly-once',()=>{command('begin');tap([-.5,.022,.5]);const n=inspect().placementConfirmations;command('confirm');command('confirm');check(inspect().placementConfirmations===n+1&&inspect().placementConfirmedCount===1&&!inspect().placementActive&&inspect().placementPlanVisible,'confirm duplicated or lost plan');});
  run('cancel-preserves-previous-plan',()=>{const plan=host.dataset.planConfirmed,n=inspect().placementConfirmations;command('begin');tap([3.5,.031,-2.5]);command('cancel');check(host.dataset.planConfirmed===plan&&inspect().placementConfirmations===n,'cancel altered confirmed plan');});
  run('drag-pinch-cancel-no-accidental-anchor',()=>{command('begin');tap([-.5,.022,.5]);const before=host.dataset.planAnchor,rev=inspect().placementRevision;const b=canvas.getBoundingClientRect(),p={x:b.left+b.width/2,y:b.top+b.height/2},a=id++,c=id++;pointer(canvas,'pointerdown',a,p);pointer(canvas,'pointermove',a,{x:p.x+30,y:p.y+15});pointer(canvas,'pointerup',a,{x:p.x+30,y:p.y+15});pointer(canvas,'pointerdown',a,{x:p.x-30,y:p.y});pointer(canvas,'pointerdown',c,{x:p.x+30,y:p.y});pointer(canvas,'pointermove',a,{x:p.x-45,y:p.y});pointer(canvas,'pointerup',a,p);pointer(canvas,'pointerup',c,p);const t=id++;pointer(canvas,'pointerdown',t,p);pointer(canvas,'pointercancel',t,p);pointer(canvas,'pointerup',t,p);check(host.dataset.planAnchor===before&&inspect().placementRevision===rev,'gesture changed anchor');root.querySelector('[data-camera-command="reset"]').click();});
  run('overlay-does-not-pick-through',()=>{const before=host.dataset.planAnchor,rev=inspect().placementRevision,p=ctx.point([3.5,.031,-2.5]),token=id++;const target=root.querySelector('[data-placement-edit]');pointer(target,'pointerdown',token,p);pointer(target,'pointerup',token,p);check(host.dataset.planAnchor===before&&inspect().placementRevision===rev,'overlay placed beneath');});
  run('locale-validity-and-keyboard-controls',()=>{setLocale('id');check(button('confirm').textContent==='Konfirmasi rencana'&&root.querySelector('[data-placement-reason]').textContent.includes('Tapak valid'),'ID missing');const before=host.dataset.planAnchor;command('left');check(host.dataset.planAnchor!==before,'tile arrow failed');setLocale('en');check(button('cancel').textContent==='Cancel preview','EN missing');key('Enter');check(inspect().placementGhostVisible,'center keyboard anchor failed');key('Escape');check(!inspect().placementActive,'Escape failed');});
  run('paused-actions-rejected',()=>{command('begin');tap([-.5,.022,.5]);const before=snap();setPaused(true);tap([3.5,.031,-2.5]);command('left');command('confirm');command('cancel');check(inspect().placementRevision===before.session.placementRevision,'paused command mutated plan');setPaused(false);command('cancel');});
  run('bounded-preview-pool',()=>{const before=inspect();for(let i=0;i<40;i++){command('begin');tap([-.5,.022,.5]);command('cancel');}check(inspect().ownedMaterialsLive===before.ownedMaterialsLive&&inspect().ownedMaterialsLive===11&&inspect().placementConfirmedCount===1,'pool grew');});
  return {status:'PASS',method:'fixture injected PointerEvent/KeyboardEvent + product buttons',physicalTouch:false,cases};
 }catch(error){return {status:'FAIL',cases,error:String(error),physicalTouch:false};}
 finally{setPaused(false);cancel();root.querySelector('[data-camera-command="reset"]').click();setLocale(oldLocale);ctx.dispose();}
}
