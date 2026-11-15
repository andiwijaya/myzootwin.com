# Hasil harness dan rilis GLB MyZooTwin

P1–P4 dan integrasi renderer selesai pada 15 November 2026 WIB. Library berisi 122 master Pelatuk yang cocok dengan sumber. Lima spesies MyZooTwin kini memakai artwork GLB original: 14 individu, 28 varian high/low dan 264 klip. Produk juga memakai 22 template fasilitas GLB, vegetasi/batu terpilih dan pengunjung Pelatuk. Rilis fitur `9be8310` sudah deploy dan terverifikasi di [myzootwin.com](https://myzootwin.com). [Bukti deployment dan pemeriksaan domain](C:/MyZooTwin/docs/qa/glb/deployment-20261115.json) mencatat 318 pemeriksaan hash live dan smoke/cold-save produk.

- [P3: struktur, raw/runtime, seluruh individu dan review Codex](C:/MyZooTwin/docs/qa/glb/p3-final-20261115.json).
- [P4: 106 kasus, 530 capture, kontak, visual dan lifecycle](C:/MyZooTwin/docs/qa/glb/p4-final-20261115.json).
- [Alur produk: 16 catatan native UI, save, Studio, picking dan viewport](C:/MyZooTwin/docs/qa/glb/product-native-20261115.json).
- [Regresi, typecheck dan build kandidat](C:/MyZooTwin/docs/qa/glb/release-checks-20261115.json).
- [Audit seluruh kelompok objek scene](C:/MyZooTwin/docs/qa/glb/SCENE_ASSET_AUDIT.md).

Paket runtime lengkap high/low berjumlah 17,161,161 byte, di luar JSON/header. Pemuatan bertahap hanya mengambil pilihan yang dipakai. Angka ini bukan ukuran unduhan halaman awal. Master besar tetap di library authoring lokal, di luar public dan Git.

Review visual dilakukan Codex sesuai otorisasi autonomous pengguna. Angka frame merupakan CPU wall callback pada browser QA, bukan presented FPS. Portrait/landscape adalah emulasi viewport; perangkat fisik Samsung Galaxy A56 belum diukur. Lapisan parametrik yang mengikuti grid, preview, efek dan penghargaan global dipertahankan sesuai audit.

## Milestone library P1 dan P2

P1 dan P2 selesai pada 15 November 2026 WIB. Seluruh 122 master Pelatuk tersalin ke library MyZooTwin, cocok dengan hash sumber, dan lolos pemeriksaan library melalui actual GLB. Total master 689,550,484 byte atau 657.61 MiB. Bagian di bawah mempertahankan bukti milestone tersebut; identitas build, ukuran distribusi dan jumlah file historis P1/P2 bukan identitas kandidat rilis GLB baru.

Library: [manifest tujuan](C:/MyZooTwin/art/imports/pelatuk-aviary/v01/manifest.json). Progres dan seluruh 122 baris individual: [checklist utama](C:/MyZooTwin/docs/GLB_ASSET_PLAN_CHECKLIST.md). Acuan penggunaan harness: [GLB Asset Lab](C:/MyZooTwin/scripts/qa/visual3d/glb/README.md).

## Hasil yang terverifikasi

| Pemeriksaan | Hasil |
| --- | --- |
| Copy dan verifikasi sumber serta tujuan | 122 dari 122 master; 21 berkas provenance; sumber tetap identik |
| Inspector independen | 122 container; 46 skin; 56 klip; 209 instance gambar PNG tertanam |
| Pemuatan browser dan review library | 122 dari 122; console build akhir tanpa error atau warning |
| Tampilan utama | 732 view siang, studio, dan detail; 122 view tambahan dengan bayangan Low |
| Animasi | 56 klip pada 8 GLB; 280 sampel numerik dan 224 frame dalam 56 strip review |
| Skeleton antar-instance | 8 master dinamis lulus; pose dan tulang mandiri |
| Pivot dan penempatan asal | 80 komponen lulus pemulihan sourcePlacementM |
| Fasilitas | 20 kondisi stok lengkap/kosong/parsial/asimetris, ditambah 40 close-up pada kedua slot |
| Lifecycle | Enam siklus kembali ke baseline renderer 2 geometri dan 4 tekstur, dengan pool aset kosong |
| Recovery | Kegagalan HTTP, payload tidak cocok, dan parse terlambat setelah dispose lulus |
| UI native | Fly dan walk benar-benar berjalan; pause menghapus RAF; lima mode debug, dua instance, Low/High dan close/reopen lulus |
| Tes fokus | 13 dari 13 lulus, ditambah 1 dari 1 tes notice paket setelah pencatatan registry |
| Astro check | 642 file; 0 error, 0 warning, 0 hint |
| Build produk | 10 halaman, 37 berkas; tidak mengandung master GLB atau marker entry QA |
| Cleanup akhir | Canvas, callback RAF, pool, geometri/tekstur/program renderer nol; tab dan server QA ditutup |

Angka skin dan PNG adalah struktur atau instance di seluruh file, termasuk pengulangan resource dalam master yang mandiri. Pemeriksaan container adalah inspector lokal yang berbatas, bukan sertifikasi Khronos. Sampel animasi dan readback kanvas tidak menjadi pengukuran presented FPS atau HP fisik.

## Identitas build dan bukti

Build yang diterima adalah p2-20261115-d. Source fingerprint saat build dan saat verifikasi akhir sama: 02534f1e473fc4de26665f4a3e364e93b291c1eed59a2583cacfe38eea50dd5c. Manifest sumber Pelatuk tetap 868ef9f2ede908b72479258b215b26b6e107f1611fcbe0ce698bc06fc949b4f4.

- [Receipt akhir P1 dan P2](C:/MyZooTwin/docs/qa/glb/p2-verification-20261115.json).
- [Identitas setiap salinan dan provenance](C:/MyZooTwin/docs/qa/glb/p1-copy-20261115.json).
- [Pemeriksaan struktur aktual](C:/MyZooTwin/docs/qa/glb/p2-structural-20261115.json).
- [Review visual setiap master dan catatan integrasi](C:/MyZooTwin/docs/qa/glb/p2-visual-review-20261115.json).
- [Pengamatan kontrol native dan cleanup](C:/MyZooTwin/docs/qa/glb/p2-native-ui-20261115.json).
- [Pemeriksaan keluaran produk](C:/MyZooTwin/docs/qa/glb/p1-production-exclusion-20261115.json).
- [Source receipt build D](C:/MyZooTwin/.qa/glb/p2-20261115-d/source.json).
- [Batch aktual build D](C:/MyZooTwin/.qa/glb/p2-20261115-d/evidence/batch-20261114230043327-1/summary.json).
- [Lifecycle dan recovery build D](C:/MyZooTwin/.qa/glb/p2-20261115-d/evidence/recovery-20261114230145041-2/result.json).

Seluruh 1,092 PNG pada batch akhir diperiksa hash dan ukurannya. Jumlah ini mencakup capture native serta komposit overview dan strip animasi; bukan 1,092 sudut pandang independen. Capture native berukuran 768 x 576 pada DPR renderer 1. Thumbnail review diberi label dan tidak menggantikan capture asli.

Review awal C memakai 33 halaman overview, delapan halaman klip, dan empat halaman stok. Setelah framing detail dan exposure studio diperbaiki, 484 dari 488 view siang D identik piksel dengan C yang sudah direview. Empat view yang berubah ditinjau ulang. Seluruh view studio/detail D, 40 close-up stok, serta detail bunga juga ditinjau. Semua 56 set probe animasi C dan D identik. Metode ini mempertahankan pemeriksaan setiap master tanpa menganggap bukti lama otomatis berlaku pada file atau piksel yang berubah.

## Temuan yang ditangani dan catatan berikutnya

Preflight B menghasilkan geometri putih karena aturan pemuatan lokal menghalangi fetch blob tekstur. Bukti penolakan tetap tersimpan. CSP loopback kini mengizinkan decoding blob milik halaman, dan loader menolak hasil GLTFLoader yang kehilangan tekstur. Tes juga menjaga pelepasan resource ketika decode dependency gagal atau selesai setelah pool ditutup.

Dekorasi bunga dan bagian pakan/air semula terlalu kecil pada overview gabungan. Framing dekat kini membaca rentang komponen asli dari GLB, tanpa mengubah geometri atau pivot master. Studio memakai environment intensity 0.4 yang dicatat pada setiap capture; siang memakai factory pencahayaan produksi.

Tiga catatan tetap dibawa ke tahap integrasi mendatang:

- Fasilitas Pelatuk memiliki ukuran, anchor, slot stok dan branding sumber. Uji library ini belum menerima kontaknya untuk macaw atau mamalia MyZooTwin. Papan gerbang sebagian tertutup atap pada sudut kamera tinggi standar.
- Varian Low pengunjung mempunyai siluet pakaian yang lebih sederhana. Gunakan varian High untuk tampilan dekat.
- Bayangan close-up objek kecil memperlihatkan bias yang bergantung pada skala. Sesuaikan saat skala dunia dan komposisi gameplay ditetapkan.

Ketiganya tidak mengubah hasil identitas dan portabilitas master. Tidak ada perubahan pada master sumber atau master salinan untuk menutupi temuan tersebut. Paket distribusi ringan, validasi habitat gabungan, seluruh satwa GLB baru, dan pengukuran HP fisik tetap berada pada tahap berikutnya.

## Contoh capture aktual

Gambar berikut merupakan komposit berlabel dari delapan capture actual GLB di harness lokal. Ini bukan screenshot gameplay produksi atau ilustrasi hasil generasi gambar. Capture native dan hash sumbernya disimpan pada [provenance preview](C:/MyZooTwin/docs/qa/glb/preview-provenance.json).

![Contoh master GLB yang telah diperiksa](C:/MyZooTwin/docs/qa/glb/p2-preview-20261115.png)
