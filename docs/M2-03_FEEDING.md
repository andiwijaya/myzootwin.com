# M2-03 - functional feeding

Status: COMPLETE on2026-11-01 UTC for the player-to-bird feeding loop. Implementation/evidence commit: db73fcaacabcbbe7b9f9d16b4faa44282e9e37ad (local only). Local only; no push/deployment. M0-01 external configuration remains partial. Next:M2-04 water placement, supply and seek-water.

## Player outcome

Open `/play` and the3D preview, build an aviary, welcome both macaws, choose **Place feeder**, confirm its empty two-bowl station, then **Fill feeder**. Each hungry bird approaches its own reachable bowl, plays the original articulated eating pose, actually consumes a portion and reduces its hunger. Empty bowls do not improve needs or play an endless eating loop. UI shows total/per-bowl portions, each bird's hunger and actual portions eaten, with complete ID/EN feeding controls/errors/status.

The station has one safe front-edge position in the starter aviary. Its real world ghost shows placement; Cancel/Escape creates no resource or food. Occupied turning clearance temporarily disables Confirm, with red ghost and text explaining why. Valid construction works at all21 legal habitat anchors. Food availability uses the reachable station position and the correct individual bowl, not the mere presence of an object. A bird cannot eat from an empty bowl because its partner still has food; the UI explains when to replenish both.

The original M2-01 model now bends to the supported bowls. Actual rendered pixels prompted a bowl-height refinement. Real jaw vertices reach the nearest rendered fruit sphere: minimum distance0.010951483 game units versus radius0.021 across20 fixed-tick eating samples. Feet remain on the floor; long tails withdraw backwards before turning away from food and stay clear of supports. Visual/CPU contact is a stylized game check, not real-animal anatomy or feeding advice.

## Rules and reusable state

Starting game balance is explicit in `game/animals/feeding.ts`, not a husbandry claim:

| Setting | Initial value |
|---|---:|
| Feeder capacity |8 portions;4 per bowl |
| Starting hunger |45% |
| Hunger growth while placed |0.12 percentage points per100ms fixed tick |
| Seek-food threshold |35% hunger |
| Eating duration |20 ticks /2 simulation seconds per portion |
| Hunger relief |30 percentage points per actual consumed portion |
| Seek timeout |120 ticks /12 simulation seconds |

Hunger is bounded0-100; no death/softlock. Free development-preview supplies provide recovery; pricing is explicitly deferred to M3. Coins/ledger/missions/water/energy/welfare are not fabricated or changed by this feature.

Resource data now includes a monotonic command revision and `portions:[number,number]` for food (`null` for other current conceptual resource kinds). Validation requires two nonnegative bounded bowl counts whose sum equals stock; eating references/position/contact are checked. Animal `foodEaten` and local typed `animal-fed` events describe actual completed portions for future mission rules; no mission is claimed complete. Frame partitions and save-codec continuation preserve exact results. The schema1 extension is pre-release, before durable player saves exist; no published-save migration is claimed.

Place/refill/remove commit cloned validated state atomically. Duplicate construction, full refills, stale revisions (including after replacement), repeated confirmation and paused/disposed commands cannot mint food or duplicate objects. Two animals cannot spend a depleted portion. Missing/deleted/unreachable food cancels its target safely; unavailable bowls leave animals in finite normal behavior until real food returns. Supported short retreats keep feeding and ordinary movement clear of the station.

Removal has explicit confirmation and pauses the world; Cancel preserves food, while Confirm clears food targets and geometry without a phantom last bite. In-page close/reopen/remount/context/render recovery preserves food, bowl counts, hunger and meal totals. A paused context-loss/retry restored these fields exactly. The model studio cancels unconfirmed feeder ghosts and pauses/hides the sanctuary while showing its labelled demonstration; food/needs do not advance during inspection. **Full page reload still resets the preview**; autosave/Continue is M5.

## Verification and evidence

Final run `20261101T005430Z-b4f7e931`; `npm run qa:verify` **PASS** at `2026-11-01T01:23:17.654Z`.

- `npm run qa:local`:159/159 unit/integration tests, Astro check81 files with zero errors/warnings/hints,9 built pages and all9 original/play route/title/H1/canonical/sitemap checks.
- 19 feeding tests include real stock/needs, per-bowl conservation, final-portion contention/recovery, stale/replayed commands, removal during approach/eating, paused/offline time, deterministic partitions, mid-eat codec reload, inaccessible food, starvation recovery, all21 legal habitat positions, supported geometry/contact and tail clearance, lazy ownership and controller lifecycle. These accelerated state tests are not a rendered soak.
- Approved isolated IAB actual WebGL at1366x768,360x780 and780x360: **297 per-case PASS** (30 feeding+24 animal+51 model+45 edit+42 path+42 placement+36 selection+27 camera). Existing route/input/building/bird behavior regressions passed. Labelled fixtures use real fixed ticks and product controls; input injection and QA pause/observations are clearly labelled, not physical touch.
- **11 native product scenarios** cover disabled placement without habitat, ghost Escape, actual empty construction/fill/eating, confirmation pause/cancel, removal while a bird was eating with no phantom portion, rebuild, stock/meal preservation on reopen, ID phone/landscape feeding and journal/back/reload. Example desktop observation:48% hunger before feeding; after two portions each,28% hunger and4/8 portions remaining. Phone/landscape observed one portion each,about22% hunger and6/8 remaining.
- **16 lifecycle observations /13 full zero-resource cleanup snapshots** cover context/render failure, unsupported recovery, late import, orientation/interrupted gestures, remount/stale handles, repeated reopen, model inspection with real food and final cleanup. Empty uncapped warning/error console. All owned tabs closed, viewport reset,4321/4322 verified free.
- Seven actual JPEGs(844555bytes): [native eating frame](qa/m2-03/screens/desktop-native-eating-frame.jpg), [desktop full UI](qa/m2-03/screens/desktop-native.jpg), [portrait ID](qa/m2-03/screens/portrait-native-id.jpg), [landscape ID](qa/m2-03/screens/landscape-native-id.jpg), plus naturally reached eating frames in three viewport sizes. The latter use a labelled QA observer to pause an actual eating state, with no pose/state/time injection. Clipped capture of the long fixture page was unavailable, so native viewport JPEGs were retained instead. No image generation/editing or unsupported browser driver.

