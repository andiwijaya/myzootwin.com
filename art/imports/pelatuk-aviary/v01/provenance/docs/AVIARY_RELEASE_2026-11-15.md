# Rilis aset original dan runtime Aviary

**Sudah live dan bisa dimainkan di https://pelatuk.com/aviary/.** Scope audit, kualitas aset di harness, integrasi, regresi, optimasi browser dan deploy terverifikasi selesai. Catatan akhir ini disimpan lokal setelah publikasi agar laporan tidak memicu deployment tambahan.

| Identitas | Hasil terverifikasi |
| --- | --- |
| Source / local HEAD / origin-main / GitHub-main | `d1d6e794d9220fb9c3eb219c1c2c05307a870f6e` |
| PR | https://github.com/andiwijaya/pelatuk-com/pull/1 — merged |
| Cloudflare Pages | Check `132555513782`, completed/success, 14 Nov 2026 19:07:58 UTC /15 Nov 02:07:58 WIB |
| Deployment | `b982e59e-507f-468c-a95e-136bca51f010`, https://b982e59e.pelatuk-com.pages.dev |
| Domain utama | `release.json`, homepage meta dan Aviary meta semuanya menunjuk SHA di atas |
| Build lokal dari source final | Typecheck/build PASS; marker commit sama;133file/22,915,338byte, file terbesar2,429,348byte |
| Batas perangkat | Bukti desktop/viewport; Samsung Galaxy A56 5G fisik, termal dan input sentuh BELUM DIUKUR |

## Yang dirilis

Dua model asli Caladi Tilik dan Common Flameback v41 memakai proporsi/pola/warna yang berbeda, material bulu/mata/paruh/kaki, rig dan sepuluh klip retained. Review kedua burung setelah pekerjaan pengunjung memperbaiki torso/gaze/handoff/shoulder dan sampling mematuk. Seluruh iterasi, kandidat ditolak, original texture inputs, sumber geometri, recipe dan master historis dipertahankan. Foto internet digunakan untuk pengamatan referensi, tanpa memasukkan piksel foto ke tekstur shipping.

Lingkungan native mencakup pohon, palma/pakis/semak, tanah/serasah, batu, sungai dan batu pijakan, enclosure/gerbang, pakan/air/tenggeran, tiga model pengunjung dan hadiah Q02/Q04. Kontak aktual dengan permukaan, bayangan, stock per slot, selection/build/edit dan disposal diperiksa. Offset pengunjung ganda yang menyebabkan kaki/tubuh mendekati tiang gerbang dihapus; langkah mengikuti jarak tempuh aktual. Scope ini meningkatkan realisme visual untuk website dan tetap merupakan representasi artistik.

Amati menyediakan perspektif melalui tiga titik, pilihan kedua spesies, sepuluh klip, orbit/zoom berbatas, keyboard/reset dan reduced motion. Dunia dijeda selama pengamatan. Fasilitas kosong mengikuti porsi spesies yang dipilih. Pada viewport390x844, kanvas close view memakai62.7% tinggi layar. Detail dimuat sesuai burung/stasiun yang dipilih. Menu tetap stabil saat detail selesai dimuat.

## Pustaka digital dan distribusi

Katalog [`assets/aviary/library.json`](../assets/aviary/library.json) berisi **122 master GLB mandiri terpilih**, total689,550,484byte; ada236GLB fisik termasuk riwayat. GLB master menyertakan geometri/material/tekstur; model dinamis juga menyertakan rig/animasi. Panduan pemakaian ulang: [AVIARY_ASSET_LIBRARY.md](AVIARY_ASSET_LIBRARY.md). MyZooTwin atau website lain dapat memakai master yang dipilih, dengan penyesuaian cahaya, perilaku, kontak dan lifecycle di renderer tujuan.

Web Pelatuk memakai47model turunan Brotli dan50sharedWebP, total18,636,215byte payload plus manifest84,517byte sebelum HTTP content coding. Semuanya hash-verified, memakai URL immutable, dengan manifest no-cache. Seluruh97respons domain utama sesuai isi/transport yang diterima. Manifest Cloudflare dapat dikompresi ulang oleh edge; alat verifikasi membandingkan isi JSON setelah Content-Encoding didekode dan menyimpan digest transport secara terpisah. Digest GLB terkompresi dan decoded serta seluruh WebP tetap exact.

