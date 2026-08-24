export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: 'popular' | 'african' | 'european' | 'asian' | 'middle-eastern' | 'americas' | 'other';
  whisperSupported: boolean;
  translateSupported: boolean;
  rtl?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // Popular / Global
  { code: 'en', name: 'English', nativeName: 'English', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'middle-eastern', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'popular', whisperSupported: true, translateSupported: true },

  // African Languages
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'so', name: 'Somali', nativeName: 'Soomaaliga', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'mg', name: 'Malagasy', nativeName: 'Fiteny Malagasy', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'lg', name: 'Luganda', nativeName: 'Oluganda', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'tn', name: 'Tswana', nativeName: 'Setswana', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'wo', name: 'Wolof', nativeName: 'Wollof', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ak', name: 'Akan / Twi', nativeName: 'Akan', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ff', name: 'Fulah', nativeName: 'Fulfulde', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ki', name: 'Kikuyu', nativeName: 'Gĩkũyũ', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ny', name: 'Chichewa', nativeName: 'ChiCheŵa', region: 'african', whisperSupported: true, translateSupported: true },

  // European Languages
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'br', name: 'Breton', nativeName: 'Brezhoneg', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'oc', name: 'Occitan', nativeName: 'Occitan', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'fo', name: 'Faroese', nativeName: 'Føroyskt', region: 'european', whisperSupported: true, translateSupported: true },

  // Asian Languages
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'asian', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'tl', name: 'Tagalog / Filipino', nativeName: 'Tagalog', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာစာ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'lo', name: 'Lao', nativeName: 'ພາສາລາວ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол хэл', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐድ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ug', name: 'Uyghur', nativeName: 'ئۇيغۇرچە', region: 'asian', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'asian', whisperSupported: true, translateSupported: true },

  // Middle Eastern Languages
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'middle-eastern', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'middle-eastern', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', region: 'middle-eastern', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'prs', name: 'Dari', nativeName: 'دری', region: 'middle-eastern', whisperSupported: true, translateSupported: true, rtl: true },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan dili', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', region: 'middle-eastern', whisperSupported: true, translateSupported: true, rtl: true },

  // Americas & Indigenous Languages
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl ayisyen', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañe\'ẽ', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'nah', name: 'Nahuatl', nativeName: 'Nāhuatl', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'nv', name: 'Navajo', nativeName: 'Diné bizaad', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'iu', name: 'Inuktitut', nativeName: 'ᐃᓄᒃᑎᑐᑦ', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', region: 'americas', whisperSupported: true, translateSupported: true },

  // Other / Classical
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', region: 'other', whisperSupported: true, translateSupported: true },
  { code: 'la', name: 'Latin', nativeName: 'Latina', region: 'other', whisperSupported: true, translateSupported: true },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', region: 'other', whisperSupported: true, translateSupported: true },
];

export const POPULAR_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.region === 'popular' || ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'it', 'ru', 'hi', 'ar'].includes(l.code)
);

export const AFRICAN_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.region === 'african'
);

export const EUROPEAN_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.region === 'european' || (l.region === 'popular' && ['en', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'nl', 'tr', 'pl'].includes(l.code))
);

export const ASIAN_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.region === 'asian' || (l.region === 'popular' && ['zh', 'ja', 'ko', 'hi', 'vi', 'id'].includes(l.code))
);

export const MIDDLE_EASTERN_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.region === 'middle-eastern' || (l.region === 'popular' && ['ar', 'tr'].includes(l.code))
);

export const AMERICAS_LANGUAGES: LanguageOption[] = SUPPORTED_LANGUAGES.filter(
  (l) => l.region === 'americas'
);

/**
 * Get language option by code (case-insensitive, trimmed)
 */
export function getLanguageByCode(code: string): LanguageOption | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === normalized);
}

/**
 * Search languages by English name, native script, or code
 */
export function searchLanguages(query: string): LanguageOption[] {
  if (!query || query.trim() === '') {
    return [...SUPPORTED_LANGUAGES];
  }

  const normalized = query.trim().toLowerCase();

  return SUPPORTED_LANGUAGES.filter((lang) => {
    return (
      lang.code.toLowerCase().includes(normalized) ||
      lang.name.toLowerCase().includes(normalized) ||
      lang.nativeName.toLowerCase().includes(normalized)
    );
  }).sort((a, b) => {
    // Exact code match
    const aCodeMatch = a.code.toLowerCase() === normalized;
    const bCodeMatch = b.code.toLowerCase() === normalized;
    if (aCodeMatch && !bCodeMatch) return -1;
    if (!aCodeMatch && bCodeMatch) return 1;

    // Exact name or nativeName match
    const aExactName = a.name.toLowerCase() === normalized || a.nativeName.toLowerCase() === normalized;
    const bExactName = b.name.toLowerCase() === normalized || b.nativeName.toLowerCase() === normalized;
    if (aExactName && !bExactName) return -1;
    if (!aExactName && bExactName) return 1;

    // Starts with match
    const aStartsWith = a.name.toLowerCase().startsWith(normalized) || a.nativeName.toLowerCase().startsWith(normalized);
    const bStartsWith = b.name.toLowerCase().startsWith(normalized) || b.nativeName.toLowerCase().startsWith(normalized);
    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    return 0;
  });
}
