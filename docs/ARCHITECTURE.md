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
