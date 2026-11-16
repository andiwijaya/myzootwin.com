# Audit seluruh tombol panel HP

Tanggal: 16 November 2026. Status: **selesai dan live**, seluruh gate lokal serta pemeriksaan domain utama lulus.

## Perilaku yang diperbaiki

Transaksi dan penyelesaian dialog mempertahankan panel aksi serta konteks kandang yang dipilih. Navigasi yang secara eksplisit berlabel Lihat/Fokus/Rencanakan tetap dapat menampilkan tujuannya.

- Tamu: membuka atau menutup gerbang tidak lagi memfokuskan dan menggulir halaman ke kanvas.
- Rawat makaw: konfirmasi hapus makanan, air dan tempat istirahat mempertahankan panel; reserve/welcome serta konfirmasi/batal fasilitas tidak lagi mengirim fokus ke kanvas.
- Bangun gajah: tombol arah, batal dan konfirmasi mempertahankan panel. Pembaruan fasilitas setelah pembelian tidak lagi membuka Rawat dan menggulir ke fasilitas secara otomatis.
- Dialog hapus generik: review dari Rawat tetap berada di Rawat; penolakan menampilkan alasan di dekat fasilitas. Batal mengembalikan fokus ke pemicu/panel dengan `preventScroll`.
- Placement/jalur: konfirmasi, batal, Escape, Undo dan hapus seleksi tidak lagi mengembalikan fokus ke kanvas. Mode studi makaw mempertahankan panel saat menjeda animasi studi.

Implementasi produk terbatas pada `src/game-entry/preview-panel.ts`, `hud-layout.ts`, dan `elephant-care-panel.ts`. Harness dan fixture audit berada di `scripts/qa/habitat-focus/` dan tidak ditambahkan sebagai rute produksi.

## Metode dan batas bukti

Audit memakai UI game, renderer dan IndexedDB asli dengan save V5 sintetis dalam database UUID terpisah. Transaksi klaim, pembelian, isi ulang, hapus dan Undo melalui handler UI sebenarnya. Pengujian ini tidak membuktikan seluruh progres unlock dari awal; fixture menyiapkan kondisi yang diperlukan untuk menampilkan setiap keluarga tombol.

Pemeriksaan menginventarisasi empat panel di Zoo dan kelima kandang. Aksi yang harus menetap diperiksa terhadap menu/kandang yang dipilih, panggilan scroll/fokus aplikasi, posisi panel serta perpindahan menu tertunda saat simulasi berjalan. Pengayaan yang masih terkunci diperiksa sebagai kondisi terkunci dengan penjelasan dan Batal; fasilitas yang tersedia harus benar-benar tercatat setelah pembelian. Penolakan transaksi yang sah ketika dunia berubah harus menampilkan alasan dan dapat ditinjau ulang.

Saat konten preview/dialog menghilang, browser dapat menyesuaikan scroll melalui anchoring atau batas tinggi dokumen yang baru. Audit merekam penyesuaian alami ini terpisah dari scroll paksa oleh aplikasi. Panel harus tetap terlihat, tab/kandang tetap dan aplikasi tidak boleh memanggil scroll ke kanvas. Native Escape pada preview jalur menggeser scroll dokumen 88 px ketika konten runtuh; Bangun tetap terlihat dan kanvas tetap di atas viewport. Pengujian dialog Rawat serta Enter buka/tutup gerbang mempertahankan scroll tanpa perubahan.

Viewport 360 × 780 dan 390 × 844 adalah emulasi ukuran browser. Tidak ada klaim pengujian pada perangkat HP fisik. Profil QA sebelum jeda menggunakan in-app browser; lanjutan menggunakan Chrome. Bukti bundle dan kesamaan byte produk setiap kandidat dicatat dalam `verification.json`.

## Validasi

- 209/209 tes regresi terarah lulus, 0 gagal/batal/skip/todo (`tests.tap`).
- Astro check final: 689 berkas, 0 error, 0 warning, 0 hint (`check.log`).
- Build produksi final: 10 halaman (`build.log`).
- Matriks browser: **16 profil, 1.416/1.416 pemeriksaan dan 405 aksi lulus**, termasuk hibah/pembangunan, klaim misi lima spesies, keeper, refill dan remove/confirm/cancel/Undo, tombol arah dan seluruh empat panel di enam konteks.
- Regresi kamera/menu: **155/155** lulus pada 360 px; termasuk zoom/putar/geser/pinch, batas kamera, berpindah kandang, empat tab setiap konteks, serta save tetap saat jeda (`controls-360.json`).
- Native klik/keyboard: **9/9** lulus. Enter/Escape untuk dialog Rawat, gerbang Tamu, Escape preview Bangun, panduan kamera Misi, satu kanvas, jeda dan console bersih (`native-keyboard-360.json`). Total **1.580 pemeriksaan browser**.
- HTML `/play/` dan tujuh berkas `_astro` kandidat r10/r14 identik byte demi byte dengan dist final. Perbedaan kandidat hanya pada harness QA; provenance per profil ada di `verification.json`.
- `before-full-390.json`, `before-slots-390.json` dan `intermediate-*.json` mempertahankan bukti negatif/intermediate apa adanya; tidak termasuk release gate. Profil 360 px di Chrome sempat dijeda oleh lifecycle background dan diulang sampai lulus dalam IAB. Asumsi awal keyboard bahwa fokus panduan harus masuk scope kandang dikoreksi: kontrol tersebut memang menampilkan area pada kamera zoo bersama; bukti final memeriksa perpindahan kamera sebenarnya.

## Publikasi

Rilis commit `dccada61fc0036976e218f718302ef8082f6bc2e`, Cloudflare Pages `4a487a31-de08-4f26-bf64-f90df2f08343`, berhasil **16 November 2026 pukul 20.16.34 WIB**. Terminal check GitHub/Cloudflare menunjukkan success untuk SHA yang tepat (`deployment.json`).

**130/130** HTML/JS/CSS/GLB/aset runtime cocok dengan dist final (`live-body-check.json`). Native UI memuat entry `/_astro/PlayEntry.astro_astro_type_script_index_0_lang.OGUlXuBE.js` yang sama. Pemeriksaan produksi **146/146** lulus: 48 pilihan panel di enam tujuan pada dua ukuran HP, tab/scope dan posisi panel stabil setelah penundaan, satu kanvas, tidak meluber, console bersih, serta saldo dan populasi tetap (`live-native.json`).

Campaign pemilik tetap **4.381 ZC** dan **14 satwa** selama navigasi dijeda, dan ditinggalkan pada Zoo dalam keadaan jeda. Tidak ada belanja, refill, klaim, reset, transfer atau injeksi save manual pada produksi. Transaksi nyata diuji di sesi QA terisolasi yang produknya identik. Bukti visual: `live-mobile-390.jpg`. Tab QA ditutup, viewport dikembalikan, browser tetap tersembunyi dan server QA milik sesi ini dihentikan.
