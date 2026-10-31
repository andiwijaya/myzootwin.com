import { AmbientLight, Color, CylinderGeometry, DirectionalLight, Mesh, MeshStandardMaterial, OctahedronGeometry, PerspectiveCamera, Scene, SRGBColorSpace, TorusGeometry, WebGLRenderer } from 'three';
import { createFrameLoop, type FrameDriver } from './frame-loop';
import { PreviewFailure, type PreviewFailureKind, type PreviewSession } from './preview-controller';

interface FoundationOptions {
  frames?: FrameDriver;
  createContext?: (canvas: HTMLCanvasElement) => WebGL2RenderingContext | null;
  createRenderer?: (canvas: HTMLCanvasElement, context: WebGL2RenderingContext) => WebGLRenderer;
}

/** A renderer workbench only: no sanctuary world, animal proxy or simulation. */
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
  let observer: ResizeObserver | undefined;
  const geometries: Array<CylinderGeometry | OctahedronGeometry | TorusGeometry> = [];
  const materials: MeshStandardMaterial[] = [];
  const scene = new Scene();
  const camera = new PerspectiveCamera(38, 1, .1, 30);
  camera.position.set(3.1, 2.6, 3.5);
  camera.lookAt(0, .12, 0);
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frames = options.frames ?? { request: (fn) => requestAnimationFrame(fn), cancel: (id) => cancelAnimationFrame(id) };
  let marker: Mesh | undefined;

  function notifyContextLoss() {
    if (disposed || lost) return;
    lost = true;
    loop.stop();
    onFailure('context-lost');
  }
  function render(time = 0) {
    if (disposed || lost) return;
    if (context?.isContextLost()) { notifyContextLoss(); return; }
    if (marker && !motion.matches) marker.rotation.y = time * .00025;
    renderer?.render(scene, camera);
  }
  const loop = createFrameLoop(frames, render, () => onFailure('render'));
  function updateRunning() {
    if (disposed || lost || paused || document.hidden || motion.matches) loop.stop();
    else loop.start();
  }
  function resize() {
    if (disposed || lost || !renderer) return;
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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
    canvas.removeEventListener('webglcontextlost', onLost);
    document.removeEventListener('visibilitychange', updateRunning);
    window.removeEventListener('resize', onResize);
    motion.removeEventListener('change', updateRunning);
    observer?.disconnect();
    for (const geometry of geometries) safe(() => geometry.dispose());
    for (const material of materials) safe(() => material.dispose());
    scene.clear();
    if (renderer) {
      safe(() => renderer!.dispose());
      safe(() => renderer!.forceContextLoss());
    } else {
      safe(() => context?.getExtension('WEBGL_lose_context')?.loseContext());
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
    scene.add(new AmbientLight('#fff9e9', 2));
    const sun = new DirectionalLight('#fff6d8', 3);
    sun.position.set(-2, 5, 3);
    scene.add(sun);
    const makeMaterial = (colour: string) => { const m = new MeshStandardMaterial({ color: colour, roughness: .9, metalness: 0 }); materials.push(m); return m; };
    const baseGeometry = new CylinderGeometry(1.15, 1.15, .18, 6);
    geometries.push(baseGeometry);
    const base = new Mesh(baseGeometry, [makeMaterial('#8ba675'), makeMaterial('#b8d292'), makeMaterial('#789466')]);
    base.rotation.y = Math.PI / 6;
    scene.add(base);
    const markerGeometry = new OctahedronGeometry(.29, 0);
    geometries.push(markerGeometry);
    marker = new Mesh(markerGeometry, makeMaterial('#e3ac47'));
    marker.position.y = .48;
    scene.add(marker);
    const ringGeometry = new TorusGeometry(.43, .025, 5, 32);
    geometries.push(ringGeometry);
    const ring = new Mesh(ringGeometry, makeMaterial('#fff1c9'));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = .11;
    scene.add(ring);
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
    setPaused(value) { paused = value; updateRunning(); },
    inspect: () => ({ disposed, lost, canvasAttached: canvas.isConnected, pendingFrames: loop.inspect().pendingFrames, geometries: renderer?.info.memory.geometries ?? 0, cleanupErrors }),
  };
}
