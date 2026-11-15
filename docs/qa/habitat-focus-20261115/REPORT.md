# QA zoom per kandang — 15 November 2026

**Hasil akhir: PASS lokal.** Fitur belum di-deploy. Build akhir `zoom-20261115-g` memakai fingerprint sumber `1fec641f9530a98fc11ce15fba302f55558e68f099a8711936b34644ce244f50`; `verification.json` memastikan fingerprint checkout sama dengan build yang diperiksa.

## Matriks kandang

Setiap sel mencakup 11 pemeriksaan integrasi dan inspeksi screenshot yang ditautkan. Total **165 pemeriksaan integrasi** pada lima kandang dan tiga ukuran viewport.

| Kandang | Desktop 1366 × 768 | HP tegak 360 × 780 | HP mendatar 780 × 360 |
|---|---|---|---|
| Macaw Aviary | [Lulus](desktop-macaw-aviary.jpg) | [Lulus](portrait-macaw-aviary.jpg) | [Lulus](landscape-macaw-aviary.jpg) |
| Elephant Grove | [Lulus](desktop-elephant-grove.jpg) | [Lulus](portrait-elephant-grove.jpg) | [Lulus](landscape-elephant-grove.jpg) |
| Lion Savanna | [Lulus](desktop-lion-savanna.jpg) | [Lulus](portrait-lion-savanna.jpg) | [Lulus](landscape-lion-savanna.jpg) |
| Giraffe Plains | [Lulus](desktop-giraffe-plains.jpg) | [Lulus](portrait-giraffe-plains.jpg) | [Lulus](landscape-giraffe-plains.jpg) |
| Zebra Grasslands | [Lulus](desktop-zebra-grasslands.jpg) | [Lulus](portrait-zebra-grasslands.jpg) | [Lulus](landscape-zebra-grasslands.jpg) |

Pada setiap kandang, suite memeriksa masuk lewat tombol pada pilihan kandang, panel spesies lain tersembunyi, satu kanvas dan simulasi berjalan, kebutuhan satwa di kandang lain maju, zoom/putar, pinch dan pelepasan pointer, reset lokal, pembangunan fasilitas berbayar, perawatan berbayar, pemulihan kamera zoo, serta ketiadaan overflow horizontal.

Pembangunan benar-benar menambah fasilitas pada dunia kanonis. Perawatan benar-benar menambah transaksi supplies; pengujian menunggu commit asinkron selesai. Seluruh profil berakhir dengan state dan checkpoint valid, satu subscriber simulasi, dan tidak ada bidang clipping tersisa setelah keluar dari mode zoom.

Detail: [desktop.json](desktop.json), [portrait.json](portrait.json), [landscape.json](landscape.json).

## Pemulihan dan integrasi tambahan

Delapan skenario tambahan pada build akhir lulus melalui kontrol browser asli, dengan injeksi context loss yang dilabeli:

1. Escape keluar dari mode fokus.
2. Kembali ke zoo tetap dapat digunakan saat dijeda dan mempertahankan status jeda.
3. Escape membatalkan preview fasilitas sebelum keluar dari mode fokus.
4. Studio Makaw mengakhiri mode fokus dan mempertahankan kebijakan jeda studio yang sudah ada.
5. Label fokus dan tombol kembali mengikuti bahasa Inggris, lalu dapat dikembalikan ke Indonesia.
6. Context loss menghapus kanvas lama dan membersihkan mode fokus.
7. Coba lagi memulihkan tepat satu kanvas, state valid, dan tampilan seluruh zoo.
8. Cold reload mempertahankan tick 15.430, saldo 3.647 ZC, lima kandang, dan 14 satwa pada fixture; mode awal tetap seluruh zoo.

Detail: [lifecycle.json](lifecycle.json). Perubahan orientasi saat Zebra sedang difokuskan juga mempertahankan kandang dan zoom; screenshot `orientation-zebra.jpg` merekam transisi saat varian model sedang disiapkan, bukan hasil visual akhir.

## Pemeriksaan kode

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| Suite regresi lengkap | 1.099 lulus, 0 gagal | [unit-tests.log](unit-tests.log) |
| Pengujian terarah pada sumber akhir | 50 lulus, 0 gagal | [focused-tests.log](focused-tests.log) |
| Astro check | 0 error, 0 warning, 0 hint | [check.log](check.log) |
| Build produksi terisolasi | 10 halaman selesai | [build.log](build.log) |
| Sumber akhir sama dengan build | Lulus | [source.json](source.json), [verification.json](verification.json) |

Suite lengkap dijalankan pada run `zoom-20261115-d`. Setelah review kamera/picking/undo dan penyempurnaan layout, jalur yang berubah diperiksa ulang melalui 50 pengujian terarah, Astro check, build, serta seluruh matriks browser pada run akhir `zoom-20261115-g`. Dua kasus tepi baru berada dalam pengujian terarah tersebut. Angka 1.099 dan 50 bertumpang tindih dan tidak dijumlahkan sebagai pengujian unik.

Inventaris visual lama tetap dilindungi; ekstensi zoom mematok empat modul yang sengaja berubah. Tidak ada perubahan aset satwa, dependency, atau skema simpanan.

## Metode dan batas bukti

- Pengujian browser menggunakan runtime CUA yang disetujui. Suite integrasi memakai DOM/PointerEvents injeksi melalui UI dan adapter input produk yang sebenarnya; skenario tambahan memakai kontrol browser asli.
- Seluruh screenshot merupakan tangkapan piksel WebGL aktual dan sudah diperiksa visual. Lima kandang pada masing-masing ukuran viewport tersedia dalam matriks di atas.
- Data awal merupakan fixture sintetis lima kandang pada database IndexedDB UUID khusus QA. Slot pembangunan disiapkan lewat perintah sumber asli. Ini tidak membuktikan alur membuka semua kandang dari game baru.
- Viewport HP merupakan emulasi ukuran layar; perangkat Android/iPhone fisik, Safari/iOS, sentuhan fisik, spoken screen reader, dan FPS fisik tidak diuji.
- Tidak ada pengujian upload/download, autentikasi, atau alur yang memerlukan konfirmasi pengguna. Simpanan produksi milik pengguna tidak dibuka atau diubah.
- Tangkap console tidak terpotong pada batas 200 entri. Tidak ada entri warn/error dari origin run akhir. Log masih memuat satu kegagalan fetch dari origin QA sebelumnya setelah server origin itu dihentikan; entri tersebut dipertahankan dalam [console-final.json](console-final.json), bukan disembunyikan sebagai console bersih lintas seluruh riwayat.
- Percobaan awal yang gagal dan receipt sebelum perbaikan waktu tunggu commit dipertahankan terpisah. Hanya receipt akhir desktop/portrait/landscape yang dipakai untuk verdict PASS.
- Server milik QA dihentikan, tab produk QA ditutup, dan override viewport browser dipulihkan.

`verification.json` mengikat receipt, log, serta 15 screenshot akhir dengan ukuran dan SHA-256. Tidak ada publikasi, push, atau deployment pada pekerjaan ini.
