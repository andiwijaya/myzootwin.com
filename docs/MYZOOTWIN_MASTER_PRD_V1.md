<!-- CANONICAL WORKING REQUIREMENTS: complete text transcription from owner-supplied Library source libfile_95d9687acd708191a8960074770c3410 (MYZOOTWIN_MASTER_PRD_V1(1).md), provided as source-text handoff on 2026-10-31. Not a byte-exact native materialization. Immutable text transcript: sources/MYZOOTWIN_MASTER_PRD_V1.transcript.md. -->


Current verified status (2026-11-02 UTC): **42/51 (82.35%)**, M6 **2/8**. Historical execution records retain their original dates/counts. Latest report: [M6-04](M6-04_WHITE_BOX_INVARIANTS.md).

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
- [x] **M0-04** Buat route `/play`, start screen, navigasi &amp; link dari site tanpa merusak routes lain. **Verify:** reload direct URL /play + original URLs.
- [x] **M0-05** Setup 3D canvas, loading, WebGL failure state; no blank screen. **Verify:** desktop/mobile render &amp; negative test.
- [x] **M0-06** Tentukan typed game entities, simulation tick, event bus minimal, save schema version. **Verify:** architecture tests &amp; serialization sample.
- [x] **M0-07** Setup unit, integration, local E2E + screenshot capture yang dijalankan tanpa GitHub Actions. **Verify:** reproducible test commands.
- [x] **M0-08** Tetapkan initial performance baseline, screen sizes &amp; artifact hygiene. **Verify:** baseline measurements recorded.

**Exit M0:** route game siap dikembangkan tanpa mengganti website menjadi game kosong.

### M1 — Tiny world + building controls (7)

- [x] **M1-01** Render small low-poly tropical diorama (tanah, creek, pohon, gate) dengan kamera isometrik. **Verify:** visual screenshot mobile/desktop.
- [x] **M1-02** Pan/zoom camera dengan mouse dan touch, clamped. **Verify:** gesture &amp; wheel tidak keluar map atau page-scroll tak sengaja.
- [x] **M1-03** Scene picking: pilih tile/object, show panel identitas. **Verify:** raycast mouse/touch akurat.
- [x] **M1-04** Build-mode preview dengan valid/invalid placement, Confirm/Cancel. **Verify:** cancel no side-effects.
- [x] **M1-05** Place valid habitat/fence dalam bounds; persist occupancy. **Verify:** tidak overlap/keluar map.
- [x] **M1-06** Place visitor path dari gate ke enclosure; cek connectivity. **Verify:** disconnected route terdeteksi.
- [x] **M1-07** Editing: pilih/hapus/perbaiki salah tempat sesuai aturan refund; kontrol anti-double-input. **Verify:** balance dan occupancy konsisten.

**Exit M1:** pemain dapat menata habitat dan jalan, bukan sekadar melihat diorama.

### M2 — Living animals + care (7)

- [x] **M2-01** Satu model bird stylized final-quality + animation states minimum. **Verify:** bukan placeholder, ukuran &amp; animasi mobile baik.
- [x] **M2-02** Place dua bird instances di habitat; idle/wander/perch autonomous. **Verify:** bergerak, tidak clipping/keluar pagar.
- [x] **M2-03** Feeder dapat di-place, diisi, dikonsumsi; animal seek-food. **Verify:** aksi care berdampak terhadap model kebutuhan &amp; animasi.
- [x] **M2-04** Water source dapat di-place, diisi, dikonsumsi; seek-water. **Verify:** thirst response dapat diobservasi.
- [x] **M2-05** Rest/perch + energy behavior + enrichment sederhana. **Verify:** state transition tidak macet.
- [x] **M2-06** Animal info &amp; welfare formula + alert dengan sebab yang jelas. **Verify:** low/high welfare test scenarios.
- [x] **M2-07** Full animal action QA: tidak teleport, sumber inaccessible tidak dipakai, tab pause/resume aman. **Verify:** multi-cycle E2E dan visual evidence.

**Exit M2:** player care memiliki konsekuensi nyata; satwa adalah living agents, bukan animasi loop tanpa state.

### M3 — Visitors and money (7)

- [x] **M3-01** Visitor spawn dari gate dengan cap jumlah agent. **Verify:** terlihat bergerak, tidak spawn di air.
- [x] **M3-02** Simple walking/path graph ke viewing spot, return gate. **Verify:** rute putus mencegah kunjungan.
- [x] **M3-03** Guest satisfaction berdasar habitat reachable + welfare, UI visual feedback. **Verify:** negative dan positive cases.
- [x] **M3-04** Tiket masuk dibayar sekali per visitor ID; ledger. **Verify:** tidak duplikasi saat frame drop/reload.
- [x] **M3-05** Cost build/feed/maintenance divalidasi vs saldo. **Verify:** insufficient coins tidak membuat objek gratis.
- [x] **M3-06** Cashflow/ticket/opex ringkas &amp; configurable tuning. **Verify:** balance benar pada time scale berbeda.
- [x] **M3-07** Low-cash alert &amp; recovery path; no unwinnable softlock. **Verify:** pemain bisa pulih dari skenario saldo minimal.

**Exit M3:** habitat memengaruhi pengunjung dan revenue; ekonomi memengaruhi keputusan berikutnya.

### M4 — Progression and gameplay proof (7)

- [x] **M4-01** Mission event engine dan completion idempotence. **Verify:** reward exactly-once.
- [x] **M4-02** Onboarding Q01: habitat &amp; connected path (contextual hints). **Verify:** first-time player can finish.
- [x] **M4-03** Mission Q02: dua burung, makan &amp; minum, welfare target. **Verify:** bukan sekadar tombol claim.
- [x] **M4-04** Mission Q03: admission + viewing visit. **Verify:** guest actions counted once.
- [x] **M4-05** Mission Q04 &amp; unlock kecil, local achievement badge. **Verify:** unlock persists.
- [x] **M4-06** Implement 1×/10× game speed dengan consistent fixed-step economics. **Verify:** deterministic equivalence &amp; no accelerated render loop.
- [ ] **M4-07** Golden-path 10–15 minute playable E2E dari new game → 3+ missions → economic loop. **Verify:** screen recording and bug list zero blockers.

**Exit M4:** ada GAME lengkap secara fungsional pada slice kecil, bukan demo teknis.

### M5 — Save, UX, mobile quality (7)

- [x] **M5-01** Autosave &amp; Continue via versioned local persistence; save at logical safe checkpoints. **Verify:** refresh/reopen.
- [x] **M5-02** Load-validation, migration strategy, corrupted-storage recovery without silent wipe. **Verify:** intentionally malformed save test.
- [x] **M5-03** Pause/resume &amp; background tab, restart/reset with confirmation. **Verify:** no double updates or unbounded offline income.
- [x] **M5-04** Responsive HUD for phone portrait, landscape and desktop; pointer/touch pass. **Verify:** viewport matrix screenshot.
- [x] **M5-05** Full UI ID/EN with language switch persistence. **Verify:** no untranslated mission or error critical.
- [x] **M5-06** Help, settings, mute, reduce-motion/low-graphics options. **Verify:** functional settings, no inert buttons.
- [ ] **M5-07** First-run user testing &amp; UX fix of confusing steps; minimize clicks. **Verify:** unaided test notes and corrections.

**Exit M5:** playable and resumable without assistance across target device classes.

### M6 — Hardening, website integration &amp; production release (8)

- [ ] **M6-01** GPU/browser profiling; optimize only measured bottlenecks; meet mobile FPS target or document measured limitations. **Verify:** FPS metrics and before/after profile.
- [x] **M6-02** Compress/lazy-load game assets, review initial payload / memory leak / error boundary. **Verify:** measured bundle and soak test.
- [ ] **M6-03** Black-box end-user tests across devices, including failure/recovery. **Verify:** full test evidence.
- [x] **M6-04** White-box state/invariants tests: welfare ranges, money ledger, path validity, mission idempotence, speed. **Verify:** automated test report.
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

Verified V1 completion: **20/51 (39.22%)**; M7 **0/12 deferred**. Only M0-02 through M0-08 and M1-01 through M1-07 plus M2-01 through M2-06 are checked complete; M0-01 remains partial.

M0-01 PARTIAL: repo/stack and public routes/SEO/analytics audit recorded in M0-01_AUDIT.md. Documentation checkpoint commit: 3a85cb01843c44fc1d0b56b319b13e69dceec2f3 (local only). Complete source-text transcription alternative is now saved with explicit provenance; no failed Library helper retry or metadata bypass occurred. Existing Wrangler OAuth access independently confirmed the MyZooTwin Pages project/domains, main production deployments, dist output and PUBLIC_GA4_ID variable name. Exact source-repository binding and build command remain unavailable through the supported CLI read surfaces used; see audit evidence and remaining verification gap.

Local /play entry, renderer/fallbacks, ID/EN preferences, typed fixed-tick core/save-codec, repeatable QA and measured payload/resource/callback baseline are verified. Tropical Creek world, bounded camera, selection, habitat/path construction, entrance connectivity, confirmed deletion/Undo and capped refund contracts are working. Original final macaw model/animation preview and two stable autonomous macaws now include actual feeding and drinking with independent per-bowl stocks, hunger/thirst effects, competing needs and safe resource removal. Page-session state survives renderer retry/remount; full reload still resets the preview until M5 durable persistence. Functional supported rest/energy recovery and foliage exploration/enrichment are verified. Individual welfare, score causes and actionable bilingual animal information are verified. Full animal-action QA, visitors/economy/missions, full mobile UX/localization and the full gameplay loop remain later. Native product and injected fixture evidence are distinguished; physical Android/true touch/Safari/iOS/presentedFPS/GPU timing/network/soak/live production are not claimed passed. Next: M2-07 full animal-action QA. M0-01 external configuration verification remains pending and the production release gate stays closed.

### M0-02 completion record — 2026-10-31 UTC

Status: COMPLETE as an existing-site baseline and rollback-plan task. Evidence commit: ec17bd19f4d4292eba269854ac4a512114737b0c (local only). Report: [M0-02_BASELINE.md](M0-02_BASELINE.md); structured route/keyboard/console evidence and eight actual screenshots: [qa/m0-02](qa/m0-02/).

Verification: npm run check (0 errors/warnings/hints), npm run build (8 pages), 24 browser direct-route/reload scenarios across public desktop/public portrait/local desktop, header/CTA/keyboard navigation, visual portrait/landscape/desktop captures, unchanged application/media diff, and loopback preview shutdown verified. Screenshot files total 667,094 bytes; requested CSS sizes and actual capture pixels are distinguished in the manifest.

Known pre-existing issues: BASE-01 /animals/ horizontal overflow at 360px (document 387px); BASE-02 journal quote contrast about 1.63:1. No application fixes were made. No physical Android/Safari/iOS, FPS/soak/save/gameplay or actual rollback eligibility pass. Rollback candidates are recorded without claiming a tested rollback. Next: M0-03. V1 verified progress: 1/51 (1.96%).

### M0-03 completion record — 2026-10-31 UTC

Status: COMPLETE as asset inventory/rights treatment/visual and model-approach selection. Evidence commit: 01f61a4a5208ed66350e5c5a56f82df138945461 (local only). Report: [M0-03_ASSETS.md](M0-03_ASSETS.md); machine manifest: [ASSET_MANIFEST.json](ASSET_MANIFEST.json); original study: [art/studies/macaw-m0-03](../art/studies/macaw-m0-03/README.md).

Selected species: blue-and-yellow macaw (Ara ararauna), two individuals, with original parametric geometry. Study measurements: 2,028 triangles, eight rigid groups, one material, zero textures/animations, 189,816-byte GLB. Asset hashes/direct notice spot-checks, authoritative species/OFL/MIT sources, deterministic regeneration, bounded GLB structural positive/negative checks and actual isolated-browser SVG-projection review recorded. Temporary loopback viewer shut down. Existing app/media/dependencies and immutable transcripts unchanged.

Limits: old hero/favicon provenance remains unverified and their existing use is preserved; no external model/texture/audio selected or agreement accepted. Study is not final M2-01 art, a GLB-loader/WebGL/animation/FPS/mobile-device pass, or a completed <=20 MB game bundle. Primary species facts are separated from game simplifications. Next: M0-04. V1 verified progress: 2/51 (3.92%); M0-01 remains partial, M7 deferred, no push/deploy.

### M0-04 completion record — 2026-10-31 UTC

Status: COMPLETE as the real route/navigation/entry slice. Implementation/evidence commit: b72795dbdc91a4442ef39a440e41bf3026c6aaef (local only). Report: [M0-04_PLAY_ENTRY.md](M0-04_PLAY_ENTRY.md); actual screenshots, browser and HTTP/SEO evidence: [qa/m0-04](qa/m0-04/). /play and /play/ now serve the local entry with canonical https://myzootwin.com/play/, not the homepage fallback. Existing eight journal routes/content/media and analytics source preserved; sitemap retains them and adds /play/.

Truthful scope: Play/Continue disabled until gameplay exists; How to play/Settings work. Entry ID/EN dictionaries, browser preference, manual locale persistence, failure handling and native keyboard dialogs are implemented. Original inline SVG is labelled concept illustration, not a rendered game world. No Three.js/canvas, simulated gameplay, visitor/economy, game-save or final-animal claim.

Verification: 8 native Node unit tests passed; Astro check 12 files/0 errors/warnings/hints; final build 9 pages and 6,379-byte entry bundle (2,628 gzip). 18 browser URL/reload scenarios, dialog/keyboard, language reload persistence, history back/forward, mobile horizontal nav, desktop/portrait/landscape visuals and final-bundle smoke recorded. Nine screenshots total 412,878 bytes. Owned 127.0.0.1:4321 preview stopped and shutdown verified; tabs closed/viewport reset.

Limits/issues: BASE-01/02 unchanged; no physical Android/true touch/Safari/iOS/GPU/FPS/full localization pass. Optional Python public HTML comparison GET https://myzootwin.com/ returned HTTP 403 and was not retried; local regression uses saved M0-02 browser metadata plus unchanged source/media. M0-01 remains partial. Next: M0-05. V1 verified progress: 3/51 (5.88%); M7 deferred; no Actions/push/deploy.

### M0-05 completion record - 2026-10-31 UTC

Status: COMPLETE as the lazy renderer/fallback/lifecycle slice, 2026-10-31 UTC. Implementation/evidence commit: 585ffc6de5227ae21b382ab5f98000e8ba90c8c3 (local only). [Renderer report](M0-05_RENDERER_FOUNDATION.md), [tests/browser fixture](../tests/browser/README.md), [native/injected browser and route evidence](qa/m0-05/).

Real optional Three.js WebGL2 canvas on /play, with lazy import, bilingual loading/ready/unsupported/error states, close, retry and import-failure reload. Minimal original abstract geometry is explicitly a renderer foundation, not a sanctuary world/animal/gameplay claim. One RAF visual loop and session owner; late imports/stale handles cancelled, all owned canvas/GPU/listener/resize resources released. Journal navigation, entry dialogs and future disabled Play/Continue preserved.

Verification: 21/21 unit tests; Astro check 19 files, zero errors/warnings/hints; final build nine pages. Actual built native WebGL visually checked at DOM-verified 1366x768, 360x780 portrait and 780x360 landscape, ID/EN, keyboard, guide/settings/Escape, close/reopen and history return. 38 local-harness observations include five Open/Close and three remount/unmount cycles, explicit pause/resume, injected unsupported/constructor/import/delay/context-loss/render failures and recovery. Max one active session/pending RAF; zero after release; released geometries zero and cleanup errors zero. Seven screenshots 645,640 bytes. Eight old routes/metadata, original source/public files and analytics preserved; nine sitemap URLs. Exact three/@types/three 0.187.0; no existing dependency version changed. Lazy renderer 528,598 bytes / 131,488 gzip level 9, entry 13,475 / 5,068. Owned loopback ports 4321/4322 stopped, zero listeners checked; three owned tabs closed and viewport reset.

Limits/issues: Vite lazy raw-chunk >500kB warning recorded, not suppressed. Negative failures injected, no physical Android/true touch/Safari/iOS, hardware GPU identity/FPS/network/15-minute soak/full-localization/gameplay pass. BASE-01/02 unchanged. Earlier public Python HTTP403 was not retried. M0-01 exact external deployment configuration remains partial and release gated. Next: M0-06 typed entities/fixed tick/event/save-schema contract. Verified V1: 4/51 (7.84%); M7 deferred. No Actions/push/deploy.

### M0-06 completion record - 2026-10-31 UTC

Status: COMPLETE as typed state/fixed tick/events/save-codec foundation, 2026-10-31 UTC. Implementation/evidence commit: 61245f40a3cd6bfc6ad9d4f8560baefc859d4550 (local only). [Contract/integration report](M0-06_SIMULATION_CONTRACT.md); [unit, native browser, route, save-roundtrip and screenshot evidence](qa/m0-06/); updated [architecture](ARCHITECTURE.md).

Concrete version1 state covers bounded grid/occupancy/path/habitat/resources, two reserve Ara ararauna, needs/behavior/targets, visitors/unique admissions, integer Zoo Coins/operation ledger, Q01-Q04 objectives/reward references and preferences. Pure 100ms fixed steps, seeded xorshift32, typed events and independent snapshots integrate into the existing single renderer RAF. Tick events drive the abstract marker; no second RAF/timer. Catch-up accepts at most 250ms/three steps; pause clears partial tick/anchor, reset/disposal cannot duplicate updates or retain subscribers. Strict codec rejects malformed/future/oversize/range/reference data without silent repair or storage access. Two engineering fixtures roundtrip exactly (compact 9,654 and 10,579 UTF-8 bytes).

