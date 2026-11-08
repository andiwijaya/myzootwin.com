# Execution checkpoint

Current verified progress: **1/54 (1.85%)**. Zebra V5 is **NOT DEPLOYED**. R7-08 is held: this task authorizes local coding and release preparation, not production push/deploy.

All four Library documents were read completely: master PRD 335 lines, harness spec 128, feature checklist 200, handoff 42. Official Windows materialization failed at `os.setxattr` after the authorized network retry. `.qa/zebra-inputs` is empty; no cloud path or installed source-file identity is claimed. Implementation uses the complete authorized Library reads; original Library files remain unchanged. This checklist is the requested repository working copy, not a claimed metadata-preserving materialization.

Latest audited source before this task: `634de84ebfeab6c069ca9463527193a4e99ea458`. Z0-01 is verified: fresh public pipeline/check binds live deployment de1f5a36 to 634de84; ID/EN native homepage observations and 11/11 focused tests pass. Runtime source tree c78fbf947b7e83d5c410038df96efb077739b27a. Evidence: [baseline](qa/zebra/z0-01/baseline.json), [browser](qa/zebra/z0-01/browser.json), [tests](qa/zebra/z0-01/tests.json). Historical Giraffe 39/42 remains historical; live V4 and the homepage are now independently verified, while presented FPS remains unmeasured. Next: Z0-02 synthetic fixtures and rendered baseline. No V5 push/deploy authorized.

---

# MYZOOTWIN — ZEBRA GRASSLANDS + UNIVERSAL 3D HARNESS LIVING CHECKLIST

**Version:** 1.1 | **Date:** 2026-11-08 | **Start:** 0/54 = **0.00%** for *this new PRD* (not the existing Giraffe completion status).
**Source:** `MYZOOTWIN_ZEBRA_MASTER_PRD_V1_1.md` | **Dot responsibility:** update after each verified micro-feature.

Progress report each feature: `verified n/54`, latest source SHA, tests, actual internal browser / synthetic fixture distinction, unresolved issues, next task. The current Giraffe 39/42 source snapshot is **separate**, not counted towards the new work.

**Do not pre-check tasks** merely because similar functionality exists, or because a file compiled. For each `[x]`, cite a real feature-specific test/3D screenshot/source-bound receipt. If an existing reusable module already meets new acceptance, prove the inherited functionality and note no source change required rather than reimplementing it.

### Z0 — Audit, baseline & desain (4 micro-features)
- [x] **Z0-01** — Audit repo HEAD, branch, deployment nyata, status Giraffe V4 (39/42 dalam dokumen terakhir) dan beranda empat habitat; bedakan source lokal/remote/live.
  - **DoD:** Catat SHA/identitas build, status izin deploy, perbedaan, bukti. Tidak mengklaim status produksi dari checklist.
  - **Proof:** `docs/qa/zebra/z0-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z0-02** — Freeze fixture V1–V4 (synthetic, bukan save owner), seluruh 4 habitat lama, ekonomi, missions, visitor/admission, kamera, lingkungan dan baseline gambar.
  - **DoD:** Golden projections/hash/route/camera dari actual source; browser QA terisolasi.
  - **Proof:** `docs/qa/zebra/z0-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z0-03** — Audit visual inventory awal: semua hewan/sprite, props, habitat, terrain, vegetasi, air, fasilitas, pengunjung, animasi, audio dan provenance/ownership.
  - **DoD:** Manifest berisi setiap asset yang terjangkau dari runtime; yang tidak eksis diberi status NA, bukan pura-pura ada.
  - **Proof:** `docs/qa/zebra/z0-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z0-04** — Bekukan desain zebra 8×8 di east wing pada peta existing 24×26, jalur yang reachable, sisa lahan, budgets dan rule fictional welfare.
  - **DoD:** Layout proof negatif/positif, contoh anchor (14,12), clearance, budget jalan+care untuk sesi awal.
  - **Proof:** `docs/qa/zebra/z0-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### H1 — Universal 3D Asset & Environment Harness (seluruh zoo) (9 micro-features)
