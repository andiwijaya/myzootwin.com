# M2-04 - functional water care

Status: COMPLETE on2026-11-01 UTC for water placement/refill/stock/seek/drink/thirst. Implementation/evidence commit: **e0f60a801023de70307b14b9e881596c3ef572cf** (local only). No push/deployment. M0-01 external configuration remains partial. Next:M2-05 rest/perch energy and simple enrichment.

## Player outcome

On `/play`, open the3D preview, build an aviary, welcome two macaws, choose **Place water bowls**, confirm the empty blue side bowls, then **Refill water**. Each thirsty bird approaches its own reachable bowl, lowers its actual articulated head/beak into the water and consumes a portion after finishing the drink. The matching water surface lowers/disappears and the bird's thirst improves. ID/EN text shows total/per-bowl stock, thirst0-100 and actual drinks. Empty/missing/unreachable sources never improve needs or fake an endless drinking loop.

The one fixed safe starter station works at all21 legal aviary anchors and coexists with the front feeder and supported roosts. It is not a free facility editor. Ghost/Cancel/Escape creates no resource or water; occupied side clearance disables construction with a readable reason. Repeated/stale commands cannot duplicate bowls/refills. Confirmed removal pauses while the decision is open, then clears only water targets and preserves food. Birds back away and side-hop clear of roost posts before turning home. Model inspection pauses/hides actual birds and cancels ghosts; its demonstration drink never consumes stock.

## Simulation and state

| Starting game balance | Value |
|---|---:|
| Water capacity |8 portions;4 per bowl |
| Initial thirst |45% |
| Thirst growth while placed |0.15 percentage points per100ms tick |
| Seek-water threshold |35% |
| Drink duration |20 ticks /2 simulation seconds |
| Thirst relief |35 points per consumed portion |
| Seek timeout |120 ticks /12 simulation seconds |

These are tunable game simplifications, not real-animal care advice. Needs are bounded0-100, with no death/softlock. Explicitly free preview supplies allow recovery; prices/ledger effects remain M3. Hunger still grows0.12/tick and food rules retain their original consumption/relief. Higher eligible reachable need wins when neutral, while active care finishes safely. An unavailable bowl does not block the other need. Two stable slots have separate conserved portions within each station, avoiding simultaneous final-portion duplication.

Water Resource kind/ID/revision/portions remain independent from food. Serializable `waterDrunk`, thirst, target, heading, motion/elevation and local `animal-drank` facts follow actual fixed ticks. Validated atomic commands invalidate old world editor quotes/Undo rather than allowing stock resurrection. Pause resets time anchors; renderer retries/remounts restore exact page-session values. Codec samples roundtrip deterministically across seek/drink/backoff/hop phases and frame partitions. Schema1 was extended before published player saves; durable autosave/Continue/migration is not implemented or claimed here. Energy/enrichment/full welfare/visitor/economy/mission systems remain later features.

## Verification and evidence

Exact final run: `20261101T015958Z-4137168a`. Source `f6d855f733e91049df68b413f4f6812d893feeb2787f3c1b5301d6e4eea7da10`; build `8bcf812677c18cd2247e7c20fdd291388cff5af45a9351e0fa3cadb4f57e9101`. `report.json.head` records the starting checkpoint; final source/build manifests bind the verified implementation before its local commit.

- `npm run qa:local`:174/174 tests(15 new water), Astro85files with0errors/0warnings/0hints, production build9pages, all9 original/new route/title/H1/canonical/direct-play/sitemap checks PASS.
- `node scripts/qa/payload.mjs`: final-source payload measured below.
- `node scripts/qa/qa.mjs serve`: owned127.0.0.1 ports4321/4322 only. Actual browser controls and labelled fixture used; no unsupported driver.
- Approved isolated IAB:330 accepted individual fixture cases across DOM-verified1366x768,360x780,780x360 (33 water; previous camera/selection/build/path/edit/model/animal/feeding checks included).14 native product observations,9 additional lifecycle observations,15 zero-resource cleanup snapshots. Native mouse/keyboard, ID/EN water outcomes, independent food stock and journal/back/reload verified. Injected touch interruption is labelled; physical touch is untested.
- `npm run qa:verify`: **PASS**, exit0 at2026-11-01T02:20:10.748Z. Raw logs, source/build identities, actual screenshots and receipt consistency checked. Independent artifact/core/provenance audit PASS.
- Six untouched actual JPEGs,859994bytes. Three full product pages show UI, and three naturally reached real drinking poses were paused by labelled QA after four drink ticks for visual inspection. No pose/state/time injection or generated/edited image. Native capture pixel dimensions are recorded separately from measured DOM viewport; no1:1CSS-pixel mapping claim.
- Empty uncapped warning/error console(limit200). All owned tabs closed, viewport reset, owned previews stopped, both ports free. No Actions/push/deploy/login/new grants.

