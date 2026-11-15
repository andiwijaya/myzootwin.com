# Rencana dan checklist aset GLB MyZooTwin

Tanggal: 15 November 2026 WIB.

Status: SELESAI DAN SUDAH DEPLOY. P1–P4, lima paket GLB/14 individu, integrasi, regresi serta verifikasi live selesai pada 15 November 2026 WIB. Rilis fitur `9be8310` aktif di https://myzootwin.com. Bukti akhir: `docs/qa/glb/deployment-20261115.json`.

## Keputusan pengguna

- Format aset MyZooTwin ke depan adalah GLB.
- Tahap implementasi pertama adalah menyalin seluruh 122 master terpilih dari Pelatuk dan mengujinya di harness MyZooTwin.
- Macaw, gajah, singa, jerapah, dan zebra mendapat aset GLB baru dengan target kualitas aset Pelatuk. Konversi bentuk prosedural lama saja tidak memenuhi keputusan ini.
- Harness seluruh satwa MyZooTwin menjadi bagian wajib dalam plan.
- Caladi Tilik dan Common Flameback ikut disalin, kemudian disimpan di library. Penambahan keduanya sebagai spesies gameplay belum menjadi scope.
- Otorisasi awal mencakup P1 dan P2 saja; milestone tersebut sudah selesai. Pada 15 November 2026 pengguna memperluas otorisasi ke seluruh task selanjutnya sampai deploy secara autonomous, dengan checklist diperbarui setiap progres dan berhenti bila diminta. Batas lama mengenai authoring dan deploy telah digantikan instruksi ini.

## Inventaris Pelatuk yang terverifikasi

Sumber katalog: [library.json](C:/PelatukDotCom/assets/aviary/library.json). Aset terpilih berjumlah 122 file, termasuk varian detail tinggi dan rendah; angka tersebut bukan jumlah jenis objek yang berbeda.

| Kelompok | Master | Ukuran MiB | Kandidat penggunaan di MyZooTwin |
| --- | ---: | ---: | --- |
| Burung v41 | 2 | 40.90 | Caladi Tilik dan Common Flameback sebagai library dan referensi kualitas |
| Pohon broadleaf v01 | 6 | 40.58 | Tiga variasi seed, masing-masing high dan low |
| Vegetasi bawah v01 | 6 | 17.25 | Pakis, palma berumpun, semak; masing-masing high dan low |
| Studi permukaan komposit | 8 | 71.73 | Ground, rock, creek, path; studi gabungan 4 x 4 m |
| Fasilitas v02 dan gate v03 | 12 | 97.02 | Enclosure, gerbang, pakan, air, tenggeran, reward; adaptasi ukuran dan kontak diperlukan |
| Pengunjung v04 | 6 | 73.86 | Tiga profil, masing-masing high dan low, dengan rig dan enam klip |
| Komponen permukaan mandiri v01 | 80 | 308.93 | Terrain 4, litter 4, boulder 6, bank rock 32, bed pebble 14, paving stone 18, river water 2 |
| Panji sanctuary v01 | 2 | 7.35 | Dekorasi gerbang high dan low |
| Total | 122 | 657.61 | 689,550,484 byte master authoring |

Ada 236 GLB fisik dalam direktori ekspor Pelatuk, termasuk riwayat. Gunakan 122 entri terpilih pada katalog. Katalog secara eksplisit mengecualikan 22 master yang ditolak; file di luar pilihan juga mencakup revisi yang telah digantikan.

Pemeriksaan file lokal pada 15 November 2026:

- Seluruh 122 master ditemukan, ukuran dan SHA-256 cocok dengan katalog.
- Seluruh header GLB yang diperiksa memakai glTF binary versi 2 dengan ukuran container sesuai.
- Referensi buffer dan gambar dalam 122 master tidak membutuhkan file eksternal. Tekstur master tertanam di dalam GLB.
- Ekstensi yang digunakan mencakup KHR_materials_sheen, KHR_materials_ior, KHR_materials_clearcoat, dan KHR_texture_transform.
- Kedua proyek menggunakan Three.js 0.187.0 pada package.json yang dibaca.
- Bukti harness Pelatuk tersedia untuk pemeriksaan source terhadap GLB aktual, animasi, kontak, dan lifecycle. Bukti tersebut belum menjadi hasil pengujian di MyZooTwin. Review 80 komponen permukaan Pelatuk memakai sampel keluarga dan LOD, bukan 80 persetujuan visual individual.
- Identitas dan struktur mandiri yang lolos di atas belum merupakan pemeriksaan penuh setiap accessor/skin atau hasil render baru. Poin ini adalah hasil inventaris awal; status load dan review final MyZooTwin tercatat selesai pada P1/P2 dan lampiran.

SHA-256 katalog saat plan dibuat: 868ef9f2ede908b72479258b215b26b6e107f1611fcbe0ce698bc06fc949b4f4.

Paket web Pelatuk juga tersedia di [public manifest](C:/PelatukDotCom/public/aviary-assets/v01/manifest.json): 47 model turunan Brotli dan 50 tekstur WebP bersama, total payload 18,636,215 byte atau 17.77 MiB, ditambah manifest 84,517 byte. Seluruh identitas model compressed dan decoded, identitas tekstur, serta path dependensi lokal telah cocok pada pemeriksaan ini. Paket tersebut hanya memilih sebagian master; tiga pengunjung yang disertakan memakai detail rendah. Pengujian header HTTP dan rendering MyZooTwin tetap dilakukan ketika runtime disiapkan.

## Batas dan struktur pekerjaan

Master 657.61 MiB merupakan pustaka authoring. Master disimpan di luar direktori public dan tidak dimuat sekaligus oleh permainan. Paket distribusi dipilih dan dibuat terpisah sesuai kebutuhan renderer.

| Lokasi yang direncanakan | Isi |
| --- | --- |
| C:/MyZooTwin/art/imports/pelatuk-aviary/v01/masters/ | Salinan 122 master dengan struktur relatif direktori exports dipertahankan |
| C:/MyZooTwin/art/imports/pelatuk-aviary/v01/provenance/ | Snapshot katalog, manifest sumber, catatan original assets, dan indeks bukti QA yang relevan |
| C:/MyZooTwin/art/animals/ | Sumber editable, tekstur original, rig, animasi, ekspor dan manifest satwa baru MyZooTwin |
| C:/MyZooTwin/.qa/glb/ | Build dan hasil percobaan harness yang terikat versi source dan hash aset |
| C:/MyZooTwin/docs/qa/glb/ | Bukti ringkas yang sudah diperiksa dan daftar temuan |
| C:/MyZooTwin/public/zoo-assets/ | Kandidat turunan runtime pada tahap integrasi mendatang, belum dibuat pada tahap pertama |

