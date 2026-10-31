# M1-03 — Tile and scenery picking

Verified locally on2026-10-31 UTC. Exact scope: select a visible tile/object by accurate mouse/touch raycast and show its identity. Implementation/evidence commit: `161bb94690b9542ed222d75372bb8a94a7f65c72` (local). Verified V1 progress10/51 (19.61%); M0-01 remains pending. No placement/habitat/economy/gameplay or production claim.

The actual existing batched mesh triangles now carry stable ownership ranges:120 tiles and22 objects (six palms, four broadleaf trees, seven rocks, four reed groups, one gate). Four render batches participate in picking; animated glints and contact shade do not intercept it. The closest visible triangle wins. Unowned soil/empty background clears selection; no proxy box selects through an occluder. Gate roof/sign and entrance apron retain distinct object/tile identities.

One reusable 3D bounds cue and ground highlight identify the selected thing. A non-overlay ID/EN panel gives its name,1-based map coordinates and truthful scenery/terrain description; no future build/care actions are pretended. The same identity remains selected during pan/zoom/resize and language changes. Empty canvas, Dismiss and Escape clear marker, data ID and title/location/detail text. Keyboard Enter/Space inspects the center reticle when the world is focused. Six-pixel tap classification rejects drag/pinch/cancel/late release; panel/toolbar input never raycasts beneath it. Selection is view state only; deterministic core/save schema and world remain unchanged.

## Final-source validation

Run `20261031T201259Z-849f5aef`; source `75fee09a1642b85108b433f40b83e75e12b33119a69e9df7cf57cde7e3814bfa`; build `05f6372fe46cbd7dcdfd4f17929a0889dfe8584b7663b5b725c2c1599bd0c7dd`. Run-start HEAD was preceding M1-02 checkpoint1ee28bb. Exact source/build identities establish what was tested before its local commit exists.

- `npm run qa:local`:67/67 tests,0 fail/skips/todos. New coverage checks complete face-range ownership, known visible grass/water/gate/palm/tree/rock/reed ray intersections at four viewport sizes, unowned/invalid/outside rejection, tap versus drag/pinch/cancel, stable selection across camera/resize,100 reuse cycles, all142 bilingual identity presentations, and live/unpaused dismissal plus Enter/Space/Escape callbacks. Node tests use real Three geometry/ray math and EventTarget stubs, not a GPU/device claim. Astro check48 files:0 errors/warnings/hints;9-page build and all9 URL/title/H1/canonical/sitemap regressions PASS.
- Native approved-runtime clicks selected a grass tile and the visible broadleaf tree4. Tree selection survived panel text click, wheel, drag, Home and EN/ID switching. Native empty-background click, Enter/Escape, Dismiss, keyboard reopen, journal Back and reload passed with no stale identity/title. Final canvas pick held page scroll226→226. [Native observations](qa/m1-03/native-selection.json).
- Twelve labelled injected selection cases at1366x768/360x780/780x360:36 PASS. Existing nine camera cases repeated at each size:27 PASS. Ray ownership, repeat-tap idempotence, selected/unselected drag and pinch, empty deselection, panel dismissal/isolation, locale, pointercancel/late release, paused rejection, center keyboard and bounded pool reuse all observed. [Injected integration](qa/m1-03/selection-integration.json). QA-projected coordinates/injected PointerEvent/KeyboardEvent are not native OS pinch or physical Android evidence.
- Actual built selected-tree pixels reviewed at1366x768,1920x1080,360x780 and780x360, plus selected-tile desktop/portrait: six exact JPEGs620,933 bytes with SHA/dimensions. Outline/ground cue matches the chosen tree/tile, panel remains outside the world and camera controls, text/buttons legible, no document overflow. Same tree4 identity survived all four sizes; tile5-4 renders as Petak6,5. [Screenshot manifest](qa/m1-03/screenshot-manifest.json).
- With gate selected and an injected pointer held, desktop→portrait and portrait→landscape released pointer1→0 while preserving gate1 identity/marker. Pause preserved fixed tick/event/visual time and selection, resume advanced. Context loss and injected render-error retries begin with no selection/marker/title. Remount/unmount during selection+gesture and disposal of a stale prior handle passed. Eight close/remount/unmount snapshots: selectionDisposed/controlsDisposed true, selection false, live GPU geometry/texture/program/material/canvas/RAF/subscriber/pointer counts0, cleanupErrors0; max1 session/RAF. [Selection lifecycle](qa/m1-03/selection-lifecycle.json), [resource snapshots](qa/m1-03/world-performance.json).
- `npm run qa:verify`:PASS/exit0 at2026-10-31T20:33:41.078Z. Required six base cases plus three supplementary visual cases verified against final identities. Native product console warn/error capture empty, limit200 uncapped. Owned tabs33/34 closed (earlier32 also closed), viewport reset, owned PTY preview graceful stop/exit0 and4321/4322 free. Browser interactions/visual judgement use the approved runtime; automated receipt checks are not an unattended browser-driver claim.

