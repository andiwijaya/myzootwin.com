# M0-05 — Lazy 3D foundation and recoverable canvas

Status: implementation and relevant verification complete, 2026-10-31 UTC. The evidence commit is referenced by the subsequent living-PRD completion record. Local only; no production deployment, push or Actions.

## Player-visible result

`/play/` keeps its journal navigation, truthful disabled future Play/Continue, guide, settings and concept illustration. **Open 3D preview** lazily loads a genuine Three.js WebGL2 scene: an original hexagonal plinth, ring and rotating marker. Copy explicitly calls it a renderer foundation; no sanctuary world, animals, controls, simulation or gameplay is claimed. Closing returns to the illustration. EN/ID critical loading, ready, unsupported, context-loss, initialization/render and import-error states all have visible text and usable recovery controls. The MIT notice is retained and linked.

## Lifecycle and integration

- `game/render3d/preview-controller.ts` owns one session and generation token. Late imports after close/unmount never mount; failure disposes the old session before retry.
- `frame-loop.ts` owns one visual RAF chain with stale-callback guards. No simulation loop is introduced. M0-06 can consume a separate deterministic state/tick contract later.
- `foundation-scene.ts` creates a real first frame before ready, catches initialization/render/context failure, resizes to its host, caps pixel ratio at 1.5, and pauses on hidden document, reduced motion or vital entry dialogs. Three.js supports WebGL2; unsupported WebGL has a non-canvas illustration fallback.
- Disposal stops RAF, removes owned listeners, disconnects resize observation, disposes all three geometries and five materials plus renderer/context, and removes the canvas. Repeat disposal and stale handles cannot affect a replacement mount. Pagehide closes resources; history return can open a fresh preview.
- The renderer import is deferred until Open. No global debug flag, public failure query or fixture route ships in `dist`. The local QA harness is under `tests/browser`; it imports the actual modules using the existing Vite dependency and explicit constructor/context/loader ports.

## Executed evidence

`qa/m0-05/verification.json`, `browser-results.json`, test logs and screenshot manifest contain the observations. Commands:

```powershell
npm run check
node --experimental-strip-types --test tests/entry-preferences.test.mjs tests/preview-lifecycle.test.mjs
npm run build
```

Final results: **21/21 unit tests**, Astro check **19 files, zero errors/warnings/hints**, **9 built pages**. Tests cover session ownership/lazy cancellation, retry, unsupported/init faults, context failure, pause, stale callback rejection and loop disposal. The first combined regression helper used a pre-M0-04 layout baseline and correctly failed on the prior approved navigation changes; only its comparison reference was corrected to completed M0-04 `b9a6e32`. Successful final build/test logs were reused; the corrected local route/source checks passed.

Native positive testing used the supported isolated in-app browser against the actual built `/play/`: real WebGL canvas visible, EN/ID, keyboard Open, Close/reopen, guide/settings/Escape, journal navigation/back and fresh reopening. Final product console contained **zero captured warn/error messages**. Requested/DOM-verified product viewports: **1366×768, 360×780 portrait, 780×360 landscape**. Canvas resized to the host; portrait/landscape document widths stayed within viewport. Screenshot pixels and CSS viewports are separately recorded. An override initially affected another active tab; that attempt is labelled superseded desktop data and the real mobile captures were repeated with verified DOM dimensions.

The local harness has **38 recorded lifecycle observations**, including five native Open/Close cycles and three remount/unmount/stale-dispose cycles. Each sample kept maximum active sessions/RAF at one. Closed/unmounted/failed states had zero canvas/session/pending RAF; inspected released sessions reported zero geometries and zero cleanup errors. Explicit native pause reduced pending RAF to zero and resume restored exactly one.

Negative tests are **injected**, not evidence of a physically unsupported phone: null WebGL context, renderer-constructor throw after native context allocation, loader rejection, delayed import cancellation, `WEBGL_lose_context` extension, and render-fault callback. The actual RAF render-throw path is covered by unit tests. All displayed honest fallbacks; native context-loss Retry created one fresh canvas; import failure **Reload page** performed an actual reload. ID loading/unsupported/context loss and EN import fallback screenshots are retained. GPU-driver shader failure was not physically induced; the explicit shader-error hook is code-reviewed, not separately claimed as hardware-tested.

Eight original journal URLs returned local 200 and matched saved M0-02 title/canonical/H1 evidence. `/play` and `/play/` both served the actual entry canonical; all nine sitemap URLs remained. Original page/layout sources, analytics source and all three original public files are unchanged from completed M0-04. Only a new Three MIT notice is added under public. No public-site retry was made after the earlier Python HTTP 403.

## Dependencies and bounded payload

Pinned `three` and `@types/three` **0.187.0** were installed from npm with lifecycle scripts disabled. Eight additions; no existing package version changed or was removed. Package lock license metadata is recorded; the directly used runtime MIT notice matches installed bytes. No type-only physics/compression packages are imported into the runtime scene.

Final generated JavaScript: entry **13,475 bytes** (Python gzip level 9 **5,068**); lazy foundation **528,598 bytes** (gzip level 9 **131,488**). Vite's default compression estimate differs slightly and is retained in its build log. Vite warns that the lazy raw chunk exceeds 500 kB; the warning is recorded and not suppressed. The HTML contains no eager renderer script/modulepreload. These are local bundle measurements, not first-play network/FPS acceptance or the full future game payload.

## Limits and cleanup

No physical Android, true-touch, Safari/iOS, GPU hardware identity, target FPS, network startup or 15-minute memory-soak pass. Renderer ownership/resource counters do not prove whole-process memory stability. No game/save/animal/missions or full-localization gate is complete. Existing BASE-01 animal-heading overflow and BASE-02 homepage quote contrast remain recorded and unchanged. M0-01 exact external Cloudflare source/build/automatic-deploy settings remain pending behind unavailable authenticated dashboard access; production release stays gated.

Seven screenshots total **645,640 bytes**; no build/node_modules/video is committed. Both owned loopback previews (4321/4322) were stopped and zero listeners verified; three owned tabs closed, viewport reset. Existing media, macaw study, immutable source transcriptions and rollback history retained. Next item after parent review: **M0-06 typed entities/fixed tick/event/save-schema contract**.

References checked for API behavior: [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html) (WebGL2, shader-error hook, dispose/context-loss), installed package source/types and unchanged MIT notice. No new third-party art agreement was accepted.
