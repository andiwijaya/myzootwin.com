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
  let paused = false;
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
  function announceElephantCare(){const data=simulation.elephantCareView(),view:ElephantCareSceneView={...data,preview:elephantCarePreview?.view()??{active:false,kind:'elephant-browse',cell:null,revision:0,command:data.command,reason:'ready',price:data.browsePrice},failure:careFailure,result:careResult},key=JSON.stringify(view);if(key!==previousCare){previousCare=key;host.dispatchEvent(new CustomEvent('scene-elephant-care-change',{detail:view}));}host.dataset.elephantMeals=String(data.residents.reduce((n,a)=>n+a.foodEaten,0));host.dataset.elephantDrinks=String(data.residents.reduce((n,a)=>n+a.waterDrunk,0));}
  function announceGrant(){const view:ElephantCatalogView={...simulation.conservationGrantView(),habitat:simulation.elephantHabitatView(),residents:simulation.elephantResidentsView(),busy:grantBusy,savingAvailable:options.stateStore?.canCommit?.()===true,failure:grantFailure},key=JSON.stringify(view);if(key!==previousGrant){previousGrant=key;host.dispatchEvent(new CustomEvent('scene-elephant-grove-change',{detail:view}));}host.dataset.elephantGrantClaimed=String(view.claimed);host.dataset.placedElephants=String(view.residents.residents.length);}
  async function claimGrant(quote:ConservationGrantQuote){
    if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
    grantFailure=null;const prepared=simulation.prepareConservationGrant(quote);
    if(!prepared.ok){grantFailure='stale';announceGrant();return;}
    if(options.stateStore?.canCommit?.()!==true||!options.stateStore.commitCandidate){grantFailure='storage';announceGrant();return;}
    // A committed grant advances the command quote. Drop unpaid previews before that transition.
    placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
    const expected={tick:prepared.state.tick,command:quote.command};grantBusy=true;updateRunning();announceGrant();render();
    try{const committed=await options.stateStore.commitCandidate(prepared.state,expected);if(disposed)return;if(!committed||!simulation.acceptCommittedGrant(committed,quote))grantFailure='storage';else saveSession();}
    catch{grantFailure='storage';}
    finally{grantBusy=false;if(!disposed){updateRunning();announceGrant();render();}}
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
    if(event.type==='habitat-built'||event.type==='elephants-welcomed'){habitatDirty=true;pathDirty=true;}
    if(event.type==='mission-claimed')habitatDirty=true;
    if(event.type==='path-built')pathDirty=true;
    if(event.type==='elephant-care-changed')lighting?.invalidate();
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
    announceSpeed(false,frame);announceGrant();announceElephantCare();
    const guide=readGuide(frame),guideKey=JSON.stringify(guide);if(guideKey!==previousGuide){previousGuide=guideKey;host.dispatchEvent(new CustomEvent('scene-onboarding-change',{detail:guide}));}
    const missions=simulation.missionView(),missionKey=JSON.stringify(missions);if(missionKey!==previousMission){previousMission=missionKey;host.dispatchEvent(new CustomEvent('scene-missions-change',{detail:missions}));}
    const recoveryKey=[frame.tick,frame.commandRevision,frame.editorRevision,simulation.visitorView().open].join(':');if(recoveryKey!==recoveryReadKey){recoveryReadKey=recoveryKey;recoveryRead=simulation.recoveryView();}const nextRecovery=JSON.stringify(recoveryRead);if(nextRecovery!==previousRecovery){previousRecovery=nextRecovery;host.dispatchEvent(new CustomEvent('scene-recovery-change',{detail:recoveryRead}));}
    const money=simulation.economyView(),moneyKey=JSON.stringify(money);if(moneyKey!==previousEconomy){previousEconomy=moneyKey;placement?.refresh();host.dispatchEvent(new CustomEvent('scene-economy-change',{detail:money}));}
    if (disposed || lost) return;
    if (context?.isContextLost()) { notifyContextLoss(); return; }
    const world=habitatDirty||pathDirty||foodDirty||waterDirty||perchDirty?simulation.worldSnapshot():undefined;
    const macawWorld=habitatDirty||foodDirty||waterDirty||perchDirty?simulation.macawWorldSnapshot():undefined;
    if(habitatDirty&&habitats){habitats.sync(macawWorld!);grove?.sync(world!);lighting?.invalidate();decoration?.sync(macawWorld!,simulation.missionView().care.unlocked);banner?.sync(macawWorld!,simulation.missionView().thriving.unlocked);habitatDirty=false;}
    if(pathDirty&&paths){paths.sync(world!);picker?.refresh();pathDirty=false;}
    if(birdsDirty&&birds){const s=simulation.birdSnapshot();birds.sync(s.animals,s.habitats,s.width,s.height,simulationTimeMs);const e=simulation.elephantSnapshot();elephantModels?.sync(e.animals,e.width,e.height);if(e.animals.length&&(!policy.reducedMotion||e.animals.some(a=>['seek-food','seek-water','wander'].includes(a.currentBehavior))))lighting?.invalidate();birdsDirty=false;announceBirds();}
    if(foodDirty){feeder?.sync(macawWorld!,foodPreview,simulation.foodView().canPlace);announceFood();foodDirty=false;}
    if(waterDirty){waterStation?.sync(macawWorld!,waterPreview,simulation.waterView().canPlace);announceWater();waterDirty=false;}
    if(perchDirty){const view=simulation.perchView();restKit?.sync(macawWorld!,perchPreview,view.canPlace);birds?.setPerchesVisible(!view.reachable&&!perchPreview);announcePerch();perchDirty=false;}
    if(careDirty&&elephantCareScene){const care=simulation.elephantCareSnapshot();if(elephantCareScene.sync(care.resources,care.width,care.height,elephantCarePreview?.view()??null))picker?.refresh();careDirty=false;}
    restKit?.update(simulationTimeMs,simulation.perchView().exploring,policy.reducedMotion);
    if(visitorsDirty&&visitors){const v=simulation.visitorSnapshot();visitors.sync(v.visitors,v.width,v.height,v.tick,v.gate);visitorsDirty=false;announceVisitors();}
    const remainder=frame.accumulatorMs;
    visitors?.update(remainder/100,simulationTimeMs+remainder,policy.reducedMotion);
    birds?.update(remainder/100,simulationTimeMs+remainder);
    elephantModels?.update(remainder/100,simulationTimeMs+remainder,policy.reducedMotion);
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
    elephantModels=createElephantResidentsScene(diorama.catalog);worldLayer.add(elephantModels.group);
    elephantCareScene=createElephantCareScene(diorama.catalog);worldLayer.add(elephantCareScene.group);
    paths=createPathScene(diorama.catalog);geometries.push(paths.geometry);materials.push(paths.material);worldLayer.add(paths.group);
    function announceHabitat(){announceEdit();const access=simulation.access();host.dataset.worldPathCount=String(access.pathTiles);host.dataset.worldConnected=String(access.connected);host.dataset.worldRouteCells=String(access.routeCells);host.dispatchEvent(new CustomEvent('scene-access-change',{detail:simulation.macawAccess()}));const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:simulation.macawWorldSnapshot().habitats.length,occupiedTiles:simulation.macawWorldSnapshot().habitats.reduce((n,h)=>n+h.cells.length,0)}}));}
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
      host.dispatchEvent(new CustomEvent('scene-placement-change',{detail:view}));
    },(proposal,operationId)=>{const result=proposal.kind==='path'?simulation.buildPath(proposal.anchor,placementCommand):placementHabitatKind==='elephant-grove'?simulation.buildElephantHabitat(proposal.anchor,operationId,placementCommand):simulation.buildHabitat(proposal.anchor,operationId,placementCommand);if(result.ok){placementCommand=simulation.commandRevision();saveSession();announceHabitat();return true;}return false;},kind=>{if(kind==='habitat'&&placementHabitatKind==='elephant-grove'){const v=simulation.elephantHabitatView();return v.reason==='ready'?null:v.reason;}return simulation.purchaseReason(kind);},()=>placementHabitatKind);
    geometries.push(...placement.geometries);materials.push(...placement.materials);worldLayer.add(placement.group);
    elephantCarePreview=createElephantCarePreview(()=>simulation.worldSnapshot(),camera,()=>canvas.getBoundingClientRect(),{command:()=>simulation.commandRevision(),defaultCell:kind=>simulation.defaultElephantCareCell(kind),validate:(kind,cell)=>simulation.elephantCarePlacementView(kind,cell),commit:quote=>{const result=simulation.placeElephantCare(quote);if(result.ok){careFailure=null;careResult='placed';saveSession();announceEdit();}else careFailure=result.reason;return result;}},()=>{careDirty=true;announceElephantCare();});
    controls=mountCameraControls(host,canvas,camera,diorama.bounds,initialWorld,point=>{if(!macaw?.view().active){if(elephantCarePreview?.view().active)elephantCarePreview.pick(point);else if(placement?.active())placement.pick(point);else picker?.pick(point);}},()=>elephantCarePreview?.view().active?elephantCarePreview.cancel():placement?.active()?placement.command('cancel'):picker?.clear());
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
    recover:quote=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;if(simulation.recover(quote)){habitatDirty=true;pathDirty=true;birdsDirty=true;foodDirty=true;waterDirty=true;perchDirty=true;visitorsDirty=true;careDirty=true;saveSession();announceEdit();}render();},
    visitors:command=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;elephantCarePreview?.cancel();if(command==='focus'||command==='follow'){const w=simulation.snapshot().world,p=command==='follow'?(visual().low?simulation.snapshot().visitors.find(v=>v.arrival)?.position:simulation.visitorFocus()):null;controls?.focus({x:(p?.x??w.gate.x+.5)-sceneOrigin(w).x,z:(p?.z??w.gate.z+.7)-sceneOrigin(w).z});}else if(command==='open'||command==='close'){simulation.visitors(command==='open');saveSession();}render();},
    perch:(command,revision=0)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();foodPreview=false;foodPreviewHabitat=null;foodDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;
      const h=simulation.macawWorldSnapshot().habitats[0];perchReason=null;
      if(command==='preview'){if(!h||simulation.perchView().exists)perchReason=h?'exists':'missing';else{perchPreview=true;perchPreviewHabitat=h.id;perchCommand=simulation.commandRevision();}}
      else if(command==='cancel'){perchPreview=false;perchPreviewHabitat=null;}
      else if(command==='confirm'&&(!perchPreview||h?.id!==perchPreviewHabitat)){perchPreview=false;perchReason='stale';}
      else{const action=command==='confirm'?'place':command==='remove'?'remove':null;if(action){const result=simulation.perch(action,revision,command==='confirm'?perchCommand:simulation.commandRevision());perchReason=result.ok?null:result.reason;if(result.ok){perchPreview=false;perchPreviewHabitat=null;saveSession();announceEdit();}}}
      perchDirty=true;updateRunning();render();announcePerch();},
    water:(command,revision=0)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;
      const h=simulation.macawWorldSnapshot().habitats[0];waterReason=null;
      if(command==='preview'){if(!h||simulation.waterView().exists){waterReason=h?'exists':'missing';}else{waterPreview=true;waterPreviewHabitat=h.id;waterCommand=simulation.commandRevision();}}
      else if(command==='cancel'){waterPreview=false;waterPreviewHabitat=null;}
      else if(command==='confirm'&&(!waterPreview||h?.id!==waterPreviewHabitat)){waterPreview=false;waterReason='stale';}
      else {const action=command==='confirm'?'place':command==='refill'?'refill':command==='remove'?'remove':null;if(action){const result=simulation.water(action,revision,command==='confirm'?waterCommand:simulation.commandRevision());waterReason=result.ok?null:result.reason;if(result.ok){waterPreview=false;waterPreviewHabitat=null;saveSession();announceEdit();}}}
      waterDirty=true;updateRunning();render();announceWater();},
    food:(command,revision=0)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;
      const h=simulation.macawWorldSnapshot().habitats[0];foodReason=null;
      if(command==='preview'){if(!h||simulation.foodView().exists){foodReason=h?'exists':'missing';}else{foodPreview=true;foodPreviewHabitat=h.id;foodCommand=simulation.commandRevision();}}
      else if(command==='cancel'){foodPreview=false;foodPreviewHabitat=null;}
      else if(command==='confirm'&&(!foodPreview||h?.id!==foodPreviewHabitat)){foodPreview=false;foodReason='stale';}
      else {const action=command==='confirm'?'place':command==='refill'?'refill':command==='remove'?'remove':null;if(action){const result=simulation.food(action,revision,command==='confirm'?foodCommand:simulation.commandRevision());foodReason=result.ok?null:result.reason;if(result.ok){foodPreview=false;foodPreviewHabitat=null;saveSession();announceEdit();}}}
      foodDirty=true;updateRunning();render();announceFood();},
    birds:command=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');if(simulation.birds(command)){picker?.clear();saveSession();render();announceEdit();}},
    studio:(command,value)=>{if(disposed||paused||grantBusy||lost||document.hidden)return;try{if(command==='open'){perchPreview=false;perchPreviewHabitat=null;perchDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();}macaw?.command(command,value);}catch{onFailure('render');}},
    camera: value => controls?.command(value),
    clearSelection:()=>picker?.clear(),
    beginElephantCare:kind=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
      controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;careFailure=null;careResult=null;elephantCarePreview?.setEnabled(true);elephantCarePreview?.begin(kind);
      const cell=simulation.defaultElephantCareCell(kind);if(cell){const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:cell.x+.5-origin.x,z:cell.z+.5-origin.z});}render();
    },
    elephantCare:(command,revision)=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;elephantCarePreview?.command(command,revision);render();},
    refillElephantCare:quote=>{if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;elephantCarePreview?.cancel();careFailure=null;careResult=null;const result=simulation.refillElephantCare(quote);if(result.ok){careResult='refilled';saveSession();announceEdit();}else careFailure=result.reason;render();},
    welcomeElephants:command=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
      placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
      if(simulation.welcomeElephants(command).ok){saveSession();const h=simulation.worldSnapshot().habitats.find(h=>'kind'in h&&h.kind==='elephant-grove');if(h){const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:Math.min(...h.cells.map(c=>c.x))+3-origin.x,z:Math.min(...h.cells.map(c=>c.z))+3-origin.z});}render();}
    },
    beginElephantHabitat:()=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active||!simulation.elephantHabitatView().canBuild)return;
      controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');elephantCarePreview?.cancel();picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;
      placementHabitatKind='elephant-grove';placementCommand=simulation.commandRevision();placement?.guide('habitat',{x:3,z:11});const origin=sceneOrigin(simulation.worldSnapshot());controls?.focus({x:6-origin.x,z:14-origin.z});render();
    },
    placement:(command,revision)=>{if(grantBusy||macaw?.view().active)return;elephantCarePreview?.cancel();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;if(command==='begin'||command==='begin-path'){placement?.command('cancel');placementHabitatKind='macaw-aviary';placementCommand=simulation.commandRevision();picker?.clear();}placement?.command(command,revision);},
    quoteRemoval:target=>simulation.quoteRemoval(target),
    edit:(command,quote)=>{
      if(disposed||paused||grantBusy||lost||document.hidden||macaw?.view().active)return;
      placement?.command('cancel');elephantCarePreview?.cancel();
      const id=`edit-${crypto.randomUUID().replaceAll('-','')}`;
      const result=command==='undo'?simulation.undo(id,editCommand):quote?simulation.remove(quote,id):{ok:false as const,reason:'command' as const};
      if(result.ok){picker?.clear();saveSession();render();const a=simulation.access();host.dataset.worldPathCount=String(a.pathTiles);host.dataset.worldConnected=String(a.connected);host.dataset.worldRouteCells=String(a.routeCells);host.dispatchEvent(new CustomEvent('scene-access-change',{detail:simulation.macawAccess()}));const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:simulation.macawWorldSnapshot().habitats.length,occupiedTiles:simulation.macawWorldSnapshot().habitats.reduce((n,h)=>n+h.cells.length,0)}}));}
      announceEdit(result.ok?null:result.reason,result.ok?(command==='undo'?'restored':'removed'):null);
    },
    cancelInput() { controls?.setEnabled(false); updateRunning(); },
    setPaused(value) { paused = value; updateRunning(); },
    inspect: () => ({ ...lighting?.inspect(),graphicsLow:visual().low,manualReducedMotion:simulation.snapshot().preferences.reducedMotion,effectiveReducedMotion:visual().reducedMotion,graphicsPixelRatioCap:visual().pixelRatio,canUndo:simulation.inspect().canUndo,editorRevision:simulation.inspect().editorRevision,disposed, lost, canvasAttached: canvas.isConnected, pendingFrames: loop.inspect().pendingFrames, geometries: renderer?.info.memory.geometries ?? 0, textures: renderer?.info.memory.textures ?? 0, programs: renderer?.info.programs?.length ?? 0, ownedMaterialsLive: materials.length - releasedMaterials+(elephantCareScene?.inspect().elephantCareMaterials??0)+(elephantModels?.inspect().elephantResidentMaterials??0)+(decoration?.inspect().rewardDecorationMaterials??0)+(banner?.inspect().thrivingBannerMaterials??0)+(visitors?.inspect().visitorOwnedMaterials??0)+(macaw?.inspect().macawOwnedMaterialsLive??0)+(birds?.inspect().birdOwnedMaterials??0)+(feeder?.inspect().feederOwnedMaterials??0)+(waterStation?.inspect().waterOwnedMaterials??0)+(restKit?.inspect().perchOwnedMaterials??0), drawCallsLastRender: renderer?.info.render.calls ?? 0, trianglesLastRender: renderer?.info.render.triangles ?? 0, renderSubmissions, bufferWidth: canvas.width, bufferHeight: canvas.height, pixelRatio: renderer?.getPixelRatio() ?? 0, cleanupErrors, simulationSpeed:simulation.inspect().speed,simulationDroppedWallMs:simulation.inspect().droppedMs,simulationDroppedSimMs:simulation.inspect().droppedSimulationMs,simulationLastAdvanceSteps:simulation.inspect().lastAdvanceSteps,simulationAccumulatorMs:simulation.inspect().accumulatorMs,simulationTick: simulation.inspect().tick, simulationGameTimeMs: simulation.inspect().gameTimeMs, simulationPaused: simulation.inspect().paused, simulationDisposed: simulation.inspect().disposed, simulationSubscribers: simulation.inspect().subscribers, simulationEvents, simulationStartTick,onboardingStep:['habitat','path','claim','done','blocked'].indexOf(readGuide().stage),onboardingRemaining:readGuide().remaining,onboardingAffordable:readGuide().affordable,missionCompleted:simulation.missionView().completed,missionRewardCoins:simulation.missionView().rewards,missionQ01Ready:simulation.missionView().rows[0].status==='ready',missionQ02Ready:simulation.missionView().rows[1].status==='ready',missionQ03Ready:simulation.missionView().rows[2].status==='ready',missionPaidVisitors:simulation.missionView().visit.admissions,missionViewedVisitors:simulation.missionView().visit.viewings,missionVisitorBadge:simulation.missionView().visit.badged,missionPinnedGuests:simulation.snapshot().missions.objectives.admittedVisitorIds.length+simulation.snapshot().missions.objectives.viewedVisitorIds.length,missionCareTicks:simulation.missionView().care.comfortableTicks,missionBirdsFed:simulation.missionView().care.fed,missionBirdsWatered:simulation.missionView().care.watered,missionCareUnlocked:simulation.missionView().care.unlocked,...decoration?.inspect(),...banner?.inspect(),missionQ04Ready:simulation.missionView().rows[3].status==='ready',missionThrivingTicks:simulation.missionView().thriving.ticks,missionThrivingRevenue:simulation.missionView().thriving.revenue,missionThrivingAdmissions:simulation.missionView().thriving.admissions,missionThrivingUnlocked:simulation.missionView().thriving.unlocked, habitatCount:simulation.inspect().habitatCount, occupiedTiles:simulation.inspect().occupiedTiles, currency:simulation.inspect().currency,maintenancePeriod:simulation.inspect().maintenancePeriod,maintenanceDue:simulation.inspect().maintenanceDue,economyGrants:simulation.inspect().economyGrants,economySpent:simulation.inspect().economySpent,economyRefunds:simulation.inspect().economyRefunds,ledgerEntries:simulation.inspect().ledgerEntries,journalRetained:simulation.inspect().journalRetained,journalArchived:simulation.inspect().journalArchived,journalCompactions:simulation.inspect().journalCompactions,commandRevision:simulation.inspect().commandRevision,retiredVisitorThrough:simulation.inspect().retiredVisitorThrough,retiredOpenCount:simulation.inspect().retiredOpenCount,recoveryHabitatTick:simulation.inspect().recoveryHabitatTick,recoveryHabitatNonce:simulation.inspect().recoveryHabitatNonce,recoveryGrants:simulation.inspect().recoveryGrants,recoveryRations:simulation.inspect().recoveryRations,recoveryLastRation:simulation.inspect().recoveryLastRation, perchExists:simulation.perchView().exists,perchRevision:simulation.perchView().revision,perchResting:simulation.perchView().resting,perchExploring:simulation.perchView().exploring,perchPreview,...restKit?.inspect(),waterStock:simulation.waterView().stock,waterBowl1:simulation.waterView().portions[0],waterBowl2:simulation.waterView().portions[1],waterRevision:simulation.waterView().revision,waterExists:simulation.waterView().exists,waterPreview,...waterStation?.inspect(),foodStock:simulation.foodView().stock,foodBowl1:simulation.foodView().portions[0],foodBowl2:simulation.foodView().portions[1],foodRevision:simulation.foodView().revision,foodExists:simulation.foodView().exists,foodPreview,...feeder?.inspect(),...simulation.visitorInspect(),visitorCount:simulation.visitorView().active,visitorQueued:simulation.visitorView().queued,visitorWalking:simulation.visitorView().walking,visitorViewing:simulation.visitorView().viewing,visitorReturning:simulation.visitorView().returning,visitorViewed:simulation.visitorView().viewedTotal,visitorOpen:simulation.visitorView().open,visitorTotal:simulation.visitorView().total,visitorNextSerial:simulation.snapshot().visitorFlow.nextSerial,visitorCooldown:simulation.snapshot().visitorFlow.cooldownTicks,...visitors?.inspect(),...simulation.birdInspect(),placedBirds:simulation.birdsView().placed,...birds?.inspect(),...macaw?.inspect(),...habitats?.inspect(),...grove?.inspect(),...elephantModels?.inspect(),...elephantCareScene?.inspect(),...elephantCarePreview?.inspect(), ...paths?.inspect(), pathTiles:simulation.inspect().pathTiles,reachablePathTiles:simulation.inspect().reachablePathTiles,connectedHabitats:simulation.inspect().connectedHabitats,routeCells:simulation.inspect().routeCells, orthographicCamera: camera.isOrthographicCamera, ...diorama?.inspect(), ...controls?.inspect(), ...picker?.inspect(), ...placement?.inspect() }),
  };
}
