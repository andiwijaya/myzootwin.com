# Posisi halaman setelah menutup preview Bangun

Tanggal 16 November 2026. Status: **selesai dan live**, seluruh gate lokal dan pemeriksaan domain utama lulus.

Pengguna meminta posisi halaman benar-benar tetap setelah konfirmasi atau batal pada kelima kandang, termasuk penyesuaian scroll alami yang sebelumnya masih diizinkan. Pengujian kali ini memakai Codex internal browser seluruhnya.

## Penyebab dan perbaikan

Preview yang ditutup menyusutkan tinggi panel. Browser lalu menggeser anchor atau membatasi scroll ke tinggi dokumen yang lebih pendek. Baseline 360 px mereproduksi Batal bergeser 127-287 px pada lima kandang dan konfirmasi pembelian 181-331 px. Escape jalur bergeser sekitar 145 px. Bukti negatif tersimpan di `before-*.json`.

`build-scroll-stability.ts` mempertahankan tinggi kartu/katalog/tapak preview, panel Bangun dan shell sebelum aksi pada layout HP, serta menonaktifkan scroll anchoring selama ruang tersebut dipertahankan. Ini menjaga posisi dokumen dan konten setelah preview. Tidak ada loop pemulihan scroll atau penguncian input. Gulir manual tetap berfungsi. Ruang dan nilai style awal dipulihkan ketika pengguna meninggalkan Bangun, berpindah kandang, mengubah lebar layar, atau komponen dibuang. Integrasi melalui lifecycle HUD di `hud-layout.ts`.

## Pemeriksaan

Matriks: 360 × 780 dan 390 × 844, masing-masing Batal/Konfirmasi di tengah serta paling bawah halaman. Lima kandang diuji pada setiap profil dengan transaksi nyata; Escape jalur ditambahkan pada profil Batal. Simulasi dan animasi tetap berjalan selama pengukuran. Setiap kasus mengukur posisi scroll serta batas bawah kartu/katalog/preview langsung, frame-frame setelah klik, setelah penyimpanan dan sesudah gulir manual; tidak ada pengecualian untuk anchoring atau bottom clamping.

Save QA memakai UUID IndexedDB pada origin loopback terpisah dari campaign pemilik. Fixture final menyiapkan gerbang tertutup melalui model game sebelum snapshot V5 untuk mengisolasi quote dari transaksi tiket otomatis; klik Batal/Konfirmasi dan pembelian tetap melalui handler UI game. Oracle final memakai kontrol aktif terbaru. Kandidat awal hanya menjaga posisi scroll tetapi masih menggeser kartu di bawah preview; bukti kandidat dan percobaan setup UI awal disimpan di `intermediate-pane-only/`, tidak termasuk gate rilis. Kandidat final juga menjaga ruang kartu/preview dan mengukur geometri konten tersebut.

- Matriks akhir: **8 profil, 460/460 pemeriksaan, 44 kasus**, termasuk **20 pembelian nyata**. Scroll dan posisi konten di bawah preview: **maksimum 0 px**. Bukti per profil disimpan dalam `cancel/confirm-middle/bottom-360/390.json`.
- Regresi kamera/menu: **155/155** lulus (`controls-390.json`).
- Native klik Batal, Escape berulang, Page Up, pembersihan style, jeda dan console: **9/9** lulus (`native-build.json`). Tiga pembatalan menjaga scroll **4.258,6665 px** dan kartu berikut **493,3229 px** di layar. Tinggi halaman tidak bertambah. Page Up bebas dan tidak memantul kembali.
- Total **624 pemeriksaan browser** lulus. **49/49** tes regresi terarah, Astro check **691 berkas/0 error/0 warning/0 hint**, build **10 halaman** lulus.
- HTML produk dan tujuh berkas `_astro` identik dengan kandidat QA final `build-scroll-r3`. Provenance/fingerprint dicatat di `verification.json`.

Bukti visual native sebelum/sesudah: `native-preview-before-390.jpg` dan `native-preview-after-390.jpg`. Viewport browser bukan bukti pengujian perangkat HP fisik. Kandidat awal dan asumsi waktu Page Up sebelum animasinya selesai dipertahankan dalam arsip `intermediate-pane-only/`; tidak termasuk gate final.

## Rilis

Commit `642f16f2e3f95df8b3e1cc85773c20743766e280` berhasil dideploy oleh Cloudflare Pages `9e5edd5a-21b2-44cc-af59-2bd05b178d8f` pada **16 November 2026 pukul 21.12.53 WIB**. GitHub check terminal menunjukkan success untuk SHA yang tepat (`deployment.json`).

**130/130 berkas produksi** cocok dengan dist final (`live-body-check.json`). Native halaman domain utama memuat entry final yang sama. **146/146 pemeriksaan live** lulus: Misi/Rawat/Tamu/Bangun di Zoo serta kelima kandang pada dua viewport, menu dan posisi halaman stabil setelah pembaruan tertunda, satu canvas, tanpa overflow, serta console tanpa warning/error (`live-native.json`). Screenshot: `live-mobile-390.jpg`.

Campaign pemilik dipertahankan pada **4.381 ZC dan 14 satwa** selama navigasi dijeda, lalu dikembalikan ke Zoo dalam keadaan jeda. Pembelian/penutupan preview diuji melalui UI sebenarnya pada save QA terisolasi dengan produk yang identik; tidak ada pembelian, refill, klaim, transfer, reset atau injeksi save manual di domain produksi. Tab QA ditutup, viewport dikembalikan dan seluruh server QA milik sesi ini dihentikan.
