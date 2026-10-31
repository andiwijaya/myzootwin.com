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
  noScript: 'Enable JavaScript to open the guide and language settings. Play is not available in this preview.',
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
    noScript: 'Aktifkan JavaScript untuk membuka panduan dan pengaturan bahasa. Permainan belum tersedia dalam pratinjau ini.',
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
