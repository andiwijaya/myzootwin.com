# MyZooTwin — Giraffe Plains Living Checklist

**Created:** 7 November 2026 | **Status:** 7/42 (16.67%). Verified gates only; publication held.  
**Authority:** `MYZOOTWIN_GIRAFFE_PLAINS_MASTER_PRD_V1.md`  
**Record:** after each micro-feature add verified commit SHA, exact tests, source-bound evidence, actual browser proof where relevant, issues and next. `[x]` means fully end-to-end **verified**, not planned/code-written only. Dot owns maintenance and concise updates autonomously.

Progress formula: `verified / 42 * 100`. Final release GH6-06 remains `[ ]` pending explicit production authorization/live smoke even if 41 engineering items pass.

## GH0 — Audit, baseline & design

- [ ] **GH0-01** — Audit fresh HEAD/branch/Cloudflare/live binding, Lion V3 release state and current blockers; freeze SHA and do not infer live status from a local checklist.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [x] **GH0-02** — Freeze V1/V2/V3 synthetic old-player saves, tile coordinate/scene snapshots, macaw/elephant/lion quest/economy/visitor receipts and existing-owner-data isolation.
  - Evidence: `GIRAFFE_BASELINE.md`, `qa/giraffe-baseline/` 775/775; check/build pass; cold hash equality | Commits: `ad2bf1db99728b83b6f06f1f1cf6a3aa79260817`, native source `0a95ba144b495020b0814dc8b9c1c85790910884` | Browser: actual compiled synthetic product desktop/portrait/landscape, ID/EN, cold return, cleanup
- [x] **GH0-03** — Verify giraffe references, animation/welfare rules, original-art license path and game-scale vs real-life husbandry distinction.
  - Evidence: `GIRAFFE_ART_BEHAVIOR.md`; three primary sources checked | Commit: `761177278dec9a05d5ae00d3171153aa58a13b75` | Browser: not required for this reference gate; rendered art remains GH3
- [x] **GH0-04** — Create executable lateral expansion and route design fixtures: 12×26→24×26, macaw-side 7×7 anchor, reserve land and east-west visitor route/bridge decision.
  - Evidence: `GIRAFFE_TECHNICAL_CONTRACT.md`, `qa/giraffe-baseline/layout-tests.txt` 4/4 | Commit: `7a945f80349f8aa4e94e348cdfaa37ef184d4bc4` | Browser: design-only gate; no runtime activation claimed

## GH1 — Horizontal world + strict Save V4

- [x] **GH1-01** — Add strongly typed Giraffe species, enclosure, resources, GQ reward namespace and V4 runtime discriminants; old species functions remain narrowly scoped.
  - Evidence: `GIRAFFE_FOUNDATION.md`, focused 5/5 and noEmit exit0 | Commit: `60c905be78ebdcf62a24c3fc91e10a9262e0ce4b` | Browser: dormant type-only gate; no product activation
- [x] **GH1-02** — Implement width growth with full row-major reindex and frozen legacy (x,z) semantics, no automatic builds or cash; verify all legacy projections.
  - Evidence: `GIRAFFE_FOUNDATION.md`, `qa/giraffe-baseline/expansion-tests.txt` 7/7 including32adversarial grids | Commit: `e9bad1ce04ea4a21358ea1b11a4089d661677e48` | Browser: pure dormant transform; visual gate GH1-03 remains open
- [x] **GH1-03** — Hold legacy scene origin (6,5) and all old object transforms; expand terrain/selection/renderer/camera bounds; test 4-angle picking, portrait and landscape.
  - Evidence: `GIRAFFE_FOUNDATION.md`; scene15/15, TypeScript exit0 | Commits: `6bff153`, corrected native probe `36a0675c4b08597000d7496fdec22c785a58ebda` | Browser: real original renderer modules,48projected raycast checks, native selection,3viewports,0GPU resources after close; static probe, not full V4 gameplay
- [ ] **GH1-04** — Build a real legal east-west visitor connection; choose safe land corridor or a bridge where needed, with correct paid transaction, topology, visuals and no teleport.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH1-05** — Introduce actual 7×7 giraffe plot/ghost in lateral east wing, macaw-aligned z and a clear outside path; forbid overlap, keep unused parcels empty/buildable.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [x] **GH1-06** — Implement strict, lossless V3→V4 plus validated V1/V2 paths; preserve historical data and enforce future-content/unknown-format guards.
  - Evidence: `GIRAFFE_V4_PERSISTENCE.md`, codec22/22; full790/790; check377clean/build9pass | Commit: `32e7dc9` | Browser: pure opt-in codec; native storage/full V4 Continue in GH1-07. Global HTTP preview failed due sandbox readiness and is not claimed passed.