Verification: 36/36 unit/integration tests, Astro check 28 files with zero errors/warnings/hints, nine-page build. Integer/fractional accepted-frame equivalence, known RNG vector, save/reload continuation, bounded gaps, pause/restart, unsubscribe/errors, ownership and 29 populated-save corruptions plus schema/size/class/sparse-array cases tested. Thirteen native fixture lifecycle observations prove event-driven marker pose, paused tick stability, one subscriber/session/RAF across three remount cycles, context-loss retry and zero resources after unmount. Six actual built-product smoke observations include DOM-verified desktop1366x768/portrait360x780/landscape780x360, EN/ID settings/Escape, keyboard, history return and final Open/Close. Eight journal routes/metadata, both /play variants, nine sitemap URLs, analytics/assets/dependencies/source PRD unchanged. Five screenshots 465,823 bytes. Owned loopback ports4321/4322 stopped with zero listeners checked; two owned tabs closed and viewport reset.

Limits/issues: This advances time/RNG only; care/AI/building/visitors/payments/missions and autosave/Continue/migration/recovery remain future features. No 10x UI, physical Android/touch/Safari/iOS/FPS/network/soak/full-localization pass. Reduced-motion logic separation and visibility handler are implemented; physical background behavior not claimed. Lazy chunk 539,637 bytes /135,451 gzip level9; recorded raw >500kB warning, no speculative optimization. BASE-01/02 and M0-01 external Cloudflare configuration gap remain pending; earlier public Python403 not retried. Next: M0-07 reproducible local test/E2E/screenshot tooling. V1 verified 5/51 (9.80%); M7 deferred; no Actions/push/deploy.

### M0-07 completion record - 2026-10-31 UTC

Status: COMPLETE as reproducible local test/tooling and approved-runtime browser-receipt workflow, 2026-10-31 UTC. Implementation/evidence commit: 89e31a84b8cd1c4380eaeb0d17e149ca43ec1f3d (local only). [Feature report](M0-07_LOCAL_QA_WORKFLOW.md), [command/browser recipe](LOCAL_QA.md), [bounded final evidence and preliminary failure history](qa/m0-07/).

Native Node test discovery consolidates all prior36 plus nine failure-detection checks. Commands: npm test; qa:local; qa:serve; qa:verify; qa:prune. Unique ignored runs record timestamps, baseline HEAD, test file/counts, complete bounded TAP/log hashes, source before/after and build identities. Failed/capped/stale/incomplete results cannot pass; absent browser evidence remains UNRUN. Actual browser control/visual review is manual through approved isolated cua_repl, with automated receipt consistency checks; no standalone browser driver/new package/security policy. Fixture visibly binds run/build/source. Owned loopback previews use normal stdin/PTY stop; bounded prune defaults to dry-run and never touches historical docs/qa or media.

Executed final run 20261031T174545Z-942b4125: 45/45 tests, Astro check31 files zero errors/warnings/hints, nine-page build and all route/metadata/direct-play/sitemap checks PASS. Initial verification exited2 UNRUN; six actual browser cases later passed and final verification exited0 PASS. DOM-verified native1366x768/360x780/780x360, ID/EN, keyboard/settings/history/reload, core one-session/RAF/pause/cleanup and injected context-loss retry. Three new screenshots210,244 bytes; zero captured native warn/error messages at uncapped limit200. Prior HTML-entity/template-identity failures fixed, regression-tested and preserved; stale old source receipt rejected FAIL. Source/build manifests recorded, no old screenshots reused. Closed own tabs15/16, reset viewport; PTY stop exited0 with both ports4321/4322 independently free. No original product source/routes/assets/dependencies/immutable PRD source or older feature receipts changed.

Limits: browser interaction/visual judgment is not an unattended driver or physical Android/touch/Safari/iOS/FPS/network/soak/gameplay/save/live-production pass. Those gates remain UNRUN. Raw >500kB lazy chunk warning and BASE-01/02 persist; prune apply not needed/performed. M0-01 exact external Cloudflare configuration still pending, no login attempted, no previous public403 retry. Next: M0-08 performance baseline/screen matrix/artifact budgets. V1 verified6/51 (11.76%); M7 deferred; no Actions/push/deploy.

### M0-08 completion record - 2026-10-31 UTC

Status: COMPLETE as measured foundation baseline/screen matrix/artifact hygiene, 2026-10-31 UTC. Implementation/evidence commit: 5c7ad90ce11e3df2e9bb33dea8d9c5ea5e503ed9 (local only). [Measured report](M0-08_PERFORMANCE_BASELINE.md), [repeatable recipe/budgets](PERFORMANCE_BASELINE.md), [raw probes/module/payload/cleanup/retention evidence](qa/m0-08/).

Actual client Rollup module attribution and hash-matched payload reporting, passive renderer resource counters, bounded 300-sample callback/CPU collector, true 250ms QA readout limit and optional explicitly uncertain legacy heap observations. Initial eager-readout instrumentation was corrected and final-source checks/probes rerun. Public assets now participate in QA source freshness. No engine/material/visual refactor or dependency changes; >500kB lazy warning remains visible because required Three modules dominate98.16% of retained pre-minification module code. Known critical preview-open set575,583 raw /147,861 gzip-level9-estimate bytes; lazy renderer539,959 raw; external fonts/incidental icons/analytics excluded from critical-set estimate and not a full-game/network certification.

Final run20261031T183101Z-7b5049b7: 50/50 unit/integration tests, Astro check35 files zero errors/warnings/hints, nine-page build and route/metadata/sitemap regression PASS, six required actual browser cases plus1920-wide view and final qa:verify PASS/exit0. Four visible five-second probes at1366x768/1920x1080/360x780/780x360: about60 RAF callbacks/s, synchronous JS-submit p95 0.8-1.3ms,20-21 readouts across300-301 callbacks. This is an instrumented small entry-panel canvas, NOT presented FPS/GPU timing or physical mobile performance. Active3 geometries/1 reported texture/1 program/5 owned materials/5 draws/352 triangles; all live counters/canvas/RAF/subscribers zero after each of8 Open/Close cycles, cleanup errors0. Legacy post-close JS heap11,783,628-15,075,120 bytes fluctuated; not retained-memory/GC/leak-free or15-minute soak proof. Four fresh actual native screenshots299,249 bytes; ID/EN, keyboard/settings/history/reload and injected context-loss retry passed.

Hygiene: four old generated runs fully archived in two bounded ZIPs (41 files/393,822 compressed bytes), CRC/every-entry hashes verified before exact path/owner-checked dry-run/apply prune. Active cache now newest3 runs; original source/public media/macaw study/PRD transcriptions/historical docs receipts/Git rollback preserved. Measured directories roughly234MB logical including216.7MB dependencies; no filesystem-allocation/future-game-size claim. Owned tabs19/20 closed, viewport reset; PTY stop exited0 and ports4321/4322 independently free.

Remaining limits: physical Android/touch/Safari/iOS, actual presented FPS, real network/startup, populated gameplay/save and soak remain UNRUN future gates. BASE-01/02 and M0-01 exact external Cloudflare config gap persist; no login/new permissions/Actions/push/deploy or public403 retry. M0-01 stays unchecked; the complete M0 milestone is not claimed closed. Next: M1-01 small tropical diorama. Verified V1 progress7/51 (13.73%); M7 deferred.

### M1-01 completion record - 2026-10-31 UTC

Status: COMPLETE for the M1-01 read-only Tropical Creek diorama, 2026-10-31 UTC. Implementation/evidence commit: aae1e065fabae62c61f08c47efd5ea2ed358f9d1 (local only). [Report](M1-01_TROPICAL_DIORAMA.md), [original asset provenance](ASSET_MANIFEST.json), [raw evidence and four screenshots](qa/m1-01/).

Original low-poly land/soil, creek/banks, six palms/four broadleaf trees, rocks/reeds, terracotta entrance and contact shade; fixed orthographic camera fits actual bounds. Initial typed world supplies120 cells/eight creek cells/gate; state unmodified. Six vertex-color batches,4,128 triangles, no external art/download/dependency. Single RAF/core tick retained; water reads fixed simulation time and respects reduced motion. Bilingual preview copy is truthful; controls/building/animals/visitors/gameplay/save remain later features.

Final run20261031T190354Z-32c89857:53/53 unit/integration tests; check38 files0 diagnostics; build9 pages and all9 route/metadata/sitemap regression PASS. Actual built canvas pixels inspected at1366x768/1920x1080/360x780/780x360; four JPEGs335,055 bytes. ID/EN, keyboard Open, Settings, history/reload and injected context/render-failure retry passed. Pause holds tick/visual time, resume advances, max1 session/RAF/subscriber; eight close/remount snapshots return canvas/live GPU counters/owned materials/RAF/subscribers0, cleanupErrors0. Final qa:verify PASS/exit0; owned tabs25/26 closed, viewport reset, graceful serverstop0 and ports4321/4322 free.

Same-basis preview-open579,339 raw/149,821 gzip9-estimate bytes (+3,756/+1,960 versus M0-08), lazy chunk543,537 raw; >500kB warning visible. Active6 geometries/6 materials/4 programs/1 engine texture/6 draws/4,128 triangles. Four five-second probes≈60 RAF callbacks/s and synchronous CPU-submit p95 0.8/1.1/0.9/0.9ms with20 readouts each; actual presented FPS/GPU time UNMEASURED, no physical Android/performance/network/soak claim. Optional post-close heap13,182,293–15,854,500 bytes fluctuates, no retained-memory proof.27 old cache files archived/CRC+every SHA verified (270,084-byte ZIP) before scoped prune; newest3 generated runs retained, prior source/media/evidence/rollback intact. Folder-specific -text preserves hashed QA bytes on future checkout; five newly authored metadata/transcript files normalized to LF after CRLF whitespace finding, no hashed stage/receipt bytes modified.

Known limits: scenery is decorative, later placement must reconcile its bounds; no M1-02 controls/M1-05 habitat or M2 animal claim. BASE-01/02 and M0-01 exact Cloudflare configuration gap remain. No login/new grants/Actions/push/deploy/public403 retry. Next: M1-02 clamped mouse/touch pan and zoom. Verified V1:8/51 (15.69%); M7 deferred.

### M1-02 completion record - 2026-10-31 UTC

Status: COMPLETE for bounded mouse/touch/keyboard camera,2026-10-31 UTC. Implementation/evidence commit: 9bc663d346364785ff4b0532de44da50810e337d (local only). [Report](M1-02_CAMERA_CONTROLS.md), [raw QA/native/injected/visual evidence](qa/m1-02/), [repeatable recipe](LOCAL_QA.md).

Isometric ground-plane pan, cursor-anchored wheel zoom, one-finger drag/two-finger pinch,1x–3x bounds,6px tap-versus-drag separation and optional future picking seam. Overview fits/locks pan; explicit zoom-first help, ID/EN44px zoom/reset controls, percentage, keyboard arrows/+/-/Home/Escape. Only canvas consumes gestures/wheel; toolbar/browser shortcuts remain separate. Pause/blur/cancel/lost capture/resize/remount/unmount/dispose release pointers/listeners without another RAF. No picking/placement/gameplay/save implementation claimed.

Final run20261031T193245Z-6247a181:59/59 tests (including2,000 adversarial sequences and center-ray bounds), check43 files0 diagnostics,9-page build and all9 URL/metadata/sitemap regression PASS. Native approved-runtime wheel/drag/ArrowRight/Home/toolbar isolation and outside-page scroll passed.27 explicitly injected DOM integration cases over desktop/portrait/landscape PASS; orientation transitions release held pointer1→0. Actual built pixels reviewed at1366x768/1920x1080/360x780/780x360 plus two zoom details; six JPEGs554,480 bytes. No physical touch/Android claim. Core pause/visual time, context/render-error retries, held-gesture remount/unmount/stale handle passed; eight cleanup snapshots return all canvas/liveGPU/material/RAF/subscriber/pointer counts0 and controlsDisposed true, max1 session/RAF. Final qa:verify PASS/exit0; owned tabs closed, viewport reset, graceful serverstop0,4321/4322 free.

Known preview-open588,643 raw/152,958 gzip9-estimate bytes (+9,304/+3,137 vs M1-01); lazy chunk549,518 raw and>500kB warning visible. No new dependency/art; six draw calls/4,128 triangles and6 geometries/6 materials/4 programs/1 engine texture unchanged. Four idle five-second probes≈60 RAF callbacks/s, CPU-submit p95 0.3/0.4/0.4/0.5ms,20 readouts each; not actual presented FPS/GPU/gesture-latency or physical mobile evidence. Legacy post-close heap13,886,150–16,348,272 bytes fluctuated; no leak-free/soak/retained-memory proof.27 old cache files archived in270,293-byte ZIP with CRC/allSHA checked before scoped prune; newest3 retained, prior source/media/evidence/rollback intact. Initial hint clarification caused a fresh final-source run; no preliminary UNRUN/stale readout promoted to pass.

Known limits: true hardware touch/pinch, physical Android/Safari/iOS, FPS/network/soak and later gameplay remain UNRUN. BASE-01/02 and M0-01 external Cloudflare gap persist. No login/newgrants/Actions/push/deploy/public403 retry. Next: M1-03 scene picking and identity panel. Verified V1:9/51 (17.65%); all12 M7 deferred.

### M1-03 completion record - 2026-10-31 UTC

Status: COMPLETE for actual tile/scenery picking and identity panel,2026-10-31 UTC. Implementation/evidence commit: 161bb94690b9542ed222d75372bb8a94a7f65c72 (local only). [Report](M1-03_SELECTION.md), [raw native/injected/lifecycle/visual evidence](qa/m1-03/), [recipe](LOCAL_QA.md), [source provenance](ASSET_MANIFEST.json).

Visible-triangle ownership for120 tiles/22 objects in four pickable batches; closest visible geometry, no box-proxy fallthrough. Reusable bounds/ground marker and bilingual name/location/description panel,1-based coordinates, clear via empty canvas/Dismiss/Escape, keyboard center Enter/Space. Tap grammar rejects drag/pinch/cancel; panel input scoped outside canvas. Same identity persists through camera/locale/resize. Closing/retry clears data and hidden identity fields. No placement/habitat/economy/gameplay/save mutation or second RAF.

Final run20261031T201259Z-849f5aef:67/67 unit/integration tests, check48 files0 diagnostics,9-page build and nine route/SEO baselines PASS. Native grass/tree clicks, wheel/drag/Home preservation, panel isolation, Enter/Escape/Dismiss/reopen and Back/reload passed; corrected canvas click scroll226→226.36 injected selection cases +27 camera regressions PASS over desktop/portrait/landscape; orientation releases held pointer1→0 while keeping gate1. Six actual selected-object/tile screenshots620,933 bytes at1366x768/1920x1080/360x780/780x360. Injected events/viewport emulation are not physical touch. Context/render-error retries have no old identity/marker/title; eight cleanup snapshots all live GPU/material/canvas/RAF/subscriber/pointer counts0, picker/controls disposed, max1 session/RAF. qa:verify PASS/exit0; owned tabs32–34 closed, viewport reset, graceful serverstop0 and4321/4322 free.

Known preview-open602,780 raw/156,991 gzip9-estimate bytes (+14,137/+4,033 vs M1-02), lazy renderer558,474 raw; >500kB warning visible. Original world6 draws/4,128tri; selected cue9 draws/4,132tri, bounded2 geometry/2 material additions, warmed8 geometries/8 owned materials/7 programs, no external assets/dependency. Five five-second small-canvas probes≈60 callbacks/s: selected p95 CPU-submit1.1/1.3/1.0/1.2ms, warmed unselected desktop0.7ms; not presentation FPS/GPU/latency/physical Android/soak. Legacy heap14,778,614–27,403,234 bytes fluctuated under heavier QA; no retained/leak-free inference. Five old runs fully archived/CRC+everySHA verified in three ZIPs (55 files/807,703 bytes) before scoped prune; newest3 retained. Initial keyboard typo, material typing and native scroll-anchor issue corrected and retested; truthful failed/UNRUN receipts preserved, not relabelled.

Known limits: physical Android/touch/pinch/Safari/iOS, actual FPS/network/soak, whole-game localization and later gameplay remain UNRUN. BASE-01/02 and M0-01 exact external Cloudflare gap persist. No login/newgrants/Actions/push/deploy/public403 retry. Next: M1-04 valid/invalid build-mode preview with Confirm/Cancel, not started. Verified V1:10/51 (19.61%); all12 M7 deferred.


### M1-04 completion record - 2026-10-31 UTC

Status: COMPLETE for validated footprint preview and session-local plan confirmation only. Implementation/evidence commit: c29a84cffba44131374039d81860fd852f56b43c (local only). [Report](M1-04_PLACEMENT_PREVIEW.md); [raw tests/browser/screenshots/probes/failure receipts](qa/m1-04/). Ghost snaps2x2 to actual grid, green/red plus ID/EN reasons; Confirm revalidates current world/revision exactly once and keeps at most one blue plan, Cancel preserves authoritative world/save/currency and any prior plan. No real habitat/fence/occupancy/cost/save mutation is claimed; reusable pure rules/proposal contract feeds M1-05. Mouse/keyboard, tile arrows, overlay/pause/gesture guards, resize/retry/remount cleanup verified; one RAF/core remains.