Katalog tujuan kelak mencatat sourcePath, localPath, source SHA-256, ukuran, kategori, versi, detail, satuan, transform, klip, provenance, dan lokasi evidence. Metadata sumber dipertahankan; peta path tujuan dicatat terpisah.

Mesin simulasi tetap menjadi pemilik perilaku, ekonomi, stok, tick, identitas satwa, dan save. GLB menyimpan tampilan dan artikulasi. Adapter renderer membaca state simulasi untuk memilih klip, gerak, dan kontak.

## Tahapan dan urutan kerja

| Tahap | Hasil yang harus tersedia | Status |
| --- | --- | --- |
| P0 Perencanaan | Keputusan pengguna, inventaris terverifikasi, plan dan tracker | SELESAI |
| P1 Penyalinan library | 122 master dan metadata yang cocok dengan sumber | SELESAI |
| P2 Harness library | Seluruh 122 master dimuat dari salinan MyZooTwin dan diperiksa | SELESAI |
| P3 Satwa baru | Lima paket satwa GLB baru dan harness seluruh 14 individu baseline | SELESAI — 28 high/low, 264 klip, raw/runtime E dan review Codex |
| P4 Habitat gabungan | Bukti satwa, fasilitas, dan lingkungan dalam fixture MyZooTwin terisolasi | SELESAI — 106 kasus high/low, 530 capture, resource akhir 0 |
| Integrasi produk | Pemasangan renderer GLB, distribusi, regresi, dan rilis | BERJALAN — lima spesies, Studio, vegetasi dan pengunjung terpasang; QA habitat dan rilis masih terbuka |

P1 dan P2 merupakan milestone implementasi pertama yang dipilih pengguna. P3 dan P4 tetap menjadi bagian plan lengkap, dengan checklist sendiri. Usulan urutan authoring setelah milestone pertama: zebra, jerapah, gajah, singa, lalu macaw. Zebra menjadi contoh standar kualitas pertama; pekerjaan berikutnya memakai pipeline ekspor dan pemeriksaan yang sama.

## Checklist persiapan yang sudah selesai

- [x] Menemukan katalog reusable Pelatuk dan memisahkan master terpilih dari riwayat.
- [x] Memverifikasi keberadaan, ukuran, SHA-256, dan header 122 master.
- [x] Memeriksa dependensi buffer dan gambar master yang mandiri.
- [x] Memeriksa identitas 47 model delivery dan 50 tekstur bersama.
- [x] Membaca panduan reuse dan bukti harness Pelatuk yang relevan.
- [x] Memeriksa renderer prosedural dan Visual3D Asset Lab MyZooTwin yang tersedia.
- [x] Memeriksa satu GLB macaw lama sebagai studi, bukan master final beranimasi.
- [x] Mengunci tiga keputusan interview pengguna dan memasukkan harness seluruh satwa.
- [x] Menyusun plan, checklist tahap, dan daftar individual 122 master.
- [x] Menetapkan batas berhenti setelah dokumen checklist dibuat.

## Checklist penyalinan library

- [x] P1.01 Periksa ulang hash katalog sumber sebelum copy dan jelaskan setiap perubahan dari inventaris plan.
- [x] P1.02 Buat struktur library tujuan di art/imports/pelatuk-aviary/v01.
- [x] P1.03 Salin tepat 122 master terpilih tanpa menimpa aset MyZooTwin yang sudah ada.
- [x] P1.04 Verifikasi SHA-256 dan ukuran setiap salinan terhadap master sumber.
- [x] P1.05 Simpan snapshot katalog, manifest, provenance, dan indeks bukti sumber.
- [x] P1.06 Buat manifest tujuan yang menghubungkan path sumber dan path salinan.
- [x] P1.07 Simpan dua burung pelatuk sebagai library, tanpa menambah spesies gameplay.
- [x] P1.08 Periksa build agar master authoring dan berkas QA tidak ikut distribusi public.
- [x] P1.09 Catat hasil per file pada lampiran dan ringkasan 122 dari 122 yang benar-benar lolos.

## Checklist harness library Pelatuk

Gunakan [Visual3D Asset Lab](C:/MyZooTwin/scripts/qa/visual3d/README.md) sebagai fondasi dan perluas dengan mode pemeriksaan GLB. Buat build immutable baru dari checkout saat pekerjaan dijalankan. Bundle historis tidak boleh dianggap sama dengan source terbaru.

Harness mempunyai pemeriksaan aset mandiri dan pemeriksaan konteks habitat. Pemutaran klip pada pemeriksaan aset tidak memberikan efek kebutuhan atau stok. Pemeriksaan habitat memakai state dan perintah simulasi yang asli.

- [x] P2.01 Bangun entry QA GLB, katalog, dan receipt source serta hash aset yang tepat.
- [x] P2.02 Tambahkan loader GLB bersama, cache, pembatalan load, retry, dan disposal milik session.
- [x] P2.03 Muat seluruh 122 salinan actual GLB dari library MyZooTwin, bukan mengulang generator source sebagai pengganti.
- [x] P2.04 Sediakan kamera orbit, framing penuh, front, side, back, quarter, serta tampilan dekat bagian penting.
- [x] P2.05 Sediakan pencahayaan siang dan studio, pemeriksaan high/low, bounds, pivot, normal, serta skeleton bila tersedia.
- [x] P2.06 Periksa skala metre, root transform, pivot komponen dan sourcePlacementM; cegah konversi skala burung dua kali.
- [x] P2.07 Periksa tekstur, warna, normal, transparansi dedaunan dan jaring, material, serta bayangan.
- [x] P2.08 Putar sepuluh klip masing-masing burung pelatuk, termasuk transisi takeoff dan land, sebagai pemeriksaan library.
- [x] P2.09 Periksa enam klip pengunjung, variasi high/low, reduced motion, dan langkah berdasarkan jarak aktual.
- [x] P2.10 Periksa instance dinamis dengan skeleton dan mixer terpisah agar pose satu instance tidak mengubah yang lain.
- [x] P2.11 Periksa fasilitas lengkap, kosong, parsial, stok per slot, dan nama bagian yang dibutuhkan adapter.
- [x] P2.12 Periksa permukaan komposit dan komponen mandiri, penempatan, batas tanah, air, serta jalur.
- [x] P2.13 Jalankan siklus buka, ganti aset, ganti detail, batal load, retry, tutup, dan buka ulang.
- [x] P2.14 Catat geometri, tekstur, draw call, triangle, payload, console, dan resource setelah dispose.
- [x] P2.15 Simpan bukti review untuk setiap master; status pass memerlukan catatan atau capture yang mengikat file dan hash.
- [x] P2.16 Tutup milestone pertama dengan ringkasan 122 copy/hash, 122 load, dan hasil review; temuan tetap terlihat.

