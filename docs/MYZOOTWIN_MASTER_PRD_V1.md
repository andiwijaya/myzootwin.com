<!-- CANONICAL WORKING REQUIREMENTS: complete text transcription from owner-supplied Library source libfile_95d9687acd708191a8960074770c3410 (MYZOOTWIN_MASTER_PRD_V1(1).md), provided as source-text handoff on 2026-10-31. Not a byte-exact native materialization. Immutable text transcript: sources/MYZOOTWIN_MASTER_PRD_V1.transcript.md. -->

# MYZOOTWIN.COM — MASTER PRODUCT REQUIREMENTS DOCUMENT
## Living Zoo Simulator | Game-First, Browser-First

**Version:** 1.0  
**Document date:** 31 Oktober 2026  
**Status:** Ready for engineering handoff; NOT a claim of implementation  
**Product Owner:** Pemilik MyZooTwin.com  
**Product/Solution Architect:** Bud  
**Delivery Orchestrator:** Dot  
**Engineering Agent:** Codex  
**Target environment:** Existing MyZooTwin.com website; Cloudflare Pages/GitHub deployment subject to repo audit  
**Language of this PRD:** Bahasa Indonesia; player UI bilingual Indonesia/English

&gt; **NON-NEGOTIABLE:** MyZooTwin harus menjadi GAME YANG BISA DIMAINKAN, bukan landing page cantik, 3D viewer, artikel berkedok game, atau kumpulan tombol yang tidak berfungsi. Satu fitur kecil harus berfungsi **end-to-end**, diuji, dan ditandai `[x]` sebelum fitur berikutnya dimulai.

---

## 1. Executive decision — produk yang akan dibangun

**Product vision:** *MyZooTwin — Build a living zoo. Care for its animals. Watch the world respond.*

MyZooTwin adalah permainan **cozy 3D zoo management + living ecosystem** berbasis browser. Pemain membangun habitat, menyelamatkan/menempatkan satwa, menyediakan makanan-air-tempat istirahat, menarik pengunjung, menghasilkan pendapatan tiket, dan menyelesaikan misi konservasi. Hewan harus **benar-benar menunjukkan perilaku mandiri** dan merespons keputusan pemain: berjalan/terbang, mendekati makanan, minum, beristirahat, dan berubah kondisi kesejahteraannya.

**Unique promise:** setiap tindakan pemain memiliki efek yang bisa dilihat dalam dunia 3D, angka game, dan progres misi. Fokus pengalaman adalah rasa *“I built a small world, and it is alive.”*

### 1.1 Keputusan scope (locked untuk V1)

| Area | Keputusan |
|---|---|
| Format | Game 3D stylized low-poly, kamera isometrik terbatas; bukan photorealistic |
| Platform | Browser desktop + browser mobile, mouse/touch; tanpa instalasi dan tanpa login untuk V1 |
| Dunia awal | Satu **Tropical Creek Sanctuary**: sungai kecil, pepohonan, pintu masuk, area habitat, jalur pengunjung |
| Hewan awal | **Satu spesies burung tropis**; 2 individu di satu habitat; nama spesies final ditetapkan dari asset dan validasi fakta satwa, bukan placeholder permanen |
| Mode awal | **Challenge / Guided Play** dengan misi singkat; Sandbox menyusul V1.1, bukan blocker rilis V1 |
| Gameplay | Habitat → satwa → rawat → perilaku satwa berubah → pengunjung melihat → tiket → perluas/upgrade |
| Ekonomi | Satu mata uang virtual, biaya bangun &amp; perawatan, pendapatan tiket; tidak ada uang nyata |
| Simulasi | State-based deterministic update, fixed simulation tick; bukan sekadar animasi dekoratif |
| Save | Lokal dengan versi skema; game dapat dilanjutkan setelah browser ditutup/dibuka kembali |
| Bahasa | Bahasa Indonesia &amp; Inggris; pilihan manual, default mengikuti bahasa browser (ID untuk `id`, selain itu EN) |
| Integrasi website | Tambah **/play** dan CTA bermain, **jangan hapus** halaman/URL animal learning journal dan konten edukasi yang sudah ada |
| Hosting | Reuse deployment/repository yang ada setelah audit; jangan membangun repo/stack kedua tanpa alasan teknis |
| V1 success gate | Pemain baru dapat memainkan satu loop ekonomi + satwa + misi dan progress tersimpan tanpa bantuan pengembang |

### 1.2 Penggunaan website yang sudah ada

Per 31 Oktober 2026, beranda publik MyZooTwin.com adalah *animal learning journal*: Animals, Wildlife, Pets, Learn, Adventures, Gear, About. Halaman dan tautan tersebut harus diperlakukan sebagai aset produk dan SEO, bukan dibuang tanpa audit.

- Tambah navigasi **Play Zoo** paling jelas di desktop &amp; mobile, link ke `/play`.
- Game menjadi pengalaman utama yang ditonjolkan secara bertahap **setelah** playable dan lulus release gate.
- Konten Animals/Learn dapat menjadi pelengkap edukasi dan tautan dari kartu info hewan; jangan wajibkan pemain membaca artikel untuk bermain.
- Jangan mengubah slug, URL, analytics, atau sitemap yang sudah ada tanpa pemeriksaan regresi dan strategi redirect yang jelas.
- Jangan klaim repo, framework, atau status login saat ini sebelum Dot memverifikasi.

---

## 2. Product goals, target players, dan anti-goals

**Primary players:** pemain casual usia umum, pecinta satwa, penggemar building/tycoon yang ingin sesi pendek (5–15 menit) dan progres jangka panjang. UI ramah keluarga, tetapi tidak mengumpulkan data personal anak atau menargetkan anak di bawah umur secara khusus tanpa compliance review.

### Goals V1

