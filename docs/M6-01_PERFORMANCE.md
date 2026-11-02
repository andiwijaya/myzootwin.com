# M6-01 populated performance - PARTIAL

Date: 2026-11-02 UTC. CPU optimizations and engineering verification complete; **presentation FPS / physical Android acceptance remains UNRUN**, with unresolved desktop GPU timing attribution. M6-01 remains unchecked. V1 **40/51 (78.43%)**, M6 **0/8**.

## Acceptance and identities

Canonical M6-01: "GPU/browser profiling; optimize only measured bottlenecks; meet mobile FPS target or document measured limitations. Verify: FPS metrics and before/after profile."

| Required evidence | Current result |
| --- | --- |
| Browser/GPU profiling of populated world | **PASS engineering scope**: actual WebGL2 elapsed queries plus synchronous callback/render-submit CPU, bounded renderer counters,1x/10x and High/Low/Auto in desktop/portrait/landscape. |
| Measured optimization with before/after | **PASS sample scope**: identical starting fixture and probe bytes verified; repeated state copying/read work and unchanged DOM rebuilding reduced. All18 first paired CPU-p95 windows decreased. No causal claim for each individual change or statistical confidence interval. |
| Presented FPS / representative physical mobile target | **UNRUN**. RAF cadence, GPU elapsed time and CPU duration do not certify displayed FPS. No physical Android measurement, desktop presentation counter or physical touch claim. |
| GPU result and measured limitations | Desktop GPU-query p95 increased despite equal buffers/draw counts; no GPU improvement is claimed. Final desktop repeat retained; optional frozen-baseline repeat was blocked. Cause remains unresolved and requires controlled hardware follow-up. |

Instrumented baseline commit `cc6b96b`, run `s20261102T054108Z`, source `fff1f3a952d7d35ad030416f360d9204de44c70af16bbdfe6274aa7503ba6e0f`, build `b92bd0c7eb5765ccb7914ef54e8740abb30f4e21627ae5d074e144f81a8e4e85`.

Optimization commit **`b8c81c594ff8bd564751f19b67708b48465cb56f`** (local only), final run `s20261102T055027Z`, source **`43efdca0cbe8dec48932b9e64f2c0678c3a840025a1a31b3ab4912bf480d781b`**, isolated build **`2c50f848ba606685725665a2a72826c56f183939902c73c9f36090075307188d`**. [Independent audit](qa/m6-01/independent-audit.json), [comparison](qa/m6-01/comparison.json), [final local gate](qa/m6-01/final-local/report.json), [native receipt](qa/m6-01/native/results.json), [regression matrix](qa/m6-01/regression/matrix.json).

## Reproduction and measurement limits

From C:\MyZooTwin, with owner4345 still serving its earlier dist:

```powershell
$env:MYZOO_QA_SCOPE='performance-m6-01'
node scripts/qa/settings-isolated.mjs local
node scripts/qa/settings-isolated.mjs serve
```

The runner executes all sorted unit tests via Node strip-types, Astro check, and Astro build into `.qa/builds/<run>`; it never replaces `dist`. Open `http://127.0.0.1:4322/tests/browser/.generated/populated-performance-harness.html` through the supported in-app browser, verify displayed source/build/run, and use **Profile six populated configurations** once per fresh QA tab. Set1366x768,360x780,780x360 through the supported viewport capability. Type `stop` + Enter in the owned server helper for cleanup. No standalone browser driver, CDP, Actions, login, permissions or forced GC.

Each case loads a whole validated owned IndexedDB starting save produced by real care/ticket/mission commands: one aviary/path, two macaws, food/water/rest, active/open visitor system, all four mission unlocks. Initial canonical state SHA256 **`dc14c0c39d3d9d8b5a4db59a820354668b358945dad02a008478d05068edc945`** matches baseline/current core preparation exactly. Original measured probe SHA256 **`803ed25e1088f13e365ee450f63d571a214d6553aa22aa58ff1104a02328a8c5`** matches the final probe bytes exactly. No state/time injection or auto-care occurs inside timed windows; the camera uses injected actual camera commands once/second, separately labelled from native gestures. Autosave and real app UI remain active.

