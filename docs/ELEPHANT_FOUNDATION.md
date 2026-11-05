# Elephant foundation implementation evidence

## EH1-01 — shared species contracts, 5 November 2026

Prior contract commit `f120059` (full hash in Git history). New `core/species.ts` supplies discriminated macaw/elephant animals, habitat kinds, resources and world collections, frozen species configuration, species narrowing and ownership compatibility. Ground motion cannot represent bird flight/perch/elevation. V1's exact `Animal`, `WorldState` and codec remain unchanged input types; no elephant state can be smuggled into a V1 save.

Legacy Q02 consumed-bird objectives and care display now filter macaws explicitly. Q04's care condition does the same. Welfare resource slots are assigned among macaws, so an alphabetically earlier elephant cannot steal a bird's feeder/water port. No old mission timing/reward, ledger, initial population, graphics, UI, storage or money changes. This is a typed foundation, **not a playable elephant or a V2 persistence claim**.

Four new runtime tests cover mixed species ordering, habitat/resource cross-species and parent ownership, unknown kind rejection, Q02/Q04 mixed-state evaluator seams and frozen V1 codec equality. The mixed evaluator input deliberately bypasses V1 validation and is labelled invalid V1; it is not called a playable V2 scenario. Compile-only negative tests prove elephants cannot enter macaw FSM or V1 arrays and ground/bird motion are incompatible.

Final gates: **506/506 full tests** (all original tests unchanged), Astro **220 files, zero errors/warnings/hints**, nine-route build PASS; lazy Three chunk warning retained. Logs `.qa/elephant-baseline/species-{full.tap,check-final.log,build.log}`. Frozen hashes unchanged; 34 initial focused and 8 final narrowed fixture/species tests passed. No dependencies changed.

Native final-build IAB cold Continue on the isolated QA origin restores **1055 ZC, four missions, two macaws, one habitat/four occupied cells, six paths, three guests/30 views, ID/10×**, paused, with actual canvas and no warn/error at limit200. Exact entry module `PlayEntry.astro_astro_type_script_index_0_lang.BCkBRQA8.js`; [receipt](qa/elephant-baseline/species-continue.json). Actual pixels inspected. Earlier native full Q01–Q04 journey is baseline evidence; it is not relabelled as a fresh post-change full run. Own tab closed. No owner saves, push or deployment.

Progress **5/39 (12.82%)**, original V1 **46/51** unchanged. Next EH1-02 append-only expansion helper, then stable scene anchoring before any product activation.

## EH1-02 — append-only world preparation

Prior implementation commit `9f0c536`. `world/elephant-expansion.ts` prepares a deep-cloned12×18 grid by appending96 land cells, retaining original120 cells/indices, gate, habitats, resources and paths. Repeated calls preserve all player changes in the appended zone without sharing references. No automatic paths/habitat/elephants/grant; no storage or money change. Unsupported dimensions and malformed/sparse/reordered/duplicate grids refuse expansion rather than repairing data. The actual player UI only creates12×10; otherwise codec-valid custom layouts remain an explicit unsupported migration case to preserve for recovery, never silently reset.

Four new tests integrate all nine frozen worlds and the real current path commands/visitor BFS. **19/19 focused tests** pass. Initial integration assertion incorrectly expected an explicitly player-built connector at legacy tile(1,9) to remain unbuilt; corrected expected delta to exactly that tile. Pure expansion still proves exact120-tile equality. Initial failure retained in ignored `expansion-focused-initial-failure.tap`, final log `expansion-focused.tap`.

Astro **222 files, zero diagnostics**, nine-route build PASS. Helper is deliberately inactive until stable scene anchoring and V2 persistence are verified. Emitted product entry retains `BCkBRQA8` and268449bytes; previous native compatibility observation applies to unchanged compiled product, not a new expansion browser run. Original506-test full suite reused because existing runtime modules are unchanged; four additional expansion cases exercised directly.

Progress **6/39 (15.38%)**. Next EH1-03 scene anchoring/camera/picking golden tests. No push/deploy or owner data modification.

## EH1-03 — stable scene anchor and camera

Prior checkpoint `060fe58`. Central `world/scene-coordinates.ts` retains origin(6,5) for the supported12×18 extension and preserves centered behavior for other legacy dimensions. Terrain/catalog inverse, aviary/path/resource/reward meshes, birds/visitors, preview/picking and UI camera targets use this shared origin. Soil extends south around center(0,4). Camera clamps accept the shifted map center, covering x=-6..6,z=-5..13 without moving old scenery. No new scenery blockers, entity, cost, save migration or player-facing expansion activation.

