# MyZooTwin V1 living progress

Updated: 2026-10-31 UTC. Authority: owner-supplied Master PRD v1.0 and Dot Handoff, read completely in Library (see SOURCE_PROVENANCE.md). This is a derived execution checklist; it does not replace the complete authoritative PRD. Source-byte import and canonical full PRD preservation are blocked as documented below.

Verified V1: **0/51 (0.00%)**. M7 excluded: **12 deferred items**. No gameplay implemented or production changed.

## Current checkpoint: M0-01 PARTIAL / BLOCKED

Completed: local/GitHub audit; live route, sitemap, analytics baseline; source documents read completely; architecture recommendation. Evidence: M0-01_AUDIT.md and ARCHITECTURE.md.

Pending: (1) preserve source files through a supported Library materialization route or explicit complete source-text handoff; Windows helper fails at required metadata. (2) authenticated read-only Cloudflare Pages project/build/routing/binding verification; current available dashboard session requires login. Do not infer deployment identity from README or Cloudflare response headers.

No feature checkbox marked complete. No M0-02 execution yet. Once blockers resolve, close M0-01 with evidence and local commit; then M0-02 baseline screenshots/smoke/rollback plan.

## V1 checklist (exact task wording from PRD)

- [ ] **M0-01** Audit repo, stack, Cloudflare Pages routing, existing content/SEO, analytics; catat apa yang boleh di-reuse. **Verify:** laporan audit dan baseline routes.

- [ ] **M0-02** Ambil baseline screenshots & browser smoke existing homepage, navigation, mobile; kumpulkan rollback plan. **Verify:** snapshot dan baseline tests.

- [ ] **M0-03** Asset inventory + licenses + visual target; pilih model satu spesies burung tropis yang feasible dan legal. **Verify:** manifest asset, ukuran, attribution.

- [ ] **M0-04** Buat route `/play`, start screen, navigasi & link dari site tanpa merusak routes lain. **Verify:** reload direct URL /play + original URLs.

- [ ] **M0-05** Setup 3D canvas, loading, WebGL failure state; no blank screen. **Verify:** desktop/mobile render & negative test.

- [ ] **M0-06** Tentukan typed game entities, simulation tick, event bus minimal, save schema version. **Verify:** architecture tests & serialization sample.

- [ ] **M0-07** Setup unit, integration, local E2E + screenshot capture yang dijalankan tanpa GitHub Actions. **Verify:** reproducible test commands.

- [ ] **M0-08** Tetapkan initial performance baseline, screen sizes & artifact hygiene. **Verify:** baseline measurements recorded.

- [ ] **M1-01** Render small low-poly tropical diorama (tanah, creek, pohon, gate) dengan kamera isometrik. **Verify:** visual screenshot mobile/desktop.

- [ ] **M1-02** Pan/zoom camera dengan mouse dan touch, clamped. **Verify:** gesture & wheel tidak keluar map atau page-scroll tak sengaja.

- [ ] **M1-03** Scene picking: pilih tile/object, show panel identitas. **Verify:** raycast mouse/touch akurat.

- [ ] **M1-04** Build-mode preview dengan valid/invalid placement, Confirm/Cancel. **Verify:** cancel no side-effects.

- [ ] **M1-05** Place valid habitat/fence dalam bounds; persist occupancy. **Verify:** tidak overlap/keluar map.

- [ ] **M1-06** Place visitor path dari gate ke enclosure; cek connectivity. **Verify:** disconnected route terdeteksi.

- [ ] **M1-07** Editing: pilih/hapus/perbaiki salah tempat sesuai aturan refund; kontrol anti-double-input. **Verify:** balance dan occupancy konsisten.

- [ ] **M2-01** Satu model bird stylized final-quality + animation states minimum. **Verify:** bukan placeholder, ukuran & animasi mobile baik.

- [ ] **M2-02** Place dua bird instances di habitat; idle/wander/perch autonomous. **Verify:** bergerak, tidak clipping/keluar pagar.

- [ ] **M2-03** Feeder dapat di-place, diisi, dikonsumsi; animal seek-food. **Verify:** aksi care berdampak terhadap model kebutuhan & animasi.

- [ ] **M2-04** Water source dapat di-place, diisi, dikonsumsi; seek-water. **Verify:** thirst response dapat diobservasi.

- [ ] **M2-05** Rest/perch + energy behavior + enrichment sederhana. **Verify:** state transition tidak macet.

- [ ] **M2-06** Animal info & welfare formula + alert dengan sebab yang jelas. **Verify:** low/high welfare test scenarios.

- [ ] **M2-07** Full animal action QA: tidak teleport, sumber inaccessible tidak dipakai, tab pause/resume aman. **Verify:** multi-cycle E2E dan visual evidence.

- [ ] **M3-01** Visitor spawn dari gate dengan cap jumlah agent. **Verify:** terlihat bergerak, tidak spawn di air.

- [ ] **M3-02** Simple walking/path graph ke viewing spot, return gate. **Verify:** rute putus mencegah kunjungan.

- [ ] **M3-03** Guest satisfaction berdasar habitat reachable + welfare, UI visual feedback. **Verify:** negative dan positive cases.

- [ ] **M3-04** Tiket masuk dibayar sekali per visitor ID; ledger. **Verify:** tidak duplikasi saat frame drop/reload.