Final run20261031T205244Z-6b549c69:76/76 tests, Astro check51 files zero diagnostics, build9 pages, nine-route metadata/sitemap/direct-play regression, and qa:verify PASS at2026-10-31T20:59:57.512Z. Actual built desktop/portrait/landscape/wide ID/EN reviewed;6 screenshots723,883 bytes. Labelled fixture36 placement+27 camera+36 selection cases PASS; native mouse drag preserved anchor while camera moved, native keyboard confirmed/Escape cancelled. Held injected pointer1→0 after orientation without proposal revision change; pause144→144 then resume323. Context/render fault retry, remount/stale handle/unmount and6 cleanup snapshots zero all live ownership; max1 session/RAF. Owned tabs35-38 closed, viewport reset, servers4321/4322 stopped/free.

Known preview615,988 raw/160,798 gzip9-estimate bytes (+13,208/+3,807 vsM1-03), lazy564,027 raw; >500kB warning retained. Ghost+plan12 draws/4,136tri vs world6/4,128; bounded2 geometries/3 materials added, observed8 GPUgeometries/11 ownedmaterials/6 programs/1 enginetexture. Three five-second probes ~60 callbackHz, p95 synchronous CPU-submit0.8/0.7/0.7ms,20 readouts each; not presentationFPS/GPU/physicalAndroid/network/soak. Two old runs17files/24,413compressedbytes archived and CRC/everySHA verified before scoped prune; newest3 retained. Preliminary optional-argument test mismatch and actual browser selector collision fixed/rebuilt/retested; failed screenshot and preliminary local receipts retained. Native product warn/error0; one Three cleanup warning after deliberate context loss preserved separately in injected-console.json, not suppressed.

Limits: actual habitat/fence/occupancy, paths/economy/animals/missions/save, full localization, physicalAndroid/touch/Safari/iOS/FPS/network/soak and live production remain later UNRUN gates. BASE-01/02 and M0-01 exact external Cloudflare gap persist. No login/newgrant/Actions/push/deploy/public403 retry. Next:M1-05. Verified V1:11/51(21.57%); all12M7 deferred.


### M1-05 completion record - 2026-10-31 UTC

Status: COMPLETE as actual enclosed habitat construction and authoritative occupancy. Implementation/evidence commit: 8f4405af5a63708c90906d031e6bb2800b97b538 (local only). [Report](M1-05_HABITAT_CONSTRUCTION.md); [raw tests/browser/screenshots/probes/geometry/retention evidence](qa/m1-05/). Confirm now commits one2x2 habitat and4 occupant cells atomically through simulation, with durable-in-schema operation identity/exactly-once duplicate handling and full validation. Actual original floor/wooden perimeter/closed door/wire walls/roof appears and is selectable ID/EN. Invalid/cancelled/stale/paused/repeated input cannot mutate construction; overlap, bounds, creek, path/scenery and starter-limit rejected. No currency/ledger/mission/bird changes, fake cost, visitor route or animal placement. Save-codec roundtrip preserves occupancy; this is not player autosave/Continue.

In-memory cloned page-session state retains habitat/occupancy/time across close/reopen, renderer faults, same-root remount/unmount and unsupported-WebGL recovery. Document reload/navigation durability remains M5; UI warns full reload resets. Existing single RAF/core retained and restored-event counts account for the initial tick. M1-04 injected warning traced to redundant forceContextLoss on already-lost context; tested live-context guard fixes it without skipping normal resource cleanup. Full current native+injected warn/error captures0, uncapped limit200; old warning receipt preserved.

Final run20261031T211432Z-7ce3b19f:88/88 tests, Astro check57 files zero diagnostics, build9 pages, all9 route/title/H1/canonical/sitemap/direct-play checks and qa:verify PASS at2026-10-31T21:23:29.193Z. Actual desktop/portrait/landscape/wide ID/EN reviewed,6 screenshots788,358 bytes; native keyboard Build, mouse selection, invalid overlap, Escape, camera drag/wheel and identical UUID after close/reopen. Labelled fixture42 construction+27 camera+36 selection=105 injected cases PASS; actual render frames awaited, physical touch not claimed. Nine cleanup snapshots zero live canvas/session/RAF/GPU/material/program/texture/subscribers, habitat-renderer disposed while serializable habitat data retained; max1 session/RAF. Owned tabs39/40 closed, viewport reset, servers4321/4322 stopped/free.

Actual generated geometry checked at all120 starter anchors:21 legal sites, each contained within its four occupied cells. Original habitat2 geometries/2 materials/2 draws/264tri plus74 wire segments; world+habitat8 draws/4,392tri. Fully warmed pool12 GPUgeometries/13 ownedmaterials/8 programs/1 enginetexture; zero after release. Three five-second desktop/portrait/landscape probes ~60 callbackHz, p95 synchronous CPU-submit0.7/0.9/0.7ms; not presentationFPS/GPU/physicalAndroid/network/soak. Known preview622,525 raw/162,965 gzip9-estimate bytes (+6,537/+2,167 vsM1-04); lazy568,889 raw, >500kB warning retained. One old generated run18 files/533,577 compressed bytes archived and CRC/everySHA verified before scoped prune; newest3 retained, all historical source/media/PRD/receipts/rollback preserved.

Limits: paths/connectivity/viewingCell (still null), animal behavior/care, economy/missions, player save/reset, full localization, physicalAndroid/touch/Safari/iOS/FPS/network/soak and production remain later UNRUN gates. BASE-01/02 and M0-01 exact external Cloudflare gap persist. No login/newgrant/Actions/push/deploy/public403 retry. Next:M1-06 paths/connectivity. Verified V1:12/51(23.53%); all12M7 deferred.


### M1-06 completion record - 2026-10-31 UTC

Status: COMPLETE for actual visitor path construction and entrance-to-habitat connectivity. Implementation/evidence commit: 296fa207c4cd186ac09b2d1bbe3c1e3c3b5f5047 (local only). [Report](M1-06_PATHS_CONNECTIVITY.md); [raw final/failure evidence](qa/m1-06/). One-cell path ghost uses existing touch/mouse/keyboard controls, explicit confirmation, repeat cursor and Finish/Escape that cancels only unbuilt preview. Atomic real path flags reject bounds/creek/scenery/habitat/existing cells; direct repeated cell targets are idempotent with no duplicate event. Four-neighbor BFS from actual gate determines shortest deterministic exterior viewing cell and route, never proximity/diagonal access; cache recomputed on load and path/habitat changes. Connected/disconnected pavers plus ID/EN text/icons, viewing marker and selected path/habitat details work. No visitor, coin/ledger/mission/bird mutation or deletion/refund/autosave claim.

Final run20261031T215525Z-4a69dd88:100/100 tests, Astro check62 files zero diagnostics, build9 pages and all9 route/title/H1/canonical/sitemap/direct-play checks. qa:verify PASS at2026-10-31T22:02:09.591Z. Unit tests cover gaps/diagonals/branches/cycles/shortest routes, duplicate after codec reload, stale viewing cache, no fake income, pause/reset/disposal, reusable geometry/selection refresh and all21 legal habitat positions with gap then bridge. Actual native keyboard/mouse built disconnected then connected7-cell route; path selection, ID/EN, camera, close/reopen and journal/history/reload verified atdesktop/portrait/landscape/wide. Six fresh screenshots831,041 bytes. Final fixture42 path+42 habitat+27 camera+36 selection=147 cases with explicit protected PASS fields, not physical touch. Nine cleanup snapshots zero live renderer/core/resource ownership; serializable7 paths/1 connected habitat retained through context/render/unsupported recovery/remount/unmount. Max1 session/RAF, warn/error capture0 uncapped. Owned tabs41–44 closed, viewport reset, servers4321/4322 stopped/free.

One shared path geometry/material/draw,48tri per tile plus24tri viewing marker; tested world9 draws/4,704tri, warmed13 GPUgeometries/14 ownedmaterials/8 programs/1 enginetexture, zero on release. Final desktop/portrait/landscape probes ~60 callbackHz, p95 synchronous CPU-submit0.8/0.8/0.7ms; not presentedFPS/GPU/physicalAndroid/network/soak. Known preview632,338 raw/165,796 gzip9-estimate bytes (+9,813/+2,831 vsM1-05), lazy574,714 raw; >500kB warning retained. Three older generated runs46 files/1,291,640 compressed bytes archived in2ZIPs and CRC/everySHA verified before scoped prune; newest3 retained. Prior source/media/PRD/history preserved.

Honest failure history: first strict check failed one unused-import hint, corrected and rerun. A later integrity audit rejected per-path case records because UI status text overwrote PASS; original matrix/receipts retained in preliminary-recorder without rewriting. Verdict-owning recorder plus regression test fixed this; all final-source local and browser checks, captures and147 per-case verdicts rerun. Final independent integrity audit PASS. This is not a compile-only/old-screenshot promotion.

Remaining: M1-07 editing/delete/refund/input guards; visitors/economy/missions/animals/player autosave/full localization, physicalAndroid/touch/Safari/iOS/FPS/network/soak/live production remain future UNRUN gates. BASE-01/02 and M0-01 exact external Cloudflare gap persist. No login/newgrant/Actions/push/deploy/public403 retry. Next:M1-07. Verified V1:13/51(25.49%); all12M7 deferred.


### M1-07 completion record - 2026-10-31 UTC

Status: COMPLETE for safe object editing/removal and bounded refund/restore contract. Implementation/evidence commit: 774f5ba639936039db73d8101a95dcec47f754bb (local only). [Report](M1-07_EDITING_REFUNDS.md); [raw final/failure evidence](qa/m1-07/). Selected constructed paths/habitat have bilingual destructive confirmation with object identity, consequence, exact refund and default safe Cancel focus; modal pauses the existing renderer/core. Cancel/Escape/failure do not change authoritative data. Revision-checked Confirm updates world occupancy, path topology/viewing routes, catalog/selection/ghosts atomically. Repeated/stale inputs cannot edit a later replacement. Gate/scenery protected; future in-use animals/facilities/visitor routes block deletion. One-step Undo restores original placement/access, survives renderer reopen/retry/remount in the same page, and is invalidated by later successful world edits/builds. Correct mistakes by remove then rebuild; no direct Move tool or durable save claim.

PRD specifies no refund percentage. Actual construction is still free, so actual refunds are0 ZC and currency/ledger do not change. Finite paid test fixtures prove authoritative purchase-capped refunds, original debit references, exactly-once guards and explicit negative restore debits on Undo; free rebuilding cannot resell a refunded purchase, repeated cycles cannot mint coins, insufficient balance/history failure is atomic. Actual pricing/balancing and full economy remain M3. No unlimited money or fake visitor income.

Final run20261031T222314Z-832c83cc:115/115 unit/integration tests, Astro check66 files zero diagnostics,9-page build and9 route/title/H1/canonical/sitemap/direct-play checks. qa:verify PASS at2026-10-31T22:29:19.131Z, source4d749de3e6926f5250adb238caad2fd1a030bb178d80528e1df549dc5ff8ca7f, build2196cafffb45a6b50f233cdb7491c28120f4790b3633ed99c9a0f734155a3bc0. Actual native mouse/keyboard/Return/Tab/Escape and preview/journal/history/reload checks pass. Approved IAB actual pixels inspected at1366x768,360x780,780x360. Six screenshots807,992 bytes. Injected fixture192 per-case PASS:45 edit+42 path+42 habitat+36 selection+27 camera. Nine native product scenarios, ten lifecycle/interrupt observations, six zero-live-resource cleanup snapshots. Max1 session/RAF/subscriber, warn/error0 uncapped. Native WEBGL_lose_context extension invoked from labelled fault injection; physical Android/touch is not claimed. Tabs45-48 closed, viewport reset, both owned loopback previews stopped/free.

Fixed reusable2-geometry/2-material habitat slot prevents growing catalog/material arrays. Populated peak remains13 GPU geometries/14 owned materials/8 programs/1 engine texture, connected unselected world9 draws/4,704tri. Empty owns14 materials rather than12 upfront; GPU geometry uploads still lazy. Known preview644,183 raw/169,083 gzip9-estimate bytes (+11,845/+3,287 fromM1-06), shell63,973 raw/lazy580,210 raw, >500kB warning recorded. Three5-second callback probes ~60Hz, p95 synchronous CPU-submit0.7/0.7/0.9ms; presentedFPS/GPU/network/soak remain unmeasured. Four older owned runs44 files/1,426,065 compressed bytes archived in2ZIPs; CRC/all SHA verified before scoped prune; latest3 retained. Original source/media/history/evidence preserved, current art-source revisions recorded.

Honest failures retained: strict unused-import hint; missing canUndo inspector observation despite correct edit; incorrect fixture cursor origin causing water placement. Each was corrected and full final-source QA rerun. Independent integrity audit verifies all verdicts/log hashes/screenshots/cleanup/archive entries and protected journal/assets/dependency/source-PRD diffs. Raw terminal preview logs retain exact bytes under scoped non-diff attributes; source whitespace checks pass. No test passed only from compilation or stale captures.

M1 build/edit milestone now complete; full game loop remains pending. Next:M2-01 recognizable final-quality Ara ararauna model plus minimum animation states, not promotion of the earlier M0-03 study. M0-01 exact external configuration remains partial; BASE-01/02, full localization/UX, animals/care/visitors/pricing/missions/player autosave, physicalAndroid/Safari/iOS/FPS/network/soak/production gates remain future work. No Actions/push/deploy/login/newgrant/public403 retry. Verified V1:14/51(27.45%); all12M7 deferred.


### M2-01 completion record - 2026-10-31 UTC

Status: COMPLETE for final V1 original macaw model and minimum visual animation states. Implementation/evidence commit: 8f91a980759d337d186de9d1dec095fd0eb60aeb (local only). [Report](M2-01_MACAW_MODEL.md); [asset/rig contract](../art/macaw-v1/README.md); [measured sources/parts](../art/macaw-v1/model-stats.json); [raw final/preliminary evidence](qa/m2-01/). New code-native Ara ararauna geometry, articulated head/jaw/shoulder/forewing/tail/feet/eyelids; not the M0-03 study renamed. Closed hooked bill, pale marked cheeks, green forehead, gold breast/underwing, blue wings, long tail and opposed toe pairs. Perch/idle, walk, hop, short-flight, eat, drink and rest poses have deterministic sampling and280ms interruption-safe transitions. Eleven shared geometries/one palette material/zero textures,3,180 max triangles per bird/6,360 for two,343,440 generated attribute bytes once. Two independently posed shared rigs tested in CPU; two actual placed/autonomous birds remain M2-02.

Actual /play model preview has bilingual seven clips/four angles/pause/close-up/real habitat-scale controls, supported perch/care-display bowl and ground contact cue. It explicitly says no birds placed/no needs/care simulation. Core pauses while the existing single RAF drives presentation; no duplicate loop. Visual/global pause, reduced-motion default, resize, pointer isolation, stale handles and lifecycle cleanup tested. World placement/build/edit/Undo survives inspection without mutation; full reload still resets preview. Canvas is revealed on model/view/clip changes and keyboard/help text adapts to active mode. Existing journal and Play/Continue availability remain preserved.

Final run20261031T231330Z-a10576fe:128/128 tests, Astro check73 files zero errors/warnings/hints,9 built pages/all9 route metadata/sitemap/direct-play checks. qa:verify PASS at2026-10-31T23:31:20.147Z. Sourcee43bcbf0b127064f4a13be07b96bb096dc06f5b91aee0b6f05b0aee0b3b1d392; build051f97e1903db8d1774d40dd1956c6295cf041933c9d547216483a84c371f57d. Approved IAB actual WebGL at1366x768/360x780/780x360:243 per-case PASS (51 model+45 edit+42 path+42 habitat+36 selection+27 camera),16 native product scenarios, ten lifecycle observations/eight full zero-resource cleanups. Seven motions/foot and bowl contact/angles/viewport/normal care zoom inspected as actual pixels;8 new screenshots584,749 bytes. Fine markings use close-up; whole-map overview bird is small. Touch injection and CSS viewport sizes are not physical Android evidence. Max1 session/RAF, warn/error0 uncapped, tabs49-54 closed/viewport reset/owned ports4321/4322 stopped and free.

Tested peak32 uploaded geometries/15 owned materials/8 programs/1 engine texture/23 habitat-scale draws; model itself0 textures. Close returns to warmed13-geometry/14-material world and full disposal0. Three scoped5s model-detail probes ~60 callbackHz with p95 synchronous JS/core/render-submit1.6/1.6/1.5ms and20 readouts each; presentedFPS/GPU/physical-device/network/soak not measured. Known preview671,529 raw/177,593 gzip9 estimate bytes (+27,346/+8,510 fromM1-07), shell72,927/lazy598,602 raw; >500kB warning retained. No new dependency or speculative optimizer. Four older owned runs48 files/747,766 compressed bytes archived in2ZIPs, CRC/every SHA checked before scoped prune; newest3 caches retained. Original study/media/source transcripts/history preserved and new original-asset provenance recorded.

