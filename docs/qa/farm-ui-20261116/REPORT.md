# UI MyZooTwin mengikuti MyFarmTwin

Implementasi 16 November 2026. **PASS dan live untuk P1–P5.** Regresi penuh, browser, typecheck, build, deployment dan smoke produksi lulus.

## Perubahan yang diperiksa

Palet krem/hijau pucat, ikon garis, kartu membulat, toolbar kamera dan Catatan Zoo mengikuti referensi MyFarmTwin. Navigasi utama adalah Zoo, Makaw, Gajah, Singa, Jerapah, Zebra. Misi, Rawat, Tamu dan Bangun tetap menjadi panel aksi.

Menu spesies memakai fokus kandang asli. Menu terkunci menunjukkan prasyarat dan membuka Bangun tanpa transaksi. Ringkasan global menghitung satwa yang benar-benar ditempatkan; dua makaw cadangan pada zoo baru tidak dihitung sebagai penghuni kandang. Kesejahteraan ditampilkan per individu, dengan arah indikator yang jelas: lapar/haus lebih rendah lebih baik, energi/kesejahteraan lebih tinggi lebih baik.

Katalog penempatan fasilitas berada pada Bangun. Persediaan, refill dan informasi satwa tetap berada pada Rawat. Harga, stok, placement, gating misi, transaksi dan checkpoint tetap memakai handler permainan asli. Dunia, GLB, pencahayaan, clock dan skema save tidak diganti.

## Matriks browser

Build akhir `farm-ui-r3`, fingerprint sumber `d8858032cf9e9176fcf1b765f9a4e2db61bbca6a311d845c1e15cd84233bc4ec`.

| Profil | Ukuran | Hasil | Receipt |
|---|---|---|---|
| Desktop | 1280 × 800 | 79/79 lulus | [desktop.json](desktop.json) |
| HP tegak | 390 × 844 | 79/79 lulus | [portrait.json](portrait.json) |
| HP mendatar | 844 × 390 | 79/79 lulus | [landscape.json](landscape.json) |
| Zoo baru | 390 × 844 | 6/6 lulus | [fresh-locked.json](fresh-locked.json) |

Setiap profil lima kandang memeriksa navigasi saat jeda tanpa perubahan tick/saldo/populasi/persediaan, fokus dan penyaringan panel, satu renderer, simulasi satwa di luar layar, zoom/putar/pan/pinch/fit/kembali, pembangunan fasilitas serta refill berbayar pada kelima spesies, dan label Tamu untuk seluruh zoo. Ketiga receipt berakhir dengan state dan checkpoint valid, 14 satwa, lima kandang, satu subscriber simulasi, dan nol error.

Zoo baru menggunakan state awal asli yang dimigrasikan melalui codec V5. Lima menu terkunci tetap dapat menjelaskan prasyarat ketika dijeda. Saldo tetap 1.500 ZC; tidak ada kandang dibangun atau satwa dipindahkan secara otomatis.

## Pemeriksaan tambahan

- [Target sentuh 360 px](touch-targets-360.json): enam menu, tujuh tombol toolbar dan CTA sedikitnya 44 × 44 px. Tidak ada overflow horizontal.
- [Keyboard](keyboard.json): panah kanan memindahkan fokus dari Zoo ke Makaw tanpa mengaktifkan kandang atau menjalankan simulasi. Fokus terlihat pada [screenshot](fresh-locked.jpg).
- [Pengaturan Low](settings-low.json) dan [pemulihan Auto](settings-restored.json): grafis rendah serta reduced motion benar-benar diterapkan, lalu dikembalikan melalui Apply. Bahasa Inggris tampil pada menu, kartu dan [dialog](settings-en.jpg). Fixture sengaja memakai `preferenceStorage:null`; pesan bahwa preferensi menu hanya berlaku untuk kunjungan tersebut merupakan kondisi QA yang diharapkan.
- [Cold reload](cold-reload.json): Continue mempertahankan tick 14.017 dan saldo 3.637 ZC dari fixture sebelumnya. Dunia tetap dijeda; tidak ada progres offline.
- [Context loss dan Retry](context-recovery.json): injeksi QA menghapus kanvas dan menyembunyikan kontrol yang belum siap. Try again memulihkan tepat satu kanvas/subscriber, mempertahankan tick 48, saldo 1.500 ZC, dua makaw cadangan, dan jeda pada zoo baru.

## Pemeriksaan kode dan build

