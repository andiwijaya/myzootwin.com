# Strict Giraffe V4 persistence — in progress

The new codec is dormant: product entry still uses the released V3 backend and the canonical gameplay union is unchanged. Activation awaits database backup/CAS and actual native Continue. No production data has been opened or written.

GH1-06 implements an exact24×26/624tile V4 schema, separate giraffe entity/resource/FSM/reward branches, unknown/future-content refusal, validated V1→V2→V3→V4 migration and pure lossless old-coordinate projection. New land/mission namespace adds no cash, structures, residents, clock or RNG changes. `projectUnstartedV4` is proof-only and refuses any new content instead of truncating it.

V1/V2/V3 public input schemas remain exact and reject schema4. Their common relationship helpers now explicitly serve V4 with width24 and separately validated giraffe ownership; old species use narrow discriminant predicates. V3's exact field rules are exported for reuse, and V4 adds its own fields. All old animals, mission proofs, purchases, visitors, ledger and preferences still pass their original semantic checks. Giraffe resources, paid49cell home, zero/one/three population, identities, contact/routes/separation, counters, LQ04 unlock, grant and GQ receipts have additional strict validation. Shared journal compaction pins giraffe grants/rewards/viewer proofs; existing schema1/2/3 paths retain their old limits.

Focused codec/legacy regressions22/22 and TypeScript noEmit passed. The first compaction test expected an archive before reaching its normal threshold; the corrected test explicitly uses the existing forced-compaction API and passes without changing the product threshold. Initial failure output is retained. Fixtures with manually assembled giraffe actors are labelled codec fixtures, not a claim of playable construction/behavior.

Default `qa:local` preflight20261106T214900Z-3f0f4648 hit its historical180s unit timeout, before check/build/routes/browser; cleanup passed. The already measured original baseline775tests took263.85s, so the local workflow now gives units a bounded600s budget and retains180s compile budgets,2MB logs, unchanged tests/failure checks and source fingerprints. No test was removed, skipped or relabelled. Full rerun is required before closing GH1-06.

Storage/version4/atomicV3backup/CAS/native faults and V4 read-only maintenance are still UNRUN. An old V3 binary is never a resumable rollback for V4. Production publication remains separately unauthorized.