- [ ] **H1-01** — Bangun QA-only 3D Asset Lab menggunakan renderer/model source existing; entry terpisah dan dikecualikan dari dist/site produksi.
  - **DoD:** Harness bisa dibuka di internal browser; tidak menyentuh owner browser/DB atau menambah endpoint publik.
  - **Proof:** `docs/qa/zebra/h1-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-02** — Buat typed Visual Asset Registry + generated provenance manifest untuk seluruh actor, rig, sprite/billboard/particle yang benar-benar ada, habitat, fasilitas, terrain, prop, lighting, kamera dan UI game.
  - **DoD:** Audit source reachability; assetId unik, owner module, license, fixtures, quality level, state rule, fallback.
  - **Proof:** `docs/qa/zebra/h1-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-03** — Implement Asset Lab viewer: pilih asset, orbit/zoom/pan, 4 arah, pivot/bounds/wireframe/normals/skeleton/LOD dan state preview.
  - **DoD:** Macaw, gajah, singa, jerapah, visitor dan props dapat diinspeksi; zebra menyusul otomatis via registry.
  - **Proof:** `docs/qa/zebra/h1-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-04** — Implement Full Zoo Scene fixture: empat kandang existing + jalur/terrain/kolam/pohon/air/batu/gate/lighting + ruang zebra ketika tersedia.
  - **DoD:** Scene yang dirender memakai scene modules produksi dan state synthetic yang strict-valid; tidak ada visual dummy.
  - **Proof:** `docs/qa/zebra/h1-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-05** — Implement deterministic behavior playback: idle, walk, feeding, drinking, resting, social, enrichment; pause/step/1×/10×/cold snapshot.
  - **DoD:** Event/tick dari engine otoritatif; kosmetik tidak bisa membuat consumption, reward, atau cash.
  - **Proof:** `docs/qa/zebra/h1-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-06** — Tambahkan pemeriksaan mesh/sprite material: NaN, skala, pivot, normal, index/bounds, clipping, face culling, z-fighting, LOD, texture/alpha, skeleton, camera occlusion.
  - **DoD:** Unit validation + screenshot evidence; negative fixtures sengaja gagal; false positive dibedakan.
  - **Proof:** `docs/qa/zebra/h1-06/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-07** — Tambahkan cek spatial/collision/picking/path/sightline untuk SEMUA habitat & environment, termasuk leher jerapah, belalai gajah, kopje singa, sayap macaw dan zebra.
  - **DoD:** Footprint dari authoritative world, bukan mesh-only; 4 camera angles, multiple zoom, no fence escapes/selection error.
  - **Proof:** `docs/qa/zebra/h1-07/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-08** — Catat renderer.info, geometry/material/texture/skeleton ownership, triangles/draw calls, JS heap bila tersedia, WebGL context loss/restore, 20x open-close.
  - **DoD:** Tidak ada pertumbuhan resource terus-menerus; dispose aman untuk shared geometry; performance limits jujur.
  - **Proof:** `docs/qa/zebra/h1-08/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **H1-09** — Buat regression captures/matrix untuk setiap kategori asset dan full world di desktop/portrait/landscape, ID/EN, low/high, reduced motion; evidence source-bound.
  - **DoD:** Screenshot metadata, hashes/fixtures, console errors, limits; semua existing visual categories tercakup atau NA beralasan.
  - **Proof:** `docs/qa/zebra/h1-09/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### Z2 — Zebra world, strict Save V5 & konstruksi (7 micro-features)
- [ ] **Z2-01** — Tambahkan typed zebra Equus quagga, Zebra Grasslands habitat, per-species resource/behavior, persisted ZQ progression tanpa memperlebar peta.
  - **DoD:** V1–V4 typed contracts tetap valid; zebra tidak masuk ke FSM bird/elephant/lion/giraffe.
  - **Proof:** `docs/qa/zebra/z2-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z2-02** — Tambah real 8×8 placement ghost, collision mask, reserve land & viewing corridor di east wing tanpa mengganggu giraffe/old habitats.
  - **DoD:** Peta tetap 24×26, origin (6,5), invalid preview merah, confirm disabled; anchor target 14..21,z12..19 tervalidasi.
  - **Proof:** `docs/qa/zebra/z2-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z2-03** — Implement paid zebra fence & selected/picking/Undo-compatible habitat construction, tanpa auto-membangun tanah kosong.
  - **DoD:** 64 occupancy cells, visible fence matching collision, unique stable IDs and one ledger debit.
  - **Proof:** `docs/qa/zebra/z2-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z2-04** — Implement strict lossless ZooSaveV5, V4→V5 dan V1/V2/V3→V5 melalui migrasi terverifikasi, bounded schema & unknown-future guard.
  - **DoD:** Old save projection identik; migrasi tidak menambah zebra/uang/paths tanpa tindakan pemain.
  - **Proof:** `docs/qa/zebra/z2-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z2-05** — Upgrade database version 5 di store yang sama; atomic V4 backup, generation/revision CAS, old-client barrier, abort/quota/multi-tab tests.
  - **DoD:** Losing tab no reward and no mutation; never downgrade, delete, overwrite V5 with V4 or other backup.
  - **Proof:** `docs/qa/zebra/z2-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z2-06** — Unlock setelah GQ04 claimed dengan proof; explicit once-only 1,700 ZC proposed starter grant and safe recovery, price fixture before lock.
  - **DoD:** Proof survives compaction/cold; grant cannot double-claim; budgeting leaves >=150 ZC after viable essential setup.
  - **Proof:** `docs/qa/zebra/z2-06/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z2-07** — Bangun paid visitor path ke viewing spot, visitor topology, cold Continue/camera fit/reset/Undo/regression in shared world.
  - **DoD:** Actual gate-to-zebra reachability, one ticket at gate, disconnected route blocked; existing four paths untouched.
  - **Proof:** `docs/qa/zebra/z2-07/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### Z3 — Zebra 3D actors, state-driven animation & herd (8 micro-features)
