# Zoom per kandang

Implementasi untuk permintaan 15 November 2026. Ruang lingkup mengikuti wawancara pengguna: pilih kandang, tekan **Zoom kandang**, lalu mainkan kandang itu sendiri sambil simulasi seluruh zoo tetap berjalan. QA awal dilakukan lokal. Pada tindak lanjut 15 November, pengguna secara eksplisit mengotorisasi deployment ke `myzootwin.com` serta pemeriksaan semua kandang pada desktop dan ukuran HP, secara otonom tanpa tes yang meminta konfirmasi.

## Perilaku

- Mendukung Macaw Aviary, Elephant Grove, Lion Savanna, Giraffe Plains, dan Zebra Grasslands yang sudah dibangun, termasuk kandang yang belum berpenghuni.
- Pilihan pada pagar, tanah, satwa, atau fasilitas di dalam kandang dapat menunjukkan tombol Zoom kandang. Resolusi menggunakan ID dan sel kandang aktual, termasuk aviari pada simpanan lama.
- Kandang terpilih beserta isi, tanah, tanaman, dan pagarnya tampil sendiri. Jalur dan pengunjung di luar kandang disembunyikan.
- Kamera memakai framing kandang dan zoom relatif 100–300%, geser terbatas, serta putaran 45°. Reset menampilkan seluruh kandang aktif. Batas kamera memperhitungkan tinggi kandang/satwa dan ukuran layar.
- Tombol reset ringkas **Utuh / Fit** mempertahankan nama aksesibel yang menjelaskan fungsinya. Pada HP tegak, mode zoom memberi porsi layar lebih besar pada kandang sambil mempertahankan panel perawatan yang dapat digulir.
- Panel Misi, Rawat, dan Bangun disaring menurut kandang. Saldo, pengunjung, dan kontrol sesi tetap untuk seluruh zoo. Pembangunan fasilitas dan isi ulang memakai validasi, biaya, dan penyimpanan yang sudah ada.
- Tombol Kembali ke zoo memulihkan kamera zoo sebelumnya. Tombol ini dapat dipakai saat permainan dijeda. Escape pada dunia membatalkan preview aktif terlebih dahulu, kemudian keluar dari mode zoom. Dialog dan kontrol panel mempertahankan penanganan Escape masing-masing.
- Jalur dan perluasan dilakukan melalui tampilan zoo. Kontrol panduan lama yang memusatkan kamera di luar kandang keluar dari mode zoom terlebih dahulu.
- Mode detail Makaw tetap merupakan fitur tersendiri. Membukanya mengakhiri mode zoom agar kebijakan jeda studio dan tampilan kandang tidak bertumpuk.
- Muat ulang/pemulihan renderer dimulai pada tampilan seluruh zoo. Mode kamera tidak ditulis ke skema simpanan.

## Implementasi

`src/game/render3d/habitat-focus.ts` menyediakan resolusi pemilik kandang, batas framing, dan mask tampilan yang dapat dipulihkan. Empat bidang clipping pada koordinat dunia memotong terrain dan mesh gabungan di batas kandang; kelompok satwa serta mesh milik kandang lain disembunyikan. Bidang yang sama berlaku pada pass bayangan. Visibilitas dipulihkan sebelum setiap sinkronisasi scene; pengaturan material dipulihkan saat keluar atau dispose.

`camera-controls.ts` menyimpan kamera zoo sebelum masuk, lalu memakai batas kandang aktif. `camera-navigation.ts` mendukung inset lokal agar kandang kecil 2 × 2 dan target kamera yang ditinggikan dapat digunakan tanpa mengubah kebijakan navigasi zoo.

`scene-picking.ts` menyaring mesh yang tidak terlihat dan menolak hit di luar mask. Preview fasilitas tetap memakai koordinat serta validasi dunia asli. Perintah perawatan untuk spesies lain ditolak saat fokus aktif. Tidak ada salinan simulasi, penggantian satwa, pemindahan fasilitas, atau perubahan saldo akibat pergantian mode.

`src/game-entry/habitat-focus-panel.ts` mengatur tombol, judul kandang, deskripsi aksesibilitas, dan penyaringan panel. CSS dimuat dari komponen Astro agar pencatatan dependency runtime TypeScript tetap dapat memeriksa seluruh modul. Label tersedia dalam bahasa Indonesia dan Inggris.

## Pengujian dan bukti

Pengujian kamera mencakup kelima kandang pada 1366 × 768, 360 × 780, dan 780 × 360, dengan delapan arah kamera. Pengujian juga memeriksa batas pan, pemulihan kamera, seleksi, clipping/bayangan, pemulihan material, dan integritas dunia.