Honest refinement/history: initial actual pixels justified continuous wing joints/shorter exposed legs/grounded display props. Legacy probe wrongly required unpaused simulation and remained insufficient; tested renderer-RAF eligibility plus explicit model scope fixed this. Native open initially hid the model's upper body outside viewport; reveal/help fix and full final-source revalidation followed.0.32 CSS-pixel scroll rounding is within the documented1px tolerance. Incorrect screenshot page-origin crops and a stale REPL receipt-helper assembly were preserved/rejected, then corrected from fresh actual captures and exact source/build/run/entry-script-matched retained observations. Independent audit verifies all per-case verdicts, current provenance/log/image/archive hashes and preserved protected sources. No insufficient/stale/compile-only result promoted to PASS.

Next:M2-02 actual two bird instances and authoritative idle/wander/perch within habitat. Needs/care/resources/visitors/economy/missions/player saves/full UX/localization/release remain later gates. Physical Android/touch/Safari/iOS/FPS/network/soak/live production UNRUN. M0-01 exact external Cloudflare settings remains partial, BASE-01/02 persist. No push/deploy/Actions/login/newgrant/purchase/license acceptance/upload/public403 retry. Verified V1:15/51(29.41%); all12M7 deferred.


### M2-02 completion record - 2026-11-01 UTC

Status: COMPLETE for two actual autonomous macaws in the built aviary. Implementation/evidence commit: cb0c9304720529cf763ac867e37ae730e4c14cf3 (local only). [Report](M2-02_AUTONOMOUS_MACAWS.md); [raw final/superseded evidence](qa/m2-02/). Explicit bilingual welcome/reserve controls place exactly two stable IDs. Seeded finite idle/wander/ascent/perch/descent cycles update position/target/heading/elevation only through the existing100ms fixed simulation tick. The renderer interpolates state and original M2-01 articulated poses with one RAF. Interior lanes, rise-before-approach/leave-before-descent and supported branches prevent collision/escape; actual vertices/contact tested. Occupied habitat removal is refused; reserve clears references/rendered assets and permits editing, while stale quotes/Undo cannot orphan birds. Memento preserves both animals across close/retry/remount; full reload still resets the preview. Model studio pauses/hides the pair while displaying its one labelled demonstration, then restores them.

Final run20261101T000714Z-8570f664; qa:verify PASS at2026-11-01T00:17:55.031Z.140/140 tests; Astro77 files zero diagnostics;9 built pages/all9 route/metadata/sitemap checks. Approved IAB1366x768/360x780/780x360 actual WebGL:267 per-case PASS(24 animal+51 model+45 edit+42 path+42 placement+36 selection+27 camera),9 native product scenarios,13 lifecycle observations/12 full zero-resource cleanup snapshots,6 actual JPEGs515588bytes, empty uncapped warning/error console. Real-tick autonomy, injected gesture isolation, native mouse drag/keyboard Escape, occupied-removal protection, reserve/rewelcome, ID persistence, journal/back/reload, context/render failure, unsupported recovery, late import, orientation/stale handles and unmount/remount verified.21 legal habitat anchors,4000-tick multi-cycle state test and midair/mid-walk codec continuation covered. Physical Android/touch/presentedFPS/soak/live not claimed.

Two rigs share unchanged11-geometry/one-material/zero-texture original bird assets:6360 maximum bird triangles, plus192 landing-branch triangles from one shared geometry/material. Retained two-bird world profiles:25 GPU geometries/16 owned materials/35-36 draws/10720-10952 triangles. Maximum per-case resource observations are sampled snapshots, not continuous global peaks; intermediate simultaneous studio/bird allocation not separately profiled. Full cleanup returns tracked GPU/owned resources/RAF/subscribers/pointers to0. Three5s probes59.99-60.00callbackHz and synchronous JS/core/submit p95~1.3/1.6/1.6ms; actual presentedFPS/GPU time unmeasured. Built first-preview684407raw/181697gzip9-estimated bytes(+12878/+4104 vsM2-01),shell76997/lazy607410raw; existing500KB chunk warning retained. External fonts/network/cold start/full-game20MB gate not measured.

Source dd5a5295e4bffa3b9f15891b48e3dc5362f529488dc7406e31031ad666421ed7; build9c698526a85f6a3ba1c7d8b9d86eff174906953506df2e9f0d93f4d437d8beff. Provenance/source/log/image/archive hashes independently audited. Historical journal/layouts/assets/dependencies/world/economy rules/model/study/source transcriptions unchanged. Four old owned generated runs50files/561762compressed bytes archived with CRC/everySHA verification before scoped prune; newest3 caches retained. Invalid test ID, observer ordering, locator deadline and superseded no-birds copy findings retained; full final-source checks repeated after actual copy correction. No stale/RUNNING/compile-only evidence promoted.

Next:M2-03 feeder placement/fill/consumption/seek-food. Basic built-in landing branches do not complete M2-05 rest/energy/enrichment. Current safe locomotion requires the resource-free starter aviary; M2-03 must add reachable facilities and extend that guard. Care/needs/welfare, visitors, economy, missions, durable player saves and release remain later. M0-01 exact external Cloudflare settings remains partial; BASE-01/02 persist. No push/deploy/Actions/login/newgrant/purchase/license agreement/upload/public403 retry. Verified V1:16/51(31.37%); all12M7 deferred.


### M2-03 completion record - 2026-11-01 UTC

Status: COMPLETE for the player-to-bird feeding loop. Implementation/evidence commit: db73fcaacabcbbe7b9f9d16b4faa44282e9e37ad (local only). [Report](M2-03_FEEDING.md); [final/superseded evidence](qa/m2-03/). One safe front-edge two-bowl feeder has a real3D placement ghost, explicit Confirm/Cancel/Escape, occupied-clearance feedback, empty construction/refill and paused destructive confirmation. Each stable-ID macaw seeks its own reachable bowl, actually consumes a portion after20 fixed ticks, plays the original eating pose and reduces hunger. Bowl/total/visible fruit counts are conserved; empty or unreachable food cannot improve needs. Stale refill/replacement revisions and repeated inputs cannot mint food. Missing/deleted food clears targets safely; backwards withdrawal and all21 legal habitat placement/contact/long-tail tests pass. Raised supported bowls and nearby fruit were refined from actual pixels and jaw-geometry measurement(min0.010951483 game units, sphere radius0.021). No altered floor contact or decorative-only care.

Starting configurable game balance:8 portions(4/bowl),45% hunger, +0.12 points per100ms placed tick, seek threshold35%,2s/portion with30-point relief, bounded0-100. Independent per-bowl availability prevents eating an empty bowl while the partner still has food. `Resource.revision` and food `portions` plus animal `foodEaten`/local `animal-fed` facts are typed and serialized; schema validation, deterministic partitions and mid-eat codec reload pass. Prices remain explicitly free in this development preview; ledger/coins/missions/water/energy/full welfare are unchanged. No backend/login/durable autosave claim. Page-session recovery preserves exact paused stock/bowls/hunger/meals across context retry; full reload resets preview until M5. Model inspection cancels feeder ghosts and freezes actual care without creating/consuming food.

Final run20261101T005430Z-b4f7e931:159/159 tests(19 feeding), Astro81 files zero diagnostics,9 built pages/all9 route/title/H1/canonical/sitemap checks. qa:verify PASS at2026-11-01T01:23:17.654Z. Approved IAB actual WebGL1366x768/360x780/780x360:297 per-case PASS(30 feeding+24 animal+51 model+45 edit+42 path+42 placement+36 selection+27 camera),11 native product scenarios,16 lifecycle observations/13 full zero-resource cleanup snapshots,7 actual JPEGs844555bytes and empty uncapped warning/error console. Native desktop observed48% before care→28% after two portions each with4/8 food; phone/landscape observed one portion each,about22% hunger and6/8 food. Inputs, pause/cancel, remove during actual eating without phantom portions, refill/rebuild/reopen, ID persistence, journal/back/reload, unsupported/render/context/late-import/stale-handle/orientation/model interruptions verified. All owned tabs closed, viewport reset,4321/4322 free.

Source fa2e9581078fe4020a2d718c6aa0b594bf20957d339fe5ddf6f734fec1308010; buildfc623488e7eb71084183de28cc88be6d09ffbab4399c04c273ae06f31bc3c130. Original station364triangles+8x56fruit=812max;2 shared geometries/2materials/0textures allocated lazily and disposed on cancel/removal/session release. Unchanged original macaw model6360max pair triangles+192roosts. Retained sampled maxima including model/bird/food:36 GPU geometries/19 owned materials/44 draws/11532 triangles, not a continuous profiler. All tracked GPU/owned assets/RAF/subscribers/pointers return0 on full cleanup. Three5s probes~60callbackHz,p95 synchronous JS/core/submit~2.2/2.2/1.9ms with25/27/28 diagnostic writes; presentedFPS/GPU/physical Android remain unmeasured. First-preview702766raw/187036gzip9-estimated(+18359/+5339 vsM2-02),shell86378raw; existing500KB lazy-chunk warning retained. External fonts/network/cold-start/full-game20MB/15min soak/live not claimed.

Original journal/layouts/public/media/dependencies/world/path/economy rules/model/study/source transcriptions and M2-02 receipts unchanged. New original-art provenance and every log/image/source/archive hash independently audited.35files in3old owned generated runs archived in2ZIPs507530compressed bytes, CRC/everySHA verified before scoped prune; newest3 caches retained. Strict unused hints, test coordinate correction and initial visual contact finding retained; final source fully revalidated. Clipped fixture capture was unavailable; actual native viewport JPEGs used, no image editing/unsupported browser driver. No stale/RUNNING/compile-only evidence promoted.

Next:M2-04 water source/fill/consumption/seek-water. Extend the current unsupported non-food facility fail-safe and define safe water availability/geometry; do not silently reserve birds when adding approved water. The feeder uses one fixed safe slot and two approach lanes, not a general facility editor. Rest/energy/enrichment/full welfare/economy/missions/auto-save/full UX/release remain later. Physical Android/touch/Safari/iOS/presentedFPS/network/soak/production UNRUN. M0-01 exact external Cloudflare/GitHub settings remains partial; BASE-01/02 persist. No push/deploy/Actions/login/new grants/purchase/license agreement/upload/unrelated Pelatuk changes. Verified V1:17/51(33.33%); all12M7 deferred.


### M2-04 completion record - 2026-11-01 UTC

Implementation/evidence commit: e0f60a801023de70307b14b9e881596c3ef572cf (local only). [Water report](M2-04_WATER.md), [source-bound browser/log/contact/provenance evidence](qa/m2-04/). Water placement preview/Confirm/Cancel/Escape, two empty blue side bowls, refill, per-bowl stock, actual autonomous seek/drink and thirst relief, ID/EN status/errors/counts and confirmed safe removal now work end to end. Food and water retain distinct resources/revisions/stocks/counters; competing needs serve the higher available need and finish active care safely. Deleted/empty/unreachable resources do not produce phantom drinks or remove birds. Two stable macaws back away and side-hop clear of real roosts before turning; water-compatible floor wandering stays inward. All21 legal aviary anchors and full/last-portion beak-water contact are tested. Energy/enrichment/full welfare/economy/missions/durable saves remain later; supplies are explicitly free in this development preview.

Final run20261101T015958Z-4137168a:174/174 tests(15 water), Astro85 files zero errors/warnings/hints,9 built pages/all9 route/title/H1/canonical/sitemap checks. qa:verify PASS at2026-11-01T02:20:10.748Z. Approved isolated IAB with DOM-verified1366x768/360x780/780x360:330 accepted per-case PASS(33 water),14 native observations,9 additional lifecycle observations and15 zero-resource cleanup snapshots. Six untouched actual JPEGs859994bytes; uncapped warning/error console empty. Native flows show actual drinks, lower thirst and conserved independent stock; source/build/receipt/log/image/asset/archive hashes independently audited. Water touch interruption is explicitly injected pointer input; physical Android/true touch is UNRUN. Wrong-size fixture evidence was rejected and rerun at verified portrait dimensions. Native capture pixel dimensions differ slightly from DOM viewport and are recorded without claiming1:1CSS pixels or image editing. Initial food-action visibility regression and tail/fence finding corrected and completely revalidated; superseded source receipts retained separately.

Source f6d855f733e91049df68b413f4f6812d893feeb2787f3c1b5301d6e4eea7da10; build8bcf812677c18cd2247e7c20fdd291388cff5af45a9351e0fa3cadb4f57e9101. Original water station352triangles+32surface=384max,2 shared geometries/2materials/0textures; unchanged original macaw model6360max pair+192roosts. Actual jaw/water surface distances0.000019113 full and0.000861309 last portion. Sampled ownership/render maxima45 GPU geometries/21materials/44draws/11812triangles include model inspection with cached world/care resources, not a continuous profiler. All tracked owned/GPU resources/RAF/subscribers/pointers return0 after full release. Three5s probes~60callbackHz; p95 synchronous JS/core/render-submit2.1/1.8/2.3ms. PresentedFPS/GPU timing/physical Android remain unmeasured. First-preview721946raw/190713gzip9-estimated(+19180/+3677 vsM2-03),shell95915raw; existing500KB lazy-chunk warning remains. No full-game20MB/network/cold-start/15min soak/live pass claimed.

Original journal/layouts/public/media/dependencies/world/path/economy rules/original model/study/immutable PRD sources and previous receipts unchanged. Original water provenance appended.14files in2old owned generated QA runs archived into34967compressed bytes; CRC/everySHA verified before scoped prune, newest3 runs retained. All owned QA/product tabs closed, viewport reset, both owned loopback previews stopped with4321/4322 free. No push/deploy/Actions/login/new grants/purchase/license acceptance/upload or unrelated Pelatuk changes.

Next:M2-05 rest/perch energy behavior and simple enrichment. Existing branches currently support locomotion/contact only; extend resource/access/energy rules before claiming functional rest or adding a perch resource. M0-01 exact external Cloudflare/GitHub configuration remains partial; BASE-01/02 persist. V1 verified18/51(35.29%); all12M7 deferred. Production remains NOT DEPLOYED.


### M2-05 completion record - 2026-11-01 UTC

Implementation and evidence commit: **dce81aa37b78d5da936958a556ffa92af752394f** (local only). [Report](M2-05_REST_ENRICHMENT.md) and [source-bound evidence](qa/m2-05/).

A real leafy two-perch kit now supports energy recovery during actual sleep and enrichment during actual foliage exploration. Two stable bird slots, needs priority, safe occupied removal, revision-checked placement/cancel, bilingual status and exact pause/retry/remount are verified. Ordinary branches and unused decorations grant no benefit. Full welfare remains M2-06; pricing, missions and durable save remain later.

Final run `20261101T030218Z-3b5ee56f`: **189/189 tests**, Astro check of **89 files** with zero diagnostics, all **9 built routes** and SEO checks, **363 accepted browser fixture cases** (33 rest), **12 native observations**, **12 additional lifecycle observations**, **20 zero-resource snapshots** and **8 actual JPEGs** (1,094,126 bytes). `qa:verify` and independent audit PASS at `2026-11-01T03:38:54.591Z`. Real desktop/portrait/landscape poses were observed, not injected; phone UI is ID. Physical Android/touch and presented FPS are untested. Invalid/failed preliminary attempts and receipt metadata correction remain transparent in the findings.

Original kit: 512 triangles, two geometries, one material, no textures. Original model/rig unchanged. Actual grip/branch contact, 1,100 mixed-care mesh ticks and all 21 legal anchors pass. First preview: 741,202 raw / 195,132 estimated gzip bytes; shell 105,646 bytes. Existing lazy-chunk warning remains. Callback measurements, resource sampling and device/network/soak limitations are recorded in the report.

Protected source/media/previous evidence remain intact; old owned caches were archived and verified before pruning. Owned tabs closed, viewport reset, owned preview ports free. No push/deploy/Actions/login/new grants. M0-01 stays partial; BASE-01/02 persist. **19/51 (37.25%)** verified; all 12 M7 items deferred. Next: **M2-06** welfare/info/alerts. Production **NOT DEPLOYED**.


### M2-06 completion record — 2026-11-01 UTC

Implementation/evidence commit: **23a6a7a04b588709a196cbf7e46430c5d48facda** (local only). [Welfare report](M2-06_WELFARE_INFO.md) and [source-bound evidence](qa/m2-06/).

Each stable macaw identity now has real hunger/thirst/energy/enrichment, authoritative welfare, four score components and concrete ID/EN care causes/actions. PRD weights are 35% food, 30% water, 20% actual habitat fit and 15% enrichment. Each bird needs its own reachable serving; missing access caps the affected score at 40%. Hysteresis avoids threshold flicker. Inline details do not cover the canvas; keyed focusable controls survive score ticks, use 44px targets and keyboard dismissal, and live announcements are throttled. Reserve/removal/retry/remount cannot retain stale values. No new art, second RAF, fabricated visitor/economy/save behavior or aggregate QA claim.

Final run `20261101T043552Z-cc6d8870`: **204/204 tests** (15 welfare), **93 checked files** with zero diagnostics, all **9 routes** and SEO checks, **402 accepted fixture cases** (39 welfare), **12 native observations**, **9 additional lifecycle observations**, **19 zero-resource snapshots**, and **8 actual JPEGs** (1,174,531 bytes). Native actual care is distinguished from labelled injected asymmetric critical/healthy states and touch/failure tests. `qa:verify` and independent audit PASS at `2026-11-01T05:05:57.573Z`. Preliminary failed hints, short recovery test assumptions and actual small-button visual defect are retained transparently; all final tests use corrected source.