## Checklist GLB baru seluruh satwa MyZooTwin

Targetnya lima paket spesies dengan sumber editable, material dan tekstur original, rig, animasi, serta GLB yang dibuka ulang. Jumlah akhir file GLB mengikuti varian high/low, jenis kelamin, dan pola individu yang dibutuhkan. Semua 14 individu bawaan pada baseline penuh wajib terwakili; angka ini berasal dari konfigurasi source, bukan pemeriksaan save pemain.

| Satwa | Individu baseline | Cakupan gerak dan kontak di harness | GLB final | Harness |
| --- | --- | --- | --- | --- |
| Macaw | macaw-1, macaw-2 | Perch, walk, hop, fly, eat, drink, rest; takeoff/landing dan transisi ground/perch | SELESAI | P3/P4 final; baseline 2 individu |
| Gajah | Ayu, Nara | Jalan, makan browse, minum dengan belalai, mandi, spray, rest, enrichment, interaksi belalai | SELESAI | P3/P4 final; baseline 2 individu |
| Singa | Raka, Sena, Tala | Jalan, makan, minum, rest, climb/descend kopje, lookout/roar, sniff, scratch, nuzzle; varian jantan dan betina | SELESAI | P3/P4 final; baseline 3 individu |
| Jerapah | Dira, Sora, Lila | Jalan, high browse, minum, rest/ruminate, social dan enrichment; tekukan leher serta tumpuan kaki | SELESAI | P3/P4 final; baseline 3 individu |
| Zebra | Zaki, Zuri, Mira, Kira | Jalan, trot, graze, minum, rest, follow herd, grooming, enrichment; pola tiap individu | SELESAI | P3/P4 final; baseline 4 individu |

Target kualitas mengikuti aset Pelatuk: siluet dan anatomi terbaca alami, permukaan tubuh menyatu, pola spesies mengikuti kulit atau bulu, detail kepala dan anggota tubuh jelas, material konsisten, serta gerak dan kontak meyakinkan saat GLB aktual dimainkan. Zebra dan jerapah memerlukan pola permukaan yang mengikuti tubuh; singa memerlukan bentuk jantan dan betina; gajah memerlukan belalai dan kulit; macaw memerlukan bulu, paruh, sayap, ekor, dan kaki tengger.

Studi [macaw lama](C:/MyZooTwin/art/studies/macaw-m0-03/README.md) hanya menjadi referensi historis. Studi tersebut tidak beranimasi dan tidak memenuhi kriteria master baru.

### Zebra

- [x] ZEB.01 Tetapkan referensi anatomi, ukuran terhadap dunia, ciri spesies, dan varian individu.
- [x] ZEB.02 Buat model serta material original dengan target kualitas Pelatuk, lalu periksa front, side, back, dan quarter.
- [x] ZEB.03 Buat rig dan animasi yang mencakup perilaku spesies pada matriks serta transisinya.
- [x] ZEB.04 Ekspor high/low dan varian yang diperlukan; catat manifest, hash, texture provenance, serta sumber editable.
- [x] ZEB.05 Buka ulang actual retained GLB dan bandingkan dengan sumber, termasuk frame di antara keyframe dan batas loop.
- [x] ZEB.06 Uji seluruh 4 individu secara bersamaan, identitas dan variasi, kontak fasilitas, serta interaksi antarsatwa.
- [x] ZEB.07 Simpan bukti visual dan gerak, tutup semua temuan penghambat, lalu tandai paket spesies selesai.

### Jerapah

- [x] GIR.01 Tetapkan referensi anatomi, ukuran terhadap dunia, ciri spesies, dan varian individu.
- [x] GIR.02 Buat model serta material original dengan target kualitas Pelatuk, lalu periksa front, side, back, dan quarter.
- [x] GIR.03 Buat rig dan animasi yang mencakup perilaku spesies pada matriks serta transisinya.
- [x] GIR.04 Ekspor high/low dan varian yang diperlukan; catat manifest, hash, texture provenance, serta sumber editable.
- [x] GIR.05 Buka ulang actual retained GLB dan bandingkan dengan sumber, termasuk frame di antara keyframe dan batas loop.
- [x] GIR.06 Uji seluruh 3 individu secara bersamaan, identitas dan variasi, kontak fasilitas, serta interaksi antarsatwa.
- [x] GIR.07 Simpan bukti visual dan gerak, tutup semua temuan penghambat, lalu tandai paket spesies selesai.

### Gajah

- [x] ELE.01 Tetapkan referensi anatomi, ukuran terhadap dunia, ciri spesies, dan varian individu.
- [x] ELE.02 Buat model serta material original dengan target kualitas Pelatuk, lalu periksa front, side, back, dan quarter.
- [x] ELE.03 Buat rig dan animasi yang mencakup perilaku spesies pada matriks serta transisinya.
- [x] ELE.04 Ekspor high/low dan varian yang diperlukan; catat manifest, hash, texture provenance, serta sumber editable.
- [x] ELE.05 Buka ulang actual retained GLB dan bandingkan dengan sumber, termasuk frame di antara keyframe dan batas loop.
- [x] ELE.06 Uji seluruh 2 individu secara bersamaan, identitas dan variasi, kontak fasilitas, serta interaksi antarsatwa.
- [x] ELE.07 Simpan bukti visual dan gerak, tutup semua temuan penghambat, lalu tandai paket spesies selesai.

### Singa

- [x] LIO.01 Tetapkan referensi anatomi, ukuran terhadap dunia, ciri spesies, dan varian individu.
- [x] LIO.02 Buat model serta material original dengan target kualitas Pelatuk, lalu periksa front, side, back, dan quarter.
- [x] LIO.03 Buat rig dan animasi yang mencakup perilaku spesies pada matriks serta transisinya.
- [x] LIO.04 Ekspor high/low dan varian yang diperlukan; catat manifest, hash, texture provenance, serta sumber editable.
- [x] LIO.05 Buka ulang actual retained GLB dan bandingkan dengan sumber, termasuk frame di antara keyframe dan batas loop.
- [x] LIO.06 Uji seluruh 3 individu secara bersamaan, identitas dan variasi, kontak fasilitas, serta interaksi antarsatwa.
- [x] LIO.07 Simpan bukti visual dan gerak, tutup semua temuan penghambat, lalu tandai paket spesies selesai.

