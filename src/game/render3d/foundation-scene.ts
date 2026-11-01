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
import { createPlacementPreview } from './placement-preview.ts';
import { createScenePicker } from './scene-picking.ts';
import { AmbientLight, BufferGeometry, Color, DirectionalLight, Group, OrthographicCamera, Scene, SRGBColorSpace, WebGLRenderer, type Material } from 'three';
import { createTropicalDiorama } from './tropical-diorama.ts';
import { mountCameraControls } from './camera-controls.ts';
import { createSimulation } from '../core/simulation.ts';
import { createFrameLoop, type FrameDriver } from './frame-loop';
import { PreviewFailure, type PreviewFailureKind, type PreviewSession } from './preview-controller';

interface FoundationOptions {
  stateStore?:SanctuarySessionState;
  frames?: FrameDriver;
  createContext?: (canvas: HTMLCanvasElement) => WebGL2RenderingContext | null;
  createRenderer?: (canvas: HTMLCanvasElement, context: WebGL2RenderingContext) => WebGLRenderer;
}

/** Fixed-tick world with two autonomous macaws. Care is playable; entrance arrivals are bounded. Habitat visits, economy and durable saves remain later features. */
export function mountFoundationScene(host: HTMLElement, onFailure: (kind: PreviewFailureKind) => void, options: FoundationOptions = {}): PreviewSession {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  let context: WebGL2RenderingContext | null = null;
  let renderer: WebGLRenderer | undefined;
  let disposed = false;
  let lost = false;
  let paused = false;
  let cleanupErrors = 0;
  let renderSubmissions = 0;
  let releasedMaterials = 0;
  let observer: ResizeObserver | undefined;
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const scene = new Scene();
  const worldLayer=new Group();scene.add(worldLayer);
  let macaw:ReturnType<typeof createMacawStudio>|undefined;
  const camera = new OrthographicCamera();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = options.frames ?? { request: (fn) => requestAnimationFrame(fn), cancel: (id) => cancelAnimationFrame(id) };
  let diorama: ReturnType<typeof createTropicalDiorama> | undefined;
  let controls: ReturnType<typeof mountCameraControls> | undefined;
  let picker: ReturnType<typeof createScenePicker> | undefined;
  let placement:ReturnType<typeof createPlacementPreview>|undefined;
  let habitats:ReturnType<typeof createHabitatScene>|undefined;
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
  function saveSession(){options.stateStore?.write(simulation.snapshot());options.stateStore?.writeEditor(simulation.editorSnapshot());}
  function announceEdit(reason:import('../world/editing.ts').EditReason|null=null,result:'removed'|'restored'|null=null){editCommand=simulation.commandRevision();host.dispatchEvent(new CustomEvent('scene-edit-change',{detail:{canUndo:simulation.inspect().canUndo,undoCost:simulation.inspect().undoCost,reason,result}}));}
  const simulationStartTick=simulation.inspect().tick;
  let simulationTimeMs = simulation.inspect().gameTimeMs;
  let simulationEvents = 0;
  const unsubscribe = simulation.subscribe(event => {
    simulationTimeMs = event.gameTimeMs;
    if (event.type === 'tick') simulationEvents++;
    if(event.type==='visitor-admitted'||event.type==='economy-changed'||event.type==='recovery-changed'||event.type==='mission-claimed')saveSession();
    birdsDirty=true;foodDirty=true;waterDirty=true;perchDirty=true;visitorsDirty=true;
    if(event.type==='habitat-built'){habitatDirty=true;pathDirty=true;}
    if(event.type==='path-built')pathDirty=true;
    if(event.type==='world-edited'||event.type==='recovery-changed'){habitatDirty=true;pathDirty=true;}
  });

  function notifyContextLoss() {
    if (disposed || lost) return;
    lost = true;
    simulation.setPaused(true);
    loop.stop();
    onFailure('context-lost');
  }
  function readGuide(){const s=simulation.inspect(),key=[s.commandRevision,s.currency,s.editorRevision].join(':');if(key!==guideReadKey||!guideRead){guideReadKey=key;guideRead=simulation.onboardingView();}return guideRead;}
  function render() {
    const guide=readGuide(),guideKey=JSON.stringify(guide);if(guideKey!==previousGuide){previousGuide=guideKey;host.dispatchEvent(new CustomEvent('scene-onboarding-change',{detail:guide}));}
    const missions=simulation.missionView(),missionKey=JSON.stringify(missions);if(missionKey!==previousMission){previousMission=missionKey;host.dispatchEvent(new CustomEvent('scene-missions-change',{detail:missions}));}
    const recoveryKey=[simulation.inspect().tick,simulation.commandRevision(),simulation.inspect().editorRevision,simulation.visitorView().open].join(':');if(recoveryKey!==recoveryReadKey){recoveryReadKey=recoveryKey;recoveryRead=simulation.recoveryView();}const nextRecovery=JSON.stringify(recoveryRead);if(nextRecovery!==previousRecovery){previousRecovery=nextRecovery;host.dispatchEvent(new CustomEvent('scene-recovery-change',{detail:recoveryRead}));}
    const money=simulation.economyView(),moneyKey=JSON.stringify(money);if(moneyKey!==previousEconomy){previousEconomy=moneyKey;placement?.refresh();host.dispatchEvent(new CustomEvent('scene-economy-change',{detail:money}));}
    if (disposed || lost) return;
    if (context?.isContextLost()) { notifyContextLoss(); return; }
    if(habitatDirty&&habitats){habitats.sync(simulation.snapshot().world);habitatDirty=false;}
    if(pathDirty&&paths){paths.sync(simulation.snapshot().world);picker?.refresh();pathDirty=false;}
    if(birdsDirty&&birds){const s=simulation.birdSnapshot();birds.sync(s.animals,s.habitats,s.width,s.height,simulationTimeMs);birdsDirty=false;announceBirds();}
    if(foodDirty){feeder?.sync(simulation.snapshot().world,foodPreview,simulation.foodView().canPlace);announceFood();foodDirty=false;}
    if(waterDirty){waterStation?.sync(simulation.snapshot().world,waterPreview,simulation.waterView().canPlace);announceWater();waterDirty=false;}
    if(perchDirty){const view=simulation.perchView();restKit?.sync(simulation.snapshot().world,perchPreview,view.canPlace);birds?.setPerchesVisible(!view.reachable&&!perchPreview);announcePerch();perchDirty=false;}
    restKit?.update(simulationTimeMs,simulation.perchView().exploring,motion.matches);
    if(visitorsDirty&&visitors){const v=simulation.visitorSnapshot();visitors.sync(v.visitors,v.width,v.height,v.tick,v.gate);visitorsDirty=false;announceVisitors();}
    const remainder=simulation.inspect().accumulatorMs;
    visitors?.update(remainder/100,simulationTimeMs+remainder,motion.matches);
    birds?.update(remainder/100,simulationTimeMs+remainder);
    diorama?.update(simulationTimeMs, motion.matches);
    renderer?.render(scene, macaw?.view().active&&!macaw.view().habitat?macaw.camera:camera);
    if (renderer) renderSubmissions++;
  }
  const loop = createFrameLoop(frames, time => { simulation.frame(time);macaw?.frame(time); render(); }, () => onFailure('render'));
  function updateRunning() {
    const shouldPause = disposed || lost || paused || document.hidden;
    const model=macaw?.view();
    simulation.setPaused(shouldPause||Boolean(model?.active));
    controls?.setEnabled(!shouldPause&&(!model?.active||model.habitat));
    picker?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    placement?.setEnabled(!shouldPause&&!model?.active&&!foodPreview&&!waterPreview&&!perchPreview);
    const stopped=shouldPause||Boolean(model?.active&&model.motionPaused);macaw?.setRunning(!stopped);
    if (stopped) loop.stop();
    else loop.start();
  }
  function resize() {
    if (disposed || lost || !renderer) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setSize(width, height, false);
    controls?.resize(width,height);macaw?.resize(width,height);
    render();
  }
  function onResize() {
    try { resize(); }
    catch { onFailure('render'); }
  }
  function onMotionChange(){if(motion.matches)macaw?.pauseForReducedMotion();updateRunning();}
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
    safe(() => habitats?.dispose());
    safe(() => paths?.dispose());
    safe(()=>feeder?.dispose());safe(()=>waterStation?.dispose());safe(()=>restKit?.dispose());
    safe(()=>birds?.dispose());safe(()=>visitors?.dispose());
    safe(()=>macaw?.dispose());host.removeEventListener('keydown',onStudioKey,true);
    safe(saveSession);
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
    scene.background = new Color('#edf3e5');
    scene.add(new AmbientLight('#e5f1dc', 1.7));
    const sun = new DirectionalLight('#fff1d6', 2.5);
    sun.position.set(-6, 10, 8);
    scene.add(sun);
    const initialWorld=simulation.snapshot().world;
    feeder=createFeederScene();worldLayer.add(feeder.group);waterStation=createWaterScene();worldLayer.add(waterStation.group);restKit=createPerchScene();worldLayer.add(restKit.group);
    birds=createAutonomousBirds();worldLayer.add(birds.group);visitors=createVisitorScene();worldLayer.add(visitors.group);
    diorama = createTropicalDiorama(initialWorld);
    geometries.push(...diorama.geometries); materials.push(...diorama.materials);
    worldLayer.add(diorama.group);
    habitats=createHabitatScene(diorama.catalog,(geometry,material)=>{geometries.push(geometry);materials.push(material);});worldLayer.add(habitats.group);
    paths=createPathScene(diorama.catalog);geometries.push(paths.geometry);materials.push(paths.material);worldLayer.add(paths.group);
    function announceHabitat(){announceEdit();const access=simulation.access();host.dataset.worldPathCount=String(access.pathTiles);host.dataset.worldConnected=String(access.connected);host.dataset.worldRouteCells=String(access.routeCells);host.dispatchEvent(new CustomEvent('scene-access-change',{detail:access}));const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:s.habitatCount,occupiedTiles:s.occupiedTiles}}));}
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
    },(proposal,operationId)=>{const result=proposal.kind==='path'?simulation.buildPath(proposal.anchor,placementCommand):simulation.buildHabitat(proposal.anchor,operationId,placementCommand);if(result.ok){placementCommand=simulation.commandRevision();saveSession();announceHabitat();return true;}return false;},kind=>simulation.purchaseReason(kind));
    geometries.push(...placement.geometries);materials.push(...placement.materials);worldLayer.add(placement.group);
    controls=mountCameraControls(host,canvas,camera,diorama.bounds,initialWorld,point=>{if(!macaw?.view().active){if(placement?.active())placement.pick(point);else picker?.pick(point);}},()=>placement?.active()?placement.command('cancel'):picker?.clear());
    macaw=createMacawStudio(()=>simulation.snapshot().world,view=>{birds?.setVisible(!view.active);worldLayer.visible=!view.active||view.habitat;host.dispatchEvent(new CustomEvent('scene-studio-change',{detail:view}));updateRunning();resize();},()=>motion.matches);scene.add(macaw.group);host.addEventListener('keydown',onStudioKey,true);
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
    guide:(command,revision)=>{
      if(disposed||paused||lost||document.hidden||macaw?.view().active||!placement)return;
      if(command==='cancel')placement.command('cancel');
      else if(command==='confirm'){const before=placement.inspect().placementConfirmations;placement.command('confirm',revision);if(placement.inspect().placementConfirmations>before)placement.command('cancel');}
      else{const view=simulation.onboardingView();if(command==='focus'){if(view.target){const w=simulation.snapshot().world;controls?.focus({x:view.target.x+.5-w.width/2,z:view.target.z+.5-w.height/2});}else controls?.command('reset');}
        else if(view.kind&&view.target&&view.affordable){controls?.setEnabled(false);controls?.setEnabled(true);foodPreview=false;waterPreview=false;perchPreview=false;foodDirty=true;waterDirty=true;perchDirty=true;picker?.clear();placementCommand=simulation.commandRevision();placement.guide(view.kind,view.target);const w=simulation.snapshot().world;controls?.focus({x:view.target.x+(view.kind==='habitat'?1:.5)-w.width/2,z:view.target.z+(view.kind==='habitat'?1:.5)-w.height/2});}}
      render();
    },
    claimMission:quote=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;const result=simulation.claimMission(quote);previousMission='';render();host.dispatchEvent(new CustomEvent('scene-mission-result',{detail:result}));},
    recoveryQuote:()=>{const v=simulation.recoveryView();host.dispatchEvent(new CustomEvent('scene-recovery-change',{detail:v}));return !disposed&&!paused&&!lost&&!document.hidden&&!macaw?.view().active&&v.low&&v.available?{command:v.command,key:v.key}:undefined;},
    recover:quote=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');picker?.clear();foodPreview=false;waterPreview=false;perchPreview=false;if(simulation.recover(quote)){habitatDirty=true;pathDirty=true;birdsDirty=true;foodDirty=true;waterDirty=true;perchDirty=true;visitorsDirty=true;saveSession();announceEdit();}render();},
    visitors:command=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;if(command==='focus'||command==='follow'){const w=simulation.snapshot().world,p=command==='follow'?simulation.visitorFocus():null;controls?.focus({x:(p?.x??w.gate.x+.5)-w.width/2,z:(p?.z??w.gate.z+.7)-w.height/2});}else if(command==='open'||command==='close'){simulation.visitors(command==='open');saveSession();}render();},
    perch:(command,revision=0)=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');picker?.clear();foodPreview=false;foodPreviewHabitat=null;foodDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;
      const h=simulation.snapshot().world.habitats[0];perchReason=null;
      if(command==='preview'){if(!h||simulation.perchView().exists)perchReason=h?'exists':'missing';else{perchPreview=true;perchPreviewHabitat=h.id;perchCommand=simulation.commandRevision();}}
      else if(command==='cancel'){perchPreview=false;perchPreviewHabitat=null;}
      else if(command==='confirm'&&(!perchPreview||h?.id!==perchPreviewHabitat)){perchPreview=false;perchReason='stale';}
      else{const action=command==='confirm'?'place':command==='remove'?'remove':null;if(action){const result=simulation.perch(action,revision,command==='confirm'?perchCommand:simulation.commandRevision());perchReason=result.ok?null:result.reason;if(result.ok){perchPreview=false;perchPreviewHabitat=null;saveSession();announceEdit();}}}
      perchDirty=true;updateRunning();render();announcePerch();},
    water:(command,revision=0)=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');picker?.clear();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;
      const h=simulation.snapshot().world.habitats[0];waterReason=null;
      if(command==='preview'){if(!h||simulation.waterView().exists){waterReason=h?'exists':'missing';}else{waterPreview=true;waterPreviewHabitat=h.id;waterCommand=simulation.commandRevision();}}
      else if(command==='cancel'){waterPreview=false;waterPreviewHabitat=null;}
      else if(command==='confirm'&&(!waterPreview||h?.id!==waterPreviewHabitat)){waterPreview=false;waterReason='stale';}
      else {const action=command==='confirm'?'place':command==='refill'?'refill':command==='remove'?'remove':null;if(action){const result=simulation.water(action,revision,command==='confirm'?waterCommand:simulation.commandRevision());waterReason=result.ok?null:result.reason;if(result.ok){waterPreview=false;waterPreviewHabitat=null;saveSession();announceEdit();}}}
      waterDirty=true;updateRunning();render();announceWater();},
    food:(command,revision=0)=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');picker?.clear();perchPreview=false;perchPreviewHabitat=null;perchDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;
      const h=simulation.snapshot().world.habitats[0];foodReason=null;
      if(command==='preview'){if(!h||simulation.foodView().exists){foodReason=h?'exists':'missing';}else{foodPreview=true;foodPreviewHabitat=h.id;foodCommand=simulation.commandRevision();}}
      else if(command==='cancel'){foodPreview=false;foodPreviewHabitat=null;}
      else if(command==='confirm'&&(!foodPreview||h?.id!==foodPreviewHabitat)){foodPreview=false;foodReason='stale';}
      else {const action=command==='confirm'?'place':command==='refill'?'refill':command==='remove'?'remove':null;if(action){const result=simulation.food(action,revision,command==='confirm'?foodCommand:simulation.commandRevision());foodReason=result.ok?null:result.reason;if(result.ok){foodPreview=false;foodPreviewHabitat=null;saveSession();announceEdit();}}}
      foodDirty=true;updateRunning();render();announceFood();},
    birds:command=>{if(disposed||paused||lost||document.hidden||macaw?.view().active)return;controls?.setEnabled(false);controls?.setEnabled(true);placement?.command('cancel');if(simulation.birds(command)){picker?.clear();saveSession();render();announceEdit();}},
    studio:(command,value)=>{if(disposed||paused||lost||document.hidden)return;try{if(command==='open'){perchPreview=false;perchPreviewHabitat=null;perchDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;placement?.command('cancel');picker?.clear();}macaw?.command(command,value);}catch{onFailure('render');}},
    camera: value => controls?.command(value),
    clearSelection:()=>picker?.clear(),
    placement:(command,revision)=>{if(macaw?.view().active)return;perchPreview=false;perchPreviewHabitat=null;perchDirty=true;foodPreview=false;foodPreviewHabitat=null;foodDirty=true;waterPreview=false;waterPreviewHabitat=null;waterDirty=true;if(command==='begin'||command==='begin-path'){placementCommand=simulation.commandRevision();picker?.clear();}placement?.command(command,revision);},
    quoteRemoval:target=>simulation.quoteRemoval(target),
    edit:(command,quote)=>{
      if(disposed||paused||lost||document.hidden||macaw?.view().active)return;
      placement?.command('cancel');
      const id=`edit-${crypto.randomUUID().replaceAll('-','')}`;
      const result=command==='undo'?simulation.undo(id,editCommand):quote?simulation.remove(quote,id):{ok:false as const,reason:'command' as const};
      if(result.ok){picker?.clear();saveSession();render();const a=simulation.access();host.dataset.worldPathCount=String(a.pathTiles);host.dataset.worldConnected=String(a.connected);host.dataset.worldRouteCells=String(a.routeCells);host.dispatchEvent(new CustomEvent('scene-access-change',{detail:a}));const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:s.habitatCount,occupiedTiles:s.occupiedTiles}}));}
      announceEdit(result.ok?null:result.reason,result.ok?(command==='undo'?'restored':'removed'):null);
    },
    setPaused(value) { paused = value; updateRunning(); },
    inspect: () => ({ canUndo:simulation.inspect().canUndo,editorRevision:simulation.inspect().editorRevision,disposed, lost, canvasAttached: canvas.isConnected, pendingFrames: loop.inspect().pendingFrames, geometries: renderer?.info.memory.geometries ?? 0, textures: renderer?.info.memory.textures ?? 0, programs: renderer?.info.programs?.length ?? 0, ownedMaterialsLive: materials.length - releasedMaterials+(visitors?.inspect().visitorOwnedMaterials??0)+(macaw?.inspect().macawOwnedMaterialsLive??0)+(birds?.inspect().birdOwnedMaterials??0)+(feeder?.inspect().feederOwnedMaterials??0)+(waterStation?.inspect().waterOwnedMaterials??0)+(restKit?.inspect().perchOwnedMaterials??0), drawCallsLastRender: renderer?.info.render.calls ?? 0, trianglesLastRender: renderer?.info.render.triangles ?? 0, renderSubmissions, bufferWidth: canvas.width, bufferHeight: canvas.height, pixelRatio: renderer?.getPixelRatio() ?? 0, cleanupErrors, simulationTick: simulation.inspect().tick, simulationGameTimeMs: simulation.inspect().gameTimeMs, simulationPaused: simulation.inspect().paused, simulationDisposed: simulation.inspect().disposed, simulationSubscribers: simulation.inspect().subscribers, simulationEvents, simulationStartTick,onboardingStep:['habitat','path','claim','done','blocked'].indexOf(readGuide().stage),onboardingRemaining:readGuide().remaining,onboardingAffordable:readGuide().affordable,missionCompleted:simulation.missionView().completed,missionRewardCoins:simulation.missionView().rewards,missionQ01Ready:simulation.missionView().rows[0].status==='ready', habitatCount:simulation.inspect().habitatCount, occupiedTiles:simulation.inspect().occupiedTiles, currency:simulation.inspect().currency,maintenancePeriod:simulation.inspect().maintenancePeriod,maintenanceDue:simulation.inspect().maintenanceDue,economyGrants:simulation.inspect().economyGrants,economySpent:simulation.inspect().economySpent,economyRefunds:simulation.inspect().economyRefunds,ledgerEntries:simulation.inspect().ledgerEntries,journalRetained:simulation.inspect().journalRetained,journalArchived:simulation.inspect().journalArchived,journalCompactions:simulation.inspect().journalCompactions,commandRevision:simulation.inspect().commandRevision,retiredVisitorThrough:simulation.inspect().retiredVisitorThrough,retiredOpenCount:simulation.inspect().retiredOpenCount,recoveryHabitatTick:simulation.inspect().recoveryHabitatTick,recoveryHabitatNonce:simulation.inspect().recoveryHabitatNonce,recoveryGrants:simulation.inspect().recoveryGrants,recoveryRations:simulation.inspect().recoveryRations,recoveryLastRation:simulation.inspect().recoveryLastRation, perchExists:simulation.perchView().exists,perchRevision:simulation.perchView().revision,perchResting:simulation.perchView().resting,perchExploring:simulation.perchView().exploring,perchPreview,...restKit?.inspect(),waterStock:simulation.waterView().stock,waterBowl1:simulation.waterView().portions[0],waterBowl2:simulation.waterView().portions[1],waterRevision:simulation.waterView().revision,waterExists:simulation.waterView().exists,waterPreview,...waterStation?.inspect(),foodStock:simulation.foodView().stock,foodBowl1:simulation.foodView().portions[0],foodBowl2:simulation.foodView().portions[1],foodRevision:simulation.foodView().revision,foodExists:simulation.foodView().exists,foodPreview,...feeder?.inspect(),...simulation.visitorInspect(),visitorCount:simulation.visitorView().active,visitorQueued:simulation.visitorView().queued,visitorWalking:simulation.visitorView().walking,visitorViewing:simulation.visitorView().viewing,visitorReturning:simulation.visitorView().returning,visitorViewed:simulation.visitorView().viewedTotal,visitorOpen:simulation.visitorView().open,visitorTotal:simulation.visitorView().total,visitorNextSerial:simulation.snapshot().visitorFlow.nextSerial,visitorCooldown:simulation.snapshot().visitorFlow.cooldownTicks,...visitors?.inspect(),...simulation.birdInspect(),placedBirds:simulation.birdsView().placed,...birds?.inspect(),...macaw?.inspect(),...habitats?.inspect(), ...paths?.inspect(), pathTiles:simulation.inspect().pathTiles,reachablePathTiles:simulation.inspect().reachablePathTiles,connectedHabitats:simulation.inspect().connectedHabitats,routeCells:simulation.inspect().routeCells, orthographicCamera: camera.isOrthographicCamera, ...diorama?.inspect(), ...controls?.inspect(), ...picker?.inspect(), ...placement?.inspect() }),
  };
}