1. Pemain mengerti apa yang harus dilakukan dalam 30–60 detik awal.
2. Pemain dapat mengubah dunia 3D melalui interaksi, bukan hanya menonton.
3. Satwa punya perilaku dan kebutuhan yang menyebabkan keputusan pemain bermakna.
4. Ada pengunjung, uang, tantangan, hadiah, dan tujuan yang jelas.
5. Progress aman pada refresh/reopen; playable di Android Chrome &amp; desktop Chrome/Edge.
6. Beban visual cukup menarik untuk demo video 15–30 detik, tanpa menukar gameplay dengan dekorasi.
7. Kode, asset, dan rancangan dapat dipakai ulang untuk fase ekspansi / marketplace.

### Explicit non-goals V1

- Tidak membangun 20–50 spesies, banyak pulau/bioma, taman raksasa, atau editor terrain bebas.
- Tidak multiplayer, akun, cloud save, social/chat, trading, atau leaderboard online.
- Tidak sistem breeding/genetics, disease, predator–prey, full ecosystem food chain, weather, seasons, bencana, migrasi, atau staff AI kompleks di V1.
- Tidak in-app purchase, mata uang premium, pay-to-win, atau iklan mengganggu saat bermain.
- Tidak meniru tampilan atau asset proprietary game lain.
- Tidak menjadikan Rust/WASM atau backend requirement wajib sebelum profiling menunjukkan kebutuhan nyata.
- Tidak membuat adaptasi Roblox bersamaan dengan core game web.

---

## 3. Core gameplay (harus playable)

### 3.1 Loop inti — 5 sampai 15 menit

1. **Start** — pemain diberi modal game, satu lahan tropis, petunjuk singkat.
2. **Build** — tempatkan habitat/kandang aman, hubungkan jalur dari pintu masuk.
3. **Rescue/Welcome** — tempatkan dua burung dalam habitat yang sesuai.
4. **Care** — sediakan makanan, air, serta perch/tempat istirahat; satwa akan merespons.
5. **Observe** — satwa bergerak mandiri; welfare berubah secara masuk akal dan dapat dijelaskan.
6. **Attract** — pengunjung masuk, mengikuti jalur, menonton satwa, memberi pemasukan tiket.
7. **Improve** — gunakan hasil untuk memperbaiki fasilitas, capai misi, buka upgrade kecil.
8. **Repeat** — periksa kebutuhan satwa dan pengunjung, lakukan keputusan berikutnya.

**Aha moment wajib:** pemain melihat burung berpindah ke feeder ketika makanan diberikan; sesudah habitat dapat diakses dari jalan, pengunjung tiba dan saldo bertambah satu kali per tiket. Kedua efek harus terlihat tanpa harus membaca tutorial panjang.

### 3.2 Experience target untuk pemain baru

| Tahap sesi | Hasil yang diharapkan |
|---|---|
| 0–1 menit | Game ter-load, pemain tahu kontrol dan misi pertama |
| 1–3 menit | Habitat dan jalur terpasang dengan feedback valid/invalid |
| 3–5 menit | Dua satwa hadir dan bergerak; makanan &amp; air berhasil digunakan |
| 5–8 menit | Minimal satu pengunjung berjalan ke habitat dan tiket tercatat |
| 8–15 menit | Menyelesaikan misi awal, menerima reward, memahami langkah berikutnya |

Waktu di atas adalah **sasaran desain**, bukan fakta perilaku pengguna; validasi dengan playtest.

### 3.3 Playable acceptance scenario (E2E V1)

Dari perangkat baru, pemain masuk `/play`, menekan **Play**, memasang jalur, membangun satu habitat, memasukkan dua burung, menempatkan feeder &amp; water source, melihat satwa makan/minum, melihat welfare membaik, menyambut pengunjung, menerima tiket, menyelesaikan setidaknya tiga misi yang berurutan, menutup halaman, membuka lagi, dan menemukan kondisi game konsisten. Tidak boleh perlu Developer Tools, instruksi developer, ataupun edit save manual.

---

## 4. World, art, interaction, dan simulasi

### 4.1 World &amp; visual direction

- **Diorama low-poly 3D**: hijau tropis lembut, sungai biru, pohon dan bebatuan berulang, jalur pengunjung, penghalang habitat; gaya friendly, bukan flat placeholder.
- View isometrik 3/4 dengan kedalaman dan bayangan sederhana. Fokus keterbacaan habitat &amp; burung pada layar ponsel.
- Masing-masing elemen punya fungsi: tanaman sebagai dekorasi/enrichment sederhana, feeder sebagai food source, water bowl/pond untuk air, perch untuk istirahat.
- Scene awal kecil; tidak memuat aset 20 hewan yang tidak dipakai.
- Satu burung harus dapat dikenali dari siluet, warna, dan gerakan; jangan merilis model kapsul/kotak placeholder.
- Animal animation V1 cukup idle/perch, walk/hop/fly-short, eat, drink/rest; gerak jauh memakai waypoint sederhana.
- Suara ambient burung/air opsional dengan toggle mute; patuhi batasan audio autoplay browser.

### 4.2 Kamera &amp; kontrol

| Perangkat | Aksi |
|---|---|
| Desktop | Drag untuk pan; wheel untuk zoom; klik object untuk info/pilih; Esc untuk cancel |
| Mobile portrait | Satu jari pan atau pilih sesuai konteks; pinch zoom; tombol aksi besar; tidak butuh gesture rumit |
| Mobile landscape | Layout adaptif; gameplay tetap berfungsi; tanpa lock orientation paksa |
| Build mode | Ghost preview, grid/snap, highlight hijau valid / merah invalid, tombol Confirm/Cancel |

Sistem touch harus membedakan tap dari drag; elemen HUD tidak boleh menutupi objek/kontrol di viewport kecil. Batasi zoom &amp; pan agar kamera tidak keluar dari map.

### 4.3 Model kebutuhan satwa