### Macaw

- [x] MAC.01 Tetapkan referensi anatomi, ukuran terhadap dunia, ciri spesies, dan varian individu.
- [x] MAC.02 Buat model serta material original dengan target kualitas Pelatuk, lalu periksa front, side, back, dan quarter.
- [x] MAC.03 Buat rig dan animasi yang mencakup perilaku spesies pada matriks serta transisinya.
- [x] MAC.04 Ekspor high/low dan varian yang diperlukan; catat manifest, hash, texture provenance, serta sumber editable.
- [x] MAC.05 Buka ulang actual retained GLB dan bandingkan dengan sumber, termasuk frame di antara keyframe dan batas loop.
- [x] MAC.06 Uji seluruh 2 individu secara bersamaan, identitas dan variasi, kontak fasilitas, serta interaksi antarsatwa.
- [x] MAC.07 Simpan bukti visual dan gerak, tutup semua temuan penghambat, lalu tandai paket spesies selesai.

## Kriteria harness yang berlaku untuk semua satwa

Progres 15 November 2026: adapter renderer produk telah dipasang untuk zebra, jerapah, singa, gajah, dua macaw dan Studio. Loader menghentikan jam simulasi sementara aset dimuat, mempertahankan identitas, pose dan tumpuan saat berganti LOD, serta memisahkan ownership setiap skeleton. Uji unit baru 10 kasus lulus; regresi terarah macaw/gajah 20 kasus lulus. Paket lingkungan terpilih berisi 18 GLB dan 13 WebP bersama, 6,360,480 byte, diverifikasi terhadap delivery Pelatuk; gate/panji Pelatuk dan dua burung tidak dipasang ke gameplay. Harness Foundation memory-only sedang disiapkan. Ini belum merupakan persetujuan visual/kontak atau kelulusan rilis.

Runtime draft D: 28 model terkompresi dan 264 klip berhasil dimuat, 14 individu high/low tampil dengan 287 bone mandiri; recovery PASS pada recovery-20261115003415645-3. Setelah scene ditutup, pool/template/instance/geometri/material/tekstur/bone, renderer geometri/tekstur/program, kanvas dan RAF semuanya 0, tanpa error/warning. Revisi E zebra/singa tetap memerlukan bukti baru yang mengikat hash terbaru; hasil D tidak dipakai untuk meluluskan revisi tersebut.

Bukti .01 dan .04: art/animals/v01/references.json, mammal/macaw source dengan bounds serta kontrak skeleton, manifest.json (28 varian high/low), recipe.json dan snapshot recipe; tekstur original tertanam di master dan juga tersimpan editable lokal. Satuan tetap kontrak scene, bukan klaim ukuran biologis dalam metre. Review bentuk, gerak, kontak dan ukuran relatif dalam habitat tetap merupakan gate terpisah yang terbuka.

- [x] H.01 Container, accessor, vertex, index, normal, UV, skin, inverse bind, morph bila ada, material, dan gambar diperiksa pada GLB yang benar-benar disimpan.
- [x] H.02 Root transform dan bounds benar; seluruh tubuh terlihat pada framing yang dicatat.
- [x] H.03 Model dekat dan overview diperiksa pada high dan low dengan pencahayaan MyZooTwin.
- [x] H.04 Seluruh perilaku eksisting pada state machine tiap spesies terpetakan ke klip atau artikulasi; tidak ada perilaku yang hilang.
- [x] H.05 Gerak langkah mengikuti jarak aktual; telapak, cakar, dan kuku tidak melayang atau bergeser saat menumpu.
- [x] H.06 Peralihan idle, bergerak, makan, minum, rest, serta interaksi spesifik tidak snapping atau merusak mesh.
- [x] H.07 Mulut, paruh, atau belalai mencapai makanan dan air; stok penuh, porsi terakhir, parsial, dan kosong memberi tampilan yang tepat.
- [x] H.08 Kontak tanah, tenggeran, kolam, kopje, shade, browse, enrichment, dan pasangan sosial diperiksa sesuai spesies.
- [x] H.09 Pergerakan tetap di habitat dan batas jalan yang valid; perubahan skala visual tidak merusak footprint atau jangkauan.
- [x] H.10 Setiap individu memiliki skeleton, mixer, dan state animasi mandiri; sharing geometri atau tekstur tidak menggabungkan pose.
- [x] H.11 Pause, resume, kecepatan pengamatan, reduced motion, dan pindah klip tidak mengubah state gameplay.
- [x] H.12 Loading gagal, retry, pindah model saat load, context loss bila didukung, serta tutup saat load tidak meninggalkan callback atau resource.
- [x] H.13 Mount dan dispose berulang menghasilkan resource milik session kembali ke baseline yang ditetapkan dan tanpa error cleanup.
- [x] H.14 Frame peralihan, off-key, loop, dan pertemuan antarbagian diuji; satu screenshot diam belum menyelesaikan animasi.
- [x] H.15 Semua 14 individu dan lima spesies memiliki catatan review, hash file, versi source, dan capture yang sesuai.

## Checklist konteks habitat gabungan

Gunakan fixture QA terisolasi dari engine MyZooTwin, dengan lima habitat dan semua individu baseline. Jangan membuka, menyalin, atau mengubah save pemain untuk membuat bukti.

- [x] P4.01 Siapkan fixture dan build harness baru yang terikat source serta seluruh hash GLB.
- [x] P4.02 Masukkan aset lingkungan Pelatuk yang dipilih dan setiap paket satwa baru ke konteks habitatnya.
- [x] P4.03 Periksa ukuran relatif satwa, vegetasi, fasilitas, pengunjung, jalur, gerbang, serta keterbacaan komposisi.
- [x] P4.04 Sesuaikan anchor fasilitas di authoring aset dan adapter presentasi dengan dimensi satwa; fasilitas pelatuk tidak dianggap siap untuk macaw atau mamalia hanya karena dapat dimuat.
- [x] P4.05 Periksa picking, identitas objek, bounds, preview penempatan, perubahan stok, dan kontak actual mesh.
- [x] P4.06 Jalankan perilaku melalui perintah dan tick asli pada fixture; waktu preview aset tetap terpisah dari waktu simulasi.
- [x] P4.07 Periksa desktop, portrait, landscape, high/low, dan reduced motion dengan viewport yang tercatat.
- [x] P4.08 Catat payload subset awal, muatan detail, render statistics, dan waktu frame dengan metode yang dinyatakan.
- [x] P4.09 Uji buka, main, pause, tutup, buka ulang, serta pelepasan seluruh resource milik harness.
- [x] P4.10 Simpan daftar temuan dan bukti yang cukup untuk merencanakan integrasi renderer produk.

