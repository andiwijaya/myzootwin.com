# Proposed V1 game architecture (M0-01 recommendation)

Status: V1 logical design originated at M0-01; updated after verified M0-06 foundation. /play entry, lazy Three renderer, typed deterministic core and save codec now exist; gameplay and persisted storage do not. See M0-06_SIMULATION_CONTRACT.md for actual contracts and limits. Authority: complete owner PRD v1.0 and handoff reads; preserve /play-first scope, one Tropical Creek Sanctuary, one validated tropical bird species/two animals, no backend/login/IAP/multiplayer and M7 deferred.

## Reuse Astro and isolate game loading

Keep Astro static output and Vite pipeline. Existing src/pages/play.astro provides game-specific metadata, entry/loading/error/fallback structure and starts the lazily imported TypeScript foundation client. Load Three.js only on /play. Journal pages continue using the existing BaseLayout. Do not migrate the site or add a second bundler/repository. Direct /play reload must serve its own entry/canonical instead of the homepage fallback, as the local route now does; production has not received this implementation.

Start with native TypeScript/DOM UI in a scoped root unless evidence later warrants another UI framework. The game client owns init(root)/dispose(); camera, listeners, observers, RAF, audio and GPU resources must be cleaned up on exit/restart. One RAF orchestrates rendering and a fixed-step accumulator; no parallel simulation loop. Clamp elapsed catch-up, pause hidden tabs, and implement 1x/10x as simulation time scaling without multiplying render loops.

## Logical source boundaries

| Directory under src/game | Responsibility |
|---|---|
| core | Serializable typed state, fixed tick, seeded RNG, commands/events, config |
| world | Grid, occupancy, bounds, placement and path connectivity |
| animals | Species definitions, need model, welfare, finite-state behavior and movement |
| visitors | Gate spawn/caps, reachable paths/viewing spot, satisfaction and unique admissions |
| economy | Integer Zoo Coins, validated costs, ledger and idempotent payments/refunds |
| missions | Ordered Q01-Q04 objectives, event evaluation and exactly-once reward IDs |
| render3d | Three.js scene/models, interpolation, raycast, camera, disposal |
| ui | Localized HUD/panels/hints, pointer intent, tap-vs-drag, keyboard controls |
| persistence | Versioned save validation/migration/recovery and explicit storage failure |
| telemetry | Optional isolated privacy-aware events; default no new transmission until reviewed |

## State and command contracts

Implemented foundation contract in src/game/core/state.ts and persistence/save-v1.ts: schemaVersion=1, persisted RNG seed/state, gameTime/tick, currency, stable entity IDs, world occupancy/paths/habitat/resources, two animals with needs/behavior/position, visitors/admission IDs, cash ledger, mission objective/reward state. Persist data, never DOM/Three.js objects or classes. Keep locale/graphics/mute/reduced-motion preferences separately where practical. Start with bounded local JSON storage if measured size is small; surface failures and recover corrupt data without silent deletion. Use IndexedDB only if a measured need justifies it.

Simulation is the sole authority for positions, needs, resources, visitors, money and mission progress. Renderer reads snapshots and interpolates; it cannot mint revenue or progress based on animation completion. Validate each build/care/pay/reward command, reject invalid/insufficient-funds input without side effects, apply mutations atomically, use stable operation/entity IDs for duplicate input and reload safety. Clamp need/welfare values 0-100; keep simplified welfare formula and balancing in config and distinguish it from animal science.

## Verification and mobile budgets (not passes)

Pure deterministic sim/world/economy/mission/persistence tests do not require WebGL. Integrate HUD-state-render transitions and actual browser tests separately. Set up local test tooling in M0-07, not Actions. Future tests must cover disconnected paths, inaccessible resources, no negative balance, unique admissions, idempotent missions, save migration/corruption, pause/resume/restart cleanup and 1x/10x equivalence.

Use constrained isometric camera, touch pan/pinch, large confirmation targets, build ghost+text status and unobstructed world controls. Portrait 360x780, landscape, desktop 1366x768/1920x1080 are PRD baseline viewports; emulation is not physical Android. Render unsupported-WebGL and loading/error retry states explicitly. Low quality adjusts rendering detail, not simulation rules. Profile actual canvas: target mobile >=30 FPS and desktop >=60 FPS when hardware supports, <=20 MB first-play download, measured interaction <=10 seconds under stated conditions and 15-minute soak. None are verified yet.

Procedural low-poly environment plus one attractive recognizable animated bird is feasible without downloading unlicensed models; M0-03 selected Ara ararauna and an original procedural study with recorded rights treatment; final recognizable animated art remains M2-01. Existing journal hero is preserved. No new telemetry until privacy review. No push/deployment before final release gate and verified Cloudflare identity/rollback readiness.

## M0-06 implemented integration

The existing renderer RAF is the sole browser frame owner. It calls simulation.frame(timestamp); fixed-clock applies 100ms steps with a 250ms frame cap/three-step bound. Typed tick events drive the abstract preview marker from simulation game time. Renderer resize never advances simulation. Pause/visibility/dialogs clear the partial tick/anchor and stop the RAF; reduced motion freezes the visual only. Cleanup unsubscribes and disposes core alongside renderer resources. No simulation-owned timer/RAF, gameplay or offline income.