Untuk satu satwa: `hunger`, `thirst`, `energy`, `habitatFit`, `enrichment`, `welfare`, `currentBehavior`, `position`, `target`, `speciesId`. Semua persentase dibatasi 0–100. Nilai dapat berubah karena tick simulasi, pilihan player, dan ketersediaan fasilitas.

**Contoh rumus awal untuk balancing:**

`welfare = 0.35 * foodScore + 0.30 * waterScore + 0.20 * habitatFit + 0.15 * enrichmentScore`

- `foodScore`/`waterScore` diturunkan dari kebutuhan dan akses ke resource, bukan hanya keberadaan tombol.
- Di bawah threshold kesejahteraan (contoh awal 60): tampilkan masalah dan tindakan koreksi yang konkret; dampak pengunjung atau income turun bertahap.
- Ketika feeder/water kosong, kondisi benar-benar menurun; ketika diisi, hewan mencari resource dan membaik.
- Tidak ada kematian grafis, penyakit, atau kelaparan yang mengunci pemain tanpa cara pemulihan di V1.
- Aturan mesti tunable melalui data config; angka bersifat **starting values** dan perlu balancing.
- Jangan menyampaikan formula simplifikasi game sebagai fakta ilmiah perilaku satwa nyata.

### 4.4 Finite-state animal behavior V1

`Idle → SeekFood → Eat → Idle`  
`Idle → SeekWater → Drink → Idle`  
`Idle → Rest → Idle`  
`Idle → Wander/Perch → Idle`

- Priority state bergantung kebutuhan; `SeekFood` hanya jika feeder ada dan dapat dicapai.
- Pergerakan terjadi dari update simulasi, animasi 3D hanya memvisualisasikan state yang sama.
- Animal harus berada dalam enclosure; tidak bisa menembus pagar/air/objek atau keluar scene.
- Setelah reload, state dipulihkan dengan aman; target invalid dapat dihitung ulang.
- Randomness bersumber dari seeded RNG atau event yang bisa direproduksi untuk unit test.

### 4.5 Pengunjung V1

- Gerak sederhana: spawn gerbang → ikuti jalur tersambung → stop di viewing spot → exit.
- Jika jalur terputus, beri pesan; pengunjung tidak teleport melintasi tanah.
- Maksimum jumlah guest aktif dibatasi untuk performa; revenue dicatat **sekali saja** saat gate admission.
- Jumlah kunjungan dipengaruhi tingkat welfare/akses habitat dengan curve yang jelas; ekonomi tidak unlimited spam.
- Minimal feedback visual pengunjung yang puas/tidak puas dan ringkasan guest satisfaction.

### 4.6 Ekonomi &amp; fail-safe

- Mata uang fiktif tunggal: **Zoo Coins (ZC)**.
- Bangun habitat, jalan, feeder dan water station menimbulkan biaya; membeli supplies/maintenance mengurangi ZC.
- Tiket masuk memberi pemasukan satu kali per visitor; arus kas dan perubahan saldo ditampilkan.
- Tidak boleh ada saldo negatif akibat double-click, save/load, atau frame-rate difference.
- Jika saldo rendah, berikan **recovery path**: reward misi awal, peralatan starter, atau opsi sell/refund prop terbatas. Hindari softlock.
- Harga awal bersifat konfigurasi yang boleh disesuaikan setelah uji sesi; semua sumber/perubahan uang masuk ledger sederhana.
- V1 tidak memakai real-money transaction.

### 4.7 Misi pertama — wajib sungguh-sungguh berfungsi

| ID | Objective | Completion | Reward awal |
|---|---|---|---|
| Q01 | Build your first habitat &amp; connected path | Habitat valid + path terhubung ke gate | Zoo Coins kecil |
| Q02 | Make your birds comfortable | 2 burung; sumber makanan dan air terpakai; welfare ≥ threshold selama durasi kecil | Unlock decoration/perch |
| Q03 | Welcome your first visitors | ≥ 3 admission unik tercatat, minimal 1 visitor mencapai viewing spot | Zoo Coins + badge lokal |
| Q04 | Keep the sanctuary thriving | Balance welfare dan income selama periode simulasi singkat | Preview tujuan ekspansi berikutnya |

Progress misi tersimpan; tidak dapat diklaim ganda; bila reload di tengah objective, tidak reset secara keliru.

### 4.8 Game speed

- Speed default **1×** dengan tick simulasi terpisah dari render frame.
- Opsi **10×** masuk V1 setelah simulator stabil; UI mengindikasikan pengaruh terhadap kebutuhan &amp; ekonomi.
- 10× tidak boleh menjadikan 10× beban GPU atau membocorkan memory. Perubahan speed harus tidak merusak save/missions.
- Pause otomatis ketika tab background dan disimpan secara aman; tidak mengakumulasi keuntungan offline tak terbatas.

---

## 5. Information architecture &amp; UI

### 5.1 Website

- `/` — tetap menjaga konten/SEO yang ada; tampilkan CTA game setelah siap.
- `/play` — entry game dengan layar awal **Play / Continue / How to / Settings**.
- Route artikel existing tetap; jangan membuat placeholder link baru yang tidak berfungsi.
- `/play` memiliki loading, unsupported-WebGL fallback, dan graceful error state yang memberi opsi retry.

### 5.2 In-game HUD

- Atas: Zoo Coins, animal welfare aggregate, visitor count, current mission, game speed.
- Sisi/bawah: Build, Animals, Care, Missions, Settings.
- Panel context ketika pilih satwa/habitat/objek: kondisi, alasan status, aksi, biaya.
- Mobile: satu primary CTA jelas per tahap onboarding; menu lain tidak memblokir area game.
- Tolong **jangan** memunculkan 8–10 tombol penuh sekaligus pada layar awal.
- Tutorial berupa 3–4 hint kontekstual yang hilang saat tindakan berhasil; ada opsi replay Help.
- Konfirmasi aksi berbiaya bila diperlukan; cancel harus aman, tidak memotong uang.