Bukti viewport desktop tidak diberi label pengujian HP fisik. Performa, termal, dan input Samsung Galaxy A56 fisik tetap berstatus belum diukur sampai ada pengujian perangkat tersebut.

## Integrasi produk dan rilis

Otorisasi pengguna telah diperluas sampai deploy. Bukti integrasi: `docs/qa/glb/product-native-20261115.json`, inventaris `SCENE_ASSET_AUDIT.md`, dan laporan P3/P4 final.

- [x] I.01 Pasang loader dan adapter GLB produksi, identitas individu, picking dan transisi LOD.
- [x] I.02 Pilih turunan runtime, shared WebP, Brotli, pemuatan bertahap dan batas distribusi. Total seluruh paket high/low 17,161,161 byte; master besar tetap lokal.
- [x] I.03 Buat 22 template GLB fasilitas original yang sesuai kontrak kontak MyZooTwin; verifikasi 26 instance baseline dan setiap porsi stok.
- [x] I.04 Audit seluruh kelompok objek; catat alasan konkret lapisan terrain/jalur/pagar/preview/efek/dekorasi global tetap parametrik.
- [x] I.05 Jalankan regresi gameplay/save/ekonomi/stok/onboarding/preview/accessibility/resource. Continue, native picking Zuri, refill, transaksi jalur, Studio, context recovery, cold save, portrait/landscape, high/low, reduced motion dan speed10 lulus.
- [x] I.06 Siapkan kandidat produksi yang dapat ditinjau: Astro 0 error/warning/hint, 32 tes akhir terarah lulus, build10 halaman/160 file identik dengan acuan produk QA, tanpa QA/authoring tersalurkan.
- [x] I.07 Commit/push kandidat yang sudah diverifikasi, tunggu deployment Cloudflare Pages untuk SHA yang tepat, lalu periksa origin deployment dan myzootwin.com.

## Aturan memperbarui progres

Gunakan BELUM DIMULAI, BERJALAN, PERLU PERBAIKAN, atau SELESAI. Kotak ditandai selesai setelah hasilnya benar-benar ada dan lokasi bukti dicatat. Catat tanggal, source atau asset hash yang diuji, hasil, dan temuan tersisa. Perubahan asset atau source yang memengaruhi bukti membuka ulang pemeriksaan terkait.

Jika suatu pemeriksaan tidak berlaku pada model tertentu, catat alasan yang konkret di evidence. Kolom load, copy, dan review visual tidak disatukan: hash yang benar tidak membuktikan model berhasil ditampilkan.

| Ukuran progres | Hasil saat ini |
| --- | --- |
| Inventaris sumber | 122 dari 122 master cocok dengan ukuran dan SHA-256 katalog |
| Master disalin ke MyZooTwin | 122 dari 122; SHA-256 cocok, sumber utuh |
| Actual GLB salinan dimuat di harness MyZooTwin | 122 dari 122; final d tanpa error/warning |
| Master Pelatuk direview visual di harness MyZooTwin | 122 dari 122; final d dan catatan adaptasi tercatat |
| Paket spesies GLB baru selesai | 5 dari 5; P3 raw/runtime E dan P4 finalG |
| Individu MyZooTwin lolos harness GLB baru | 14 dari 14; seluruh53 konteks pada high dan low |
| Konteks habitat gabungan | SELESAI; 106 kasus, 530 capture, 14/14 individu, 26 fasilitas, 17 dekorasi; error/warning 0 dan resource akhir 0 |
| Kode produk dan rilis | SELESAI DAN DEPLOY; 318 pemeriksaan hash HTTP lulus pada origin rilis dan myzootwin.com; live play/cold save lulus |

## Catatan progres

- Rilis fitur `9be8310` berhasil di Cloudflare Pages, deployment `8310b9fc-ecff-4f19-90cb-1194c31f2f3d`. Seluruh 159 file publik per origin cocok dengan build yang memakai konfigurasi publik Cloudflare yang sama (318 pemeriksaan). Header GLB Brotli dan cache runtime benar. Path QA/authoring mengembalikan fallback homepage yang identik, bukan file privat.
- Live native pada origin deployment baru: dua makaw GLB, pembangunan habitat dan ketiga fasilitas care, refill, konsumsi makanan/air, pause serta cold Continue berhasil tanpa error/warning. Saldo cold 960 ZC, air 6/8; save pemilik di apex tidak dibuka. Semua tab QA ditutup dan viewport dipulihkan.


- Final P4: 106 kasus (53 high +53 low), 530 capture, semua14 individu hadir; tidak ada error/warning. Setiap close meluluskan geometri/tekstur/kanvas/frame dan native program witness 0. Review Codex10 board mencakup60 capture sumber; probe kontak makanan/air setiap spesies serta revisi penyangga mangkuk telah diperiksa. `p4-final-20261115.json`.
- Final produk:16 catatan alur asli di `product-native-20261115.json`, cold reload mempertahankan hash gameplay, dan viewport412×915 serta915×412 lulus high/low. Viewport dipulihkan. Penutupan final owners0, frame0, geometry/texture/material/instance/canvas0, cleanup error0, save bersih tanpa inflight.
- Kandidat produksi: 10 halaman,160 file, hash setiap file identik dengan produk normal yang dipakai membangun QA final. Astro672 file:0 error,0 warning,0 hint. Semua32 tes akhir terarah lulus. Deployment belum ditandai selesai sebelum domain terverifikasi.


- 15 November: P3 master/runtime final E selesai dimuat ulang: masing-masing 28 file dan 264 klip lulus, 14 individu high/low dengan 287 bone mandiri, retry dan late-parse PASS. Review Codex mencakup seluruh overview raw/runtime dan animasi representatif setiap anatomi high/low. Bukti: `docs/qa/glb/p3-final-20261115.json`.
- Regresi penuh: 1.080/1.081 awal lulus; satu gate inventaris lama ditutup lewat ekstensi GLB yang mengikat hash serta mempertahankan receipt historis. Rerun kedua tes inventaris lulus. Empat tes fasilitas final juga lulus.
- Produk: Continue dan low/reduced mempertahankan gameplay; native klik memilih Zuri; isi ulang makaw 12 ZC dan jalur 15 ZC tepat; context loss/retry pulih dengan satu session dan 14 individu. Pemuatan ulang save dan viewport masih diperiksa.


