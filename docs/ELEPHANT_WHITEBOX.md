# EH6-01: final white-box gates

Scope: final local source at915a1b9, including the bounded failed-renderer fallback. No new gameplay logic is added in this gate. The source/build manifests and raw-log hashes bind the existing tests to the reviewed source. The full suite includes83test files, and preserves original assertions alongside the Elephant Grove tests. Tests execute actual commands, shared clock and strict codecs; renderer/controller fakes are explicitly identified in their scoped evidence and do not certify hardware.

| Invariant | Existing executed tests / seam |
|---|---|
| Exact legacy species, original Q01-Q04 and separate EH proof | elephant-species, elephant-legacy-baseline, elephant-legacy-regression, care-mission, thriving-mission, elephant-missions |
| Original120cells/anchor and append-only map; real ghosts/collision | elephant-expansion, elephant-scene-anchor, elephant-construction, placement-preview, elephant-footprint |
| Swept-body fences, routes, turning escape, stock contention, social interrupt | elephant-locomotion, elephant-footprint, elephant-care, elephant-pond, elephant-enrichment, elephant-social |
| Real food/water/pond portions and causal welfare/cooldowns | elephant-care, elephant-welfare, elephant-pond, elephant-enrichment, elephant-consumption, elephant-care-info |
| Grant eligibility, quote/revision, exactly-once debit/award | elephant-runtime, elephant-construction, elephant-missions, elephant-economy, elephant-editing |
| One10ZCadmission, actual outside routes, multi-habitat observations | ticket-admission, elephant-visitors, elephant-attraction, elephant-legacy-regression |
| Balanced compact ledger, purchase/refund provenance and zero-cash recovery | elephant-multispecies-save, elephant-economy, elephant-editing, elephant-recovery, transaction/refund legacy cases |
| Lossless V1/V2, strict species/resources/proofs, no future/corrupt repair | elephant-save-v2, elephant-multispecies-save, save-recovery, autosave |
| One clock, reentrancy, pause, partial cold handoff,1x/10x exactness | clock-reentrancy, simulation-speed, elephant-migration-clock, elephant-legacy-regression, elephant-visual-settings |
| Original skinned rigs, real FSM action reach, reduced motion/disposal | elephant-rig, elephant-consumption, elephant-bath-render, elephant-enrichment-render, elephant-social-render, elephant-visual-settings |
| IDEN/readonly help, actual-state onboarding and actor scope | elephant-localization, elephant-onboarding, elephant-care-info, elephant-recovery |

Code review confirms the root runtime is validated as an exact V1 or V2 discriminated save. Macaw views filter their own species/resources; the mixed save is never persisted through a lossy projection. Grant candidates require actual claimed-Q04 proof and a matching command; publication follows durable adoption. Native IndexedDB readwrite transactions compare generation and revision, preserve the first V1 record atomically and reject writes below schema2. The original binary version1 open is blocked after the database upgrade. View renderers read gameplay state; graphics changes do not produce finance or care events. Actual native transaction/fault reruns remain the separate EH6-03gate.

Final source fingerprint `83b2a0baa70e794f87dec287855914f4877bdeee1792d901ece8ea5e317aaaf4` remains unchanged throughout the run (326inputs). **719/719 tests PASS**,0fail/cancel/skip/todo,163753.222ms. `npm run check`:307files,0errors/warnings/hints. `npm run build`:9pages/24outputfiles, final build fingerprint `d299a6d5adcc57d4a854b7b43aaaace41e18ff33a4fa5491130927dcd0ca4961`. Existing lazy Three chunk-size advisory is visible; the public build does not contain the private QA bundle. Raw logs (about94KB total), portable LF hashes, exact commands, timestamps and counts are retained in [verification](qa/elephant-whitebox/verification.json), [unit](qa/elephant-whitebox/unit.log), [check](qa/elephant-whitebox/check.log), [build](qa/elephant-whitebox/build.log). The Node run emitted spec output despite the recorded appended reporter argument; it is not falsely described as TAP. Final native/runtime evidence from EH5-04 remains separate.

Limits remain explicit: white-box execution does not prove physical GPU/phone performance, live deployment, or the15-minute active soak. Those gates and five pre-existing V1 evidence/signoff items remain open. No owner data, original checkout, push or deploy is touched. Next: EH6-02native golden journey and negative cases.
