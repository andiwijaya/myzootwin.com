# Fungsi menu dan toolbar HP — 16 November 2026

Status: **semua gate lokal lulus; publikasi dan verifikasi produksi menunggu.**

## Audit dan perbaikan

Audit native domain utama pada viewport 360 × 780 menguji enam tujuan, empat tab aksi per kandang, kembali ke zoo, zoom +/−, putar kiri/kanan, empat arah geser dan Utuh. Menu semua kandang berhasil. Toolbar bekerja saat simulasi berjalan, tetapi saat jeda manual, fieldset kamera dan canvas ikut terkunci. Selain gerbang UI, controller dan adapter kamera juga menolak input saat dijeda.

Kontrol kamera kini dipisahkan dari aksi permainan. Jeda manual membekukan simulasi serta transaksi, sementara zoom, putar, pan, dan reset dapat dipakai untuk mengamati. Kamera menggambar ulang saat sudut pandang berubah tanpa memulai RAF atau waktu simulasi. Gesture yang sedang berlangsung tetap dibatalkan ketika status jeda berubah; callback dan input dilepas saat renderer ditutup.

Cold Continue tetap membutuhkan Resume sebelum kontrol aktif. Dialog, pergantian latar belakang, restart dan konflik simpanan mempertahankan mekanisme jedanya. Tombol Geser pada tampilan 100% memperbesar satu langkah agar empat arah pan langsung memiliki ruang gerak. Batas kamera tetap 100–300% dan pan tetap dibatasi area zoo/kandang asli.

Pemeriksaan bahasa Inggris pada 320 px juga menemukan empat tombol arah panel Geser hanya setinggi sekitar 21 px. Gaya tombol panel disamakan dengan toolbar sehingga target sentuh minimal 44 × 44 px; pemeriksaan ukuran ini ditambahkan pada setiap konteks kamera dalam matriks final.

## Pemeriksaan

**775/775 pemeriksaan kontrol lulus**: masing-masing 155 pada 320 × 640, 360 × 780, 390 × 844, 844 × 390, dan 1280 × 800. Setiap profil mencakup zoo dan kelima kandang, empat tab, Tata, kedua arah zoom, batas 100–300%, putaran 315/0 dan satu orbit penuh, empat arah pan dan ukuran sentuhnya, drag/pinch, Utuh, Back, perpindahan langsung, render saat jeda, satu renderer/subscriber serta nol RAF. Seluruh snapshot save dan ledger tetap identik selama input saat jeda.

Tambahan **94/94 regresi integrasi lulus** pada 360 × 780, mencakup pembangunan dan refill berbayar asli untuk lima spesies, dengan total **869 pemeriksaan browser unik**. File integration-360.json berisi 249 baris hasil: 155 kontrol dan 94 regresi; 155 baris pertama tidak dihitung dua kali.

Pemeriksaan native tambahan pada kandidat final: Opsi, Detail simpanan, buka/tutup Cara bermain dan Pengaturan mempertahankan jeda; native drag mengubah pan tanpa mengubah tick. Bahasa Inggris pada 320 px dan seluruh target menu/toolbar/pan minimal 44 px diperiksa. **76/76 pengujian terarah**, typecheck 0 error/0 warning/0 hint, build 10 halaman. HTML kandidat identik dengan produk QA. Fingerprint `b73f454dcf674ef146a4835f46a6d54e47ee0fe70144eb62cb87c213a7d44601`; SHA-256 HTML `061acf411cf4f9e82048ec6b71f55d29d52e4be5f22236b6ef0b2a97a5d390b7`.

Receipt: [verification.json](verification.json), lima profil JSON, [integration-360.json](integration-360.json), [native-extra.json](native-extra.json), [english-320.json](english-320.json), [tests.tap](tests.tap), [check.log](check.log), [build.log](build.log). Uji browser memakai game/renderer asli dan save sintetis terpisah. Event pinch yang dikirim suite diberi label sebagai input sintetis; bukti viewport browser tidak menggantikan pengujian HP fisik. Kampanye live tidak di-reset dan tidak menerima pembelian, refill, klaim atau transfer save manual.

## Publikasi

Menunggu commit, deployment Cloudflare Pages, pencocokan body/hash, dan smoke fungsi pada domain utama.