- [ ] **GH1-07** — Use one IndexedDB store version 4 with CAS, atomic V3 backup, old-binary barrier, full V4 Continue, corruption/quota/blocked-upgrade tests.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`

## GH2 — First genuinely playable giraffe loop

- [ ] **GH2-01** — Expose ID/EN Giraffe Plains unlock after proven LQ04 claim, plus explicit exactly-once conservation grant committed before celebratory UI.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH2-02** — Implement real paid 7×7 fence/habitat construction, occupancy and save/selection with actual internal giraffe locomotion clearance.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH2-03** — Welcome first giraffe as a real persisted actor with autonomous safe ground movement, correct enclosure and no passive reward.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH2-04** — Add high browse food station with real stock, refill and actor consumption; complete first build→feed→needs-change→save loop.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH2-05** — Add actual water and shade/rest, reachability, cost/refill/use and causal welfare; reject inaccessible/overlapping care assets.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH2-06** — Welcome two more adult females, fair scheduling of browse/water/shade, safe distinct identities and persisted loose-herd relations.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH2-07** — Support guarded remove/refund/Undo, dependency protection, route breaks and low-cash rescue without duplicating receipts or orphaning giraffes.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`

## GH3 — Procedural art and authoritative behavior

- [ ] **GH3-01** — Create original low-poly adult giraffe rig with recognisable legs, neck, ossicones, ears, tail and pattern; camera/selection/LOD verified.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-02** — Implement deterministic long-neck browsing and head/neck reach toward actual high browse port; no leaves consumed from cosmetic motion.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-03** — Implement four-beat ground walk, turns, body separation and smooth hoof contact, with deterministic collision/fence and no clipping.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-04** — Synchronize mouth/tongue/browse animation with confirmed actor feeding, real stock decrement and interruption/Continue semantics.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-05** — Animate safe foreleg stance/head lowering for drinking only at real reached water; support cold-load and pause mid-action.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-06** — Implement visible shade-seeking, rest/rumination and recovery with actual shelter/energy changes, cooldowns and fair access.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-07** — Implement loose non-teleporting herd proximity/social visits and separation behavior, respecting independent needs and path clearance.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH3-08** — Add variation in elevated browsing/enrichment and repeated returnable causal activities, preserving food as essential care rather than optional puzzle.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`

## GH4 — Consequences, economy, guests and missions

- [ ] **GH4-01** — Build explainable giraffe welfare by nutrition, water, rest/shade, movement/space, social and enrichment; display source-based game approximation.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH4-02** — Extend reachable visitor destination rotation to macaw + elephant + lion + giraffe with true views, explicit target lock and one entrance ticket per visitor.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH4-03** — Balance quoted costs, once-only grant, maintenance, low-cash continuation, refund caps and compacted ledger under long play.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH4-04** — Add GQ01/02 construction+care missions with authoritative proof, safe reward claiming and no old Q/EH/LQ counter pollution.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH4-05** — Add GQ03/04 high browsing + herd welfare + actual giraffe guest visit missions and durable exactly-once rewards.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH4-06** — Verify full 4-habitat golden play at 1×/10×, cold Continue, browser refresh, pause/reset and real causal progression in a single state.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`

## GH5 — Discoverability, mobile and localization

- [ ] **GH5-01** — Ship ID-default/EN complete content, compact guide/Quick Start, species-specific needs, land/fence/building explanation and reward feedback.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH5-02** — Add one-tap focus buttons Macaw/Giraffe/Elephant/Lion/All, robust 4-angle camera/tap-pinch-drag, readable portrait/landscape builder.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH5-03** — Respect graphics tier, reduced motion, mute, loading and WebGL/context-loss recovery with one RAF and owned GPU/audio cleanup.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH5-04** — Stabilize native selects and care panels during ticks (avoid Pride Care-style option churn), keyboard/ARIA/contrast/touch targets and old journal routes.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`

## GH6 — Proof, hardening & controlled release

- [ ] **GH6-01** — Run full white-box deterministic/invariant/property regression for all species, tile reindex, migration, money, guests and rewards.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH6-02** — Use the internal browser to prove actual 3D E2E, real source build, ID/EN, desktop 1366×768, mobile 360×780 and 780×360; no computer takeover.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH6-03** — Run IndexedDB V4 failure injection: blocked upgrade, two-tab CAS, quota/abort, corrupt/future saves, missing V3 backup, cold return and writer race.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH6-04** — Perform ≥15 active minutes 1× native internal-browser soak plus 10× simulation stress; record CPU/memory/GPU-when-available, FPS and payload deltas.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH6-05** — Audit dead code/import graph, dependency/security/privacy, original art/rights, distribution files, repo/QA size and unchanged original website routes.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`
- [ ] **GH6-06** — Prepare V4-aware fix-forward/maintenance recovery and controlled production release; publish ONLY when separately authorized and verify live asset/source/save-safe smoke.
  - Evidence: `UNRUN` | Commit: `NOT YET` | Browser: `UNRUN`

