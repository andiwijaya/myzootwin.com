# EH0-01 — source and production audit

5 November 2026, approximately 08:24–08:29 UTC. **Verified locally; no production mutation.**

- Actual owner repo: `C:\MyZooTwin`, origin `https://github.com/andiwijaya/myzootwin.com.git`, clean `main` at `63ce52a` (full hash in Git history), one documentation commit ahead of origin. No AGENTS.md found in repo. New isolated checkout: `C:\Users\andi_\Documents\Codex\2026-11-05\task\myzootwin-elephant`, branch `elephant-grove`. Installed dependencies copied from the existing repository; no installation or dependency changes.
- Live `git ls-remote` confirms `main = d6aacb8555142a19a9844d84c4b1680ea5013e49`. Read-only authenticated Cloudflare deployment listing confirms latest Production/main **bc8b46ce-2ee6-4f7a-b747-f7634247de2a**, source `d6aacb8`. Production URL `https://myzootwin.com/play/`; isolated release URL `https://bc8b46ce.myzootwin-com.pages.dev`. Existing homepage release receipt corroborates full source hash. This session did not trigger any build/deployment remotely.
- Supported isolated IAB opened live `/play/`: actual entry, Play/Continue/How to/Settings, original Tropical Creek, two-macaw description, mission/build/care/guest panels and journal routes present. No Play/save mutation on apex. Native gameplay regression follows in EH0-02; this observation is not a fresh full live journey.
- Stack: Astro 7.4.4, Three 0.187.0, TypeScript, Node **24.12.0**, npm **11.6.2**. Commands: `npm test`, `npm run check`, `npm run build`. Baseline **494/494** native Node tests pass; Astro **213 files, zero errors/warnings/hints**. Complete ignored logs `.qa/elephant-baseline/{tests.tap,check.log,build.log}`; no tests replaced or loosened. Build outcome recorded at next checkpoint.
- Existing V1 checklist read and preserved: **46/51**. Open: M4-07 recording, M5-07 unaided study, M6-01 performance, M6-03 device/failure coverage, M6-06 signoff. Historical evidence is not silently upgraded. Previous blocked recovery download/QA46/live purchase are not retried.

## Contracts confirmed in current source

`core/state.ts`: V1 schema, macaw-only species, 12×10 initial world, exactly two reserve macaws, 1500 ZC. `save-v1.ts` strictly validates topology, IDs, mission proof and money; raw union widening cannot constitute safe migration. `missions/engine.ts` Q02 enumerates every animal and expects exactly two. `visitors/graph.ts` nearest-only targeting needs later fairness. Renderer centers on world dimensions; extending height before anchoring every coordinate consumer would move old objects. Original gate (1,8), two-bird FSM, fixed 100ms tick, one scene/RAF/ledger/backend must be retained.

Storage already uses revision compare-and-swap with generation and a single in-flight writer. EH grant must reuse this transaction boundary and stop on conflict; a UI lock or BroadcastChannel alone cannot prove exactly once across tabs. V2 rollback must preserve V2 data and prevent V1 overwrite; rolling back code must never automatically downgrade saves. These are future acceptance requirements, not features implemented by this audit.

## Release and rollback boundaries

This task authorizes coding, local testing, local commits. **No push or deployment** without separate permission. `baseline-local` remote points only to the original local checkout; public `origin` remains the audited GitHub URL. Do not push either remote in this session. Baseline rollback is Git `63ce52a` plus production `d6aacb8`/`bc8b46ce`; actual production rollback is UNRUN. Nothing from owner IndexedDB/profile/saves was copied. QA must use its own loopback origin or explicitly labelled synthetic fixtures.

Time conversion verified using both UTC clock and local Windows `+07:00`: hard stop **10:00 UTC = 17:00 WIB**; checkpoint before **09:55 UTC**. All foreground commands bounded; stop owned previews/tabs and verify ports before final checkpoint. Preview supervisor independently kills its own child at **09:54 UTC**. No automatic resume.

