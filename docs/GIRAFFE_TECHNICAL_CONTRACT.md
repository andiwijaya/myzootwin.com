# GH0-04: executable lateral layout contract

The design fixture in `tests/fixtures/giraffe-layout-plan.mjs` is explicitly not an activated save or runtime migration. Four executable tests pass against the frozen earned V3 source. Runtime activation remains gated on a strict V4 codec, storage backup/CAS and native browser proof.

Rebuild624 row-major entries, width24/height26. For each x<12 copy exactly the old tile at z*12+x to z*24+x. New cells are clean land, no path/occupant. No economy, actor, resource, clock, RNG, mission or preferences change. Renderer must retain origin(6,5); its viewport/picking proof remains GH1-03.

Recommended anchor x13, z=clamp(round(actual saved macaw cell-center mean z)-3,1,3), fallback2 only for a locked preview without a macaw. The frozen zoo yields(13,2), cells x13..19/z2..8. x12 is outside circulation; x20..23 stays available. Reserve x12..23/z10..25 remains untouched and buildable.

**Decision: use a legal land connector, no bridge.** Existing land at z10 passes around the southern creek end; route travels east to(11,10), north to(11,9), east to(12,9), then north to view(12,8). It uses the existing shared real visitor BFS, terrain/scenery masks and gate north/south approach. The frozen earned zoo needs12 actual15ZC path purchases (180ZC): x3..11 at z10, then(11,9),(12,9),(12,8). Earlier connector cells already paid in V3 are reused. No new path is built at z10 in the new wing. No trees, old habitats or player facilities move. Removing the final connector cell makes the actual target unreachable.

The future UI must quote the actual save's least-cost legal route using the existing Dijkstra helper; this fixture is not an instruction to auto-build. A blocked unusual save must show unavailable, never teleport or mark connected by distance. Tests assert paid proposals contain only legal empty land, no scenery, water or enclosure crossings. Bridge implementation is unnecessary for the verified baseline.

Draft total with complete habitat700, two browse180, water75, shade90, optional enrichment65, connector180, two food services24, water6, enrichment4 and first four-habitat upkeep8 =1332ZC. From grant1850 the design leaves518ZC. This is an executable quote, not yet a real zero-cash gameplay acceptance; GH4-03 must prove commands, exact receipts, upkeep and recovery. No historical price receipt may change.