- `astro check`: 0 error, 0 warning, 0 hint pada 686 berkas.
- Regresi penuh pada sumber akhir: **1.104 lulus, 0 gagal, 0 dilewati**; durasi 866.482 ms. Bukti [unit-tests.tap](unit-tests.tap).
- 42 pengujian terarah lulus untuk kamera, fokus kandang, perhitungan jumlah satwa, arah indikator, bahasa, dan inventaris visual.
- Build produksi menyelesaikan 10 halaman. Kandidat `dist` dan produk pada build QA memiliki HTML `/play/` yang identik: SHA-256 `f42aee5adff4e1be5385ccba28f9c3bce250e3f8bf1a53f9501cc1eb440eab80`.
- Baseline visual historis tetap dipertahankan. Ekstensi baru hanya mencatat pan toolbar pada `camera-navigation.ts` dan SVG ikon asli; factory satwa, lingkungan, GLB dan pencahayaan tetap dipatok oleh receipt sebelumnya.
- Checksum bukti serta fingerprint kandidat dicatat pada [verification.json](verification.json). Pengujian terarah bertumpang tindih dengan suite penuh dan tidak dijumlahkan sebagai tes unik.

## Rilis produksi

Commit aplikasi `a3bbc99b0d64f0932f0f0b4bc71b7b2045eceef3` diterbitkan fast-forward ke `main`. Cloudflare Pages deployment `78e41764-ed09-4f5a-be54-a65fab317d6c` berhasil pada **16 November 2026 pukul 11:48:01 WIB**. [Check-run](https://github.com/andiwijaya/myzootwin.com/runs/133097553228), [deployment tetap](https://78e41764.myzootwin-com.pages.dev), dan [situs produksi](https://myzootwin.com/play/).

[Pemeriksaan body produksi](live-body-check.json) mencocokkan **130/130** respons HTML, JS, CSS, model dan tekstur runtime dengan kandidat yang diuji. Aset `.br` diperiksa setelah decoding Brotli sebagaimana diterima loader. Entry live: `PlayEntry.astro_astro_type_script_index_0_lang.DXVIRhsf.js`; CSS `play.D3uKQHwP.css`.

[Smoke native live](live-ui.json) memakai kampanye lima kandang yang sudah tersedia pada profil browser internal. Continue dibuka, lalu Resume singkat untuk mengaktifkan kontrol sebelum dijeda; tick berubah dari 96.146 menjadi 96.185 selama fase masuk tersebut. Seluruh pemeriksaan menu berikutnya dilakukan saat dijeda dan mempertahankan tick 96.185 serta saldo 4.381 ZC. Tidak ada pembelian, refill, klaim, atau reset manual pada produksi.

Kelima panel benar-benar menampilkan 2 kartu makaw, 2 gajah, 3 singa, 3 jerapah dan 4 zebra, masing-masing dengan empat indikator native. Satu kanvas tetap aktif; katalog Jerapah tersedia di Bangun, label Tamu tetap untuk seluruh zoo, dan kembali ke Zoo berhasil saat dijeda. Console live memuat **0 warning/error** pada pengambilan maksimal 100 entri. Tab ditutup dalam kondisi jeda; viewport dipulihkan.

Screenshot produksi: [desktop dan persediaan](live-desktop-giraffe.jpg), [parameter individu](live-desktop-parameters.jpg), [menu HP](live-portrait-zoo.jpg). Bukti live ditambahkan setelah commit aplikasi; pencatatan bukti akhir tidak mengubah build yang diterbitkan.

## Metode dan batas bukti

Browser memakai runtime CUA. Tombol suite QA mengirim DOM/PointerEvents yang secara eksplisit dilabeli sebagai input injeksi melalui kontrol dan adapter asli. Pemeriksaan bahasa, pengaturan, cold reload, keyboard dan Retry memakai kontrol browser. Screenshot adalah piksel WebGL aktual, bukan gambar rancangan.

Data lima kandang merupakan fixture sintetis pada database IndexedDB UUID khusus QA, terpisah dari progres pemilik. Fixture tersebut membuktikan UI dan transaksi pada kandang yang sudah tersedia; tidak membuktikan penyelesaian seluruh kampanye dari nol. Ukuran HP adalah viewport browser, bukan pengujian Android/iPhone fisik atau Safari/iOS.

Percobaan awal yang gagal dipertahankan di `.qa/ui-reference-plan-20261116/attempts/`. Perbaikan meliputi prioritas CSS lama, menunggu pemuatan aset sebelum input kamera, dan menunggu sinkronisasi panel sebelum memeriksa label Tamu. Timeout kontrol browser sesudah matriks selesai diatasi melalui tombol aksesibilitas native; tidak ada error produk pada receipt akhir. Tidak ada upload/download save, reset progres pemilik, atau instalasi dependency baru untuk QA.

Tab permainan QA ditutup, override viewport dipulihkan dan ketiga server QA loopback dihentikan. Satu tab error jaringan awal menggunakan URL data internal yang ditolak saat pengambilan handle untuk cleanup; tab tersebut tetap sementara dan tidak berisi progres permainan.
