# MyZooTwin — UI mengikuti MyFarmTwin

Tanggal: 16 November 2026 WIB. Status: P1–P5 selesai dan live.

Pengguna menyetujui eksekusi P1–P5 secara autonomous, pembaruan checklist pada setiap milestone, dan deployment langsung setelah seluruh pemeriksaan lulus. Referensi: screenshot pengguna serta inspeksi live MyFarmTwin pada HP 390 × 844 dan desktop 1280 × 720. Referensi sumber yang benar-benar dimuat: `https://myfarmtwin.com/play/cozy/style.css?v=f4ef8e109e0f476f`.

Keputusan UI: navigasi utama Zoo, Makaw, Gajah, Singa, Jerapah, Zebra. Misi, Rawat, Tamu, Bangun tetap menjadi panel aksi. Fokus kandang memakai dunia, controller dan simpanan yang ada. Ringkasan global menampilkan koin, satwa yang ditempatkan, tamu dan status simulasi; kesejahteraan tetap diberi cakupan spesies/individu.

## Tracking

- [x] Audit gambar, kedua situs live, struktur kontrol, parameter dan pengaturan.
- [x] Pilihan navigasi dikonfirmasi pengguna; otorisasi implementasi sampai rilis diterima.
- [x] P1 — Implementasi palet, tipografi, ikon, kartu, toolbar, header dan susunan HP/desktop; validasi visual masuk P4.
- [x] P2 — Implementasi enam menu, fokus kandang/terkunci, sinkronisasi scope, kembali/utuh serta pan kamera; regresi masuk P4.
- [x] P3 — Implementasi kartu kondisi/persediaan, katalog Bangun kontekstual, Misi/Tamu dan pengaturan konsisten; pemeriksaan alur masuk P4.
- [x] P4 — Regresi, typecheck/build, browser HP/landscape/desktop, ID/EN, jeda dan save.
- [x] P5 — Commit/publish, deployment sukses, verifikasi body/hash produksi dan native smoke.

## Kriteria penerimaan

- HP: dunia 3D → ringkasan empat bagian → enam menu (3 × 2) → toolbar kamera → CTA Tata zoo/kandang → Catatan Zoo. Desktop: dunia/kontrol kiri, panel detail kanan.
- Kartu krem/hijau pucat, teks hijau gelap, sudut membulat, ikon dengan label, sasaran interaksi minimal 44 px dan fokus keyboard yang jelas.
- Navigasi kandang yang belum dibangun menjelaskan syaratnya tanpa transaksi otomatis. Satu simulasi dan satu dunia tetap menjadi sumber kebenaran.
- Toolbar kembali memulihkan kamera zoo; Utuh membingkai area aktif. Pan memakai navigasi kamera asli dan batas area yang berlaku.
- Lapar/haus lebih rendah lebih baik; energi/kesejahteraan lebih tinggi lebih baik. Harga, stok, gating, validasi placement dan simpanan memakai handler asli.
- Perpindahan UI saat dijeda mempertahankan tick/saldo/stok/satwa; saat berjalan tidak membuat clock atau renderer tambahan.
- Misi/Rawat/Bangun mengikuti konteks; Tamu diberi label untuk seluruh zoo. Status simpan dan jeda tetap jelas.
- Tidak ada upload/download save, reset progres, atau dependency instalasi baru untuk QA.

## Catatan progres