First preview 758,748 raw / 200,032 estimated gzip bytes; shell 119,729 raw. Existing >500KB lazy-chunk warning remains. Model/rendering, journal/SEO/media/dependencies/world/economy and historical evidence are unchanged. Owned tabs closed, viewport reset and preview ports free. Physical Android/true touch/Safari/iOS/presented FPS/GPU time/network/soak/live remain untested. M0-01 external configuration stays partial; BASE-01/02 persist. **20/51 (39.22%)** verified; all 12 M7 items deferred. Next: **M2-07**, full animal-action QA across cycles, inaccessible sources and background interruption. Production **NOT DEPLOYED**.

### M2-07 completion record - 2026-11-01 UTC

Implementation/evidence commit: **e11b373ec9a252529e06175a4ac1d281be6af64b** (local only). [Animal QA report](M2-07_ANIMAL_QA.md), [source-bound independent audit](qa/m2-07/independent-audit.json).

Reviewed cross-system gaps and added three substantive combined-action tests: 6,000 fixed ticks with interrupted/rebuilt care, pause, reserve/habitat removal/Undo and codec/editor reconstruction; simultaneous unreachable sources followed by real reconstruction/recovery; and exact full-state/event equivalence under irregular clock partitions. Serving deltas, each bird's consumption, emitted events, movement bounds, score validity and subscriber cleanup are checked together. Existing all-anchor, all-phase deletion and actual rig/contact coverage was rerun. This is accelerated deterministic simulation, not real-time performance evidence.

Final local gate `20261101T052122Z-8c5ba791`: **207/207 tests**, **94 checked files** with zero diagnostics, all **9 routes** and SEO baselines, **402 accepted fixture cases** across desktop/portrait/landscape, **3 explicit hidden/restore integration checks**, **9 inspected teardown events with zero owned resources** and **4 untouched actual screenshots** (1,027,571 bytes). Native built-product run lasted **322.63 seconds** at default 1x; both birds ate and drank 14 times. Native deletion/cancel/rebuild/refill, truthful welfare causes, ID/EN and keyboard cancellation passed. Labelled fixture pause, context-loss recovery and repeated remount checks passed. Native warn/error observation windows returned zero entries, with limit 200 and no cap. `qa:verify` and independent audit PASS at `2026-11-01T05:38:45.250548+00:00`.

The isolated browser remained visible when another owned tab opened: actual native background is **UNRUN**. Explicitly labelled fixture-only Document visibility overrides exercise the actual renderer listener, freeze care/ticks, and restore native descriptors. They never ship in dist. Injected touch and failure tests are distinct from native mouse/keyboard and physical Android. Presented FPS/GPU time, physical devices, network first-play timing, full-game 15-minute soak and live production remain UNRUN. The earlier invalid overlapping-cell fixture and operator-overlapped asynchronous model test are retained as resolved QA failures; accepted final evidence comes from a fresh sequential run. No product defect requiring a source fix was found.

Product source, original art/media/licenses, dependencies, journal/SEO and immutable PRD transcriptions are byte-unchanged from the preceding checkpoint. Build identity is unchanged; first preview remains **758,748 raw / 200,032 estimated gzip bytes**; existing lazy Three chunk warning remains. Prior cache runs were archived with CRC/every-entry SHA verification before exact owned-run pruning; three generated runs retained. Owned tabs closed, viewport reset, servers stopped/ports free. M0-01 external configuration remains partial; BASE-01/02 persist. **21/51 (41.18%)** verified, M7 all12 deferred. Next **M3-01**: visible visitor spawning from the real gate with a hard agent cap, avoiding water; path walking, satisfaction and ticket revenue belong to subsequent M3 items. Production **NOT DEPLOYED**.

### M3-01 completion record - 2026-11-01 UTC

Implementation/evidence commit: **c191cbd75a9c4ae9f9bc5c906845bd9d0be721fe** (local only). [Visitor arrival report](M3-01_VISITOR_ARRIVALS.md), [source-bound audit](qa/m3-01/independent-audit.json).

Three original low-poly visitor variants now spawn visibly from the real entrance with stable monotonic IDs, separate safe lanes and a hard cap of three active agents. Intake is closed by default and requires an actual connected adjacent path. Missing/disconnected paths block spawning without accumulating a burst; closing allows existing people to complete their brief entrance approach/greeting/departure. Pause, renderer retry, remount and hidden interruption preserve IDs, age, cooldown and positions. Closing/reopening keeps existing agents intact, resets the intake timer, and gives each new arrival a fresh ID. The bilingual Open/Close/View entrance controls and arrival count reflect real state. View entrance uses the existing clamped camera. Arrival previews have null admission and satisfaction, create no ledger entries and earn no coins. Habitat navigation, viewing, satisfaction and tickets remain M3-02 onward.

The fixed-tick state now includes `visitorFlow` and explicit nullable arrival/admission data. The strict pre-release version1 contract rejects invalid ages, positions, serials, slots, references and populations. This extends the unpublished foundation; it does not claim durable-save migration or completed M5 persistence. Rendering consumes authoritative state once per tick, interpolates accepted positions and reuses one lazily allocated eight-geometry/two-material pool. Three people total **1,086 triangles**, **106,572 CPU geometry buffer bytes**, no textures or external asset download. Original provenance/source hashes are recorded in `art/visitors-v1` and the existing asset manifest, whose prior entries are preserved.

Final gate `20261101T062123Z-fc8dd8e6`: **216/216 tests** (9 visitor-specific), **98 checked files** with zero diagnostics, all **9 routes** and SEO checks, **426 accepted browser fixture cases** across desktop/portrait/landscape (24 visitor cases), plus actual native mouse/keyboard observations and **3 untouched screenshots**. New coverage includes 6,000 deterministic spawn ticks, cap/identity/footprint and economy invariants, close/drain, disconnected path recovery, codec/frame equivalence, real rig bounds/pool disposal, current-controller commands and camera targeting. The browser tests use actual fixed ticks, not accelerated state/time injection; touch/visibility/context faults remain clearly labelled injected coverage. The macaw QA hook reports RUNNING and rejects overlapping starts. A guarded fresh sequential fixture chain removes manual idle gaps; real enrichment recovery has a bounded window of 1,800 simulation ticks and 210 wall-clock seconds and retains failure traces rather than imposing an unrealistic 60-second recovery from exhausted states. Preliminary fixture/unused-import and depleted-state rest deadline failures were corrected, retained and not accepted as a pass. `qa:verify` and independent audit PASS at `2026-11-01T06:38:14.528466+00:00`.

First preview payload **775,011 raw / 204,754 estimated gzip bytes**; deltas **+16,263 raw / +4,722 estimated gzip** versus M2-07. Shell **124,525 raw bytes** (+4,796). Visitor renderer callback/resource observations are in the matrix/audit; callback cadence is not presented FPS, and CPU buffer bytes are not GPU allocation. Physical Android/true touch, native background, presentation FPS/GPU time, representative network timing, full-game 15-minute soak and live deployment remain **UNRUN**. Existing lazy Three chunk warning, BASE-01/02 and long development-preview scrolling remain; M5 owns the compact game HUD. M0-01 external Cloudflare configuration stays partial.

Journal routes/content/SEO, original public media, animal logic/art, dependencies, source transcriptions and prior evidence remain unchanged. Historical QA caches were hash/CRC-verified into an archive before exact owned-run pruning; three generated runs retained. Owned tabs closed, viewport reset, previews stopped and ports free. **22/51 (43.14%)** verified; M7 all12 deferred. Next **M3-02**: follow the real connected path graph from entrance to habitat viewing spot and return, with broken routes preventing visits. Satisfaction and exactly-once tickets remain later M3 items. Production **NOT DEPLOYED**.


### M3-02 completion record - 2026-11-01 UTC

Status: COMPLETE. Implementation/evidence commit **fc33e3f5752173b4a31a4f99916dd6b056c19395** (local only). Report: [M3-02_VISITOR_NAVIGATION.md](M3-02_VISITOR_NAVIGATION.md); source-bound audit and actual pixels: [qa/m3-02](qa/m3-02/).

Visitors now walk the real four-neighbor path graph to an adjacent habitat viewing spot, turn toward the enclosure, watch for a fixed dwell, and follow actual paths back through the entrance. Stable IDs, authoritative position/heading/route/queue/dwell and exactly-once viewed events survive pause/retry/remount. Gaps, diagonal proximity, water, scenery and occupancy never grant access. Closing or removing the target causes safe return without teleport; deleting occupied path or the only escape bridge is refused with a concrete ID/EN reason and unchanged topology. Valid alternative routes permit safe replanning; safe edit cancellation and Undo remain atomic. Visitors still have null satisfaction/admission and create no income.

Traffic policy: one active narrow-corridor trip, two separate FIFO gate bays; the PRD requires bounded simple visits without mandating concurrent bidirectional walking. Deterministic4200-tick proof served the first10 arrivals in order, completed14 views and measured maximum550 waiting ticks. All21 legal aviary positions have legal visit routes. Existing center-bay guests clear first if connectivity is enabled during a greeting; side bays then follow FIFO. No permanent queue, overlapping actual rig or fake admission. This is a deliberate small-scene policy, not a completed crowd simulation or future economy.

Final gate **20261101T071707Z-6d3ffd9c**: **227/227 tests** (11 navigation-specific), **101 checked files**, zero diagnostics, all9 routes/SEO checks, **456 browser fixture cases** (152/view;30 navigation cases), actual native desktop/portrait/landscape controls and native viewing-stop pixels,4 untouched screenshots totaling936,222 bytes. Actual fixture navigation uses unaccelerated fixed ticks; projected touch/visibility/context faults are labelled injection.63 animal/resource/journey fields survived pause, two context retries and six remounts;11 distinct teardowns released all ownership. Native keyboard close drained everyone. `qa:verify` and independent audit PASS at **2026-11-01T07:29:06.853334+00:00**. Initial geometric/test/copy findings and explicitly superseded partial runs are retained.

First-preview payload **786,062 raw /208,037 estimated gzip bytes**, versus M3-01 **+11,051/+3,283**; shell127,155 raw (+2,630). Original visitor geometry unchanged:362 triangles/person,1,086 at cap3,8 shared geometries/2 materials,106,572 CPU buffer bytes,zero textures. Current sampled maxima36 renderer geometries/23 owned materials/61 draws/13,174 triangles are exercised-scene observations; the material aggregate now includes the existing visitor pool. Callback cadence is not presented FPS and CPU geometry bytes are not GPU memory. Physical Android/touch, native background, presentation FPS/GPU timing, representative network latency, full-game15-minute soak and production remain UNRUN.

Original journal/SEO/analytics/media, animal art/logic, dependencies, immutable source transcriptions and historical evidence are intact. Owned tabs closed, viewport reset, both loopback ports free; three generated QA runs retained after hash/CRC-verified archives. M0-01 external Cloudflare configuration remains partial; no login or new grant attempted. **23/51 (45.10%)** verified,12 M7 items deferred. Next **M3-03**: real guest satisfaction from reachable habitat and animal welfare, with positive/negative feedback. Production **NOT DEPLOYED**.


### M3-03 completion record - 2026-11-01 UTC

Status: COMPLETE. Implementation/evidence commit **9615e951e902b7cc67dfcc842bb3ae18b4fd686b** (local only). Report: [M3-03_VISITOR_SATISFACTION.md](M3-03_VISITOR_SATISFACTION.md); exact evidence: [qa/m3-03](qa/m3-03/).

Each visitor now receives one deterministic outcome from actual access and the animals in the habitat they viewed. During30 real facing/view ticks, sample the current target habitat's mean animal welfare; empty observation periods contribute0. Round the completed visit mean to0–100; starting satisfied threshold60. Feedback separately states welfare actually observed and animal-presence percentage. Empty, absent and unreachable habitats have distinct0-score explanations; interrupted trips retain genuine partial observations but have no final score. Positive/negative/interrupted ID/EN badges, concrete causes/actions, integer scored-visit average and bounded4-record history distinguish individual experience from current global welfare. Results never rewrite after care changes. No hidden FIFO-wait penalty, fake score before observation, ticket, ledger change or income.

Typed serializable experience/history plus strict validation and cloned public views prevent duplicate outcomes or state aliases. Current-tick animal welfare is reconciled before visitor sampling. Gate close, target/access changes, renderer interruptions and safe edits retain coherent per-visit state; historical destination IDs remain history rather than live object references. The pre-release schema extension does not claim M5 durable persistence or migration.

Final gate **20261101T074853Z-1b4925ca**: **241/241 tests** (14 satisfaction-specific), **105 checked files**, zero diagnostics, nine routes/SEO, **495 browser fixture cases** (165/view;39 satisfaction cases), actual native desktop/portrait/landscape care/feedback interactions, four untouched screenshots totaling1,135,214 bytes. New satisfaction fixtures explicitly inject pending deterministic starting states; actual WebGL and unaccelerated observation/recovery ticks produce the results afterwards. The real refill recovery case changed a later visit from33 to62 after301 accepted ticks while retaining the first result. Actual native controls separately produced satisfied66/80, concerned55/46/33 and later62/60 results after real care restoration. The existing water-placement guard was respected, cancelled while unsafe, then confirmed only when safe. Native keyboard closing left18 scored visits and two unscored interruptions before all guests exited.

Pause/retry/remount preserved **72 fields plus actual feedback summary/history text**; two context retries, six remounts, three injected visibility checks and11 distinct teardowns passed with single-loop ownership and zero disposed resources. `qa:verify` and independent audit PASS at **2026-11-01T08:06:49.641290+00:00**. Earlier preview-only assertion changes, validation-gap correction and view-alias fix are retained with raw attempts; no preliminary gate substituted for final verification.

Current first-preview payload **797,374 raw /211,390 estimated gzip bytes**, delta versus M3-02 **+11,312/+3,353**; shell132,676 raw (+5,521). No renderer/art/dependency changes or new visual assets/materials/textures. Exercised-scene maxima36 geometries/23 materials/63 draws/13,810 triangles are observations across varied test scenes, not presented FPS or an equivalent-scene performance comparison. Physical Android/native touch/background, presented FPS/GPU timing, representative network latency, full-game15-minute soak and production remain UNRUN. Existing BASE-01/02, long preview scrolling and lazy-chunk warning remain.

FIFO policy and550-tick measured wait are preserved as V1 pacing considerations, not final balancing. **The PRD4.5 welfare/access attraction or spawn-rate curve remains an explicit M3-06 tuning requirement; current fixed intake/cap are unchanged.** Journal/SEO/analytics/media, animals/renderer/art, economy/world modules, dependencies, immutable sources and prior evidence remain intact. Owned tabs closed, viewport reset, both ports free; three generated runs retained after verified archives. M0-01 external Cloudflare settings stay partial; no login/grant attempted. **24/51 (47.06%)**,12 M7 items deferred. Next **M3-04**: admission at the gate pays exactly once per stable visitor ID with a ledger; frame drops/reload cannot duplicate tickets. Production **NOT DEPLOYED**.


### M3-04 completion record - 2026-11-01 UTC

Status: COMPLETE. Implementation/evidence commit **9133c2a33ec1d52abecce24eef408169004cc2da** (local only). Report: [M3-04_TICKETS.md](M3-04_TICKETS.md); exact evidence: [qa/m3-04](qa/m3-04/).

Actual eligible gate admission now pays **10 fictional Zoo Coins exactly once per stable visitor ID**. The single synchronous transaction commits the gate crossing, visitor paid decision, immutable admission receipt, ledger entry and reconciled balance before observational events. Spawn, queue, promotion and pre-entry cancellation pay nothing. A guest entering an empty habitat keeps a free decision for that ID; later birds/view completion cannot charge it retroactively. Closing after a genuine paid admission retains that one receipt; it does not charge queued guests or manufacture a refund. Rendering, HUD clicks, repeated Open, satisfaction and viewing completion never mint money. Native controls proved1500/0 before entry,1510/1 at crossing before any completed view, the same1510/1 after keyboard close and renderer reopen, then1520/2 for a new admitted identity. Later screenshots show further genuine admissions, not a fixed fake counter.

The authoritative ledger validates prior conservation, unique operations and complete admission references. Strict whole-state validation rejects a paid body without its receipt/ledger/paid metadata, orphaned money and reused generated identities. Whole paid-state serialization/rehydration and same-page renderer recovery cannot recredit an old visitor. **Persistent autosave remains M5**: the UI explicitly says refresh starts over; actual full reload reset world, bodies, receipts and balance together to1500/0. No claim of durable reload persistence or full spending rules.

Final gate **20261101T085055Z-75d4ce6e**: **258/258 tests** (17 ticket-specific), **110 checked files**, zero diagnostics, nine routes/SEO PASS, **540 browser fixture cases** (180/view;45 ticket cases) and native mouse/keyboard desktop/portrait/landscape ticket UI. New QA seeds are complete snapshots generated by the real core; subsequent actual WebGL and unaccelerated ticks/commands prove outcomes. Four untouched screenshots total **1,215,068 bytes**. Native console empty/uncapped. **79 fields plus financial/feedback UI** preserved through two context retries, six remounts and three injected visibility checks;11 teardowns released owned resources. `qa:verify` and independent audit PASS at **2026-11-01T09:09:07.200081+00:00**. Earlier fixture/assertion failures and the corrected visible-text QA assertion remain preserved; all three chains and native proof were rerun against final source rather than borrowed from the failed attempt.

