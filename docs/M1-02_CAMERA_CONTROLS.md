# M1-02 — Bounded isometric camera controls

Verified locally on2026-10-31 UTC. Exact acceptance: mouse/touch pan/zoom, clamped, with no accidental page scrolling or camera escape. Implementation/evidence commit: `9bc663d346364785ff4b0532de44da50810e337d` (local). Verified V1 progress9/51 (17.65%); M0-01 remains pending. No production changes; M1-03 picking/identity panels and all later gameplay remain unimplemented.

Mouse drag pans, wheel zooms toward the cursor; one-finger drag and two-finger pinch share a Pointer Events grammar. Zoom stays1×–3×. Overview fits the whole scene and locks pan; zoom progressively exposes travel. A ground-plane focus bounded inside the actual12×10 map prevents an empty-world escape while preserving the isometric angle. Zoomed views intentionally crop parts of the island. A six-CSS-pixel threshold separates taps from drags; pinch/lift/cancel cannot create a future pick. Optional tap callback is a seam for M1-03, not an implemented picking feature.

Keyboard: focus the world, arrows pan, +/− zoom, Home restores overview, Escape cancels a gesture. Ctrl/Meta/Alt browser shortcuts and input on toolbar/dialog controls are not intercepted by the world. Three44px-minimum buttons provide zoom-in, zoom-out and overview with a zoom percentage, ID/EN labels and visible instructions. Help explicitly says zoom in before dragging; an initially ambiguous hint was clarified and all final-source checks repeated.

Only the canvas has touch-action:none and a non-passive wheel handler; page scrolling outside it remains normal. Pointer capture, pointercancel/lost capture, mouse-button loss, blur, pause/background, resize, remount/unmount and disposal clear held pointers. Navigation code owns no RAF/timers; the original single RAF/core subscription is retained. Modules separate pure navigation, tap/drag/pinch grammar and DOM/camera adapter. Camera state is a view preference only, not a game save or simulated world mutation.

## Evidence from the final source

Run `20261031T193245Z-6247a181`; source `f6691e2f0876eb84095331f062b5ff72fb8cd6531336a39260d882240bbe4642`; build `4fd75132383c555d57a19f17d1004019ac22156ddf982170970235ddad0e3fc5`. Run-start HEAD was the preceding M1-01 checkpoint86811ed; exact changed source/build identities establish the tested implementation.

- `npm run qa:local`:59/59 unit/integration tests,0 fail/skips/todos. Six new tests include2,000 adversarial input sequences, zoom-anchor invariance/invalid inputs, tap/pinch/lift/cancel, the production DOM adapter with EventTarget stubs for event ownership/disposal, and Three.js center-ray intersections at pan limits across target aspect ratios. Astro check43 files:0 errors/warnings/hints; build9 pages; all9 URLs/canonical/title/H1/sitemap regressions PASS.
- Native approved-runtime mouse wheel/drag/ArrowRight/Home changed camera as expected while canvas page scroll remained unchanged. Home returned1×/zero pan. ArrowRight on the Zoom button preserved the view; scrolling outside the world moved the page without changing camera zoom. Actual data: [native input](qa/m1-02/native-input.json).
- Labelled local harness: nine injected PointerEvent/WheelEvent/KeyboardEvent integration scenarios at1366×768,360×780 and780×360,27 total PASS. Tap threshold, one-finger drag, two-finger pinch, pointercancel, lost capture, wheel min/max and default prevention, UI isolation, keyboard/Escape, pause input rejection. Desktop→portrait and portrait→landscape each began with one held injected pointer and ended with zero after actual layout/ResizeObserver. [Integration/orientation snapshots](qa/m1-02/camera-integration.json). These are injected touch events, not native OS pinch or physical Android evidence.
- Actual built product pixels reviewed at1366×768/1920×1080/360×780/780×360, plus desktop panned≈212% and portrait156% detail. Six JPEGs554,480 bytes, SHA/dimensions in [manifest](qa/m1-02/screenshot-manifest.json). Full world fits overview; close view remains readable; toolbar/help remain separate, no document overflow. Mobile viewport emulation is not physical-touch testing.
- Pause holds fixed tick/event/visual time and rejects camera Zoom; resume advances. Context loss and injected render error show recovery UI; retries create one fresh world. Remount/unmount during held gesture and stale-handle disposal passed. Eight close/remount/unmount snapshots have cameraPointers0/cameraControlsDisposed true, canvas/RAF/subscriber/live GPU geometries/textures/programs/materials0, cleanupErrors0; max1 session/RAF. [Raw probes/lifecycle](qa/m1-02/world-performance.json).
- Settings/ID persistence, keyboard Open, journal `/animals/`, Back and reload passed; return/reload have0 canvases and correct `/play/` canonical. Native product console warn/error log empty, limit200 uncapped. All existing journal source/content/SEO/media preserved; BASE-01/02 unchanged.
- `npm run qa:verify`:PASS/exit0 at19:40:32 UTC with final source/build and all six required cases plus three additional visual cases. Tabs30/31 closed, viewport reset, owned preview graceful stop/exit0; ports4321/4322 free. Earlier owned tabs27–29 were also closed. Browser actions/visual review use the approved runtime, not a standalone automated driver.

