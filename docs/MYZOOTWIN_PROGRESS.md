# MyZooTwin V1 living progress

Updated: 2026-10-31 UTC. Complete canonical working requirements: MYZOOTWIN_MASTER_PRD_V1.md. Immutable source-text transcriptions and original Library references: SOURCE_PROVENANCE.md. Native Library materialization failed; the explicitly authorized complete source-text alternative is saved and clearly labeled.

Verified V1: **4/51 (7.84%)**. M7 excluded: **12 deferred items**. Local entry UI and renderer foundation only; no gameplay or production changes.

## Current checkpoint: M0-01 PARTIAL / BLOCKED

Completed: local/GitHub audit; live route/sitemap/analytics baseline; complete PRD/handoff reads and source-text transcriptions; architecture recommendation. Existing cached Wrangler with OAuth independently confirmed Pages project myzootwin-com and its custom domains/Git integration, production main deployment source ad20f2b, dist output, compatibility date and production PUBLIC_GA4_ID variable name. Evidence: M0-01_AUDIT.md and ARCHITECTURE.md.

Remaining external configuration gap: supported CLI read surfaces used do not expose the exact GitHub source-repository binding or dashboard build command/root-directory/automatic deployment policy. The dashboard browser session requires login; no login/new grants authorized or attempted. README is not proof of these settings. Keep M0-01 unchecked until verified or the parent explicitly accepts the documented audit limit.

M0-02 independently COMPLETE on 2026-10-31. Evidence commit: ec17bd19f4d4292eba269854ac4a512114737b0c (local only). Report: [M0-02_BASELINE.md](M0-02_BASELINE.md); screenshots and structured evidence: [qa/m0-02](qa/m0-02/). Check/build passed; 24 browser route/reload scenarios, navigation/keyboard, responsive screenshots and loopback shutdown verified. Existing BASE-01 mobile heading overflow and BASE-02 low quote contrast are recorded; no app fixes or physical Android/performance/gameplay claims. M0-02 remains complete; M0-03 is now independently complete as recorded below. M0-04 is now complete as recorded below. M0-05 is now complete as recorded below. Next: M0-06 typed entities/fixed tick/event/save-schema contract. M0-01 remains partial; production release stays gated on external configuration verification.

## M0-03 COMPLETE — 2026-10-31 UTC

Evidence commit: 01f61a4a5208ed66350e5c5a56f82df138945461 (local only). [Asset report](M0-03_ASSETS.md), [manifest](ASSET_MANIFEST.json), [original macaw study](../art/studies/macaw-m0-03/README.md). Chosen Ara ararauna with original procedural geometry; actual study 2,028 triangles/one material/no textures, 189,816 bytes. Inventory/rights evidence, species facts, visual projection review, structural positive/negative checks and viewer shutdown recorded. Old media retained with provenance uncertainty. No final model/animation/WebGL/FPS/physical Android pass and no app/dependency/production changes. Only M0-02 and M0-03 complete; M0-01 partial, M7 deferred. Next: M0-04.

## M0-04 COMPLETE — 2026-10-31 UTC

Implementation/evidence commit: b72795dbdc91a4442ef39a440e41bf3026c6aaef (local only). [Entry report](M0-04_PLAY_ENTRY.md), [browser/route/screenshot evidence](qa/m0-04/). Real local /play and /play/ with correct canonical, modest Play Zoo nav, disabled future Play/Continue, working guide/settings and entry ID/EN persistence. Original journal source/media/metadata and analytics source preserved; nine-page sitemap. 8 unit tests/check/build and 18 browser URL/reload scenarios passed; mobile/desktop visual and keyboard/history checks recorded; preview shut down. No renderer/gameplay/game-save/full-localization/physical-device pass and no production deployment. Optional public Python GET returned 403, not retried; saved baseline/source regression completed. M0-01 remains partial; next M0-05.

## M0-05 COMPLETE - 2026-10-31 UTC

Status: COMPLETE as the lazy renderer/fallback/lifecycle slice, 2026-10-31 UTC. Implementation/evidence commit: 585ffc6de5227ae21b382ab5f98000e8ba90c8c3 (local only). [Renderer report](M0-05_RENDERER_FOUNDATION.md), [tests/browser fixture](../tests/browser/README.md), [native/injected browser and route evidence](qa/m0-05/).

Real optional Three.js WebGL2 canvas on /play, with lazy import, bilingual loading/ready/unsupported/error states, close, retry and import-failure reload. Minimal original abstract geometry is explicitly a renderer foundation, not a sanctuary world/animal/gameplay claim. One RAF visual loop and session owner; late imports/stale handles cancelled, all owned canvas/GPU/listener/resize resources released. Journal navigation, entry dialogs and future disabled Play/Continue preserved.