- [ ] **Z3-01** — Buat original procedural zebra rig recognizable: proporsi, garis individual, surai, telinga, ekor, moncong, empat kaki; high/low LOD.
  - **DoD:** Diuji di H1 Asset Lab empat angle & mobile, tanpa unlicensed art; pola tidak berkedip dan tidak z-fight.
  - **Proof:** `docs/qa/zebra/z3-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-02** — Welcome Zaki, zebra pertama; grounded autonomous walk/turn/idle real state + persistence.
  - **DoD:** 1 actor, legal path/fence, cold exact, bukan marker visual tanpa sim.
  - **Proof:** `docs/qa/zebra/z3-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-03** — Welcome Zuri, Mira, Kira; tepat 4 dewasa, unique stable IDs/markings, separasi, fair scheduling.
  - **DoD:** Bukan spawn ulang tiap load; fixed tick deterministic, no body interpenetration.
  - **Proof:** `docs/qa/zebra/z3-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-04** — Grazing: kepala menunduk/merumput pada stock and true grass/feed port; hunger & portions berubah saat real consumption.
  - **DoD:** No eating if unreachable/empty/paused; visible pose matches actual action.
  - **Proof:** `docs/qa/zebra/z3-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-05** — Drinking: real water approach, head-lowering animation, stock, thirst and interrupted/cold playback.
  - **DoD:** Positive+negative proof across save/reload; no decorative drinking credit.
  - **Proof:** `docs/qa/zebra/z3-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-06** — Safe herd follow and optional short trot/formation with gap maintenance, path obstacle/fence/camera constraints.
  - **DoD:** 4 body collision, no teleport or outside enclosure; deterministic 10k simulated ticks.
  - **Proof:** `docs/qa/zebra/z3-06/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-07** — Reciprocal mutual grooming/contact behavior with cooldown, social comfort and concurrent fair access.
  - **DoD:** Two actual actors at legal contact range; no welfare awarded from animation only.
  - **Proof:** `docs/qa/zebra/z3-07/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z3-08** — Shade/rest, ear-tail motion, idle variation, enrichment and visual quality tiers, lifecycle/context retry.
  - **DoD:** Visible without clipping props; all state survives 1×/10×/cold, low/reduced-motion still correct.
  - **Proof:** `docs/qa/zebra/z3-08/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### Z4 — Zoo gameplay, visitors, finance & missions (7 micro-features)
