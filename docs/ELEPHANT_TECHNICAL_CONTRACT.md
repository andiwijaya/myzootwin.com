# EH0-04 — additive implementation contract

5 November 2026. Reference/provenance checkpoint `1f537674c9398c24ab45fafb30bb73b24fe4f658`. This contract freezes design and its executable fixtures; it does not claim the expansion is playable or migrated.

## World and coordinates

Append 96 land cells at z=10..17 to 12×10, producing 12×18. Preserve every original cell index `z*12+x`, coordinate, terrain, path and occupant. Gate remains (1,8). No automatic player paths, habitat, animals or grant during migration. Default proposed footprint x=3..8,z=11..16; viewing outside fence at (2,13). Real existing four-neighbor visitor graph verifies the connector (1,9),(1,10),(2,10),(2,11),(2,12),(2,13): **six new paths /90 ZC**, all free of current scenery. Removing (1,10) makes it unreachable. Actual saved layouts may vary; preview remains authoritative and cannot auto-build this fixture.

Freeze legacy scene anchor **(6,5)**: tile center `(x+.5-6,z+.5-5)`. The expanded soil center becomes (0,4), while old meshes and scenery retain their coordinates. Use one converter everywhere: terrain, catalog object-cell inverse, birds, resources, habitats, paths, visitors, selection/ghost and focus. Camera ground bounds become x=-6..6,z=-5..13; symmetric height/2 clamps must use the anchored rectangle's center. Current dimension-centered rendering would shift old objects by -4; do not activate map growth before EH1-03 regression is green. Golden catalog/bounds and actual rotated picking required there.

New scenery must be within the same authoritative blocker mask as placement; preserve the existing mask for 120 legacy cells. Keep open walking lanes inside 6×6, two feeder stations and at least two drinking/pond approaches. Resource obstacle/approach rules belong to simulation, never renderer-only. Actual layout design tests are in `tests/elephant-layout-plan.test.mjs`; fixture is explicitly not a valid V1 save.

## Type and subsystem boundaries

Retain exact V1 interfaces and codec as the frozen input contract. Introduce discriminated shared V2 animal/habitat/resource types. Legacy macaw functions explicitly accept macaws; elephant ground FSM lives in its own module and cannot inherit flight/perch phases. One authoritative state/tick/RAF/ledger/backend. Q01–Q04 use macaw-scoped objectives; EH01–EH04 have separate persisted proof/reward namespace. Do not change old counters or claim legacy rewards because a new animal appears.

## Unlock and conservation budget

Eligible means **Q04 explicitly claimed**, represented by validated completedIds plus its matching sanctuary-banner/thriving-sanctuary reward proof. A qualified-but-unclaimed Q04 or merely null currentId is insufficient. The frozen fixtures exercise both states. No migration credit. Grant command uses stable `elephant-expansion-grant-v1` proof retained through finance compaction; one claim, 1400 ZC design baseline. UI state alone cannot authorize money.

Design facility quote: 650+160+90+170+80+60 =1210 ZC; actual fixture connector90; initial two feeder services16 + water4 + pond12, plus first two-habitat upkeep4: **1336**, leaving64 from a zero-cash grant. EH4-03now verifies these implemented prices with actual commands, first upkeep and negative recovery. Paid-care9000ticks minimum60/final124; actual closed/depleted zero-cash recovery ends22without another grant. See ELEPHANT_ECONOMY.md; physical active wall-time soak remains EH6-04.

## Lossless storage and rollback

Validate original V1 first, then clone/extend without rewriting legacy tick, RNG, IDs, money, checkpoint proofs, mission records, preferences or entities. Persist explicit ZooSaveV2, strict bounds/references/species ownership, no downgrade codec fallback. Compare projections of all nine frozen saves before/after; reject corrupt/unsupported input with existing recovery, no reset.

Use existing IndexedDB readwrite **revision + generation CAS** to serialize tabs; accept a grant only from the winning persisted transaction. Losing tabs stop on conflict and reload, with no optimistic success/retry credit. BroadcastChannel is advisory. Existing backend closes on versionchange. V2 requires a database-version barrier (upgrade from1 to2) before its first write: old binaries opening version1 receive VersionError and cannot overwrite V2, including after code rollback. Preserve the original V1 checkpoint under a distinct migration backup key atomically; never restore it over valid V2 automatically. Upgrade-blocked/quota/interruption/mixed-tab behavior must pass EH1-05/EH6-03 before enabling V2 in product. Rollback of code preserves data; user recovery must be explicit and generation-safe.

## Measurable product seam

First real seek/use within15–30 active seconds of reachable essentials. Both elephants must eat and drink, no monopolization, clipping or fence escapes. Pond/spray needs wet source+contact+FSM event; shade/log/social need causal welfare and cooldown. Visitors deterministically reach both populated habitats, one gate ticket each. EH missions require real events. ID/EN,360×780,780×360,1366×768, cold Continue, pause and1×/10× need final-source evidence. Physical-device claims remain separate.

Four deterministic design tests pass; no new production code or dependency change. Browser evidence from EH0-02 applies only to unchanged original game. Product construction/migration/bathing/elephant art are still unimplemented.
