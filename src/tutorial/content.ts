export type TutorialLocale = 'id' | 'en';

type ScreenshotPair = {
  name: 'start' | 'build' | 'care' | 'guests' | 'camera' | 'save';
  desktop: string;
  mobile: string;
};

type TutorialSection = {
  id: string;
  title: string;
  summary: string;
  steps: readonly [label: string, instruction: string][];
  note?: string;
  screenshots?: ScreenshotPair;
};

type TutorialCopy = {
  title: string;
  description: string;
  intro: string;
  play: string;
  contents: string;
  desktop: string;
  mobile: string;
  enlarge: string;
  imageNote: string;
  progression: readonly [habitat: string, unlock: string][];
  sections: readonly TutorialSection[];
  ready: string;
};

export const tutorialCopy: Record<TutorialLocale, TutorialCopy> = {
  id: {
    title: 'Cara bermain MyZooTwin',
    description: 'Tutorial MyZooTwin untuk pemain baru. Ikuti misi pertama, rawat satwa, buka lima habitat, dan pelajari kontrol peta dengan gambar desktop dan HP.',
    intro: 'Mulai dengan zoo kosong dan bangun rumah pertama untuk dua makaw. Ikuti langkahnya sambil bermain, dari menyambungkan jalur sampai membuka habitat berikutnya.',
    play: 'Buka permainan',
    contents: 'Isi tutorial',
    desktop: 'Desktop',
    mobile: 'HP',
    enlarge: 'Perbesar gambar',
    imageNote: 'Ketuk gambar untuk melihat ukuran penuh. Di HP, menu samping muncul di bawah peta dan panel navigasi.',
    progression: [
      ['Macaw Aviary', 'Tersedia saat permainan dimulai. Selesaikan Q01 sampai Q04 untuk membuka habitat berikutnya.'],
      ['Elephant Grove', 'Klaim hadiah Q04 dari misi Makaw, lalu klaim hibah Kawasan Gajah di Bangun.'],
      ['Lion Savanna', 'Klaim hadiah EH04 di Kawasan Gajah, lalu klaim hibah Savana Singa.'],
      ['Giraffe Plains', 'Klaim hadiah LQ04 di Savana Singa, lalu klaim hibah Padang Jerapah.'],
      ['Zebra Grasslands', 'Klaim hadiah GQ04 di Padang Jerapah, lalu klaim hibah Zebra.'],
    ],
    sections: [
      {
        id: 'mulai',
        title: 'Mulai permainan',
        summary: 'MyZooTwin berjalan di browser yang mendukung WebGL. Kamu bisa langsung bermain tanpa unduhan atau akun.',
        steps: [
          ['Pilih Mulai misi.', 'Tombolnya ada di kiri atas peta. Jika sudah punya simpanan di browser ini, tombol menampilkan Lanjut bermain.'],
          ['Kenali menu.', 'Buka menu menampilkan tab Misi, Rawat, Tamu, dan Bangun. Panel bawah menampilkan saldo, jumlah satwa, tamu, dan pilihan kandang.'],
          ['Atur bahasa bila perlu.', 'Buka Opsi di kanan atas dan pilih bahasa. Untuk membaca tutorial sambil bermain, kamu bisa membuka game di tab lain.'],
        ],
        screenshots: {
          name: 'start',
          desktop: 'Peta zoo yang baru dibuka di desktop dengan tombol Mulai misi di kiri atas dan menu di bawah.',
          mobile: 'Tampilan awal zoo di HP dengan tombol Mulai misi serta bilah kamera di dalam peta.',
        },
      },
      {
        id: 'misi-pertama',
        title: 'Bangun aviari dan selesaikan Q01',
        summary: 'Misi pertama menuntunmu membangun kandang makaw, menyambungkan gerbang, lalu mengambil hadiah.',
        steps: [
          ['Pratinjau habitat.', 'Di Misi, tekan Pratinjau habitat untuk melihat petak yang disarankan. Mulai dari saran ini agar jalur pertama lebih mudah dibuat.'],
          ['Konfirmasi setelah penempatan valid.', 'Periksa tapak hijau dan biayanya. Tekan Konfirmasi untuk membangun. Jika tapak merah, pilih petak lain atau tekan Batal. Membatalkan pratinjau memakai 0 ZC.'],
          ['Sambungkan jalur dari gerbang.', 'Gunakan Pratinjau petak jalur berikut, lalu Konfirmasi. Ulangi satu petak per langkah sampai jalur menyentuh pintu kandang.'],
          ['Klaim hadiah pertama.', 'Saat checklist Q01 lengkap, tekan Klaim 20 ZC. Petunjuk berikutnya mengarahkanmu ke perawatan makaw.'],
        ],
        note: 'Di HP, gulir ke bawah sampai kartunya terlihat. Mulai usapan dari area di luar peta agar halaman bergulir.',
        screenshots: {
          name: 'build',
          desktop: 'Pratinjau aviari valid pada peta desktop dengan tombol Konfirmasi dan Batal di kartu Misi.',
          mobile: 'Kartu Misi di bawah peta HP yang menampilkan Penempatan valid dan tombol Konfirmasi 300 ZC.',
        },
      },
      {
        id: 'rawat',
        title: 'Sambut dan rawat satwa',
        summary: 'Pilih Makaw di panel bawah, lalu buka Rawat. Setiap habitat punya kebutuhan dan fasilitasnya sendiri.',
        steps: [
          ['Sambut dua makaw.', 'Jika aviari masih kosong, gunakan Sambut dua makaw di Rawat. Hewan akan muncul di habitat yang sudah dibangun.'],
          ['Siapkan pakan, air, dan tempat istirahat.', 'Pilih fasilitas yang diperlukan, periksa lokasi yang ditandai, lalu konfirmasi. Setelah tempat pakan dan air tersedia, gunakan Isi tempat pakan dan Isi air saat stok menipis.'],
          ['Beri waktu satwa menggunakan fasilitas.', 'Tekan Lanjut bermain jika game dijeda. Satwa perlu berjalan atau terbang ke fasilitas, lalu makan, minum, atau beristirahat sebelum kondisinya membaik. Kecepatan 1× cocok untuk belajar. Pilihan 10× di Opsi mempercepat perawatan sekaligus membuat stok lebih cepat menipis.'],
          ['Baca kebutuhan dan cek Misi.', 'Lapar dan haus yang lebih rendah berarti kebutuhan lebih terpenuhi. Energi dan kesejahteraan yang lebih tinggi lebih baik. Tunggu sampai syarat misi terpenuhi, lalu klaim hadiah.'],
        ],
        screenshots: {
          name: 'care',
          desktop: 'Dua makaw di aviari dan kartu Tempat pakan buah pada tab Rawat di desktop.',
          mobile: 'Tab Rawat di HP yang memperlihatkan stok dan tombol pengisian tempat pakan buah.',
        },
      },
      {
        id: 'pengunjung',
        title: 'Buka gerbang dan kelola Zoo Coins',
        summary: 'Pengunjung memerlukan jalur yang tersambung dari gerbang ke area pandang di luar pagar.',
        steps: [
          ['Periksa jalur di Bangun.', 'Sambungkan petak dari pintu masuk ke sisi luar habitat. Periksa status jangkauan pada misi jika jalurnya belum dikenali.'],
          ['Buka gerbang dari tab Tamu.', 'Pilih Zoo untuk melihat seluruh area. Buka menu, masuk ke Tamu, lalu tekan Buka gerbang. Pilih tarif tiket virtual yang tersedia dan biarkan simulasi berjalan.'],
          ['Amati kedatangan.', 'Gunakan Lihat gerbang untuk memeriksa pintu masuk. Beri waktu tamu berjalan, berhenti di jalur pandang, dan tercatat di tujuan misi.'],
          ['Periksa saldo sebelum membeli.', 'Zoo Coins (ZC) dipakai untuk habitat, jalur, fasilitas, dan sebagian isi ulang. Biaya muncul sebelum konfirmasi. Hadiah misi dan hibah tersedia satu kali sesuai syaratnya.'],
        ],
        screenshots: {
          name: 'guests',
          desktop: 'Tab Tamu di desktop dengan status gerbang dan kontrol pengunjung di samping peta penuh.',
          mobile: 'Kartu Pengunjung suaka di HP dengan status gerbang, tiket, dan tombol kendali.',
        },
      },
      {
        id: 'habitat',
        title: 'Buka lima habitat',
        summary: 'Mulai dari Makaw. Setelah hadiah misi akhir satu habitat diklaim, habitat berikutnya tersedia lewat tab Bangun.',
        steps: [
          ['Ikuti misi sampai hadiah akhir.', 'Untuk Makaw, urutannya Q01 untuk kandang dan jalur, Q02 untuk perawatan, Q03 untuk pengunjung, lalu Q04 untuk kesejahteraan. Baca daftar syarat di kartu misi.'],
          ['Bangun area yang baru terbuka.', 'Pilih spesies di panel bawah, buka Bangun, dan klaim hibah yang tersedia. Rencanakan kandang, cek ruangnya, lalu konfirmasi.'],
          ['Ulangi pola dasar.', 'Sambungkan jalur pandang, sambut penghuni, dan siapkan pakan, air, serta tempat istirahat atau pengayaan yang sesuai. Lihat misi habitat untuk fasilitas yang diminta.'],
        ],
        note: 'Jika kandang bertanda Belum dibangun, klik spesiesnya untuk menemukan syarat dan alat bangun.',
      },
      {
        id: 'kamera',
        title: 'Jelajahi peta dan zoom kandang',
        summary: 'Kamera bisa berputar ke samping dan miring naik-turun. Gunakan tampilan Zoo untuk melihat seluruh area atau pilih kandang dari panel bawah.',
        steps: [
          ['Putar dengan mouse di desktop.', 'Tahan tombol kiri lalu geser mendatar untuk berputar atau naik-turun untuk memiringkan kamera. Saat peta diperbesar, tahan Shift sebelum drag untuk menggeser peta. Roda mouse mengatur zoom.'],
          ['Gunakan satu atau dua jari di HP.', 'Geser satu jari ke samping atau naik-turun untuk memutar. Geser dengan dua jari untuk memindahkan peta. Rentangkan jari untuk memperbesar dan rapatkan untuk memperkecil.'],
          ['Lihat kandang lebih dekat.', 'Pilih Makaw, Gajah, Singa, Jerapah, atau Zebra yang sudah dibangun. Gunakan + dan − untuk zoom, Utuh untuk kembali ke sudut awal, dan panah kembali untuk melihat Zoo penuh.'],
          ['Lapangkan area peta.', 'Lipat panel bawah dan menu samping secara terpisah. Bilah kamera tetap ada di peta. Pilihan tombol buka-tutup diingat di browser ini saat reload.'],
        ],
        note: 'Di kandang pada desktop, gunakan mode Putar untuk drag dua arah jika mode Geser sedang terpilih. Saat peta difokuskan, tombol panah menggeser, Q dan E memutar, dan Home mengembalikan tampilan awal.',
        screenshots: {
          name: 'camera',
          desktop: 'Padang Jerapah dari sudut yang dimiringkan dengan panel bawah tertutup dan bilah kamera tetap ada.',
          mobile: 'Zoom kandang jerapah di HP dengan kedua menu tertutup dan tombol Tampilkan panel bawah tetap terlihat.',
        },
      },
      {
        id: 'simpan',
        title: 'Jeda, simpan, dan lanjutkan',
        summary: 'Progres tersimpan otomatis di profil browser yang sedang kamu pakai saat penyimpanan tersedia.',
        steps: [
          ['Jeda dengan tombol di peta.', 'Tekan Jeda sebelum meninggalkan halaman. Satwa dan tamu akan berhenti sampai simulasi dilanjutkan.'],
          ['Buka Detail simpanan.', 'Tunggu status Tersimpan di perangkat. Jika status masih Menunggu simpan otomatis atau Menyimpan, tunggu sampai selesai sebelum menutup tab.'],
          ['Buka game dari profil browser yang sama.', 'Saat kembali, peta memuat simpanan dalam keadaan dijeda. Tekan Lanjut bermain ketika siap. Menghapus data situs akan menghapus progres lokal.'],
        ],
        screenshots: {
          name: 'save',
          desktop: 'Detail simpanan desktop yang menampilkan status Tersimpan di perangkat saat zoo dijeda.',
          mobile: 'Detail simpanan di HP di atas peta, dengan tombol Lanjut bermain pada zoo yang dijeda.',
        },
      },
      {
        id: 'bantuan',
        title: 'Jika kamu buntu',
        summary: 'Mulai dari petunjuk yang tampil di kartu misi atau di dekat tombol yang sedang kamu pakai.',
        steps: [
          ['Menu atau daftar kandang hilang.', 'Gunakan Buka menu untuk tab Misi, Rawat, Tamu, dan Bangun. Gunakan Tampilkan panel bawah untuk melihat pilihan kandang dan saldo.'],
          ['Koin awal tinggal sedikit.', 'Pilih Tinjau bantuan awal di Misi jika tersedia. Baca fasilitas, akses, dan biaya yang ditampilkan sebelum menyetujui bantuan.'],
          ['Tombol Konfirmasi belum bisa ditekan.', 'Baca alasan di kartu pratinjau. Pilih petak kosong yang sesuai, beri ruang dari sungai dan bangunan, atau cek saldo. Gunakan Batal untuk membatalkan rencana tanpa biaya.'],
          ['Satwa atau tamu belum bergerak.', 'Pastikan status game berjalan. Cek stok pakan dan air, jalur yang terhubung, dan status buka gerbang sesuai tujuan misi.'],
          ['Peta berat atau gagal terbuka.', 'Pilih Coba lagi jika pratinjau menawarkan tombol itu. Jika peta terbuka tetapi terasa berat, buka Opsi, pilih Pengaturan, lalu ubah Kualitas grafis ke Hemat daya dan tekan Terapkan.'],
          ['Simpanan belum tersedia atau berubah di tab lain.', 'Buka Detail simpanan untuk melihat penyebabnya. Gunakan satu tab game dan ikuti pilihan Muat ulang simpanan jika browser mendeteksi perubahan. Jika penyimpanan diblokir, simpanan lokal dan pilihan panel hanya tersedia selama sesi yang sedang dibuka.'],
        ],
      },
    ],
    ready: 'Siap membangun aviari pertamamu?',
  },
  en: {
    title: 'How to play MyZooTwin',
    description: 'A beginner’s MyZooTwin tutorial with desktop and mobile screenshots for the first mission, animal care, habitat unlocks, and map controls.',
    intro: 'Start with an empty zoo and build a home for two macaws. Follow along as you connect your first path, care for animals, and open new habitats.',
    play: 'Open the game',
    contents: 'In this guide',
    desktop: 'Desktop',
    mobile: 'Phone',
    enlarge: 'Enlarge screenshot',
    imageNote: 'Select an image to view it at full size. The screenshots use Indonesian. You can switch the game to English under Options. On a phone, scroll below the map and destination buttons to reach the side menu.',
    progression: [
      ['Macaw Aviary', 'Available from the start. Complete Q01 through Q04 to unlock the next habitat.'],
      ['Elephant Grove', 'Claim the Macaw Q04 reward, then claim the Elephant Grove grant in Build.'],
      ['Lion Savanna', 'Claim EH04 in Elephant Grove, then claim the Savanna grant.'],
      ['Giraffe Plains', 'Claim LQ04 in Lion Savanna, then claim the Giraffe Plains grant.'],
      ['Zebra Grasslands', 'Claim GQ04 in Giraffe Plains, then claim the Zebra grant.'],
    ],
    sections: [
      {
        id: 'mulai',
        title: 'Start the game',
        summary: 'MyZooTwin runs in a WebGL-capable browser. You can play without an account or a download.',
        steps: [
          ['Choose Start mission.', 'Find it at the top left of the map. If this browser already has a save, the button says Resume.'],
          ['Find your menus.', 'Open menu shows Missions, Care, Guests, and Build. The bottom panel shows coins, animals, guests, and habitat destinations.'],
          ['Pick a language if needed.', 'Open Options at the top right and choose your language. Keep this tutorial in a separate tab if you want to follow it while playing.'],
        ],
        screenshots: {
          name: 'start',
          desktop: 'A fresh zoo on desktop with the Start mission button at the top left and menus under the map.',
          mobile: 'The opening zoo view on a phone with the Start mission button and the in-map camera toolbar.',
        },
      },
      {
        id: 'misi-pertama',
        title: 'Build the aviary and complete Q01',
        summary: 'The first mission guides you through building a macaw habitat, connecting it to the entrance, and claiming the reward.',
        steps: [
          ['Preview the habitat.', 'In Missions, choose Preview habitat to see the suggested footprint. Using the suggestion makes the first path easier to place.'],
          ['Confirm when placement is valid.', 'Check the green footprint and the price. Confirm to build. If the footprint is red, choose a different tile or cancel the preview for 0 ZC.'],
          ['Connect the path to the entrance.', 'Choose Preview next path tile and then Confirm. Repeat one tile at a time until the path reaches the habitat entrance.'],
          ['Claim the first reward.', 'When the Q01 checklist is complete, choose Claim 20 ZC. The next objective introduces macaw care.'],
        ],
        note: 'On a phone, scroll down to the mission card. Start scrolling outside the map so your gesture moves the page.',
        screenshots: {
          name: 'build',
          desktop: 'A valid aviary preview on the desktop map with Confirm and Cancel in the Missions card.',
          mobile: 'The Missions card below the phone’s map, showing valid placement and Confirm for 300 ZC.',
        },
      },
      {
        id: 'rawat',
        title: 'Welcome and care for animals',
        summary: 'Choose Macaws in the bottom panel, then open Care. Each habitat has its own facilities and needs.',
        steps: [
          ['Welcome two macaws.', 'If the aviary is empty, use Welcome two macaws in Care. The birds appear in the completed habitat.'],
          ['Provide food, water, and rest.', 'Pick a facility, inspect the marked location, and confirm placement. Use Fill feeder and Refill water once those facilities are in place and stocks get low.'],
          ['Give animals time to use the facilities.', 'Choose Resume if the game is paused. Animals walk or fly to a facility and finish eating, drinking, or resting before their needs improve. Start at 1× speed. The 10× option in Options makes care and supply use move faster.'],
          ['Read the gauges and mission card.', 'Lower hunger and thirst are better. Higher energy and welfare are better. Claim the mission reward once its actual conditions are met.'],
        ],
        screenshots: {
          name: 'care',
          desktop: 'Two macaws in their aviary with the fruit feeder card open in the desktop Care tab.',
          mobile: 'The phone Care tab showing the fruit feeder and its refill control.',
        },
      },
      {
        id: 'pengunjung',
        title: 'Open the entrance and manage Zoo Coins',
        summary: 'Guests need a connected path from the entrance to a spot outside the habitat fence where they can watch.',
        steps: [
          ['Check the path in Build.', 'Connect tiles from the entrance to the outside edge of the habitat. Check the mission’s access status if the route is still incomplete.'],
          ['Open the entrance in Guests.', 'Choose Zoo to see the whole park. Open the menu, select Guests, and choose Open entrance. Set an available virtual ticket price and let the simulation run.'],
          ['Watch a guest arrive.', 'Choose View entrance to inspect the entry. Give guests time to walk, stop by a habitat, and count toward the objective.'],
          ['Check the balance before buying.', 'Zoo Coins (ZC) pay for habitats, paths, facilities, and some refills. The price appears before confirmation. Mission rewards and grants can each be claimed once.'],
        ],
        screenshots: {
          name: 'guests',
          desktop: 'The desktop Guests tab with entrance status and visitor controls beside the full zoo.',
          mobile: 'The phone Guests card with entrance status, tickets, and visitor controls.',
        },
      },
      {
        id: 'habitat',
        title: 'Unlock all five habitats',
        summary: 'Start with Macaws. Claim the last mission reward in each habitat to access the next habitat in Build.',
        steps: [
          ['Finish the current mission chain.', 'The macaw chain starts with Q01 for habitat access, then Q02 for care, Q03 for guests, and Q04 for welfare. Follow the requirements on each mission card.'],
          ['Build the newly available habitat.', 'Choose the species from the bottom panel, open Build, and claim its grant when available. Plan the footprint, check that there is room, and confirm.'],
          ['Repeat the care loop.', 'Add a viewing path, welcome animals, and provide the food, water, rest, or enrichment facilities listed in that habitat’s missions.'],
        ],
        note: 'A destination marked Not built yet leads to its requirements and building tools.',
      },
      {
        id: 'kamera',
        title: 'Explore the map and zoom into habitats',
        summary: 'The camera turns sideways and tilts up or down. Choose Zoo for the whole park or a habitat to see it up close.',
        steps: [
          ['Drag with the left mouse button on desktop.', 'Drag sideways to turn or vertically to tilt. When zoomed in, hold Shift before dragging to move the map. Use the mouse wheel to zoom.'],
          ['Use one or two fingers on a phone.', 'Drag one finger sideways or up and down to rotate. Drag two fingers to move the map. Spread or pinch your fingers to zoom.'],
          ['Focus on a habitat.', 'Choose a completed habitat from the bottom panel. Use + and − to zoom, Fit to return to the initial view, and the back arrow to return to the whole zoo.'],
          ['Give the map more space.', 'Collapse the bottom panel and the side menu independently. The camera toolbar stays on the map. Your toggle choices are remembered in this browser when you reload.'],
        ],
        note: 'On desktop, choose Rotate in the habitat’s mouse controls if Pan is selected. With the map focused, use the arrows to pan, Q and E to rotate, and Home to reset the view.',
        screenshots: {
          name: 'camera',
          desktop: 'Giraffe Plains at a tilted angle on desktop with the bottom panel collapsed and the toolbar visible.',
          mobile: 'A close view of the giraffe habitat on a phone with both menus collapsed.',
        },
      },
      {
        id: 'simpan',
        title: 'Pause, save, and resume',
        summary: 'Progress saves automatically in the current browser profile when storage is available.',
        steps: [
          ['Pause from the map.', 'Choose Pause before leaving the page. Animals and visitors pause until you resume the simulation.'],
          ['Open Save details.', 'Wait for Saved on this device. If the status shows Changes pending or Saving, wait for it to finish before closing the tab.'],
          ['Return with the same browser profile.', 'The zoo loads paused. Choose Resume when you are ready. Clearing site data removes local progress.'],
        ],
        screenshots: {
          name: 'save',
          desktop: 'Desktop Save details showing that the paused zoo is saved on this device.',
          mobile: 'Save details above the paused zoo on a phone, with the Resume button in the map.',
        },
      },
      {
        id: 'bantuan',
        title: 'If you get stuck',
        summary: 'Start with the message on the mission card or next to the control you are using.',
        steps: [
          ['A menu or habitat list disappeared.', 'Use Open menu to reach Missions, Care, Guests, and Build. Use Show bottom panel to see destinations and the balance.'],
          ['Starting coins are running low.', 'Choose Review starter support in Missions if available. Review the facilities, access, and costs before confirming.'],
          ['Confirm is disabled.', 'Read the reason in the preview card. Try a suitable empty tile away from scenery and the creek, or check your balance. Cancel leaves the plan unbuilt.'],
          ['Animals or guests are not moving.', 'Make sure the game is running. Check supplies, connected viewing paths, and the entrance state for your current objective.'],
          ['The map is slow or fails to open.', 'Use Try again if the preview offers it. If the map opens but feels slow, open Options and Settings, select Low power under Graphics quality, then Apply.'],
          ['Saving is blocked or another tab changed the zoo.', 'Open Save details for the cause. Use one game tab and follow the reload-save prompt if it appears. When storage is blocked, your progress and panel choices last only for the current visit.'],
        ],
      },
    ],
    ready: 'Ready to build your first aviary?',
  },
};
