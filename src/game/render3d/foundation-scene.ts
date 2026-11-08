import {zebraAccessView} from '../world/zebra-access.ts';
import {createZebraWorldScene} from './zebra/world-scene.ts';
import {createGiraffeResidentsScene} from './giraffe/residents-scene.ts';
import {createGiraffeWorldScene} from './giraffe/world-scene.ts';
import {createGiraffeCareGhost} from './giraffe/care-ghost.ts';
import {createGiraffeCarePreview} from './giraffe-care-preview.ts';
import type {GiraffeSceneView,GiraffeCommand} from '../../game-entry/giraffe-panel.ts';
import {GIRAFFE_RESOURCE_KINDS} from '../core/giraffe-state.ts';
import type {RemovalQuote} from '../world/editing.ts';
import {createLionResidentsScene} from './lion/residents-scene.ts';
import {createLionWorldScene} from './lion/world-scene.ts';
import {createLionCareGhost} from './lion/care-ghost.ts';
import {createLionCarePreview} from './lion-care-preview.ts';
import {missingConnection} from '../economy/elephant-recovery.ts';
import type {LionSceneView,LionCommand} from '../../game-entry/lion-panel.ts';
import {LION_RESOURCE_KINDS} from '../persistence/save-v3.ts';
import type {ElephantOnboardingView} from '../missions/elephant-onboarding.ts';
import type {ElephantPathReview} from '../economy/elephant-recovery.ts';
import type {ElephantMissionQuote} from '../missions/elephant-missions.ts';
import type {ElephantMissionSceneView} from '../../game-entry/elephant-mission-panel.ts';
import {createElephantCarePreview,type ElephantCareSceneView} from './elephant-care-preview.ts';
import {createElephantCareScene} from './elephant-care-scene.ts';
import type {ElephantCareReason} from '../animals/elephants/care-resources.ts';
import {createElephantResidentsScene} from './elephant-residents-scene.ts';
import {createElephantHabitatScene} from './elephant-habitat-scene.ts';
import type {HabitatKind} from '../core/species.ts';
import type {ElephantCatalogView} from '../economy/elephant-construction.ts';
import {sceneOrigin} from '../world/scene-coordinates.ts';
import {createSanctuaryLighting} from './sanctuary-lighting.ts';
import {visualPolicy} from '../core/visual-settings.ts';
import {createThrivingBanner} from './thriving-banner.ts';
import {createRewardDecoration} from './reward-decoration.ts';
import {createVisitorScene} from './visitor-scene.ts';
import {createPerchScene} from './perch-scene.ts';
import type {PerchReason} from '../animals/resting.ts';
import {createWaterScene} from './water-scene.ts';
import {createFeederScene} from './feeder-scene.ts';
import type {FoodReason} from '../animals/feeding.ts';
import {createAutonomousBirds} from './macaw/autonomous-birds.ts';
import {createMacawStudio} from './macaw/macaw-studio.ts';
import {createPathScene} from './path-scene.ts';
import {releaseLiveContext} from './webgl-cleanup.ts';
import {createHabitatScene} from './habitat-scene.ts';
import type {SanctuarySessionState} from '../core/session-state.ts';
import type {ZooSave} from '../core/zoo-state.ts';
import type {ConservationGrantQuote} from '../economy/conservation-grant.ts';
import { createPlacementPreview } from './placement-preview.ts';
import { createScenePicker } from './scene-picking.ts';
import { BufferGeometry, Group, OrthographicCamera, Scene, SRGBColorSpace, WebGLRenderer, type Material } from 'three';
import { createTropicalDiorama } from './tropical-diorama.ts';
import { mountCameraControls } from './camera-controls.ts';
import { createSimulation } from '../core/simulation.ts';
import { createFrameLoop, type FrameDriver } from './frame-loop';
import { PreviewFailure, type PreviewFailureKind, type PreviewSession } from './preview-controller';

interface FoundationOptions {
  stateStore?:SanctuarySessionState<ZooSave>;
  frames?: FrameDriver;
  createContext?: (canvas: HTMLCanvasElement) => WebGL2RenderingContext | null;
  createRenderer?: (canvas: HTMLCanvasElement, context: WebGL2RenderingContext) => WebGLRenderer;
}

