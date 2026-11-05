# Elephant foundation implementation evidence

## EH1-01 — shared species contracts, 5 November 2026

Prior contract commit `f120059` (full hash in Git history). New `core/species.ts` supplies discriminated macaw/elephant animals, habitat kinds, resources and world collections, frozen species configuration, species narrowing and ownership compatibility. Ground motion cannot represent bird flight/perch/elevation. V1's exact `Animal`, `WorldState` and codec remain unchanged input types; no elephant state can be smuggled into a V1 save.

Legacy Q02 consumed-bird objectives and care display now filter macaws explicitly. Q04's care condition does the same. Welfare resource slots are assigned among macaws, so an alphabetically earlier elephant cannot steal a bird's feeder/water port. No old mission timing/reward, ledger, initial population, graphics, UI, storage or money changes. This is a typed foundation, **not a playable elephant or a V2 persistence claim**.

Four new runtime tests cover mixed species ordering, habitat/resource cross-species and parent ownership, unknown kind rejection, Q02/Q04 mixed-state evaluator seams and frozen V1 codec equality. The mixed evaluator input deliberately bypasses V1 validation and is labelled invalid V1; it is not called a playable V2 scenario. Compile-only negative tests prove elephants cannot enter macaw FSM or V1 arrays and ground/bird motion are incompatible.

Final gates: **506/506 full tests** (all original tests unchanged), Astro **220 files, zero errors/warnings/hints**, nine-route build PASS; lazy Three chunk warning retained. Logs `.qa/elephant-baseline/species-{full.tap,check-final.log,build.log}`. Frozen hashes unchanged; 34 initial focused and 8 final narrowed fixture/species tests passed. No dependencies changed.

Native final-build IAB cold Continue on the isolated QA origin restores **1055 ZC, four missions, two macaws, one habitat/four occupied cells, six paths, three guests/30 views, ID/10×**, paused, with actual canvas and no warn/error at limit200. Exact entry module `PlayEntry.astro_astro_type_script_index_0_lang.BCkBRQA8.js`; [receipt](qa/elephant-baseline/species-continue.json). Actual pixels inspected. Earlier native full Q01–Q04 journey is baseline evidence; it is not relabelled as a fresh post-change full run. Own tab closed. No owner saves, push or deployment.

Progress **5/39 (12.82%)**, original V1 **46/51** unchanged. Next EH1-02 append-only expansion helper, then stable scene anchoring before any product activation.
