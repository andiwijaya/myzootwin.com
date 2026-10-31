export type EntryLocale = 'en' | 'id';

export const ENTRY_PREFERENCES_KEY = 'myzootwin.entry.preferences.v1';

export const english = {
  pageTitle: 'Play Zoo — Tropical Creek | MyZooTwin',
  description: 'Visit the Tropical Creek sanctuary preview. Read the guide and choose your language while the playable zoo is being prepared.',
  status: 'Development preview',
  sanctuary: 'Tropical Creek Sanctuary',
  title: 'A little world to care for.',
  intro: 'A quiet creek, a future home for two curious macaws, and a sanctuary waiting to grow.',
  availability: 'Play is not available in this preview yet. Building, animal care, visitors and saved games will open as the sanctuary takes shape.',
  play: 'Play — coming soon',
  continue: 'Continue — not available yet',
  help: 'How to play',
  settings: 'Settings',
  journal: 'Explore the animal journal',
  artTitle: 'Concept illustration of a tropical creek, trees and a future habitat.',
  artCaption: 'Sanctuary concept · illustration only',
  helpTitle: 'One kind step at a time',
  helpIntro: 'When play opens, your first sanctuary will grow through these steps:',
  stepOneTitle: 'Build a safe home',
  stepOne: 'Place a habitat and connect it to the entrance with a path.',
  stepTwoTitle: 'Care for two macaws',
  stepTwo: 'Offer food, water and a place to rest. Watch how they respond.',
  stepThreeTitle: 'Welcome visitors',
  stepThree: 'Connected paths will bring guests and ticket income.',
  stepFourTitle: 'Keep the creek thriving',
  stepFour: 'Complete missions, improve the sanctuary and return to your saved progress.',
  guideNote: 'This guide describes the planned game. These actions are not playable yet.',
  settingsTitle: 'Make yourself at home',
  language: 'Language',
  languageHint: 'Choose the language for this sanctuary preview.',
  preferenceReady: 'Changes are saved on this device when you choose a language.',
  preferenceSaved: 'Your language preference is saved on this device.',
  preferenceTemporary: 'Your language is available for this visit, but browser storage is unavailable.',
  storageNote: 'This setting stores only your language choice. No account is needed.',
  close: 'Close',
  noScript: 'Enable JavaScript for the 3D preview, guide and language settings. Play is not available in this preview.',
  previewOpen: 'Open 3D preview',
  previewClose: 'Close 3D preview',
  previewBack: 'Back to illustration',
  previewRetry: 'Try again',
  previewReload: 'Reload page',
  previewCanvas: 'Tropical Creek: a 3D island with palms, a creek and an entrance gate. Read-only preview; no gameplay yet.',
  previewCaption: 'Tropical Creek · world preview, gameplay coming',
  previewLoading: 'Opening the 3D preview…',
  previewLoadingDetail: 'Preparing a small render space. You can close this preview at any time.',
  previewReady: '3D preview ready',
  previewReadyDetail: 'Tap a tile or object to inspect it. Zoom in to explore Tropical Creek. Building and animal care are still being built.',
  previewUnsupported: '3D preview unavailable',
  previewUnsupportedDetail: 'This browser could not start WebGL 2. The guide, language settings and journal are still available.',
  previewError: 'The 3D preview could not start',
  previewErrorDetail: 'You can try again or return to the illustration. This does not change your language setting.',
  previewLost: 'The 3D view stopped',
  previewLoadError: 'Preview files could not load',
  previewReloadDetail: 'Reload the page to try loading the preview again.',
  cameraControls: 'World camera controls',
  cameraZoomIn: 'Zoom in',
  cameraZoomOut: 'Zoom out',
  cameraReset: 'Overview',
  cameraHelp: 'Zoom in, then drag to pan. Wheel or pinch to zoom. Focus the world: arrows to pan, +/− to zoom, Home for overview, Enter to inspect the center, Esc to dismiss.',
  selectionTile: 'Tile {x}, {z}',
  selectionPalm: 'Palm {n}',
  selectionTree: 'Broadleaf tree {n}',
  selectionRock: 'Rock {n}',
  selectionReeds: 'Creek reeds {n}',
  selectionGate: 'Sanctuary entrance',
  selectionLocation: 'Map tile {x}, {z}',
  selectionLandDetail: 'Grassland. No player structure has been placed here.',
  selectionCreekDetail: 'Creek water, part of the sanctuary scenery.',
  selectionPathDetail: 'Entrance apron. Visitor routes are still being built.',
  selectionSceneryDetail: 'Sanctuary scenery. Building and editing arrive later.',
  selectionGateDetail: 'Entrance landmark. Visitor routes arrive later.',
  selectionDismiss: 'Dismiss selection',
  selectionCleared: 'Selection cleared.',
  softwareNotice: '3D software notice',
} as const;

