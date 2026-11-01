# M2-06 — Animal information, welfare and causal alerts

Completed 2026-11-01 UTC. Implementation/evidence: **23a6a7a04b588709a196cbf7e46430c5d48facda**, local only. V1 **20/51 (39.22%)**. Next **M2-07** animal-action QA. No push or deployment; M0-01 external configuration remains partial.

## Player outcome

Each of the two named macaws has a stable Inspect button and live needs/behavior summary. Selecting a bird opens one inline detail panel with its actual welfare and food, water, habitat and enrichment components. It explains the formula, score directions, missing access and concrete actions. Causes distinguish missing, unreachable and individually empty bowls from a high need with accessible supplies. The other bird's full bowl cannot hide a problem. Links focus the actual visible feeder/water/perch controls; they do not award care or pretend to refill resources.

The panel is below the world and never overlays the animals. Keyed DOM preserves focused controls as scores update. Buttons have measured minimum 44px targets, visible focus and keyboard Escape/Close return focus to the same bird. Alerts have words and symbols as well as colour. Routine numeric changes are not live announcements; selected-bird cause transitions are announced at most once per three simulation seconds. Locale changes and session resets refresh the announcement safely. Reserve clears details and old rows; rewelcome restores both identities without stale selection.

## Authoritative rules

`game/animals/welfare.ts` owns tunable game rules. Values are bounded 0–100 and recomputed on every accepted tick, transaction and load, independent of the renderer. Persisted display numbers are not trusted. Habitat fit is 100 only for a valid occupied four-cell land aviary; reserve or invalid habitat has no active welfare.

`welfare = round(0.35 × foodScore + 0.30 × waterScore + 0.20 × habitatFit + 0.15 × enrichmentScore, 2)`

Food/water score is `100 − hunger/thirst` while the bird has a reachable serving in its own bowl. Without access it is capped at 40, retaining the actual need instead of inventing instant starvation. Refill restores access; only real eating/drinking reduces hunger/thirst. Enrichment uses the actual simulated score. Energy drives rest and its alert; it is not an invented fifth weight. These are simplified game mechanics, not husbandry advice.

| Alert | Enters | Clears |
|---|---|---|
| Low welfare | Below 60 | At least 65 |
| Hungry/thirsty | At least 60 need | At most 45 need |
| Tired | Below 35 energy | At least 65 energy |
| Low enrichment | Below 20 | At least 45 |

A low welfare status always supplies an actual food/water cause when no such cause is already present, using the larger weighted deficit. This covers moderate needs below the individual alert threshold, including a separate tired-only alert. A 1,331-combination invariant and the labelled 56% welfare scenario verify the edge.

Typed `Animal.care` flags preserve hysteresis through serialization/remount. Exact formula values remain visible while status uses the recovery band. Flags and active welfare clear in reserve. This extends the pre-release schema before durable player saves are published; M5 still owns real save/migration/recovery. No visitor, revenue, mission or completed aggregate-balancing feature is claimed.

## Final verification

- `npm run qa:local`: **204/204 tests**, including **15 welfare integration/invariant tests**. Astro checked **93 files** with zero errors, warnings or hints. Build and all **9 route/title/H1/canonical/direct-play/sitemap checks** passed.
- Approved isolated IAB, DOM-verified **1366×768**, **360×780**, **780×360**: **402 accepted fixture cases**, including 39 welfare cases and all previous camera, selection, construction, paths, editing, model, bird, food, water and rest checks. Waiting for each final asynchronous PASS prevents overlapping scenarios.
- **12 native observations**, **9 extra lifecycle observations**, **19 zero-resource snapshots**. Native actual care increases welfare; per-bird selection, ID/EN labels, keyboard focus, real actions and journal/history/reload work. Explicit QA-only state seeds test asymmetric critical scores 47.5/67.25 and healthy scores 91.25; these are labelled injected conditions, not a fresh-player recovery claim.
- Paused metrics/causes/hysteresis remain exact. Context loss/retry and repeated remount preserve scores, needs, benefit counters, stock, position and phase. Model inspection, interrupted gestures, unmount/stale handles, unsupported WebGL, render failure and cancelled late imports do not create duplicate loops or retain owned resources.
- **8 untouched actual JPEGs**, **1,174,531 bytes**: three native product pages, three injected critical panels and two healthy panels. Landscape healthy pixels were also inspected without a ninth retained image. DOM dimensions and actual native image pixels are recorded separately; viewport emulation is not physical Android or true touch.
- `npm run qa:verify`: PASS, exit 0 at `2026-11-01T05:05:57.573Z`. Independent raw-hash, behavior, provenance and archive audit passed. Console warnings/errors empty with uncapped limit 200. All owned tabs closed, temporary viewport reset, owned loopback previews stopped and ports 4321/4322 free.

