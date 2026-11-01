# M2-05 — Functional rest and enrichment

Completed 2026-11-01 UTC. Implementation and evidence: **dce81aa37b78d5da936958a556ffa92af752394f**, local only. V1: **19/51 (37.25%)**. Next: **M2-06**, animal information, full welfare and causal alerts. Production is not deployed; M0-01 remains partial.

## Player outcome

The `/play` preview now lets players prepare a leafy rest kit in their constructed aviary. Its two supported branches, planter and foliage have real effects: tired macaws approach, land and sleep to recover energy; awake macaws look toward and explore the foliage to gain enrichment. Each bird's bilingual status reports energy and enrichment, and the kit reports how many birds are resting or exploring. Ordinary landing branches and an unused kit grant no benefits.

Preview, Confirm, Cancel and Escape use authoritative revision-checked commands. Invalid, busy, cancelled and repeated placement cannot create a duplicate kit or instant benefit. Occupied removal pauses for explicit confirmation; cancellation keeps the kit. Confirmed removal stops benefits immediately and restores the original landing supports at the same coordinates for safe descent. Birds, food, water and coins remain intact. Stable separate slots keep both birds supported without overlapping or competing for one branch.

Food and water remain separate resources. Active care completes safely, higher available needs receive priority, and urgent care can interrupt rest after a bounded safe transition. Missing, unreachable or removed kit resources cannot strand birds or produce phantom recovery. This starter preview explicitly offers free supplies; pricing, missions and durable saves remain later work. Full welfare is still M2-06.

## Deterministic rules

| Rule | Initial value |
|---|---|
| Initial energy | 55% |
| Energy drain outside rest | 0.08 percentage points per 100 ms fixed tick |
| Rest eligibility | Energy at most 60, reachable branch, priority permits |
| Actual rest recovery | 0.8 points per tick, target 85% |
| Rest duration | 20–80 ticks; critical available need at 95 can interrupt earlier |
| Urgent available food/water | Need at least 80 preempts new rest and safely interrupts active rest |
| Enrichment eligibility | Energy at least 60, enrichment below 60, other available need below 50 |
| Actual exploration | 30 ticks, gain 1.5 points per tick |
| Enrichment decay outside exploration | 0.03 points per tick |

These tunable 0–100 game values are simplified mechanics, not animal husbandry facts. Simulation owns all changes; rendering never awards recovery. Typed `restedTicks` and `enrichedTicks` count actual supported activity and are bounded by simulation time. Validation checks position, elevation, heading, resource target and phase. This extends the pre-release schema before published durable saves exist; it does not complete M5 persistence or migration.

## Verification and evidence

Final run: `20261101T030218Z-3b5ee56f`.

- Source: `28d332493e19915b10b8d3ff23859db542e6bd261ab320915b3935e1020e895e`.
- Build: `4158f4b71fa574ebc14f6d45cbb39788935f0d50e7adc35e7db6b26e815c1a84`. The run records its starting HEAD; source and build manifests bind the implementation before commit.
- `npm run qa:local`: **189/189 tests**, including 15 rest tests; Astro check of 89 files with zero errors, warnings or hints; build and all 9 route/title/H1/canonical/direct-play/sitemap checks passed.
- Approved isolated IAB at measured DOM sizes **1366×768, 360×780 and 780×360**: **363 accepted fixture cases**, including 33 rest cases and camera, selection, placement, path, editing, model, animal, food and water regressions. Native controls are distinguished from labelled injected touch/failure scenarios.
- **12 native observations**, **12 additional lifecycle observations**, and **20 zero-resource cleanup snapshots**. Exact paused scores, counters, stock, position and phase survive renderer retry/remount. Model inspection pauses real benefits. Stale handles, context loss, render failure, delayed import cancellation and unsupported-WebGL fallback recover safely.
- **8 untouched actual JPEGs**, totaling **1,094,126 bytes**: three native product pages, three sleeping poses and two exploration poses. Landscape exploration was also viewed and recorded without a ninth retained image. Poses were reached through normal controls and real ticks, then paused by labelled QA after four observed activity ticks; no state, time, energy or pose injection.
- Native desktop and ID portrait/landscape flows show energy increasing from 54% and enrichment increasing from zero. Food/water stock and real consumption remain independent. Warning/error logs were empty, read with limit 200 and not capped.
- `npm run qa:verify`: **PASS**, exit 0 at `2026-11-01T03:38:54.591Z`. Independent behavior, byte/hash, provenance and archive audit passed. All owned tabs closed, viewport override reset, owned loopback previews stopped and ports 4321/4322 verified free.