- [ ] **Z4-01** — Implement costed pasture/hay, drinking trough, shade and dust/scratch enrichment facilities and refill mechanics.
  - **DoD:** Actual purchased stock/capacity/cost and occupancy/approach; bounded resource kinds.
  - **Proof:** `docs/qa/zebra/z4-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z4-02** — Implement causal zebra welfare (food, water, rest, space, social/enrichment) with readable causes/remedies.
  - **DoD:** Change actual resources changes score; game approximation labelled, not veterinary guidance.
  - **Proof:** `docs/qa/zebra/z4-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z4-03** — Extend shared maintenance, ledger, refunds/restore and cashflow without passive income exploit.
  - **DoD:** One entrance ticket per visitor, not per habitat; exact operation IDs/receipts, no negative balance.
  - **Proof:** `docs/qa/zebra/z4-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z4-04** — Visitor round-robin/weighted fairness across 5 occupied reachable habitats with pinned journeys, true viewing and feedback.
  - **DoD:** Macaw, elephant, lion, giraffe, zebra each get real visits in seeded scenario; old mission proofs unaffected.
  - **Proof:** `docs/qa/zebra/z4-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z4-05** — Implement 4 zebra quests ZQ01–ZQ04: build/connect, care/graze, herd social/enrichment, visitors/thriving; exact-once claim.
  - **DoD:** Persisted authoritative objectives, progress, rewards & achievement IDs distinct from Q/EH/LQ/GQ.
  - **Proof:** `docs/qa/zebra/z4-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z4-06** — Low-cash/unreachable/refill recovery, contextual nudges and fair essential supply access; no softlocks.
  - **DoD:** Zero cash & depleted/invalid paths safely recover via bounded non-exploit procedure.
  - **Proof:** `docs/qa/zebra/z4-06/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z4-07** — Maintain 100ms canonical clock, one RAF, pause/visibility/1×/10×/restart consistency, no offline cash or animal motion.
  - **DoD:** Cold/save after long run equality, no duplicate events after remount; fixed time partition tests.
  - **Proof:** `docs/qa/zebra/z4-07/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### Z5 — Bilingual, mobile UX & accessibility (5 micro-features)
- [ ] **Z5-01** — ID default / EN complete Zebra panels, action names, onboarding/mission/help, costs and factual disclaimers.
  - **DoD:** No untranslated strings/undefined keys, persisted locale.
  - **Proof:** `docs/qa/zebra/z5-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z5-02** — Mobile/desktop build, select, water/refill, camera focus and Touch/keyboard UX; preserve 44px minimum tap targets.
  - **DoD:** 360×780, 780×360, 1366×768, 1920×1080; no clipped controls or native picker flicker.
  - **Proof:** `docs/qa/zebra/z5-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z5-03** — Viewport/camera shortcuts overview/full zoo, focus each of 5 enclosures, rotate/zoom/pan/pinch with gesture capture.
  - **DoD:** Camera touches do not accidentally purchase/remove; picking correct all angles.
  - **Proof:** `docs/qa/zebra/z5-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z5-04** — Muted/autoplay/reduced motion/quality tier & no-WebGL fallback with honest feedback.
  - **DoD:** No content inaccessible in reduced mode, no sounds autoplayed.
  - **Proof:** `docs/qa/zebra/z5-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **Z5-05** — Accessible HUD/ARIA and help for grazing/water/welfare/quests, context loss & native browser recovery.
  - **DoD:** Tab/Enter/Space/Escape/focus return, save not lost, labels ID/EN.
  - **Proof:** `docs/qa/zebra/z5-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### HP6 — Update beranda, promosi 5 habitat & SEO (6 micro-features)
- [ ] **HP6-01** — Audit existing ZooHome.astro ID / EN, hero, four cards, Giraffe spotlight, SEO, sitemap & current deployed feature flags.
  - **DoD:** Baseline screenshots and metadata, no claim zebra live before deployed.
  - **Proof:** `docs/qa/zebra/hp6-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **HP6-02** — Refresh homepage cards to 5 playable habitats with latest functionality; accurate progression, no dead/disabled mislabel.
  - **DoD:** Macaw/Elephant/Lion/Giraffe/Zebra card copy ID/EN, working /play link, descriptive alt.
  - **Proof:** `docs/qa/zebra/hp6-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **HP6-03** — Make new promo feature Zebra Grasslands with grounded teaser, benefit-driven CTA and section featuring herd/grazing.
  - **DoD:** Promo tied to actual available release state; before release label preview/coming soon if used.
  - **Proof:** `docs/qa/zebra/hp6-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **HP6-04** — Update hero & Zebra spotlight using actual 3D QA captures (original owned game assets), responsive srcset/WebP/social.
  - **DoD:** No fake stock screenshot labelled gameplay; responsive visually dominant hero, small bytes, provenance logged.
  - **Proof:** `docs/qa/zebra/hp6-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **HP6-05** — Update titles/H1/meta descriptions, OG/social, canonical, ID/EN hreflang, structured VideoGame data, sitemap/internal links and FAQ.
  - **DoD:** No duplicate H1, false ratings, unsupported claims, route/canonical regressions.
  - **Proof:** `docs/qa/zebra/hp6-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **HP6-06** — Browser QA homepage real / and /en/, page responsiveness/keyboard/a11y, SEO route audit/perf regressions.
  - **DoD:** Actual internal browser 3 viewports, CTA/language/FAQ/Privacy, no eager Three engine on homepage.
  - **Proof:** `docs/qa/zebra/hp6-06/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.