### 5.3 Bilingual

- Bahasa Indonesia dan Inggris untuk UI game, error, mission, tutorial, setting, aria-label, dan judul.
- Pilihan bahasa disimpan; default `id` bila `navigator.language` berawalan `id`, lainnya `en`.
- Dalam roadmap marketplace, EN dapat dijadikan default pada build marketplace yang menarget internasional.
- Hindari concatenation string; gunakan message keys &amp; dictionaries. Bahasa lain di luar V1.

### 5.4 Accessibility dan low-power

- Ukuran tombol mobile yang nyaman, kontras ikon/teks, loading indicator, audio mute, reduced motion/quality setting.
- Status kritis tidak hanya dibedakan melalui warna (sertakan icon/teks).
- Game dapat di-pause; tidak boleh terus berjalan saat overlay/konfirmasi vital menutupi layar.
- Mode low graphics mengurangi shadows, particles, vegetation detail, dan jumlah visitor visible — **bukan** menonaktifkan logika gameplay.

---

## 6. Technical architecture — rekomendasi, bukan asumsi repo

**Audit dulu stack yang ada.** Bila compatible, gunakan **TypeScript + Vite + Three.js** untuk modul game, dan reuse existing framework/site build, routing, analytics, hosting. Jangan migrasikan seluruh situs hanya demi engine game. Game logic dipisahkan dari rendering agar unit test tidak memerlukan GPU. Jika repo existing punya engine yang layak, Dot harus memberi justifikasi sebelum mengganti.

### 6.1 Logical modules

| Module | Tanggung jawab |
|---|---|
| `game/core` | Fixed simulation tick, time/speed, seeded RNG, game-state orchestration |
| `game/world` | Tile/grid, boundaries, occupancy, path connectivity, habitat placement |
| `game/animals` | Species data, needs, AI state machine, movement target, welfare |
| `game/visitors` | Spawn, simple path progression, admissions, satisfaction |
| `game/economy` | Cash ledger, balance rules, prices, maintenance, rewards |
| `game/missions` | Events, completion criteria, progression and idempotent rewards |
| `game/render3d` | Scene, camera, models, animations, resource lifecycle, raycast |
| `game/ui` | HUD, menu, touch/keyboard controls, localization |
| `game/persistence` | Save/load/version migration, corruption recovery, reset |
| `game/telemetry` | Minimal privacy-aware gameplay events; optional, isolated |

### 6.2 Persisted state contract

Minimal serializable game save (field names are conceptual):

```ts
interface ZooSaveV1 {
  // Version field allows future migrations without silently losing progress.
  schemaVersion: 1;
  // Fixed seed is stored so randomized simulation behavior can be reproduced.
  randomSeed: number;
  // Simulation time is independent of browser rendering frames per second.
  gameTime: number;
  // Everything that affects player progress must survive a reload.
  currency: number;
  // Includes placed structures, paths, habitat objects, and their stable IDs.
  world: unknown;
  // Stores animal needs, locations, and serializable behavior state.
  animals: unknown[];
  // Stores completed objectives and rewards already claimed.
  missions: unknown;
  // Store UX preferences separately where practical.
  preferences: { locale: "id" | "en"; graphics: "low" | "auto" | "high" };
}
```

Dot harus memperjelas typing dan validasi aktual sebelum implementasi; `unknown` di contoh ini hanya penanda struktur yang harus didefinisikan. Simpan data, **bukan referensi Three.js mesh, DOM, atau class instance**. Use `IndexedDB` bila perlu ukuran/transaksi; tidak ada server DB V1. Jika storage unavailable, inform user, jangan klaim tersimpan.

### 6.3 Rules engineering

1. **Simulation ≠ renderer**; state tidak diturunkan dari frame-rate. Rendering bisa 30 FPS sementara tick tetap benar.
2. Setiap aksi `build/care/pay/reward` divalidasi dan commit atomically/idempotently; UI hanya membaca state yang benar.
3. `requestAnimationFrame` dan event listeners memiliki cleanup yang benar; tidak ada RAF loop ganda setelah route changes.
4. Mesh, materials, textures, geometries, audio contexts, dan observers yang dibuat dinamis perlu disposal/cleanup.
5. Map kecil dan jumlah entitas terkendali; use instancing untuk pohon/vegetasi identik dan culling bila memang dibutuhkan.
6. Asset asli atau punya lisensi yang mengizinkan penggunaan komersial, dengan manifest sumber dan atribusi; jangan download random copyrighted models.
7. Asset awal diprioritaskan dari procedural terrain/vegetation + satu model satwa berkualitas; glTF/GLB dikompresi jika cocok.
8. Build/test lokal; jangan menghabiskan GitHub Actions minutes. Push ke branch production hanya setelah gate QA.
9. Jangan menumpuk artifact QA/video/screenshot build ke repo. Target repo kerja tetap masuk akal (prefer **&lt;10 GB**), media legal yang reusable disimpan rapi.
10. Implementasi memakai satu micro-feature per langkah; size dan complexity dibatasi supaya tidak menjadi proyek 3D monolitik.

### 6.4 Target performa awal (engineering budgets)

- Android kelas menengah Chrome: target **≥30 FPS** pada scene starter, kamera bergerak dan burung beranimasi; desktop target **≥60 FPS** bila hardware mendukung.
- First-play download **≤20 MB** sebagai budget desain distribusi mobile; gunakan lazy load untuk konten lanjutan. Target first interaction ≤10 detik pada koneksi representatif yang terukur, bukan klaim universal.
- 15 menit gameplay soak test tidak crash, memory tidak tumbuh tanpa batas, UI tetap responsive.
- Bila GPU/browser tidak mendukung WebGL, tampilkan pesan yang jelas, bukan layar hitam.
- Optimasi asset dan scene **sesudah profiler** membuktikan bottleneck; jangan langsung migrasi ke Rust/WASM.

