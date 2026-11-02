# M6-03 original import failure — bounded investigation

2 November 2026 UTC. **Historical root cause: INCONCLUSIVE.** The supported finding is a loader rejection before renderer factory initialization. No concrete harness concurrency race or product defect was demonstrated; no code, dependency or test change is justified. Investigation stopped at its evidence limit, with **zero new browser reproductions**. M6-03 remains **PARTIAL**, V1 **44/51 (86.27%)**. Baseline **`e74e6c27bb44e07b737fa3e03766a847c000b8e9`**; this slice adds documentation/evidence only.

[Plan](qa/m6-03-import-investigation/plan.json) · [audit](qa/m6-03-import-investigation/historical-audit.json) · [classification](qa/m6-03-import-investigation/classification-proof.json) · [acceptance](qa/m6-03-import-investigation/acceptance-matrix.json).

## What the original evidence establishes

The original HUD fixture completed zero cases, timed out waiting for its first canvas and displayed **Preview files could not load** with the reload-page instruction. Canvas count was0. Its owned durable save remained available at revision1/tick1231/975ZC/four missions/two birds, with no storage fault. The default1500ZC/no-birds HUD was not an initialized renderer and does not establish save reset/data loss.

At original commit `9c1d6f36c255175877cf778a114befdf024e07e8`, the title uniquely maps to `error.reason === 'load'`. The controller catches rejection from `await load()` before invoking the renderer factory; factory initialization/WebGL failures have a later separate `init`/`unsupported` path. Both panel and controller Git-canonical bytes are identical to the current baseline. The class is therefore **module-loader rejection** (fetch, parse/module evaluation or other import rejection), not a demonstrated WebGL factory error. The underlying exception remains unknown.

The saved browser consoles are empty. The controller intentionally catches the exception without retaining its cause, so an empty console does not show that no exception occurred. The Vite6.4.3 log reports new Three/addon optimization near first fixture loading; it contains no failed request/status/stack or precise overlap/reload trace. Later serial HUD20PASS and prior compiled native3PASS establish successful later runs, not the original cause or a fix.

All46members of the preserved walkthrough archive pass CRC/every-entry SHA, and the archive hash remains unchanged. A single scoped read of its retained JSON/logs found no missing original exception/status trace. No archived runtime was extracted or executed. [Key original receipts](qa/m6-03-import-investigation/original-key-receipts/) are copied exactly; full originals remain in the prior evidence directory.

## Why another green run would not resolve it

Missing discriminants are the caught exception name/message/stack, failed module URL and HTTPstatus, exact parallel-client start/overlap/reload timing, and original optimizer cache/runtime state. Astro/Vite changed from5.18.2/6.4.3 to7.4.4/8.3.5; Three remains0.187.0. A new current cold/warm or parallel/serial run would not reconstruct the old environment or select among the possible causes.

[Current official Vite documentation](https://vite.dev/guide/dep-pre-bundling) describes dependency discovery and possible development rebundling/reload; that is a plausible general mechanism, not proof for this incident. The version6-specific documentation URL was unavailable via the web tool; no equivalence between versions is assumed. The archive lacks a504/outdated-module/network trace linking the optimizer to the observed rejection. No concurrency fix, eager import/prebundle change, dependency downgrade, cache deletion or product fallback change was made on this speculation.

The bounded plan therefore stopped reproduction at **0browser attempts**. This is an inconclusive forensic outcome, not a passing historical reproduction or clearance of every possible race.

## Current regression verification and preservation

The one requested current gate ran with synthetic `PUBLIC_GA4_ID=G-QACONSENT000` and `MYZOO_QA_SCOPE=blackbox-m6-03` using `node scripts/qa/settings-isolated.mjs local`. Final **`s20261102T174805Z`**, source **`45145f5fac6380f8a011ad78a3576613f42e388ca76bf5b2f4009287ff113e6e`**, build **`0811a1a19fd9278f94f1167bc689edd37c2d9ffde60691c1aeef193c4b904974`**.

**485unit tests PASS**, including all14 existing renderer/lifecycle cases covering duplicate opens, close/dispose during pending imports, failure/retry and init/context/render distinctions. **205checked files, zero errors/warnings/hints; nine-route build PASS**. Independent static route/canonical/sitemap checks pass, and all24emitted artifacts byte-match the previous GPU build. Source fingerprint is unchanged. These are current regression checks; they do not explain the historical browser/dev-server failure. No tests were added merely to inflate counts.

No browser tab or QA server was started. Consequently generic runner `routes/browser/cleanup` fields remain **UNRUN**; static-route validation and port/preservation checks are separate evidence. No new HTTP/native/device pass is claimed. Build/test/check children completed; ports4322/4323/4345/4346/4347 are free. Owner4345 was already absent, never restarted or accessed; olddist, owner saves and three local rollback archives remain unchanged. Original failure, serial receipts and archive preserved. [Final guard](qa/m6-03-import-investigation/final-guard.json).

## Remaining scope and next action

M6-03 actual device/cross-browser acceptance remains unrun. GPU attribution/presentationFPS, human study/recording, legal/notices/legacyart and external Cloudflare configuration remain open. Inherited QA46/baseline and recovery-download operations were not retried; no new denied/pending action or uncertain mutation occurred. This investigation is blocked by **missing historical evidence**, not a new permission request. The optional version6 documentation read was unavailable; no alternate retrieval or causal assertion was substituted.

If a future QA load fails, preserve its caught loader exception, local resourceURL/status and monotonic request/optimizer/parallel timeline before rerun, with exact source/build/cache identity; keep raw internal errors out of public UI. Such instrumentation or a synthetic control would improve future diagnosis, not recover this lost trace.

The next independently actionable recommendation after parent review is a bounded authoritative follow-up on the four remaining full notice texts; [precise next-step boundaries](qa/m6-03-import-investigation/next-step.json). It was not started here. No push/deploy/Actions/login/credentials/permissions changes. Stop for parent review; **44/51 unchanged**.