Evidence: [final run](qa/m2-04/report.json), [browser receipt](qa/m2-04/browser-receipt.json), [matrix/native/lifecycle observations](qa/m2-04/interaction-matrix.json), [independent audit](qa/m2-04/independent-audit.json), [contact geometry](qa/m2-04/water-contact-measurement.json), [screen manifest](qa/m2-04/screenshot-manifest.json). Reproduce the existing QA workflow, then run fixture controls in order: camera, selection, placement, path, edit, macaw, animals, feeding, water. Read final PASS for each async scenario, use one freshly sized tab per viewport and verify DOM dimensions. `qa-water-freeze` observes real drinking; it does not alter simulation values. Raw evidence is bounded and source-specific, never reused after code changes.

## Art, resource and payload measurement

Original blue ceramic water geometry:352station+32surface=**384maximum triangles**,2shared geometries/2materials/0textures. Each surface follows its own actual stock and is hidden when empty. CPU sampling of the unchanged original articulated jaw reaches the full water plane within0.000019113units and last-portion plane within0.000861309units, above the bowl floor. Actual model vertices remain within fence/roof/floor and clear roost posts through900ticks of feeding/drinking; movement tests cover all21 anchors without teleporting. Original M2-01 assets remain6360max triangles for two models plus192roost triangles; their five source hashes are unchanged. Provenance: [asset manifest](ASSET_MANIFEST.json).

Retained sampled maxima, including simultaneous model inspection with cached world/animal/care resources:45GPU geometries,21owned materials,44draws,11812triangles. This is not a continuous peak/memory profiler. Tracked resources/RAF/subscribers/pointers return0 after full cleanup. Three5s actual preview probes record~60RAFcallbackHz and p95 synchronous JS/core/render-submit2.1/1.8/2.3ms for desktop/portrait/landscape. PresentedFPS/GPU time remains UNMEASURED; shared/quantized nonstandard JS-heap observations cannot prove tab-exclusive memory or no leak.

Measured built first-preview payload721946raw/190713gzip9-estimated bytes, including95915raw shell bytes; delta+19180/+3677 versusM2-03. This excludes network transfer realities/external fonts and the future full game. Existing>500KB lazy-chunk warning remains recorded; no speculative engine migration or broad optimization. Android30FPS/desktop60FPS, representative cold-start/network, final<=20MB whole-game download,15min soak and production tests remain UNRUN.

## Resolved findings and preserved work

Actual tail/fence geometry exposed an unsafe outward floor turn; small water-compatible wandering now stays inward. Native product inspection exposed stale food-action visibility after water preview; corrected and a full new source-bound QA run passed. The initial build and observations remain explicitly superseded. One fixture retained desktop dimensions when a newer product tab was resized; its phone claim was rejected and all portrait scenarios/contact were rerun on a sole verified360x780tab. Actual capture pixels can differ from DOM viewport; both dimensions are retained. Development test/helper issues were fixed before final strict QA. See [resolved findings](qa/m2-04/development-findings.json); no stale/RUNNING/compile-only receipt promoted.

Original journal/layouts/public/media/dependencies/world/path/economy rules/original model/study/immutable PRD sources and all previous receipts remain unchanged.14files in2named old owned generated runs archived into34967compressed bytes; CRC/everySHA verified before scoped pruning. Newest3cache runs retained, including final and superseded water evidence. The new QA folder holds37files/4959758bytes, preserving useful findings without videos or generated art dumps. No original source/media/history deleted.

Known limits: BASE-01 animals heading overflow and BASE-02 journal quote contrast persist. M0-01 exact external Cloudflare repository/build/root/autodeploy configuration remains pending; no login/new access attempted. Physical Android/touch/Safari/iOS/presentedFPS/network/soak/live are untested. Current UI remains an honest development preview; full game/Continue stays gated. Next **M2-05** must implement energy/rest/enrichment and extend the remaining unsupported perch-resource contract before claiming those effects. Verified V1 **18/51(35.29%)**, M7 all12 deferred. Production **NOT DEPLOYED**.