export type EntryMessage = keyof typeof english;

export const entryMessages: Record<EntryLocale, Record<EntryMessage, string>> = {
  en: english,
  id: {
    pageTitle: 'Main Zoo — Tropical Creek | MyZooTwin',
    description: 'Kunjungi pratinjau suaka Tropical Creek. Baca panduan dan pilih bahasa sambil menunggu permainan kebun binatang siap.',
    status: 'Pratinjau pengembangan',
    sanctuary: 'Suaka Tropical Creek',
    title: 'Dunia kecil untuk dirawat.',
    intro: 'Sungai yang tenang, calon rumah bagi dua makaw yang penasaran, dan suaka yang akan tumbuh.',
    availability: 'Permainan belum tersedia dalam pratinjau ini. Membangun, merawat satwa, menerima pengunjung, dan menyimpan permainan akan hadir saat suaka siap.',
    play: 'Main — segera hadir',
    continue: 'Lanjutkan — belum tersedia',
    help: 'Cara bermain',
    settings: 'Pengaturan',
    journal: 'Jelajahi jurnal satwa',
    artTitle: 'Ilustrasi konsep sungai tropis, pepohonan, dan calon habitat.',
    artCaption: 'Konsep suaka · hanya ilustrasi',
    helpTitle: 'Satu langkah peduli setiap kali',
    helpIntro: 'Saat permainan dibuka, suaka pertamamu akan tumbuh melalui langkah berikut:',
    stepOneTitle: 'Bangun rumah yang aman',
    stepOne: 'Tempatkan habitat dan hubungkan ke pintu masuk dengan jalan.',
    stepTwoTitle: 'Rawat dua makaw',
    stepTwo: 'Sediakan makanan, air, dan tempat istirahat. Amati respons mereka.',
    stepThreeTitle: 'Sambut pengunjung',
    stepThree: 'Jalan yang terhubung akan membawa tamu dan pemasukan tiket.',
    stepFourTitle: 'Jaga suaka tetap tumbuh',
    stepFour: 'Selesaikan misi, perbaiki suaka, dan kembali ke progres yang tersimpan.',
    guideNote: 'Panduan ini menjelaskan rencana permainan. Langkah-langkah ini belum bisa dimainkan.',
    settingsTitle: 'Buat dirimu nyaman',
    language: 'Bahasa',
    languageHint: 'Pilih bahasa untuk pratinjau suaka ini.',
    preferenceReady: 'Perubahan disimpan di perangkat ini saat kamu memilih bahasa.',
    preferenceSaved: 'Pilihan bahasamu tersimpan di perangkat ini.',
    preferenceTemporary: 'Bahasamu tersedia untuk kunjungan ini, tetapi penyimpanan browser tidak tersedia.',
    storageNote: 'Pengaturan ini hanya menyimpan pilihan bahasa. Akun tidak diperlukan.',
    close: 'Tutup',
    noScript: 'Aktifkan JavaScript untuk pratinjau 3D, panduan, dan pengaturan bahasa. Permainan belum tersedia dalam pratinjau ini.',
    previewOpen: 'Buka pratinjau 3D',
    previewClose: 'Tutup pratinjau 3D',
    previewBack: 'Kembali ke ilustrasi',
    previewRetry: 'Coba lagi',
    previewReload: 'Muat ulang halaman',
    previewCanvas: 'Tropical Creek: pulau 3D dengan palem, sungai, dan gerbang. Pratinjau saja; permainan belum tersedia.',
    previewCaption: 'Tropical Creek · pratinjau dunia, permainan menyusul',
    previewLoading: 'Membuka pratinjau 3D…',
    previewLoadingDetail: 'Menyiapkan ruang 3D kecil. Pratinjau ini bisa ditutup kapan saja.',
    previewReady: 'Pratinjau 3D siap',
    previewReadyDetail: 'Ketuk petak atau objek untuk melihat identitasnya. Perbesar untuk menjelajahi Tropical Creek. Membangun dan merawat satwa masih disiapkan.',
    previewUnsupported: 'Pratinjau 3D tidak tersedia',
    previewUnsupportedDetail: 'Browser ini tidak dapat memulai WebGL 2. Panduan, pengaturan bahasa, dan jurnal tetap tersedia.',
    previewError: 'Pratinjau 3D belum bisa dimulai',
    previewErrorDetail: 'Kamu bisa mencoba lagi atau kembali ke ilustrasi. Pengaturan bahasamu tidak diubah.',
    previewLost: 'Tampilan 3D terhenti',
    previewLoadError: 'Berkas pratinjau belum bisa dimuat',
    previewReloadDetail: 'Muat ulang halaman untuk mencoba memuat pratinjau lagi.',
    cameraControls: 'Kontrol kamera dunia',
    cameraZoomIn: 'Perbesar',
    cameraZoomOut: 'Perkecil',
    cameraReset: 'Lihat semua',
    cameraHelp: 'Perbesar dulu, lalu geser untuk pan. Roda atau cubit untuk zoom. Fokus dunia: panah untuk pan, +/− untuk zoom, Home lihat semua, Enter periksa tengah, Esc tutup pilihan.',
    selectionTile: 'Petak {x}, {z}',
    selectionPalm: 'Palem {n}',
    selectionTree: 'Pohon rindang {n}',
    selectionRock: 'Batu {n}',
    selectionReeds: 'Rumput tepi sungai {n}',
    selectionGate: 'Gerbang suaka',
    selectionLocation: 'Petak peta {x}, {z}',
    selectionLandDetail: 'Lahan berumput. Belum ada bangunan pemain di sini.',
    selectionCreekDetail: 'Air sungai, bagian dari pemandangan suaka.',
    selectionPathDetail: 'Pelataran gerbang. Jalur pengunjung masih disiapkan.',
    selectionSceneryDetail: 'Pemandangan suaka. Membangun dan menyunting menyusul.',
    selectionGateDetail: 'Penanda pintu masuk. Jalur pengunjung menyusul.',
    selectionDismiss: 'Tutup pilihan',
    selectionCleared: 'Pilihan ditutup.',
    softwareNotice: 'Lisensi perangkat lunak 3D',
  },
};