### R7 — QA lengkap, safety, release & handoff (8 micro-features)
- [ ] **R7-01** — Full white-box/unit/integration, 5-species and old save/economy/visitor/mission invariant regression.
  - **DoD:** All legacy golden state projections preserved; full suite clean & versioned receipts.
  - **Proof:** `docs/qa/zebra/r7-01/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-02** — Black-box H1 harness matrix for all old+new assets, terrain, enclosure, props, visitor and camera; fix regressions first.
  - **DoD:** Real asset and Full Zoo screenshot evidence, no falsely marked NA, no unsupported clipping/sprite issues.
  - **Proof:** `docs/qa/zebra/r7-02/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-03** — Fault injection strict V5 parse/migration/CAS/races/quota/corrupt/future-content/2-tab and recovery.
  - **DoD:** No owner storage touched, no duplicate grant/mission/ticket, preserved V4 backup.
  - **Proof:** `docs/qa/zebra/r7-03/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-04** — Real internal-browser 15-min active 1× soak & 10× stress with 5 habitats, all actors, app heap & scene metrics.
  - **DoD:** No crashes/leaks, live save exact after cold; rendered FPS only if directly measured; callback Hz≠FPS.
  - **Proof:** `docs/qa/zebra/r7-04/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-05** — Cross-browser-host-supported internal profiles, ID/EN 3+viewports, mobile gesture simulation, homepage and /play smoke.
  - **DoD:** Actual browser vs injected/emulated claims separated; no Take over computer.
  - **Proof:** `docs/qa/zebra/r7-05/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-06** — Dead/reachable code, runtime package/security/asset provenance and repo-size cleanup audit; preserve old media/QA evidence.
  - **DoD:** No unlicensed/new telemetry; old routes untouched; no massive QA artifacts or destructive cleanup.
  - **Proof:** `docs/qa/zebra/r7-06/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-07** — Prepare V5-compatible read-only maintenance/fix-forward rollback plan, immutable source/build manifest and candidate release checklist.
  - **DoD:** Do not deploy V4 code over V5 database; tested no-write maintenance, current production facts verified.
  - **Proof:** `docs/qa/zebra/r7-07/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.
- [ ] **R7-08** — After verified and release authorization, controlled fast-forward publish to main + deployment/live smoke; then complete 5-habitat homepage claim.
  - **DoD:** Exact SHA/Pages build, isolated test saves, live assets/metadata, rollback evidence; hold if authorization unavailable.
  - **Proof:** `docs/qa/zebra/r7-08/` + source SHA + tests + native browser observation when applicable; update `docs/ZEBRA_PROGRESS.md`.


## Release closeout template

- Source SHA / build digest / remote main SHA / Cloudflare deployment ID: **UNRUN**
- V1–V4 frozen save projection tests: **UNRUN**
- V5 migration + IndexedDB CAS / old-binary barrier / backup: **UNRUN**
- Universal Asset Lab inventory: **UNRUN** (all asset categories)
- Full Zoo scene, five habitats, geometry/picking/LOD/clip checks: **UNRUN**
- Black-box internal browser desktop/portrait/landscape ID+EN: **UNRUN**
- Native 15-minute active 1× soak & 10× deterministic stress: **UNRUN**
- Actual presented FPS: **UNMEASURED** until directly measured
- Homepage five cards, promo, metadata/hreflang, live-claim truth: **UNRUN**
- Production publish/live smoke: **BLOCKED until authorized**, unless explicit release authorization already exists at task start
