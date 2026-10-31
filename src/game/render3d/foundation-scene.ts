import {releaseLiveContext} from './webgl-cleanup.ts';
import {createHabitatScene} from './habitat-scene.ts';
import type {SanctuarySessionState} from '../core/session-state.ts';
import { createPlacementPreview } from './placement-preview.ts';
import { createScenePicker } from './scene-picking.ts';
import { AmbientLight, BufferGeometry, Color, DirectionalLight, OrthographicCamera, Scene, SRGBColorSpace, WebGLRenderer, type Material } from 'three';
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

/** Fixed-tick sanctuary with authoritative habitat construction; later animal/economy loop pending. */
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
  const camera = new OrthographicCamera();
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = options.frames ?? { request: (fn) => requestAnimationFrame(fn), cancel: (id) => cancelAnimationFrame(id) };
  let diorama: ReturnType<typeof createTropicalDiorama> | undefined;
  let controls: ReturnType<typeof mountCameraControls> | undefined;
  let picker: ReturnType<typeof createScenePicker> | undefined;
  let placement:ReturnType<typeof createPlacementPreview>|undefined;
  let habitats:ReturnType<typeof createHabitatScene>|undefined;
  let habitatDirty=true;
  const simulation = createSimulation(options.stateStore?.read());
  const simulationStartTick=simulation.inspect().tick;
  let simulationTimeMs = simulation.inspect().gameTimeMs;
  let simulationEvents = 0;
  const unsubscribe = simulation.subscribe(event => {
    simulationTimeMs = event.gameTimeMs;
    if (event.type === 'tick') simulationEvents++;
    if(event.type==='habitat-built')habitatDirty=true;
  });

  function notifyContextLoss() {
    if (disposed || lost) return;
    lost = true;
    simulation.setPaused(true);
    loop.stop();
    onFailure('context-lost');
  }
  function render() {
    if (disposed || lost) return;
    if (context?.isContextLost()) { notifyContextLoss(); return; }
    if(habitatDirty&&habitats){habitats.sync(simulation.snapshot().world);habitatDirty=false;}
    diorama?.update(simulationTimeMs, motion.matches);
    renderer?.render(scene, camera);
    if (renderer) renderSubmissions++;
  }
  const loop = createFrameLoop(frames, time => { simulation.frame(time); render(); }, () => onFailure('render'));
  function updateRunning() {
    const shouldPause = disposed || lost || paused || document.hidden;
    simulation.setPaused(shouldPause);
    controls?.setEnabled(!shouldPause);
    picker?.setEnabled(!shouldPause);
    placement?.setEnabled(!shouldPause);
    if (shouldPause) loop.stop();
    else loop.start();
  }
  function resize() {
    if (disposed || lost || !renderer) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setSize(width, height, false);
    controls?.resize(width,height);
    render();
  }
  function onResize() {
    try { resize(); }
    catch { onFailure('render'); }
  }
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
    safe(() => options.stateStore?.write(simulation.snapshot()));
    unsubscribe();
    simulation.dispose();
    canvas.removeEventListener('webglcontextlost', onLost);
    document.removeEventListener('visibilitychange', updateRunning);
    window.removeEventListener('resize', onResize);
    motion.removeEventListener('change', updateRunning);
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
    diorama = createTropicalDiorama(initialWorld);
    geometries.push(...diorama.geometries); materials.push(...diorama.materials);
    scene.add(diorama.group);
    habitats=createHabitatScene(diorama.catalog,(geometry,material)=>{geometries.push(geometry);materials.push(material);});scene.add(habitats.group);
    function announceHabitat(){const s=simulation.inspect();host.dataset.builtHabitats=String(s.habitatCount);host.dataset.occupiedTiles=String(s.occupiedTiles);host.dispatchEvent(new CustomEvent('scene-habitat-change',{detail:{count:s.habitatCount,occupiedTiles:s.occupiedTiles}}));}
    announceHabitat();
    picker=createScenePicker(diorama.catalog,camera,()=>canvas.getBoundingClientRect(),identity=>{
      if(identity)host.dataset.selectedId=identity.id;else delete host.dataset.selectedId;
      host.dispatchEvent(new CustomEvent('scene-selection-change',{detail:identity}));
    });
    geometries.push(...picker.geometries);materials.push(...picker.materials);scene.add(picker.group);
    placement=createPlacementPreview(()=>simulation.snapshot().world,diorama.catalog,camera,()=>canvas.getBoundingClientRect(),view=>{
      host.dataset.planActive=String(view.active);host.dataset.planReason=view.reason;
      host.dataset.planAnchor=view.proposal?`${view.proposal.anchor.x},${view.proposal.anchor.z}`:'';
      host.dataset.planConfirmed=view.confirmed?`${view.confirmed.anchor.x},${view.confirmed.anchor.z}`:'';
      host.dispatchEvent(new CustomEvent('scene-placement-change',{detail:view}));
    },(anchor,operationId)=>{const result=simulation.buildHabitat(anchor,operationId);if(result.ok){options.stateStore?.write(simulation.snapshot());announceHabitat();return true;}return false;});
    geometries.push(...placement.geometries);materials.push(...placement.materials);scene.add(placement.group);
    controls=mountCameraControls(host,canvas,camera,diorama.bounds,initialWorld,point=>placement?.active()?placement.pick(point):picker?.pick(point),()=>placement?.active()?placement.command('cancel'):picker?.clear());
    canvas.addEventListener('webglcontextlost', onLost);
    host.append(canvas);
    resize(); // Ready means a real first render completed, not merely an import.
    if (lost || context.isContextLost()) throw new PreviewFailure('context-lost');
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onResize);
      observer.observe(host);
    } else window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', updateRunning);
    motion.addEventListener('change', updateRunning);
    updateRunning();
  } catch (error) {
    dispose();
    throw error;
  }

  return {
    dispose,
    camera: value => controls?.command(value),
    clearSelection:()=>picker?.clear(),
    placement:(command,revision)=>{if(command==='begin')picker?.clear();placement?.command(command,revision);},
    setPaused(value) { paused = value; updateRunning(); },
    inspect: () => ({ disposed, lost, canvasAttached: canvas.isConnected, pendingFrames: loop.inspect().pendingFrames, geometries: renderer?.info.memory.geometries ?? 0, textures: renderer?.info.memory.textures ?? 0, programs: renderer?.info.programs?.length ?? 0, ownedMaterialsLive: materials.length - releasedMaterials, drawCallsLastRender: renderer?.info.render.calls ?? 0, trianglesLastRender: renderer?.info.render.triangles ?? 0, renderSubmissions, bufferWidth: canvas.width, bufferHeight: canvas.height, pixelRatio: renderer?.getPixelRatio() ?? 0, cleanupErrors, simulationTick: simulation.inspect().tick, simulationGameTimeMs: simulation.inspect().gameTimeMs, simulationPaused: simulation.inspect().paused, simulationDisposed: simulation.inspect().disposed, simulationSubscribers: simulation.inspect().subscribers, simulationEvents, simulationStartTick, habitatCount:simulation.inspect().habitatCount, occupiedTiles:simulation.inspect().occupiedTiles, currency:simulation.inspect().currency, ...habitats?.inspect(), orthographicCamera: camera.isOrthographicCamera, ...diorama?.inspect(), ...controls?.inspect(), ...picker?.inspect(), ...placement?.inspect() }),
  };
}
