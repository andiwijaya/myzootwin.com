# M0-06 — Typed state, deterministic tick and versioned save contract

Status: implementation and relevant verification complete, 2026-10-31 UTC. The subsequent living-PRD record references the implementation/evidence commit. Local only; no push/deploy/Actions.

## Actual result and scope

The existing lazy 3D preview now owns a real typed simulation session. Its **existing single RAF** supplies timestamps to a pure fixed-step core; typed tick events drive the abstract marker's rotation. Meshes never determine simulation state. Initial state contains a concrete 12x10 Tropical Creek grid, two reserve Ara ararauna with no habitat/position yet, a reconciled starter grant, empty visitor/admission collections and Q01 pending. It is a foundation, not implemented animal/building/visitor/economy/mission gameplay. The truthful disabled Play/Continue and all journal UI are unchanged.

Files: `src/game/core/{state,initial-state,random,events,fixed-clock,simulation}.ts`, `src/game/persistence/save-v1.ts`, the existing `render3d/foundation-scene.ts` integration, and `tests/simulation-contract.test.mjs` with a shared populated fixture.

## Concrete save contract

| Data | Representation and checked boundaries |
|---|---|
| Identity/time/RNG | schemaVersion 1; nonzero uint32 seed/current xorshift32 state; safe integer tick; gameTimeMs exactly tick x 100 |
| World | width/height 1-32; complete unique cell grid; land/creek; path and occupant ID; bounded habitats/cells/resources and viewing cells |
| Two animals | One species ID, stable unique IDs; nullable habitat/position for reserve animals; bounded needs/welfare, behavior, movement target and resource target |
| Visitors/admissions | Bounded active agents, path route/index/phase/satisfaction; stable admission and visitor IDs; admission-to-ticket-ledger references |
| Economy | Safe integer Zoo Coins, typed signed ledger entries, stable operation IDs, reconciled nonnegative running balances and tick ordering |
| Missions | Ordered Q01-Q04 completions/current ID, typed bird-care/viewing/duration objectives, unique reward-to-ledger references |
| Preferences | ID/EN, auto/low/high graphics, mute and reduced-motion flags; entry language still uses its separate pre-existing namespace |

Validation rejects missing/extra fields, class instances, sparse/decorated arrays, nonfinite/range-invalid numbers, duplicate entity/operation/admission/reward IDs, inconsistent occupancy, creek paths/overlaps, out-of-habitat animals/targets, incompatible food/water targets, invalid route adjacency and unresolved ledger/mission references. These are structural and consistency rules; placement algorithms, reachability computation, actual payment commands and mission evaluation remain their later features. Save integrity is not a cryptographic anti-cheat claim.

`parseSave` returns explicit `invalid-json`, `unsupported-schema`, `invalid-state` or `too-large` results with field path, without echoing save content. `serializeSave` validates before encoding. Successful results and snapshots are independent cloned data. Parser input is capped at 1,000,000 JavaScript string characters; active visitors at 32, admissions/ledger entries at 8,192 each and other arrays are bounded. No silent truncation or schema repair. M5 must design retention/compaction, migration and storage recovery before real autosave; this codec performs **zero storage reads/writes**.

Two committed engineering samples roundtrip field-for-field: `initial-after-20-ticks.json` (compact 9,654 UTF-8 bytes) and `populated-contract-sample.json` (10,579 bytes). The populated fixture explicitly exercises occupied habitat/resource, placed birds, visitor path/admission/ticket, completed Q01 and reward references; it is not a recorded gameplay session. Pretty JSON file size is larger than compact measurements. Runtime accumulator, RAF timestamps, subscriptions, renderer/DOM objects and paused elapsed wall time are not persisted.

## Tick, pause and ownership semantics

