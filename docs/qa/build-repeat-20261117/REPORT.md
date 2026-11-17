# Preview Bangun berulang lalu navigasi HP

Tanggal: 17 November 2026. Status: **selesai, seluruh gate lulus, tidak ditemukan bug tambahan**. Kode aplikasi tidak berubah dan tidak ada deployment baru yang diperlukan.

## Metode dan batas bukti

Browser internal Codex pada viewport 360 × 780 dan 390 × 844. Produk QA memakai UI, renderer, animasi, handler transaksi, dan IndexedDB asli dengan save V5 sintetis pada origin loopback tersendiri. Gerbang fixture ditutup agar quote pembangunan tidak dipengaruhi pemasukan tamu. Save pemilik tidak diinjeksi atau dibelanjakan pada domain produksi. Viewport browser tidak mewakili pengujian HP fisik.

Setiap profil menjalankan sepuluh pengulangan Batal untuk masing-masing makaw, gajah, singa, jerapah, dan zebra. Posisi penutupan bergantian antara tombol yang terlihat di tengah viewport dan bagian paling bawah dokumen. ScrollY dan bagian bawah panel diamati pada frame animasi, saat aksi, dan setelah jeda; halaman juga digulir manual setelah tiap penutupan. Tinggi dokumen, shell dan panel, ruang akhir konten, serta jumlah reservasi dibandingkan dengan penutupan pertama untuk mendeteksi akumulasi.

Setelah sepuluh Batal, audit berpindah Misi → Rawat → Tamu → Bangun, pindah ke kandang berikut dan kembali, keluar ke Zoo lalu masuk kembali. Layout harus kembali ke ukuran alami sebelum preview pertama. Audit lalu membangun satu fasilitas melalui konfirmasi dan commit asli, serta mengulangi seluruh perjalanan navigasi. Sentuhan navigasi yang dibatalkan turut diperiksa. Output QA disimpan dalam elemen tersembunyi agar pertambahan teks laporan tidak memengaruhi tinggi halaman.

Uji native tambahan memakai keyboard dan klik browser internal untuk membuka dan menutup preview jalur Zoo sepuluh kali, bergantian Batal dan Escape. Penutupan dilakukan saat simulasi berjalan; navigasi tambahan berikutnya diperiksa dalam keadaan jeda. Fokus tombol disiapkan sebelum pengukuran, sehingga gulir browser untuk menjangkau kontrol tidak disalahartikan sebagai lompatan aplikasi.

## Hasil

- Profil 360 px dan 390 px: masing-masing **807/807 pemeriksaan**, **55 penutupan termasuk 5 pembelian**, **80 perpindahan** lulus. Total **1.614 pemeriksaan**, **110 penutupan/10 pembelian**, dan **160 perpindahan**. Pertumbuhan tinggi, pergeseran scroll/konten **maksimum 0 px**.
- Uji native: **70/70 pemeriksaan** lulus, mencakup **10 penutupan Batal/Escape**, empat panel dan dua tujuan. Total gate QA **1.684 pemeriksaan**, **120 penutupan termasuk 10 pembelian**. Penutupan, scroll, tinggi dan reservasi tetap stabil.
- Native produksi: **32/32 pemeriksaan** lulus untuk kelima kandang, Zoo dan empat panel. Menu Bangun dipertahankan pada perpindahan kandang; tidak ada scroll/menu tertunda, reservasi tersisa, overflow horizontal, atau warning/error console.
- Typecheck **693 berkas, 0 error/0 warning/0 hint**; build **10 halaman** berhasil.
- **130/130 body/hash live** cocok dengan build produk yang diuji. Entry aplikasi tetap rilis `0735763` yang sebelumnya dipublikasikan pada 17 November 2026 pukul 05.44.58 WIB.

Percobaan batch native awal melewati batas waktu CUA sebelum receipt lengkap tersimpan; bukti `failed-native-timeout-initial.json` tidak dihitung. Pengulangan final memakai batch kecil dan menyimpan hasil setiap siklus. Dua pengiriman input yang tertunda diperiksa ulang dengan preview masih terbuka, kemudian ditutup lewat kontrol native dengan pengukuran sebelum/sesudah baru; tidak dianggap sebagai bug aplikasi atau hasil lulus tanpa bukti.

Verifikasi sumber **`e2875fafaab73fec3646c9bce07af1b862f307b817f4de1e888ccc1b8811d4df`** cocok dengan kandidat `build-repeat-r1-20261117`. HTML Play dan seluruh tujuh berkas `_astro` kandidat QA identik dengan build produk; **130 berkas HTML/bundle/runtime GLB live** juga identik. Perubahan hanya menambah tooling QA dan bukti, sehingga deployment aplikasi baru tidak diperlukan. Versi live tetap commit **`073576396ac03768e7420cf06e1ee2d2008bbe91`**, deployment **`787ff474-b3b0-4139-af7b-2664408a5005`** yang selesai **17 November 2026 pukul 05.44.58 WIB**. Waktu tersebut adalah rilis sebelumnya, bukan deployment baru dari audit ini.

Campaign produksi tetap **4.381 ZC dan 14 satwa**, ditinggalkan pada Zoo/Misi dalam keadaan jeda. Tab QA ditutup, server QA milik tugas dihentikan, dan viewport override dikembalikan. Tab produksi tetap tersedia untuk pengguna.

Bukti: [verifikasi final](verification.json), [profil 360 px](repeat-360-build-repeat-r1-20261117.json), [profil 390 px](repeat-390-build-repeat-r1-20261117.json), [native berulang](native-repeat-390.json), [body/hash live](live-body-check.json), [native produksi](live-native.json), [tampilan setelah pengulangan](qa-after-repeat-390.jpg), dan [tampilan live](live-mobile-390.jpg).