One-second warmup, five-second measurement, then pause/checkpoint/dispose.42 windows total:18 baseline +18 first final +6 final desktop repeat. Per-frame callback CPU wraps the existing single RAF callback; synchronous renderer submission is measured separately. Up to300 samples/window are retained; raw callback counts/window lengths are present. Queries are polled later without blocking and invalid/disjoint results are discarded according to the [Khronos timer specification](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/). All recorded GPU windows had completed results and zero disjoint flags. This measures elapsed queued GPU commands, not displayed frames. [Three renderer counters](https://threejs.org/docs/pages/WebGLRenderer.html) are counts, not allocated GPU bytes.

Observed browser DPR by viewport: **{'desktop': 1.5, 'portrait': 1.5, 'landscape': 1.5}**. These are CSS viewports on the same host/browser, not separate physical devices. All18 first paired buffers match exactly. Initial/final inspector reads, setup, QA output writes and optional nonstandard heap reads are outside timed callback CPU; GPU polling has its own small instrumentation overhead. Camera-triggered immediate render calls are included in GPU samples but occur outside the wrapped RAF CPU sample. State snapshots after timing include the short query-drain/pause interval; their tick deltas are not exact five-second speed calibration. `startedAt` inside each row is an approximate wall-time reconstruction; actual monotonic elapsed milliseconds and outer receipt timestamps are retained. Short windows, warmup/JIT, other host work and the untouched owner preview limit comparisons; no confidence interval or universal benchmark is claimed.

## Before/after samples

All numbers below are descriptive p95 milliseconds. They are **not FPS**. Raw values/counters are retained in before/after JSON, without rounding there.

| Viewport | Graphics | Speed | Callback CPU before -> final | GPU elapsed before -> final |
| --- | --- | --- | --- | --- |
| desktop | high | 1x | 13.30 -> 6.20 | 3.502 -> 4.935 |
| desktop | high | 10x | 15.10 -> 11.80 | 1.980 -> 4.368 |
| desktop | low | 1x | 12.60 -> 9.00 | 1.406 -> 2.600 |
| desktop | low | 10x | 14.40 -> 12.70 | 1.532 -> 2.682 |
| desktop | auto | 1x | 11.90 -> 9.30 | 2.187 -> 4.366 |
| desktop | auto | 10x | 15.10 -> 13.20 | 2.292 -> 5.021 |
| portrait | high | 1x | 11.40 -> 7.40 | 1.081 -> 1.102 |
| portrait | high | 10x | 12.90 -> 9.70 | 1.083 -> 1.093 |
| portrait | low | 1x | 10.30 -> 7.10 | 0.633 -> 0.636 |
| portrait | low | 10x | 12.10 -> 9.30 | 0.615 -> 0.652 |
| portrait | auto | 1x | 10.50 -> 5.30 | 0.637 -> 0.642 |
| portrait | auto | 10x | 12.10 -> 4.80 | 0.637 -> 0.640 |
| landscape | high | 1x | 11.40 -> 4.80 | 1.203 -> 1.217 |
| landscape | high | 10x | 12.80 -> 5.50 | 1.035 -> 1.218 |
| landscape | low | 1x | 12.80 -> 5.70 | 0.739 -> 0.740 |
| landscape | low | 10x | 14.70 -> 6.00 | 1.131 -> 0.836 |
| landscape | auto | 1x | 12.50 -> 5.40 | 1.200 -> 1.230 |
| landscape | auto | 10x | 14.60 -> 6.30 | 2.182 -> 1.234 |

The18 first paired CPU-p95 reductions range11.8%-60.3% in these windows. Desktop High10x:15.10 ->11.80 ms; additional final repeat7.30 ms demonstrates host/sample variability. GPU Desktop High10x:1.980 ->4.368 ms, repeat4.451 ms. Equal buffers/draw counts do not establish the cause; **this is not a GPU improvement or a cleared GPU regression concern**. Controlled physical profiling remains a release-gate follow-up. Portrait GPU timings were mostly similar; raw landscape variation remains visible above.

Additional final desktop repeat (not substituted for the first final results):

| Graphics | Speed | Callback CPU p95 | GPU elapsed p95 |
| --- | --- | ---: | ---: |
| high | 1x | 8.20 | 3.991 |
| high | 10x | 7.30 | 4.451 |
| low | 1x | 4.90 | 2.700 |
| low | 10x | 7.10 | 2.670 |
| auto | 1x | 5.70 | 3.717 |
| auto | 10x | 5.70 | 4.470 |

## Narrow changes

- Renderer updates take one renderer-owned `worldSnapshot()` instead of repeated full-save clones containing unrelated ledger/mission/entity data. One inspected frame state is shared within render; finance summary is computed once per inspector call.
- One coarse-pointer media query is retained, and one visual policy read is reused per render. Actual graphics policy, buffers, lighting, models and simulation behavior are unchanged.
- Stable mission-list/status DOM and unchanged bird-care text avoid rebuilding identical content. Care rows update when their displayed ID/fed/watered/rounded-welfare/locale changes; focusable controls remain stable. ID/EN changes still redraw correctly.
- Optional renderer-loader injection passes the actual durable session into the QA wrapper; default production behavior remains the existing loader. No second RAF, new game timer, dependency, asset, economy rule, save schema or mission criterion.

Read-only Node microbenchmarks are separate diagnostic evidence. Quiet-session inspector median:0.01679 ->0.00582 ms/call. Final world-only copy0.11369 versus final full-save copy0.17551 ms/call, and only one copy is needed for dirty visual world work. The initially contended after sample overlapped unit checks and is preserved as `m6-01-core-after-contended.json`, explicitly excluded from the comparison. These are not browser/GPU/FPS benchmarks.

## Functional and lifecycle verification

- **457 unit tests PASS**, including new world-copy mutation isolation, exact seeded outcomes despite frequent reads at both speeds, and complete finance-inspector reconciliation. **183 files checked**, zero diagnostics; isolated build and9 route/canonical/sitemap smoke checks PASS.
- **73 actual-browser fixture cases PASS**:19 HUD/lifecycle/storage/input plus27 usability and27 visual-settings across three viewports. Owned valid saves and injected events/faults are labelled. Context-loss/retry, remount, reset/cancel/restore, full-state equality, paused mutations, bilingual guidance and quality persistence are covered. Generic six-case browser-template verdict remains **UNRUN**, not overwritten by these targeted results.
- **42 populated profile sessions**: max one active renderer/one pending RAF, all42 disposed geometry/texture/program/material/subscriber/pending-frame ownership counts return to0 with zero cleanup errors. Historical last-render draw counts are not live allocations. Timed samples add zero dropped simulation milliseconds. This is bounded lifecycle evidence, not a retained-memory or15-minute soak proof.
- **Native fresh product flow PASS** on final build4354: actual habitat/path, two birds, food/water/rest, welfare response, visitors/tickets, Q01-Q04,1x/10x and native keyboard camera pan. Q04 initially reset after supplies depleted during agent delays; repeated real refills restored welfare and earned the actual30s/20ZC/two-new-visitor objective. Care cycles are retained, not hidden or replaced with fixture success.
- Paused Low/ID portrait and High/EN landscape settings preserve tick/currency/missions/birds. Actual reload/Continue preserves **tick10580 /1125ZC /4 missions /2 placed birds**, opens paused without offline gain. Native/fixture/profile warn/error logs were collected with cap200 and were not capped; final native and regression logs are empty.

Actual canvas screenshots: [desktop](qa/m6-01/native/desktop-actual-paused-bird.jpg), [portrait ID Low](qa/m6-01/native/portrait-id-low-actual.jpg), [landscape EN High](qa/m6-01/native/landscape-en-high-actual.jpg). These are viewport/native pointer-keyboard observations, not physical Android/touch or an unaided human study.

Built shell + lazy renderer estimates: baseline **989,527 raw /261,601 gzip9**, final **989,704 raw /261,709 gzip9**. External fonts excluded; no measured transfer/startup claim. The existing lazy-chunk warning is retained for M6-02, not suppressed or addressed by an arbitrary size target.

## Blocked comparison, preservation and cleanup

Optional frozen-baseline repeat: initial QA helper required raw HTML equality, but Vite adds client code. The helper stopped; browser navigation reached a connection-error document. After correcting readiness to verify run/source/build, server4323 was healthy, but the runtime rejected navigation in existing QA tab46 because its current browser-generated page used `data:text/html`. **BLOCKED/UNRUN**, no alternate port/tab/browser/permissions attempt for that comparison. A later viewport-reset cleanup attempt in that error context was also rejected, so its following Close was UNRUN. That tab was not revisited. Supported independent final-product and regression contexts on different permitted targets completed normally; they do not replace the blocked comparison. Raw health failure, exact block summary and frozen source/build archive are retained.

The generated baseline runtime is archived with CRC and every-entry SHA verification before removing only its exact `.qa/snapshots/m6-01-cc6b96b` directory. Original root source/media/saves/PRD and earlier receipts remain. A preliminary guard compared Git LF source to working-tree CRLF and failed byte equality; it is preserved. The corrected guard compares the exact original measured working-tree probe hash, while separately recording Git LF equivalence; no raw evidence was normalized to force a pass.

Two feature runs/builds retained, three loose screenshots, bounded archive and immutable raw receipts. Owned server ports4322/4323/4346/4354 free. All accessible normal QA tabs closed and viewport reset on valid contexts; error tab46 Close remains UNRUN, so all-tabs-clean is not claimed. Owner **http://127.0.0.1:4345/play/**, PID18816, loopback/HTTP200 and dist **`e06d975a30b49470a1e80e915fbe39ce22ba102f16447dbef8776e7088d38b05`** remain unchanged; no navigation/reload/reset/close or save access there.

**Still UNRUN/pending:** presentation FPS, representative physical Android/touch/speaker, controlled GPU attribution, native background, full browser-process restart, populated15-minute soak, unaided human study and production/live tests. Optional recovery download remains BLOCKED/UNRUN and was never retried. M0-01 external Cloudflare settings, M4-07 recording and M5-07 human evidence remain partial;12 M7 deferred. No push/deploy/Actions/login/access changes. Next independent feature: **M6-02 payload/memory/error-boundary work**, after parent review.
