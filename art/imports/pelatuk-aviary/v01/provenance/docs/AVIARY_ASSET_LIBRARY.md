# Pustaka aset Aviary untuk pemakaian ulang

Katalog terpilih ada di [`assets/aviary/library.json`](../assets/aviary/library.json). Katalog memuat path GLB, versi, ukuran/hash, satuan, animasi, LOD dan tautan provenance. File GLB original tidak digandakan saat membangun katalog.

Saat checkpoint ini, tersedia **122 master terpilih**: dua burung v41; enam pohon; enam vegetasi bawah; delapan studi permukaan high/low; dua belas fasilitas v02/gatev03; enam pengunjung v04;80komponen permukaan mandiri. Total236 GLB termasuk riwayat, dengan122selected authoring masters berukuran689,550,484byte, termasuk dua panji Q04 high/low. Paket web terpilih berasal dari kandidat F:47model/50sharedWebP; master mandiri tetap dipertahankan.

Semua master terpilih berupa glTF 2.0 binary yang mandiri: geometri, material dan gambar tekstur tertanam. Burung juga memuat rig/skin serta sepuluh animasi. Sumber geometri TypeScript, gambar original dan resep tetap disimpan agar bisa diedit atau diekspor ulang.

## Memakai di website lain

Salin GLB yang dipilih ke direktori aset proyek tujuan, misalnya MyZooTwin, lalu muat dengan pemuat glTF/GLB proyek tersebut. Pertahankan transform/scale root yang dibawa file. Konversi ukuran rig burung sudah tercakup dalam GLB; mengalikannya lagi akan mengecilkan model dua kali.

Pencahayaan/environment, penggerak animasi, perilaku, gerakan antar lokasi, penempatan kontak, pilihan LOD dan lifecycle resource tetap menjadi tugas renderer proyek tujuan. Materi GLB dapat ditampilkan dengan pencahayaan berbeda; tampilannya perlu dicocokkan di proyek tujuan.

Untuk beberapa instance burung di Three.js, gunakan `SkeletonUtils.clone` agar skeleton setiap instance terpisah. Gunakan mixer per instance. Klip `takeoff`/`land` adalah transisi sekali jalan; klip lainnya dapat digunakan sebagai loop sesuai perilaku. Source proyek Pelatuk dan klip GLB tetap menjadi acuan pengaturan tempo/penempatan.

Delapan master permukaan adalah studi komposit4x4m.80komponen mandiri tersedia terpisah: terrain4, litter patches4, boulders6, bank rocks32, bed pebbles14, paving stones18, river water2. Seluruh attributes/embedded PNG bytes dipertahankan dari sumber. Geometry mempunyai root translation untuk pivot; pertahankan transform saat import. Menambahkan sourcePlacementM pada scene wrapper memulihkan posisi studi asal. Ini tidak memerlukan MyZooTwin diubah; GLB dapat disalin ke proyek tujuan yang dipilih owner.

Master saat ini mempertahankan kualitas authoring dan belum menjadi paket distribusi ringan. Buat turunan distribusi untuk kebutuhan website tujuan, simpan master original dan catat hubungan versi/hash-nya. Jangan memuat seluruh katalog sekaligus sebagai scene awal.

Fasilitas mempertahankan nama mesh `food-portion-{slot}-{portion}`, `food-fill-{slot}` dan `water-port-{slot}`. Slot 0 adalah Caladi, slot 1 Common. GLB selalu menyimpan kondisi lengkap `[4,4]`; stok permainan diterapkan saat runtime. Adapter `applyFixtureStock` menunjukkan penyembunyian porsi serta penurunan/radius air yang tetap di dalam mangkuk. Parameter dan anchor native ada dalam extras. Fasilitas tidak membawa simulasi ekonomi, event atau save. Tenggeran mempertahankan permukaan kontak atas studi burung; penempatan aktual dalam runtime native sudah diperiksa pada bukti V02. Detail rendah jaring memakai proxy transparan untuk jarak jauh.

## Kelanjutan

Fasilitas dan pengunjung v04 telah diperiksa pada tahap model individual. Fasilitas memakai kalibrasi burung v41. Actual GLB contact pakan/air/tenggeran sudah diperiksa. Adapter head/cervical mengikuti level air aktual tanpa mengubah master, di src/aviary/asset-lab/native-contact.ts. Roof/flight/native picking/navigation dan lifecycle kini memiliki bukti runtime V02. Setiap model baru wajib memiliki ekspor GLB mandiri yang dibuka ulang dan diperiksa sebelum masuk katalog terpilih. Untuk objek dinamis, nama bagian/rig/animasi yang diperlukan pemakaian ulang harus dipertahankan.

Katalog ini tidak menandakan integrasi ke MyZooTwin atau kelulusan A56 fisik. Kualitas komposisi dan integrasi native sudah diperiksa; status publikasi tetap mengikuti checklist rilis dan marker deployment. Lihat QA_EVIDENCE/AVIARY_RUNTIME_V02_2026-11-15/README.md.


Pengunjung v04: enam adult generik high/low masuk katalog, dengan 17 joint dan enam klip embedded. Playback rate untuk kecepatan dunia konsumen = actual world speed / walkSpeedMps pada root extras. Pertahankan imported root scale; locomotion eksternal. Kualitas individual, lingkungan gabungan dan native runtime telah diperiksa; pengukuran A56 fisik tetap belum tersedia. Lihat AVIARY_VISITOR_CHECKPOINT_2026-11-14.md.
