# M2-01 — Final V1 macaw model and minimum animations

Status: COMPLETE locally, 2026-10-31 UTC. Implementation/evidence commit: 8f91a980759d337d186de9d1dec095fd0eb60aeb (local only). No push, deploy, Actions, login, new grant, purchase, license acceptance or external upload.

The original blue-and-yellow macaw (`Ara ararauna`, core species ID `ara-ararauna`) is now a reusable code-native low-poly model with seven working animation states. It is a new articulated asset, not the M0-03 GLB study renamed. Curved closed hook, marked pale cheeks/eyes, green forehead, gold breast/underwing, blue articulated wings, tapered long tail, ground/gripping feet and closed-eye overlay provide recognizable anatomy. The earlier study and all original media remain intact.

The actual `/play` entry has **Meet the macaw** / **Kenali makaw**: seven clips (perch/idle, walk, hop, short flight, eat, drink, rest), four angles, visual pause, close-up and a demonstration at real habitat scale. It explicitly says no birds have been placed and no food/water/welfare simulation is running. The core pauses while the model is inspected; actual placement/autonomous birds remain **M2-02**. Guide/settings, entry language, camera, construction/editing/Undo and all journal routes are preserved. Play/Continue remain truthfully unavailable.

## Original asset and reusable contract

Sources: `src/game/render3d/macaw/`; [asset/provenance/ownership guide](../art/macaw-v1/README.md); [measured source/geometry manifest](../art/macaw-v1/model-stats.json). Species facts rechecked against [Toronto Zoo](https://www.torontozoo.com/animals/Blue%20and%20yellow%20macaw) and [Stone Zoo](https://www.zoonewengland.org/stone-zoo/animals/birds/blue-and-yellow-macaw/). Only identifying facts inform the original geometry; no third-party photograph, mesh, texture, audio or source prose is incorporated. Shape, scale and motions are simplified game art, not scientific illustration or husbandry advice. No new repository-wide art license is invented; engine MIT notice retained.

| Actual measurement | Result |
|---|---|
| Maximum model triangles per bird, including closed-eye overlay | **3,180** |
| Maximum for two shared-rig birds | **6,360**; CPU reuse contract tested, two actual placed birds not yet implemented |
| Shared owned geometries | **11**; two foot variants are alternatives, shared by both feet/instances |
| Materials/textures | **1 vertex-colour material /0 textures** |
| Typical mesh draws per bird | **10 awake /11 closed eyes** |
| Generated bird attribute bytes, once per shared asset set | **343,440**; demo props bring the studio total to368,596 |
| Five code-native model/studio/contract source files | **22,272 bytes**; not a separate downloaded model binary |
| Real habitat scale | **0.62**, checked against actual floor/fence/roof and all pose bounds |

Rigid head/jaw, shoulder/forewing, tail, independent feet and eyelids use immutable shared geometry/materials and independent instance transforms. `sampleMacawPose` is deterministic and does not place/consume/pay/change needs. `createMacawAnimator` gives280ms continuous crossfades, including interruption from the current blended pose, and accepts caller-supplied bounded visual time. Rig disposal never disposes borrowed assets; one asset owner disposes buffers/material exactly once. No animation RAF, interval, storage or extra simulation loop is created.

The presentation adapter runs from the existing foundation RAF. Gameplay ticks pause while inspecting the model; visual articulation continues smoothly. Visual pause stops RAF as well. Global pause/hidden/reset anchors prevent catch-up jumps. Camera/selection/build input is isolated in close-up; habitat-scale mode allows bounded pan/zoom while picking/construction stay paused. Mode-specific keyboard/camera help is truthful. Opening/changing the model brings the actual canvas into view without smooth scrolling; CSS fractional rounding is accepted within one pixel. A supported raised bowl and grounded perch/contact cue prevent floating demonstration props. Demonstration X motion is not animal navigation and must not be reused as authoritative movement.

## Final verification

Final run **20261031T231330Z-a10576fe**. Source **e43bcbf0b127064f4a13be07b96bb096dc06f5b91aee0b6f05b0aee0b3b1d392**; build **051f97e1903db8d1774d40dd1956c6295cf041933c9d547216483a84c371f57d**. `npm run qa:verify` exited0/PASS at **2026-10-31T23:31:20.147Z**.

- **128/128** unit/integration tests, zero skipped/cancelled; Astro check **73 files, zero errors/warnings/hints**; nine-page build and all nine route/title/H1/canonical/sitemap/direct-play HTTP checks. New tests cover finite normals/palette/nondegenerate parts, outward hook faces, grip contact, ground/roof/wing bounds across cycles, independent shared rigs, interrupted blends, bounded visual time, disposal ownership, no game-state mutation, reduced-motion/default pause, control forwarding and renderer-probe eligibility independent of paused gameplay.
- Approved isolated IAB actual WebGL at **1366×768**, **360×780**, **780×360**. **243 per-case PASS** fixture observations:51 macaw +45 edit +42 path +42 habitat +36 selection +27 camera. Model tests run all seven clips/four angles, paused/snap clips,35 rapid transitions, repeated open/close, true habitat scale, input isolation, ID/EN, viewport visibility and interruption. Touch events are explicitly injected; these are not physical Android/touch claims.
- **16 native product scenarios** inspect actual final pixels and controls: native settings/ID/EN/Escape, perch/front/side/back, walking feet, hop/landing, continuous connected wing motion and pause, supported eat/drink contact, rest eyes/head tuck, real empty-aviary scale, camera arrows/zoom, guide interruption, model exit/reopen and journal/history/reload. Fine facial/foot detail is visible in close-up. At whole-map overview the bird is intentionally small;2.44× care zoom exposes colour/silhouette and long tail through the fence. This does not claim all markings are legible at overview or a populated-game UX pass.
- **Eight fresh actual screenshots /584,749 bytes**: desktop model, portrait rest, landscape flight, side contact, back silhouette, drinking contact, habitat overview and care zoom. Cropped images use the supported screenshot API's page coordinates; no generated/reconstructed pixels, montage or previous-run image is promoted.
- Ten lifecycle observations and **eight full zero-resource cleanup snapshots**: context loss via labelled native `WEBGL_lose_context`, injected render failure, active-model remount/unmount, stale handle, replacement by injected unsupported WebGL, global pause/resume and orientation cancellation. Max one session/RAF. Released geometry/material/texture/program/canvas/RAF/core subscriber/model ownership all zero, cleanup errors zero. Native/injected warn/error capture **0**, uncapped. Owned tabs49–54 closed; viewport reset; both owned loopback servers4321/4322 stopped and verified free.

Commands: targeted `node --experimental-strip-types --test tests/macaw-model.test.mjs`, `npm run qa:local`, `node scripts/qa/payload.mjs`, `node scripts/qa/qa.mjs serve` plus approved browser controls, `npm run qa:verify`, independent evidence audit and final Git-byte/source checks. No standalone browser driver, unrecognized install or execution-policy change.

## Performance and bounded evidence

Observed peak across the tested model/world cases: **32 uploaded GPU geometries /15 owned materials /8 programs /1 engine texture**, at most **23 draws** in the actual habitat-scale scene. Detail flight was12 draws/3,064 triangles including the display floor/contact cue; the model itself has no texture. Closing the studio releases its eleven shared model and eight display geometries/material ownership and returns to the warmed world baseline (13 uploaded geometries/14 owned materials); full session disposal reaches zero. These are renderer ownership/resource counts, not GPU byte usage or retained-memory proof.

Three final five-second **macaw-studio-detail** probes completed at about60 callbackHz, p95 synchronous JS/core/render-submit **1.6/1.6/1.5ms**,20 readout writes each. They explicitly record a paused gameplay simulation and an active renderer RAF. **Presented FPS/GPU time remain unmeasured.** Shared/quantized nonstandard heap observations do not prove leak freedom, GC or a fifteen-minute soak.

Known first-preview payload: **671,529 raw /177,593 gzip-level9 estimate bytes**, +27,346/+8,510 vsM1-07. Shell72,927 raw; lazy renderer598,602 raw. The >500kB raw lazy-chunk warning remains recorded and unsuppressed. Generated geometry bytes are memory data, not an additional343kB network download. External fonts/network/first-interaction time and the future complete-game ≤20MB budget are not claimed passed. No broad optimization/refactor or dependency change was introduced.

Four older owned generated runs were archived in two ZIPs: **48 files /747,766 compressed bytes**, CRC and every entry SHA256 checked before scoped pruning. Newest three caches retained. Original study/media/source transcriptions, historical evidence and rollback history preserved. Current original asset/provenance hashes recorded in `ASSET_MANIFEST.json`. Raw terminal logs retain exact bytes under scoped non-diff attributes; source whitespace checks remain enabled.

## Honest refinement and receipt history

Actual initial pixels justified closing wing-junction gaps, reducing exposed leg length and adding ground contact/bowl support. The first probe correctly remained **INSUFFICIENT** because its old eligibility assumed unpaused simulation; a tested renderer-ownership predicate and explicit model/world scope fixed that instrumentation. A native visual check found the model head outside the viewport after opening; canvas reveal and mode-specific help were fixed, then full final-source tests/browser/probes/captures rerun. A strict zero-pixel native assertion was inspected and resolved as0.32 CSS-pixel scroll rounding, consistent with the fixture's one-pixel tolerance, not a clipped bird.

Two initial crop captures used viewport origin instead of the screenshot API's page origin; those bad files were retained separately and fresh correct captures reviewed. An earlier REPL row helper captured a previous receipt object and left the current required rowsUNRUN; that assembly was rejected before verification. Retained final native observations were matched to the exact entry script/run/build/source and populated into an explicit target receipt, then the complete independent/standard verifier passed. No old receipt, insufficient probe or failed screenshot was relabeled PASS. Preliminary raw findings remain under `qa/m2-01/preliminary/`.

## Remaining boundary

This completes model and animation quality, not actual placement/autonomous birds, needs/care, visitors/economy/missions, player saves/Continue, full UX/localization or a playable V1 release. **M2-02** must create the two real bird instances and state-driven idle/wander/perch inside authoritative habitat bounds using the shared rig contract. Do not copy the studio's demonstration motion into simulation or promote the old M0-03 study.

Physical Android/touch/Safari/iOS, presented FPS/GPU time, real network/first-play latency, long soak and production tests remain UNRUN. BASE-01/02 persist. M0-01 exact external Cloudflare configuration remains partial; no login/grant attempted and prior public403 not retried. Protected journal pages/layouts/public assets/dependencies/routing config, simulation/world/economy/save code, original study and source PRD transcripts have no diff from preceding checkpoint.

Verified V1 after commit/checklist update: **15/51 (29.41%)**; M7 remains12 deferred items. Next: **M2-02**. No production change.

Evidence: [PASS report](qa/m2-01/report.json), [interaction matrix](qa/m2-01/interaction-matrix.json), [independent audit](qa/m2-01/independent-audit.json), [eight captures](qa/m2-01/screens/), [cleanup](qa/m2-01/cleanup-snapshots.json), [payload](qa/m2-01/payload-baseline.json), [model asset pack](../art/macaw-v1/README.md).
