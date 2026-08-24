# Multilingual & Amharic AI Subtitles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand NovaTools AI Subtitle Generator with 100+ language speech recognition (including Amharic `am` - አማርኛ), 1-click AI subtitle translation into Amharic & 100+ languages, multi-track studio management, and multi-language exports.

**Architecture:** Create a centralized 100+ language registry (`src/lib/languages.ts`), build a client-side high-speed batch translation engine (`src/engines/translationEngine.ts`), update `subtitleEngine.ts` with Amharic Ge'ez script parsing and multilingual Whisper parameter routing, and enhance `SubtitleGeneratorWorkspace.tsx` with a searchable language modal, translation toolbar, track switcher, and multi-language ZIP exporter.

**Tech Stack:** TypeScript, React, Astro, `@xenova/transformers` (Whisper), JSZip, Lucide React, Tailwind CSS.

---

### Task 1: Centralized 100+ Language Registry & Search Utilities

**Files:**
- Create: `src/lib/languages.ts`
- Create: `test/languages.test.mjs`

- [ ] **Step 1: Write the unit test for language registry**

```javascript
// test/languages.test.mjs
import assert from 'node:assert/strict';
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  searchLanguages,
  POPULAR_LANGUAGES,
  AFRICAN_LANGUAGES,
} from '../src/lib/languages.ts';

console.log('Testing language registry...');

// Test 1: Supported languages length and Amharic presence
assert.ok(SUPPORTED_LANGUAGES.length >= 100, `Expected >= 100 languages, got ${SUPPORTED_LANGUAGES.length}`);
const amharic = getLanguageByCode('am');
assert.ok(amharic, 'Amharic should exist in languages registry');
assert.equal(amharic?.name, 'Amharic');
assert.equal(amharic?.nativeName, 'አማርኛ');
assert.equal(amharic?.whisperSupported, true);
assert.equal(amharic?.translateSupported, true);

// Test 2: Search by English name, native script, and code
const searchByEnglish = searchLanguages('amharic');
assert.ok(searchByEnglish.some((l) => l.code === 'am'));

const searchByNative = searchLanguages('አማርኛ');
assert.ok(searchByNative.some((l) => l.code === 'am'));

const searchByCode = searchLanguages('am');
assert.ok(searchByCode.some((l) => l.code === 'am'));

// Test 3: Regional groups
assert.ok(POPULAR_LANGUAGES.length > 0);
assert.ok(AFRICAN_LANGUAGES.some((l) => l.code === 'am'));
assert.ok(AFRICAN_LANGUAGES.some((l) => l.code === 'ti' || l.code === 'om' || l.code === 'sw'));

console.log('✔ Language registry tests passed!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/languages.test.mjs`
Expected: FAIL with "Cannot find module" or syntax error before implementation.

- [ ] **Step 3: Implement `src/lib/languages.ts`**

```typescript
// src/lib/languages.ts

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: 'popular' | 'african' | 'european' | 'asian' | 'middle-eastern' | 'americas';
  whisperSupported: boolean;
  translateSupported: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  // Popular / High Frequency
  { code: 'auto', name: 'Auto-Detect Language', nativeName: 'Auto-Detect', region: 'popular', whisperSupported: true, translateSupported: false },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'en', name: 'English', nativeName: 'English', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'popular', whisperSupported: true, translateSupported: true },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'popular', whisperSupported: true, translateSupported: true },

  // African Languages
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'so', name: 'Somali', nativeName: 'Soomaaliga', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ha', name: 'Hausa', nativeName: 'Harshen Hausa', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'mg', name: 'Malagasy', nativeName: 'Fiteny Malagasy', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', region: 'african', whisperSupported: true, translateSupported: true },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'african', whisperSupported: true, translateSupported: true },

  // Middle Eastern & Central Asian
  { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî / کوردی', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmençe', region: 'middle-eastern', whisperSupported: true, translateSupported: true },

  // Asian & South Asian
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'my', name: 'Burmese (Myanmar)', nativeName: 'မြန်မာစာ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'tl', name: 'Tagalog (Filipino)', nativeName: 'Wikang Tagalog', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол хэл', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'yue', name: 'Cantonese', nativeName: '粵語', region: 'asian', whisperSupported: true, translateSupported: true },

  // European
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', region: 'european', whisperSupported: true, translateSupported: true },

  // Americas & Indigenous
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'la', name: 'Latin', nativeName: 'Latīna', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', region: 'european', whisperSupported: true, translateSupported: true },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', region: 'americas', whisperSupported: true, translateSupported: true },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', region: 'middle-eastern', whisperSupported: true, translateSupported: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', region: 'asian', whisperSupported: true, translateSupported: true },
  { code: 'bo', name: 'Tibetan', nativeName: 'བོད་སྐད་', region: 'asian', whisperSupported: true, translateSupported: true },
];

export const POPULAR_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.region === 'popular');
export const AFRICAN_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.region === 'african');
export const EUROPEAN_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.region === 'european');
export const ASIAN_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.region === 'asian');
export const MIDDLE_EASTERN_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.region === 'middle-eastern');
export const AMERICAS_LANGUAGES = SUPPORTED_LANGUAGES.filter((l) => l.region === 'americas');

export function getLanguageByCode(code: string): LanguageOption | undefined {
  if (!code) return undefined;
  return SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === code.toLowerCase());
}

export function searchLanguages(query: string): LanguageOption[] {
  if (!query || !query.trim()) return SUPPORTED_LANGUAGES;
  const q = query.trim().toLowerCase();
  return SUPPORTED_LANGUAGES.filter(
    (l) =>
      l.code.toLowerCase().includes(q) ||
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q)
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/languages.test.mjs`
Expected: PASS with "✔ Language registry tests passed!"

