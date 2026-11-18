# Akurasi tap satwa mobile — 18 November 2026

Permintaan: tap satwa mobile lebih tepat setelah rotate, pan dua jari atau pinch zoom; gestur tidak salah memilih objek; pengujian hanya browser internal dan langsung deploy secara otonom.

## Perilaku

- Jenis input sentuh diteruskan hingga pemilih adegan. Tap memakai titik awal jari agar drift kecil saat melepas tidak memindahkan tujuan ke objek di sampingnya. Batas drag 4 px, jalur 8 px, durasi 300 ms, multitouch dan cancel tetap berlaku.
- Pemilih menyimpan proyeksi kamera dari render yang selesai. Sentuhan menyimpan proyeksi itu dan batas kanvas ketika jari turun, tanpa raycast atau pemindaian model pada pointerdown. Jika tampilan kamera yang disajikan atau posisi/ukuran kanvas berubah selama tap, tap dibatalkan agar tidak memilih dari tampilan yang berbeda.
- Hit tepat pada satwa/fasilitas/scenery tetap didahulukan. Hanya input touch dapat mengambil satwa dalam jarak maksimal **12 piksel CSS** dari segitiga model yang sedang berpose. Ukuran ini tidak membesar mengikuti world zoom atau device pixel ratio.
- Kotak model hanya menyaring kandidat. Pemilihan akhir menghitung titik terdekat pada segitiga yang diproyeksikan, memakai vertex skinned/deformed sebenarnya, lalu melakukan raycast penuh untuk memastikan kandidat terlihat dan tidak tertutup objek lain atau terpotong mask habitat.
- Bila dua siluet satwa hampir sama dekatnya (selisih <0,75 piksel CSS), tidak ada satwa yang ditebak. Area jauh, koordinat tidak valid, model tersembunyi atau di luar habitat tidak menjadi target toleransi.
- Mouse dan keyboard memakai hit tepat; toleransi sentuh berlaku pada jenis satwa yang sudah memiliki identitas pemilihan individual: gajah, singa, jerapah dan zebra. Alur Makaw/Studio tetap memakai alur produk yang tersedia.

Tidak ada raycast tambahan pada frame animasi atau pointermove. Kamera tetap memakai satu driver frame yang sama. Tidak ada perubahan aset GLB, rig, animasi, ekonomi, dependency atau format simpanan.

## Implementasi dan pengaman

`camera-gestures.ts` mempertahankan pointerType serta titik awal tap dan menyediakan callback snapshot ringan pada awal sentuhan. `scene-picking.ts` memisahkan snapshot tampilan dari resolusi tap, memperbarui transform induk objek, memeriksa visibilitas dan menambahkan toleransi siluet yang terbatas. `foundation-scene.ts` menandai kamera setelah render dan menghubungkan snapshot sentuhan.

Ukuran kanvas disalin melalui field `left`, `top`, `width` dan `height` secara eksplisit. `DOMRect` browser memakai accessor yang tidak ikut tersalin dengan object spread. Uji browser awal menemukan kesalahan ini pada implementasi yang belum dirilis; diperbaiki dan ditambahkan regresi accessor prototype. Receipt browser awal disimpan untuk membedakan kegagalan lokal dari hasil akhir.

Inventaris visual memakai extension eksplisit dengan predecessor persis untuk `scene-picking.ts` dan `camera-gestures.ts`. Seluruh sumber/bytes satwa, lingkungan, pencahayaan dan media lainnya tetap dilindungi baseline yang sama. Regresi pertama menemukan perbedaan format receipt scanner (`Box3Helper` dan assetId), lalu disamakan dengan proyeksi historis; sumber/aset lain tidak dikecualikan.

## Pengujian

Bukti ada di [qa/mobile-tap-20261118](qa/mobile-tap-20261118/).

- Tes unit menggunakan rotasi, translasi, zoom 1×/1,8×/3× dan offset kanvas; objek depan; ancestor tersembunyi; mask/filter; ambiguitas; box besar tanpa segitiga; vertex skinned yang berubah; drift saat melepas; kamera belum dirender; perubahan proyeksi atau layout di tengah tap; serta DOMRect accessor.
- Matriks browser menggunakan renderer/GLB/UI asli dengan simpanan V5 sintetis pada database UUID terpisah. Empat habitat diuji pada fit, rotate satu jari, pinch, pan dua jari setelah zoom, serta kombinasi ketiganya.
- ID yang diharapkan berasal dari raycast independen pada segitiga GLB yang terlihat. Setiap tap tepat diberi drift pelepasan 3 px. Kasus dekat siluet memindai keluar dari permukaan yang terbukti terlihat; kontrol mouse pada titik yang sama harus memilih latar atau kosong sebelum sentuhan dapat dinyatakan memperbaiki miss.
- Input drag kecil 4 px dan pointercancel harus mempertahankan pilihan; area kosong tidak boleh menarik pilihan satwa jauh; jumlah tap, satu kanvas, ledger perintah dan validitas simpanan diperiksa.

Input sentuh pada matriks diinjeksi lewat PointerEvents kanvas produk dalam browser internal. Viewport mobile adalah emulasi Chromium; hasil tidak dinyatakan sebagai pengujian Android/iPhone/Safari fisik atau jaminan FPS/latensi perangkat.

## Rilis

Jalur yang sudah ada dipertahankan: GitHub `main` → Cloudflare Pages `myzootwin-com`. Build produk menggunakan `npm run build`; route/fixture QA tidak dipublikasikan. Hasil akhir, fingerprint, identitas deployment, kecocokan aset runtime dan bukti input live dicatat pada receipt JSON.

[Buka game](https://myzootwin.com/play/).

### Hasil lokal akhir

- **127/127 regresi terarah lulus**, nol gagal/batal/skip/todo. Termasuk satu driver frame, kepemilikan pointer, 6.000 tick V5, reload/jeda dan clock reentrancy.
- Astro check: **697 berkas, 0 error/warning/hint**. Build produksi **10 halaman**, dengan peringatan ukuran chunk yang sudah ada.
- Browser internal: **1.272/1.272 pemeriksaan lulus**, terdiri dari 615 akurasi tap dan 657 regresi gestur. Viewport 360 × 780, 780 × 360 dan 1366 × 768.
- **180 tap tepat + 60 perbaikan dekat siluet**, meliputi seluruh 12 satwa yang sudah dapat dipilih individual. Empat habitat × lima variasi kamera × tiga viewport = 60 kasus tampilan.
- Regresi kamera: 18 kasus zoo/kandang dan **54 burst × 64 posisi mentah**, masing-masing satu pembaruan kamera/satu render. Drag, pinch dan cancel tidak menghasilkan tap satwa.
- Biaya dispatch sentuh harness: median **15.10 ms**, p95 **85.10 ms**, maksimum **195.90 ms** (303 sampel). Ini waktu CPU dispatch/seleksi/UI sintetis, bukan FPS atau latensi HP fisik.
- Fingerprint sumber build yang diuji: `58eeb98d716e66526a56054faeb3747baaf7dbd8254bc473dc1dd22c2e82e6b8`; produk 160 berkas, fingerprint `61694fc8fe10bbff3f9c777aaf14d526f37e6108d5db5d0784e75411d01fa52b`.