Verification: 21/21 unit tests; Astro check 19 files, zero errors/warnings/hints; final build nine pages. Actual built native WebGL visually checked at DOM-verified 1366x768, 360x780 portrait and 780x360 landscape, ID/EN, keyboard, guide/settings/Escape, close/reopen and history return. 38 local-harness observations include five Open/Close and three remount/unmount cycles, explicit pause/resume, injected unsupported/constructor/import/delay/context-loss/render failures and recovery. Max one active session/pending RAF; zero after release; released geometries zero and cleanup errors zero. Seven screenshots 645,640 bytes. Eight old routes/metadata, original source/public files and analytics preserved; nine sitemap URLs. Exact three/@types/three 0.187.0; no existing dependency version changed. Lazy renderer 528,598 bytes / 131,488 gzip level 9, entry 13,475 / 5,068. Owned loopback ports 4321/4322 stopped, zero listeners checked; three owned tabs closed and viewport reset.

Limits/issues: Vite lazy raw-chunk >500kB warning recorded, not suppressed. Negative failures injected, no physical Android/true touch/Safari/iOS, hardware GPU identity/FPS/network/15-minute soak/full-localization/gameplay pass. BASE-01/02 unchanged. Earlier public Python HTTP403 was not retried. M0-01 exact external deployment configuration remains partial and release gated. Next: M0-06 typed entities/fixed tick/event/save-schema contract. Verified V1: 4/51 (7.84%); M7 deferred. No Actions/push/deploy.

## V1 checklist (exact task wording from source-text handoff)

- [ ] **M0-01** Audit repo, stack, Cloudflare Pages routing, existing content/SEO, analytics; catat apa yang boleh di-reuse. **Verify:** laporan audit dan baseline routes.

- [x] **M0-02** Ambil baseline screenshots &amp; browser smoke existing homepage, navigation, mobile; kumpulkan rollback plan. **Verify:** snapshot dan baseline tests.

- [x] **M0-03** Asset inventory + licenses + visual target; pilih model satu spesies burung tropis yang feasible dan legal. **Verify:** manifest asset, ukuran, attribution.

- [x] **M0-04** Buat route `/play`, start screen, navigasi &amp; link dari site tanpa merusak routes lain. **Verify:** reload direct URL /play + original URLs.

- [x] **M0-05** Setup 3D canvas, loading, WebGL failure state; no blank screen. **Verify:** desktop/mobile render &amp; negative test.

- [ ] **M0-06** Tentukan typed game entities, simulation tick, event bus minimal, save schema version. **Verify:** architecture tests &amp; serialization sample.

- [ ] **M0-07** Setup unit, integration, local E2E + screenshot capture yang dijalankan tanpa GitHub Actions. **Verify:** reproducible test commands.

- [ ] **M0-08** Tetapkan initial performance baseline, screen sizes &amp; artifact hygiene. **Verify:** baseline measurements recorded.

- [ ] **M1-01** Render small low-poly tropical diorama (tanah, creek, pohon, gate) dengan kamera isometrik. **Verify:** visual screenshot mobile/desktop.

- [ ] **M1-02** Pan/zoom camera dengan mouse dan touch, clamped. **Verify:** gesture &amp; wheel tidak keluar map atau page-scroll tak sengaja.

- [ ] **M1-03** Scene picking: pilih tile/object, show panel identitas. **Verify:** raycast mouse/touch akurat.

- [ ] **M1-04** Build-mode preview dengan valid/invalid placement, Confirm/Cancel. **Verify:** cancel no side-effects.

- [ ] **M1-05** Place valid habitat/fence dalam bounds; persist occupancy. **Verify:** tidak overlap/keluar map.

- [ ] **M1-06** Place visitor path dari gate ke enclosure; cek connectivity. **Verify:** disconnected route terdeteksi.

- [ ] **M1-07** Editing: pilih/hapus/perbaiki salah tempat sesuai aturan refund; kontrol anti-double-input. **Verify:** balance dan occupancy konsisten.

- [ ] **M2-01** Satu model bird stylized final-quality + animation states minimum. **Verify:** bukan placeholder, ukuran &amp; animasi mobile baik.

- [ ] **M2-02** Place dua bird instances di habitat; idle/wander/perch autonomous. **Verify:** bergerak, tidak clipping/keluar pagar.

- [ ] **M2-03** Feeder dapat di-place, diisi, dikonsumsi; animal seek-food. **Verify:** aksi care berdampak terhadap model kebutuhan &amp; animasi.

- [ ] **M2-04** Water source dapat di-place, diisi, dikonsumsi; seek-water. **Verify:** thirst response dapat diobservasi.

- [ ] **M2-05** Rest/perch + energy behavior + enrichment sederhana. **Verify:** state transition tidak macet.

- [ ] **M2-06** Animal info &amp; welfare formula + alert dengan sebab yang jelas. **Verify:** low/high welfare test scenarios.

