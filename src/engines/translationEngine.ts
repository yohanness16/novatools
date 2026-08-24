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
   * Translates single text to target language using client-side endpoints with fallback
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
          const translatedParts = data[0].map((item: any) => item?.[0]).filter(Boolean);
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
            text: translatedText || cue.text,
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

      // Brief 40ms pause between batches
      if (i + BATCH_SIZE < total) {
        await new Promise((resolve) => setTimeout(resolve, 40));
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