[Full QA report](qa/m1-03/report.json), [browser receipt](qa/m1-03/browser-receipt.json), raw unit/check/build logs and [repeatable recipe](LOCAL_QA.md) retained. Existing eight journal URLs/content/media/SEO and BASE-01/02 remain unchanged.

## Issues found and corrected before acceptance

Initial keyboard authoring joined else/navigation, caught as an EventTarget callback ReferenceError; the runner failed despite individual assertions. Corrected and Enter/Space/Escape regressions added. The first typed check then rejected Box3Helper's generic material-or-array type; flattened actual materials into the disposal pool and reran. [Honest initial failure summary](qa/m1-03/preliminary-failure.json), [intact failed-check receipts](qa/m1-03/failures/20261031T195933Z-f9e92246/). The initial repetitive console was tool-truncated, never called an intact log or a pass.

Native browser testing found a64.7px page-scroll shift when inspector height changed in vertically centered columns. Changed only /play columns to align at the start; final native click stays226→226. [Original observed finding](qa/m1-03/preliminary-scroll-finding.json). Identity fields now clear when hidden, eliminating old invisible title/detail after retry. A QA operator used an EN close selector after switching fixture to ID; fresh state was checked and control language normalized. No source/test failure or stale readout was relabelled PASS. Earlier successful compile runs remained formal-browser UNRUN until this final source was tested.

## Payload, resources and limits

| Same file-based basis | M1-02 | M1-03 |
|---|---:|---:|
| Known shell raw bytes |39,125|44,306|
| First preview-open raw bytes |588,643|602,780|
| Same critical set gzip9 estimate |152,958|156,991|
| Lazy renderer raw bytes |549,518|558,474|

Increase14,137 raw/4,033 gzip-estimate bytes. No new package/model/texture/audio. Dist19 files/3,668,726 raw bytes includes original3MB journal hero. Lazy Three chunk>500kB warning remains visible; existing remote fonts/incidental icons/analytics excluded from the critical-set estimate. No full-game/network/download-latency certification.

Base draw work remains6 calls/4,128 triangles. Active selection measures9 calls/4,132 triangles: two passes for the transparent double-sided ground fill plus one line-bounds draw. Two geometries/two materials are reused. Fresh unselected session uploads six world geometries with eight owned materials; after first selection, eight geometries/seven programs remain cached even after hiding, and disposal returns all0. No per-tap mesh/material allocation or second RAF. Current source/indicator provenance and preserved prior source hash: [asset manifest](ASSET_MANIFEST.json).

Five visible five-second probes on small entry canvases, emulated DPR≈1: selected desktop/wide/portrait/landscape buffers504x350/496x350/270x250/285x250, synchronous JS/core/render-submit p95 1.1/1.3/1.0/1.2ms; warmed unselected desktop p95 0.7ms. Each observed about300 callbacks (at most300 retained samples) and20 readout writes, callbackHz≈60. M1-02 idle p95 was0.3/0.4/0.4/0.5ms; selected workload and instrumentation differ, so this is not a direct GPU or regression benchmark. Actual presented FPS/GPU/touch latency remain UNMEASURED; no physical Android≥30FPS or desktop≥60FPS claim.

Legacy post-close heap14,778,614–27,403,234 bytes fluctuated, versus prior13,886,150–16,348,272. Heavier QA projection/DOM instrumentation is included; heap is potentially shared/quantized, no forced GC or retained/GPU memory attribution. This does not establish either a leak or leak-free15-minute soak. Actual owned resources returned0; the full-game profiling/soak gates remain later work.

Five old generated runs fully archived in three ZIPs:55 files/807,703 compressed bytes, CRC/every-entry SHA verified before owner/root-checked prune. Newest3 cache runs retained. Prior source/media/study/immutable PRD transcriptions/historical receipts/Git rollback intact. Exact hashed QA bytes protected by folder-specific -text. Six small screenshots and bounded JSON/logs curated; no dist/dependencies/video dump committed.

## Remaining scope

M0-01 exact external Cloudflare settings remain pending; no login/new grants/Actions/push/deploy/public403 retry. Physical Android/real touch/pinch/Safari/iOS, true FPS/network/soak, whole-game localization and later gameplay/save are not claimed passed. Scene picking is complete; next **M1-04 valid/invalid build preview with Confirm/Cancel**, not started.

API references used: [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html) and [Box3Helper](https://threejs.org/docs/pages/Box3Helper.html). Engine MIT notice retained, no external art agreement accepted.