- [ ] **M3-05** Cost build/feed/maintenance divalidasi vs saldo. **Verify:** insufficient coins tidak membuat objek gratis.

- [ ] **M3-06** Cashflow/ticket/opex ringkas & configurable tuning. **Verify:** balance benar pada time scale berbeda.

- [ ] **M3-07** Low-cash alert & recovery path; no unwinnable softlock. **Verify:** pemain bisa pulih dari skenario saldo minimal.

- [ ] **M4-01** Mission event engine dan completion idempotence. **Verify:** reward exactly-once.

- [ ] **M4-02** Onboarding Q01: habitat & connected path (contextual hints). **Verify:** first-time player can finish.

- [ ] **M4-03** Mission Q02: dua burung, makan & minum, welfare target. **Verify:** bukan sekadar tombol claim.

- [ ] **M4-04** Mission Q03: admission + viewing visit. **Verify:** guest actions counted once.

- [ ] **M4-05** Mission Q04 & unlock kecil, local achievement badge. **Verify:** unlock persists.

- [ ] **M4-06** Implement 1×/10× game speed dengan consistent fixed-step economics. **Verify:** deterministic equivalence & no accelerated render loop.

- [ ] **M4-07** Golden-path 10–15 minute playable E2E dari new game → 3+ missions → economic loop. **Verify:** screen recording and bug list zero blockers.

- [ ] **M5-01** Autosave & Continue via versioned local persistence; save at logical safe checkpoints. **Verify:** refresh/reopen.

- [ ] **M5-02** Load-validation, migration strategy, corrupted-storage recovery without silent wipe. **Verify:** intentionally malformed save test.

- [ ] **M5-03** Pause/resume & background tab, restart/reset with confirmation. **Verify:** no double updates or unbounded offline income.

- [ ] **M5-04** Responsive HUD for phone portrait, landscape and desktop; pointer/touch pass. **Verify:** viewport matrix screenshot.

- [ ] **M5-05** Full UI ID/EN with language switch persistence. **Verify:** no untranslated mission or error critical.

- [ ] **M5-06** Help, settings, mute, reduce-motion/low-graphics options. **Verify:** functional settings, no inert buttons.

- [ ] **M5-07** First-run user testing & UX fix of confusing steps; minimize clicks. **Verify:** unaided test notes and corrections.

- [ ] **M6-01** GPU/browser profiling; optimize only measured bottlenecks; meet mobile FPS target or document measured limitations. **Verify:** FPS metrics and before/after profile.

- [ ] **M6-02** Compress/lazy-load game assets, review initial payload / memory leak / error boundary. **Verify:** measured bundle and soak test.

- [ ] **M6-03** Black-box end-user tests across devices, including failure/recovery. **Verify:** full test evidence.

- [ ] **M6-04** White-box state/invariants tests: welfare ranges, money ledger, path validity, mission idempotence, speed. **Verify:** automated test report.

- [ ] **M6-05** Dead-code/dependency/asset/license audit; repo, build, QA artifact cleanup (keep usable licensed media). **Verify:** audit summary and repo size.

- [ ] **M6-06** Security & privacy review: no PII/login, storage transparency, safe errors, accessibility. **Verify:** sign-off notes.

- [ ] **M6-07** Update homepage game CTA, metadata, in-site Learn relationship, preserve existing public URLs; minimal privacy-safe telemetry where compliant. **Verify:** SEO route regression & events.

- [ ] **M6-08** Final local build → authorized main push/deploy → live production smoke test desktop/mobile → rollback-ready V1 report. **Verify:** actual production URL, commit hash, test timestamps.

## Deferred M7 (not included in denominator)

- [ ] **M7-01** Sandbox Mode (unlimited currency, placement experiments, isolated saves, no challenge badge mixing).

- [ ] **M7-02** Second species & habitat with species-specific needs.

- [ ] **M7-03** Third species & new habitat biome; config-driven expansion validated.

- [ ] **M7-04** Staff/zookeeper assistance and waste/maintenance decisions.

- [ ] **M7-05** Reproduction/baby animals, population limits and humane welfare controls.

- [ ] **M7-06** Environmental events and resource-management challenges.

- [ ] **M7-07** Population/welfare charts and more complex ecosystem dynamics.

- [ ] **M7-08** Optional day/night/weather/seasons after perf proof.

- [ ] **M7-09** Marketplace-ready HTML5 packaging / portal build adapter for itch.io.

- [ ] **M7-10** CrazyGames requirement audit, SDK adapter only if necessary, submission after quality/eligibility evaluation.

- [ ] **M7-11** Roblox prototype feasibility: port asset models and gameplay rules to Roblox Studio/Luau, **not** copy-paste web TS engine.

- [ ] **M7-12** Evaluate ethical monetization (optional cosmetics/rewarded placements/sponsorship) only after retention and player feedback; never pay-to-win.

## Completion protocol

One feature at a time: implement -> appropriate local tests and browser visual evidence -> fix -> local commit -> update full living PRD/checklist with date, commit, evidence, known issues and next ID. Do not count compile as a gameplay pass or viewport emulation as physical Android testing. No push/deploy before M6 release gate. No GitHub Actions added or run.