Source:`fa2e9581078fe4020a2d718c6aa0b594bf20957d339fe5ddf6f734fec1308010`. Build:`fc623488e7eb71084183de28cc88be6d09ffbab4399c04c273ae06f31bc3c130`. [Audit](qa/m2-03/independent-audit.json), [matrix](qa/m2-03/interaction-matrix.json), [receipt](qa/m2-03/browser-receipt.json), [contact measurement](qa/m2-03/feeding-contact-measurement.json), [cleanup](qa/m2-03/cleanup-snapshots.json), [payload](qa/m2-03/payload-baseline.json).

Reproduce locally: run `npm run qa:local`, then `npm run qa:serve`. Use the approved isolated browser on the labelled4322 fixture and run camera→selection→placement→path→editing→macaw→two-bird→feeding checks at each viewport. The optional **Pause next real eating pose** observes real ticks; refill through the actual control if supply is exhausted, then Resume before profiling. Use built `/play` on4321 for native UI/gameplay screenshots. Stop the owned server, close tabs/reset viewport, record the actual receipt and run `npm run qa:verify`. This is an approved-runtime/manual browser workflow plus automated consistency checks, not a standalone browser driver.

## Resource/performance observations

Original two-port station/supports364 triangles; eight56-triangle fruit instances add448, max **812**. Two shared geometry objects/two materials/zero textures, allocated lazily and released on cancel/removal/full dispose. The unchanged original two macaw model assets remain6360 maximum triangles plus192 landing-branch triangles. Provenance is recorded in ASSET_MANIFEST.json; no external art, purchase/license agreement, dependency change or upload.

Retained case/contact/profile/lifecycle snapshots, including simultaneous model/birds/feeder, observed maxima **36 GPU geometries,19 owned materials,44 draw calls,11532 submitted triangles**. These are sampled maxima, not a continuous profiler. All tracked GPU geometries/textures/programs/materials, food/bird assets, subscribers, captured pointers and product RAF ownership returned to0 on full cleanup. Shared/quantized JS heap diagnostics are not a GC/leak proof.

Three5-second callback probes after actual feeding/refill observed about60 callbackHz, synchronous JS/core/render-submit p95 about2.2/2.2/1.9ms,25/27/28 diagnostic writes. **PresentedFPS and GPU duration remain unmeasured.** No physical Android performance claim.

Final first-preview built bytes702766raw /187036gzip9-estimated, shell86378raw; +18359raw/+5339gzip estimate versus M2-02. The existing >500KB lazy renderer chunk warning remains. External fonts/network/cold-start, full-game20MB distribution gate and15-minute rendered soak remain unmeasured; no speculative engine migration or broad optimization.

## Preserved work, limits and next integration

Original journal pages/layouts/public assets/SEO, dependencies, world/path/refund rules, original bird geometry/rig/animation/study/media, source transcriptions and M2-02 receipts are unchanged. Tests/fixtures gained concrete revision/portion fields for the new pre-release contract.35 files in three old owned generated runs were archived in two verified ZIPs(507530 compressed bytes); CRC/every SHA checked before scoped pruning. Newest3 caches retained. Failed strict-check hints, test coordinate-frame correction and pre-refinement contact evidence are preserved under `qa/m2-03/preliminary/`; no stale/compile-only result promoted.

This slice deliberately uses one fixed safe station with two approach lanes, not a general facility editor. Fine details use camera inspection/model close-up; whole-map phone birds remain small and wire/posts may occlude parts. Water, rest/energy/enrichment, full welfare, economy, missions, durable saves/full localization/release remain their later gates. **M2-04 must extend the current non-food facility fail-safe and define reachable water geometry/availability**; currently unsupported non-food facilities return birds safely to reserve. Existing BASE-01/BASE-02 remain recorded. Physical Android/true touch, Safari/iOS, presentedFPS/GPU, network and live production are UNRUN. M0-01 exact external Cloudflare/GitHub configuration remains pending; no login/new grant attempted.

Verified V1 completion: **17/51 (33.33%)**; implementation/evidence committed locally and living records updated. M7 remains12 deferred items. No push/deploy/GitHub Actions or unrelated Pelatuk changes.