---

## 7. Release scope, milestones &amp; living feature checklist

**Makna checklist:** `[ ]` belum selesai; `[x]` selesai **hanya** bila implementasi, test E2E relevan, evidence, dan commit berhasil. Jangan mencentang hanya karena coding atau compile sukses.

**Execution protocol:** Dot pilih item tertinggi yang dependency-nya terpenuhi → implement via Codex → unit/integration/E2E &amp; visual mobile/desktop → fix → commit → update PRD dengan tanggal, commit, hasil uji, bug, next → lanjut otomatis. Eskalasi hanya jika genuine blocker (credentials/2FA, biaya/lisensi, perubahan scope tak dapat dibalik, akses production). No manual PO approval setiap micro-feature.

### M0 — Existing-site audit &amp; safe foundation (8)

- [ ] **M0-01** Audit repo, stack, Cloudflare Pages routing, existing content/SEO, analytics; catat apa yang boleh di-reuse. **Verify:** laporan audit dan baseline routes.
- [x] **M0-02** Ambil baseline screenshots &amp; browser smoke existing homepage, navigation, mobile; kumpulkan rollback plan. **Verify:** snapshot dan baseline tests.
- [x] **M0-03** Asset inventory + licenses + visual target; pilih model satu spesies burung tropis yang feasible dan legal. **Verify:** manifest asset, ukuran, attribution.
- [ ] **M0-04** Buat route `/play`, start screen, navigasi &amp; link dari site tanpa merusak routes lain. **Verify:** reload direct URL /play + original URLs.
- [ ] **M0-05** Setup 3D canvas, loading, WebGL failure state; no blank screen. **Verify:** desktop/mobile render &amp; negative test.
- [ ] **M0-06** Tentukan typed game entities, simulation tick, event bus minimal, save schema version. **Verify:** architecture tests &amp; serialization sample.
- [ ] **M0-07** Setup unit, integration, local E2E + screenshot capture yang dijalankan tanpa GitHub Actions. **Verify:** reproducible test commands.
- [ ] **M0-08** Tetapkan initial performance baseline, screen sizes &amp; artifact hygiene. **Verify:** baseline measurements recorded.

**Exit M0:** route game siap dikembangkan tanpa mengganti website menjadi game kosong.

### M1 — Tiny world + building controls (7)

- [ ] **M1-01** Render small low-poly tropical diorama (tanah, creek, pohon, gate) dengan kamera isometrik. **Verify:** visual screenshot mobile/desktop.
- [ ] **M1-02** Pan/zoom camera dengan mouse dan touch, clamped. **Verify:** gesture &amp; wheel tidak keluar map atau page-scroll tak sengaja.
- [ ] **M1-03** Scene picking: pilih tile/object, show panel identitas. **Verify:** raycast mouse/touch akurat.
- [ ] **M1-04** Build-mode preview dengan valid/invalid placement, Confirm/Cancel. **Verify:** cancel no side-effects.
- [ ] **M1-05** Place valid habitat/fence dalam bounds; persist occupancy. **Verify:** tidak overlap/keluar map.
- [ ] **M1-06** Place visitor path dari gate ke enclosure; cek connectivity. **Verify:** disconnected route terdeteksi.
- [ ] **M1-07** Editing: pilih/hapus/perbaiki salah tempat sesuai aturan refund; kontrol anti-double-input. **Verify:** balance dan occupancy konsisten.

**Exit M1:** pemain dapat menata habitat dan jalan, bukan sekadar melihat diorama.

### M2 — Living animals + care (7)

- [ ] **M2-01** Satu model bird stylized final-quality + animation states minimum. **Verify:** bukan placeholder, ukuran &amp; animasi mobile baik.
- [ ] **M2-02** Place dua bird instances di habitat; idle/wander/perch autonomous. **Verify:** bergerak, tidak clipping/keluar pagar.
- [ ] **M2-03** Feeder dapat di-place, diisi, dikonsumsi; animal seek-food. **Verify:** aksi care berdampak terhadap model kebutuhan &amp; animasi.
- [ ] **M2-04** Water source dapat di-place, diisi, dikonsumsi; seek-water. **Verify:** thirst response dapat diobservasi.
- [ ] **M2-05** Rest/perch + energy behavior + enrichment sederhana. **Verify:** state transition tidak macet.
- [ ] **M2-06** Animal info &amp; welfare formula + alert dengan sebab yang jelas. **Verify:** low/high welfare test scenarios.
- [ ] **M2-07** Full animal action QA: tidak teleport, sumber inaccessible tidak dipakai, tab pause/resume aman. **Verify:** multi-cycle E2E dan visual evidence.

**Exit M2:** player care memiliki konsekuensi nyata; satwa adalah living agents, bukan animasi loop tanpa state.

### M3 — Visitors and money (7)

- [ ] **M3-01** Visitor spawn dari gate dengan cap jumlah agent. **Verify:** terlihat bergerak, tidak spawn di air.
- [ ] **M3-02** Simple walking/path graph ke viewing spot, return gate. **Verify:** rute putus mencegah kunjungan.
- [ ] **M3-03** Guest satisfaction berdasar habitat reachable + welfare, UI visual feedback. **Verify:** negative dan positive cases.
- [ ] **M3-04** Tiket masuk dibayar sekali per visitor ID; ledger. **Verify:** tidak duplikasi saat frame drop/reload.
- [ ] **M3-05** Cost build/feed/maintenance divalidasi vs saldo. **Verify:** insufficient coins tidak membuat objek gratis.
- [ ] **M3-06** Cashflow/ticket/opex ringkas &amp; configurable tuning. **Verify:** balance benar pada time scale berbeda.
- [ ] **M3-07** Low-cash alert &amp; recovery path; no unwinnable softlock. **Verify:** pemain bisa pulih dari skenario saldo minimal.