- Fixed tick **100ms**. Equal accepted elapsed time produces identical serialized state across integer/fractional frame partitions. Each tick advances integer time and one reproducible xorshift32 sample; needs, money and missions remain unchanged until their rules exist.
- Each frame accepts at most **250ms**, runs at most **3 ticks**, and retains only a sub-tick remainder. Excess stall time is explicitly counted as dropped. Equal-wall-time comparisons containing clamped gaps are intentionally outside equivalence; no unlimited catch-up/offline reward is granted.
- The first frame only anchors time; repeated/backward timestamps cannot double-update. Pause discards the partial tick and timestamp anchor. Resume starts a fresh anchor. Redundant pause/resume requests are idempotent.
- Existing document visibility and vital-dialog handling use this pause API and stop the same RAF. Reduced motion now freezes visual rotation while the simulation remains logically enabled; it does not disable game logic. Real background phone behavior and reduced-motion media emulation were not device-tested.
- Event unsubscribe is idempotent; removal during dispatch is honored; listener errors are isolated/countable. Reset restores the validated session baseline with one subscriber, including its actual saved tick/time. Disposal prevents further ticks/reset/subscriptions and releases the renderer's subscription. No timer, second RAF, storage or transmission is scheduled by core.

## Verification executed

```powershell
node --experimental-strip-types --test tests/entry-preferences.test.mjs tests/preview-lifecycle.test.mjs tests/simulation-contract.test.mjs
npm run check
npm run build
```

**36/36 tests passed** (21 retained + 15 new), Astro check **28 files, zero errors/warnings/hints**, final static build **9 pages**. Coverage includes a known RNG vector, integer/fractional partition equivalence, bounded stalls, invalid time input, snapshot ownership, save/reload RNG continuation, repeated reset/disposal, event unsubscribe/errors and actual core integration with the existing injected frame driver. Twenty-nine targeted populated-save corruptions plus malformed/future/oversize/class/extra/missing/sparse-array cases reject without modifying input. The first populated roundtrip revealed that mission Q01 reward references need the explicit mission-ID union rather than lowercase entity-ID validation; corrected and all positive/negative cases rerun. Sparse-array hardening was subsequently tested and the final full suite/check/build rerun.

Supported isolated-browser evidence: **13 core/renderer lifecycle observations** and **6 product smoke observations**. Native core tick 17/time1700ms produced marker rotation .425; tick events matched tick count. Explicit pause kept tick18/time1800ms unchanged across UI changes; resume reached tick24 with one pending RAF. Three remount/stale-handle cycles retained one simulation subscriber/session/RAF. Injected native `WEBGL_lose_context` failure disposed core; retry made one fresh session. Final unmount released every subscriber, pending RAF and geometry with zero cleanup errors. This is resource ownership evidence, not a 15-minute whole-process leak proof.

Actual built `/play/` rendered natively on DOM-verified 1366x768, 360x780 portrait and 780x360 landscape; EN/ID settings/Escape, keyboard Open, journal navigation/back, final rebuild Open/Close passed. Zero captured native warn/error messages. Eight original journal routes retained local200/title/canonical/H1; both /play variants had the correct canonical and nine sitemap URLs remained. Original routes/layout/UI/analytics/public assets, dependencies, macaw study and immutable requirements source copies are unchanged. No public request retried the earlier held Python HTTP403.

## Budgets, remaining scope and cleanup

Lazy foundation chunk **539,637 bytes**, gzip level9 **135,451**; entry 13,475 bytes / 5,068 gzip. The raw >500kB Vite warning remains recorded, not suppressed or speculatively optimized. No first-play network, FPS, physical Android/touch/Safari/iOS, soak, complete gameplay/save/mission or full localization pass is claimed.

5 actual screenshots total **465,823 bytes**; build/node_modules remain ignored, no large video. Owned 4321/4322 previews stopped with zero listeners verified; two owned tabs closed and viewport reset. BASE-01/02 remain unchanged. M0-01 exact external Cloudflare binding/build/automatic-deploy verification is still pending; no login/new grant attempted. Next: **M0-07 reproducible local unit/integration/E2E screenshot tooling**.
