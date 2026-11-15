# Inventaris scene GLB MyZooTwin v01

Audit 15 November 2026, untuk rilis GLB. Inventaris AST dan hash distribusi disimpan di `glb-visual-inventory-20261115.json.gz`. Inventaris sumber menyatakan asal dan ownership, bukan kelulusan visual. Bukti render dan kontak dicatat terpisah pada laporan harness.

| Kelompok | Implementasi rilis | Sumber dan alasan |
| --- | --- | --- |
| Lima spesies, 14 individu | 28 GLB high/low, 264 klip; skeleton dan pose mandiri | Karya original editable `art/animals/v01`. Identitas dan FSM tetap berasal dari simulasi produk. |
| Fasilitas perawatan yang sudah dibeli | 22 template GLB, 26 instance pada baseline lengkap | Karya original editable `art/fixtures/v01`. Pendekatan, stok, unlock dan posisi membaca resource kanonis. Porsi memakai instancing; air, daun dan bunga kolam mengikuti state. |
| Pohon dan batu terpilih | 17 instance GLB pada baseline | Subset Pelatuk yang hash dan provenance-nya disimpan. Paket berisi 18 model dan 13 WebP bersama, termasuk varian LOD serta kandidat fern/shrub yang dimuat saat dipakai. |
| Pengunjung | Tiga gaya GLB dengan rig dan mixer per instance | Subset Pelatuk; posisi, tujuan dan fase tetap dari pengunjung produk. Batas tampil satu pada low dan tiga pada high. |
| Terrain, lantai habitat, jalur, pagar dan kopje | Tetap geometri parametrik produk | Bentuk mengikuti grid, koneksi, footprint dan kemiringan dunia yang tersimpan. GLB satwa dan fasilitas dipasang pada kontrak dunia tersebut. |
| Empat rumpun reed, gerbang MyZooTwin, bunga dan panji penghargaan global | Tetap geometri parametrik original | Mempertahankan identitas situs dan unlock existing. Water lilies kolam gajah sudah termasuk GLB fasilitas dan mengikuti unlock serta stok air. |
| Ghost pembelian, overlay picking, outline dan label | Tetap geometri/UI produk | Pratinjau transaksi belum dibeli dan alat interaksi. Resource fasilitas yang sudah dibeli memakai GLB. |
| Semprotan gajah, bayangan, pencahayaan dan kamera | Tetap efek dan sistem renderer produk | Efek dinamis dan resource renderer; ownership diperiksa bersama lifecycle GLB. |
| Library Pelatuk | 122 master lokal, tidak seluruhnya dikirim ke browser | Dua burung Pelatuk disimpan di library. Gerbang dan panji Pelatuk tidak dipakai dalam gameplay MyZooTwin. |

Master mentah besar dan tekstur authoring berada di library lokal yang diabaikan Git. Distribusi publik hanya berisi kandidat terpilih, manifest dan gambar runtime. Kandidat lama dipindah secara reversible ke `.qa/delivery-archive` setelah pemeriksaan containment, ukuran dan SHA-256.

Tidak ada perubahan pada core simulasi, ekonomi, codec/schema save, ID individu, atau data pemain. Loader menahan jam presentasi/simulasi session selama aset belum siap; gerak kosmetik Studio dan pilihan grafis tidak memberi makanan, kesejahteraan, uang, tiket atau unlock.

Audit ini tidak mengklaim semua objek Three.js menjadi GLB. Lapisan parametrik di atas sengaja dipertahankan karena mengikuti dunia dan state produk. Pengujian browser merupakan bukti browser desktop dan emulasi viewport; bukan pengujian perangkat fisik atau pengukuran presented FPS.