**Exit M3:** habitat memengaruhi pengunjung dan revenue; ekonomi memengaruhi keputusan berikutnya.

### M4 — Progression and gameplay proof (7)

- [ ] **M4-01** Mission event engine dan completion idempotence. **Verify:** reward exactly-once.
- [ ] **M4-02** Onboarding Q01: habitat &amp; connected path (contextual hints). **Verify:** first-time player can finish.
- [ ] **M4-03** Mission Q02: dua burung, makan &amp; minum, welfare target. **Verify:** bukan sekadar tombol claim.
- [ ] **M4-04** Mission Q03: admission + viewing visit. **Verify:** guest actions counted once.
- [ ] **M4-05** Mission Q04 &amp; unlock kecil, local achievement badge. **Verify:** unlock persists.
- [ ] **M4-06** Implement 1×/10× game speed dengan consistent fixed-step economics. **Verify:** deterministic equivalence &amp; no accelerated render loop.
- [ ] **M4-07** Golden-path 10–15 minute playable E2E dari new game → 3+ missions → economic loop. **Verify:** screen recording and bug list zero blockers.

**Exit M4:** ada GAME lengkap secara fungsional pada slice kecil, bukan demo teknis.

### M5 — Save, UX, mobile quality (7)

- [ ] **M5-01** Autosave &amp; Continue via versioned local persistence; save at logical safe checkpoints. **Verify:** refresh/reopen.
- [ ] **M5-02** Load-validation, migration strategy, corrupted-storage recovery without silent wipe. **Verify:** intentionally malformed save test.
- [ ] **M5-03** Pause/resume &amp; background tab, restart/reset with confirmation. **Verify:** no double updates or unbounded offline income.
- [ ] **M5-04** Responsive HUD for phone portrait, landscape and desktop; pointer/touch pass. **Verify:** viewport matrix screenshot.
- [ ] **M5-05** Full UI ID/EN with language switch persistence. **Verify:** no untranslated mission or error critical.
- [ ] **M5-06** Help, settings, mute, reduce-motion/low-graphics options. **Verify:** functional settings, no inert buttons.
- [ ] **M5-07** First-run user testing &amp; UX fix of confusing steps; minimize clicks. **Verify:** unaided test notes and corrections.

**Exit M5:** playable and resumable without assistance across target device classes.

### M6 — Hardening, website integration &amp; production release (8)

- [ ] **M6-01** GPU/browser profiling; optimize only measured bottlenecks; meet mobile FPS target or document measured limitations. **Verify:** FPS metrics and before/after profile.
- [ ] **M6-02** Compress/lazy-load game assets, review initial payload / memory leak / error boundary. **Verify:** measured bundle and soak test.
- [ ] **M6-03** Black-box end-user tests across devices, including failure/recovery. **Verify:** full test evidence.
- [ ] **M6-04** White-box state/invariants tests: welfare ranges, money ledger, path validity, mission idempotence, speed. **Verify:** automated test report.
- [ ] **M6-05** Dead-code/dependency/asset/license audit; repo, build, QA artifact cleanup (keep usable licensed media). **Verify:** audit summary and repo size.
- [ ] **M6-06** Security &amp; privacy review: no PII/login, storage transparency, safe errors, accessibility. **Verify:** sign-off notes.
- [ ] **M6-07** Update homepage game CTA, metadata, in-site Learn relationship, preserve existing public URLs; minimal privacy-safe telemetry where compliant. **Verify:** SEO route regression &amp; events.
- [ ] **M6-08** Final local build → authorized main push/deploy → live production smoke test desktop/mobile → rollback-ready V1 report. **Verify:** actual production URL, commit hash, test timestamps.

**Exit M6 = V1 RELEASE:** all P0/P1 defects closed; owner can play live after Dot has tested live. No new features before release gate.

### M7 — Post-V1 roadmap (NOT V1 blockers; unchecked until explicitly scheduled)

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

**Status at PRD creation:** M0–M7 = 0 completed; no repo work is claimed in this PRD. V1 scope is M0–M6 = **51 micro-features**; M7 = **12 optional post-V1 backlog items**. Progress % reported as `verified_completed_V1 / 51 × 100`, optionally per milestone. Count only M0–M6 in V1 progress.

---

## 8. Test matrix &amp; Definition of Done

### 8.1 Device matrix

- Android Chrome: mid-range phone, portrait **360×780** baseline and landscape baseline.
- Desktop Chrome/Edge: 1366×768 and 1920×1080.
- Additional: Safari/iOS if available; if unavailable, report as *not tested*, do not claim pass.
- Use internal/local browser for UI and 3D visual tests; screenshots/video of actual canvas, not just successful DOM selectors.

### 8.2 Required test types

| Test | Minimum required checks |
|---|---|
| **Black box** | Fresh start, all controls, build/cancel, animal care, guests/tickets, 3 missions, save/reopen, mobile, failure recovery |
| **White box** | Deterministic sim tick, state transitions, serialization migration, ledger invariants, path connectivity, no double claim |
| **Integration** | HUD ↔ game state ↔ renderer, animal ↔ resource, visitor ↔ path, mission ↔ economy, save ↔ reload |
| **Visual/interaction** | 3D image quality, animal readable, tap vs drag, no touch overlays, no invisible object |
| **Performance** | FPS, frame time, initial payload, long session, scene cleanup, memory after restart |
| **Dead code / hygiene** | Unused code/deps/assets, failed prototype remnants, source-map/secrets exposure, license manifest |
| **Regression** | Existing site navigation, article routes, site analytics (where applicable), zero broken links |
| **Live smoke** | Real `/play` production, cold start, 1 mission, save/reload, bilingual, mobile &amp; desktop where accessible |

### 8.3 Every micro-feature is Done only if