- [ ] **M2-07** Full animal action QA: tidak teleport, sumber inaccessible tidak dipakai, tab pause/resume aman. **Verify:** multi-cycle E2E dan visual evidence.

- [ ] **M3-01** Visitor spawn dari gate dengan cap jumlah agent. **Verify:** terlihat bergerak, tidak spawn di air.

- [ ] **M3-02** Simple walking/path graph ke viewing spot, return gate. **Verify:** rute putus mencegah kunjungan.

- [ ] **M3-03** Guest satisfaction berdasar habitat reachable + welfare, UI visual feedback. **Verify:** negative dan positive cases.

- [ ] **M3-04** Tiket masuk dibayar sekali per visitor ID; ledger. **Verify:** tidak duplikasi saat frame drop/reload.

- [ ] **M3-05** Cost build/feed/maintenance divalidasi vs saldo. **Verify:** insufficient coins tidak membuat objek gratis.

- [ ] **M3-06** Cashflow/ticket/opex ringkas &amp; configurable tuning. **Verify:** balance benar pada time scale berbeda.

- [ ] **M3-07** Low-cash alert &amp; recovery path; no unwinnable softlock. **Verify:** pemain bisa pulih dari skenario saldo minimal.

- [ ] **M4-01** Mission event engine dan completion idempotence. **Verify:** reward exactly-once.

- [ ] **M4-02** Onboarding Q01: habitat &amp; connected path (contextual hints). **Verify:** first-time player can finish.

- [ ] **M4-03** Mission Q02: dua burung, makan &amp; minum, welfare target. **Verify:** bukan sekadar tombol claim.

- [ ] **M4-04** Mission Q03: admission + viewing visit. **Verify:** guest actions counted once.

- [ ] **M4-05** Mission Q04 &amp; unlock kecil, local achievement badge. **Verify:** unlock persists.

- [ ] **M4-06** Implement 1×/10× game speed dengan consistent fixed-step economics. **Verify:** deterministic equivalence &amp; no accelerated render loop.

- [ ] **M4-07** Golden-path 10–15 minute playable E2E dari new game → 3+ missions → economic loop. **Verify:** screen recording and bug list zero blockers.

- [ ] **M5-01** Autosave &amp; Continue via versioned local persistence; save at logical safe checkpoints. **Verify:** refresh/reopen.

- [ ] **M5-02** Load-validation, migration strategy, corrupted-storage recovery without silent wipe. **Verify:** intentionally malformed save test.

- [ ] **M5-03** Pause/resume &amp; background tab, restart/reset with confirmation. **Verify:** no double updates or unbounded offline income.

- [ ] **M5-04** Responsive HUD for phone portrait, landscape and desktop; pointer/touch pass. **Verify:** viewport matrix screenshot.

- [ ] **M5-05** Full UI ID/EN with language switch persistence. **Verify:** no untranslated mission or error critical.

- [ ] **M5-06** Help, settings, mute, reduce-motion/low-graphics options. **Verify:** functional settings, no inert buttons.

- [ ] **M5-07** First-run user testing &amp; UX fix of confusing steps; minimize clicks. **Verify:** unaided test notes and corrections.

- [ ] **M6-01** GPU/browser profiling; optimize only measured bottlenecks; meet mobile FPS target or document measured limitations. **Verify:** FPS metrics and before/after profile.

- [ ] **M6-02** Compress/lazy-load game assets, review initial payload / memory leak / error boundary. **Verify:** measured bundle and soak test.

- [ ] **M6-03** Black-box end-user tests across devices, including failure/recovery. **Verify:** full test evidence.

- [ ] **M6-04** White-box state/invariants tests: welfare ranges, money ledger, path validity, mission idempotence, speed. **Verify:** automated test report.

- [ ] **M6-05** Dead-code/dependency/asset/license audit; repo, build, QA artifact cleanup (keep usable licensed media). **Verify:** audit summary and repo size.

- [ ] **M6-06** Security &amp; privacy review: no PII/login, storage transparency, safe errors, accessibility. **Verify:** sign-off notes.

- [ ] **M6-07** Update homepage game CTA, metadata, in-site Learn relationship, preserve existing public URLs; minimal privacy-safe telemetry where compliant. **Verify:** SEO route regression &amp; events.

- [ ] **M6-08** Final local build → authorized main push/deploy → live production smoke test desktop/mobile → rollback-ready V1 report. **Verify:** actual production URL, commit hash, test timestamps.


## Deferred M7 (not included in denominator)

- [ ] **M7-01** Sandbox Mode (unlimited currency, placement experiments, isolated saves, no challenge badge mixing).

- [ ] **M7-02** Second species &amp; habitat with species-specific needs.

- [ ] **M7-03** Third species &amp; new habitat biome; config-driven expansion validated.

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