Matriks browser menggunakan komponen produk dan renderer asli pada origin loopback dengan database IndexedDB UUID khusus QA. Data awal lima kandang merupakan fixture sintetis; slot pembangunan disiapkan dengan perintah sumber asli. Ini tidak menjadi bukti alur membuka seluruh kandang dari permainan baru.

Suite integrasi mengirim DOM/PointerEvents yang dilabeli sebagai input injeksi melalui kontrol produk. Pemeriksaan visual memakai screenshot piksel WebGL asli. Ukuran HP merupakan viewport browser, bukan perangkat Android/iPhone fisik. Pengujian tidak mencakup Safari/iOS, sentuhan fisik, atau pembacaan layar bersuara.

Hasil akhir, ukuran viewport, transaksi pembangunan/perawatan, dan screenshot disimpan di `docs/qa/habitat-focus-20261115/`. Percobaan awal yang gagal dipertahankan secara terpisah. Pengujian unduh/unggah, autentikasi, dan alur yang meminta konfirmasi pengguna tidak dijalankan.

Baseline inventaris visual lama tetap utuh. `tests/fixtures/habitat-focus-visual-extension.json` mengikat tepat empat modul kamera/picking/mask yang berubah. Factory satwa, lingkungan, dan pencahayaan lain tetap dilindungi oleh pemeriksaan baseline sebelumnya. Kamus baru ikut pemeriksaan kesetaraan kunci dan placeholder dua bahasa.

### Hasil akhir

Build browser akhir: `zoom-20261115-g`, fingerprint sumber `1fec641f9530a98fc11ce15fba302f55558e68f099a8711936b34644ce244f50`. Verifikasi akhir memastikan sumber tidak berubah sejak build.

- Regresi lengkap: **1.099 lulus, 0 gagal** pada run `zoom-20261115-d`.
- Setelah penambahan dua kasus tepi dan penyempurnaan layout, **50 pengujian terarah lulus** pada sumber akhir. Angka ini bertumpang tindih dengan suite regresi dan tidak dijumlahkan sebagai pengujian unik.
- `astro check`: **0 error, 0 warning, 0 hint**. Build produksi terisolasi menyelesaikan **10 halaman**.
- Browser: **165/165 pemeriksaan lulus**, yaitu 55 pada setiap ukuran desktop, HP tegak, dan HP mendatar. Seluruh lima kandang diuji membangun fasilitas dan mengisi ulang; setiap profil berakhir dengan simpanan valid, satu subscriber simulasi, serta nol bidang clipping yang tertinggal setelah kembali ke zoo.
- **15 screenshot kandang** diperiksa visual; **8 skenario tambahan** meliputi Escape, prioritas pembatalan preview, keluar saat jeda, studio Makaw, bahasa Inggris, context loss, Retry, dan cold reload.
- Cold reload mempertahankan tick, saldo, lima habitat, dan 14 satwa pada fixture. Tidak ada migrasi atau reset progres akibat mode kamera.

Lihat [laporan QA](qa/habitat-focus-20261115/REPORT.md) dan [verifikasi terstruktur](qa/habitat-focus-20261115/verification.json) untuk pemisahan metode, log, dan bukti. Hasil tersebut merekam verifikasi lokal. Rilis produksi selanjutnya memakai jalur GitHub `main` → Cloudflare Pages `myzootwin-com`, dengan build `npm run build` dan output `dist`. Hanya output produk yang dipublikasikan; lab/fixture QA tetap di luar output publik. Status deployment dan hasil pemeriksaan live dicatat terpisah setelah deployment selesai.

## Mengulang QA

```powershell
npm test
npm run check
node --experimental-strip-types scripts/qa/habitat-focus/build.mjs zoom-qa-unique-id
node scripts/qa/habitat-focus/serve.mjs zoom-qa-unique-id
```

Build membuat output terisolasi di `.qa/habitat-focus/<id>/`, menolak penggunaan ulang ID, dan mencatat fingerprint sumber. Server hanya mendengarkan `127.0.0.1` pada port kosong yang dicetak. Buka URL itu melalui browser pengujian, gunakan Lanjutkan lalu Lanjut bermain, dan jalankan tombol **Run focused integration checks** pada setiap ukuran viewport. Tombol **Select test ...** membantu inspeksi visual melalui input pointer injeksi ke kanvas asli; tombol **Zoom kandang** dan **Kembali ke zoo** tetap kontrol produk sebenarnya. Ketik `stop` pada sesi server untuk menutup server milik QA.