1. User-visible action works end-to-end (or backend rule has integration test for upcoming UI).
2. Automated test passes, E2E/visual evidence captured when meaningful.
3. No P0/P1 regression; known lesser issues recorded.
4. Code committed locally with clean history; no giant unreviewed file or duplicate game loop.
5. PRD checkbox updated to `[x]`, completion date, commit hash, evidence link/path, issues &amp; next ID recorded.
6. Dot automatically continues to next feature unless there is a genuine blocker.

### 8.4 Production release no-go conditions

- 3D scene hanya terlihat bagus tetapi tidak ada loop interaktif.
- Hewan tidak merespons makanan/air atau welfare UI bohong.
- Pengunjung tidak bergerak ke habitat, uang bertambah tanpa pengunjung valid, reward bisa diklaim berulang.
- Save hilang saat refresh, game black screen di Android supported, gesture mobile tak usable.
- Test hanya unit tanpa visual browser check.
- Existing content website rusak, repo berisi artifact QA masif atau asset tak jelas lisensinya.
- Aplikasi mengklaim production tested padahal Dot hanya tested localhost.

---

## 9. Player analytics &amp; product validation

**Event candidate (privacy conscious, non-PII):** `play_open`, `game_start`, `first_path_placed`, `first_habitat_built`, `first_animal_cared`, `first_visitor_admitted`, `mission_completed`, `session_5m`, `session_10m`, `resume_game`, `game_error`. Do not send animal or user free text. Follow site's legal/privacy configuration and consent needs, particularly given animals/education may attract minors.

**Product hypotheses** (to test, not fabricated benchmarks):

- At least 70% of users who click Play can get past onboarding start with no error.
- At least 50% of *started sessions* reach first habitat build in a guided playtest.
- At least 30% of *started sessions* see a paid visitor before leaving.
- Returning players / session duration to be measured before deciding deeper game development.

These are **initial experimentation targets**, not industry benchmarks. Definitions, sample size and attribution should be stated in the first actual measurement report; never claim a win without sufficient observation.

**Decision gate after V1:** If players finish first habitat but abandon before guests, improve visitor feedback &amp; clarity before adding species. If many exit during loading or camera movement, prioritize perf/controls rather than new content. If gameplay flow performs well, proceed to Sandbox and additional species.

---

## 10. Marketplace readiness — future distribution, reuse first

Keep website MyZooTwin.com as the canonical home. When V1 is stable, reuse engine/art and produce platform-specific packaging, rather than cloning the project prematurely.

1. **itch.io:** shortest browser-first experiment; supports an HTML5 ZIP containing `index.html`. Verify absolute asset paths and iframe behavior; cross-origin local saves may be different per host.
2. **CrazyGames:** evaluate game quality and publisher requirements before submitting. Documented technical limits include **initial download ≤50 MB** for Basic; **≤20 MB** for eligibility on mobile homepage. Target our bundle ≤20 MB from the start. Submission may require QA and SDK obligations for Full Launch; do not assume acceptance.
3. **Roblox:** a later native adaptation is substantial work (Studio/Luau, systems redesign). Reusable assets may include glTF/FBX/OBJ models, audio and behavioral design, but web TypeScript cannot simply be dropped into Roblox.
4. Monetization: validate retention before adopting ad/paid options; protect user trust and animal-welfare-first brand. No pay-to-win and no forced watch ads in the initial experience.

**Asset/source boundaries:** maintain a curated exportable asset pack (species models, animation clips, textures, ambient audio, icons) plus documented rights. Do not copy competitor code, UI, or art.

---

## 11. Dot autonomous execution protocol

**Working principle:** *One tiny feature → working user outcome → evidence → PRD update → next tiny feature.* Avoid parallel giant implementations or all-at-once art dumps.

- Dot may use Codex as engineer and its local browser to inspect real UI, implement, test and fix.
- Begin with M0 audit. Do not assume the current repo, framework, or Cloudflare settings. Preserve production and site content.
- For each item: report `[ID] Complete/Blocked`, what changed, tests+evidence, commit, known issues, next item, updated V1 `%`.
- A feature is not complete merely because TypeScript compiles; interaction &amp; game simulation must actually work.
- Update this PRD as the **living source of truth** every completed micro-feature.
- Do not push to auto-deploy main until release readiness; use local builds/tests to conserve GitHub Actions minutes. At authorized final release, push/deploy, then smoke test live.
- Stop and escalate ONLY for unresolvable credentials/2FA, legal/licensing, irreversible production-impacting changes, or requirements incompatible with safety/data protection. Ordinary bugs must be investigated, fixed, and retested autonomously.
- If a bug blocks progress repeatedly, stop adding features, isolate smallest reproduction, revert failed experiment while retaining licensed media, and document root cause and recovery.
- Keep failed code, redundant artifacts, large test videos and stale branches out of active project. Never delete original work without a verified rollback route.

### Completion report template

```text
MyZooTwin — Micro-feature Mx-yy
Status: COMPLETE / BLOCKED
Change: ...
Evidence: unit ... | integration ... | local browser desktop ... | mobile ...
Commit: &lt;hash&gt; (local / pushed, specify)
Known issues: ...
Next: Mx-zz
V1 progress: n/51 (xx.xx%)
Production: not deployed / deployed URL + tested time
```

### Weekly checkpoint (only when requested or useful)

```text
M0 n/8 | M1 n/7 | M2 n/7 | M3 n/7 | M4 n/7 | M5 n/7 | M6 n/8
V1 total n/51 (xx.xx%)
Top risk: ...
Golden-path playable: NO / LOCAL ONLY / LIVE VERIFIED
```

---

## 12. Risks &amp; mitigations

