# Design Specification: Multilingual & Amharic AI Subtitle Generation and Translation

## 1. Executive Summary
This specification defines the architecture, data models, and user interface for enabling comprehensive 100+ language speech recognition (including Amharic `am` - አማርኛ) and automated subtitle translation within NovaTools AI Subtitle Generator & Studio.

---

## 2. Goals & Key Capabilities

1. **100+ Language Speech-to-Text Recognition**:
   - Support Amharic (አማርኛ), Tigrinya (ትግርኛ), Oromo, Somali, Swahili, Arabic, and all major global languages directly within client-side Whisper ASR.
   - Provide a searchable, categorized language selector in the UI.

2. **Automated AI Subtitle Translation**:
   - Provide 1-click batch translation for generated or uploaded subtitle cues into Amharic and 100+ target languages.
   - Maintain exact millisecond start and end timestamps across all cues during translation.
   - Support Amharic Ge'ez script formatting and punctuation.

3. **Multi-Track Management & Multi-Language Exports**:
   - Switch seamlessly between original and translated subtitle tracks in the interactive editor and live video player preview.
   - Export individual `.srt`, `.vtt`, `.txt`, and `.json` files tagged by language code (e.g., `video_am.srt`).
   - Export bundled multilingual `.zip` packages containing all generated subtitle tracks.

---

## 3. Architecture & File Structure

### 3.1. Language Matrix Definition (`src/lib/languages.ts`)
- Centralized registry of supported languages with:
  - `code`: ISO-639-1 / ISO-639-3 code (e.g. `'am'`, `'en'`, `'es'`).
  - `name`: English name (e.g. `'Amharic'`).
  - `nativeName`: Native script name (e.g. `'አማርኛ'`).
  - `region`: Category (`'popular'`, `'african'`, `'european'`, `'asian'`, `'middle-eastern'`, `'americas'`).
  - `whisperSupported`: Boolean indicating speech recognition compatibility.
  - `translateSupported`: Boolean indicating translation compatibility.

### 3.2. Translation Engine (`src/engines/translationEngine.ts`)
- `translateText(text: string, targetLang: string, sourceLang?: string): Promise<string>`:
  - Translates a single string with automatic retry and endpoint fallback.
- `translateSubtitleCues(cues: SubtitleCue[], targetLang: string, sourceLang?: string, onProgress?: (progress: number, current: number, total: number) => void): Promise<SubtitleCue[]>`:
  - Batches cues to prevent API throttling.
  - Reconstructs cues with original `id`, `start`, `end`, and newly translated `text`.
- Error handling and rate-limit mitigation with graceful fallbacks.

### 3.3. Speech-to-Text Enhancements (`src/engines/subtitleEngine.ts`)
- Ensure Whisper pipeline initializes the multilingual model with proper `language` parameter (e.g., `'am'`).
- Handle Ethiopic script tokenization and timestamps alignment.

### 3.4. Subtitle Studio Workspace UI (`src/components/workspaces/SubtitleGeneratorWorkspace.tsx`)
- **Searchable Language Modal/Dropdown**:
  - Filter by English name, native script, or code.
- **Translate Subtitles Toolbar & Modal**:
  - Dedicated "Translate Subtitles" button with language picker and progress bar.
- **Language Track Switcher**:
  - Store tracks: `{ [langCode: string]: SubtitleCue[] }`.
  - Easy tab or dropdown selector to switch active track on the video player and cue list.
- **Export Formats**:
  - Individual language downloads and All-in-One `.zip` containing all tracks.

---

## 4. Data Models

```typescript
export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: 'popular' | 'african' | 'european' | 'asian' | 'middle-eastern' | 'americas';
  whisperSupported: boolean;
  translateSupported: boolean;
}

export interface SubtitleTrack {
  id: string;
  languageCode: string;
  languageName: string;
  cues: SubtitleCue[];
  isOriginal?: boolean;
}
```

---

## 5. Privacy & Offline Guarantees
- Audio decoding and speech recognition run 100% in-browser via WebAssembly / ONNX.
- Translation operates directly from the client browser without intermediary proxy servers storing user data.
- Subtitle file parsing, editing, retiming, and zip packaging happen entirely in memory.