Milestone terbaru, 15 November 2026: batch E master `batch-20261115011346499-1` dan runtime `batch-20261115011346958-1` masing-masing memuat 28/28 model dan 264 klip. Herd E `herd-20261115011858625-2` / `herd-20261115011858947-2` memeriksa seluruh 14 individu high/low dan 287 bone terpisah. Recovery E `recovery-20261115011950054-3` / `recovery-20261115011950390-3` PASS. Penutupan kedua sesi mengembalikan seluruh pool, renderer geometri/tekstur/program, kanvas dan RAF ke 0, tanpa error/warning. Struktur, off-key dan loop: `docs/qa/glb/p3-structure-motion-e-20261115.json`.

Baseline Foundation prototype F menampilkan 14 satwa dan 26 fasilitas GLB. Optimasi static mesh/porsi menurunkan draw call dari 268 menjadi 151 pada high. Pergantian high ke low saat pause mempertahankan tick 13580, seluruh 14 individu dan 287 bone, dengan selisih posisi tumpuan kaki dunia maksimum 0; low mencatat 150 draw call dan 275,884 triangle. Ini hasil context QA, bukan FPS/performa perangkat fisik. Uji fixture GLB actual untuk stok penuh/parsial/terakhir/kosong dan ownership lulus. Adapter kopje ditambah orientasi serta tumpuan sesuai kemiringan dari aturan ground asli; uji sole pada ramp lulus. Matriks final source terbaru, kontak dan rilis masih menunggu.

| Tanggal WIB | Tahap | Perubahan dan bukti | Berikutnya |
| --- | --- | --- | --- |
| 15 November 2026 | P0 | Inventaris dan identitas file lokal diperiksa; tiga keputusan interview dan permintaan harness seluruh satwa dicatat; checklist dibuat. | Berhenti setelah planning dan dokumen; tunggu instruksi mulai implementasi. |
| 15 November 2026 | P1 dan P2 | Pengguna memberi instruksi mulai copy 122 master dan pengujian harness; authoring satwa baru dan deploy tetap ditunda. | Salin, verifikasi, lalu uji actual retained GLB di loopback QA. |

| 15 November 2026 | P1 | 122 master / 689,550,484 byte dan 21 berkas provenance tersalin; hash sumber serta tujuan cocok. Bukti: [receipt P1](qa/glb/p1-copy-20261115.json). | P1.08 menunggu scan build; P2 harness dimulai. |

| 15 November 2026 | P2 preflight | Run b ditolak untuk visual: aturan connect-src harness menghalangi decode blob tekstur; capture ditahan di .qa/glb/p2-20261115-b/evidence/manual-20261114224601042-1. Loader diperketat agar missing texture menjadi kegagalan, bukan sukses geometri saja. | Perbaiki harness dan jalankan build immutable baru. |

| 15 November 2026 | P1 selesai dan P2 load | Build produk 10 halaman berhasil; 37 output bebas master dan marker GLB QA. Batch C memuat 122/122 master, 732 view, 56 klip, 20 varian stok; inspector independen memeriksa 46 skin dan 209 embedded PNG. | Review visual dan lifecycle/recovery. |

| 15 November 2026 | P2 review dan recovery | 33 halaman capture master, delapan halaman 56 klip, dan empat halaman stok ditinjau. 120/122 review library selesai; enam siklus resource kembali ke baseline 2 geometri/4 tekstur. HTTP retry, payload rusak, dan late parse setelah dispose lulus. | Perbaiki framing detail untuk reward dan bagian fasilitas kecil; review ulang lalu tutup P2. |

| 15 November 2026 | P2 visual selesai | Final d memuat ulang 122/122 master tanpa error/warning; 122 review library selesai, termasuk bunga dan 40 close-up stok. 484 view siang identik piksel dengan C; empat yang berubah diperiksa ulang. 56 set probe animasi identik. 13 tes fokus lulus; Astro check 642 file tanpa error/warning/hint. | Smoke kontrol UI, close/reopen, lalu cleanup dan receipt akhir P2. |

| 15 November 2026 | P1 dan P2 selesai | Receipt akhir: [p2-verification-20261115.json](qa/glb/p2-verification-20261115.json). Playback native fly/walk, lima mode debug, dua instance, low/high, close/reopen lulus. Final canvas, pool, renderer dan RAF nol; tab serta seluruh port server QA ditutup. | Berhenti pada P1/P2. P3 dan deploy belum dimulai. |

| 15 November 2026 | Otorisasi lanjutan / P3 dimulai | Pengguna mengizinkan semua task berikutnya sampai deploy secara autonomous, atau sampai diminta stop; pengujian yang meminta approval seperti download dihindari. P1/P2 tetap selesai. | Referensi anatomi dan pipeline zebra, lalu kelima spesies, harness 14 individu, integrasi, regresi dan deploy. |

| 15 November 2026 | P3 draft authoring | Sumber editable baru di art/animals/v01; anatomi implicit, permukaan kulit, blended weights, atlas pola original, detail dan klip. 28 draft high/low untuk varian 14 individu, 264 klip, seluruh struktur lulus [inspector draft](qa/glb/p3-structural-draft-20261115.json). Trial zebra A dibuka ulang; kepala dinilai terlalu pendek dan direvisi. Status ini belum penerimaan visual, gerak, atau kontak. | Review aktual seluruh draft di harness, perbaiki temuan, lalu uji semua individu dan habitat. |

| 15 November 2026 | P3 draft harness | Run all-a: 28/28 actual load/render dan 264 klip, error/warning browser nol; enam siklus lifecycle/recovery lulus. [Review draft](qa/glb/p3-draft-review-20261115.md) mencatat telinga zebra, pola leher jerapah, belalai/kerutan gajah, surai singa, dan wajah/bulu macaw yang perlu diperbaiki. | Revisi aset dan ulangi review affected views/poses; paket satwa tetap belum diterima. |

| 15 November 2026 | P3 revisi dan tumpuan | Run all-b kembali memuat/render 28/28 tanpa error/warning; bidang tanah kini tetap dan macaw memakai tenggeran QA. Perbaikan bentuk/material diperiksa; ditemukan gap bahu jerapah dan tumpuan gerak/rest yang perlu diperbaiki. Adapter artikulasi GLB baru mencapai target mulut dan mempertahankan tinggi telapak pada probe CPU awal. .01 dan .04 seluruh spesies selesai berdasarkan source, referensi, manifest dan recipe; gate visual/gerak/kontak tetap terbuka. | Ekspor dengan adapter dan perbaikan bahu/surai, kemudian pemeriksaan actual GLB serta fixture semua individu. |