| Risk | Causal failure | Mitigation |
|---|---|---|
| Over-scope zoo simulation | Many species &amp; systems before a fun loop | Lock one species + one habitat until V1 playable |
| Eye-candy only | Pretty 3D without game incentives | Require animal reaction + guest/ticket feedback + mission proof |
| Mobile GPU limitations | Excess models, textures, shadows, draw calls | Low-poly, instancing, constrained map, LOD/quality, profile |
| Monolithic agent coding | Huge files, tests degrade, persistent bug | Micro-features, clean module boundaries, zero P1 gate |
| Production content regression | Game homepage rewrite breaks existing site | `/play` first, baseline tests, SEO checks, rollback |
| Unsafely sourced assets | Incompatible copyright/license | Asset manifest and original/commercial-safe assets |
| Data loss | Bad save migration or storage blocked | Versioning, validation, fallback/recovery, user disclosure |
| Too much monetization | Interruptions destroy retention | None in V1; use metrics before considering it |
| Cross-site save mismatch | Browser origin differs in marketplace embeds | Separate save namespace, export/import later if needed |
| Unrealistic animal behavior | Educational journal contradicts game | Distinguish simplified game mechanics from factual animal cards |

---

## 13. Key references consulted for this PRD

1. Current website (baseline): https://myzootwin.com/
2. Zoo 2: Animal Park (paths, animals, visitor satisfaction as genre benchmark): https://support.upjers.com/en/faq/zoo-2-animal-park
3. Three.js instancing (render optimization): https://threejs.org/docs/pages/InstancedMesh.html
4. Three.js responsive rendering / resolution tradeoffs: https://threejs.org/manual/pages/responsive.html
5. itch.io HTML5 packaging: https://itch.io/docs/creators/html5
6. CrazyGames game requirements: https://docs.crazygames.com/requirements/intro/ and https://docs.crazygames.com/requirements/technical/
7. Roblox Studio importer: https://create.roblox.com/docs/studio/importer

**Use these as references, not as permission to copy competitor assets.** Recheck changing policies before marketplace submission.

---

## 14. Final scope lock &amp; handoff

**Start at M0-01. Stop building new features after M6-08 until V1 is played and evaluated live.** Goal is not “a big zoo”, but **a tiny living zoo that is genuinely fun**. Once V1 passes, expand one species/feature at a time and only when it improves player experience.

**IMPORTANT:** This document is the PRD, not an implementation report. Nothing is declared implemented, deployed, or tested by its creation.

---

## Execution status — 2026-10-31 UTC

Verified V1 completion: **2/51 (3.92%)**; M7 **0/12 deferred**. Only M0-02 and M0-03 are checked complete; M0-01 remains partial.

M0-01 PARTIAL: repo/stack and public routes/SEO/analytics audit recorded in M0-01_AUDIT.md. Documentation checkpoint commit: 3a85cb01843c44fc1d0b56b319b13e69dceec2f3 (local only). Complete source-text transcription alternative is now saved with explicit provenance; no failed Library helper retry or metadata bypass occurred. Existing Wrangler OAuth access independently confirmed the MyZooTwin Pages project/domains, main production deployments, dist output and PUBLIC_GA4_ID variable name. Exact source-repository binding and build command remain unavailable through the supported CLI read surfaces used; see audit evidence and remaining verification gap.

No app code, route, dependency, or production changes. M0-02 browser baseline is complete as recorded below; no gameplay, physical Android, true-touch or performance pass is claimed. Next: M0-04 /play start screen/navigation preserving original routes. M0-01 external configuration verification remains pending and the production release gate stays closed.

### M0-02 completion record — 2026-10-31 UTC

Status: COMPLETE as an existing-site baseline and rollback-plan task. Evidence commit: ec17bd19f4d4292eba269854ac4a512114737b0c (local only). Report: [M0-02_BASELINE.md](M0-02_BASELINE.md); structured route/keyboard/console evidence and eight actual screenshots: [qa/m0-02](qa/m0-02/).

Verification: npm run check (0 errors/warnings/hints), npm run build (8 pages), 24 browser direct-route/reload scenarios across public desktop/public portrait/local desktop, header/CTA/keyboard navigation, visual portrait/landscape/desktop captures, unchanged application/media diff, and loopback preview shutdown verified. Screenshot files total 667,094 bytes; requested CSS sizes and actual capture pixels are distinguished in the manifest.

Known pre-existing issues: BASE-01 /animals/ horizontal overflow at 360px (document 387px); BASE-02 journal quote contrast about 1.63:1. No application fixes were made. No physical Android/Safari/iOS, FPS/soak/save/gameplay or actual rollback eligibility pass. Rollback candidates are recorded without claiming a tested rollback. Next: M0-03. V1 verified progress: 1/51 (1.96%).

### M0-03 completion record — 2026-10-31 UTC

Status: COMPLETE as asset inventory/rights treatment/visual and model-approach selection. Evidence commit: 01f61a4a5208ed66350e5c5a56f82df138945461 (local only). Report: [M0-03_ASSETS.md](M0-03_ASSETS.md); machine manifest: [ASSET_MANIFEST.json](ASSET_MANIFEST.json); original study: [art/studies/macaw-m0-03](../art/studies/macaw-m0-03/README.md).

Selected species: blue-and-yellow macaw (Ara ararauna), two individuals, with original parametric geometry. Study measurements: 2,028 triangles, eight rigid groups, one material, zero textures/animations, 189,816-byte GLB. Asset hashes/direct notice spot-checks, authoritative species/OFL/MIT sources, deterministic regeneration, bounded GLB structural positive/negative checks and actual isolated-browser SVG-projection review recorded. Temporary loopback viewer shut down. Existing app/media/dependencies and immutable transcripts unchanged.

Limits: old hero/favicon provenance remains unverified and their existing use is preserved; no external model/texture/audio selected or agreement accepted. Study is not final M2-01 art, a GLB-loader/WebGL/animation/FPS/mobile-device pass, or a completed <=20 MB game bundle. Primary species facts are separated from game simplifications. Next: M0-04. V1 verified progress: 2/51 (3.92%); M0-01 remains partial, M7 deferred, no push/deploy.
