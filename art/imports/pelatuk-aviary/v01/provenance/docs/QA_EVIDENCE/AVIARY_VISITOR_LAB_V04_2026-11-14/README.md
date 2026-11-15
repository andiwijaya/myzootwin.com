# Original visitor v04 — retained-file review

Keputusan: cukup sebagai model pengunjung latar untuk tahap komposisi habitat. Ini bukan sertifikasi scan manusia atau fotorealisme potret dekat. Siluet, kontak, jarak LOD dan konsistensi cahaya tetap dinilai bersama habitat sebelum rilis. Tiga adult generik Amber/Teal/Rose berbagi anatomi original dengan skala/palet tersendiri, masing-masing high/low.

Perbaikan dari checkpoint e454a17: mandibula/dagu, pipi, soket/brow dan hidung membentuk wajah; topi duduk pada kepala/hair dengan brim melengkung; telapak tangan meruncing menggantikan ellipsoid; kaus mempunyai grid permukaan torso/bahu/sleeve kontinu tanpa cap terbuka. Tali ransel mengikuti raycast mesh baju dan ransel aktual, termasuk LOD. Pita topi mengikuti penampang mahkota sehingga tidak berpotongan. Kandidat implicit shirt ditolak karena bobot/gejala lekuk; source/log/capture historis dipertahankan.

## Bukti

- Enam GLB v04 aktual, 17 joint, enam klip (idle/walk/observe serta tiga reduced-motion), enam material/mesh dan lima gambar embedded. High 39.496 triangle, low 14.512 triangle. Ini authoring master besar, belum paket mobile.
- 15/15 tes source/contact/mixer/local export dan build lulus. Tes kontak menggunakan vertex/triangle yang telah dipose; jarak konservatif pusat tali terhadap baju/ransel maksimum 5,99 mm pada sampel yang diperiksa, ambang 8 mm. Kaki planted, loop, off-key dan perpindahan klip tetap teruji.
- 28 pasangan source/actual retained-file render dan 56 metadata UI lulus. Kamera dibandingkan dalam toleransi 1e-12 m (selisih teramati maksimum 2,23e-16 m), framing/pose/controls sama. Mean channel error maksimum 0,201, p95 maksimum 1.0; ambang tetap 2/5/5%.
- 30 embedded PNG instances diverifikasi terhadap bitmap original dan procedural RGBA; toleransi maksimal satu tingkat RGBA, dengan inversi green normal sesuai GLTFExporter.
- Enam siklus import/dispose: source kembali 7 geometry/11 texture; import 13/22. Enam autoplay kasus klip embedded benar-benar bergerak di UI. Console warning/error kosong pada tab final. Ini counter warmed, bukan heap atau pengukuran A56 fisik.
- Semua 128 master historis (termasuk visitor v01/v02/v03) byte-identik. Total kini 134 GLB fisik termasuk revisi; enam pengunjung v04 masuk katalog terpilih, bukan seluruh riwayat.

Revisi v03 lulus perbandingan teknis tetapi ditolak visual karena strap floating dan band intersection. Delapan capture v03 sempat tertimpa capture v04 akibat helper persistens yang mempertahankan direktori lama; capture v04 dikenali dari actual importOrigin dan dipindah ke direktori ini. Lihat ../AVIARY_VISITOR_LAB_V03_2026-11-14/CAPTURE_CORRECTION.md. Tidak ada master yang tertimpa dan tidak ada gate bergantung pada bukti v03 yang hilang. Helper final memakai path keluaran eksplisit.

## Provenance dan batas

Seluruh bentuk, rig, garment, micro normals dan iris adalah source original. Cotton/head skin bitmap original beserta exact prompt dan UV guide berada di assets/aviary/originals/ dari checkpoint sebelumnya. Foto [pengamat burung](https://wyborcza.pl/7,177851,28226001,lornetki-dla-ukrainy-polscy-przyrodnicy-wspieraja-obroncow.html) dilihat hanya untuk acuan bentuk pakaian/topi/ransel; tidak menyalin pixel atau identitasnya ke model. [Foto yang diamati](https://bi.im-g.pl/im/c2/eb/1a/z28225986AMP%2COrnitolog-obserwujacy-ptaki.jpg).

Belum ada integrasi renderer produk atau deploy. Berikutnya, sesuai arahan owner terbaru: review ulang Caladi Tilik dan Common Flameback v39 dengan referensi foto sebelum komposisi habitat, lalu komponen mandiri, kontak fasilitas, Amati, LOD/delivery dan rilis.