| 15 November 2026 | P3 ekspor C / kandidat delivery | 28 actual master dan 264 klip lulus struktur, perbandingan source pada off-key dan batas loop [receipt C](qa/glb/p3-structure-motion-c-20261115.json); batch native C 28/28 tanpa error/warning. Enam tes artikulasi/cache runtime lulus; Astro check 654 file, nol diagnostik. Kandidat delivery memakai 28 model Brotli dan 38 tekstur bersama, total 11,754,028 byte dari 63,335,396 byte master. Review tujuh halaman overview membuka perbaikan pola belakang zebra, proporsi singa dewasa dan kaki/telinga gajah. | Revisi terakhir affected assets, uji actual delivery + seluruh individu dan lanjut fixture habitat. Kandidat belum dipasang atau dideploy. |

| 15 November 2026 | P3 master dan runtime D | Master D dan paket Brotli/WebP masing-masing 28/28 actual load/render, 264 klip, error/warning browser nol. Harness concurrent master serta runtime menampilkan 14 individu dengan 287 bone mandiri pada high dan low; mixer satu individu tidak mengubah individu lain. Kandidat D mengecilkan tekstur low menjadi 768x512 dan total payload menjadi 10,666,431 byte. Astro check 656 file bersih. | Review capture concurrent dan varian; rapikan pola rump zebra/anggota gerak singa, lalu adapter renderer dan fixture habitat. Kontak fasilitas dan penerimaan produk belum ditandai selesai. |

Ringkasan hasil dan gambar: [Hasil P1 dan P2](qa/glb/README.md). Registry provenance utama juga mencatat library impor melalui audit_glb_library_2026_11_15 pada ASSET_MANIFEST.json.

## Acuan

- [Katalog terpilih Pelatuk](C:/PelatukDotCom/assets/aviary/library.json).
- [Panduan reuse Pelatuk](C:/PelatukDotCom/docs/AVIARY_ASSET_LIBRARY.md).
- [Provenance original assets Pelatuk](C:/PelatukDotCom/assets/aviary/README.md).
- [Bukti runtime Pelatuk](C:/PelatukDotCom/docs/QA_EVIDENCE/AVIARY_RUNTIME_V02_2026-11-15/README.md), sebagai referensi sumber.
- [Bukti komponen permukaan Pelatuk](C:/PelatukDotCom/docs/QA_EVIDENCE/AVIARY_SURFACE_COMPONENTS_V01_2026-11-14/README.md).
- [Manifest delivery Pelatuk](C:/PelatukDotCom/public/aviary-assets/v01/manifest.json).
- [Visual3D Asset Lab MyZooTwin](C:/MyZooTwin/scripts/qa/visual3d/README.md).
- [Renderer MyZooTwin](C:/MyZooTwin/src/game/render3d/foundation-scene.ts).
- [Spesies MyZooTwin](C:/MyZooTwin/src/game/core/species.ts), [jerapah](C:/MyZooTwin/src/game/core/giraffe-state.ts), dan [zebra](C:/MyZooTwin/src/game/core/zebra-state.ts).
- [Manifest provenance MyZooTwin](C:/MyZooTwin/docs/ASSET_MANIFEST.json).
- [Studi GLB macaw historis](C:/MyZooTwin/art/studies/macaw-m0-03/README.md).

## Tracking individual master Pelatuk

Semua status berikut mencatat hasil pemeriksaan tujuan MyZooTwin yang sudah selesai pada P1/P2. Path tautan menunjuk master sumber Pelatuk. Daftar diambil dari 122 entri katalog dengan hash snapshot yang dicatat di atas. Copy/SHA, actual load, dan review visual seluruhnya memiliki receipt pada docs/qa/glb.

### Burung

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [sunda-pygmy-draft-v41](C:/PelatukDotCom/assets/aviary/exports/sunda-pygmy-draft-v41.glb) | 17.88 | [x] | [x] | [x] |
| [common-flameback-draft-v41](C:/PelatukDotCom/assets/aviary/exports/common-flameback-draft-v41.glb) | 23.02 | [x] | [x] | [x] |

### Pohon

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [broadleaf-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/forest/broadleaf-17-high-v01.glb) | 7.06 | [x] | [x] | [x] |
| [broadleaf-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/forest/broadleaf-17-low-v01.glb) | 6.47 | [x] | [x] | [x] |
| [broadleaf-203-high-v01](C:/PelatukDotCom/assets/aviary/exports/forest/broadleaf-203-high-v01.glb) | 7.06 | [x] | [x] | [x] |
| [broadleaf-203-low-v01](C:/PelatukDotCom/assets/aviary/exports/forest/broadleaf-203-low-v01.glb) | 6.47 | [x] | [x] | [x] |
| [broadleaf-841-high-v01](C:/PelatukDotCom/assets/aviary/exports/forest/broadleaf-841-high-v01.glb) | 7.06 | [x] | [x] | [x] |
| [broadleaf-841-low-v01](C:/PelatukDotCom/assets/aviary/exports/forest/broadleaf-841-low-v01.glb) | 6.47 | [x] | [x] | [x] |

### Vegetasi bawah

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [fern-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/understory/fern-17-high-v01.glb) | 1.42 | [x] | [x] | [x] |
| [fern-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/understory/fern-17-low-v01.glb) | 0.92 | [x] | [x] | [x] |
| [palm-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/understory/palm-17-high-v01.glb) | 6.76 | [x] | [x] | [x] |
| [palm-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/understory/palm-17-low-v01.glb) | 5.39 | [x] | [x] | [x] |
| [shrub-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/understory/shrub-17-high-v01.glb) | 1.45 | [x] | [x] | [x] |
| [shrub-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/understory/shrub-17-low-v01.glb) | 1.31 | [x] | [x] | [x] |

### Studi permukaan

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [ground-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/surfaces/ground-17-high-v01.glb) | 5.69 | [x] | [x] | [x] |
| [ground-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/surfaces/ground-17-low-v01.glb) | 5.38 | [x] | [x] | [x] |
| [rock-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/surfaces/rock-17-high-v01.glb) | 9.94 | [x] | [x] | [x] |
| [rock-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/surfaces/rock-17-low-v01.glb) | 9.49 | [x] | [x] | [x] |
| [creek-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/surfaces/creek-17-high-v01.glb) | 11.32 | [x] | [x] | [x] |
| [creek-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/surfaces/creek-17-low-v01.glb) | 9.98 | [x] | [x] | [x] |
| [path-17-high-v03](C:/PelatukDotCom/assets/aviary/exports/surfaces/path-17-high-v03.glb) | 10.34 | [x] | [x] | [x] |
| [path-17-low-v03](C:/PelatukDotCom/assets/aviary/exports/surfaces/path-17-low-v03.glb) | 9.59 | [x] | [x] | [x] |

