# Ketukan kandang dan performa HP — 16 November 2026

Status: **PASS — sudah live, ketukan dan kestabilan menu diverifikasi pada domain utama.**

## Masalah yang direproduksi

Ketukan native di dalam kandang jerapah pada produksi 390 × 844 memilih tempat pakan daun, membuka Bangun, dan memindahkan scroll dari 0 menjadi 3.396,67 px tanpa memperbesar kandang. Handler seleksi HUD juga memperlakukan pembaruan penghuni/fasilitas terpilih sebagai pilihan baru, sehingga dapat merebut tab yang sudah dipilih pengguna.

Ketukan pada tampilan seluruh zoo kini diteruskan dari hit triangle asli ke navigasi kandang sebelum pemilihan objek. Alur placement tetap menangani ketukan saat pratinjau pembangunan aktif. Pemilihan objek dalam kandang tetap tersedia melalui Bangun, sementara pembaruan data tidak memindahkan menu atau halaman. Picker lama di luar UI farm mempertahankan perilakunya; navigasi baca-saja dapat bekerja saat jeda tanpa membuka pengeditan.

## Pengukuran dan optimasi

Pengukuran memakai renderer, simulasi, 14 model GLB, dan save V5 sintetis yang memiliki seluruh fasilitas/perawatan. Waktu callback RAF, biaya simulasi, biaya pembaruan adegan, pengiriman render sinkron, latensi handler kontrol dan long task dicatat. Pose tulang GLB diambil sebelum/sesudah setiap fase untuk memeriksa gerak; tidak ada inspeksi pose atau screenshot selama jendela waktu. Ini viewport browser, bukan HP fisik, FPS presentasi atau waktu GPU.

Baseline 390 px yang valid (36 pemeriksaan fungsi) memperlihatkan p95 CPU callback 42,5–88,8 ms, dengan p95 pembaruan adegan 35,6–69,4 ms; pengiriman render hanya 1,1–2,8 ms. Panel tersembunyi tetap menghitung dan menggambar kondisi seluruh spesies, dan beberapa tampilan mahal dihitung berulang meski tick/perintah belum berubah.

Panel kini menyimpan view terbaru dan menggambar ketika tab/kandangnya dibuka. Pemeriksaan visibilitas memakai atribut UI, tanpa memaksa pengukuran layout per tick. Pembacaan mahal perawatan gajah/zebra, katalog dan misi memakai kunci tick, revisi, status simpanan, locale, preview dan hasil tindakan. Simulasi, interpolasi gerak, model GLB dan aturan perawatan tetap berjalan seperti semula.

Sampel dengan callback terlalu sedikit dinyatakan tidak valid dan disimpan di `.qa/mobile-performance-20261116/attempt-*`. Sebuah probe tanpa game mendapatkan 133 callback dalam 2,2 detik. Kandidat final menempatkan area dunia sepenuhnya dalam viewport sebelum setiap pengukuran dan memeriksa kondisi tersebut secara eksplisit.

## Pemeriksaan final

**641/641 pemeriksaan browser unik lulus**: 155 kontrol pada masing-masing 360 × 780, 844 × 390 dan 1280 × 800 (465), 94 pembangunan/refill berbayar asli, serta dua profil navigasi bergerak masing-masing 41 (82). integration-360.json memuat 155 + 94 hasil; 155 awal tidak dihitung dua kali. **95/95 pengujian terarah**, typecheck 0 error/0 warning/0 hint pada 687 file, build 10 halaman.

Hasil 390 × 844 (Otomatis/Hemat daya, DPR 1):

| Kandang | CPU p95 sebelum (ms) | CPU p95 akhir (ms) | Long task sebelum → akhir |
| --- | ---: | ---: | ---: |
| macaw-aviary | 51.5 | 36.0 | 18 → 0 |
| elephant-grove | 52.7 | 36.4 | 26 → 0 |
| lion-savanna | 88.8 | 36.9 | 37 → 0 |
| giraffe-plains | 43.2 | 36.1 | 2 → 0 |
| zebra-grasslands | 42.5 | 35.8 | 3 → 1 |

