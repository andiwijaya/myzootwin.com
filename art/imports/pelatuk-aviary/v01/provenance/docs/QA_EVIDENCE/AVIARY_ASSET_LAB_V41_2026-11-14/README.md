# Bird v41 — review ulang dan portability gate

Keputusan: Caladi Tilik dan Common Flameback yang diperbaiki cukup untuk tahap komposisi habitat. R04/R05/H06at individual bird gate dapat dilanjutkan; kualitas adegan final, kontak fasilitas, jarak Amati, LOD/mobile dan deploy tetap terbuka. Ini judgement artistik terhadap referensi foto, bukan sertifikasi setara foto atau biomekanika terukur.

V40 memperbaiki bentuk torso/tengkuk/perut yang terlalu memanjang, scanning gaze siaga, handoff yaw transisi, shoulder attachment saat melipat dan resolusi fore carrier. Kandidat leher terkompresi dan coarse normals ditolak.63/63 source asset-lab tests/build dan324fresh clearance samples lulus pada v40, tetapi dua drum125ms renders gagal. V40 tetap immutable dan tidak dipilih untuk shipping.

V41 mempertahankan bentuk/material v40, menaikkan sampling drum30→240fps. Tes baru gagal pada implementasi lama (Caladi max0.003707rig units), lalu lulus: Caladi0.00006799/Common0.00008165 pada17.568/17.472actual vertex probes. Uji flight lama juga lulus. Ini dua fresh export-motion tests; bukan klaim satu fresh64-test suite.63source tests v40 dan324clearance samples diwarisi melalui perlindungan konten yang eksplisit; pemeriksaan runtime gabungan tetap belum dilakukan.

## Bukti final

-32fresh source/actual-retained render pairs (16 per spesies) dan64capture metadata lulus. Seluruh10perilaku tercakup, termasuk drum125/137ms. Max mean channel error0.506 danp95max2.0; ambang tetap mean2,p955, maksimal5%pixel di atas4.
-Actual GLB attributes, absolute morph reconstruction, inverse skin binds, material factors dan seluruh kanal10klip dibandingkan source independen, toleransi1e-6. Default encoded bill-to-tail13/29cm terverifikasi.
-Byte protection terhadap v40: seluruh19/20encoded meshes,86/90attribute buffers,14morph buffers per spesies, skin binds, material/sampler, default transforms, metadata selainrevision/sampling serta seluruh decoded image pixels identik. Semua1.080non-drum channels per spesies identik.119drum channels berubah; independent eyelid weights tetap.
-12resource cycles (6per spesies) kembali ke warmed baseline setelah semua pose: source22geometry/26texture; Caladi import41/47, Common42/47. Source owned20geometry/8material/10map. Angka26 mencakup source ground-leg bone textures yang telah dipakai ketika berjalan. Bukan heap/A56.
-Enam autoplay cases actual retained files: fly bergerak, takeoff/land berhenti2000ms. Console warning/error kosong.
-Seluruh136master historis di assets/aviary/exports/ dan80bird manifest records terdahulu tetap identik. Total kini138library export files (82bird revisions,56keluarga lain); kandidat ditolak di QA terpisah. Katalog tetap36master terpilih, dengan dua burung terbaru menggantikan v39.

## Master

| Spesies | Bytes | SHA256 |
| --- | ---: | --- |
| Caladi Tilik |18.750.756|d086a997dd67f6f1f2f33ed5bace337373cbf2ef54a75056a0be09271c3063c5|
| Common Flameback |24.133.580|0a21e6a996da1e6ef865da34dd923e316da1fb2836e478be80e5e1a4b5ef93c6|

Conservative geometry Caladi24.718/Common29.987triangle. Source tetap editable dan semua material asli/prompt/provenance sebelumnya dipertahankan. Referensi foto di ignored qa/aviary-photo-references/ diamati kembali, tanpa menyalin pixel foto ke model. Tidak ada bitmap baru pada v40/v41 selain bake body dari sumber asli yang sudah ada.

## Kelanjutan

334native feeding/foot measurements baru tersedia di native-feeding-calibration.json. Source metre scale Caladi0.15002569394540516/Common0.28420007750071224 berubah kurang dari1% terhadap v39; ukuran nominal tetap13/29cm. Selaraskan fixture planning/material masters, lanjut komponen GLB individual dan combined habitat/contact/lighting/LOD sebelum integrasi. Belum ada perubahan renderer produk atau deploy. HP SamsungGalaxyA56fisik belum diukur.

Modern current-source inspection: tools/inspect-aviary-bird-current.mjs lalu finalize-aviary-bird-revision.py. Legacy inspect-aviary-glb.py tetap memeriksa versi1–39 dan indexed byte identity versi modern, dengan comparator source modern terpisah. Ini bukan Khronos validator atau uji Blender.
