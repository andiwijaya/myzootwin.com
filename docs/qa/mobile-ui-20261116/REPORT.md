# Perapian UI HP MyZooTwin — 16 November 2026

Status: **PASS — sudah live dan diverifikasi pada domain utama.**

## Temuan dan perubahan

Audit langsung pada MyZooTwin produksi di viewport 320/360/390 px dibandingkan dengan MyFarmTwin live di 390 × 844. Menu krim/hijau dan toolbar sudah mengikuti arah visual referensi. Perbaikan berikut membuat parameter lebih mudah dicapai dan dibaca:

- Kartu kondisi Makaw, Gajah, Singa, Jerapah, dan Zebra ditempatkan langsung setelah judul perawatan spesies, sebelum daftar persediaan. Panel pemulihan Zebra tetap tersedia.
- Empat indikator setiap individu memakai label satu baris, angka 16 px di bawahnya, lalu bar 6 px. Petunjuk arah nilai dipadatkan; penjelasan aksesibel lengkap dipertahankan.
- Nama/perilaku makaw memakai judul kartu yang konsisten; jumlah makan/minum ditampilkan terpisah.
- Area 3D HP lebih ringkas supaya menu dan toolbar lebih cepat terlihat. Bantuan kamera pendek tetap didampingi petunjuk lengkap untuk pembaca layar.
- Header dan enam tujuan seragam pada 320 px, termasuk teks Inggris; Detail simpanan memiliki target sentuh 44 px.
- PageDown HP mengikuti gulir dokumen. Desktop tetap menggulir panel sendiri.

Sebelumnya kartu pertama Gajah berada 1.242 px di bawah awal panel Rawat, Singa 955 px, Jerapah 685 px. Kini kartu langsung mengikuti judul masing-masing spesies. Nilai kondisi, perhitungan, harga, handler transaksi, data GLB, animasi, dan format simpanan memakai implementasi yang sama.

## Verifikasi kandidat

| Profil browser | Pemeriksaan | Hasil |
| --- | ---: | --- |
| 320 × 640 | 94 | Lulus |
| 360 × 780 | 94 | Lulus |
| 390 × 844 | 94 | Lulus |
| 844 × 390 landscape | 94 | Lulus |
| 1280 × 800 desktop | 94 | Lulus |
| Total | 470 | Lulus |

Setiap profil memakai UI dan renderer game asli pada save sintetis terpisah. Uji integrasi mengirim input DOM/PointerEvents dan mencakup lima spesies, 14 individu dengan empat indikator, jeda tanpa perubahan progres, satu kanvas/subscriber, kamera, pembangunan fasilitas dan refill berbayar. Ini bukti viewport browser, bukan pengujian perangkat HP fisik.

Pemeriksaan native tambahan: label ID/EN 320 px, screenshot lima panel 390 px, Home/PageDown HP mengubah document y 0 → 560, sementara PageDown desktop mengubah panel scroll 0 → 509,33 dengan posisi dokumen tetap. Tidak ada overflow horizontal. Console desktop final kosong untuk warning/error (batas 100).

Pengujian terarah 42/42 lulus; typecheck final 0 error/0 warning/0 hint; build produksi 10 halaman. Regresi penuh 1.104 dari rilis sebelumnya tidak dijalankan ulang untuk perapian CSS dan urutan DOM ini.

Fingerprint sumber: `b1caf91d54271aec3b0bf0ecb110f85a2a570a50031ac402a326d760674a3017`.
SHA-256 HTML kandidat `/play/`: `c2d82350b90a60c91f34472eec0c7f4edb3889e63dd309149d26a1fab43bc5b9`, identik dengan produk QA.
Entry: `PlayEntry.astro_astro_type_script_index_0_lang.BWM1mIji.js`; CSS `play.DaI8aQHM.css`.

Receipt: [verification.json](verification.json), lima JSON profil, [tests.tap](tests.tap), [check.log](check.log), [build.log](build.log), [english-320.json](english-320.json), [page-scroll.json](page-scroll.json), [desktop-scroll.json](desktop-scroll.json). Bukti awal tersimpan pada `before-audit.json`, `before-parameters-360.jpg`, dan `myfarm-reference.jpg`.

## Publikasi

Commit fitur `e2fbe81b8bf2f7ce2b45f8be9f5e6b6879f77721` sudah berada di main. Cloudflare Pages deployment `fddb6acd-5558-4151-a51d-cbf02f8e1dc1` berhasil pada **16 November 2026, 12:25:25 WIB**, check `133109713241`. Domain [myzootwin.com/play/](https://myzootwin.com/play/) memuat entry BWM1mIji dan CSS DaI8aQHM. **130/130 body/hash** HTML, JS, CSS dan aset runtime cocok dengan kandidat QA. [Deployment](deployment.json), [hash live](live-body-check.json), [audit native live](live-ui.json).

Pada produksi, viewport 360 × 780 dan 390 × 844 memperlihatkan semua 14 individu (2 makaw, 2 gajah, 3 singa, 3 jerapah, 4 zebra), masing-masing empat indikator. Label satu baris, angka di bawah label, kartu 50–61 px setelah awal bagian spesies, tidak ada overflow horizontal. Target sentuh menu/toolbar minimal 44 × 44 px. Screenshot setiap spesies tersedia sebagai `live-*-390.jpg` dan overview `live-overview-390.jpg`.

Kampanye browser internal dilanjutkan dan langsung dijeda untuk mengaktifkan kontrol; tick bergerak singkat dari 96.185 menjadi 96.191 saat masuk. Selama perpindahan menu, tick tetap **96.191**, saldo **4.381 ZC**, populasi **14**. Tidak ada pembelian, refill, klaim, reset atau transfer save manual pada produksi. Console warning/error kosong (batas 100), satu kanvas. Sesi ditinggalkan dijeda pada seluruh zoo, tab buatan tugas ditutup, viewport dikembalikan dan tiga server QA milik tugas dihentikan.