/** Fixed-tick sanctuary with two autonomous macaws, topology-based visits and authoritative economy. Session state integrates with the versioned durable save controller. */
export function mountFoundationScene(host: HTMLElement, onFailure: (kind: PreviewFailureKind) => void, options: FoundationOptions = {}): PreviewSession {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  let context: WebGL2RenderingContext | null = null;
  let renderer: WebGLRenderer | undefined;
  let disposed = false;
  let lost = false;
  let zebraViewKey='';let zebraWorld:ReturnType<typeof createZebraWorldScene>|undefined,zebraBuildFailure:string|null=null;
  let paused = false;
  let giraffeModels:ReturnType<typeof createGiraffeResidentsScene>|undefined,giraffeWorld:ReturnType<typeof createGiraffeWorldScene>|undefined,giraffeGhost:ReturnType<typeof createGiraffeCareGhost>|undefined,giraffePreview:ReturnType<typeof createGiraffeCarePreview>|undefined,giraffeFailure:string|null=null,giraffeViewKey='',giraffePathKey='';
  let giraffeRemoval:RemovalQuote|null=null,giraffePath:ReturnType<typeof missingConnection>=null;const giraffeInput=new AbortController();
  let lionModels:ReturnType<typeof createLionResidentsScene>|undefined,lionWorld:ReturnType<typeof createLionWorldScene>|undefined,lionGhost:ReturnType<typeof createLionCareGhost>|undefined,lionPreview:ReturnType<typeof createLionCarePreview>|undefined,lionFailure:string|null=null,lionViewKey='',lionPathKey='';
  let lionRemoval:RemovalQuote|null=null;
  let lionPath:ReturnType<typeof missingConnection>=null;
  const lionInput=new AbortController();
  let previousElephantRecovery='',elephantRecoveryKey='',previousElephantGuide='',elephantGuideKey='';
  let ehClaimBusy=false,ehClaimFailure:'storage'|'stale'|null=null,previousElephantMissions='';
  let grantBusy=false,grantFailure:'storage'|'stale'|null=null,previousGrant='';
  let cleanupErrors = 0;
  let renderSubmissions = 0;
  let releasedMaterials = 0;
  let observer: ResizeObserver | undefined;
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const scene = new Scene();
  const worldLayer=new Group();scene.add(worldLayer);
  let macaw:ReturnType<typeof createMacawStudio>|undefined;
  let lighting:ReturnType<typeof createSanctuaryLighting>|undefined;
  const camera = new OrthographicCamera();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer:coarse)');
  const visual=()=>visualPolicy(simulation.visualSettings(),motion.matches,window.innerWidth,coarse.matches,window.devicePixelRatio||1);
  const frames = options.frames ?? { request: (fn) => requestAnimationFrame(fn), cancel: (id) => cancelAnimationFrame(id) };
  let diorama: ReturnType<typeof createTropicalDiorama> | undefined;
  let controls: ReturnType<typeof mountCameraControls> | undefined;
  let picker: ReturnType<typeof createScenePicker> | undefined;
  let placement:ReturnType<typeof createPlacementPreview>|undefined;
  let elephantCarePreview:ReturnType<typeof createElephantCarePreview>|undefined,elephantCareScene:ReturnType<typeof createElephantCareScene>|undefined,careDirty=true,careFailure:ElephantCareReason|null=null,careResult:'placed'|'refilled'|null=null,previousCare='';
  let decoration:ReturnType<typeof createRewardDecoration>|undefined;
  let banner:ReturnType<typeof createThrivingBanner>|undefined;
  let habitats:ReturnType<typeof createHabitatScene>|undefined;
  let placementHabitatKind:HabitatKind='macaw-aviary';
  let grove:ReturnType<typeof createElephantHabitatScene>|undefined;
  let elephantModels:ReturnType<typeof createElephantResidentsScene>|undefined;
  let placementCommand=0,foodCommand=0,waterCommand=0,perchCommand=0,editCommand=0;
  let habitatDirty=true,pathDirty=true,birdsDirty=true,foodDirty=true,waterDirty=true,perchDirty=true;
  let feeder:ReturnType<typeof createFeederScene>|undefined,foodPreview=false,foodPreviewHabitat:string|null=null,foodReason:FoodReason=null,previousFoodView='';
  function announceFood(){if(foodReason==='funds'&&simulation.economyView().balance>=(simulation.foodView().exists?simulation.economyView().prices.foodRefill:simulation.economyView().prices.food))foodReason=null;if(foodReason==='busy'&&simulation.foodView().canPlace)foodReason=null;const view={...simulation.foodView(),preview:foodPreview,reason:foodReason},key=JSON.stringify(view);if(key!==previousFoodView){previousFoodView=key;host.dispatchEvent(new CustomEvent('scene-food-change',{detail:view}));}host.dataset.foodStock=String(view.stock);host.dataset.foodExists=String(view.exists);}
  let waterStation:ReturnType<typeof createWaterScene>|undefined,waterPreview=false,waterPreviewHabitat:string|null=null,waterReason:FoodReason=null,previousWaterView='';
  function announceWater(){if(waterReason==='funds'&&simulation.economyView().balance>=(simulation.waterView().exists?simulation.economyView().prices.waterRefill:simulation.economyView().prices.water))waterReason=null;if(waterReason==='busy'&&simulation.waterView().canPlace)waterReason=null;const view={...simulation.waterView(),preview:waterPreview,reason:waterReason},key=JSON.stringify(view);if(key!==previousWaterView){previousWaterView=key;host.dispatchEvent(new CustomEvent('scene-water-change',{detail:view}));}host.dataset.waterStock=String(view.stock);host.dataset.waterExists=String(view.exists);}
  let restKit:ReturnType<typeof createPerchScene>|undefined,perchPreview=false,perchPreviewHabitat:string|null=null,perchReason:PerchReason=null,previousPerchView='';
  function announcePerch(){if(perchReason==='funds'&&simulation.economyView().balance>=(simulation.perchView().exists?simulation.economyView().prices.perch:simulation.economyView().prices.perch))perchReason=null;if(perchReason==='busy'&&simulation.perchView().canPlace)perchReason=null;const view={...simulation.perchView(),preview:perchPreview,reason:perchReason},key=JSON.stringify(view);if(key!==previousPerchView){previousPerchView=key;host.dispatchEvent(new CustomEvent('scene-perch-change',{detail:view}));}host.dataset.perchExists=String(view.exists);}
  let birds:ReturnType<typeof createAutonomousBirds>|undefined;
  let previousBirdView='';
  function announceBirds(){const view=simulation.birdsView(),key=JSON.stringify(view);if(key!==previousBirdView){previousBirdView=key;host.dispatchEvent(new CustomEvent('scene-birds-change',{detail:view}));}host.dataset.placedBirds=String(view.placed);}
  let visitors:ReturnType<typeof createVisitorScene>|undefined;let previousVisitors='';let previousEconomy='';let guideRead:import('../missions/onboarding.ts').FirstMissionGuide|undefined,guideReadKey='';let previousGuide='';let previousMission='';let previousRecovery='';let recoveryReadKey='';let recoveryRead:import('../economy/recovery.ts').RecoveryView|undefined;let visitorsDirty=true;
  function announceVisitors(){const view=simulation.visitorView(),key=JSON.stringify(view);if(key!==previousVisitors){previousVisitors=key;host.dispatchEvent(new CustomEvent('scene-visitors-change',{detail:view}));}host.dataset.visitorCount=String(view.active);host.dataset.visitorWalking=String(view.walking);host.dataset.visitorViewing=String(view.viewing);host.dataset.visitorViewed=String(view.viewedTotal);}
  let paths:ReturnType<typeof createPathScene>|undefined;
  const simulation = createSimulation(options.stateStore?.read(),options.stateStore?.readEditor());
  function announceZebraAccess(){const frame=simulation.inspect(),key=[frame.commandRevision,frame.editorRevision,frame.currency,paused,grantBusy,simulation.localeView()].join(':');if(key===zebraViewKey)return;zebraViewKey=key;host.dispatchEvent(new CustomEvent('scene-zebra-access-change',{detail:{...zebraAccessView(simulation.snapshot()),locale:simulation.localeView(),paused:paused||lost||grantBusy}}));}
  function announceGiraffe(){
    const frame=simulation.inspect(),key=[frame.tick,frame.commandRevision,giraffePreview?.view().revision,giraffeFailure,grantBusy,options.stateStore?.canCommit?.(),paused,simulation.localeView()].join(':');if(key===giraffeViewKey)return;giraffeViewKey=key;const habitat=simulation.giraffeHabitatView(),pathKey=[frame.commandRevision,frame.editorRevision].join(':');
    if(pathKey!==giraffePathKey){giraffePathKey=pathKey;const w=simulation.worldSnapshot(),h=w.habitats.find(h=>'kind'in h&&h.kind==='giraffe-plains');giraffePath=h&&!h.viewingCell?missingConnection(simulation.snapshot(),h.id):null;}
    const view:GiraffeSceneView={grant:simulation.giraffeGrantView(),habitat,residents:simulation.giraffeResidentsView(),care:simulation.giraffeCareView(),missions:simulation.giraffeMissionView(),preview:giraffePreview?.view()??null,busy:grantBusy,savingAvailable:options.stateStore?.canCommit?.()===true,paused:paused||lost,locale:simulation.localeView(),failure:giraffeFailure,entranceOpen:simulation.visitorView().open,canUndo:frame.canUndo,undoCost:frame.undoCost,connected:Boolean(simulation.worldSnapshot().habitats.find(h=>'kind'in h&&h.kind==='giraffe-plains')?.viewingCell),path:giraffePath};host.dispatchEvent(new CustomEvent('scene-giraffe-change',{detail:view}));host.dataset.giraffeResidents=String(view.residents.count);host.dataset.giraffeMeals=String(view.care.residents.reduce((n,a)=>n+a.foodEaten,0));host.dataset.giraffeBrowses=String(view.care.residents.reduce((n,a)=>n+a.highBrowses,0));
  }
  async function onGiraffeCommand(event:Event){
    if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;const q=(event as CustomEvent<GiraffeCommand>).detail;if(!q||typeof q.action!=='string')return;giraffeFailure=null;
    if(['grant','mission','habitat','path','resource-plan','focus'].includes(q.action)){lionPreview?.cancel();elephantCarePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;}
    if(q.action==='grant'||q.action==='mission'){
      const quote={command:q.command??-1},missionQuote={...quote,id:q.id as import('../core/giraffe-state.ts').GiraffeMissionId},prepared=q.action==='grant'?simulation.prepareGiraffeGrant(quote):simulation.prepareGiraffeMission(missionQuote);
      if(!prepared.ok){giraffeFailure=prepared.reason;announceGiraffe();return;}if(!options.stateStore?.commitCandidate||options.stateStore.canCommit?.()!==true){giraffeFailure='storage';announceGiraffe();return;}
      placement?.command('cancel');elephantCarePreview?.cancel();giraffePreview?.cancel();grantBusy=true;updateRunning();announceGiraffe();
      try{const committed=await options.stateStore.commitCandidate(prepared.state,{tick:prepared.state.tick,command:quote.command});if(disposed)return;if(!committed||!(q.action==='grant'?simulation.acceptCommittedGiraffeGrant(committed,quote):simulation.acceptCommittedGiraffeMission(committed,missionQuote)))giraffeFailure='storage';else saveSession();}catch{giraffeFailure='storage';}finally{grantBusy=false;if(!disposed){updateRunning();announceEdit();render();}}return;
    }
    if(q.action==='focus'){
      const world=simulation.worldSnapshot(),origin=sceneOrigin(world),target=q.target??'giraffe';if(target==='all')controls?.command('reset');else{const kind=target==='giraffe'?'giraffe-plains':target==='elephant'?'elephant-grove':target==='lion'?'lion-savanna':'macaw-aviary',home=world.habitats.find(h=>'kind'in h&&h.kind===kind),anchor=target==='giraffe'?simulation.giraffeHabitatView().anchor:target==='elephant'?{x:3,z:11}:target==='lion'?{x:3,z:18}:{x:3,z:4},x=home?Math.min(...home.cells.map(c=>c.x)):anchor.x,z=home?Math.min(...home.cells.map(c=>c.z)):anchor.z,size=target==='macaw'?2:target==='elephant'?6:7;controls?.focusArea({x:x-origin.x,z:z-origin.z,width:size,depth:size});}
    }
    else if(q.action==='habitat'){if(!simulation.giraffeHabitatView().canBuild)return;placement?.command('cancel');lionPreview?.cancel();elephantCarePreview?.cancel();giraffePreview?.cancel();placementHabitatKind='giraffe-plains';placementCommand=simulation.commandRevision();const anchor=simulation.giraffeHabitatView().anchor;placement?.guide('habitat',anchor);const origin=sceneOrigin(simulation.worldSnapshot());controls?.focusArea({x:anchor.x-origin.x,z:anchor.z-origin.z,width:7,depth:7});}
    else if(q.action==='guests'){simulation.visitors(true);saveSession();}
    else if(q.action==='welcome'){const result=simulation.welcomeGiraffes(q.command??-1);if(!result.ok)giraffeFailure=result.reason;else saveSession();}
    else if(q.action==='resource-plan'&&q.kind&&GIRAFFE_RESOURCE_KINDS.includes(q.kind)){placement?.command('cancel');elephantCarePreview?.cancel();giraffePreview?.cancel();giraffePreview?.begin(q.kind);}
    else if(q.action==='resource-cancel')giraffePreview?.cancel();
    else if(q.action==='resource-confirm')giraffePreview?.command('confirm',q.revision);
    else if(q.action==='resource-move'&&['left','right','up','down'].includes(q.direction??''))giraffePreview?.command(q.direction as 'left'|'right'|'up'|'down');
    else if(q.action==='refill'&&q.id){const result=simulation.refillGiraffeCare({command:q.command??-1,id:q.id,revision:q.revision??-1});if(!result.ok)giraffeFailure=result.reason;else saveSession();}
    else if(q.action==='remove'&&q.id){const quote=simulation.quoteRemoval({kind:'giraffe-resource',id:q.id});if(!quote.ok)giraffeFailure=quote.reason;else{giraffeRemoval=quote.quote;host.dispatchEvent(new CustomEvent('scene-giraffe-remove-review',{detail:quote.quote}));}}
    else if(q.action==='remove-cancel')giraffeRemoval=null;
    else if(q.action==='undo'){const result=simulation.undo(`edit-${crypto.randomUUID().replaceAll('-','')}`,q.command??-1);if(!result.ok)giraffeFailure=result.reason;else saveSession();}
    else if(q.action==='remove-confirm'&&q.id){if(!giraffeRemoval||giraffeRemoval.target.kind!=='giraffe-resource'||giraffeRemoval.target.id!==q.id||giraffeRemoval.command!==q.command||giraffeRemoval.revision!==q.revision)giraffeFailure='stale';else{const result=simulation.remove(giraffeRemoval,`edit-${crypto.randomUUID().replaceAll('-','')}`);if(!result.ok)giraffeFailure=result.reason;else saveSession();giraffeRemoval=null;}}
    else if(q.action==='path'&&giraffePath){placement?.command('cancel');giraffePreview?.cancel();elephantCarePreview?.cancel();giraffePreview?.cancel();placementCommand=simulation.commandRevision();placementHabitatKind='macaw-aviary';placement?.guide('path',giraffePath.cell);const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:giraffePath.cell.x+.5-origin.x,z:giraffePath.cell.z+.5-origin.z});}
    announceEdit(null,!giraffeFailure?(q.action==='remove-confirm'?'removed':q.action==='undo'?'restored':null):null);render();
  }
  host.addEventListener('scene-giraffe-command',onGiraffeCommand,{signal:giraffeInput.signal});
  function announceLion(){
    const frame=simulation.inspect(),key=[frame.tick,frame.commandRevision,lionPreview?.view().revision,lionFailure,grantBusy,options.stateStore?.canCommit?.(),paused,simulation.localeView()].join(':');if(key===lionViewKey)return;lionViewKey=key;const habitat=simulation.lionHabitatView(),pathKey=[frame.commandRevision,frame.editorRevision].join(':');
    if(pathKey!==lionPathKey){lionPathKey=pathKey;const w=simulation.worldSnapshot(),h=w.habitats.find(h=>'kind'in h&&h.kind==='lion-savanna');lionPath=h&&!h.viewingCell?missingConnection(simulation.snapshot(),h.id):null;}
    const view:LionSceneView={grant:simulation.lionGrantView(),habitat,residents:simulation.lionResidentsView(),care:simulation.lionCareView(),missions:simulation.lionMissionView(),preview:lionPreview?.view()??null,busy:grantBusy,savingAvailable:options.stateStore?.canCommit?.()===true,paused:paused||lost,locale:simulation.localeView(),failure:lionFailure,path:lionPath};host.dispatchEvent(new CustomEvent('scene-lion-change',{detail:view}));host.dataset.lionResidents=String(view.residents.count);host.dataset.lionMeals=String(view.care.residents.reduce((n,a)=>n+a.foodEaten,0));host.dataset.lionRoars=String(view.care.residents.reduce((n,a)=>n+a.roars,0));
  }
  async function onLionCommand(event:Event){
    if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;const q=(event as CustomEvent<LionCommand>).detail;if(!q||typeof q.action!=='string')return;lionFailure=null;
    if(q.action==='grant'||q.action==='mission'){
      const quote={command:q.command??-1},missionQuote={...quote,id:q.id as import('../core/zoo-state.ts').LionMissionId},prepared=q.action==='grant'?simulation.prepareLionGrant(quote):simulation.prepareLionMission(missionQuote);
      if(!prepared.ok){lionFailure=prepared.reason;announceLion();return;}if(!options.stateStore?.commitCandidate||options.stateStore.canCommit?.()!==true){lionFailure='storage';announceLion();return;}
      placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();grantBusy=true;updateRunning();announceLion();
      try{const committed=await options.stateStore.commitCandidate(prepared.state,{tick:prepared.state.tick,command:quote.command});if(disposed)return;if(!committed||!(q.action==='grant'?simulation.acceptCommittedLionGrant(committed,quote):simulation.acceptCommittedLionMission(committed,missionQuote)))lionFailure='storage';else saveSession();}catch{lionFailure='storage';}finally{grantBusy=false;if(!disposed){updateRunning();announceEdit();render();}}return;
    }
    if(q.action==='focus'){const world=simulation.worldSnapshot(),origin=sceneOrigin(world),home=world.habitats.find(h=>'kind'in h&&h.kind==='lion-savanna'),x=home?Math.min(...home.cells.map(c=>c.x)):3,z=home?Math.min(...home.cells.map(c=>c.z)):18;controls?.focusArea({x:x-origin.x,z:z-origin.z,width:7,depth:7});}
    else if(q.action==='habitat'){if(!simulation.lionHabitatView().canBuild)return;placement?.command('cancel');lionPreview?.cancel();giraffePreview?.cancel();elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();placementHabitatKind='lion-savanna';placementCommand=simulation.commandRevision();placement?.guide('habitat',{x:3,z:18});const origin=sceneOrigin(simulation.worldSnapshot());controls?.focusArea({x:3-origin.x,z:18-origin.z,width:7,depth:7});}
    else if(q.action==='welcome'){const result=simulation.welcomeLions(q.command??-1);if(!result.ok)lionFailure=result.reason;else saveSession();}
    else if(q.action==='resource-plan'&&q.kind&&LION_RESOURCE_KINDS.includes(q.kind)){placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();lionPreview?.begin(q.kind);}
    else if(q.action==='resource-cancel'){lionPreview?.cancel();giraffePreview?.cancel();}
    else if(q.action==='resource-confirm')lionPreview?.command('confirm',q.revision);
    else if(q.action==='resource-move'&&['left','right','up','down'].includes(q.direction??''))lionPreview?.command(q.direction as 'left'|'right'|'up'|'down');
    else if(q.action==='refill'&&q.id){const result=simulation.refillLionCare({command:q.command??-1,id:q.id,revision:q.revision??-1});if(!result.ok)lionFailure=result.reason;else saveSession();}
    else if(q.action==='remove'&&q.id){const quote=simulation.quoteRemoval({kind:'lion-resource',id:q.id});if(!quote.ok)lionFailure=quote.reason;else{lionRemoval=quote.quote;host.dispatchEvent(new CustomEvent('scene-lion-remove-review',{detail:quote.quote}));}}
    else if(q.action==='remove-cancel')lionRemoval=null;
    else if(q.action==='remove-confirm'&&q.id){if(!lionRemoval||lionRemoval.target.kind!=='lion-resource'||lionRemoval.target.id!==q.id||lionRemoval.command!==q.command||lionRemoval.revision!==q.revision)lionFailure='stale';else{const result=simulation.remove(lionRemoval,`edit-${crypto.randomUUID().replaceAll('-','')}`);if(!result.ok)lionFailure=result.reason;else saveSession();lionRemoval=null;}}
    else if(q.action==='path'&&lionPath){placement?.command('cancel');lionPreview?.cancel();giraffePreview?.cancel();elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();placementCommand=simulation.commandRevision();placementHabitatKind='macaw-aviary';placement?.guide('path',lionPath.cell);const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:lionPath.cell.x+.5-origin.x,z:lionPath.cell.z+.5-origin.z});}
    announceEdit(null,q.action==='remove-confirm'&&!lionFailure?'removed':null);render();
  }
  host.addEventListener('scene-lion-command',onLionCommand,{signal:lionInput.signal});
  function announceElephantCare(){const data=simulation.elephantCareView(),view:ElephantCareSceneView={...data,preview:elephantCarePreview?.view()??{active:false,kind:'elephant-browse',cell:null,revision:0,command:data.command,reason:'ready',price:data.browsePrice},failure:careFailure,result:careResult},key=JSON.stringify(view);if(key!==previousCare){previousCare=key;host.dispatchEvent(new CustomEvent('scene-elephant-care-change',{detail:view}));}host.dataset.elephantMeals=String(data.residents.reduce((n,a)=>n+a.foodEaten,0));host.dataset.elephantDrinks=String(data.residents.reduce((n,a)=>n+a.waterDrunk,0));}
  function announceGrant(){const view:ElephantCatalogView={...simulation.conservationGrantView(),habitat:simulation.elephantHabitatView(),residents:simulation.elephantResidentsView(),busy:grantBusy&&!ehClaimBusy,savingAvailable:options.stateStore?.canCommit?.()===true,failure:grantFailure},key=JSON.stringify(view);if(key!==previousGrant){previousGrant=key;host.dispatchEvent(new CustomEvent('scene-elephant-grove-change',{detail:view}));}host.dataset.elephantGrantClaimed=String(view.claimed);host.dataset.placedElephants=String(view.residents.residents.length);}
  async function claimGrant(quote:ConservationGrantQuote){
    if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
    grantFailure=null;const prepared=simulation.prepareConservationGrant(quote);
    if(!prepared.ok){grantFailure='stale';announceGrant();return;}
    if(options.stateStore?.canCommit?.()!==true||!options.stateStore.commitCandidate){grantFailure='storage';announceGrant();return;}
    // A committed grant advances the command quote. Drop unpaid previews before that transition.
    placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
    const expected={tick:prepared.state.tick,command:quote.command};grantBusy=true;updateRunning();announceGrant();render();
    try{const committed=await options.stateStore.commitCandidate(prepared.state,expected);if(disposed)return;if(!committed||!simulation.acceptCommittedGrant(committed,quote))grantFailure='storage';else saveSession();}
    catch{grantFailure='storage';}
    finally{grantBusy=false;if(!disposed){updateRunning();announceGrant();render();}}
  }
  function announceElephantMissions(){const view:ElephantMissionSceneView={...simulation.elephantMissionView(),busy:ehClaimBusy,savingAvailable:options.stateStore?.canCommit?.()===true,failure:ehClaimFailure},key=JSON.stringify(view);if(key!==previousElephantMissions){previousElephantMissions=key;host.dispatchEvent(new CustomEvent('scene-elephant-missions-change',{detail:view}));}}
  function announceElephantGuide(frame=simulation.inspect()){const key=[frame.tick,frame.commandRevision,frame.editorRevision].join(':');if(key===elephantGuideKey)return;elephantGuideKey=key;const view:ElephantOnboardingView=simulation.elephantOnboardingView(),next=JSON.stringify(view);if(next!==previousElephantGuide){previousElephantGuide=next;host.dispatchEvent(new CustomEvent('scene-elephant-guide-change',{detail:view}));}}
  function announceElephantRecovery(frame=simulation.inspect()){const key=[frame.tick,frame.commandRevision,frame.editorRevision].join(':');if(key===elephantRecoveryKey)return;elephantRecoveryKey=key;const view=simulation.elephantRecoveryView(),next=JSON.stringify(view);if(next!==previousElephantRecovery){previousElephantRecovery=next;host.dispatchEvent(new CustomEvent('scene-elephant-recovery-change',{detail:view}));}}
  async function claimElephantMission(quote:ElephantMissionQuote){
    if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
    ehClaimFailure=null;const prepared=simulation.prepareElephantMission(quote);if(!prepared.ok){ehClaimFailure='stale';announceElephantMissions();return;}
    if(options.stateStore?.canCommit?.()!==true||!options.stateStore.commitCandidate){ehClaimFailure='storage';announceElephantMissions();return;}
    placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
    const expected={tick:prepared.state.tick,command:quote.command};ehClaimBusy=true;grantBusy=true;updateRunning();render();
    try{const committed=await options.stateStore.commitCandidate(prepared.state,expected);if(disposed)return;if(!committed||!simulation.acceptCommittedElephantMission(committed,quote))ehClaimFailure='storage';else saveSession();}catch{ehClaimFailure='storage';}
    finally{grantBusy=false;ehClaimBusy=false;if(!disposed){updateRunning();render();}}
  }