type PreferenceReader = Pick<Storage, 'getItem'>;
type PreferenceWriter = Pick<Storage, 'setItem'>;

export function isEntryLocale(value: unknown): value is EntryLocale {
  return value === 'en' || value === 'id';
}

export function readEntryLocale(storage: PreferenceReader | undefined, browserLanguage: string) {
  const fallback: EntryLocale = browserLanguage.toLowerCase().startsWith('id') ? 'id' : 'en';
  if (!storage) return { locale: fallback, source: 'browser' as const, storageAvailable: false };
  try {
    const raw = storage.getItem(ENTRY_PREFERENCES_KEY);
    if (raw) {
      try {
        const value: unknown = JSON.parse(raw);
        if (value && typeof value === 'object' && 'schemaVersion' in value && value.schemaVersion === 1 && 'locale' in value && isEntryLocale(value.locale)) {
          return { locale: value.locale, source: 'saved' as const, storageAvailable: true };
        }
      } catch {
        // Ignore invalid preference data; never erase an existing save or setting.
      }
    }
    return { locale: fallback, source: 'browser' as const, storageAvailable: true };
  } catch {
    return { locale: fallback, source: 'browser' as const, storageAvailable: false };
  }
}

export function saveEntryLocale(storage: PreferenceWriter | undefined, locale: EntryLocale): boolean {
  if (!storage || !isEntryLocale(locale)) return false;
  try {
    storage.setItem(ENTRY_PREFERENCES_KEY, JSON.stringify({ schemaVersion: 1, locale }));
    return true;
  } catch {
    return false;
  }
}
