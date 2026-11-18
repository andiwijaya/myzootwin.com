# Gestur kamera mobile — 18 November 2026

Pengguna meminta rotasi dengan jempol, pinch dan gestur mobile yang tetap berfungsi, pengujian hanya di browser internal, serta deployment langsung secara otonom.

## Cara memakai

- Pilih **Putar**, lalu geser mendatar dengan satu jari untuk rotasi bebas. Pilihan **Geser** mengembalikan pan satu jari. Pilihan awal adalah Geser.
- **Cubit dua jari** untuk zoom 100–300%, **geser dua jari** untuk pan, dan **putar dua jari** untuk rotasi. Ketiganya dapat digabung dan bekerja pada kedua pilihan satu jari.
- Tombol ↶/↷ tetap memutar 45°, +/− tetap memperbesar/memperkecil, dan **Utuh/Fit** mengembalikan arah awal serta framing seluruh zoo/kandang aktif. Tombol arah, roda mouse dan keyboard lama tetap tersedia.
- Berlaku pada seluruh zoo dan Macaw Aviary, Elephant Grove, Lion Savanna, Giraffe Plains serta Zebra Grasslands. Keluar dari kandang mengembalikan sudut bebas, zoom dan fokus zoo sebelumnya.
- Kamera tetap dapat digunakan saat permainan dijeda. Perubahan jeda membatalkan sentuhan yang sedang ditahan; gestur baru tidak menjalankan waktu simulasi.
- Drag dan multitouch tidak menjadi tap pemilihan. Pelepasan jari, pointer cancel, perubahan mode, pergantian habitat, resize, blur dan disposal tidak meninggalkan pointer aktif. Jari ketiga diabaikan.

Label, status pilihan aksesibel dan bantuan tersedia dalam bahasa Indonesia dan Inggris. Kedua tombol baru mempunyai tinggi minimal 44 px. Mode kamera merupakan keadaan sementara dan tidak ditulis ke simpanan permainan.

## Implementasi

`camera-gestures.ts` menambahkan gerakan satu jari sesuai mode dan sudut pasangan dua jari. Rotasi dua jari mempunyai toleransi goyangan 4° dan memakai busur terpendek saat melewati batas −180°/180°. Pasangan dengan jarak terlalu dekat tidak menghasilkan lonjakan sudut.

`camera-controls.ts` menyimpan azimut dalam derajat bebas dan memakai framing, sumbu pan serta batas navigasi yang sama. Sudut pandang vertikal tetap. Tidak ada loop animasi kamera tambahan. Pilihan Geser/Putar menggunakan jalur perintah kamera yang sudah ada; `preview-panel.ts` memperbarui pilihan aksesibel dan membulatkan pengumuman sudut.

Receipt inventaris baru mempertahankan semua baseline lama. Regresi penuh pertama menemukan bahwa handler tap kandang dari commit produksi `8918db4e9d7d745e353cf3a014a5049c01b2571d` belum terdaftar pada receipt sebelumnya. Pendaftaran sekarang mengikat sumber tersebut secara tepat; `scene-picking.ts` tidak diubah dalam pekerjaan ini.

## Bukti pengujian

Direktori bukti: [qa/mobile-gestures-20261118](qa/mobile-gestures-20261118/).

- **456 pemeriksaan browser lulus**: 152 pada setiap viewport 360 × 780, 780 × 360 dan 1366 × 768. Masing-masing mencakup zoo dan kelima kandang, 18 kombinasi seluruhnya.
- Matriks mengirim PointerEvents sentuh melalui UI, kamera dan renderer produk asli. Fixture IndexedDB UUID berisi lima habitat dan 14 satwa sintetis; ini bukan bukti perjalanan membuka semua kandang dari game baru.
- Pemeriksaan mencakup rotasi bebas satu jari, mode Geser/Putar, pinch dan twist bersamaan, pan dua jari, penolakan jari ketiga, pelepasan jari tanpa lonjakan, perubahan mode, pointer cancel, jeda, reset, target 44 px, satu kanvas, simpanan valid dan tidak ada overflow mendatar.
- Drag mouse asli di browser internal pada viewport mobile mengubah azimut 0° menjadi sekitar 304,33° tanpa mengubah zoom 100%, saat simulasi dijeda. Ini terpisah dari injeksi sentuh dalam matriks.
- Bantuan dan label Inggris diperiksa melalui pemilih bahasa produk. Screenshot mobile memperlihatkan mode Putar aktif pada kandang jerapah. Setelah cold Continue, mode kembali ke Geser, azimut 0° dan zoom 100%; saldo 4.019 ZC, lima habitat dan 14 satwa tetap tersedia. Resume lalu Pause dilakukan singkat, sehingga bukti ini tidak menyatakan kesamaan tick penuh.
- Regresi final: **1.111/1.111 tes lulus**, 0 gagal, dibatalkan, dilewati atau todo.
- Pemeriksaan Astro atas 694 berkas menghasilkan 0 error, 0 warning dan 0 hint. Build produksi menyelesaikan 10 halaman. Hasil regresi lengkap dan fingerprint final dicatat di `local-verification.json`.
- Seluruh 160 berkas build rilis identik dengan build D yang dipakai matriks browser. Perubahan terakhir hanya memperbarui receipt pengujian untuk handler tap yang telah terbit.

Percobaan QA awal dipertahankan terpisah: urutan startup harness yang terlalu dini, asumsi keliru bahwa kamera harus terkunci saat jeda, serta diagnostik cold-read yang dibaca sebelum laporan async selesai. Ketiganya tidak dihitung sebagai pemeriksaan yang lulus. Build B gagal dengan log keluaran kosong pada runner yang berbatas 120 detik; build final memakai batas waktu QA lima menit. Tidak ada perubahan aplikasi akibat perbaikan harness tersebut.

HP merupakan emulasi viewport Chromium di browser internal. Perangkat Android/iPhone fisik, multitouch fisik, Safari/iOS dan performa presentasi perangkat tidak diuji.

## Rilis

Jalur publikasi tetap GitHub `main` → Cloudflare Pages `myzootwin-com`, dengan `npm run build` dan keluaran produk `dist`. Hanya perubahan fitur dan bukti terkait yang dimasukkan ke commit; perubahan GLB lokal lain dibiarkan di luar commit. Identitas commit, status deployment dan pemeriksaan aset produksi disimpan di `deployment.json` dan `live-assets.json` pada direktori bukti.

[Buka game](https://myzootwin.com/play/).