Financial history stops intake at **1024 total ledger entries or1024 receipts**, with no truncation; the initial funding entry uses one ledger slot, so this starting configuration admits at most1023 paid guests before that ledger cap. Unsafe-integer balance also pauses intake. A fully capped history stays within the existing1,000,000-character codec limit. **M3-05 must respect this shared history budget when adding debits; M5/M6 must review long-session save/compaction without dropping idempotence proof.** Starting ticket price10 and FIFO/access/welfare attraction pacing are not final balancing; the required attraction curve remains M3-06.

Current first-preview payload **808,406 raw /214,659 estimated gzip bytes**, delta versus M3-03 **+11,032/+3,269**; shell137,435 raw (+4,759). Existing lazy chunk670,971 raw retains its warning. No new model/material/texture/dependency; renderer change only captures complete session state on admission. Exercised maxima36 geometries/23 materials/63 draws/13,810 triangles are varied-scene observations, not equivalent-scene performance or presented FPS. Physical Android/native touch/background, GPU timing/presentation FPS, representative network latency, full-game15-minute soak and production remain UNRUN. BASE-01/02, long preview HUD and lazy-chunk warning remain recorded. Journal/SEO/analytics/media, original art/animal/world/render assets, immutable sources and prior receipts remain intact. Both previews stopped/ports free, owned tabs closed, viewport reset, three generated runs retained after verified archives.

**25/51 (49.02%)**,12 M7 items deferred. M0-01 external Cloudflare binding/build/root/autodeploy configuration stays partial; no login/new grant attempted. No new blocker, push, deployment or Actions. Next **M3-05**: validate actual building/supplies/maintenance costs against available coins atomically; insufficient funds/cancel/repeated input must never create free objects or duplicate debits, and balance/refund/occupancy must stay reconciled. Production **NOT DEPLOYED**.


### M3-05 completion record - 2026-11-01 UTC

Status: COMPLETE. Implementation/evidence commit **6f0c61f31721e123e63a90906094546b6344046c** (local only). Report: [M3-05_COSTS.md](M3-05_COSTS.md); exact evidence: [qa/m3-05](qa/m3-05/).

Actual construction, care and upkeep now share the authoritative ledger. Starting prices: habitat300, path tile15, feeder80, water bowls60, rest garden80, food refill service8 and water refill service4 fictional ZC. A refill's fixed fee is shown before the click even for partly used stock. A validated transaction clone publishes the corresponding world/resource operation, debit and balance together; invalid, insufficient, full, stale, cancelled, paused or repeated requests cannot buy free objects or duplicate a debit. Existing animal/geometry placement guards remain. Per-resource construction refunds derive from actual paid debits, exclude refill fees and cannot be harvested through removal/rebuild/replay. World Undo repays the original refund once and refuses insufficient funds. Exact removal refund and Undo repayment are disclosed in bilingual UI.

Maintenance costs2 ZC per active habitat at each600 accepted-tick simulation period. Settled-period state and matching expense/new-build/restoration proof survive complete codec handoff. Insufficient funds leave a visible due amount, never a negative balance; later funds settle once. No habitat has no upkeep; restoring after empty periods uses actual restoration proof rather than billing absent habitat time. Pause, frame partitioning, large-frame catch-up, rehydration and observational events cannot duplicate costs or tickets. Structure/care changes save complete page-owner state. **M5 still owns durable autosave/migration**: native reload resets world, paid visitor bodies, coins, expenses, refunds and receipts together to1500/0; same-page renderer recovery retains complete finances.

Starter viability:1500 buys one habitat, five connecting paths, all three care structures and both full sources for607 ZC, leaving **893 ZC at tick0**. An accelerated9000-tick/15-simulation-minute scenario repeatedly buys actual supplies, pays upkeep and admits guests without negative balance/history exhaustion; this is **NOT a real-time browser or full-game soak**. Native controls separately proved1500→1200 construction, a precise300 refund/300 Undo repayment,80+8 feeder cost and80 refund quote, actual upkeep debits after elapsed time, then real tickets after spending. Native pre-confirm dialog balances are captured while paused so legitimate elapsed upkeep is not misclassified as a cancellation fee.

History remains bounded without dropping any receipt or operation: warn at896 total ledger entries, stop normal purchases/upkeep settlement/new admissions at960, reserve64 further entries for removal/Undo, and refuse paid corrections atomically at1024 with exact remaining-capacity text. Initial funding uses one slot. Existing objects/simulation/history stay intact; no automatic wipe. Due upkeep remains explicit while blocked. **This is an explicit bounded preview policy, not unlimited long-session persistence. M5/M6 must review safe long-session save/compaction before release while preserving ticket/refund idempotence.** Broader cashflow/attraction balancing is M3-06; recovery guidance remains M3-07.

Final gate **20261101T094143Z-22338488**: **281/281 tests**, including23 spending and17 existing ticket tests; **116 checked files**, zero diagnostics; nine routes/SEO PASS; **576 browser fixture cases** (192/view;36 spending,45 ticket cases). Whole labelled QA seeds establish low funds, due maintenance, paid-state or capacity; subsequent actual UI/WebGL/unaccelerated ticks prove outcomes. Native product mouse/keyboard and actual pixels checked at1366x768,360x780,780x360 in EN/ID. Four untouched screenshots total **1,270,691 bytes**; native console empty/uncapped. **85 fields plus actual financial/cost UI** preserved through six remounts, two injected context losses and three injected visibility checks;11 distinct teardowns released resources. `qa:verify` and independent audit PASS at **2026-11-01T09:55:23.301472+00:00**.

Retained failures include obsolete free-preview assertions, a discovered resource/world refund-ID collision (fixed with separate namespaces/ledger-based identities), fixture adjustment-ID reuse, initial UI encoding/syntax/type wiring, unused test imports and the priced localized-label assertion. Preliminary576-case proof is compressed and explicitly not final acceptance; final complete281-test gate and fresh576-case browser proof were run after exact disclosure/maintenance validation changes. No preliminary evidence was borrowed. Journal/SEO/analytics/media, original art/render assets, animal behavior logic, immutable source transcriptions, dependencies and earlier receipts remain protected.

Payload **821,012 raw /217,678 estimated gzip bytes** for first preview, delta versus M3-04 **+12,606/+3,019**; shell143,619 (+6,184), lazy chunk677,393 retains the existing warning. No new geometry/material/texture/dependency. Observed varied-scene maxima36 geometries/23 materials/63 draws/13,810 triangles are not equivalent-scene performance claims. Three5-second callback/CPU-submit/heap profiles were captured with their limits. Physical Android/native touch/background, GPU timing/presented FPS, representative network latency, full-game15-minute soak and production remain UNRUN. BASE-01/02, long preview scrolling and lazy-chunk warning remain later work. Both previews stopped/ports free, owned tabs closed, viewport reset; three generated runs retained after verified archives. Evidence is bounded to9,891,221 bytes plus this report/progress documentation.

**26/51 (50.98%)**,12 M7 items deferred. M0-01 exact external Cloudflare binding/build/root/autodeploy configuration remains partial; no login or new grant attempted. No new blocker, push, deployment or Actions. Next **M3-06**: readable ticket/opex/net cashflow and configurable tuning, deterministic balance across time partitions, **required PRD4.5 welfare/access attraction curve**, and documented FIFO pacing (prior550-tick wait is not final balancing). Production **NOT DEPLOYED**.


## M3-06 COMPLETE — 2026-11-01 UTC

Implementation `e9de1c5cf283422dc871978d97461924d2e64b2e` (local only). [Cashflow/ledger report](M3-06_CASHFLOW.md), [independent audit](qa/m3-06/independent-audit.json), [browser proof](qa/m3-06/browser-receipt.json). **960-entry freeze RELEASE BLOCKER RESOLVED** by bounded journal/checkpoint with exact lifetime money, refund/Undo/active ticket/retired serial/command replay proof, not a larger stop limit. Tests cover12,000 core build/refund operations,10,000 eligible internal admissions and codec handoff; actual UI purchases after1,400 operations. Bilingual ticket/reward/build/supplies/upkeep/refund/Undo/net summary excludes starter income. Actual welfare/access/animals drive configurable4.5–90s nominal arrival intervals, bounded by existing3-agent FIFO policy; no fake income.

Final run `20261101T105736Z-cf3d2797`:288 tests,119 checked files/zero diagnostics,9 routes,582 browser cases (42 spending/45 tickets), native desktop/portrait/landscape pixels,94-field plus actual UI recovery,5 remounts/2 context losses/3 injected visibility checks/10 zero-resource teardowns. Four untouched screenshots1,470,805 bytes. Independent audit and source/build-bound `qa:verify` PASS. Source `52e2ec62fb9c97fb41b49ca888c07b93faf2aa28fa477722f22365401cd7e106`, build `6acea57e782f3d168005ee1eea9a35220010956f506d74afb4e3717119aa9991`. First preview831,763 raw /220,769 gzip-estimate bytes; lazy chunk685,953 warning remains M6. Roughly60 callback Hz is not presented FPS; physical devices/native background/full-game soak/live remain unverified. M4 speed UI and M5 autosave/migrations are not implemented. Same-page state is complete; actual reload starts wholly fresh. Historical failures and verified archives retained; owned tabs/servers closed and ports free. No source/assets/dependency/production regression or push/deploy/Actions/login. **27/51 (52.94%)**,12 M7 items deferred. M0-01 external settings partial. Next **M3-07** low-cash alert/recovery; no full V1/playable mission/save/release claim.


## M3-07 COMPLETE - 2026-11-01 UTC

Implementation `21f833c5974a3a48d2c65d91037be1ced0afae16` (local only). [Recovery report](M3-07_RECOVERY.md), [source-bound audit](qa/m3-07/independent-audit.json), [browser proof](qa/m3-07/browser-receipt.json). EN/ID low-cash next-step review/Confirm/Cancel; actual missing essentials at zero-refund/no-cash when unaffordable; actual graph repair; limited urgent rations below12 at most every300 ticks with durable cooldown/nonce; real care and gate income. No money gifts, duplicate refunds, debt erasure or short-session ledger freeze.304 tests/122 checked files/zero diagnostics/9 routes;618 browser cases (36 recovery), actual3-view pixels,99-field recovery and exact small clock/lifecycle evidence, native deliberate0-to94 through19 actual tickets. Unattended empty-bowl negative retained; ongoing care/pacing/HUD testing remains. `qa:verify`/independent audit PASS. Source `070ca76f73331ab845b0df27be2f9367e108c3b66c42cd00ed36a2c4c55596a1`, build `05ae59f417cf8ac230e970b7e03e4f510c5a3d1dbf5afa81288e40da278a604c`; four screenshots1,510,887 bytes. Shell154,464/first preview848,022 raw225,214 gzip estimate;693,558 lazy chunk warning remainsM6. Physical/native-background/presentedFPS/full-game soak/live UNRUN; M5 autosave absent, full reload starts wholly fresh. Owned tabs/servers closed, ports free, prior failures and CRC/SHA archives preserved. M3 complete7/7; **28/51 (54.90%)**, M0-01 external config partial and12 M7 deferred. Next **M4-01** mission evaluation/idempotent rewards must also observe authoritative `recovery-changed`. No push/deploy/Actions/login.


## M4-01 COMPLETE - 2026-11-01 UTC

Implementation `43227a6a71d6c5c39e5b4b9ebbcea8ebc390de99` local only. [Mission engine report](M4-01_MISSION_ENGINE.md), [audit](qa/m4-01/independent-audit.json), [browser receipt](qa/m4-01/browser-receipt.json). Actual-state evaluation including recovery-changed; stable quoted claim, atomic20-ZC ledger/completion/order/nonce, archived reward proof and strict codec. Real Q01 construction predicate exercises the engine, but guided onboarding remains M4-02; Q02-Q04 honestly planned/locked and their noncash unlock contract still belongs to subsequent slices.318 tests/126 files/zero diagnostics/9 routes;654 browser cases (36 missions),102-field/UI recovery, five remounts/two context losses/three injected visibility checks and exact event/visual clocks. Native fresh keyboard1125->1145 and populated925/3 tickets/one20-ZC reward; whole reload1500/zero rewards. Four screenshots1,506,877 bytes, source-bound qa:verify and independent audit PASS. Source `69c5ab3c944647952d36f81662fa22690095c855d330634ad44b77c3b99aa2c3`, build `93885a3cf4d082f39c44df3143d437482acdccd3998daa5cf973fa5cfa64b827`. Shell159,231/first preview855,363 raw227,317 gzip estimate;696,132 lazy chunk warning remainsM6. Probes are unpopulated habitat/UI callback measurements, not presentedFPS/physical Android or a populated comparison. Tooling/viewport/transport/pause-helper failures preserved and excluded; all owned tabs/servers closed, ports free, verified archive retains history. No push/deploy/Actions/login/access change. **29/51 (56.86%)**, M4 1/7; M0-01 external configuration partial,12 M7 deferred. Next **M4-02** Q01 contextual onboarding and first-time completion. M5 durable save and full mission sequence not claimed.


## M4-02 COMPLETE - 2026-11-01 UTC

Implementation `fbb76d50f84404f04ae300733c2561eeb0cebc40` local only. [Q01 onboarding](M4-02_Q01_ONBOARDING.md), [audit](qa/m4-02/independent-audit.json), [browser receipt](qa/m4-02/browser-receipt.json). Real bilingual habitat/path/claim guidance, safe ghost Confirm/Cancel, topology-derived next tile, reused preexisting paths, actual noncash support and unique20-ZC reward.330 tests/130 checked files/zero diagnostics/9 routes;696 browser cases (42 onboarding),109-field paused handoff, three remounts/one injected context loss and exact clocks. Native all three viewports1125->1145; same-page handoff preserved and full reload entirely fresh1500, not durable save. Three screenshots402,012 bytes; qa:verify/independent audit PASS, owned tabs/servers closed/ports free. Source `0afe6ccfbf4eae1c2321172128609b55c051de42b2248907204e52f6ed7f3503`, build `c9bbda10428cadd72712705cfcc9b7f3ab60e2dd701b7bdd6317fe87d8d52ee1`. Shell174,113/first872,658 raw231,877 gzip estimate;698,545 lazy warning remainsM6. All physical-device/background/presentationFPS/full-game soak/human-unaided claims remain unverified. Preserved preliminary diagnostics/label mistakes, verified archive before generated-only pruning. **30/51 (58.82%)**, M4 2/7. M0-01 external configuration partial; M7 deferred. Next **M4-03** Q02 care, including actual use/welfare duration and typed noncash unlock. No push/deploy/Actions/login/access changes.


## M4-03 COMPLETE - 2026-11-01 UTC

Implementation `5e96e23b7b6485203c343031c0f67d96008b1d02` local only. [Q02 report](M4-03_Q02_CARE.md), [audit](qa/m4-03/independent-audit.json), [receipt](qa/m4-03/browser-receipt.json). Real per-bird food/water use and >=60 welfare for50 consecutive100ms ticks after Q01. Partial streak resets on low/missing/reserve and freezes on pause; earned50 remains recorded before Claim, following native UX evidence. Typed exclusive noncash aviary-blossom proof/unlock is atomic/idempotent and creates no ledger money. Original1,120-triangle/one-material/zero-texture trim appears and safely disposes.344 tests/134 files/zero diagnostics/9 routes;738 browser cases (42 Q02),114-field recovery, three remounts/one injected context loss and exact clocks. Native three-view fresh care claims keep913/911/911 ZC unchanged and Q01 cash reward20; same-page retains905/two claims/unlock, full reload wholly fresh1500. Three images735,216 bytes; qa:verify/independent audit PASS. Source `d247dad40c93fb23f12ad68f3e986cc8d726c15fe4fb0f05b2afd5097b39b3e3`, build `bb2997c7b2b80436414d2aeb4fb1f77a575ebec5ea13de649e1400ff497d2be9`. Shell179,513/first882,134 raw234,793 gzip estimate;702,621 lazy warning remainsM6. Physical/background/presentationFPS/full-game soak/human-unaided/durable storage/live remain unverified. Failed preliminary/aborted candidate evidence preserved; CRC/SHA archives precede generated-only pruning; owned tabs/servers closed and ports free. **31/51 (60.78%)**, M4 3/7. M0-01 external configuration partial;12 M7 deferred. Next **M4-04** Q03 actual unique admissions/viewing with typed coin/badge evidence. No push/deploy/Actions/login/access changes.


## M4-04 COMPLETE - 2026-11-01 UTC