The version1 codec validates concrete world/animal/visitor/ledger/mission/preferences data with bounded arrays and references, rejects unknown schema/corruption, and clones snapshots. Initial two macaws are reserve data, not visually placed animals. Serialization samples are engineering fixtures. Autosave/Continue, migration/repair, storage error UI and retention/compaction remain M5; domain algorithms/commands remain M1-M4. Node native strip-types runs pure/integration tests; reproducible broader E2E tooling is next M0-07.

## M1-04 placement-preview boundary

`game/world/placement-preview.ts` defines a serializable2x2 habitat proposal, ordered validation reasons and revision-checked planning state. The renderer reads the actual simulation snapshot world; it no longer creates a second initial-world copy. A conservative static scenery blocker set comes from existing catalog bounds. A confirmed plan is explicitly session-local UX state and is not a ZooSave habitat/occupancy/money transaction. M1-05 must reuse validation and commit actual habitat/occupancy atomically through the authoritative simulation command boundary, with stable operation IDs; it must not treat a blue outline as a constructed habitat or mission event.

Camera tap callbacks route to either footprint anchoring or identity picking according to mode. Drag/pinch/cancel never trigger the tap seam. Placement has no timer/RAF; ghost/approved outline resources belong to the existing renderer session. Controller forwards only live ready unpaused commands; UI and host diagnostic attributes use separate namespaces. Invalid confirmation revalidates current world and stale revision. Cancel leaves world/save/coins and any previously confirmed plan unchanged. Close/fault/retry/remount disposes planner and GPU resources; no persistence or gameplay completion is implied.

## M1-05 authoritative habitat and renderer-independent session data

`simulation.buildHabitat(anchor,operationId)` delegates to pure `world/build-habitat.ts`: cloned world, shared2x2 validator, fixed scenery exclusion data (geometry-contract tested), one starter habitat limit, stable habitat operation ID. It validates the complete resulting ZooSave before atomic state replacement, then emits habitat-built; duplicate same-ID/same-footprint commands do not mutate or emit again, including after codec reload. Occupancy exactly matches habitat cells. No currency, ledger, mission, bird or visitor mutation. Future priced build/path/refund operations remain M1-06/M1-07/M3 responsibilities.

The existing renderer owns one dynamic habitat layer: original batched wood/floor mesh plus closed wire wall/roof lines, with shared original Batch utility. Actual mesh triangles and occupied tile metadata join the same selection catalog; no invisible selection proxies. One simulation event marks the layer dirty and the existing RAF syncs it; rendering never invents habitat state. All dynamic geometries/materials join the session disposal pool. Context loss cleanup releases a context only if still live, avoiding redundant-loss warnings.

`core/session-state.ts` uses weak owner keys and cloned serializable ZooSave data only, no timers/DOM/meshes. Product and labelled fixture use the same store bridge. Close/fault/dispose snapshots current state, then disposes core/GPU/listeners; replacement renderer resumes from data and a fresh browser-frame anchor. A successful habitat command snapshots immediately too. Same-root panel remount preserves data, stale disposed handles cannot overwrite it. This is in-memory page-session retention, not localStorage/IndexedDB/autosave or navigation/reload durability. Those remain M5. Event receipts distinguish simulationStartTick from events observed by the current renderer subscriber.

M1-06 must connect paths from the real gate to an actual habitat viewing cell and derive reachability from authoritative tile state. Habitat viewingCell is currently null, missions remain unchanged and no access/revenue is asserted. The initial2x2 enclosed space targets two small game-scale macaws/resources later; no scientific husbandry dimensions are implied.

## M1-06 actual paths and derived access

`world/paths.ts` validates single-cell paths using actual terrain/occupancy/scenery. `simulation.buildPath(cell)` atomically prepares/validates/commits a path flag and derived habitat viewingCell, emitting only after commit. A cell is its own stable idempotent target; transaction pricing/ledger identity is not invented here and must be supplied by M3. Repeated existing targets do not mutate or emit. Preview is revision-guarded, stays in path mode after confirmation, and Finish cancels only the unbuilt candidate.

Four-neighbor BFS from actual gate path flags creates reachable cells, deterministic nearest exterior viewingCell and ordered shortest route per habitat. No diagonal/proximity/teleport access. Constructor recomputes derived cache; paths/habitat changes reconcile it before schema validation/commit. Save contains flags/viewingCell, not graph/renderer references; graph is runtime cloned data for later visitors. Mission objectives/rewards are untouched until M4. Same page-session bridge retains data across renderer replacement; document reload/autosave remains M5.

One dynamic path mesh reuses a BufferGeometry/material, releasing old GPU attributes on topology rebuild; tile ownership/connected metadata and selected details refresh. Original scenery draws gate paving only, avoiding duplicate player slabs after restore. One RAF/core, shared ghost/input and session disposal remain. M1-07 must implement real deletion/refund-safe commands and remove actual habitat/occupancy/render data, recompute access and reject late inputs; no editing pass is implied by the existing reconciliation helper.

QA per-case recorder owns ID/verdict after assertions, so observation fields cannot overwrite machine-readable PASS. An actual integrity-audit failure demonstrated this risk; both failed records remain preserved and all final-source checks/browser matrices were rerun after a regression-tested correction.
