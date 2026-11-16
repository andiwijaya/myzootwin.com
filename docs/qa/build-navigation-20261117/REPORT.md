# Navigasi HP setelah preview Bangun ditutup

Tanggal: 17 November 2026. Status: selesai dan live sejak **05.44.58 WIB**.

## Temuan dan perubahan

Pada versi awal, pelepasan ruang preview berjalan sejak `pointerdown` pada tombol navigasi. Jika sentuhan berubah menjadi swipe dan dibatalkan, panel masih Bangun tetapi tinggi dokumen sudah menyusut sekitar 127-287 px pada kelima kandang. Bukti `before-cancel-menu-360-initial.json` mempertahankan temuan ini. Posisi scroll pada contoh tersebut tetap; yang berubah prematur adalah tinggi dokumen dan ruang penahan sebelum klik selesai.

Pelepasan lewat tombol navigasi sekarang menunggu event `click`. Sentuhan yang dibatalkan mempertahankan layout. Observer tetap membersihkan ruang pada pergantian menu/kandang melalui mekanisme lain, perubahan lebar, atau disposal.

Uji native menemukan jalur lain: Zoo → kandang pertama memaksa panel Rawat melalui `habitat-focus-panel.ts`, meskipun pengguna memilih Bangun. Pada UI Zoo sekarang panel pilihan dipertahankan ketika zoom pertama diaktifkan. Presentasi lama tanpa navigasi Zoo tetap memakai perilakunya semula. Bukti sebelum perbaikan dipertahankan di `before-native-zoo-entry-r2.json`; matriks final menambahkan keluar ke Zoo lalu kembali ke setiap kandang.

## Metode

Internal browser pada 360 × 780 dan 390 × 844. Delapan profil mencakup Batal/pembelian di kelima kandang, perpindahan Misi/Rawat/Tamu lalu kembali ke Bangun, perpindahan ke kandang berikut lalu kembali. Setiap ketukan navigasi dibuat terlihat sebelum pengukuran. Pengukuran mencakup frame scroll dan posisi tombol, pembersihan seluruh `min-block-size` serta `overflow-anchor`, ruang akhir panel, dan perubahan menu/kandang tertunda. Gestur `pointerdown`/`pointercancel` diperiksa sebelum navigasi benar-benar diaktifkan.

Fixture V5 sintetis memakai gerbang tertutup untuk mengisolasi quote; transaksi melalui handler UI dan IndexedDB sebenarnya. Tidak ada injeksi/transaksi pada campaign pemilik. Viewport browser bukan pengujian perangkat HP fisik.

Oracle awal belum menghitung elemen daftar `li` pada panel Tamu sehingga salah menandai teks umpan balik sebagai ruang kosong. Oracle final menghitung konten daftar tersebut; bukti awal tidak diubah atau dihitung sebagai lulus.

## Hasil dan rilis

Kandidat r2 lulus 816 pemeriksaan pada delapan profil, tetapi belum mencakup masuk kandang dari Zoo. Temuan native tersebut menahan rilis; seluruh bukti r2 diberi awalan `before-r2-` dan tidak dihitung sebagai gate final.

Kandidat final `build-nav-r3-20261117` lulus seluruh delapan profil: **1.016/1.016 pemeriksaan matriks**, **40 penutupan preview**, **20 pembelian**, dan **160 perpindahan**. Semua profil 127/127 lulus. Maksimum pergeseran scroll dan posisi tombol **0 px**; seluruh ruang penahan dan overflow-anchor bersih setelah navigasi, tanpa menu/kandang berubah lagi setelah jeda. Sisa ruang alami di akhir panel berada di bawah ambang 100 px. Regresi kontrol HP **155/155** dan native keyboard **23/23** lulus, termasuk Batal → seluruh tab serta Batal → Zoo/kandang dengan Bangun tetap dipilih. Total **1.194 pemeriksaan browser**.

Pengujian terarah **49/49** lulus; Astro **692 berkas, 0 error/0 warning/0 hint**; build **10 halaman**. Verifikasi sumber `e10d3cd282539b8d9de38c4a32138e6871fcd7efe19830841acfd50284680800` cocok dengan kandidat. HTML Play serta seluruh tujuh berkas `_astro` kandidat QA identik dengan build final. Lihat [verifikasi](verification.json), [native](native-navigation.json), dan [tampilan akhir QA](qa-final-390.jpg). Regresi kontrol desktop awal disimpan terpisah sebagai `controls-desktop-initial.json` dan tidak dihitung dalam 1.194 gate HP.

Percobaan native awal memakai End sampai tombol Batal berada di luar viewport; fokus otomatis browser kemudian menggulirnya kembali. Bukti `failed-native-focus-initial.json` dipertahankan dan dikecualikan. Pengukuran native final menyiapkan fokus dan memastikan tombol terlihat sebelum menghitung pergeseran.

Rilis: commit **`073576396ac03768e7420cf06e1ee2d2008bbe91`**, Cloudflare Pages **`787ff474-b3b0-4139-af7b-2664408a5005`**, selesai **17 November 2026 pukul 05.44.58 WIB**. Check Cloudflare pada commit tersebut completed/success. **130/130 body/hash produksi** cocok dengan build final, termasuk HTML, bundle dan runtime GLB; entry yang benar-benar dimuat `/_astro/PlayEntry.astro_astro_type_script_index_0_lang.BdVMjwKe.js`.

**146/146 pemeriksaan native live** lulus: empat panel pada Zoo dan kelima kandang dalam dua ukuran HP, tanpa scroll atau menu berpindah lagi setelah jeda, layout penahan bersih, satu renderer dan tanpa overflow horizontal. Console tanpa warning/error. Campaign live tetap **4.381 ZC dan 14 satwa**, ditinggalkan pada Zoo/Misi dalam keadaan jeda; tidak ada belanja/refill/klaim/reset atau injeksi save di produksi. Tab QA ditutup, tiga server QA milik tugas dihentikan, viewport override dikembalikan. Tab produksi disimpan untuk pengguna.

Bukti final: [verifikasi](verification.json), [deployment](deployment.json), [body/hash live](live-body-check.json), [native live](live-native.json), dan [screenshot HP live](live-mobile-390.jpg). Pemeriksaan HP memakai viewport browser internal 360 × 780 dan 390 × 844; perangkat fisik tidak diuji.
