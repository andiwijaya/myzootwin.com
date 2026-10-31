# M1-01 — Tropical Creek Sanctuary diorama

Verified locally on 2026-10-31 UTC. Scope is the exact M1-01 criterion: a small low-poly tropical diorama with land, creek, trees and entrance gate in an isometric view, inspected in actual desktop/mobile browser pixels. Implementation/evidence commit is recorded in the living PRD completion record after the local checkpoint exists. No production changes.

The old diagnostic plinth/marker/ring is replaced by an original code-authored raised soil island, open grass lawn, sandy creek bed, blue water and subtle glints, six palms, four broadleaf trees, rocks/reeds, soft polygon contact shade, and a terracotta-roofed entrance. Colors, silhouettes and perimeter planting form one coherent scene. The actual initial typed world supplies all120 terrain cells, its8 creek cells and gate position; rendering does not alter the state. A fixed orthographic 3/4 camera fits the actual scene bounds at each panel aspect ratio. No gestures, placement, habitat, visitors, animal or gameplay feature is claimed.

Geometry is assembled into six static vertex-color batches. No art/models/textures/audio downloaded, no new packages or asset agreement. The original procedural source and provenance are in [asset manifest](ASSET_MANIFEST.json), [world builder](../src/game/render3d/tropical-diorama.ts) and [camera fit](../src/game/render3d/isometric-camera.ts). Existing journal media and macaw study remain untouched. The six palms/four trees are decorative dressing, not persisted player structures; later placement/occupancy work must reserve scenery/banks or reconcile dressing before allowing overlap. Actual path graph and habitats remain empty apart from the existing gate tile.

The established single RAF advances the deterministic core and renders it. Ambient glints read the same fixed simulation time through the event subscription; reduced motion freezes the glints while preserving simulation semantics. ID/EN canvas description, caption and ready text describe a read-only world. Play/Continue remain truthfully unavailable until their features exist. Existing lazy loading, ready/error/unsupported, retry, pause and lifecycle ownership remain in place.

## Final-source evidence

Run `20261031T190354Z-32c89857`; source `e4e769565d090a4f48839db0df046cf2cde301b1c1a80f39adfeea69e2a60bbe`; build `19958b7e26a0687058a53dc09fad53c42003154ac788b57f7dd537713a4e0f8a`. Run-start HEAD was the preceding M0-08 checkpoint; the exact changed source/build identities above establish what was tested.

- `npm run qa:local`:53/53 tests,0 failures/skips/todos; Astro check38 files,0 errors/warnings/hints; build9 pages; all9 direct URLs, canonical/title/H1/sitemap baseline regression PASS. New tests verify finite/reproducible geometry, initial-state non-mutation, every projected bounding-box corner within frame across five aspect ratios, fixed-time water and reduced-motion behavior.
- Approved isolated in-app browser: actual built desktop1366×768 and1920×1080, ID portrait360×780 and landscape780×360 screenshots visually inspected. Island/tree/gate/creek recognizable, complete bounds visible, labels/buttons legible, no horizontal document overflow on `/play/`. Four exact JPEGs335,055 bytes with SHA/dimensions. Viewport emulation, not a physical Android or touch test.
- Native lifecycle: tick/event/visual time agree; pause holds; resume advances; maximum one session/RAF/subscriber. Injected `WEBGL_lose_context` produces a clear error with canvas/subscriber removal; actual Retry restores world. Additional injected render failure/retry, open-panel remount and stale prior-handle disposal passed. Eight recorded closed/remounted snapshots: canvas/live GPU geometries/textures/programs/owned materials/RAF/subscribers all0, cleanupErrors0. Last-render draw/triangle counters remain historical after disposal, not live ownership.
- Product Settings language persistence, keyboard Enter to open, journal `/animals/` navigation, Back and reload passed; return/reload have0 canvases and correct `/play/` canonical. Native product console warn/error capture empty, limit200 uncapped. Existing BASE-01/02 journal issues retained, no new journal edits.
- `npm run qa:verify`:PASS/exit0 after tabs25/26 closed, viewport reset and owned PTY server graceful stop/exit0; both4321/4322 independently checked free by runner. Browser interaction/visual judgement is through the approved runtime; automated receipt consistency does not turn this into an unattended driver claim.

Raw [QA report](qa/m1-01/report.json), [browser receipt](qa/m1-01/browser-receipt.json), [screenshots](qa/m1-01/screens/), [resource/probe snapshots](qa/m1-01/world-performance.json), exact unit/check/build logs and screenshot manifest are retained. Early QA attempts used a stale tab helper, wrong-language selectors, or a viewport attached to a different active tab. No app change was caused; current DOM controls/dimensions were inspected, corrected, and the final-source cases repeated. Preliminary run remains UNRUN for formal browser verification; never relabelled as a pass.

## Comparison with M0-08

| Same measurement basis | M0-08 | M1-01 |
|---|---:|---:|
| Shell raw bytes |35,624|35,802|
| First preview-open known same-origin raw bytes |575,583|579,339|
| Gzip-level9 estimate, same critical set |147,861|149,821|
| Lazy renderer raw bytes |539,959|543,537|
| Rendered triangles |352|4,128|
| Draw calls |5|6|
| Active geometries / owned materials / programs |3/5/1|6/6/4|
| Engine-reported textures |1|1|

First-open increase3,756 raw and1,960 gzip-estimate bytes. Full dist19 files/3,645,285 raw bytes includes original3MB journal hero. The lazy Three chunk still emits Vite's>500kB warning; it is not hidden or certified optimized. Engine texture count is not an external art download. No game art payload beyond bundled code.

Four visible five-second instrumented-source probes, same tiny entry panels and emulated DPR≈1: buffers504×350,496×350,270×250,285×250. Each observed300–301 RAF callbacks and20 QA readouts; callbackHz≈60; synchronous JS/core/render-submit p95 respectively0.8/1.1/0.9/0.9ms. M0-08 p95 was1.3/0.9/0.8/0.8ms; variation is not evidence of an improvement/regression in actual GPU presentation. Actual presented FPS/GPU time remain UNMEASURED; dev-fixture instrumentation, host/browser scheduling and small canvas differ from a future full gameplay scene. No physical Android≥30FPS, desktop≥60FPS, network first-interaction,20MB full-game or15-minute soak pass claimed.

Legacy post-close heap observations13,182,293–15,854,500 bytes fluctuated (M0-08:11,783,628–15,075,120). Potentially shared/quantized, no forced GC, no retained GPU memory or leak-free proof. Actual ownership counters returned0; retained-memory/long-session gates remain later work.

Two old generated QA runs archived in full:27 files/270,084 compressed bytes; ZIP CRC and every entry SHA checked before existing owner/root-checked prune. Three latest runs remain. Source, original/reusable media, study, immutable PRD transcriptions, previous documentation receipts and Git rollback preserved. The report and four small screenshots are curated; no dependency/build cache committed.

## Limits and next

M0-01 exact external Cloudflare settings remain pending; no login/new permissions attempted, no public403 retry. No push/deploy/Actions. Physical Android, touch gestures, Safari/iOS, full gameplay, save/Continue, true FPS/network/soak remain untested future gates. **Next: M1-02 clamped mouse/touch pan and zoom**, not started. Do not count later controls/building/animals/gameplay as completed by this scene.
