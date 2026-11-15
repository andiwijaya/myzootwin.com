# Rilis live zoom per kandang — 15 November 2026

Fitur sudah dipublikasikan dan diverifikasi di **https://myzootwin.com/play/**. Pengguna secara eksplisit mengotorisasi deployment dan pengujian live secara otonom. Setelah pengguna meminta pengujian hanya di internal browser, seluruh matriks akhir diulang di internal browser; tidak ada kontrol Chrome atau jendela komputer pengguna setelah koreksi itu.

## Identitas produksi

- Source: `2fb696bfd7f1db4217ef615ca731b2f0e59aee52`.
- GitHub `main` diverifikasi kembali menunjuk source tersebut setelah pemeriksaan browser selesai.
- Cloudflare Pages `myzootwin-com`: deployment `f7272345-b317-42f6-b2d6-a780cbb7b831`, selesai **2026-11-15 04:28:52 UTC / 11:28:52 WIB**.
- [Check Cloudflare Pages](https://github.com/andiwijaya/myzootwin.com/runs/132699082479): `completed / success` untuk SHA yang sama.
- [URL deployment tetap](https://f7272345.myzootwin-com.pages.dev/play/).
- Fingerprint source lokal: `1fec641f9530a98fc11ce15fba302f55558e68f099a8711936b34644ce244f50`, tetap sama dengan build terverifikasi. Tidak ada perubahan aplikasi setelah deployment.

Rilis memakai satu push fast-forward biasa ke `main`, lalu deployment otomatis Cloudflare. Pengaturan hosting, akses, dependency, dan skema simpanan tidak diubah. Build referensi memakai nilai publik `PUBLIC_GA4_ID` yang teramati di produksi agar HTML dapat dibandingkan tepat. Output lab/fixture QA tidak menjadi output publik.

## Hasil live di internal browser

| Kandang | Desktop 1366 × 768 | HP tegak 360 × 780 | HP mendatar 780 × 360 |
| --- | --- | --- | --- |
| Macaw Aviary | PASS | PASS | PASS |
| Elephant Grove | PASS | PASS | PASS |
| Lion Savanna | PASS | PASS | PASS |
| Giraffe Plains | PASS | PASS | PASS |
| Zebra Grasslands | PASS | PASS | PASS |

**15/15 kombinasi lulus, 210 pemeriksaan gabungan lulus**, dengan 14 kondisi per kombinasi. Kondisi menguji masuk kandang yang benar; zoom relatif dan putaran 45°; perubahan pan serta penjepitan setelah input tambahan di tepi; zoom keluar; reset Utuh/Fit; penyaringan spesies pada tiga panel; aktivasi Misi/Bangun/Rawat; layout tanpa overflow mendatar; target tombol kembali minimal 44 px; konstruksi jalur luar tersembunyi; keluar saat jeda; pemulihan zoom/sudut kamera zoo; dan satu dunia/kanvas dengan lima habitat serta 14 satwa.

Seluruh **15 screenshot akhir** diperiksa visual. Selisih 15 px antara lebar viewport yang diminta dan `documentElement.clientWidth` berasal dari scrollbar browser; ukuran permintaan dan ukuran DOM aktual disimpan di setiap receipt.

Internal browser memulai dengan simpanan dua habitat. Lion, Giraffe, dan Zebra dibuka lewat misi, hibah, pembangunan berbayar, jalur, kedatangan satwa, dan perawatan UI yang sesungguhnya. Tidak ada seed/injeksi state, pembacaan/penulisan storage lewat skrip, impor save, unduhan, reset, atau penghapusan untuk menyiapkan matriks ini. Ini membuktikan kelanjutan simpanan internal dua habitat menjadi lima, bukan kampanye penuh sejak New Game.

Input matriks menggunakan kontrol browser asli: klik tombol dan keyboard; keyboard Enter dipakai pada rangkaian mendatar untuk menghindari target koordinat yang berpindah ketika panel menggulir. Klik koordinat kanvas dan tombol Zoom juga diverifikasi tersendiri pada HP mendatar: memilih fasilitas Zebra menampilkan tombol kandangnya, kemudian klik Zoom menampilkan Zebra saja. Salah satu acknowledgement input melewati batas waktu alat; DOM dan screenshot sesudahnya mengonfirmasi hasil, tanpa klik ulang. Dua rangkaian alat lain terputus oleh batas waktu runtime; hanya kombinasi lengkap yang sudah disimpan dihitung lulus. Percobaan yang tidak lengkap diulang per kandang.

Pemeriksaan live berfokus pada kamera, isolasi visual, panel dan lifecycle. Transaksi bangun/refill di dalam mode fokus pada kelima spesies tetap didukung pengujian lokal 165/165 atas source identik; transaksi kampanye live untuk menyiapkan habitat dilakukan pada tampilan zoo.

## Identitas berkas dan lifecycle

- **318/318 hash isi cocok**: 159 berkas publik pada domain utama dan deployment tetap. Perbandingan model menggunakan isi setelah decoding Brotli, sesuai respons HTTP. Seluruh 68 model per origin mempertahankan `model/gltf-binary`, `Content-Encoding: br`, dan cache immutable. Berkas `_headers` adalah konfigurasi Cloudflare dan tidak dihitung sebagai berkas publik yang diunduh.
- Entry runtime live: `/_astro/PlayEntry.astro_astro_type_script_index_0_lang.Cg5F8LT-.js`, cocok dengan build referensi dan tetap teramati saat cold reload akhir.
- Bahasa Indonesia: **Zoom kandang**, **Kembali ke zoo**, dan **Utuh** teramati pada mode aktif.
- Cold reload dari mode fokus mempertahankan **4.655 ZC, lima habitat, 2 makaw, 2 gajah, 3 singa, 3 jerapah, dan 4 Zebra**, lalu membuka tampilan zoo dalam keadaan dijeda. Bahasa Indonesia tetap tersimpan. Kamera fokus tidak dipersistenkan.
- Konsol internal: **0 error dan 0 warning**.
- Status akhir simpanan `saved`, jeda aktif, kecepatan normal. Override viewport internal dikembalikan dan tab QA sementara ditutup.

## Bukti dan batas pengujian

Bukti terstruktur ada di [qa/habitat-focus-live-20261115](qa/habitat-focus-live-20261115/): `deployment.json`, `verification.json`, `http.json.gz`, `internal-matrix.json`, `internal-cold-reload.json`, `internal-pointer-proof.json`, `internal-final.json`, dan screenshot `internal-*.jpg`. Berkas awal tanpa prefiks `internal-` merekam eksplorasi Chrome sebelum koreksi pengguna; berkas tersebut tidak dihitung dalam hasil matriks akhir internal.

HP merupakan **emulasi ukuran viewport Chromium**, bukan HP Android/iPhone fisik. Safari/iOS, sentuhan fisik/multitouch, pembaca layar bersuara, FPS yang benar-benar dipresentasikan, panas, dan baterai perangkat tidak diukur. Simpanan QA mengalami kemajuan serta biaya/pendapatan permainan selama persiapan dan ketika pengujian berjalan; pergantian mode tidak diklaim mempertahankan saldo saat simulasi aktif. Integritas saldo cold reload diperiksa ketika dijeda.

Regresi pra-rilis tetap tercatat terpisah: 1.099 tes regresi pada run sebelumnya; 50 tes terarah pada source akhir; Astro check tanpa error/warning/hint; build 10 halaman; dan 165 pemeriksaan browser lokal. Angka-angka tersebut bertumpang tindih dan tidak dijumlahkan sebagai tes unik.

Bukti setelah rilis dicatat lokal dalam commit dokumentasi terpisah. Tidak ada push kedua atau deployment tambahan hanya untuk menerbitkan laporan ini; source produksi tetap `2fb696b`.

## Cara memakai

1. Buka `/play/` dan muat ulang sekali jika tab masih memakai versi sebelum rilis.
2. Pilih **Lanjutkan**, lalu **Lanjut bermain** bila zoo sedang dijeda.
3. Klik/tap pagar, tanah, satwa, atau fasilitas di dalam kandang yang sudah dibangun. Informasinya muncul di **Bangun**.
4. Tekan **Zoom kandang** pada kartu pilihan. Gunakan +/−, geser, serta ↶/↷; **Utuh** memuat seluruh kandang aktif.
5. Tekan **Kembali ke zoo** untuk memulihkan tampilan sebelumnya. Dalam bahasa Inggris: **Zoom habitat**, **Fit**, dan **Back to zoo**.
