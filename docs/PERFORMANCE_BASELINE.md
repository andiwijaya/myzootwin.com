# Foundation performance and artifact baseline recipe

This is an engineering baseline of the small abstract `/play/` foundation, not the populated zoo or a physical Android benchmark. Keep the standard M0-07 workflow and its explicit PASS/FAIL/UNRUN browser receipt. No standalone browser driver, personal browser, security/header change or forced garbage collection is required.

## Repeatable commands

```powershell
npm run qa:local
node scripts/qa/payload.mjs
node scripts/qa/qa.mjs serve
```

Use a foreground terminal or agent exec with `tty:true` for `serve`; type `stop` and Enter for verified cleanup. `qa:local` opts into client-only Rollup module evidence via the task-specific `MYZOO_QA_ANALYZE=1` child environment. The Astro plugin writes `.qa/bundle-analysis.json`; normal builds keep identical rendering/build semantics and do not suppress the chunk warning. `payload.mjs` refuses stale analysis/chunk hashes and writes `.qa/payload-baseline.json`, bound to the same build/source identity as QA. It lists raw bytes, gzip-level9 estimates, exact file lists, client-module attribution and directory logical sizes. Module `renderedLength` is retained code before minification, not additive transfer attribution.

The known shell asset set is `play/index.html` and its declared `/_astro` assets; preview-open adds the lazy foundation chunk. These are file-byte estimates, not measured network transfer. Existing remote font styles/fonts, incidental icon fetches and any separately configured analytics transfer are outside this critical-set estimate. Full `dist` byte totals are also reported. No universal first-interaction latency or future complete-game <=20MB pass is implied.

## Browser collection through the approved runtime

Open the labelled local fixture using the supported isolated in-app browser. Verify its visible run/build/source IDs. Start with **Record heap snapshot**, then use actual Open/Close controls. Capture snapshots after closes, at most16 per fixture. Only this QA fixture reads the optional legacy `performance.memory` API. Its numbers can be shared/quantized/inaccurate; if unavailable, retain UNAVAILABLE. Do not change cross-origin isolation or request permissions to obtain a different API.

For each CSS viewport **1366x768, 1920x1080, 360x780, 780x360**:

1. Close preview, set and verify viewport through the approved API, then reopen. This remount samples the current devicePixelRatio; record both observed DPR and renderer pixelRatio/buffer dimensions. Do not label viewport emulation as physical hardware.
2. Press **Record 5-second callback baseline**. Observe COLLECTING then COMPLETE in `#qa-diagnostics`. A wait API's own deadline can expire just before the 5s timer; inspect the fresh actual probe state instead of restarting or marking failure/success from the timeout alone.
3. Read only the rendered JSON. Save exact requested/observed viewport, probe start/end/elapsed, callback and synchronous CPU-submit statistics, renderer counters, heap status and wall timestamp. A probe aborts when paused/closed/remounted/hidden; incomplete/insufficient callbacks cannot be called a completed sample.

The collector retains at most300 interval/CPU samples, counts total callbacks and labels the retained-window length. QA DOM readout is throttled to250ms while the existing renderer RAF supplies samples. CPU duration surrounds the core/render callback and includes synchronous driver submission; it excludes GPU execution/presentation and QA readout work. RAF callback cadence is **not actual presentation FPS**. Browser privacy granularity, dev-fixture instrumentation and host load limit these small samples. Do not compare them as physical device scores or claim future targets passed.

Perform at least eight Open/Close cycles. Record each active and disposed session: canvas/session/RAF/subscriber ownership, Three geometries/textures/programs, own live material count, last-render draw calls/triangles, render-submission counter and cleanup errors. Historical last-render counters/buffer dimensions may remain after disposal; they are not live resource counts. Released geometry/texture/program/material counts and pending ownership should be zero. Heap snapshots without GC are observations, not retained-memory or leak proof. The later 15-minute populated-game soak remains a separate gate.

Complete the standard six M0-07 browser cases against actual built `/play/`; capture the three required native screenshots plus optional1920x1080. Close owned tabs, reset viewport, stop owned previews and run `npm run qa:verify`. Snapshot actual canvas, never fabricate FPS from screenshots or dispatch count. Archive a bounded selected receipt/log/payload/module/sample/screenshot set with its identities under `docs/qa/<feature>`.

## Artifact retention

Generated `.qa/runs` remains capped at5; the path/owner-checked prune retains newest3. Review the dry run before apply. Before removing an older run whose failure evidence is useful, preserve it in a bounded named archive and verify CRC/all entry hashes. Keep that archive/manifest outside the prune root, along with existing historical feature receipts. Preserve all original source, PRD transcriptions, valid media/model study and Git rollback history. `dist` and dependencies remain ignored; no Actions or deployment.

References: [Three renderer statistics/disposal](https://threejs.org/docs/pages/WebGLRenderer.html), [HTML animation-frame specification](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames), [legacy memory limitations](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory), [Rollup output/module metadata](https://rollupjs.org/plugin-development/). Future targets from the PRD remain >=30 presented FPS on a representative physical Android device, >=60 desktop where supported, <=20MB first-play distribution budget, measured startup and a15-minute populated soak; these foundation readings do not certify them.