Alokasi first-ready worst case:29model/24tekstur,5,389,203byte; ditambah reserve bootstrap768KiB menjadi6,175,635byte, di bawah6MiB. Bootstrap dari build final berukuran502,208byte dengan gzip/format terkompresi yang sesuai. Ini alokasi statis, bukan pengukuran first paint A56. Seluruh katalog tidak dimuat sekaligus. Master authoring, harness, source maps dan environment files tidak dipublikasikan. Gambar kartu berasal dari kanvas gameplay native960x600 dan memakai filename baru agar cache kartu lama tidak digunakan.

## Bukti regresi dan permainan

- 295/295 tes unit game lama dan570/570 full Aviary PASS. Setelah koreksi akhir,39tes fokus lifecycle/pause/localization/timing serta15tes world/QA PASS; empat tes sampler melindungi cadence render, long stall, pause dan reset. Angka tersebut tidak dijumlahkan sebagai tes unik.
- Matriks dua spesies/sepuluh klip pada HP, desktop dan landscape;14autoplay case; stok kosong/porsi terakhir/penuh/asimetris; batas kamera dan reduced motion; initial/detail failure recovery; enam reference cycles dan enam full renderer sessions. Semua resource milik session kembali nol setelah dispose, tanpa cleanup error.
- Pengukuran Low390x844 selama614,770.5ms aktif:36,640interval, median16.7ms/p9516.9ms, nol interupsi, max147,664triangle/150drawcall. Resource115geometri/58tekstur tetap stabil. Perawatan dilakukan melalui UI biasa; angka ini adalah browser proxy, bukan FPS/termal A56 fisik.
- Production preview menjalankan build/care/Amati kedua spesies, actual IndexedDB QA dan reload; game lama mendapat bounded smoke kedua practice species, keyboard, pause dan ID/EN. Feeding/lifecycle penuh game lama tidak diklaim dari smoke ini.
- Domain utama menjalankan pembangunan habitat dan lima petak jalur, klaimQ01, fasilitas/pakan/air, kedua burung, tiga titik Amati, zoom/reset, pengunjung dan tiket nyata+10ZC. Setelah pause, bahasa Inggris dan reload,923ZC tetap sama dan dunia dibuka dalam keadaan dijeda. Console warning/error kosong.

Tes browser memakai namespace QA eksplisit yang mempunyai database terpisah, tidak memakai preferensi bersama/broadcast/recovery download. Nama QA tidak valid menghentikan inisialisasi. Schema save, ID hewan, ekonomi dan aturan misi tidak diubah. Database suaka utama owner tidak dibuka/reset oleh pengujian ini. Tidak ada tes rutin yang meminta partisipasi atau approval download owner.

## Bukti akhir dan cleanup

[Receipt gabungan](QA_EVIDENCE/AVIARY_RELEASE_V01_2026-11-15/verified-release.json) mencocokkan local/GitHub/Pages/apex dan unique-deployment identities, build,97payload, save/locale, console dan cleanup. [Runtime V02](QA_EVIDENCE/AVIARY_RUNTIME_V02_2026-11-15/README.md) menyimpan metode dan temuan yang dikoreksi. Gambar `live-caladi-perch.png`, `live-common-perch.png`, station images dan `live-visitor-ticket.*` berasal dari domain utama. [Checklist](AVIARY_REALISM_CHECKLIST.md) seluruhR00–R20 selesai untuk scope ini.

Semua tab uji ditutup dan viewport sementara direset. Preview4190 dihentikan; helper4188 dihentikan setelah PID, node/Vite/project/port dan package loopback terverifikasi. Kedua port tidak lagi listen. Catatan pascarilis/checklist/receipt lokal tidak dipush lagi, sehingga source produksi tetap SHA yang sudah diuji. Semua perubahan aplikasi/aset telah merged; perubahan kerja yang tersisa adalah dokumentasi dan bukti pascarilis.

## Acuan rollback

Produksi sebelumnya adalah `b85990e7bdd0b03db8934ef1b7d5a55faf0bf7b9`, Pages deployment `7b5a5e07-2a83-4ddc-b904-f012de75eb87`. Marker apex sebelumnya diverifikasi sebelum publikasi. Bila ditemukan blocker produksi, simpan bukti lalu gunakan target produksi sebelumnya yang dikonfirmasi eligible pada project Pages yang sama, atau forward revert source yang direview. Jangan force-push atau menghapus data browser. Tidak ada rollback yang dilakukan pada rilis ini.