- Mulai: checkout `codex/habitat-zoom-live` pada `ece32d2`. Perubahan dokumentasi audit GLB yang sudah ada dipertahankan. Source aplikasi belum berubah saat pencatatan awal ini.
- P1–P3: kerangka UI, enam tujuan, ringkasan jumlah satwa yang benar-benar ditempatkan, pan kamera asli, kartu empat indikator per individu, dan katalog fasilitas pada Bangun selesai dirangkai. Refill tetap di Rawat. Handler transaksi dan format save tetap memakai implementasi asli.
- Pemeriksaan awal menemukan kesalahan tipe pada integrasi panel; sedang diperbaiki sebelum pemeriksaan final. Build browser pertama `farm-ui-r1` berhasil. Uji regresi dibatasi dua proses agar penggunaan sumber daya terkendali. P4/P5 belum dinyatakan lulus.
- P4, build `farm-ui-r3`: **237/237 pemeriksaan browser lulus**, masing-masing 79 pada 1280 × 800, 390 × 844, dan 844 × 390. Setiap profil menguji lima kandang, navigasi jeda tanpa perubahan tick/saldo/populasi/stok, satu renderer, pan/zoom/putar/fit/kembali, pembangunan fasilitas dan refill berbayar, serta cakupan Tamu global. Tidak ada error pada receipt ketiga profil.
- P4: **6/6 pemeriksaan zoo baru/menu terkunci lulus**. Ringkasan menunjukkan nol satwa ditempatkan ketika dua makaw masih di cadangan. Tidak ada kandang atau transaksi otomatis.
- P4: label Indonesia/Inggris, Apply grafis Low + reduced motion, pemulihan Auto, cold reload dan fokus keyboard diperiksa melalui kontrol browser. Cold Continue mempertahankan tick **14.017**, saldo **3.637 ZC**, dan status jeda pada fixture. Target utama pada viewport 360 px berukuran sedikitnya 44 × 44 px.
- P4: typecheck akhir **0 error/0 warning/0 hint**, **42 pengujian terarah lulus**, build produksi **10 halaman**. SHA-256 HTML `/play/` identik antara kandidat `dist` dan build QA. Fingerprint keduanya: `d8858032cf9e9176fcf1b765f9a4e2db61bbca6a311d845c1e15cd84233bc4ec`. Regresi penuh final masih berjalan; P5 menunggu hasil tersebut.
- P4 selesai: regresi penuh pada sumber akhir **1.104/1.104 lulus**, 0 gagal, 0 dilewati. Context loss/Retry memulihkan tepat satu kanvas/subscriber serta mempertahankan progres dan jeda. Semua gate lokal lulus; P5 dilanjutkan ke commit, push produksi dan pemeriksaan live.
- P5: commit fitur `a3bbc99b0d64f0932f0f0b4bc71b7b2045eceef3` sudah diterbitkan ke `main` melalui push fast-forward. Deployment dan hash body live sedang diperiksa sebelum P5 ditandai selesai.
- P5 selesai: Cloudflare Pages deployment `78e41764-ed09-4f5a-be54-a65fab317d6c` berhasil pada **16 November 2026, 11:48:01 WIB**. Situs [myzootwin.com/play/](https://myzootwin.com/play/) memuat entry baru `DXVIRhsf` dan CSS `D3uKQHwP`. **130/130 body/hash** HTML, JS, CSS dan aset runtime cocok dengan kandidat QA.
- Pemeriksaan native produksi mencakup kelima menu satwa dengan **2 makaw, 2 gajah, 3 singa, 3 jerapah dan 4 zebra**; seluruh **14 kartu individu** menampilkan empat indikator. Satu kanvas, label Tamu global, katalog kontekstual dan menu HP tampil benar. Perpindahan menu saat jeda mempertahankan tick **96.185** dan saldo **4.381 ZC** pada kampanye browser internal. Tidak ada transaksi manual saat smoke live; console tidak memuat warning/error. Sesi ditinggalkan dijeda dan tab pemeriksaan ditutup.

## Bukti

Referensi inspeksi: `.qa/ui-reference-plan-20261116/reference-observation.json` dan `myfarmtwin-mobile-reference.jpg`. Bukti implementasi, pengujian, screenshot dan rilis: [laporan QA](qa/farm-ui-20261116/REPORT.md), [verifikasi](qa/farm-ui-20261116/verification.json), [deployment](qa/farm-ui-20261116/deployment.json), [hash live](qa/farm-ui-20261116/live-body-check.json), dan [UI live](qa/farm-ui-20261116/live-ui.json).

## Tindak lanjut HP — 16 November 2026

- [x] Memeriksa MyZooTwin live pada HP 320/360/390 px dan membandingkan MyFarmTwin live pada 390 × 844.
- [x] Memeriksa kelima spesies: 14 kartu dan empat indikator tersedia, tetapi label panjang turun baris; kondisi Gajah/Singa/Jerapah muncul setelah daftar persediaan yang panjang. PageDown pada panel HP juga tidak menggulir halaman.
- [x] Mengimplementasikan kondisi satwa sebelum persediaan, judul makaw yang konsisten, label/angka indikator bertumpuk, bantuan kamera lebih ringkas, header HP kecil, dan perbaikan pemilik gulir PageDown.
- [x] Memeriksa ulang kelima spesies pada HP kecil/umum, landscape, desktop, ID/EN, transaksi asli dan jeda; menjalankan typecheck serta build.
- [x] Menerbitkan perbaikan dan mencocokkan body/hash serta tampilan HP produksi.

Audit sebelum perbaikan: `.qa/mobile-polish-20261116/before-audit.json`, `before-parameters-360.jpg`, dan `myfarm-reference.jpg`. Pemeriksaan live dilakukan dalam kondisi jeda setelah masuk; tidak ada pembelian, refill, klaim, atau reset manual pada produksi.

- Pemeriksaan final perbaikan HP: **470/470** pada 320 × 640, 360 × 780, 390 × 844, 844 × 390, dan 1280 × 800; masing-masing 94. Mencakup empat indikator per individu, kartu langsung setelah judul spesies, label dan angka tidak bertumpuk, jeda, kamera, pembangunan dan refill berbayar pada save sintetis terpisah. Halaman tidak meluber secara horizontal. ID/EN pada 320 px dan PageDown native HP/desktop diperiksa.
- Typecheck final **0 error/0 warning/0 hint**, **42/42 pengujian terarah lulus**, build produksi **10 halaman**. HTML kandidat identik dengan produk QA, fingerprint `b1caf91d54271aec3b0bf0ecb110f85a2a570a50031ac402a326d760674a3017`. Bukti tindak lanjut: [laporan HP](qa/mobile-ui-20261116/REPORT.md), [verifikasi](qa/mobile-ui-20261116/verification.json). Rilis dan pemeriksaan produksi selesai.

- Tindak lanjut HP sudah live: commit `e2fbe81`, Cloudflare Pages `fddb6acd-5558-4151-a51d-cbf02f8e1dc1`, **16 November 2026, 12:25:25 WIB**. **130/130 body/hash** cocok. Pemeriksaan native domain utama pada 360 × 780 dan 390 × 844 lulus untuk kelima spesies/14 individu/empat indikator; semua target sentuh menu dan toolbar minimal 44 px. Tick **96.191**, saldo **4.381 ZC** dan populasi **14** tetap selama menu dijeda, tanpa transaksi/reset manual. Console warning/error kosong. Bukti akhir: [rilis HP](qa/mobile-ui-20261116/deployment.json), [UI live](qa/mobile-ui-20261116/live-ui.json).

## Tindak lanjut fungsi kontrol HP — 16 November 2026

- [x] Audit native domain utama: enam tujuan, Misi/Rawat/Tamu/Bangun, kembali ke zoo, zoom +/−, putar kiri/kanan, empat arah geser, dan Utuh. Navigasi serta toolbar berjalan saat simulasi aktif.
- [x] Mengidentifikasi masalah: saat jeda manual, fieldset dan canvas ikut terkunci sehingga kontrol kamera tidak dapat digunakan. Kamera seharusnya dapat dipakai untuk mengamati tanpa menggerakkan waktu/saldo/satwa.
- [x] Memisahkan kontrol kamera dari aksi permainan saat jeda; menambahkan render kamera saat dibutuhkan dan mempertahankan penguncian transaksi serta cold Continue.
- [x] Menguji semua kontrol di zoo dan kelima kandang pada HP kecil, HP umum, landscape dan desktop; memeriksa batas zoom, empat arah, gesture, reset, pindah kandang, menu opsi/dialog, serta progres tetap saat jeda.
- [x] Typecheck, pengujian terarah, build kandidat, deploy, dan verifikasi fungsi serta body/hash pada domain utama.

Bukti audit awal: [toolbar saat jeda](qa/mobile-controls-20261116/before-paused.json), [kontrol saat berjalan](qa/mobile-controls-20261116/before-running.json), [menu lima kandang](qa/mobile-controls-20261116/before-menus.json).

- Gate lokal fungsi kontrol HP: **775/775** kontrol pada lima viewport + **94/94** regresi pembangunan/refill = **869/869 pemeriksaan browser unik**. **76/76** pengujian terarah, typecheck bersih, build 10 halaman; HTML QA/kandidat identik. Perbaikan tambahan: empat tombol pan minimal 44 px. Bukti: [laporan kontrol HP](qa/mobile-controls-20261116/REPORT.md), [verifikasi](qa/mobile-controls-20261116/verification.json). Publikasi menunggu.

- Fungsi kontrol HP selesai dan live: commit `3d1c5a8`, deployment `3a701e90-f407-41fe-bd9f-58449f379b07` berhasil **16 November 2026, 13:03:00 WIB**. **130/130 body/hash** cocok. **66/66 aksi kamera native** pada enam konteks lulus; 24 tab aksi, Tata, Back dan perpindahan langsung kelima kandang diperiksa. Drag saat jeda bekerja, semua tombol arah minimal 44 px. Tick **96.284**, saldo **4.381 ZC**, populasi **14** tetap; renderer tunggal dan console tanpa warning/error. [Laporan fungsi](qa/mobile-controls-20261116/REPORT.md), [deployment](qa/mobile-controls-20261116/deployment.json), [bukti live](qa/mobile-controls-20261116/live-controls.json).

## Tindak lanjut performa dan ketukan kandang — 16 November 2026

- [x] Reproduksi native bug: ketuk fasilitas di dalam kandang jerapah pada HP 390 px membuka Bangun dan menggulir halaman dari y 0 ke 3.396,67; kandang belum diperbesar.
- [x] Menelusuri penyebab menu berubah sendiri: setiap refresh objek terpilih memicu pemilihan Bangun dan scroll ulang.
- [x] Memperbaiki ketukan kandang pada tampilan zoo agar langsung masuk kandang melalui hit triangle asli, termasuk saat jeda; mempertahankan alur placement dan seleksi lama di luar UI farm.
- [x] Menguji ketukan kelima kandang dan menu yang stabil saat animasi berjalan; mengukur frame callback, render-submit, latensi kontrol serta perubahan pose GLB pada viewport HP.
- [ ] Memperbaiki lag/bug yang ditemukan, menjalankan regresi, typecheck/build, deploy dan memeriksa hasil pada domain utama.

Bukti awal: [ketukan live](qa/mobile-performance-20261116/before-tap.json), [panel yang melompat](qa/mobile-performance-20261116/before-jumping-panel.jpg).

- Kandidat performa HP: **641/641 pemeriksaan browser** dan **95/95 pengujian terarah lulus**, typecheck bersih, build 10 halaman. Pada 390 px, CPU p95 lima kandang 42,5–88,8 → 35,8–36,9 ms, long task 86 → 1; handler kontrol ≤2,1 ms. Pada 360 px dengan Rawat terbuka, CPU p95 35,9–38,9 ms. Semua 14 model tetap terpasang dan pose kandang aktif bergerak; scroll/menu stabil. [Laporan](qa/mobile-performance-20261116/REPORT.md). Publikasi menunggu.