Implementation `fa2b78842d40237f398141803aa38abf5aaee3a8` local only. [Q03 report](M4-04_Q03_VISITORS.md), [audit](qa/m4-04/independent-audit.json), [receipt](qa/m4-04/browser-receipt.json). Real three unique paid admissions and one complete occupied viewing qualify Q03. Earlier genuine progress counts, but Q01/Q02 claims remain required. A single atomic claim gives40 ZC plus typed First Visitors badge; tickets remain separate and reward/replay proofs survive bounded journal checkpoint, codec and remount. Queued/free/interrupted/forged events cannot invent progress. Actual ID/EN contextual path/bird/care/gate actions and readable badge.359 tests/139 files/zero diagnostics/9 routes;780 browser cases (42 Q03),119-field recovery, three paused remounts/one context loss and exact clocks. Three actual fresh Q01-Q02-Q03 runs each941->981 at explicit claim, total mission cash60; same-page retained, full reload wholly fresh1500 until M5. Three images826,948 bytes, qa:verify/independent audit PASS. Source `02b51d4604dafba9f044fcae9c129e299d723cd51c71fd4c1102c8e8ce820245`, build `f034e0f928ad56c62fb741a8609ccb13151733630915a8e2bba4a3e2992d757a`. Shell185,576/first892,666 raw237,190 gzip estimate;707,090 lazy warning remainsM6. Physical devices/native background/presentationFPS/full-game soak/human-unaided/durable storage/live remain unverified. Historical failures and CRC/every-entry-SHA archives preserved, bounded generated-only retention; owned tabs/servers closed and ports free. **32/51 (62.75%)**, M4 **4/7**. M0-01 external configuration partial,12 M7 deferred. Next **M4-05 Q04** actual sustained welfare/income and small unlock/achievement, not yet implemented. No push/deploy/Actions/login/access changes.


## M4-05 COMPLETE - 2026-11-01 UTC

Implementation `b4039c84a89ea7b2151b90aaf55c745a83bb21e7` local only. [Q04 report](M4-05_Q04_THRIVING.md), [audit](qa/m4-05/independent-audit.json), [receipt](qa/m4-05/browser-receipt.json). Real >=60 welfare for both birds, accessible food/water, connected habitat and open entrance for300 consecutive100ms ticks, plus20 ZC from2 new real paid admissions in that same streak after Q03. Partial failure resets time/income, pause freezes; achieved qualification retained. Earlier tickets, rewards, refunds and recovery cannot count as new income. Atomic typed noncash banner/achievement/expansion-preview unlock, no ledger cash and replay-safe through archive/codec/remount. Original234-triangle/one-material/zero-texture banner visibly renders at the entrance; next-goal details open honestly without implementing M7.370 tests/146 files/zero diagnostics/9 routes;816 browser cases (36 Q04),127-field context recovery/three paused remounts/exact clocks/zero-resource disposal. Three actual fresh Q01-Q04 runs, no cash added by Q04 and total mission cash60; same-page retained, full reload wholly fresh1500 until M5. Three untouched screenshots 1,204,725 bytes; qa:verify/independent audit PASS. Source `12b9affdea1851339316209f24edaf4f69c6c9e4acc42d1fc71b84b4608b5c2f`, build `ffd46fc607f1361a824a159b2428a7c2261adbf8476f8bf6c81f96c56667e1f4`, run `20261101T163523Z-c0444b8c`. Shell192,387/first904,496 raw239,799 gzip estimate;712,109 lazy chunk warning remainsM6. Preliminary aborted/failed copy-expectation/browser attempts retained and excluded. Physical devices/native background/presentationFPS/full-game15min soak/human-unaided/durable save/live remain unverified. Bounded owned artifacts and CRC/every-entry-SHA archives, tabs/servers closed and ports free. **33/51 (64.71%)**, M4 **5/7**. M0-01 external configuration stays partial;12 M7 items deferred. Next **M4-06** 1x/10x fixed-step speed with equivalent economics, missions, pause/save and one render loop. No push/deploy/Actions/login/access changes.

## M4-06 COMPLETE - 2026-11-01 UTC

Implementation `e959fbd0b25b7f338a5697de739bef09b2ad8963` local only. [Speed report](M4-06_SIMULATION_SPEED.md), [independent audit](qa/m4-06/independent-audit.json), [browser receipt](qa/m4-06/browser-receipt.json). Accessible ID/EN1x/10x control reflects authoritative rate, pauses/locks during vital dialogs and preserves rate through renderer replacement/codec. Single existing RAF,100ms fixed ticks, at most250ms accepted wall time and25 intermediate ticks at10x; no skipped rules or offline credit. Genuine rate change reanchors the next frame, preserving sub-tick simulated remainder; same-rate input no-op.381 tests/150 checked files/zero diagnostics/9 routes;23 suites280/view=840 browser cases,24 speed-specific. Native fresh Q01-Q04 runs at desktop10x, portrait1x and landscape10x; real fast-care welfare recovery.128-field stable context recovery and3 true paused unmount/remounts; zero owned GPU/listener/session resources after disposal. Source `642a236db84d630b2d3dc18dffc70098099b7240629e7c613a7393fcea3998e7`, build `51e8f1fd1fedae475e0dfc4b158e218b78ea5bcd4e6701bd151a95a057f09b15`, run `20261101T171513Z-26e9b18a`. Three untouched screenshots154,839 bytes. First preview909,072 raw/241,045 gzip estimate, lazy chunk713,367 raw warning retained for M6. Measured callbacks/CPU under concurrent QA, not presentationFPS or a physical-device pass. Full reload fresh1500/default1x until M5. Historical failures and unaccepted observations preserved, QA retention bounded. **34/51 (66.67%)**, M4 **6/7**. M0-01 external configuration stays partial,12 M7 items deferred. Next **M4-07**, representative10-15minute complete-loop QA/recording and bug fixes; durable save/physical devices/native background/FPS/human unaided/live still UNRUN. No push/deploy/Actions/login/access changes.

## M4-07 PARTIAL - functional wall-clock QA passed, recording unavailable - 2026-11-01 UTC

No app-source change from checkpoint `153a69abe765a3e7dc8c992266b65c57e6f98073`. [Gameplay report](M4-07_GAMEPLAY_QA.md), [audit](qa/m4-07/independent-audit.json), [actual session traces](qa/m4-07/gameplay-session.json). Three fresh native product sessions run for754.446s desktop,722.780s portrait and675.043s landscape of real wall-clock time, independently of simulation speed. All build/cancel/path/two-bird care/real consumption/visitors/tickets/Q01-Q04/continued-care flows pass at1x with actual10x bursts and return. Real dialog pause, close/reopen, entrance closure without false revenue, natural depletion/recovery and same-session viewport resize covered. No native state/time injection. Native cashflow/balance/reward aggregates reconcile, no negative balance or duplicated reward,0 gameplayP0/P1 observed, uncapped consoles empty.381 tests/150 checked files/zero diagnostics/9 routes and six-case browser receipt pass against unchanged source `642a236db84d630b2d3dc18dffc70098099b7240629e7c613a7393fcea3998e7`, build `51e8f1fd1fedae475e0dfc4b158e218b78ea5bcd4e6701bd151a95a057f09b15`, run `20261101T173806Z-09fc9bbd`. Separate labelled fixture checks resource/RAF cleanup; they do not replace native session evidence. Seven original screenshots and bounded receipts retained, tabs/previews closed.

**Acceptance gap:** exact M4-07 verification requests a screen recording. Supported runtime capabilities and tool search offer screenshots but no recording. Recording is **UNAVAILABLE**, not fabricated or passed; timestamped screenshots/actions/observations are retained. **Keep M4-07 unchecked. Verified progress stays34/51 (66.67%), M4 6/7.** No repeated-owner approval requested and no permission denied. M0-01 external config remains partial. Next independent work: **M5-01 durable autosave/Continue**, while recording acceptance remains pending parent review. Physical Android/iOS/Safari, native background, presentedFPS/GPU, full15minute soak, human unaided test and live deployment remain UNRUN. No push/deploy/Actions/login/grants.

## M5-01 COMPLETE - 2026-11-01 UTC

Implementation `63db0ea6fd008c7cc69232c7dc8c22f1ceec7c52` local only. [Autosave/Continue report](M5-01_AUTOSAVE_CONTINUE.md), [audit](qa/m5-01/independent-audit.json), [native/storage matrix](qa/m5-01/autosave-matrix.json), [source provenance](qa/m5-01/native-source-provenance.json). Versioned full-state IndexedDB checkpoint plus previous-good record, atomic compare-and-swap write, one 2s latest-state timer/inflight transaction, logical critical checkpoints, truthful ID/EN saved/pending/error/unavailable/conflict states and paused Continue without offline catch-up. Full money/payment/reward/checkpoint/RNG/bird/resource/world/visitor/settings data survives actual reload and tab reopen. Transient Undo/camera/ghost remain session UI. Unreadable data is retained and new-game overwrite blocked; detailed migration/recovery staysM5-02, reset confirmationM5-03.

Final local 404 tests/155 checked files/zero diagnostics/9 routes; 27 real-IDB labelled fixture cases and 23 critical renderer suites 280 cases pass. Actual native three-viewport Continue, care/reload, ID/1x settings, cold tab reopen, stale-writer conflict/reload and journal navigation pass. Fresh native Q01-Q04 mission-by-mission reloads passed in candidate 7 with exact six visible state groups plus saved tick; the final source subsequently changes only documented ID/EN text, metadata range guard/regression and QA expectation/wrapping. That original evidence remains archived with its original source IDs; final-source tests/browser checks are separate, never relabeled. Confirmed money aggregates reconcile, mission cash remains 60 with 4 claims, no duplicate rewards/offline credit. Seven native/negative screenshots, clean uncapped native console, single RAF and zero disposed renderer resources. Final run `20261101T194003Z-fdf1450b`, source `b11ae3d9d5e5b90f0bea468f8a12b5bb49f385b6475b62eb9089399dbd7f2a7a`, build `1e7f22d2eb5afffed6df0412b6668547050f8a3bba45bf1c21b361add32dca77`. Built shell290,173/first-preview923,819 raw and245,776 gzip estimate; not network/latency/FPS measurements. Lazy Three.js chunk warning remainsM6.

Historical typing/validator/test-expectation failures and superseded candidates preserved with SHA/CRC archives before owned generated-only pruning; no saved native progress wiped. QA-only portrait diagnostic overflow corrected and rechecked. Checklists **35/51 (68.63%)**, M5 **1/7**, M4 **6/7**; M0-01 external Cloudflare config and M4-07 screen recording remain unchecked,12 M7 deferred. Physical devices, native background, browser-process restart, presentedFPS/GPU/full 15-minute soak/human unaided/live remain UNRUN. Owned tabs/previews closed, viewport reset/ports free. No push/deploy/Actions/login/grants/dependency changes. Next **M5-02 validation, migration and explicit corruption recovery**.

## M5-02 COMPLETE - 2026-11-01 UTC

Implementation `8e693f753f4d5f30765495de1f7d35993f6e99b7` local only. [Save validation/recovery report](M5-02_SAVE_RECOVERY.md), [independent audit](qa/m5-02/independent-audit.json), [native/recovery matrix](qa/m5-02/recovery-matrix.json). Strict full-state validation, explicit supported format1→2 storage-envelope migration, confirmed previous-good recovery preserving the unreadable original, atomic rollback and generation-aware stale-writer/ABA protection. State schema remains1; unknown/future versions never silently reset or downgrade. One bounded primary/previous/preserved recovery copy, replacement disclosed before confirmation, no reset workflow added. ID/EN review/Cancel/Confirm and actionable failures are real; Continue opens paused without offline progress.

Final-source418 tests,159 checked files with zero diagnostics,9 route/SEO/sitemap regressions,54 actual-IDB recovery cases and27 prior storage cases pass. Fresh native Q01→Q04 includes4 exact reload/Continue pairs; cold-tab reopen, real existing M5-01 legacy-save migration, actual two-tab conflict/reload, portrait/landscape ID and EN/ID recovery dialogs verified. This closes the M5-01 fresh-run candidate-source caveat using new final-source evidence; historical evidence keeps its own identity. Three renderer remounts/context-loss retry preserve117 authoritative fields; resources/subscribers/RAF return to zero on disposal. Source `bd3cd7f386e1c85d45cd74a6357a3f3678d92715ecd9089497932822f36f4e4b`, build `84ab52f3470a5a758067c1b52bc3d2ee0cf9fd6695ac1f92229433718afaf779`, run `20261101T203855Z-16809bd3`. Built first-preview935,921 raw/249,639 gzip estimate; no network/FPS claim.

**Optional download verification is BLOCKED/UNRUN.** One optional recovery-export waiter/click on the local fixture met a repeating browser permission gate; owner cancelled it. No app/harness export retry loop found; runtime gate cause unverified. No retry, permission widening, alternate download route or new approval requested. Routine recovery/storage fixtures now disable export before backend/Blob and assert0 export requests; product copy says prepared, never falsely downloaded. Original saves/evidence retained. Eight actual screenshots and historical failures bounded/hashed; three generated runs retained after verified archive. Owned tabs/servers closed, viewport reset and ports4321/4322/4331/4332 free. No push/deploy/Actions/login/grants/dependency change. Physical devices, native background, full browser-process restart, presentedFPS/GPU/network/15min populated soak/human unaided/live remain UNRUN. V1 **36/51 (70.59%)**, M5 **2/7**; M0-01 and M4-07 partial,12 M7 deferred. Next **M5-03 pause/background/restart/reset confirmation**. Owner stop deadline **2026-11-02 01:00 UTC /08:00 WIB** remains in force.

## M5-03 COMPLETE - 2026-11-01 UTC

Implementation `ba7860ab9f959787cf6a2b380b336ddb41a29838` local only. [Pause/restart report](M5-03_PAUSE_RESTART.md), [audit](qa/m5-03/independent-audit.json), [native/fixture matrix](qa/m5-03/pause-restart-matrix.json). Explicit ID/EN Pause/Resume, independent manual/background/Continue/storage/dialog holds, sticky background pause until explicit Resume, safe checkpoint flushing and no offline catch-up. Inner care-dialog closure cannot release an outer pause. Confirmed restart atomically keeps one pre-restart backup, starts a durable fresh1500-ZC game at1×, and offers one confirmed full-state restoration. Cancel, failed writes, duplicate/stale confirmation and old-generation writers cannot wipe or duplicate progress. Earlier unreadable-original recovery copy remains untouched; future/corrupt saves cannot use reset to bypass validation.

Final-source433 tests/163 checked files/zero diagnostics/9 routes;48 restart,54 recovery and27 prior storage browser cases pass. Real fresh Q01–Q04 → Pause → reset Cancel → confirmed reset → reload/Continue at1500/0 missions/0 placed birds/tick0 → restore Cancel → confirmed backup restore → reload/Continue with exact original six visible groups plus saved tick. Actual cold-tab reopen,1×/10× pause, ID/EN, stale-tab reset/resume locks and navigation verified. Native IAB tab switching produced no hidden signal: **native background remains UNRUN**; explicit injected visibility/pagehide listener cases pass and are labelled. PAUSE-503-01 (care dialog stopped simulation but displayed running) fixed and verified natively plus in all3 fixture viewports. Single session/RAF/subscriber,3 remounts,117 stable fields and zero disposed resources. Source `ffec32a23b89c9454604240b4647fccde4a2e6e934adee3efc97afde14d73e00`, build `d183c7cad874a9a8b546ec5cdd72098858c04e6f02f73387e9816c37189611f1`, run `20261101T212337Z-ff879b47`.

Artifact-writer closure retained a previous container; raw mixed observations are preserved, and14 final native rows are selected unchanged by exact final entry-script identity, final labels and timestamp. Candidate rows are excluded; independent receipt/source/build checks pass. No candidate result relabelled by assumption. Eight actual screenshots, failures and CRC/SHA archives retained with bounded generated runs. First preview948,372 raw/252,656 gzip estimate; no network/FPS claim. Owned tabs/previews closed and ports4321/4322/4333/4334 free; previous native saves preserved. No push/deploy/Actions/login/grants/dependency changes. V1 **37/51 (72.55%)**, M5 **3/7**. M0-01/M4-07 stay partial;12 M7 deferred. Prior download cancellation stays **BLOCKED/UNRUN**, never retried. Physical devices, native background, whole browser-process restart, presentedFPS/GPU/network/full15min soak/human unaided/live remain UNRUN. Next **M5-04 responsive HUD/input**. Stop deadline remains **2026-11-02 01:00 UTC /08:00 WIB**, no automatic resume beyond it.


## M5-04 COMPLETE - 2026-11-01 UTC

Implementation `5be6cd84362caac65f16dce02a4f125e25468765` local only. [Responsive HUD report](M5-04_RESPONSIVE_HUD.md), [audit](qa/m5-04/independent-audit.json), [browser receipt](qa/m5-04/browser-receipt.json), [actual native/layout trace](qa/m5-04/hud-matrix.json). Four actual game tabs and compact authoritative status, bounded ID/EN Options/save disclosures, readable paused information with disabled mutation controls, contained panel scrolling/keyboard focus and pointer-safe world/toolbar separation. Desktop/landscape world beside tools, portrait world above tools; no new simulation/RAF or game-rule changes.

Final source: 438 tests/167 checked files/zero diagnostics/9 routes,57 HUD cases and 129 storage regressions pass. Three native fresh Q01-Q04 loops at desktop EN/portrait ID/landscape ID, exact reload/Continue, real reset Cancel/fresh/restore, native keyboard/PageDown and 16 settled size/language combinations pass.117 stable fields through context-loss retry / 3 remounts; zero released-resource leaks and empty uncapped native consoles. Source `7cc3c9b94b841914f76fe9fcc5577bb267c26b2fa56d4337039859dbae4d509e`, build `79b68f2fbd334ebcc0c4faaee601256427728e2e9507b37019c1e0593e44d352`, run `20261101T225427Z-898c4bd8`. Five actual screenshots, candidate failures/fixture corrections and byte-verified archives retained; final run/writer identity is separate. First preview973,664 raw / 257,577 gzip estimate, no FPS/network claim. Four whitespace-only blank-line findings are recorded as nonblocking format WARN, not passed. Owned tabs/previews closed, viewport reset/ports free; previous saves/source/media/requirements preserved.