Seven new scene tests prove all120 old centers invert correctly; **142 original identities/bounds** and every original V1 geometry attribute SHA match a manifest generated from the actual original Git source `63ce52a` (temporary old module retained only in ignored QA). Old non-terrain batches are byte-identical after expansion. Actual aviary/paths/food/water/perches/rewards/macaw/visitor bounds match before/after.24 viewport/angle combinations raycast both zones; camera controls focus both and clamp9600 adversarial arrow inputs; actual preview ghost/picking agrees. Initial30 focused checks, final7 golden checks and **517/517 full tests** pass. Astro **225 files, zero diagnostics**, nine-route product build PASS. Existing Three chunk warning remains.

Compiled labelled harness `tests/browser/elephant-world-harness.{html,ts}` mounts the **actual foundation renderer/simulation** with a synthetic prebuilt expanded world and in-memory session, no owner storage. Its one RAF is instrumented; injected ray-input buttons are visibly labelled, not reported as physical clicks/touch. Real native UI rotate/reset plus injected picks pass all8angles at1366×768,360×780,780×360 (24 required +8 supplementary default-desktop cases); original aviary remains selectable. Two real original bird models,216selectable tiles and original props visible. [Receipt](qa/elephant-baseline/anchor-browser.json), [desktop](qa/elephant-baseline/expanded-desktop.jpg), [portrait](qa/elephant-baseline/expanded-portrait.jpg), [landscape](qa/elephant-baseline/expanded-landscape.jpg). Actual pixels reviewed. This is expanded-world renderer integration, **not a persisted V2 gameplay journey or physical mobile claim**.

Close scene yields canvas/RAF/geometries/materials/programs/subscribers **all0**, cleanupErrors0, max pending RAF1. Console warn/error0 at uncapped200. Own tab closed and viewport reset. Harness built separately under ignored `.qa/elephant-world-built` (872.92kB raw/202.31kB gzip), not added to product routes or shipped output. Both loopback supervisors auto-stop at09:54UTC. No second simulation loop or dependency.

Progress **7/39 (17.95%)**. Next EH1-04 authoritative variable footprint and species-scoped limits; V2 migration still unimplemented, no feature publication.

## EH1-04 — authoritative variable footprints

Prior scene checkpoint `93f8bad`. The shared placement rule now accepts2×2 aviary or6×6 grove footprints, keeping1×1 paths. `species-habitat.ts` applies one authoritative collision check, independent1-aviary/1-grove caps, cloned36-cell occupancy and exactly-once build identity; conflicting species/position reuse rejects. Legacy aviary limit counts aviaries rather than total habitats. Original V1 command/codec behavior stays unchanged. This is **world transaction preparation**, not a paid build, grant, unlock, final elephant enclosure or persisted V2 claim; those stay unchecked.

Actual preview uses the same species validator. Its pool grows lazily to36shared-plane cells (two geometries/three materials), reuses it across20size switches, positions6×6bounds exactly at x=-3..3,z=6..12 for the chosen anchor, and cancels without mutation. Original starter preview still allocates four cells. Six new tests cover footprint/occupancy agreement, both species ordering and caps, bounds/creek/path/occupant/scenery negatives, duplicate/conflicting operations, stale/double-confirm/revalidation and geometry reuse. **26/26 focused** and **523/523 final full tests** pass; Astro **228 files, zero diagnostics**, nine-route build PASS.

Initial negative test incorrectly chose a scenery sample containing an existing paid path; precise precedence correctly returned path. Replaced that sample with the valid empty starter world, retaining failure logs. Initial world-only browser harness had CSS canvas overflow from intrinsic DPR dimensions; fixed explicit100%CSS dimensions, retained failed screenshots only in ignored QA and failed attempt metadata in [receipt](qa/elephant-baseline/footprint-browser.json). Final native1366×768,360×780,780×360 actual green36-cell ghosts, free Cancel, invalid edge/creek, one36-cell commit and repeated idempotent fixture commit pass; currency985 and all120legacy tiles stay exact. Native screenshots [desktop](qa/elephant-baseline/footprint-desktop.jpg), [portrait](qa/elephant-baseline/footprint-portrait.jpg), [landscape](qa/elephant-baseline/footprint-landscape.jpg), actual pixels reviewed/no horizontal overflow. The fixture explicitly has **no ledger/storage/animals**, so it cannot be mistaken for paid construction. Close releases canvas; warn/error0 at uncapped200, own tab closed/viewport reset.

Progress **8/39 (20.51%)**. Next EH1-05 strict migration/persistence. No owner data, push or deployment.

## EH1-05 candidate checkpoint

The opt-in migration/recovery candidate is tested but **PARTIAL**, with no checklist increment. See [the exact scope, evidence and remaining schema work](ELEPHANT_SAVE_V2.md). Final candidate gates: 531/531 tests, 234-file Astro check with zero diagnostics, nine-route build, 17 native storage cases and actual macaw cold Continue. The evidence document distinguishes native-run source from final defensive hardening. Production entry remains V1.