See [automated report](qa/m2-05/report.json), [browser receipt](qa/m2-05/browser-receipt.json), [interaction matrix](qa/m2-05/interaction-matrix.json), [independent audit](qa/m2-05/independent-audit.json), [contact measurement](qa/m2-05/rest-contact-measurement.json) and [image manifest](qa/m2-05/screenshot-manifest.json).

To reproduce, run the existing local QA commands and `node scripts/qa/qa.mjs serve`. In one properly sized fixture tab, run camera → selection → placement → path → edit → macaw → animals → feeding → water → rest, waiting for each final PASS. Record the probe before reloading. Fresh actual care controls followed by `qa-rest-freeze` and `qa-enrich-freeze` provide repeatable observed poses. Native UI/locale screenshots use the built `/play/` entry script, not the stripped fixture. DOM viewport dimensions and returned image pixels differ slightly and are recorded separately.

## Original art and measured budget

The original kit has **512 triangles**, comprising 192 same-coordinate supported branches and 320 garden/band triangles, with two shared geometries, one vertex-colour material and no textures. Original landing meshes are hidden while the kit/ghost supplies their supports, then restored on cancel/removal. Original macaw model, rig and animation sources are unchanged. Provenance is recorded in [ASSET_MANIFEST.json](ASSET_MANIFEST.json).

Tests exercise all 21 legal aviary anchors and 1,100 mixed-care ticks against actual mesh vertices. The minimum grip-to-branch surface distance was **0.000003582564 game units**; fence, roof, floor and foliage clearance checks passed. CPU geometry checks complement actual pixel inspection; they are not GPU collision proof or anatomical validation.

Retained sampled maxima were 38 GPU geometries, 22 owned materials, 48 draw calls and 12,588 rendered triangles, including model inspection/cached resources. All tracked owned resources, subscribers, pointers and RAFs return to zero on full release. These snapshots are not a continuous peak-memory profiler.

| Five-second matrix probe | RAF callback cadence | Synchronous JS/core/render-submit p95 |
|---|---:|---:|
| desktop | 59.80 Hz | 2.40 ms |
| portrait | 60.00 Hz | 2.00 ms |
| landscape | 60.00 Hz | 2.40 ms |

Each probe used six path tiles, two birds and all three care facilities. Callback cadence is not presented FPS or GPU time. Nonstandard shared/quantized JS heap readings do not prove tab-exclusive memory or leak freedom.

The measured first-preview payload is **741,202 raw / 195,132 gzip-9 estimated bytes**, up 19,256 / 4,419 versus M2-04; shell 105,646 raw bytes. The existing >500 KB lazy-chunk warning remains. External fonts/network conditions and the future populated game are excluded. Physical Android/true touch, Safari/iOS, presented FPS, representative cold-start/network, final whole-game download budget, 15-minute soak and production remain **UNRUN**.

## Findings and preservation

Old ownership tests were updated to compare initial energy with the new configured value while retaining authority/clone checks. Two overstrict fixture assumptions were corrected; actual partial language failure and preliminary receipts remain separate. An accidentally overlapping landscape attempt was explicitly invalidated, retained and rerun sequentially. The first receipt verifier rejected a missing numeric console `limit`; adding the actual limit 200 corrected metadata without changing observations, timestamps, images or source. Both verifier outcomes remain in `verification-attempts.jsonl`. No partial, stale, overlapping or compile-only result was accepted as final. Details: [development findings](qa/m2-05/development-findings.json).

Journal routes, SEO/layout/public media, dependencies, world/path/economy rules, original bird/study sources, immutable PRD transcriptions and previous QA receipts remain unchanged. Forty-seven files in three old owned cache runs were archived into 1,547,342 compressed bytes after CRC and every-entry SHA verification; the newest three cache runs remain. This feature retains 41 QA files totaling 8,597,276 bytes, including useful failure receipts and original images.

BASE-01/02 persist. M0-01's exact external Cloudflare repository/build/root/autodeploy settings remain unknown; no login or grant attempted. No push, deployment, Actions, purchase, licence acceptance, upload or unrelated project changes occurred. Full welfare, economy, missions, durable save and release gates remain future work; all 12 M7 items remain deferred.
