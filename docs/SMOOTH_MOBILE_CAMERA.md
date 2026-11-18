# Kamera mobile: responsivitas dan pemisahan tap — 18 November 2026

Pengguna meminta rotate satu jari, pan dua jari dan pinch mobile lebih halus/responsif, gestur kamera tidak memilih objek, pengujian hanya di browser internal dan deployment langsung secara otonom.

## Perubahan

- Posisi pointer mentah dikumpulkan, lalu posisi terbaru diterapkan pada frame visual berikutnya. Kamera tidak menghitung matriks dan mengirim pembaruan UI untuk setiap sampel event.
- Pan dua jari dan perubahan jarak pinch diterapkan sekaligus, dengan satu penjepitan pada hasil akhir. Urutan event kedua jari tidak lagi mengubah zoom ketika pan berada pada batas 100% atau 300%. Titik dunia di bawah centroid tetap terjangkar saat pan dan zoom digabung.
- Kamera memakai driver frame yang sudah ada. Permintaan input berbagi satu frame tertunda dengan loop aktif. Saat dijeda, satu frame dapat digambar lalu kembali menganggur; waktu simulasi tetap berhenti.
- Event yang digabung browser dibaca untuk mengenali seluruh jalur gerakan. Batas kanvas dibaca sekali per gestur, lalu dibatalkan saat resize, scroll atau blur.
- Tap harus singkat, maksimal 300 ms, berpindah kurang dari 4 px CSS dan mempunyai total jalur kurang dari 8 px. Gerakan yang melampaui batas menjadi milik gestur sampai dilepas, termasuk ketika kembali mendekati titik awal.
- Multitouch, tahan lama, pointer cancel, kehilangan capture, perubahan tampilan dan input terlambat setelah pembatalan tidak menjadi tap. Posisi akhir drag tetap diterapkan tanpa animasi yang berlanjut setelah jari dilepas.

Pemetaan tetap satu jari untuk rotate, dua jari untuk pan dan pinch untuk zoom. Pilihan mode mobile tetap tersembunyi; tap singkat yang disengaja tetap memilih objek/kandang. Mouse desktop dan keyboard tetap tersedia. Simulasi, ekonomi, save schema, aset dan dependency tidak diubah.

## Implementasi

`camera-gestures.ts` memisahkan pengenalan pemilik pointer dari penerapan kamera melalui `flush()`. `camera-controls.ts` menerima callback permintaan frame, meneruskan sampel `getCoalescedEvents()` dan menyediakan diagnostik lokal untuk QA. Diagnostik tidak disimpan dan tidak dikirim ke jaringan.

`camera-navigation.ts` menambahkan transformasi pan/pinch atomik. `frame-loop.ts` mendukung permintaan satu frame dengan kepemilikan dan generation guard yang sama. `foundation-scene.ts` menerapkan input sebelum menggambar dan menghindari render ganda dari event kamera saat sudah berada di frame visual.

Receipt sumber baru mempertahankan semua baseline sebelumnya. Perubahan modul kamera yang dilindungi dibatasi pada controls, gestures, navigation dan frame-loop. Sumber satwa, lingkungan, pencahayaan serta bytes aset tetap dilindungi oleh inventaris yang sama.

## Pengujian

Bukti ada di [qa/camera-smooth-20261118](qa/camera-smooth-20261118/).

- Unit test memakai driver deterministik untuk burst 100 posisi, urutan event dua jari, pan pada kedua batas zoom, penjajaran titik dunia saat pan/pinch, gerakan bolak-balik dari event gabungan, drag 4 px, tahan lama, multitouch serta pembatalan sebelum frame berjalan.
- Lifecycle menguji satu frame saat jeda, penggunaan kembali frame aktif, restart, callback usang, disposal dan kegagalan render. Tidak ada loop kamera kedua.
- Browser memakai UI, renderer dan driver frame produk asli, dengan simpanan sintetis UUID, lima kandang dan 14 satwa. Viewport: 360 × 780, 780 × 360 dan 1366 × 768. Setiap viewport menguji zoo dan kelima kandang.
- Setiap burst memeriksa keadaan sebelum frame, keadaan pada frame pertama, jumlah pembaruan kamera, jumlah render, pointer yang dilepas, tick tetap ketika dijeda dan tap counter yang tidak bertambah. Pasangan miring tetap melakukan pinch tanpa rotasi.
- Tap positif memakai koordinat segitiga kandang yang benar pada renderer asli. Ini terpisah dari input kamera yang wajib tidak memilih objek.

PointerEvents sentuh dalam matriks diinjeksi melalui kanvas produk. Ukuran HP adalah emulasi browser internal Chromium, bukan perangkat Android/iPhone atau Safari fisik. Durasi observasi frame merupakan pengukuran harness internal; bukan FPS yang dipresentasikan, panas, baterai atau benchmark perangkat fisik.

Regresi pertama mengungkap ekspektasi lama yang membandingkan seluruh objek diagnostik gestur dengan dua field saja. Ekspektasi diperbarui untuk memeriksa pending input kosong, nol tap dan dua pointer dibatalkan. Hasil akhir dicatat pada `local-verification.json`.

## Rilis

Jalur tetap GitHub `main` → Cloudflare Pages `myzootwin-com`, build produk `npm run build`, output `dist`. Build/fixture QA tidak menjadi route publik. Identitas deployment, kecocokan runtime dan input live dicatat dalam `deployment.json`, `live-assets.json` dan `live-browser.json`.

[Buka game](https://myzootwin.com/play/).

### Hasil lokal akhir

- **118/118 tes regresi terarah lulus**, tanpa gagal, dibatalkan, dilewati atau todo. Termasuk 6.000 tick V5 dengan 30 reload/jeda, kesetaraan 1×/10×, clock reentrancy dan pengaman callback usang. Ini bukan pengulangan seluruh suite ekonomi.
- Pemeriksaan Astro: **695 berkas, 0 error, 0 warning, 0 hint**. Build produksi: **10 halaman**.
- **657/657 pemeriksaan browser lulus**: 219 pada setiap viewport, 18 kombinasi zoo/kandang.
- **54 burst × 64 posisi mentah** masing-masing menghasilkan **satu pembaruan kamera dan satu render** pada frame asli berikutnya. Termasuk pan pada zoom 100% dan 300%. Tidak ada tap yang dikenali dari gestur; tiga kontrol positif tap singkat membuka kandang nyata yang dituju.
- Observasi harness burst → frame pertama: median **25,4 ms**, p95 **93,0 ms**, maksimum **132,1 ms** (54 sampel). Angka ini mencakup penjadwalan/render/harness internal dan tidak dinyatakan sebagai FPS atau jaminan latensi perangkat fisik.
- Seluruh **160 berkas produk** identik antara build A yang diuji browser dan build rilis final. Perbedaan sumber terakhir hanya pembaruan tes diagnostik HUD.