V1 **38/51 (74.51%)**, M5 **4/7**; M0-01/M4-07 stay partial,12 M7 deferred. Actual download remains **BLOCKED/UNRUN** and was not retried; physical devices/native touch/background/browser-process restart/presentedFPS/GPU/network/full 15-minute soak/human unaided/live remain UNRUN. No push/deploy/Actions/login/grants/dependency change. Next **M5-05 full bilingual coverage/persistence**, respecting **2026-11-02 01:00 UTC /08:00 WIB** hard stop.


## M5-05 COMPLETE - 2026-11-01 UTC

Implementation `5b4b21cc46a4dd3482d0d15c4327cce555b6fe7e` local only. [Bilingual report](M5-05_BILINGUAL_UI.md), [audit](qa/m5-05/independent-audit.json), [native/language trace](qa/m5-05/language-matrix.json).382 entry plus196 panel messages retain matching ID/EN keys/placeholders; mixed ID terms/stale future-copy corrected, localized numeric/checkpoint formats and accessible names update live. Latest explicit manual choice takes priority over old game language through load/Continue/remount; fresh browser preference and valid game fallback remain. Existing journal/global navigation and game rules/schema/assets/dependencies unchanged. Four M5-04 whitespace findings resolved.

Final: 443 tests/170 checked files/zero diagnostics/9 routes;39 language plus 57 HUD / 129 storage cases pass. Three actual native Q01-Q04 flows, native inactive Settings ID overriding an old English save, exact reloads, ID Help/keyboard and 16 size/language combinations verified.117 stable fields through retry/3 remounts, no stale owned resources and empty uncapped native consoles. Source `bf989197c795ed935bb5d57668983d1ff19c0f4d00dc42125a674867afa91528`, build `6ef8b618b7a6ecd16c027c8df480c640004fd846daa8e58c83cdb52c2dac6189`, run `20261101T233501Z-11e5d1e5`. Native default EN observed; ID/non-ID browser defaults explicitly injected and labelled. Five original JPEGs, distinct immutable run writer, byte-preserved bounded evidence and three generated runs; owned tabs/servers closed and viewport reset.

V1 **39/51 (76.47%)**, M5 **5/7**. M0-01/M4-07 stay partial,12 M7 deferred. Recovery download **BLOCKED/UNRUN**, never retried. Physical devices/native touch/background/browser-process restart/presentedFPS/GPU/network/full 15-minute soak/human unaided/live remain UNRUN. No push/deploy/Actions/login/grants. Next **M5-06**, not started; parent dispatch required and hard stop **2026-11-02 01:00 UTC /08:00 WIB** remains.


## M5-06 PARTIAL — recovered checkpoint, 2026-11-02 UTC

[Settings checkpoint](M5-06_SETTINGS.md). Visual quality/reduced motion/Apply/Cancel preference slice recovered with 447 tests, typecheck/build/nine routes and 27 targeted browser cases. Audio/mute unfinished; full browser gate UNRUN. Laptop interruption left last native reload uncertain. V1 remains **39/51 (76.47%)**, M5 **5/7**; M5-06 stays unchecked. Owner preview4345 runs unchanged; future builds isolated. No push/deploy.


## M5-06 COMPLETE — 2026-11-02 UTC

Implementation `3b8d98263cf3dc7a032b1b973da698ee391bf561` (local only), following recovered partial checkpoint `2ad431479d1fc10d1590619aafdd4a1843a7979f`. [Settings/sound report](M5-06_SETTINGS.md), [independent audit](qa/m5-06/independent-audit.json), [source-bound browser matrix](qa/m5-06/final/matrix.json). Functional Help, Auto/Low/High, reduced decorative motion and original gesture-activated ambient sound/mute; bilingual Apply/Cancel/Escape, durable/device preference fallback and truthful errors. Initial loading Settings gate, one AudioContext independent of simulation, pause/background/close cleanup, audio-on reset preserving preferences. No external samples/microphone/new dependency/permissions.

Final source `8c722eec8ae4be97c9a78f872d26d0acd61b2f3bb56eedfc5df0982a7c426faa`, isolated build `b566df0fdbea675809fa75297d4cbf692ae327a167fb259cd562d95b64665600`, run `s20261102T032631Z`: 454 tests / 179 files/zero diagnostics,9 routes;27 targeted browser cases plus 8 explicit checks/35 observations, native actual habitat/save/reload/Continue, both mute/quality values, Help/Escape, reset Cancel/fresh, true audio graph/signal, unsupported fallback and 3 close/Continue cycles. Audio nodes/contexts return to 0; uncapped native consoles empty. Generic 6-case browser verdict remains UNRUN; targeted gate evidence is explicit. Three final screenshots, bounded historical archives and SHA/CRC-verified retention. Shell + renderer 988,288 raw/262,587 gzip estimate, no network/FPS or physical-audibility claim.

Owner 4345 / PID18816 and earlier dist remain unchanged/running; only QA contexts closed. Runtime retention marking unsupported (`browser.user unavailable`), owner tab last verified present, no navigation/reset/close. M0-01/M4-07 stay partial; physical/native background/speaker/FPS/soak/unaided/live remain UNRUN. Recovery download BLOCKED/UNRUN, never retried. No push/deploy/Actions/login/access change. V1 **40/51 (78.43%)**, M5 **6/7**; 12 M7 deferred. Next **M5-07** after parent review.

## M5-07 PARTIAL - engineering UX fixes verified, 2026-11-02 UTC

Implementation `768e030836a197abe3b919bb9d7429e513b40071` local only. [Usability audit](M5-07_USABILITY_AUDIT.md), [independent evidence](qa/m5-07/independent-audit.json), [fresh native results](qa/m5-07/native/results.json). Direct Q02 bird-needs inspection, safe read-only paused inspection/dismissal/care navigation, visible nondestructive care targeting, clearer secondary reserve/edit purpose, concise care intro, player-facing sanctuary/start wording and Help sound text; English Q04 spacing corrected. Simulation/economy/save rules unchanged.

Final source `0783a7670100a1b738b128038aebccf7a428d22942d78473ad77272e924b69bc`, isolated build `b57979507f5618a9dc060eea3303b7c5a045bcdc8b6577c7176006fb928eda30`, run `s20261102T050815Z`:454 tests,181 checked files/zero diagnostics,9 routes,27 usability +27 visual/settings browser cases. Three fresh native desktop/portrait/landscape journeys reach Q01-Q03 via actual construction/care/visitors, paired ID/EN Help/Settings and exact reload/Continue; no fixture/time injection in those product journeys. Q04 completion not claimed in these final fresh runs. Empty uncapped native console observations, actual canvas screenshots, byte-preserved failures and CRC/SHA archived candidates. Generic browser-template gate remains UNRUN.

**Exact acceptance gap:** canonical M5-07 requires unaided user-test notes. The familiar agent walkthrough is not an independent human study; no human participant/outcome evidence exists. [Blank study template](qa/m5-07/HUMAN_STUDY_TEMPLATE.md) stays UNRUN; do not ask owner to test now. M5-07 remains unchecked, V1 **40/51 (78.43%)**, M5 **6/7**. Five guided path tiles still require ten safe Preview/Confirm clicks; no unmeasured human timing/click claims.

Owner4345/PID18816/build/saves untouched, HTTP200; only isolated QA closed and ports freed. Five loose screenshots, bounded history archive, three generated runs; original media/requirements and historical receipts preserved. Recovery download BLOCKED/UNRUN, no retry or permission prompts. Physical/native background/FPS/GPU/network/full populated15-minute soak/unaided/live remain UNRUN. M0-01 and M4-07 partial,12 M7 deferred. No push/deploy/Actions/login/grants. Next independent **M6-01 profiling** after parent review, while M5-07 human portion remains pending.

## M6-01 PARTIAL - populated profiling and CPU optimizations verified, 2026-11-02 UTC

Baseline instrumentation `cc6b96b`; optimization **`b8c81c594ff8bd564751f19b67708b48465cb56f`**, local only. [Performance report](M6-01_PERFORMANCE.md), [audit](qa/m6-01/independent-audit.json), [all paired metrics](qa/m6-01/comparison.json).42 populated5s windows:18 baseline +18 final +6 final desktop repeat, High/Low/Auto and1x/10x on desktop/portrait/landscape. Actual asynchronous GPU elapsed queries and callback/render-submit CPU recorded, explicitly not presented FPS or physical Android. Identical initial canonical save and measured probe bytes verified. Repeated state reads/full-save clones and unchanged DOM rebuilding reduced; no simulation/economy/mission/save/visual rule changes or new RAF.

First paired callback CPU p95 is lower in18/18 samples (descriptive11.8%-60.3%, no confidence claim). Desktop High10x15.10 ->11.80ms, final repeat7.30ms. Desktop GPU p95 instead1.980 ->4.368ms, repeat4.451ms despite same buffers/draw counts: cause unresolved, **no GPU improvement or target-FPS pass**. Optional frozen-baseline repeat BLOCKED/UNRUN after runtime URL policy rejected the browser-generated data: connection-error page on QA tab46. No alternate route/browser/permissions retry. Independent allowed final QA continued; error-tab Close remains UNRUN.

Final run `s20261102T055027Z`, source `43efdca0cbe8dec48932b9e64f2c0678c3a840025a1a31b3ab4912bf480d781b`, build `2c50f848ba606685725665a2a72826c56f183939902c73c9f36090075307188d`:457 tests,183 checked files/zero diagnostics,9 routes;73 targeted browser cases including context loss/retry/remount/reset/restore and three-viewport UI/graphics. Native fresh Q01-Q04 with actual care recovery, ticket income and exact reload/Continue at tick10580/1125ZC/4missions/2birds; real desktop/ID Low portrait/EN High landscape pixels.42 disposed profile sessions return owned counts to0, zero timed dropped simulation ms. Generic browser-template gate remains UNRUN; samples are not a15-minute soak or leak proof.

**M6-01 remains unchecked** for presentationFPS/physical Android and unresolved controlled GPU attribution. V1 **40/51 (78.43%)**, M6 **0/8**; M0-01/M4-07/M5-07 partial,12 M7 deferred. Original source/media/saves/requirements and failed receipts preserved; exact generated snapshot CRC/SHA archived before removal, two generated runs and three screenshots retained. Owner4345/PID18816/build/saves untouched, HTTP200; owned QA servers stopped, normal QA tabs closed, error tab46 cleanup explicitly UNRUN. Recovery download not retried. No push/deploy/Actions/login/access changes. Next **M6-02 payload/memory** after parent review.


## M6-02 COMPLETE - measured payload, memory lifetime and recovery, 2026-11-02 UTC

Implementation **`54aa5b87e48f982f8ce93244386e7ae956d9a1fb`**, local only. [Report](M6-02_MEMORY_PAYLOAD.md), [audit](qa/m6-02/independent-audit.json), [final soak](qa/m6-02/soak/final.json). First-party shell 354,769raw, first play 990,113raw/263,201gzip9 estimate; five-file graph includes favicon, external fonts/headers/production network excluded. Actual native Continue requests lazy renderer once after entry. Recorded body hashes bridge fixture-only revision to final compiled files. Existing minification/lazy loading retained; no speculative chunk split or dependency change.

Verified unnecessary sample-array allocation removed for unstarted audio:10,000 inspections,20,480,000transient bytes ->0 of those buffers with identical status; real signal/close/Continue/disposal and injected unavailable audio pass. MEM-602-01 fixed: recovered visual/audio settings no longer overwritten by stale defaults; explicit menu precedence and complete payload/original preservation verified. Earlier failures and corrected fixture assumptions retained.

Final run `s20261102T080144Z`, source `fbfd5750dd265ae81847d3f2d82d087f5493de986daf295abf9e783b65a25027`, build `5ce3d9d208270702ee9c71b77e0ed45a3367aa672f6377de6eda06527579d0c7`:457 tests,186 checked files/zero diagnostics,9 routes,63 targeted browser cases plus explicit renderer/audio checks. Actual compiled care/purchases/speed/pause, ID portrait/EN landscape/desktop and exact native reload/Continue. Generic browser template UNRUN; no physical Android/native-background/speaker/presentedFPS claim.

Final source-app soak **900.675s real continuous wall time**, 956.237s total with preconditioning;8 initial remounts +final exact Continue,10 disposed sessions, max1 renderer/RAF and final0, all owned counters/cleanup0. Real care/settings,1x/10x/1x,4 missions/2 birds, 2 ledger compactions, no dropped sim time/exports. Heap fluctuates, not tab-exclusive retained/GPU memory or a universal leak proof; minified compiled smoke is separate. Earlier healthy pre-fix soak remains labelled baseline.

Owner4345/PID18816/build/saves untouched; permitted QA closed, newest3 runs retained after CRC/SHA archive. Recovery download BLOCKED/UNRUN and old QA46 closure UNRUN, neither retried. M6-01 GPU risk unresolved; M0-01/M4-07/M5-07/M6-01 stay partial. V1 **41/51 (80.39%)**, M6 **1/8**, M7 12deferred. No push/deploy/Actions/login/grants. Next **M6-03** after parent review.


## M6-03 PARTIAL - black-box matrix and UI fixes, 2026-11-02 UTC

Implementation **`9c1d6f36c255175877cf778a114befdf024e07e8`**, local only. [Report](M6-03_BLACK_BOX_QA.md), [matrix](qa/m6-03/acceptance-matrix.json), [audit](qa/m6-03/independent-audit.json). Fresh native desktop EN and portrait ID reach Q01-Q04; independent EN landscape Q01/model, paired orientation/language, real construction/cancel/delete/refund/Undo, care/depletion/recovery/visitors/tickets, settings, exact reload/cold-tab, reset Cancel/confirm and exact backup restore. No native state/clock injection; source-unaffected journeys are explicitly bridged, not relabelled final-source reruns.

BB-603-01 fixed: repeated loading refresh erased restored Build access cache although save/world retained6path cells/connection. Transition-only resets preserve initialization events; final3nativeContinues and addedHUDcase agree. BB-603-02 stale model-welfare future copy corrected EN/ID. QA-603-01 keeps strict live typecheck while excluding immutable archived receipt scripts; all173 resolved live files preserved.

Final `s20261102T091845Z`, source `bf1db4be44ad9d776020d2ce4ae8d26f9dfcd67208787704a1dda399625c6e56`, build `24c50c02179cddb4ef329d0c3c091ed97f10881fc15815e4ec489eab4a9205d5`:457 tests,182checked files/zero diagnostics,9routes,48affected browser cases. First source-HUD import failure retained with unproven cause; later serial20PASS and compiled native3PASS. Full raw history CRC/SHA archived,3generated runs kept. Native viewport capture limitation at1920 and known lower UX issues recorded.

**Actual Android/real touch/distinct Chrome/Edge/Safari device matrix UNRUN**, so M6-03 remains unchecked; agent walkthrough is not a human study or release pass. V1 **41/51 (80.39%)**, M6 **1/8**. M0-01/M4-07/M5-07/M6-01 partial; GPU risk unresolved. Owner4345/PID18816/build/saves untouched/HTTP200; normalQA closed before09:45UTC. Prior download BLOCKED/UNRUN and QA46 close UNRUN, no retries. No push/deploy/Actions/login/grants. Hard stop10:00UTC/17:00WIBtoday; nextM6-04 only after parent dispatch.


## M6-04 COMPLETE - 2026-11-02 UTC

Implementation **`9e7990ed23bbff3fe57ba9a76b1480d43e2aaa5c`**, local only. [Report](M6-04_WHITE_BOX_INVARIANTS.md), [automated audit](qa/m6-04/independent-audit.json), [acceptance mapping](qa/m6-04/acceptance-matrix.json). Fixed reentrant clock/frame accounting and unrelated-edit visitor backtracking, with7 new regression cases and independent combined balance/topology oracles. Three1500-tick schedules each complete Q01-Q04,5 tickets,3 journal folds,360 edit operations and6 codec resumes with full-state/event equality across1x/10x partitions.

Final `s20261102T125154Z`:464 tests,184 checked files/zero diagnostics,9routes;20HUD+19recovery browser integration cases,0exports. Native compiled actual purchase/Pause/10x/reload/Continue preserves1habitat/1200ZC/10x, desktop/portrait/landscape screenshots; no fresh final-source full-loop/physical-device claim. Source `4fa4e01cb3534645a9d23a1cbcb06dd1291102756cd015e869e69f6825f11995`, build `370f59c574e63db5a4196a7fba86afd7b8ad5eee6ab3dbd7b7d6a76d5bd9155a`. Original failed reproductions/fixture mistakes retained; M6-03 initial import failure cause remains unproven. Generic browser-template gate UNRUN.

V1 **42/51 (82.35%)**, M6 **2/8**. M0-01/M4-07/M5-07/M6-01/M6-03 remain partial; GPU risk and native/physical/recording/human gates persist. Owner4345/PID18816 already absent at initial check; no restart/tab/save access, olddist exact unchanged. Owned QA tabs/servers closed, viewport reset and ports free. Blocked download/QA46 not retried. No push/deploy/Actions/login/grants. Next **M6-05**, await parent review/dispatch; earlier stop superseded by explicit resume.