Raw [QA report](qa/m1-02/report.json), [browser receipt](qa/m1-02/browser-receipt.json), unit/check/build logs and [repeatable camera recipe](LOCAL_QA.md) retained. Initial source run192453 remained formal-browser UNRUN after hint copy changed. Initial resize readout was throttled250ms; it was not accepted until actual DOM dimensions and a later refreshed diagnostic established the correct orientation. No stale or preliminary result was relabelled as a final-source pass.

## Performance and artifact comparison

| Same basis | M1-01 | M1-02 |
|---|---:|---:|
| Known shell raw bytes |35,802|39,125|
| First preview-open same-origin raw bytes |579,339|588,643|
| Same critical set gzip9 estimate |149,821|152,958|
| Lazy renderer raw bytes |543,537|549,518|
| Triangles / draw calls |4,128/6|4,128/6|
| Active geometries/materials/programs/engine textures |6/6/4/1|6/6/4/1|

Known initial-preview increase9,304 raw/3,137 gzip-estimate bytes, with no new dependency/model/texture/audio. Full dist19 files/3,654,589 raw bytes still includes the original3MB journal hero. Lazy chunk>500kB warning remains visible. Critical set excludes remote fonts/incidental icons/analytics; this is not measured network transfer or full-game payload certification.

Four idle five-second overview probes use the same instrumented local fixture and small panel buffers504×350,496×350,270×250,285×250 at emulated DPR≈1. Each observed about300 callbacks (at most300 retained samples) and20 readout writes; callbackHz≈60; synchronous JS/core/render-submit p95 respectively0.3/0.4/0.4/0.5ms. M1-01 p95 was0.8/1.1/0.9/0.9ms. Host scheduling, JIT/caching and instrumentation differ; the lower numbers do not prove a performance improvement, actual presented FPS or GPU timing. This probe measures idle frame callbacks, not native-gesture latency. Native gesture response was functionally/visually reviewed without a latency claim.

Optional post-close legacy heap13,886,150–16,348,272 bytes fluctuated (prior13,182,293–15,854,500). Potentially shared/quantized; no forced GC, retained/GPU bytes,15-minute soak or leak-free proof. Actual owned counters return0.

Two old generated runs archived in full:27 files/270,293-byte ZIP; CRC and every entry SHA verified before owner/root-checked prune. Latest3 cache runs retained. Source, original/reusable art, immutable PRD transcriptions, historical receipts and Git rollback preserved. Folder-specific -text protects exact hashed QA bytes. Screenshots and selected small JSON/log receipts only; no dist/dependencies/unbounded videos committed.

## Limits and next

Physical Android/true pinch/Safari/iOS, actual FPS/GPU/network/long-session gates remain UNRUN. No picking/placement/habitat/gameplay/save claim. M0-01 exact external Cloudflare configuration gap remains pending; no login/grants/Actions/push/deploy or public403 retry. Next: **M1-03 scene picking and object/tile identity panel**, not started.

API references used: [W3C Pointer Events3](https://www.w3.org/TR/pointerevents3/) for capture/cancel/touch-action and [Three.js OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html) for projection/zoom. No external art rights assumed or agreement accepted.