Pada sampel 390 px, callback sekitar 49–52 Hz, handler kontrol p95 0,8–2,1 ms, dan total long task turun dari 86 menjadi 1. Ini angka pengamatan, bukan FPS presentasi. Pada 360 × 780 dengan Rawat terbuka, CPU p95 35,9–38,9 ms dan handler kontrol 1,1–1,8 ms. Seluruh 14 model tetap terpasang dan pose tulang penghuni kandang aktif berubah pada masing-masing fase; menu dan scroll tetap stabil.

Pose model yang tersembunyi oleh mode kandang kini tidak dihitung setiap frame. Model-model tersebut tetap menerima snapshot simulasi pada tick dan langsung memakai waktu/posisi terkini ketika ditampilkan. Tampilan seluruh zoo tetap memperbarui semua model. Sinkronisasi kehidupan zoo dan perhitungan ekonomi tidak difilter.

Scroll otomatis layout lama untuk tombol/world pada UI farm HP dihapus; Tata tetap membuka pembangunan secara eksplisit.

Fingerprint sumber `2cdd9d3ed5a304ea439d0552066eaf7b8ea96edf01a915b468cad2d7e5ce1ebe`. HTML kandidat identik dengan produk QA: SHA-256 `651a47e9a9dc8d332f285fae52c1b64dd2de41033d1e61c7463a909499c1f333`. [Verifikasi](verification.json), [kontrol HP](controls-360.json), [landscape](controls-landscape.json), [desktop](controls-desktop.json), [regresi transaksi](integration-360.json), [performa 390](performance-390.json), [performa Rawat 360](performance-care-360.json), [tests.tap](tests.tap), [check.log](check.log), [build.log](build.log).

Commit `8918db4e9d7d745e353cf3a014a5049c01b2571d` sudah di main. Cloudflare Pages deployment `af6c1d66-ca3e-474f-aca9-869c6be3ae79` berhasil **16 November 2026, 14:39:13 WIB**, check `133157691408`. Domain [myzootwin.com/play/](https://myzootwin.com/play/) memuat entry `BzfyUVO8`, foundation `C-Z4pblQ`, CSS `BG-7FAAS`. **130/130 body/hash** cocok dengan kandidat QA. [Deployment](deployment.json), [body/hash](live-body-check.json), [native live](live-native.json).

Pada 390 × 844, ketukan native di bagian dalam kelima kandang langsung membuka kandang yang tepat dan Rawat; y halaman tetap **0 → 0**. Pemeriksaan ketukan saat jeda mempertahankan tick, saldo dan populasi. Titik awal yang mengenai atap/tepi objek kecil tidak dianggap hit kandang; titik pengujian akhir berada pada permukaan bagian dalam yang terlihat.

Uji ulang bug menu: Sora dipilih melalui gambar 3D ketika game berjalan, kemudian Tamu dipilih. Tab tetap **visitors**, scroll tetap **574**, sementara tick simpan bertambah **97.826 → 98.154**. Pendapatan pengunjung dan pemeliharaan normal tetap disimulasikan. Tidak ada pembelian/refill/klaim/reset atau transfer save manual. Game dikembalikan ke seluruh zoo, dijeda pada tick **98.175** dengan **14 satwa**, satu kanvas, console warning/error kosong (batas 100). Semua tab buatan tugas ditutup, viewport/visibilitas dipulihkan, dan enam server QA milik tugas dihentikan.

Bukti layar: [zoom makaw](live-tap-macaw-390.jpg), [gajah](live-tap-elephant-390.jpg), [singa](live-tap-lion-390.jpg), [jerapah](live-tap-giraffe-390.jpg), [zebra](live-tap-zebra-390.jpg), [menu Tamu saat berjalan](live-menu-stable-running.jpg), [akhir seluruh zoo](live-final-zoo-390.jpg). Bukti reproduksi: [before-tap.json](before-tap.json). Baseline: [baseline-performance-390.json](baseline-performance-390.json).