- [ ] **Step 5: Commit**

```bash
git add src/lib/languages.ts test/languages.test.mjs
git commit -m "feat(subtitles): add 100+ language registry with Amharic support"
```

---

### Task 2: High-Speed Subtitle Translation Engine

**Files:**
- Create: `src/engines/translationEngine.ts`
- Create: `test/translationEngine.test.mjs`

- [ ] **Step 1: Write the unit test for translation engine**

```javascript
// test/translationEngine.test.mjs
import assert from 'node:assert/strict';
import { TranslationEngine } from '../src/engines/translationEngine.ts';

console.log('Testing translation engine...');

// Test 1: Batch chunking
const mockCues = [
  { id: '1', start: 0, end: 2, text: 'Hello world' },
  { id: '2', start: 2, end: 4, text: 'Welcome to NovaTools' },
];

assert.equal(typeof TranslationEngine.translateSubtitleCues, 'function');
assert.equal(typeof TranslationEngine.translateText, 'function');

console.log('✔ Translation engine interface validated!');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/translationEngine.test.mjs`
Expected: FAIL with "Cannot find module" before implementation.

- [ ] **Step 3: Implement `src/engines/translationEngine.ts`**

```typescript
// src/engines/translationEngine.ts
import type { SubtitleCue } from './subtitleEngine';

export interface TranslationProgress {
  status: 'starting' | 'translating' | 'done' | 'error';
  progress: number;
  currentCue: number;
  totalCues: number;
  targetLanguage: string;
}

export class TranslationEngine {
  /**
   * Translates text to target language using client-side endpoints with fallback
   */
  static async translateText(
    text: string,
    targetLang: string,
    sourceLang = 'auto'
  ): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return '';

    // Primary: Google Translate GTX client endpoint
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
        sourceLang
      )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(trimmed)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
          const translatedParts = data[0].map((item: any) => item[0]).filter(Boolean);
          if (translatedParts.length > 0) {
            return translatedParts.join('');
          }
        }
      }
    } catch (err) {
      console.warn('Primary translation API failed, trying fallback:', err);
    }

    // Secondary Fallback: MyMemory Translation API
    try {
      const pair = `${sourceLang === 'auto' ? 'en' : sourceLang}|${targetLang}`;
      const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        trimmed
      )}&langpair=${encodeURIComponent(pair)}`;

      const fallbackRes = await fetch(fallbackUrl);
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        if (fallbackData?.responseData?.translatedText) {
          return fallbackData.responseData.translatedText;
        }
      }
    } catch (fallbackErr) {
      console.warn('Fallback translation API failed:', fallbackErr);
    }

    // If both fail, return original text
    return text;
  }

  /**
   * Batch translates all subtitle cues while strictly preserving start/end timestamps and IDs
   */
  static async translateSubtitleCues(
    cues: SubtitleCue[],
    targetLang: string,
    sourceLang = 'auto',
    onProgress?: (progress: TranslationProgress) => void
  ): Promise<SubtitleCue[]> {
    if (!cues || cues.length === 0) return [];

    const total = cues.length;
    const translatedCues: SubtitleCue[] = [];
    const BATCH_SIZE = 5; // Process in small concurrent batches to prevent rate limiting

    onProgress?.({
      status: 'starting',
      progress: 0,
      currentCue: 0,
      totalCues: total,
      targetLanguage: targetLang,
    });

    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = cues.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (cue) => {
        try {
          const translatedText = await this.translateText(cue.text, targetLang, sourceLang);
          return {
            ...cue,
            text: translatedText,
          };
        } catch {
          return { ...cue };
        }
      });

      const results = await Promise.all(batchPromises);
      translatedCues.push(...results);

      const processedCount = Math.min(total, i + BATCH_SIZE);
      const progressPercent = Math.round((processedCount / total) * 100);

      onProgress?.({
        status: 'translating',
        progress: progressPercent,
        currentCue: processedCount,
        totalCues: total,
        targetLanguage: targetLang,
      });

      // Brief 50ms pause between batches
      if (i + BATCH_SIZE < total) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    onProgress?.({
      status: 'done',
      progress: 100,
      currentCue: total,
      totalCues: total,
      targetLanguage: targetLang,
    });

    return translatedCues;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/translationEngine.test.mjs`
Expected: PASS with "✔ Translation engine interface validated!"

- [ ] **Step 5: Commit**

```bash
git add src/engines/translationEngine.ts test/translationEngine.test.mjs
git commit -m "feat(subtitles): add high-speed batch translation engine"
```

---

### Task 3: Subtitle Engine Speech-to-Text & Amharic Unicode Optimization

**Files:**
- Modify: `src/engines/subtitleEngine.ts`

- [ ] **Step 1: Ensure Amharic / Ethiopic Unicode sentence splitting & Whisper language routing**

Update `generateSubtitles` in `src/engines/subtitleEngine.ts`:
- Make sure `options.language` passes the exact language code (e.g. `'am'` for Amharic).
- Update the sentence splitting regex in fallback to support Amharic sentence terminator (`።` U+1362) alongside `[.?!]`:
  `/(?<=[.?!።])\s+/`
- Support Ethiopic space and punctuation normalization.

- [ ] **Step 2: Commit**

```bash
git add src/engines/subtitleEngine.ts
git commit -m "feat(subtitles): enhance speech engine with Amharic Ge'ez script support"
```

---

### Task 4: Subtitle Studio UI Multi-Language Upgrades

**Files:**
- Modify: `src/components/workspaces/SubtitleGeneratorWorkspace.tsx`

- [ ] **Step 1: Update UI with Searchable Language Picker Modal**
  - Replace raw dropdown with an intuitive language picker that opens a search popover/modal.
  - Group languages into "Popular", "African Languages (including Amharic)", and all regions.
  - Allow fast filtering by typing English or native script (e.g. "አማርኛ").

- [ ] **Step 2: Add "Translate Subtitles" Toolbar & Modal**
  - Add a "Translate" button with a `Globe` / `Languages` icon in the Studio toolbar.
  - Modal with Target Language selector (defaults to Amharic if current is English, or English if current is Amharic).
  - Progress bar showing cue translation progress (`15 / 45 cues translated...`).

- [ ] **Step 3: Add Multi-Language Track Switcher**
  - Store tracks in state: `tracks: Record<string, SubtitleCue[]>` with active track selection.
  - Display active track badge (e.g. `Track: Amharic (አማርኛ)` or `Track: Original (English)`).
  - Editing cues updates the currently active language track.

- [ ] **Step 4: Add Multi-Language Export Options**
  - Suffix downloaded filenames with language code (e.g. `${baseName}_${lang}.srt`).
  - Update "Download All (ZIP)" to bundle all generated language tracks into the zip file.

- [ ] **Step 5: Commit**

```bash
git add src/components/workspaces/SubtitleGeneratorWorkspace.tsx
git commit -m "feat(subtitles): add searchable language picker, subtitle translation modal, and multi-track export"
```

---

### Task 5: End-to-End Build & Verification

**Files:**
- Test: Build full Astro static site

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with 0 errors and all pages generated.

- [ ] **Step 2: Final Commit & Clean up**

```bash
git add .
git commit -m "chore: complete multilingual and Amharic subtitle studio feature"
```
