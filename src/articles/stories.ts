import type { ImageMetadata } from 'astro';
import makaw from '../assets/articles/makaw.webp';
import gajah from '../assets/articles/gajah.webp';
import singa from '../assets/articles/singa.webp';
import jerapah from '../assets/articles/jerapah.webp';
import zebra from '../assets/articles/zebra.webp';

export type AnimalStory = {
  slug: string;
  species: string;
  scientificName: string;
  habitat: string;
  title: string;
  description: string;
  alt: string;
  image: ImageMetadata;
  scene: string;
  story: readonly string[];
  wild: readonly string[];
  tryInGame: string;
  source: { label: string; href: string };
};

export const animalStories: readonly AnimalStory[] = [
  {
    slug: 'makaw',
    image: makaw,
    species: 'Makaw biru-kuning',
    scientificName: 'Ara ararauna',
    habitat: 'Macaw Aviary',
    title: 'Makaw Biru-Kuning dan Tenggeran Pertama',
    description: 'Dua makaw tiba di aviari baru. Ikuti penerbangan pendek mereka dan kenali paruh, cengkeraman, serta kebiasaan burung ini di alam.',
    alt: 'Seekor makaw biru-kuning dengan ekor panjang bertengger di cabang di hutan tropis.',
    scene: 'Sebelum mangkuk buah disentuh',
    story: [
      'Dua makaw baru tiba di Macaw Aviary. Yang satu menghampiri tenggeran dengan beberapa kepak pendek. Yang lain masih di lantai, menoleh mengikuti bayangan sayap yang melintas di antara tiang. Dari jalur pengunjung, dada kuning mereka terlihat jelas di bawah naungan pohon.',
      'Ketika tempat pakan sudah terisi, burung pertama turun dan berjalan ke mangkuk. Temannya berpindah ke tenggeran yang baru ditinggalkan. Dalam beberapa menit, aviari yang tadinya sepi punya irama sendiri. Ada waktu untuk bergerak, makan, minum, dan berdiam sebentar di tempat tinggi.',
      'Bagi pemain baru, momen itu datang sesudah pekerjaan yang mudah terlewat. Kandang perlu selesai, gerbang perlu jalur, dan fasilitas perlu diisi. Sesudah semuanya beres, sisakan waktu untuk melihat kedua burung memilih tempatnya sendiri.',
    ],
    wild: [
      'Makaw termasuk keluarga burung paruh bengkok. Paruh yang besar dan kuat membantu mereka membuka biji dan kacang. Kaki yang cekatan bisa mencengkeram cabang, membawa benda ke paruh, dan memeriksa makanan dari berbagai arah.',
      'Di hutan, makaw berkomunikasi dengan panggilan yang terdengar jauh di antara pepohonan. Mereka juga bersosialisasi dengan pasangan dan kelompok keluarga. Saat mendarat, posisi sayap, ekor, dan kaki membantu tubuh melambat sebelum kaki meraih tenggeran.',
    ],
    tryInGame: 'Siapkan pakan buah, wadah air, dan tenggeran istirahat. Jalankan simulasi, lalu amati bagaimana seekor makaw berpindah dari tempat tinggi ke salah satu fasilitas.',
    source: { label: 'San Diego Zoo Wildlife Alliance — Macaw', href: 'https://animals.sandiegozoo.org/animals/macaw' },
  },
  {
    slug: 'gajah',
    image: gajah,
    species: 'Gajah Asia',
    scientificName: 'Elephas maximus',
    habitat: 'Elephant Grove',
    title: 'Ayu dan Nara di Tepi Kolam',
    description: 'Ayu dan Nara menjalani pagi yang tenang di Elephant Grove. Cerita mereka memperkenalkan cara gajah memakai belalai, air, dan naungan.',
    alt: 'Seekor gajah Asia betina mengangkat belalainya di tepi kolam hutan.',
    scene: 'Satu langkah, lalu percikan',
    story: [
      'Di Elephant Grove, Ayu meninggalkan tempat pakan dan bergerak ke arah kolam. Nara masih berada di bawah pohon. Ketika Ayu tiba di air, permukaan kolam mulai beriak dan semprotan pendek tampak di ujung belalainya. Nara bangkit beberapa saat kemudian dan berjalan menyusul.',
      'Kolam mandi dan air minum punya tempat masing-masing di habitat mereka. Di sisi lain ada batang kayu untuk menggosok tubuh. Dari luar pagar, pengunjung bisa melihat Ayu berpindah di antara tempat-tempat itu. Saat peta dijalankan dengan kecepatan normal, setiap perhentian mudah diikuti.',
      'Dua gajah besar juga membuat ruang kosong terasa penting. Setelah fasilitas dipasang, perhatikan jalur yang mereka gunakan untuk mendekat. Kamu bisa belajar banyak hanya dengan mengikuti perjalanan Ayu dari tempat pakan sampai ke naungan.',
    ],
    wild: [
      'Belalai gajah merupakan perpanjangan hidung dan bibir atas. Belalai dapat meraih ranting, mengambil air untuk dialirkan ke mulut, serta membantu gajah mencium dan menyentuh lingkungan di sekelilingnya.',
      'Gajah Asia juga memakai air, tanah, dan lumpur untuk merawat kulitnya. Telinga turut membantu melepaskan panas. Betina dan anak-anak hidup dalam kelompok sosial yang hubungan anggotanya bisa bertahan lama.',
    ],
    tryInGame: 'Sesudah membuka Elephant Grove, siapkan pakan, air minum, kolam mandi, dan naungan. Pilih habitatnya dan ikuti perjalanan salah satu gajah menuju fasilitas.',
    source: { label: 'Smithsonian’s National Zoo — Asian Elephant', href: 'https://nationalzoo.si.edu/animals/asian-elephant' },
  },
  {
    slug: 'singa',
    image: singa,
    species: 'Singa',
    scientificName: 'Panthera leo',
    habitat: 'Lion Savanna',
    title: 'Singa dari Puncak Kopje',
    description: 'Raka, Sena, dan Tala punya tempat favorit di Lion Savanna. Lihat bagaimana batu tinggi, tempat teduh, dan kehidupan kawanan membentuk hari mereka.',
    alt: 'Seekor singa jantan bersurai berdiri di atas batu di padang rumput savana.',
    scene: 'Menunggu di bawah batu',
    story: [
      'Raka berjalan menuju batu tinggi di tengah Lion Savanna. Batu itu disebut kopje. Dari jalur pengunjung, langkah terakhirnya terlihat sebelum sebagian tubuhnya muncul di atas batu. Ia berhenti dan menatap ke arah padang. Di bawahnya, Sena dan Tala masih beristirahat.',
      'Di habitat ini, ada juga batang untuk menggaruk dan tempat pengayaan aroma. Ketika kawanan berpindah, salah satu singa bisa berhenti untuk mengendus, sementara yang lain mencari air atau kembali berteduh. Selang beberapa saat, dari atas kopje terdengar auman.',
      'Saat baru membuka Lion Savanna, mudah terpaku pada auman pertama. Selepas itu, coba perhatikan tempat yang mereka pilih untuk duduk, beristirahat, dan saling mendekat. Gerakan kecil di sekitar kopje ikut membentuk hari kawananmu.',
    ],
    wild: [
      'Singa hidup secara sosial dalam kelompok yang disebut pride. Anggotanya beristirahat bersama dan berkomunikasi melalui suara serta sentuhan. Auman dapat membantu singa memberi tahu kelompok lain bahwa suatu wilayah sedang ditempati.',
      'Surai biasanya menonjol pada jantan dewasa. Singa juga menghabiskan banyak waktu untuk beristirahat. Periode tenang itu membantu menjelaskan mengapa singa yang sedang berbaring bisa menjadi pemandangan yang paling sering dijumpai.',
    ],
    tryInGame: 'Sediakan tempat istirahat dan jalur yang bisa dijangkau menuju kopje. Amati singa saat berpindah dari beristirahat ke memanjat, mengaum, lalu turun lagi.',
    source: { label: 'Smithsonian’s National Zoo — Lion', href: 'https://nationalzoo.si.edu/animals/lion' },
  },
  {
    slug: 'jerapah',
    image: jerapah,
    species: 'Jerapah',
    scientificName: 'Giraffa',
    habitat: 'Giraffe Plains',
    title: 'Jerapah dan Ranting di Atas Pagar',
    description: 'Dira, Sora, dan Lila bergerak antara pakan tinggi, air, dan pohon teduh. Kenali cara jerapah meraih daun dan menyesuaikan tubuh ketika minum.',
    alt: 'Seekor jerapah betina meraih daun akasia dengan kepala dan leher terlihat utuh.',
    scene: 'Makan dari tempat yang tinggi',
    story: [
      'Dira mengangkat kepala ke tempat pakan daun di Giraffe Plains. Dari luar pagar, ujung ranting tampak bergerak ketika ia mulai makan. Sora berjalan ke naungan, sementara Lila mendekati air. Tiga jerapah itu menempati tiga sudut kandang yang sama dalam satu waktu.',
      'Begitu Lila minum, kamu bisa melihat perbedaan gerak yang besar. Kepala yang tadi terlihat tinggi harus turun mendekati permukaan air. Dira mengambil satu porsi lagi, lalu bergerak pelan menuju Sora. Di layar kecil, gerak itu lebih mudah diikuti dari mode zoom kandang.',
      'Pemain menyiapkan tempat berkegiatan mereka. Pakan tinggi memberi tujuan untuk meraih daun, air memberi tujuan untuk minum, dan pohon menyediakan tempat istirahat. Setelah ketiganya aktif, lihat bagaimana Dira, Sora, dan Lila bergantian mengunjungi sudut yang sama.',
    ],
    wild: [
      'Jerapah memanfaatkan leher dan kaki yang panjang untuk meraih tumbuhan di ketinggian. Lidahnya dapat melilit daun. Bibir yang lentur juga membantu mengambil daun di sela ranting yang berduri.',
      'Saat minum, jerapah membentangkan kaki depan atau menekuknya agar kepala bisa mencapai air. Jarak antara posisi makan dan minum membuat kedua kegiatan itu mudah dibedakan ketika kamu mengamatinya.',
    ],
    tryInGame: 'Pilih Jerapah, lalu putar kamera sedikit dari sisi pagar. Perhatikan bentuk leher ketika satwa meraih pakan tinggi, lalu bandingkan dengan postur ketika minum.',
    source: { label: 'San Diego Zoo Wildlife Alliance — Giraffe', href: 'https://animals.sandiegozoo.org/animals/giraffe' },
  },
  {
    slug: 'zebra',
    image: zebra,
    species: 'Zebra dataran',
    scientificName: 'Equus quagga',
    habitat: 'Zebra Grasslands',
    title: 'Zebra dan Garis Milik Sendiri',
    description: 'Zaki, Zuri, Mira, dan Kira merumput bersama di Zebra Grasslands. Amati pola loreng mereka dan kenali kebiasaan hidup zebra dataran.',
    alt: 'Seekor zebra dataran berloreng hitam-putih berdiri menyamping di padang rumput.',
    scene: 'Empat kepala di atas rumput',
    story: [
      'Zaki menundukkan kepala di petak rumput. Zuri dan Mira menyusul dari sisi pagar. Kira berhenti lebih dulu di dekat air, lalu mendekati kelompok kecil itu. Dari jauh, garis hitam dan putih mereka seperti saling menyambung ketika berdiri berdekatan.',
      'Coba amati satu zebra saat ia berjalan menjauh. Arah garis di bahu dan pinggang lebih mudah dilihat ketika tubuhnya tidak tertutup kawanan. Di Zebra Grasslands, berhenti sebentar untuk melihat seekor zebra membantu kamu mengenalinya ketika ia kembali bergabung.',
      'Kawanan ini datang pada tahap akhir perjalanan zoo. Setelah habitat dibangun dan jalur tersambung, ada banyak hal kecil yang bisa diamati. Mereka merumput, mendatangi air, mencari naungan, dan sesekali saling merawat.',
    ],
    wild: [
      'Zebra dataran memakan terutama rumput, sehingga merumput menjadi kegiatan penting dalam kesehariannya. Mereka hidup berkelompok. Kelompok keluarga dapat berkumpul dengan kelompok lain ketika memanfaatkan wilayah yang sama.',
      'Pola loreng berbeda pada setiap individu. Garis yang tampak seragam dari jauh bisa berubah bentuk dan arah di tubuh seekor zebra. Memperhatikan bagian bahu, sisi badan, dan wajah membantu melihat perbedaannya.',
    ],
    tryInGame: 'Sesudah menyambut kawanan, sediakan rumput, air, dan tempat teduh. Pilih Zebra dari panel bawah, lalu gunakan zoom untuk mengikuti seekor zebra saat berpindah tempat.',
    source: { label: 'San Diego Zoo Wildlife Alliance — Zebra', href: 'https://animals.sandiegozoo.org/animals/zebra' },
  },
];
