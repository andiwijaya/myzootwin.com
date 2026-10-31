# M0-08 — Measured foundation baseline and artifact hygiene

Status: implementation and applicable verification complete, 2026-10-31 UTC. Subsequent living-PRD record references the local implementation/evidence commit. This is the current small abstract renderer foundation, not a populated zoo or a physical Android performance pass.

## Repeatable baseline

[PERFORMANCE_BASELINE.md](PERFORMANCE_BASELINE.md) defines commands, screen matrix, budgets, counters, safe collection and retention. New opt-in Rollup evidence records actual client modules without rewriting chunks or hiding warnings. `node scripts/qa/payload.mjs` verifies analysis against current chunk hashes and reports the same build/source identity as QA. Source freshness now includes public assets. The renderer exposes passive counters; visual geometry/material/lighting/controls and simulation rules are unchanged. No new dependency or engine migration.

The local fixture collects bounded RAF interval and synchronous core/render-submit durations, at most300 samples. Its DOM readout is truly limited to250ms apart except explicit user/state actions; final five-second probes recorded20-21 readouts across about300 callbacks. A preliminary eager-readout path was found and corrected; the final suite/build/browser baseline was rerun. Preliminary observations are retained with an explicit filename and are not the final CPU baseline. Collection aborts on pause/close/remount/hidden state and rejects insufficient windows. The sole renderer RAF still owns simulation advancement; the only added timer is a bounded QA measurement endpoint, cleaned on pagehide/unmount.

## Final build and lazy warning investigation

Run `20261031T183101Z-7b5049b7`; source `a44532d0a3d46a580b3a44935c82d231092b81ab30b1d5b7d425079cb1c5d598`; build `3cea7987df988c4a8414486a46c771f7107adeaaa8c2a396b79d3e1e3aa45a9f`. Exact file/module/data receipts: [qa/m0-08](qa/m0-08/).

- Known critical shell HTML/declared Astro assets: **35,624 bytes raw**.
- Same set plus lazy preview renderer: **575,583 raw / 147,861 gzip-level9 estimate**. External fonts, incidental icon requests and analytics where configured are outside this estimate; no network/first-interaction claim.
- Lazy foundation chunk: **539,959 raw / 136,378 gzip-level9 bytes**;11 modules. The two Three.js core/WebGL modules retain **1,294,430/1,318,739 pre-minification code bytes (98.16%)**. No additional node_modules package is in this lazy chunk. This is retained-code attribution, not additive minified/transfer share. Existing 13,475-byte entry stays separate.
- Warning >500kB remains visible. The measured cost is dominated by the required Three runtime/shader machinery. Existing lazy boundary is retained; no arbitrary split, shader/material downgrade, warning-limit change or broad refactor. The small inspector adds322 raw bytes compared with M0-06/07; no product FPS improvement is claimed.
- Complete built dist:19 files / **3,641,529 raw bytes**, including existing journal assets. Directory snapshot totals about234.0MB across measured source/media/docs/Git/dependencies/dist/cache, with node_modules about216.7MB. These are logical file lengths at the snapshot, not allocated filesystem space or a future total-game size.

## Four five-second native-module observations

| CSS viewport | Canvas drawing buffer px | RAF callbacks/s | JS submit p50 / p95 ms | Readouts / callbacks |
|---|---|---:|---:|---:|
| 1366x768 | 504x350 | 60.00 | 0.60 / 1.30 | 20 / 300 |
| 1920x1080 | 496x350 | 60.00 | 0.50 / 0.90 | 21 / 300 |
| 360x780 | 270x250 | 60.00 | 0.40 / 0.80 | 20 / 301 |
| 780x360 | 285x250 | 60.00 | 0.40 / 0.80 | 20 / 300 |

All probes completed at visible-page status, with current DPR/renderer ratio near1 after remount. These small canvases (roughly270x250 to504x350) occupy an entry preview panel, not a fullscreen populated game. Callback cadence is **not presented FPS**; actual presentation/GPU time and hardware identity remain UNMEASURED. Timings include synchronous JS/core/driver submission and instrumentation timing overhead; periodic QA DOM write occurs outside the measured callback. Dev-fixture/host load/privacy timing granularity limit interpretation. Some runtime wait deadlines expired just before the five-second timer; actual completed probe state was inspected, never inferred from the timeout. No forced GC or isolation/permission changes.

Active scene in all four samples:3 geometries,1 reported texture allocation,1 shader program,5 live owned materials,5 draw calls and352 triangles. No external game texture/model/audio is loaded by this foundation. Eight fresh Open/Close cycles all reported zero geometries/textures/programs/owned materials, canvas, pending RAF and simulation subscribers after disposal, with zero cleanup errors and max one active session/RAF. Historical last-render counters/buffer dimensions are not live allocation counts.

Legacy performance.memory was available: post-close used JS heap ranged **11,783,628 to 15,075,120 bytes** across eight cycles. It fluctuated and includes potential shared/quantized/QA allocations. This is not retained-memory measurement, a leak-free guarantee or a15-minute populated-game soak result. Raw snapshots and times remain in performance-observations.json.

## Verification and hygiene

Final commands: `npm run qa:local` (all50 unit/integration tests, Astro check35 files/zero diagnostics, build9 pages and all local route/metadata/sitemap checks), `node scripts/qa/payload.mjs`, approved-runtime fixture probes/cycles, actual built `/play/` six required browser cases plus1920-wide visual, `stop` in PTY, then `npm run qa:verify` (PASS/exit0). Four new actual native canvas screenshots total **299,249 bytes**. EN/ID, keyboard/settings/Escape, history/reload, one-session/core pause, injected context loss/retry and zero native captured warn/error messages verified. No physical touch/Android/iOS/Safari, cold network, populated gameplay/save or live production pass.

Two bounded archives preserve four earlier generated runs in full:41 files, **393,822 compressed bytes**, CRC and every entry hash verified before path/owner-checked dry-run/apply pruning. Active cache now holds exactly the newest3 runs. All original public media, reusable macaw study, immutable PRD source, historical docs/qa and Git rollback history are unchanged. No original work was deleted; only archived own generated cache directories. Retention manifests and after-state are in baseline-verification.json. Build/dependencies stay ignored; no Actions/push/deploy/login/new grants.

Owned tabs19/20 closed, viewport reset; PTY stop exited0, both loopback listeners independently absent. BASE-01/02 persist. M0-01 exact external Cloudflare binding/build/automatic-deploy configuration remains pending, never checked complete. Future populated-game >=30 physical-Android/60 desktop presented FPS, <=20MB first-play, startup and15-minute soak targets remain separate gates. Next: **M1-01 small tropical diorama** after review; no M1 work included here.

API interpretation references: [Three renderer statistics/disposal](https://threejs.org/docs/pages/WebGLRenderer.html), [HTML frame callbacks](https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#animation-frames), [legacy heap API limitations](https://developer.mozilla.org/en-US/docs/Web/API/Performance/memory), [Rollup output metadata](https://rollupjs.org/plugin-development/). These support metric interpretation, not a hardware performance certification.