## Current baseline

Source references were read in full through Library: README `libfile_f526fd483a448191a867e309e85173bf`, checklist `libfile_67369feca9f0819195f5ae0dcdba506e`, handoff `libfile_b71e81cf32208191b74968ccccb41dfc`, master `libfile_97683d38e2808191b76235024c6eeb2d`. This is the requested working checklist, not a replacement Library original.

Isolated local clone: branch `giraffe-plains`, base `769cbeab0af2e5c76bb6e40a8851eec8532a1127` (documentation only after released `325223403a2dec1b805f05d9fb8d795d09568585`). No pushes or deployments authorized.

GH0-01 partial: fresh remote main is 3252234; GitHub Cloudflare check completed success 2026-11-06T15:13:28Z. Native internal-browser production read showed expected `PlayEntry...BlnC5Z-3.js`, no warn/errors in the captured window, and an existing save that was not continued/read/reset. Direct administrative dashboard access was denied by automatic review for insufficient explicit authorization to private Cloudflare administration. Current dashboard binding is BLOCKED, not inferred. See `GIRAFFE_BASELINE.md`.

## Completion log (append, never silently retroactive)

| UTC/WIB | Feature | Commit | Unit/check/build | Internal browser evidence | Result/issues | Total |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | 0/42 |
| 2026-11-06 UTC | GH0-03 | 761177278dec9a05d5ae00d3171153aa58a13b75 | Three primary references, original procedural art contract | Not a rendered art gate | Audit admin blocked independently | 1/42 |
| 2026-11-06 UTC | GH0-04 | 7a945f80349f8aa4e94e348cdfaa37ef184d4bc4 | 4/4 deterministic design tests | Runtime proof remains GH1 | Legal land route,12 purchases/180ZC in frozen zoo | 2/42 |
| 2026-11-06 UTC | GH0-02 | ad2bf1d + native0a95ba1 | 775/775; check365clean; nine-page build | Actual3D/cold equality/IDEN/threeviewports | Superseded stale diagnostic retained; no physical-device claim | 3/42 |
| 2026-11-06 UTC | GH1-01 | 60c905be78ebdcf62a24c3fc91e10a9262e0ce4b | focused5/5; TypeScript noEmit | Type-only | Dormant V4 | 4/42 |
| 2026-11-06 UTC | GH1-02 | e9bad1ce04ea4a21358ea1b11a4089d661677e48 | focused7/7;32adversarial grids | Pure transform | Product activation gated | 5/42 |
| 2026-11-06 UTC | GH1-03 | 36a0675c4b08597000d7496fdec22c785a58ebda | scene15/15;TypeScript exit0 | actualrenderer48raycasts/3views/nativeclick/focus/cleanup | Static probe; fullgame gate later | 6/42 |
| 2026-11-06 UTC | GH1-06 | 32e7dc9 | 790/790;check377clean;build9 | Native storage follows GH1-07 | Global HTTP preview timeout retained; no activation | 7/42 |

## Hard boundaries

- Horizontal peta **24×26**, giraffe di samping utara macaw, **empty southern east wing**; V3→V4 lossless.
- Browser QA memakai **internal browser**; **NO “Take over computer”** dan no owner's personal saved browser.
- Functionality first; no per-feature user approval/manual testing; real blockers only.
- `GH6-06` may only close after separately approved production release + actual smoke and V4-aware safe recovery.

Storage milestone (not a checklist closure): native real IndexedDB 10/10 at bd43f5e, cleanup14/14, zero captured warnings/errors. Full-game V4 Continue still pending.

Non-browser playable-core milestone (browser gates remain open): quoted1850grant, paid recommended49cell home,0/1/3adult welcome, two essential browse/water/shade with paid services, grounded care FSM, welfare/social contact and GQ01-04 now pass real command/tick tests. Applied from a separate draft with exact original-file SHA guards; combined regressions28/28 and TypeScript noEmit pass. Main native webview-attachment failure persists; no new checklist closures.