## EH0-02 — frozen compatibility baseline

EH0-01 commit **1bc34d6240ed2e06cfb39c9fbe65e04b6d708518**. Full nine-route baseline build also passed; existing lazy Three chunk warning remains visible. No dependency update or owner build overwrite.

`tests/fixtures/elephant-legacy-v1.json` freezes nine complete synthetic V1 states from baseline `63ce52a9c535b47e44417213e88649355979abdd`: new, Q01 claimed, partial Q02 (20 ticks), active visitor, compacted long ledger, zero cash, Q04 qualified but unclaimed, Q04 claimed, ID/low/reduced-motion/unmuted/10× preferences. Each has exact SHA-256 of original codec bytes. No owner state, names, profile or database copied. Zero-cash input is explicitly synthetic and balanced by a matching QA debit, not presented as ordinary player-generated state. The generator refuses overwrite; do not refresh golden hashes to hide regressions.

Four new tests verify exact full-state round trips, money conservation, both original macaw identities/120 tiles, ready-versus-claimed Q04 distinction, non-replay of legacy rewards, deterministic resume/frame partitions, pause/no-offline revenue, corrupt and unsupported rejection without repair. All four pass. Focused suite **68/68** passes including camera navigation/rotation, scene picking, speed, autosave and Q04/ledger. Original full **494/494** pass is reused because production modules remain byte-identical; added tests do not change the game. Logs `.qa/elephant-baseline/focused.tap` and original baseline logs stay ignored and bounded.

### Native browser baseline, 08:31–08:40 UTC

Supported isolated IAB on **127.0.0.1:4391**, actual compiled product, no runtime state/time injection. Fresh Q01 preview/cancel (zero debit), real habitat (300), five path cells (15 each), Q01 +20; welcome exactly two macaws, build/refill food/water, build rest garden, actual eating/drinking/resting; Q02 noncash flowers; real gate visitors and one admission ticket each; Q03 +40/badge; Q04 real 30-sim-second healthy streak and 20 ZC/two new paid admissions, then noncash banner. Native normal 1× and actual 10× selector used. Maintained supplies via actual keyboard controls; no scripted simulation fast-forward.

Final pause: **1055 ZC**, four claimed missions, two placed birds, one habitat, four occupied cells, six path cells, 30 completed views/three active guests, 60 total mission reward coins. Rotation to 45° verified while running. Reload → real Continue restores the same money, habitat/paths/birds/visitors and all mission evidence, paused. Existing V1 resets camera view to overview on cold Continue; this is explicitly recorded, not falsely called a persisted camera preference. ID locale changes and 10× setting persist; no owner profile used.

Actual desktop **1366×768**, portrait **360×780**, landscape **780×360** screenshots reviewed, no horizontal overflow; ID and EN labels and achievement readable. Evidence: [structured observations](qa/elephant-baseline/browser.json), [desktop](qa/elephant-baseline/q04-desktop.jpg), [portrait](qa/elephant-baseline/q04-portrait-id.jpg), [landscape](qa/elephant-baseline/q04-landscape-id.jpg). Console warn/error **0**, uncapped limit 200. Only own tabs closed and viewport reset.

Input limitation: some native coordinate clicks missed while scrolling/rerendering, including one accidental navigation to the site's software notice. Fresh DOM inspection and keyboard Enter resolved; return/Continue worked. A rotation attempted while paused correctly remained disabled. These failed attempts are not counted as passing actions. Initial sandbox socket access blocked local preview; authorized loopback-only elevated preview works. No access expansion or standalone browser driver.

Physical Android/touch/iOS/Safari/Edge, screen recording, process restart, presented FPS and full V2 migration remain **UNRUN**. Native cold Continue is not process restart. Existing V1 five open gates stay open. EH progress **2/39 (5.13%)**; next EH0-03 reference/provenance contract.
