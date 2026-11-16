# Scroll setelah isi ulang di HP — 16 November 2026

Status: **LOCAL_PASS; publikasi dan pemeriksaan domain utama menunggu.**

Laporan pengguna: setelah zoom makaw lalu scroll ke makanan, isi ulang membuat halaman kembali ke atas. Reproduksi asli ditemukan di handler makanan dan air: perintah refill ikut memfokuskan dan menggulir ke kanvas. Resize HUD juga memaksa scroll ke atas; perubahan tinggi bilah alamat/keyboard HP dapat memicunya. Zebra mengalami perpindahan ke bagian bawah panel ketika pemulihan fokus asinkron memicu scroll HUD.

Perbaikan: refill makaw mempertahankan posisi panel, fokus preventScroll pada panel HP dihormati, resize UI farm mempertahankan posisi dokumen, dan fasilitas zebra memakai elemen serta callback yang stabil dengan revision/command terbaru. Perencanaan/penempatan masih dapat membawa pengguna ke dunia secara eksplisit. Navigasi habitat, gating transaksi dan perhitungan stok tetap memakai perintah asli.

Pengujian memakai renderer dan handler produksi, save V5 sintetis dalam database IndexedDB UUID terpisah. Ketukan kandang memakai triangle asli dan PointerEvents sintetis. Setiap isi ulang harus menghasilkan satu transaksi persediaan dan stok bertambah. Tidak ada simpanan pemilik yang disalin, ditimpa atau dibelanjakan. Viewport browser bukan HP fisik.

| Kandang | Isi makanan | Isi air | Posisi tombol pada layar sebelum → sesudah commit (px) |
|---|---|---|---|
| Makaw | 0 → 8 | 0 → 8 | 399.73 → 399.73; 399.86 → 399.86 |
| Gajah | 0 → 8 | 0 → 8 | 399.68 → 399.68; 400.30 → 400.30 |
| Singa | 3 → 12 | 0 → 12 | 400.14 → 400.14; 399.72 → 399.72 |
| Jerapah | 8 → 12 | 1 → 12 | 400.14 → 400.14; 435.05 → 435.05 |
| Zebra | 0 → 12 | 0 → 12 | 399.78 → 399.78; 399.82 → 400.28 |

Browser dapat menyesuaikan koordinat scroll dokumen ketika teks kondisi di atas bertambah tinggi; yang diuji adalah posisi fasilitas pada layar tetap sama (selisih <2 px), elemen tetap terpasang, kandang/menu tetap sama, tanpa scroll paksa ke kanvas. Contoh air zebra 390 px: y dokumen 2949,33 → 2968,67, tetapi tombol 399,82 → 400,28 px pada layar.

Ketukan native makaw pada 360 px juga menjaga y dan posisi tombol untuk makanan serta air. [Receipt native](native-refill-360.json), [makanan](native-macaw-food-360.jpg), [air](native-macaw-water-360.jpg). Perubahan tinggi viewport 844 → 760 menjaga kandang zebra dan fasilitas tetap terlihat, tanpa kembali ke atas: [receipt](height-change-390.json).

**291/291 pemeriksaan browser**: 68 pemeriksaan isi ulang/scroll pada masing-masing 390 × 844 dan 360 × 780, serta 155 pemeriksaan kamera/menu pada 360 px. Termasuk 20 transaksi nyata di fixture, makanan dan air kelima kandang, menu/fokus tetap, simulasi terus bertambah, resize tanpa lompatan, satu kanvas, 14 penghuni dan save valid. **122/122 pengujian terarah** lulus; Astro check bebas error/warning/hint, build 10 halaman. HTML serta seluruh aset _astro identik dengan kandidat QA.

Fingerprint sumber: `a49ff63b0728b18add98a30832772e72911f9df22bd8d47119de5f73a4f62389`; entry `/_astro/PlayEntry.astro_astro_type_script_index_0_lang.D3vXhhy3.js`. [Verifikasi](verification.json), [reproduksi](before-390.json), [390 px](care-390.json), [360 px](care-360.json), [kamera dan menu](controls-360.json), [tests](tests.tap), [typecheck](check.log), [build](build.log).