function announceHabitat(){announceEdit();const access=simulation.access();host.dataset.worldPathCount=String(access.pathTiles);host.dataset.worldConnected=String(access.connected);host.dataset.worldRouteCells=String(access.routeCells);host.dispatchEvent(new CustomEvent('scene-access-change',{detail:simulation.macawAccess()}));const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:simulation.macawWorldSnapshot().habitats.length,occupiedTiles:simulation.macawWorldSnapshot().habitats.reduce((n,h)=>n+h.cells.length,0)}}));}
  async function commitZebraHabitat(anchor:import('../core/state.ts').Point,operationId:string){
    if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return false;
    const command=placementCommand,prepared=simulation.prepareZebraHabitat(anchor,operationId,command);zebraBuildFailure=null;
    if(!prepared.ok){zebraBuildFailure=prepared.reason;return false;}
    if(!options.stateStore?.commitCandidate||options.stateStore.canCommit?.()!==true){zebraBuildFailure='storage';return false;}
    grantBusy=true;updateRunning();
    try{const committed=await options.stateStore.commitCandidate(prepared.state,{tick:prepared.state.tick,command});if(disposed)return false;if(!committed||!simulation.acceptCommittedZebraHabitat(committed,anchor,operationId,command)){zebraBuildFailure='storage';return false;}placementCommand=simulation.commandRevision();saveSession();announceHabitat();return true;}
    catch{zebraBuildFailure='storage';return false;}
    finally{grantBusy=false;if(!disposed){updateRunning();render();}}
  }
  function saveSession(){options.stateStore?.write(simulation.snapshot());options.stateStore?.writeEditor(simulation.editorSnapshot());}
  function announceEdit(reason:import('../world/editing.ts').EditReason|null=null,result:'removed'|'restored'|null=null){editCommand=simulation.commandRevision();host.dispatchEvent(new CustomEvent('scene-edit-change',{detail:{canUndo:simulation.inspect().canUndo,undoCost:simulation.inspect().undoCost,reason,result}}));}
  const simulationStartTick=simulation.inspect().tick;
  let simulationTimeMs = simulation.inspect().gameTimeMs;
  let simulationEvents = 0;
  const unsubscribe = simulation.subscribe(event => {
    simulationTimeMs = event.gameTimeMs;
    if (event.type === 'tick') simulationEvents++;
    options.stateStore?.checkpoint?.(()=>simulation.snapshot(),!['tick','animal-fed','animal-drank','visitor-viewed'].includes(event.type));
    if(event.type==='visitor-admitted'||event.type==='economy-changed'||event.type==='recovery-changed'||event.type==='mission-claimed'||event.type==='speed-changed'||event.type==='preferences-changed')saveSession();
    birdsDirty=true;foodDirty=true;waterDirty=true;perchDirty=true;visitorsDirty=true;careDirty=true;
    if(event.type==='habitat-built'||event.type==='elephants-welcomed'||event.type==='giraffes-welcomed'){habitatDirty=true;pathDirty=true;}
    if(event.type==='mission-claimed'||event.type==='eh-mission-claimed'||event.type==='lion-mission-claimed'||event.type==='giraffe-mission-claimed')habitatDirty=true;
    if(event.type==='path-built')pathDirty=true;
    if(event.type==='elephant-care-changed'||event.type==='giraffe-care-changed')lighting?.invalidate();
    if(event.type==='world-edited'||event.type==='recovery-changed'){habitatDirty=true;pathDirty=true;}
  });

  function notifyContextLoss() {
    if (disposed || lost) return;
    lost = true;
    simulation.setPaused(true);
    loop.stop();
    onFailure('context-lost');
  }
  function readGuide(s=simulation.inspect()){const key=[s.commandRevision,s.currency,s.editorRevision].join(':');if(key!==guideReadKey||!guideRead){guideReadKey=key;guideRead=simulation.onboardingView();}return guideRead;}
  let previousSpeed='';
  function announceSpeed(force=false,s=simulation.inspect()){const value={speed:s.speed,paused:s.paused},key=JSON.stringify(value);if(force||key!==previousSpeed){previousSpeed=key;host.dataset.simulationRate=String(s.speed);host.dispatchEvent(new CustomEvent('scene-speed-change',{detail:value}));}}
  function render() {
    if (disposed || lost) return;
    const frame=simulation.inspect();
    const policy=visual();lighting?.setLowGraphics(policy.low);diorama?.setLowGraphics(policy.low);visitors?.setVisibleCap(policy.low?1:3);
    announceSpeed(false,frame);announceLion();announceGiraffe();announceGrant();announceElephantCare();announceElephantMissions();announceElephantRecovery(frame);announceElephantGuide(frame);
    const guide=readGuide(frame),guideKey=JSON.stringify(guide);if(guideKey!==previousGuide){previousGuide=guideKey;host.dispatchEvent(new CustomEvent('scene-onboarding-change',{detail:guide}));}
    const missions=simulation.missionView(),missionKey=JSON.stringify(missions);if(missionKey!==previousMission){previousMission=missionKey;host.dispatchEvent(new CustomEvent('scene-missions-change',{detail:missions}));}
    const recoveryKey=[frame.tick,frame.commandRevision,frame.editorRevision,simulation.visitorView().open].join(':');if(recoveryKey!==recoveryReadKey){recoveryReadKey=recoveryKey;recoveryRead=simulation.recoveryView();}const nextRecovery=JSON.stringify(recoveryRead);if(nextRecovery!==previousRecovery){previousRecovery=nextRecovery;host.dispatchEvent(new CustomEvent('scene-recovery-change',{detail:recoveryRead}));}
    announceZebraAccess();
    const money=simulation.economyView(),moneyKey=JSON.stringify(money);if(moneyKey!==previousEconomy){previousEconomy=moneyKey;placement?.refresh();host.dispatchEvent(new CustomEvent('scene-economy-change',{detail:money}));}
    if (disposed || lost) return;
    if (context?.isContextLost()) { notifyContextLoss(); return; }
    const world=habitatDirty||pathDirty||foodDirty||waterDirty||perchDirty?simulation.worldSnapshot():undefined;
    const macawWorld=habitatDirty||foodDirty||waterDirty||perchDirty?simulation.macawWorldSnapshot():undefined;
    if(habitatDirty&&habitats){habitats.sync(macawWorld!);grove?.sync(world!);lionWorld?.sync(world!,simulation.lionMissionView().awards.includes('savanna-wildflowers'));giraffeWorld?.sync(world!,simulation.giraffeMissionView().awards);zebraWorld?.sync(world!);lighting?.invalidate();decoration?.sync(macawWorld!,simulation.missionView().care.unlocked);banner?.sync(macawWorld!,simulation.missionView().thriving.unlocked);habitatDirty=false;}
    if(pathDirty&&paths){paths.sync(world!);zebraWorld?.sync(world!);picker?.refresh();pathDirty=false;}
    if(birdsDirty&&birds){const s=simulation.birdSnapshot();birds.sync(s.animals,s.habitats,s.width,s.height,simulationTimeMs);const g=simulation.giraffeSnapshot();giraffeModels?.sync(g.animals,g.width,g.height,policy.low);if(g.animals.some(a=>a.currentBehavior!=='idle'))lighting?.invalidate();const lions=simulation.lionCareView().residents;lionModels?.sync(lions,s.width,s.height);const e=simulation.elephantSnapshot();elephantModels?.sync(e.animals,e.width,e.height,simulation.elephantCareSnapshot().resources);if(picker?.selection()?.kind==='giraffe')picker.refresh();if(picker?.selection()?.kind==='lion')picker.refresh();if(picker?.selection()?.kind==='elephant')picker.refresh();if(e.animals.length&&(!policy.reducedMotion||e.animals.some(a=>['seek-food','seek-water','wander','eat','drink','seek-bath','bathe','spray','seek-shade','rest','seek-log','enrich','approach-companion','trunk-touch'].includes(a.currentBehavior))))lighting?.invalidate();birdsDirty=false;announceBirds();}
    if(foodDirty){feeder?.sync(macawWorld!,foodPreview,simulation.foodView().canPlace);announceFood();foodDirty=false;}
    if(waterDirty){waterStation?.sync(macawWorld!,waterPreview,simulation.waterView().canPlace);announceWater();waterDirty=false;}
    if(perchDirty){const view=simulation.perchView();restKit?.sync(macawWorld!,perchPreview,view.canPlace);birds?.setPerchesVisible(!view.reachable&&!perchPreview);announcePerch();perchDirty=false;}
    if(careDirty&&elephantCareScene){const care=simulation.elephantCareSnapshot();if(elephantCareScene.sync(care.resources,care.width,care.height,elephantCarePreview?.view()??null,simulation.elephantMissionView().awards.includes('elephant-water-lilies')))picker?.refresh();lionWorld?.sync(simulation.worldSnapshot(),simulation.lionMissionView().awards.includes('savanna-wildflowers'));giraffeWorld?.sync(simulation.worldSnapshot(),simulation.giraffeMissionView().awards);if(picker?.selection()?.kind==='giraffe-facility'||picker?.selection()?.habitatKind==='giraffe-plains')picker?.refresh();careDirty=false;}
    restKit?.update(simulationTimeMs,simulation.perchView().exploring,policy.reducedMotion);
    if(visitorsDirty&&visitors){const v=simulation.visitorSnapshot();visitors.sync(v.visitors,v.width,v.height,v.tick,v.gate);visitorsDirty=false;announceVisitors();}
    const remainder=frame.accumulatorMs;
    visitors?.update(remainder/100,simulationTimeMs+remainder,policy.reducedMotion);
    birds?.update(remainder/100,simulationTimeMs+remainder);
    elephantModels?.update(remainder/100,simulationTimeMs+remainder,policy.reducedMotion,policy.low);
    giraffeModels?.update(remainder/100,simulationTimeMs+remainder,policy.reducedMotion);giraffeGhost?.sync(giraffePreview?.view()??null,simulation.worldSize().width,simulation.worldSize().height);
    lionModels?.update(remainder/100,simulationTimeMs+remainder,policy.reducedMotion);lionGhost?.sync(lionPreview?.view()??null,simulation.worldSize().width,simulation.worldSize().height);
    diorama?.update(simulationTimeMs, policy.reducedMotion);
    renderer?.render(scene, macaw?.view().active&&!macaw.view().habitat?macaw.camera:camera);
    if (renderer) renderSubmissions++;
  }
  const loop = createFrameLoop(frames, time => { simulation.frame(time);macaw?.frame(time); render(); }, () => onFailure('render'));
  function updateRunning() {
    const shouldPause = disposed || lost || paused || grantBusy || document.hidden;
    const model=macaw?.view();
    simulation.setPaused(shouldPause||Boolean(model?.active));announceSpeed();
    if(shouldPause){saveSession();options.stateStore?.checkpoint?.(()=>simulation.snapshot(),true);options.stateStore?.flush?.();}
    controls?.setEnabled(!shouldPause&&(!model?.active||model.habitat));
    picker?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    placement?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    giraffePreview?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    lionPreview?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    elephantCarePreview?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    const stopped=shouldPause||Boolean(model?.active&&model.motionPaused);macaw?.setRunning(!stopped);
    if (stopped) loop.stop();
    else loop.start();
  }
  function resize() {
    if (disposed || lost || !renderer) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setPixelRatio(visual().pixelRatio);
    renderer.setSize(width, height, false);
    controls?.resize(width,height);macaw?.resize(width,height);
    render();
  }
  function onResize() {
    try { resize(); }
    catch { onFailure('render'); }
  }
  function onMotionChange(){if(visual().reducedMotion)macaw?.pauseForReducedMotion();updateRunning();}
  function onStudioKey(event:KeyboardEvent){if(event.key==='Escape'&&perchPreview){event.preventDefault();event.stopImmediatePropagation();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;updateRunning();render();return;}if(event.key==='Escape'&&waterPreview){event.preventDefault();event.stopImmediatePropagation();waterPreview=false;waterPreviewHabitat=null;waterDirty=true;updateRunning();render();return;}if(event.key==='Escape'&&foodPreview){event.preventDefault();event.stopImmediatePropagation();foodPreview=false;foodPreviewHabitat=null;foodDirty=true;updateRunning();render();return;}if(event.key==='Escape'&&!event.repeat&&macaw?.view().active){event.preventDefault();event.stopImmediatePropagation();macaw.command('close');}}
  function onLost(event: Event) { event.preventDefault(); notifyContextLoss(); }
  function safe(action: () => void) { try { action(); } catch { cleanupErrors++; } }
  function dispose() {
    if (disposed) return;
    disposed = true;
    safe(()=>zebraWorld?.dispose());
    giraffeInput.abort();safe(()=>giraffePreview?.dispose());safe(()=>giraffeModels?.dispose());safe(()=>giraffeWorld?.dispose());safe(()=>giraffeGhost?.dispose());
    lionInput.abort();safe(()=>lionPreview?.dispose());safe(()=>lionModels?.dispose());safe(()=>lionWorld?.dispose());safe(()=>lionGhost?.dispose());
    safe(() => loop.dispose());
    safe(() => controls?.dispose());
    safe(() => picker?.dispose());
    safe(() => placement?.dispose());
    safe(() => habitats?.dispose());safe(()=>grove?.dispose());safe(()=>elephantModels?.dispose());safe(()=>elephantCareScene?.dispose());safe(()=>elephantCarePreview?.dispose());safe(()=>decoration?.dispose());safe(()=>banner?.dispose());
    safe(() => paths?.dispose());
    safe(()=>feeder?.dispose());safe(()=>waterStation?.dispose());safe(()=>restKit?.dispose());
    safe(()=>birds?.dispose());safe(()=>visitors?.dispose());
    safe(()=>lighting?.dispose());
    safe(()=>macaw?.dispose());host.removeEventListener('keydown',onStudioKey,true);
    safe(saveSession);safe(()=>options.stateStore?.checkpoint?.(()=>simulation.snapshot(),true));safe(()=>options.stateStore?.flush?.());
    unsubscribe();
    simulation.dispose();
    canvas.removeEventListener('webglcontextlost', onLost);
    document.removeEventListener('visibilitychange', updateRunning);
    window.removeEventListener('resize', onResize);
    motion.removeEventListener('change', onMotionChange);
    observer?.disconnect();
    for (const geometry of geometries) safe(() => geometry.dispose());
    for (const material of materials) safe(() => { material.dispose(); releasedMaterials++; });
    scene.clear();
    if (renderer) {
      safe(() => renderer!.dispose());
      safe(() => releaseLiveContext(context,()=>renderer!.forceContextLoss()));
    } else {
      safe(() => releaseLiveContext(context,()=>context?.getExtension('WEBGL_lose_context')?.loseContext()));
    }
    canvas.remove();
  }

  try {
    try { context = options.createContext ? options.createContext(canvas) : canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'low-power' }); }
    catch { throw new PreviewFailure('unsupported'); }
    if (!context) throw new PreviewFailure('unsupported');
    renderer = options.createRenderer ? options.createRenderer(canvas, context) : new WebGLRenderer({ canvas, context, antialias: true, alpha: false });
    renderer.debug.onShaderError = () => { throw new PreviewFailure('init'); };
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    lighting=createSanctuaryLighting(scene,renderer);
    const initialWorld=simulation.snapshot().world;
    feeder=createFeederScene();worldLayer.add(feeder.group);waterStation=createWaterScene();worldLayer.add(waterStation.group);restKit=createPerchScene();worldLayer.add(restKit.group);
    birds=createAutonomousBirds();worldLayer.add(birds.group);visitors=createVisitorScene();worldLayer.add(visitors.group);
    diorama = createTropicalDiorama(initialWorld);
    geometries.push(...diorama.geometries); materials.push(...diorama.materials);
    worldLayer.add(diorama.group);
    decoration=createRewardDecoration();worldLayer.add(decoration.group);banner=createThrivingBanner();worldLayer.add(banner.group);
    habitats=createHabitatScene(diorama.catalog,(geometry,material)=>{geometries.push(geometry);materials.push(material);});worldLayer.add(habitats.group);
    grove=createElephantHabitatScene(diorama.catalog);geometries.push(grove.geometry);materials.push(grove.material);worldLayer.add(grove.group);
    if(simulation.snapshot().schemaVersion===5){zebraWorld=createZebraWorldScene(diorama.catalog);worldLayer.add(zebraWorld.group);}
    giraffeModels=createGiraffeResidentsScene(diorama.catalog);worldLayer.add(giraffeModels.group);giraffeWorld=createGiraffeWorldScene(diorama.catalog);worldLayer.add(giraffeWorld.group);giraffeGhost=createGiraffeCareGhost();worldLayer.add(giraffeGhost.group);
    lionModels=createLionResidentsScene(diorama.catalog);worldLayer.add(lionModels.group);lionWorld=createLionWorldScene(diorama.catalog);worldLayer.add(lionWorld.group);lionGhost=createLionCareGhost();worldLayer.add(lionGhost.group);
    elephantModels=createElephantResidentsScene(diorama.catalog);worldLayer.add(elephantModels.group);
    elephantCareScene=createElephantCareScene(diorama.catalog);worldLayer.add(elephantCareScene.group);
    paths=createPathScene(diorama.catalog);geometries.push(paths.geometry);materials.push(paths.material);worldLayer.add(paths.group);
    announceHabitat();
    picker=createScenePicker(diorama.catalog,camera,()=>canvas.getBoundingClientRect(),identity=>{
      if(identity)host.dataset.selectedId=identity.id;else delete host.dataset.selectedId;
      host.dispatchEvent(new CustomEvent('scene-selection-change',{detail:identity}));
    });
    geometries.push(...picker.geometries);materials.push(...picker.materials);worldLayer.add(picker.group);
    placement=createPlacementPreview(()=>simulation.snapshot().world,diorama.catalog,camera,()=>canvas.getBoundingClientRect(),view=>{
      host.dataset.planActive=String(view.active);host.dataset.planKind=view.kind;host.dataset.planReason=view.reason;
      host.dataset.planAnchor=view.proposal?`${view.proposal.anchor.x},${view.proposal.anchor.z}`:'';
      host.dataset.planConfirmed=view.confirmed?`${view.confirmed.anchor.x},${view.confirmed.anchor.z}`:'';
      host.dispatchEvent(new CustomEvent('scene-placement-change',{detail:{...view,...(placementHabitatKind==='zebra-grasslands'&&zebraBuildFailure==='storage'?{failure:'storage'}:{})}}));
    },(proposal,operationId)=>{if(proposal.kind==='habitat'&&placementHabitatKind==='zebra-grasslands')return commitZebraHabitat(proposal.anchor,operationId);const result=proposal.kind==='path'?simulation.buildPath(proposal.anchor,placementCommand):placementHabitatKind==='giraffe-plains'?simulation.buildGiraffeHabitat(proposal.anchor,operationId,placementCommand):placementHabitatKind==='lion-savanna'?simulation.buildLionHabitat(proposal.anchor,operationId,placementCommand):placementHabitatKind==='elephant-grove'?simulation.buildElephantHabitat(proposal.anchor,operationId,placementCommand):simulation.buildHabitat(proposal.anchor,operationId,placementCommand);if(result.ok){placementCommand=simulation.commandRevision();saveSession();announceHabitat();return true;}return false;},kind=>{if(kind==='habitat'&&placementHabitatKind==='zebra-grasslands'){const v=simulation.zebraHabitatView();return v.reason==='ready'?null:v.reason as import('../world/placement-preview.ts').PlacementReason;}if(kind==='habitat'&&placementHabitatKind==='giraffe-plains'){const v=simulation.giraffeHabitatView();return v.reason==='ready'?null:v.reason as import('../world/placement-preview.ts').PlacementReason;}if(kind==='habitat'&&placementHabitatKind==='lion-savanna'){const v=simulation.lionHabitatView();return v.reason==='ready'?null:v.reason as import('../world/placement-preview.ts').PlacementReason;}if(kind==='habitat'&&placementHabitatKind==='elephant-grove'){const v=simulation.elephantHabitatView();return v.reason==='ready'?null:v.reason;}return simulation.purchaseReason(kind);},()=>placementHabitatKind);
    geometries.push(...placement.geometries);materials.push(...placement.materials);worldLayer.add(placement.group);
    elephantCarePreview=createElephantCarePreview(()=>simulation.worldSnapshot(),camera,()=>canvas.getBoundingClientRect(),{command:()=>simulation.commandRevision(),defaultCell:kind=>simulation.defaultElephantCareCell(kind),validate:(kind,cell)=>simulation.elephantCarePlacementView(kind,cell),commit:quote=>{const result=simulation.placeElephantCare(quote);if(result.ok){careFailure=null;careResult='placed';saveSession();announceEdit();}else careFailure=result.reason;return result;}},()=>{careDirty=true;announceElephantCare();});
    giraffePreview=createGiraffeCarePreview(()=>simulation.worldSnapshot(),camera,()=>canvas.getBoundingClientRect(),{command:()=>simulation.commandRevision(),defaultCell:kind=>simulation.defaultGiraffeCareCell(kind),validate:(kind,cell)=>simulation.validateGiraffeCarePlacement(kind,cell),commit:quote=>{const result=simulation.placeGiraffeCare(quote);if(result.ok){giraffeFailure=null;saveSession();}else giraffeFailure=result.reason;return result;}},()=>{careDirty=true;announceGiraffe();});
    lionPreview=createLionCarePreview(()=>simulation.worldSnapshot(),camera,()=>canvas.getBoundingClientRect(),{command:()=>simulation.commandRevision(),defaultCell:kind=>simulation.defaultLionCareCell(kind),validate:(kind,cell)=>simulation.validateLionCarePlacement(kind,cell),commit:quote=>{const result=simulation.placeLionCare(quote);if(result.ok){lionFailure=null;saveSession();}else lionFailure=result.reason;return result;}},()=>{careDirty=true;announceLion();});
    controls=mountCameraControls(host,canvas,camera,diorama.bounds,initialWorld,point=>{if(!macaw?.view().active){if(giraffePreview?.view().active)giraffePreview.pick(point);else if(lionPreview?.view().active)lionPreview.pick(point);else if(elephantCarePreview?.view().active)elephantCarePreview.pick(point);else if(placement?.active())placement.pick(point);else picker?.pick(point);}},()=>giraffePreview?.view().active?giraffePreview.cancel():lionPreview?.view().active?lionPreview.cancel():elephantCarePreview?.view().active?elephantCarePreview.cancel():placement?.active()?placement.command('cancel'):picker?.clear());
    macaw=createMacawStudio(()=>simulation.macawWorldSnapshot(),view=>{birds?.setVisible(!view.active);worldLayer.visible=!view.active||view.habitat;host.dispatchEvent(new CustomEvent('scene-studio-change',{detail:view}));updateRunning();resize();},()=>visual().reducedMotion);scene.add(macaw.group);host.addEventListener('keydown',onStudioKey,true);
    canvas.addEventListener('webglcontextlost', onLost);
    host.append(canvas);
    resize(); // Ready means a real first render completed, not merely an import.
    if (lost || context.isContextLost()) throw new PreviewFailure('context-lost');
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onResize);
      observer.observe(host);
    } else window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', updateRunning);
    motion.addEventListener('change', onMotionChange);
    updateRunning();
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    dispose,
    claimConservationGrant:quote=>{void claimGrant(quote);},
    claimElephantMission:quote=>{void claimElephantMission(quote);},
    reviewElephantPath:(quote:ElephantPathReview)=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active||!placement)return;const v=simulation.elephantRecoveryView();if(!quote||!quote.cell||v.kind!=='path'||!v.path||quote.command!==v.command||quote.cell.x!==v.path.cell.x||quote.cell.z!==v.path.cell.z){host.dispatchEvent(new CustomEvent('scene-elephant-recovery-stale'));return;}
      controls?.setEnabled(false);controls?.setEnabled(true);placement.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;placementCommand=simulation.commandRevision();placementHabitatKind='macaw-aviary';placement.guide('path',v.path.cell);const w=simulation.snapshot().world;controls?.focus({x:v.path.cell.x+.5-sceneOrigin(w).x,z:v.path.cell.z+.5-sceneOrigin(w).z});render();
    },
    guide:(command,revision)=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active||!placement)return;
      if(command==='cancel')placement.command('cancel');
      else if(command==='confirm'){const before=placement.inspect().placementConfirmations;placement.command('confirm',revision);if(placement.inspect().placementConfirmations>before)placement.command('cancel');}
      else{const view=simulation.onboardingView();if(command==='focus'){if(view.target){const w=simulation.snapshot().world;controls?.focus({x:view.target.x+.5-sceneOrigin(w).x,z:view.target.z+.5-sceneOrigin(w).z});}else controls?.command('reset');}
        else if(view.kind&&view.target&&view.affordable){controls?.setEnabled(false);controls?.setEnabled(true);foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;picker?.clear();placementCommand=simulation.commandRevision();placementHabitatKind='macaw-aviary';placement.guide(view.kind,view.target);const w=simulation.snapshot().world;controls?.focus({x:view.target.x+(view.kind==='habitat'?1:.5)-sceneOrigin(w).x,z:view.target.z+(view.kind==='habitat'?1:.5)-sceneOrigin(w).z});}}
      render();
    },
    muted:value=>{if(!disposed&&!lost)simulation.setMuted(value);},
    visualSettings:value=>{if(disposed||lost)return;if(simulation.setVisualSettings(value)){saveSession();if(visual().reducedMotion)macaw?.pauseForReducedMotion();resize();render();}},
    locale:value=>{simulation.setLocale(value);},
    speed:value=>{if(disposed||lost||paused||document.hidden||macaw?.view().active)return;simulation.setSpeed(value);announceSpeed(true);render();},
    claimMission:quote=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;const result=simulation.claimMission(quote);previousMission='';render();host.dispatchEvent(new CustomEvent('scene-mission-result',{detail:result}));},
    recoveryQuote:()=>{const v=simulation.recoveryView();host.dispatchEvent(new CustomEvent('scene-recovery-change',{detail:v}));return !disposed&&!paused&&!lost&&!document.hidden&&!macaw?.view().active&&v.low&&v.available?{command:v.command,key:v.key}:undefined;},
    recover:quote=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;if(simulation.recover(quote)){habitatDirty=true;pathDirty=true;birdsDirty=true;foodDirty=true;waterDirty=true;perchDirty=true;visitorsDirty=true;careDirty=true;saveSession();announceEdit();}render();},
    visitors:command=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();if(command==='focus'||command==='follow'){const w=simulation.snapshot().world,p=command==='follow'?(visual().low?simulation.snapshot().visitors.find(v=>v.arrival)?.position:simulation.visitorFocus()):null;controls?.focus({x:(p?.x??w.gate.x+.5)-sceneOrigin(w).x,z:(p?.z??w.gate.z+.7)-sceneOrigin(w).z});}else if(command==='open'||command==='close'){simulation.visitors(command==='open');saveSession();}render();},
    perch:(command,revision=0)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;foodPreviewHabitat=null;foodDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;
      const h=simulation.macawWorldSnapshot().habitats[0];perchReason=null;
      if(command==='preview'){if(!h||simulation.perchView().exists)perchReason=h?'exists':'missing';else{perchPreview=true;perchPreviewHabitat=h.id;perchCommand=simulation.commandRevision();}}
      else if(command==='cancel'){perchPreview=false;perchPreviewHabitat=null;}
      else if(command==='confirm'&&(!perchPreview||h?.id!==perchPreviewHabitat)){perchPreview=false;perchReason='stale';}
      else{const action=command==='confirm'?'place':command==='remove'?'remove':null;if(action){const result=simulation.perch(action,revision,command==='confirm'?perchCommand:simulation.commandRevision());perchReason=result.ok?null:result.reason;if(result.ok){perchPreview=false;perchPreviewHabitat=null;saveSession();announceEdit();}}}
      perchDirty=true;updateRunning();render();announcePerch();},
    water:(command,revision=0)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;
      const h=simulation.macawWorldSnapshot().habitats[0];waterReason=null;
      if(command==='preview'){if(!h||simulation.waterView().exists){waterReason=h?'exists':'missing';}else{waterPreview=true;waterPreviewHabitat=h.id;waterCommand=simulation.commandRevision();}}
      else if(command==='cancel'){waterPreview=false;waterPreviewHabitat=null;}
      else if(command==='confirm'&&(!waterPreview||h?.id!==waterPreviewHabitat)){waterPreview=false;waterReason='stale';}
      else {const action=command==='confirm'?'place':command==='refill'?'refill':command==='remove'?'remove':null;if(action){const result=simulation.water(action,revision,command==='confirm'?waterCommand:simulation.commandRevision());waterReason=result.ok?null:result.reason;if(result.ok){waterPreview=false;waterPreviewHabitat=null;saveSession();announceEdit();}}}
      waterDirty=true;updateRunning();render();announceWater();},
    food:(command,revision=0)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;
      const h=simulation.macawWorldSnapshot().habitats[0];foodReason=null;
      if(command==='preview'){if(!h||simulation.foodView().exists){foodReason=h?'exists':'missing';}else{foodPreview=true;foodPreviewHabitat=h.id;foodCommand=simulation.commandRevision();}}
      else if(command==='cancel'){foodPreview=false;foodPreviewHabitat=null;}
      else if(command==='confirm'&&(!foodPreview||h?.id!==foodPreviewHabitat)){foodPreview=false;foodReason='stale';}
      else {const action=command==='confirm'?'place':command==='refill'?'refill':command==='remove'?'remove':null;if(action){const result=simulation.food(action,revision,command==='confirm'?foodCommand:simulation.commandRevision());foodReason=result.ok?null:result.reason;if(result.ok){foodPreview=false;foodPreviewHabitat=null;saveSession();announceEdit();}}}
      foodDirty=true;updateRunning();render();announceFood();},
    birds:command=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');if(simulation.birds(command)){picker?.clear();saveSession();render();announceEdit();}},
    studio:(command,value)=>{if(disposed||paused||grantBusy||lost||document.hidden)return;try{if(command==='open'){perchPreview=false;perchPreviewHabitat=null;perchDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();}macaw?.command(command,value);}catch{onFailure('render');}},
    camera: value => controls?.command(value),
    clearSelection:()=>picker?.clear(),
    beginElephantCare:kind=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
      controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;careFailure=null;careResult=null;elephantCarePreview?.setEnabled(true);elephantCarePreview?.begin(kind);
      const cell=simulation.defaultElephantCareCell(kind);if(cell){const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:cell.x+.5-origin.x,z:cell.z+.5-origin.z});}render();
    },
    elephantCare:(command,revision)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;elephantCarePreview?.command(command,revision);render();},
    refillElephantCare:quote=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();careFailure=null;careResult=null;const result=simulation.refillElephantCare(quote);if(result.ok){careResult='refilled';saveSession();announceEdit();}else careFailure=result.reason;render();},
    welcomeElephants:command=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
      placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
      if(simulation.welcomeElephants(command).ok){saveSession();const h=simulation.worldSnapshot().habitats.find(h=>'kind'in h&&h.kind==='elephant-grove');if(h){const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:Math.min(...h.cells.map(c=>c.x))+3-origin.x,z:Math.min(...h.cells.map(c=>c.z))+3-origin.z});}render();}
    },
    focusElephantGuide:target=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;const view=simulation.elephantOnboardingView(),area=view.focus[target];if(!view.active||!area)return;const origin=sceneOrigin(simulation.worldSnapshot());controls?.focusArea({...area,x:area.x-origin.x,z:area.z-origin.z});render();
    },
    beginZebraPath:()=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;const v=zebraAccessView(simulation.snapshot());if(!v.path)return;
      placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;placementHabitatKind='macaw-aviary';placementCommand=simulation.commandRevision();placement?.guide('path',v.path.cell);const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:v.path.cell.x+.5-origin.x,z:v.path.cell.z+.5-origin.z});render();
    },
    focusZebraHabitat:()=>{if(disposed||paused||grantBusy||lost||macaw?.view().active)return;const h=simulation.worldSnapshot().habitats.find(h=>'kind'in h&&h.kind==='zebra-grasslands');if(!h)return;placement?.command('cancel');const origin=sceneOrigin(simulation.worldSnapshot());controls?.focusArea({x:Math.min(...h.cells.map(c=>c.x))-origin.x,z:Math.min(...h.cells.map(c=>c.z))-origin.z,width:8,depth:8});render();},
    beginZebraHabitat:()=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;const v=simulation.zebraHabitatView();if(!v.canBuild||!v.anchor)return;
      controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
      zebraBuildFailure=null;placementHabitatKind='zebra-grasslands';placementCommand=simulation.commandRevision();placement?.guide('habitat',v.anchor);const origin=sceneOrigin(simulation.worldSnapshot());controls?.focusArea({x:v.anchor.x-origin.x,z:v.anchor.z-origin.z,width:8,depth:8});render();
    },
    beginElephantHabitat:()=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active||!simulation.elephantHabitatView().canBuild)return;
      controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
      placementHabitatKind='elephant-grove';placementCommand=simulation.commandRevision();placement?.guide('habitat',{x:3,z:11});const origin=sceneOrigin(simulation.worldSnapshot());controls?.focusArea({x:3-origin.x,z:11-origin.z,width:6,depth:6});render();
    },
    placement:(command,revision)=>{if(grantBusy||macaw?.view().active)return;elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;if(command==='begin'||command==='begin-path'){placement?.command('cancel');placementHabitatKind='macaw-aviary';placementCommand=simulation.commandRevision();picker?.clear();}placement?.command(command,revision);},
    quoteRemoval:target=>simulation.quoteRemoval(target),
    edit:(command,quote)=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
      placement?.command('cancel');elephantCarePreview?.cancel();lionPreview?.cancel();giraffePreview?.cancel();
      const id=`edit-${crypto.randomUUID().replaceAll('-','')}`;
      const result=command==='undo'?simulation.undo(id,editCommand):quote?simulation.remove(quote,id):{ok:false as const,reason:'command' as const};
      if(result.ok){picker?.clear();saveSession();render();const a=simulation.access();host.dataset.worldPathCount=String(a.pathTiles);host.dataset.worldConnected=String(a.connected);host.dataset.worldRouteCells=String(a.routeCells);host.dispatchEvent(new CustomEvent('scene-access-change',{detail:simulation.macawAccess()}));const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:simulation.macawWorldSnapshot().habitats.length,occupiedTiles:simulation.macawWorldSnapshot().habitats.reduce((n,h)=>n+h.cells.length,0)}}));}
      announceEdit(result.ok?null:result.reason,result.ok?(command==='undo'?'restored':'removed'):null);
    },
    cancelInput() {lionPreview?.cancel();giraffePreview?.cancel();lionRemoval=null;giraffeRemoval=null; controls?.setEnabled(false); updateRunning(); },
    setPaused(value) { paused = value; updateRunning(); announceLion();announceGiraffe(); },
    inspect: () => {
      // One coherent read per diagnostic call; never repeat full finance/views/clones for each field.
      const simulationState=simulation.inspect(),stateSnapshot=simulation.snapshot(),missionView=simulation.missionView(),perchView=simulation.perchView(),foodView=simulation.foodView(),waterView=simulation.waterView(),visitorView=simulation.visitorView(),birdsView=simulation.birdsView(),policy=visual(),guide=readGuide(simulationState);
      return ({ ...lighting?.inspect(),graphicsLow:policy.low,manualReducedMotion:stateSnapshot.preferences.reducedMotion,effectiveReducedMotion:policy.reducedMotion,graphicsPixelRatioCap:policy.pixelRatio,canUndo:simulationState.canUndo,editorRevision:simulationState.editorRevision,disposed, lost, canvasAttached: canvas.isConnected, pendingFrames: loop.inspect().pendingFrames, geometries: renderer?.info.memory.geometries ?? 0, textures: renderer?.info.memory.textures ?? 0, programs: renderer?.info.programs?.length ?? 0, ownedMaterialsLive: materials.length - releasedMaterials+(giraffeModels?.inspect().giraffeMaterials??0)+(giraffeWorld?.inspect().giraffeWorldMaterials??0)+(zebraWorld?.inspect().zebraWorldMaterials??0)+(giraffeGhost?.inspect().giraffeCareGhostMaterials??0)+(lionModels?.inspect().lionMaterials??0)+(lionWorld?.inspect().lionWorldMaterials??0)+(lionGhost?.inspect().lionCareGhostMaterials??0)+(elephantCareScene?.inspect().elephantCareMaterials??0)+(elephantModels?.inspect().elephantResidentMaterials??0)+(decoration?.inspect().rewardDecorationMaterials??0)+(banner?.inspect().thrivingBannerMaterials??0)+(visitors?.inspect().visitorOwnedMaterials??0)+(macaw?.inspect().macawOwnedMaterialsLive??0)+(birds?.inspect().birdOwnedMaterials??0)+(feeder?.inspect().feederOwnedMaterials??0)+(waterStation?.inspect().waterOwnedMaterials??0)+(restKit?.inspect().perchOwnedMaterials??0), drawCallsLastRender: renderer?.info.render.calls ?? 0, trianglesLastRender: renderer?.info.render.triangles ?? 0, renderSubmissions, bufferWidth: canvas.width, bufferHeight: canvas.height, pixelRatio: renderer?.getPixelRatio() ?? 0, cleanupErrors, simulationSpeed:simulationState.speed,simulationDroppedWallMs:simulationState.droppedMs,simulationDroppedSimMs:simulationState.droppedSimulationMs,simulationLastAdvanceSteps:simulationState.lastAdvanceSteps,simulationAccumulatorMs:simulationState.accumulatorMs,simulationTick: simulationState.tick, simulationGameTimeMs: simulationState.gameTimeMs, simulationPaused: simulationState.paused, simulationDisposed: simulationState.disposed, simulationSubscribers: simulationState.subscribers, simulationEvents, simulationStartTick,onboardingStep:['habitat','path','claim','done','blocked'].indexOf(guide.stage),onboardingRemaining:guide.remaining,onboardingAffordable:guide.affordable,missionCompleted:missionView.completed,missionRewardCoins:missionView.rewards,missionQ01Ready:missionView.rows[0].status==='ready',missionQ02Ready:missionView.rows[1].status==='ready',missionQ03Ready:missionView.rows[2].status==='ready',missionPaidVisitors:missionView.visit.admissions,missionViewedVisitors:missionView.visit.viewings,missionVisitorBadge:missionView.visit.badged,missionPinnedGuests:stateSnapshot.missions.objectives.admittedVisitorIds.length+stateSnapshot.missions.objectives.viewedVisitorIds.length,missionCareTicks:missionView.care.comfortableTicks,missionBirdsFed:missionView.care.fed,missionBirdsWatered:missionView.care.watered,missionCareUnlocked:missionView.care.unlocked,...decoration?.inspect(),...banner?.inspect(),missionQ04Ready:missionView.rows[3].status==='ready',missionThrivingTicks:missionView.thriving.ticks,missionThrivingRevenue:missionView.thriving.revenue,missionThrivingAdmissions:missionView.thriving.admissions,missionThrivingUnlocked:missionView.thriving.unlocked, habitatCount:simulationState.habitatCount, occupiedTiles:simulationState.occupiedTiles, currency:simulationState.currency,maintenancePeriod:simulationState.maintenancePeriod,maintenanceDue:simulationState.maintenanceDue,economyGrants:simulationState.economyGrants,economySpent:simulationState.economySpent,economyRefunds:simulationState.economyRefunds,ledgerEntries:simulationState.ledgerEntries,journalRetained:simulationState.journalRetained,journalArchived:simulationState.journalArchived,journalCompactions:simulationState.journalCompactions,commandRevision:simulationState.commandRevision,retiredVisitorThrough:simulationState.retiredVisitorThrough,retiredOpenCount:simulationState.retiredOpenCount,recoveryHabitatTick:simulationState.recoveryHabitatTick,recoveryHabitatNonce:simulationState.recoveryHabitatNonce,recoveryGrants:simulationState.recoveryGrants,recoveryRations:simulationState.recoveryRations,recoveryLastRation:simulationState.recoveryLastRation, perchExists:perchView.exists,perchRevision:perchView.revision,perchResting:perchView.resting,perchExploring:perchView.exploring,perchPreview,...restKit?.inspect(),waterStock:waterView.stock,waterBowl1:waterView.portions[0],waterBowl2:waterView.portions[1],waterRevision:waterView.revision,waterExists:waterView.exists,waterPreview,...waterStation?.inspect(),foodStock:foodView.stock,foodBowl1:foodView.portions[0],foodBowl2:foodView.portions[1],foodRevision:foodView.revision,foodExists:foodView.exists,foodPreview,...feeder?.inspect(),...simulation.visitorInspect(),visitorCount:visitorView.active,visitorQueued:visitorView.queued,visitorWalking:visitorView.walking,visitorViewing:visitorView.viewing,visitorReturning:visitorView.returning,visitorViewed:visitorView.viewedTotal,visitorOpen:visitorView.open,visitorTotal:visitorView.total,visitorNextSerial:stateSnapshot.visitorFlow.nextSerial,visitorCooldown:stateSnapshot.visitorFlow.cooldownTicks,...visitors?.inspect(),...simulation.birdInspect(),placedBirds:birdsView.placed,...birds?.inspect(),...macaw?.inspect(),...habitats?.inspect(),...grove?.inspect(),...giraffeModels?.inspect(),...giraffeWorld?.inspect(),...zebraWorld?.inspect(),zebraBuildBusy:grantBusy,zebraBuildStorageFailure:zebraBuildFailure==='storage',...giraffeGhost?.inspect(),...giraffePreview?.inspect(),...lionModels?.inspect(),...lionWorld?.inspect(),...lionGhost?.inspect(),...elephantModels?.inspect(),...elephantCareScene?.inspect(),...elephantCarePreview?.inspect(), ...paths?.inspect(), pathTiles:simulationState.pathTiles,reachablePathTiles:simulationState.reachablePathTiles,connectedHabitats:simulationState.connectedHabitats,routeCells:simulationState.routeCells, orthographicCamera: camera.isOrthographicCamera, ...diorama?.inspect(), ...controls?.inspect(), ...picker?.inspect(), ...placement?.inspect()  });
    },
  };
}
