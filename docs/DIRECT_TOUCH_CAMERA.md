# Kamera sentuh langsung — 18 November 2026

> Pemetaan ini tetap berlaku. Perbaikan berikutnya untuk pemrosesan per frame dan pencegahan salah pilih dicatat pada [kamera mobile yang lebih responsif](SMOOTH_MOBILE_CAMERA.md).

Pengguna meminta satu jari langsung memutar kamera di mobile, dua jari untuk pan dan pinch untuk zoom, tanpa memilih tombol Putar. Permintaan juga mengotorisasi pengujian hanya di browser internal dan deployment langsung.

## Perilaku

- Geser satu jari mendatar untuk rotasi bebas, langsung dari sentuhan pertama. Tap singkat tetap memilih objek/kandang.
- Geser dua jari untuk pan dan cubit untuk zoom. Perubahan sudut pasangan dua jari tidak memutar kamera, sehingga pan/pinch tidak mendapat rotasi tambahan.
- Transisi satu → dua → satu jari mempertahankan kamera tanpa lonjakan dan tidak menjadi tap. Jari yang tersisa kembali memutar setelah benar-benar digeser.
- Pilihan mode Geser/Putar disembunyikan pada tampilan di bawah 900 px dan perangkat dengan pointer kasar. Tampilan mobile dengan pointer mouse juga langsung berotasi agar emulasi sesuai pengalaman mobile.
- Pada desktop, pilihan Geser/Putar tetap mengatur drag mouse. Sentuhan tetap memakai aturan satu jari rotasi dan dua jari pan/pinch, termasuk pada layar besar.
- Berlaku untuk seluruh zoo dan kelima kandang. Tombol 45°, zoom, Utuh/Fit serta keyboard tetap bekerja. Kamera tetap dapat diperiksa saat jeda, tanpa menjalankan waktu simulasi.

`CameraPointer` sekarang membawa `pointerType` dari event browser. Mesin gestur memakai tipe yang diterima pada pointerdown, sehingga event lanjutan tetap mengikuti pemilik gestur yang sama. Pemetaan ukuran layar berada di kontrol kamera dan mengikuti resize yang sudah membatalkan pointer aktif. Tidak ada tambahan RAF, perubahan simulasi, transaksi, aset atau skema simpanan.

Bantuan ringkas sekarang berbunyi **Satu jari putar · Dua jari geser · Cubit untuk zoom**, dengan padanan bahasa Inggris. Label pilihan desktop menjelaskan bahwa kontrol itu untuk mouse.

## Verifikasi

Hasil source, build, matriks browser dan deployment berada di [qa/direct-touch-20261118](qa/direct-touch-20261118/).

- **89/89 tes regresi terarah lulus**: kamera, pemilihan, kelima kandang, placement, lifecycle renderer, navigasi HUD, bahasa dan inventaris visual. Rilis ini tidak mengulang semua tes simulasi ekonomi; hasil rilis sebelumnya tetap merupakan bukti historis.
- **366/366 pemeriksaan browser lulus**, 122 pada setiap viewport, 18 kombinasi total. Browser internal memakai viewport 360 × 780, 780 × 360 dan 1366 × 768, masing-masing mencakup zoo serta lima kandang. Tidak ada pemilihan mode sebelum drag pertama dalam suite sentuh.
- Matriks memeriksa rotasi langsung, pan dua jari dengan sudut/zoom akhir tetap, pinch dengan pasangan miring tanpa rotasi, jari ketiga, transisi jumlah jari, pointer cancel, reset, jeda, ledger perintah, simpanan valid, satu kanvas dan layout tanpa overflow.
- Fixture merupakan simpanan QA sintetis dengan database UUID tersendiri, lima kandang dan 14 satwa. PointerEvents sentuh diinjeksi melalui kanvas dan renderer produk asli. Drag mouse native pada ukuran mobile dicatat terpisah.
- Pengujian hanya memakai browser internal Chromium. Perangkat Android/iPhone fisik, sentuhan fisik dan Safari/iOS tidak diuji.

Receipt `direct-touch-visual-extension.json` mempertahankan receipt rilis sebelumnya dan membatasi perubahan sumber visual tepat pada `camera-controls.ts` serta `camera-gestures.ts`.

## Rilis

Jalur publikasi tetap GitHub `main` → Cloudflare Pages `myzootwin-com`, memakai build produk `npm run build` dan direktori `dist`. Build QA, fixture dan bukti tidak menjadi route publik. Commit dan status produksi dicatat di `deployment.json`; perbandingan runtime di `live-assets.json`; hasil input live di `live-browser.json`.

[Buka game](https://myzootwin.com/play/).

Pemeriksaan Astro atas 694 berkas: 0 error, 0 warning dan 0 hint. Build produksi menyelesaikan 10 halaman. Fingerprint sumber dan seluruh 160 berkas build dicatat pada receipt lokal.

### Hasil produksi

- Source produksi: `f6b0cae78109b6d81c9bde9194fd318307313675`. Satu push fast-forward, tanpa mengubah hosting, akses, dependency atau simpanan.
- Cloudflare Pages `6b0d94e0-956b-465e-9f3b-c5080a8147d3`: **completed / success**, 18 November 2026 08:01:27 UTC / 15:01:27 WIB.
- **16/16 pemeriksaan live lulus** pada domain utama dan origin deployment: markup bantuan baru serta semua hash JavaScript/CSS runtime cocok dengan build lokal. Aset model/media yang tidak berubah tidak diunduh ulang untuk pemeriksaan ini.
- Browser internal pada domain utama, lebar 360 px: mode efektif langsung Rotate, pilihan mode berukuran 0 × 0 karena tersembunyi. Drag pertama pada kandang jerapah mengubah sudut 0° → 304,33° tanpa memilih tombol Putar. Zoom tetap 100%; tombol + menghasilkan 125%.
- Simpanan IAB lama dibuka melalui Continue dan Resume/Pause singkat, kemudian pengujian kamera dilakukan saat dijeda. Saldo terlihat 4.381 ZC dan 14 satwa tetap tersedia. Tidak ada reset progres, pembangunan, refill, impor/ekspor atau pembacaan/penulisan storage melalui skrip browser. Tidak diklaim kesamaan tick penuh sebelum/sesudah Resume.
- Konsol live: 0 error/warning. Akhir pemeriksaan mobile: zoo dijeda, mode langsung Rotate, sudut 0°, zoom 100%, satu kanvas. Override viewport direset sesudah pemeriksaan; tab QA ditutup.

Bukti sesudah deployment dicatat dalam commit dokumentasi lokal tanpa push tambahan, sehingga tidak memicu deployment kedua.