### Fasilitas

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [enclosure-17-high-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/enclosure-17-high-v02.glb) | 9.14 | [x] | [x] | [x] |
| [enclosure-17-low-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/enclosure-17-low-v02.glb) | 7.80 | [x] | [x] | [x] |
| [gate-17-high-v03](C:/PelatukDotCom/assets/aviary/exports/fixtures/gate-17-high-v03.glb) | 12.36 | [x] | [x] | [x] |
| [gate-17-low-v03](C:/PelatukDotCom/assets/aviary/exports/fixtures/gate-17-low-v03.glb) | 11.76 | [x] | [x] | [x] |
| [feeder-17-high-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/feeder-17-high-v02.glb) | 8.50 | [x] | [x] | [x] |
| [feeder-17-low-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/feeder-17-low-v02.glb) | 8.02 | [x] | [x] | [x] |
| [water-17-high-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/water-17-high-v02.glb) | 3.73 | [x] | [x] | [x] |
| [water-17-low-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/water-17-low-v02.glb) | 3.57 | [x] | [x] | [x] |
| [perch-17-high-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/perch-17-high-v02.glb) | 14.83 | [x] | [x] | [x] |
| [perch-17-low-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/perch-17-low-v02.glb) | 14.46 | [x] | [x] | [x] |
| [reward-17-high-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/reward-17-high-v02.glb) | 1.53 | [x] | [x] | [x] |
| [reward-17-low-v02](C:/PelatukDotCom/assets/aviary/exports/fixtures/reward-17-low-v02.glb) | 1.32 | [x] | [x] | [x] |

### Pengunjung

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [birdwatcher-amber-17-high-v04](C:/PelatukDotCom/assets/aviary/exports/visitors/birdwatcher-amber-17-high-v04.glb) | 14.74 | [x] | [x] | [x] |
| [birdwatcher-amber-17-low-v04](C:/PelatukDotCom/assets/aviary/exports/visitors/birdwatcher-amber-17-low-v04.glb) | 9.88 | [x] | [x] | [x] |
| [birdwatcher-teal-17-high-v04](C:/PelatukDotCom/assets/aviary/exports/visitors/birdwatcher-teal-17-high-v04.glb) | 14.74 | [x] | [x] | [x] |
| [birdwatcher-teal-17-low-v04](C:/PelatukDotCom/assets/aviary/exports/visitors/birdwatcher-teal-17-low-v04.glb) | 9.88 | [x] | [x] | [x] |
| [birdwatcher-rose-17-high-v04](C:/PelatukDotCom/assets/aviary/exports/visitors/birdwatcher-rose-17-high-v04.glb) | 14.74 | [x] | [x] | [x] |
| [birdwatcher-rose-17-low-v04](C:/PelatukDotCom/assets/aviary/exports/visitors/birdwatcher-rose-17-low-v04.glb) | 9.88 | [x] | [x] | [x] |

### Komponen permukaan

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [terrain-dry-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/terrain-dry-17-high-v01.glb) | 4.36 | [x] | [x] | [x] |
| [litter-dry-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/litter-dry-17-high-v01.glb) | 1.33 | [x] | [x] | [x] |
| [terrain-dry-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/terrain-dry-17-low-v01.glb) | 4.12 | [x] | [x] | [x] |
| [litter-dry-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/litter-dry-17-low-v01.glb) | 1.27 | [x] | [x] | [x] |
| [boulder-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/boulder-17-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [boulder-48-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/boulder-48-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [boulder-79-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/boulder-79-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [boulder-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/boulder-17-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [boulder-48-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/boulder-48-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [boulder-79-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/boulder-79-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [terrain-channel-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/terrain-channel-17-high-v01.glb) | 4.36 | [x] | [x] | [x] |
| [litter-bank-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/litter-bank-17-high-v01.glb) | 1.30 | [x] | [x] | [x] |
| [river-water-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/river-water-17-high-v01.glb) | 0.31 | [x] | [x] | [x] |
| [bank-rock-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-17-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-18-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-18-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-19-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-19-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-20-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-20-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-21-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-21-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-22-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-22-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-23-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-23-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-24-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-24-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-25-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-25-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-26-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-26-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-27-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-27-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-28-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-28-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-29-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-29-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-30-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-30-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-31-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-31-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bank-rock-32-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-32-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [bed-pebble-137-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-137-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-138-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-138-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-139-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-139-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-140-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-140-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-141-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-141-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-142-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-142-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-143-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-143-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-144-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-144-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-145-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-145-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-146-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-146-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-147-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-147-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-148-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-148-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-149-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-149-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bed-pebble-150-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bed-pebble-150-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [terrain-channel-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/terrain-channel-17-low-v01.glb) | 4.12 | [x] | [x] | [x] |
| [litter-bank-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/litter-bank-17-low-v01.glb) | 1.26 | [x] | [x] | [x] |
| [river-water-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/river-water-17-low-v01.glb) | 0.05 | [x] | [x] | [x] |
| [bank-rock-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-17-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-18-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-18-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-19-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-19-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-20-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-20-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-21-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-21-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-22-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-22-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-23-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-23-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-24-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-24-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-25-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-25-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-26-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-26-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-27-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-27-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-28-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-28-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-29-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-29-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-30-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-30-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-31-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-31-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [bank-rock-32-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/bank-rock-32-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-51-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-51-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-52-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-52-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-53-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-53-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-54-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-54-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-55-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-55-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-56-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-56-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-57-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-57-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-58-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-58-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-59-high-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-59-high-v01.glb) | 4.12 | [x] | [x] | [x] |
| [paving-stone-51-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-51-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-52-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-52-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-53-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-53-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-54-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-54-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-55-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-55-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-56-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-56-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-57-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-57-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-58-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-58-low-v01.glb) | 4.07 | [x] | [x] | [x] |
| [paving-stone-59-low-v01](C:/PelatukDotCom/assets/aviary/exports/components/paving-stone-59-low-v01.glb) | 4.07 | [x] | [x] | [x] |

### Panji dekorasi

| Master sumber | MiB | Copy dan SHA | Muat GLB | Review visual |
| --- | ---: | :---: | :---: | :---: |
| [sanctuary-banner-17-high-v01](C:/PelatukDotCom/assets/aviary/exports/ornaments/sanctuary-banner-17-high-v01.glb) | 3.81 | [x] | [x] | [x] |
| [sanctuary-banner-17-low-v01](C:/PelatukDotCom/assets/aviary/exports/ornaments/sanctuary-banner-17-low-v01.glb) | 3.54 | [x] | [x] | [x] |
