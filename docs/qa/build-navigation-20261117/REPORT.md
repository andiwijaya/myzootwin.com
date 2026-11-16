# Navigasi HP setelah preview Bangun ditutup

Tanggal: 17 November 2026. Status: seluruh gate lokal lulus; rilis sedang diproses.

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

Hasil akhir akan dicatat pada `verification.json`. Deployment dan pemeriksaan produksi dicatat pada `deployment.json`, `live-body-check.json`, serta `live-native.json` setelah seluruh gate lulus.
