> Engineering checklist from complete Library read; direct use authorized after Windows transfer-helper incompatibility. Original files were not materialized.

# MyZooTwin Lion Savanna — living checklist copy
**Source of truth:** `MYZOOTWIN_LION_SAVANNA_MASTER_PRD_V1.md` section 10.
**Current status:** 22/39 (56.41%) — local verification only.
**Do not conflate:** V1 46/51, Elephant EH 38/39 are separately tracked snapshots, subject to re-audit at execution start.

Copy these items into `docs/LION_SAVANNA_PROGRESS.md` and record a time-stamped evidence path and commit per verified feature. Never mark a checkbox solely for design or a mock.

## LH0 — Audit, freeze, and measurable design

- [x] **LH0-01** — Audit repo HEAD, real production deployment, Elephant release approval, current QA gates; record SHA and source/deployment difference.
- [x] **LH0-02** — Freeze golden V1/V2 existing saves and money/quest/visitor/animal projections; define ownership of QA profiles and backup.
- [x] **LH0-03** — Finalize lion visual, social behavior and safety reference notes, independent procedural art and sound provenance.
- [x] **LH0-04** — Design append-only savanna grid, 7×7 placement, walkable kopje, budgets, deterministic seeded gameplay and perf baseline.

## LH1 — Shared world + species + persistence V3

- [x] **LH1-01** — Add lion discriminants to shared species/habitat/resource, typed ground behaviors and source-bounded capacities.
- [x] **LH1-02** — Append lion zone to the V2 12×18 world, preserve old tile order and fixed origin; extend camera/diorama safely.
- [x] **LH1-03** — Implement 7×7 placement previews, occupied/scenery/fence blocking, safe resident routes and accessible visitor viewing cell.
- [x] **LH1-04** — Implement strict ZooSaveV3 and lossless V1→V2→V3, V2→V3 migrations with original backup and future-format guard.
- [x] **LH1-05** — Upgrade single IndexedDB store to version-3 CAS writer and old-binary barrier; prove compaction and retry semantics.
- [x] **LH1-06** — Connect V3 canonical game entry and safe in-memory reset/Continue/Undo with existing one RAF/fixed tick.

## LH2 — First complete lion care loop

- [x] **LH2-01** — Introduce Lion Savanna unlock after EH04 and one-time 1,800 ZC reserve grant, separately claimed.
- [x] **LH2-02** — Create real costed savanna enclosure, 7×7 fence, selection and live/ghost material state.
- [x] **LH2-03** — Welcome one adult male lion (private interim slice), with real state, grounded roaming and saved identity.
- [x] **LH2-04** — Add lion food and drinking stations and causal feed/drink/refill system using shared money engine.
- [x] **LH2-05** — Welcome two adult females and coordinate service access/queue/collision and safe pride membership.
- [x] **LH2-06** — Enable protected enclosure/facility edit/remove/Undo, real paid refunds and removal dependencies.

## LH3 — Lion art + real behavior + signature event

- [x] **LH3-01** — Build original recognizable stylized male lion rig (mane, paws, ears, muzzle, tail) and selection.
- [x] **LH3-02** — Build shared female lion rig with clear morphology, distinct palette/identity and locomotion compatibility.
- [x] **LH3-03** — Implement grounded walking, turning, slope/ramp/kopje approach, collision and deterministic waypoints.
- [x] **LH3-04** — Implement lion resting/shade-seeking with safe privacy choices and fair per-lion rest access.
- [x] **LH3-05** — Implement feeding/drinking animations tied strictly to FSM/resource stock and body/contact positions.
- [x] **LH3-06** — Add elevated kopje viewpoint and iconic ROAR sequence with jaw/head/mane motion and optional licensed/original audio.
- [x] **LH3-07** — Add coordinated, optional affiliative lion social behavior (approach, nuzzle/head rub, synchronize rest).
- [x] **LH3-08** — Add scent trail / scent post + scratch-log enrichment with investigation and replenishment/cooldowns.

## LH4 — Consequences, zoo economy + quests

- [x] **LH4-01** — Implement explainable lion welfare scoring with resource, space, shade/rest, enrichment and social causes.
- [x] **LH4-02** — Extend multi-habitat visitor destination fairness to macaw + elephant + lion with true sightline/viewing.
- [x] **LH4-03** — Balance reserve/operating prices, periodic upkeep, attraction and cash recovery without passive exploits.
- [x] **LH4-04** — Add LQ01–LQ04 real evidence-based lion missions, rewards and separate achievement namespace.
- [x] **LH4-05** — Add recoverable shortage/low-cash and blocked-path guidance to keep the lion loop playable.

