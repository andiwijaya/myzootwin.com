# Lion coordinate, budget and ownership contract

World 12×26 appends exactly 96 land tiles after the old 216 in row-major order. Fixed scene origin remains `(6,5)`. Default habitat `(3,18)` has 49 cells through `(9,24)`. Outside corridors x=1,2 remain separate from the enclosure. Existing visitor BFS supplies the actual viewing route, never distance-only access. Previews share the same collision authority; no cash changes during preview/cancel.

The kopje has a level crown at a chosen resource center and a two-tile south ramp, height 0.65. Lion route edges reject side/cliff entry by checking height increments and prop/fence/body clearance at intervals <=0.08 tile. Renderer geometry must use this same height contract. Search is deterministic, at most 121 interior nodes, no RNG or wall-clock reads. Lion movement has a separate FSM; elephant bath/social and bird flight phases are excluded by types.

One habitat, three adults, seven resources (two food stations, one of each other kind), at most 128 saved waypoints per lion, 312 world tiles. Keep the 1,000,000-character save limit pending actual V3 measurement. The 1,800 ZC explicit once-only grant supports the complete paid 12-path layout plus first stock and upkeep reserve. The budget test proves at least 200 ZC remains. Future price adjustments must not rewrite receipts already paid.

Measured baseline: [JSON](lion-baseline-performance.json), 1,000 actual old golden ticks without rendering on Windows Node 24.12.0. This is CPU simulation elapsed time and payload size only, not browser/GPU/FPS evidence. Later native soak must measure its own environment.

Database version 3 keeps the same database/store, existing V1 backup and a once-only V2 backup. Generation/revision CAS remains sole writer. A V2 binary cannot resume V3; hold a tested V3-compatible fix-forward/maintenance candidate before release. Never downgrade/delete storage. No publishing is authorized.
