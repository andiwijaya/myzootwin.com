# Fasilitas native bird v41

Dua belas GLB terpilih baru: enclosure, feeder, water, perch dan reward v02; gate v03; masing-masing high/low. Ukuran dan jangkauan mengikuti bird v41, tanpa mengubah logical slot IDs. Enclosure/gate/reward hanya memperbarui metadata; semua attribute dan embedded PNG bytes sama dengan master sebelumnya. Pakan/air/tenggeran menyesuaikan bentuk native. Semua138 GLB sebelum tahap ini tetap utuh.

21 tes terkait lulus:12 fixture cases dan sembilan authoring-boundary cases. Pemeriksaan baru memakai nilai metre dari GLB v41 aktual serta paruh/kaki source yang dipose. Pembandingan biner mengizinkan pengurutan buffer berbeda tetapi menolak perubahan satu byte resource maupun metadata. Build/typecheck lulus.

30 source/actual retained-file render pairs lulus pada ambang tetap (mean<=2,p95<=5,pixels error>4<=5%).60 sidecars mempertahankan framing, kamera, stok, angle, lighting dan SHA. Matrix:12 overview high/low, delapan close food/water, empat close perch, dua roof detail, empat partial-stock pairs.31 embedded PNG instances diperiksa terhadap sumber. Enam reopen/dispose cycles stabil: perch source6geometry/16texture, import11/21. Kedua environment dihangatkan; baseline berbeda dari V01 yang15.

Empat fresh canonical exports dari stok parsial lulus content preservation: water high/low byte-identical; feeder high/low memiliki urutan buffer PNG berbeda akibat encoding asynchronous GLTFExporter. Seluruh view bytes, view metadata dan JSON references dinormalisasi dan dibandingkan ketat, tanpa toleransi numerik. Server tetap menolak overwrite409; client membuka master lama hanya setelah content equivalence. Lihat canonical-stock-export.json dan partial-stock-export-conflict.json. Console final kosong.

Percobaan capture pertama ditolak karena scrollbar mengubah lebar canvas dan ukuran gambar. Bukti disimpan di rejected-framing-attempt, tidak dipakai untuk acceptance. Gutter kini stabil; seluruh matrix diambil ulang pada1280x800CSS dengan native screenshot, tanpa resize gambar.

Verifier: `python tools/verify-aviary-fixture-evidence.py`. Comparator: `--region forest --expected-pairs 30 --viewport-pixel-scale`. Source/export inspection menelusuri attributes, component ranges, outward closed solids, material dan embedded resources. Ini gate model individual/portability. Kontak native di AVIARY_NATIVE_CONTACT_V01_2026-11-14; final habitat/runtime/mobile/deploy terpisah.
