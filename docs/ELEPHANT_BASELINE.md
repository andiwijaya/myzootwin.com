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

Time conversion verified using both UTC clock and local Windows `+07:00`: hard stop **10:00 UTC = 17:00 WIB**; checkpoint before **09:55 UTC**. All foreground commands bounded; stop owned previews/tabs and verify ports before final checkpoint. No automatic resume.