Run `20261101T043552Z-cc6d8870`; source `b7944555b10aa3b28feb864a01f1e3744f6ca01862df76d8462c5d8da2ccf97f`; build `23db2bab10d378755ddde839ac17a02f2c5723ff2161d67d3f7db92309d45e2d`. The run's HEAD is its starting checkpoint; source/build manifests bind the implementation before commit.

Evidence: [automated report](qa/m2-06/report.json), [browser receipt](qa/m2-06/browser-receipt.json), [matrix and observations](qa/m2-06/interaction-matrix.json), [independent audit](qa/m2-06/independent-audit.json), [image manifest](qa/m2-06/screenshot-manifest.json), [findings](qa/m2-06/development-findings.json).

Reproduce with existing local QA commands and `node scripts/qa/qa.mjs serve`. Run camera → selection → placement → path → edit → macaw → animals → feeding → water → rest, waiting for each PASS. Record the five-second populated probe before the explicitly labelled welfare seed scenarios. Then run `qa-welfare`; its seeds start paused to make exact scores independent of frame timing. Native product checks use the actual built `/play/` entry script, not the stripped fixture. The final acceptance run exercised independent welfare seeds first, then reloaded the same final build for legacy controls and the populated probe. Results remain bound to the same source/build/viewport; no previous-run results were reused.

The native landscape image records later supply depletion and the correct empty-bowl causes, following an earlier real recovery. Actual care links then focused the visible refill controls; subsequent real consumption recovered welfare again. The before/after observations are retained separately from image timing. Capture records include DOM values before and after the screenshot because the native simulation continues.

## Measurements and limits

The feature adds no geometry, textures, assets, dependencies or game RAF. Retained sampled maxima: **{'gpuGeometries': 32, 'ownedMaterials': 21, 'drawCalls': 48, 'triangles': 12700}**. Samples include cached/model-inspection resources, not continuous GPU/heap peaks. Every tracked owned resource, RAF, subscriber and pointer returns to zero on full release.

| Five-second populated probe | RAF callback cadence | Synchronous JS/core/render-submit p95 |
|---|---:|---:|
| desktop | 60.00 Hz | 3.40 ms |
| portrait | 60.00 Hz | 3.30 ms |
| landscape | 60.00 Hz | 3.20 ms |

The same probe scene has six path tiles, two birds and three care facilities. Callback cadence is not presented FPS; JS/render submission is not GPU time. Shared/quantized nonstandard JS heap readings cannot prove tab-exclusive memory or leak freedom.

First-preview payload: **758,748 raw / 200,032 gzip-9 estimated bytes**, up **17,546 / 4,900** versus M2-05; shell **119,729 raw bytes**. The existing >500KB lazy-chunk warning remains. This excludes external font/network conditions and the future populated game. Physical Android/true touch, Safari/iOS, presented FPS, representative cold-start/network, final whole-game download budget, 15-minute soak and live production are **UNRUN**.

## Findings, provenance and scope

Old tests that assumed welfare was permanently zero were updated while retaining all original care/authority invariants. Preliminary weight-sum equality used an appropriate floating-point tolerance. A neglect-recovery scenario initially assumed 850 ticks; isolated deterministic inspection showed real recovery around 1,000 ticks, so the bounded test now allows 1,300 and still requires actual consumption, enrichment and recovered welfare. Safe-placement checks are retained. No production balance was changed to hide that test failure.

The first full QA caught two unused-import hints; they were removed. A second source-bound run passed compile/test gates and the logic pilot, but real pixel review found dynamically created Inspect buttons did not receive Astro's scoped button styles. Explicitly scoped global rules corrected 44px targets and focus styling; a complete fresh source-bound run and all browser checks followed. Original failure logs, unaccepted visual evidence and findings remain separate; no preliminary result is promoted as final. Native review also corrected an old English future-welfare hint. A same-root remount reproduced four UI rows for two simulated birds; explicit initialization cleanup and a dedicated DOM regression corrected it. A moderate-needs 56% welfare state initially lacked a causal alert; weighted fallback causes and range/UI regressions corrected that final edge. Each source correction required fresh complete local QA and final browser verification.

Original model/rig/animation, rendering and care mechanics, journal routes/SEO/public media, dependencies, world/economy rules, immutable PRD sources and previous QA remain unchanged. No new art or licence is involved. Historical M2-05 integration-source hashes are verified against baseline Git blobs; the current autonomy view adds welfare but does not change asset geometry. **71 old owned cache files** were archived into **1,107,991 compressed bytes**, with CRC and every-entry SHA verified before scoped pruning. The newest three cache runs remain; no original media or history was deleted.

M0-01 exact external Cloudflare binding/build/root/autodeploy remains unknown; no login/new grants attempted. BASE-01/02 persist. No push, deployment, Actions, purchase, licence acceptance, upload or unrelated project changes. M2-07 remains the next full animal-action QA milestone; visitors/economy/missions/durable saves and all 12 M7 items remain later. V1 **20/51 (39.22%)**; production **NOT DEPLOYED**.
