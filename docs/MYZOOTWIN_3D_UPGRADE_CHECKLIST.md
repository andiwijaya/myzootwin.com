# Checklist implementasi upgrade 3D MyZooTwin

Paket pertama mencakup peta yang lebih luas di HP, lanskap Tropical Creek yang menyatu dengan peta, dan satu rangkaian animasi perawatan Macaw yang mudah diamati. Mulai dari baseline versi produksi, lalu kerjakan peta dan kontrol sebelum menyetel lanskap serta animasi. Uji regresi tetap mencakup kelima habitat.

Pada implementasi 21 November 2026, peta terbuka sambil dijeda. Simpanan V5 yang sudah ada dapat dilihat tanpa penulisan checkpoint sampai pemain memilih **Lanjut bermain**. Lanskap menggunakan geometri di luar grid, dan mode Hemat Daya menyesuaikan jumlah vegetasi serta resolusi render pada kanvas tegak yang tinggi.

## Status pengujian 21 November 2026

- Rilis awal masuk ke `main` pada `b2f4b3a`. Di produksi, lima habitat terbuka dalam keadaan dijeda. Putar, fokus Makaw, kembali ke zoo dan buka dengan `?engine=native` mempertahankan tick, revisi dan saldo. [PR #2](https://github.com/andiwijaya/myzootwin.com/pull/2)
- Di Chromium pada 390 × 844, tinggi kanvas berubah dari 336 menjadi 555 CSS px. Dalam satu pengukuran Hemat Daya, DPR 1 dan SwiftShader, p95 interval frame overview sekitar 300 ms pada kedua versi. Pada fokus Makaw, p95 dari 133 menjadi 267 ms, dengan median sekitar 67 ms pada kedua versi. Pengukuran perangkat lunak ini masih perlu dilengkapi hasil dari GPU pada HP fisik dan ukuran transfer HTTP cold load.
- Misi Q01 ID dan EN menyelesaikan 12 petak jalur dan satu klaim hadiah dengan saldo akhir 1.040 ZC. Uji Common Engine pada desktop dan HP emulasi memigrasikan simpanan V1 ke V5, mengisi ulang air, dan membuka simpanan lewat engine native.
- Harness WebGL menjalankan enam skenario pada kualitas Tinggi dan Hemat Daya. Skenario mencakup Makaw makan dan kembali terbang, Gajah minum, Singa makan, Jerapah meraih daun, dan Zebra merumput. Ke-14 satwa memiliki pose yang valid. Setiap penutupan melepas kanvas, geometri, dan tekstur yang dimiliki sesi.
- Suite unit yang dijalankan langsung, pemeriksaan Astro, build, dan pengujian browser terfokus selesai. `qa:local` mencapai batas 600 detik pada tahap unit. `qa:verify` gagal karena bukti tahap tersebut belum lengkap.

## 1. Baseline dan data uji

- [x] Catat commit `main`, deployment, dan bundle `/play/` yang aktif saat implementasi dimulai. Pada audit 21 November 2026, MyZooTwin memakai `main` `4e0b027` dan MyFarmTwin memakai `main` `b3e8367`. Bundle produksi awal Zoo adalah `PlayEntry.astro_astro_type_script_index_0_lang.DkxgCKiV.js`.
- [x] Siapkan dua simpanan QA terisolasi. Gunakan satu profil baru untuk alur misi pertama dan satu fixture V5 berisi lima habitat, 14 satwa, fasilitas, serta progres misi untuk pengujian beban dan kelanjutan permainan.
- [x] Rekam peta awal, overview, dan fokus tiap habitat pada 360 × 780, 390 × 844, 844 × 390, dan desktop. Pada audit 390 × 844, tinggi kanvas Farm terukur 648 px. Kanvas Zoo terukur 336 px setelah **Lanjutkan** saat simulasi dijeda. Tangkapan kandidat mencakup kelima habitat pada HP tegak, HP mendatar, dan desktop.
- [ ] Ukur waktu sampai peta menerima input saat cold load, ukuran unduhan awal, dan p95 waktu frame di overview serta habitat aktif. Catat perangkat, browser, DPR, kualitas grafis, dan kondisi cache. Bandingkan kandidat dengan baseline pada kondisi yang sama.
- [ ] Rekam respons putar, pan, pinch, dan tap pada Android Chrome serta iPhone Safari fisik. Catat hasil emulasi dan perangkat fisik sesuai lingkungan pengujiannya. Gunakan hasil baseline untuk menetapkan anggaran muat dan frame sebelum menambahkan aset lanskap.

[Panduan QA](LOCAL_QA.md) · [Baseline performa HP sebelumnya](qa/mobile-performance-20261116/REPORT.md)

## 2. Peta utama dan kontrol HP

- [x] Tampilkan peta di `/play/` begitu pemeriksaan simpanan selesai. Pemain baru melihat peta dengan **Mulai misi**. Pemilik simpanan melihat peta yang dijeda dengan **Lanjut bermain**. Pertahankan alur yang jelas untuk simpanan bermasalah dan kegagalan WebGL.
- [x] Pindahkan petunjuk singkat ke dekat peta. Pastikan pembukaan peta sebelum **Mulai misi** atau **Lanjut bermain** mempertahankan tick, saldo, persediaan, dan progres misi. Kamera dan navigasi pengamatan tetap dapat dipakai saat jeda.
- [x] Tempatkan **Jalan/Jeda**, zoom, dan navigasi kembali ke seluruh zoo atau **Utuh** dalam jangkauan di sekitar peta. Pertahankan target sentuh minimal 44 × 44 piksel CSS, label ID/EN, dan kontrol keyboard desktop. Target kamera minimum 44 CSS px terukur pada lebar 320, 360, 390, 844, dan 1280.
- [x] Ringkas panel **Misi, Rawat, Tamu, dan Bangun** saat tertutup. Target awal kanvas sekitar dua pertiga tinggi viewport 390 × 844. Periksa agar panel terbuka, safe area, dan orientasi mendatar tetap memberi akses ke aksi dan konfirmasi.
- [x] Pertahankan satu jari putar, dua jari geser, serta pinch dengan titik tengah yang stabil. Uji transisi satu → dua → satu jari, `pointercancel`, dan perubahan orientasi saat menyentuh peta. Gesture juga diuji lewat input sentuh Chromium yang diemulasi.
- [ ] Uji tap yang disengaja pada kandang, satwa dan fasilitas setelah kamera bergerak. Putar, pan, pinch, dan sentuhan yang dibatalkan menghasilkan nol tap, nol perintah permainan, dan nol gulir halaman dari kanvas. Gulir panel dengan satu jari tetap bekerja.
- [ ] Uji perpindahan overview ↔ setiap habitat, termasuk **Utuh** dan pemulihan sudut serta zoom. Update simulasi, refill, dan batal bangun mempertahankan tab serta posisi gulir pemain.

[Checklist HUD yang sudah ada](FARM_STYLE_UI_CHECKLIST.md) · [Gesture sentuh](DIRECT_TOUCH_CAMERA.md) · [Akurasi tap satwa](MOBILE_ANIMAL_TAP.md)

## 3. Lanskap Tropical Creek

- [x] Buat sambungan visual dari tepian sungai dan jalur masuk ke vegetasi sekitar, lalu tambahkan siluet hutan serta bukit di kejauhan. Pertahankan kamera ortografis pada paket pertama.
- [x] Tempatkan dekorasi di lapisan adegan di luar grid permainan. Periksa agar perubahan visual mempertahankan batas bangun, jalur pengunjung, tabrakan, pemilihan satwa atau fasilitas, dan posisi simpanan lama.
- [x] Sesuaikan batas render dan framing agar lanskap tetap terlihat sewaktu kamera berputar. Periksa empat arah overview serta zoom masuk dan keluar di kelima habitat. Cek sambungan tanah dan sungai, objek terpotong, dan keterbacaan jalur serta pagar. Posisi pangkal pohon mengikuti permukaan mesh bukit. Regresi mencakup ukuran peta awal dan peta yang diperluas.
- [x] Muat aset dekorasi setelah aset penting peta. Gunakan aset yang lebih ringan, vegetasi lebih jarang, serta efek dan bayangan yang lebih sederhana pada **Hemat Daya**. Lanskap bersifat statis.
- [x] Uji pergantian kualitas, fokus habitat, ukuran layar, dan pemulihan WebGL. Pastikan satu kanvas tetap aktif dan resource GLB kembali ke baseline setelah peta ditutup serta dibuka berulang.
- [x] Bandingkan tangkapan layar dan hasil pengukuran dengan baseline. Sederhanakan lapisan dekorasi jika waktu siap menerima input atau p95 waktu frame melewati anggaran yang ditetapkan. Hemat Daya memakai material yang lebih sederhana dan batas resolusi internal kanvas pada orientasi tegak.

[Inventaris scene dan aset yang sudah dipakai Zoo](qa/glb/SCENE_ASSET_AUDIT.md)

## 4. Animasi Macaw dan harness GLB

- [x] Siapkan rangkaian **mendekati mangkuk → kontak paruh saat makan → kembali bertengger**. Gunakan kejadian perawatan dari simulasi yang sama untuk menyelaraskan gerakan dan porsi yang terlihat.
- [x] Cek pendaratan, posisi paruh terhadap mangkuk, dan perpindahan ke tenggeran dari kamera permainan. Uji pose serta kontak dengan fasilitas yang berlaku pada High dan Hemat Daya.
- [ ] Uji mangkuk kosong, perpindahan habitat, jeda dan lanjut, 1× dan 10×, serta cold reload di tengah rangkaian. Simulasi tetap menjadi sumber konsumsi, kebutuhan satwa, dan progres misi. Pastikan tidak ada konsumsi atau hadiah ganda.
- [ ] Gunakan harness habitat yang ada dengan renderer dan GLB kandidat. Simpan capture sebelum, saat, dan sesudah kontak dari kamera bermain. Periksa pose independen untuk kedua Macaw, perpindahan kualitas, dan pelepasan resource setelah remount.
- [x] Ulangi kontrol melalui `/play/` dengan misi pertama dan satu sesi simpanan lengkap. Periksa bahwa pemain dapat mengikuti gerak Macaw dari overview dan fokus kandang.

[Harness habitat](../scripts/qa/glb-habitat/lab.ts) · [Bukti verifikasi GLB](qa/glb/README.md)

## 5. Regresi dan kesiapan rilis

- [ ] Jalankan `npm run qa:local`, lengkapi pemeriksaan browser sesuai panduan QA, lalu jalankan `npm run qa:verify`. Ikat hasil fungsi, screenshot, dan performa ke commit kandidat yang sama.
- [x] Uji ID dan EN dari beranda ke `/play/`. Melalui UI, jalankan misi pertama, batalkan satu pratinjau bangun, konfirmasi satu pembangunan, isi ulang fasilitas, lalu jeda, reload, dan lanjutkan simpanan. Periksa saldo, hasil pembangunan, dan klaim hadiah pada setiap langkah. Refill diuji di alur simpanan V1 yang dimigrasikan.
- [x] Buka fixture lima habitat pada Common Engine dan `/play/?engine=native`. Gunakan simpanan uji yang sama untuk memeriksa saldo, posisi bangunan, unlock, progres misi, stok fasilitas, dan kondisi satwa setelah reload.
- [ ] Tinjau kembali matriks HP tegak, HP mendatar, dan desktop dengan peta penuh, panel terbuka, serta kamera yang bergerak. Catat hasil Android dan iPhone yang benar-benar diuji. Periksa fokus keyboard, target sentuh, dan pemulihan WebGL.
- [x] Periksa build produksi, identitas bundle dan manifest GLB, serta pemisahan fixture dan harness dari rute publik. Siapkan titik rollback yang dapat membuka simpanan V5 yang sama. Titik rollback `4e0b027` memakai format V5 yang sama.
- [x] Setelah rilis, cocokkan bundle `/play/` dengan build kandidat dan ulangi smoke untuk membuka peta, kembali dari fokus kandang, serta memuat simpanan pada profil uji.

## 6. Perluasan setelah pilot Macaw

- [x] Terapkan pola review kontak dan transisi yang sama untuk Gajah saat minum, Singa saat mendekati pakan, Jerapah saat meraih daun atau minum, dan Zebra saat merumput atau saling merawat.
- [ ] Ulangi pengukuran overview dengan seluruh 14 satwa dan regresi simpanan lengkap sesudah setiap kelompok perubahan animasi.