## LH5 — Discoverability, mobile and accessibility

- [x] **LH5-01** — Ship small ID-first/EN localization, unlock cues, contextual onboarding and next-action hints.
- [x] **LH5-02** — Integrate responsive build/inspect/care/quest panels, camera focus and selection gestures.
- [x] **LH5-03** — Respect mute/autoplay/reduced-motion/WebGL fallback/quality tier with owned GPU/audio lifecycle.
- [x] **LH5-04** — Run complete game journey with V2 migration, 3 habitats, lion FSM, quests and cold Continue at 1×/10×.

## LH6 — Hardening, release and safe handoff

- [x] **LH6-01** — White-box deterministic unit/property/regression tests for strict invariants and all species.
- [x] **LH6-02** — Black-box native browser E2E including real 3D behavior, visitor reachability and keyboard/touch emulator.
- [x] **LH6-03** — Version-3 migration/fault-injection tests for CAS, quota, abort, corruption, malformed save and concurrency.
- [ ] **LH6-04** — 15-minute active 1× soak and 10× fixed-tick/visit stress + GPU/heap/draw-call/payload measurements.
- [x] **LH6-05** — Review dead code, asset rights, dependency/security/privacy, repo size and retained non-game routes.
- [ ] **LH6-06** — Prepare release/rollback using V3-compatible target; publish only after explicit production approval.

**Milestone progress:** LH0 4/4; LH1 6/6; LH2 6/6; LH3 8/8; LH4 5/5; LH5 4/4; LH6 4/6. **Total 37/39**.

6 Nov 2026 evidence: [foundation](LION_FOUNDATION.md), [V3 codec](LION_V3_PERSISTENCE.md), [native storage and two-tab CAS](LION_NATIVE_STORAGE.md). Source checkpoints: 557af6c, d69431e; native evidence is recorded in the next local checkpoint. LH0-01 was completed by the later hosting dashboard check below. Product activation, Lion care/art/UI/mission gates remain open until independently verified.



2026-11-06: LH0-01 verified read-only in current Cloudflare Deployments dashboard: production main `2aa836300304477f6e381413b4a39047c28bacf3`, deployment `2c7e695d-620f-49e7-acee-68f73ad281c8`. Same SHA as fresh remote main; local Elephant source `377ec7d` differs only by later release evidence. Original C:\MyZooTwin checkout is stale `63ce52a` and was untouched. Elephant release receipt reports EH39/39; inherited V1 remains 46/51. Direct HTTP audit returned403; native browser public release and hosting dashboard were readable. No deploy action performed.

Latest checkpoint: [care implementation and full regression](LION_CARE_CHECKPOINT.md).

2026-11-06 checkpoint22/39: LH1-02/03/06 and LH2-01..05 combine golden/strict/native storage tests with the actual compiled UI journey in internal UUID database lion-product-5f9b7a20-b826-4187-b4fc-bc05592f0d1d: original habitats, explicit grant, illegal northern preview rejection, paid49-cell habitat, seven priced facilities, stocked ports, three welcomed identities, five paid outside path tiles, saved Continue. LH3-03/04/06/07/08: bounded ground/ramp/collision tests, actual rest, three elevated roars and later live social interaction counts Raka2/Sena4/Tala2, real scent/scratch use. LH4-02/04: all three habitats reached in seeded tests with exact10-ZC admission ledger; four sequential LQ claims completed in internal browser, actual viewers arrival20/23/26, separately preserved Q/EH. Receipt: docs/qa/lion/internal-initial-journey.json, care checkpoint d7c7849 and current scoped tests. Native mobile, detailed selection/contact views, zero-cash journey, final regression, faults and soak/release remain open. The initial transient save error recovered via explicit Retry; diagnostic re-run has not reproduced it, so soak is not yet accepted.

2026-11-06 later checkpoint37/39: [native acceptance](LION_NATIVE_ACCEPTANCE.md) closes actual rig selection/contact, Undo, bilingual responsive UI, quality/reduced-motion/WebGL lifecycle, 1x/10x cold journey and IAB8/8 fault/two-tab gates. Full764/764 plus subsequent24/24 UI regression and clean types. Zero-cash journey, welfare and maintenance evidence are retained under docs/qa/lion. [Release audit](qa/lion/release-audit.json) confirms nine static HTTP routes, eight unchanged journal pages, exact metadata/sitemap, no new runtime network tokens and measured bundle delta. Production npm audit reports0 vulnerabilities; only pinned development fake-indexeddb was added. LH6-04 awaits900000ms active1x on the fixed candidate; LH6-06 stays open until explicit production authorization and later live smoke. No push/deploy.
