/**
 * TTS Text Normalization & Smart Sentence Chunking for Kokoro Neural TTS.
 * Eliminates artificial phonetic words and ensures natural human cadence.
 */

export interface SampleScript {
  id: string;
  title: string;
  category: 'narrative' | 'commercial' | 'podcast' | 'dialogue' | 'meditation';
  content: string;
}

export const SAMPLE_SCRIPTS: SampleScript[] = [
  {
    id: 'audiobook',
    title: '📖 Audiobook Narration',
    category: 'narrative',
    content: "The library was silent, save for the rhythmic ticking of an antique grandfather clock against the mahogany wall. Clara turned the brittle parchment with trembling fingers, her eyes tracing coordinates long forgotten by time. 'We found it,' she whispered into the quiet room. 'After all these years, the passage is finally open.'",
  },
  {
    id: 'podcast',
    title: '🎙️ Tech Podcast Host',
    category: 'podcast',
    content: "Welcome back to another episode of Future Horizons! Today, we're discussing one of the most exciting breakthroughs in modern computing: running generative AI and neural voice synthesis entirely inside your browser. No server roundtrips, no privacy compromises, just pure local intelligence. Let's get straight into it.",
  },
  {
    id: 'commercial',
    title: '✨ Commercial Voiceover',
    category: 'commercial',
    content: "Imagine a workspace where your tools simply get out of your way. Fast, intuitive, and designed with meticulous attention to detail. Meet NovaTools — the all-in-one suite crafted for creators who refuse to compromise on quality. Start creating today.",
  },
  {
    id: 'cinematic',
    title: '🎬 Dramatic Storytelling',
    category: 'narrative',
    content: "The storm had passed, leaving behind a skyline drenched in neon and mist. From the rooftop above Sector Seven, the city stretched into infinity. He knew this was their only chance. If the signal dropped now, there would be no going back.",
  },
  {
    id: 'meditation',
    title: '🌿 Mindfulness & Meditation',
    category: 'meditation',
    content: "Find a comfortable posture and gently close your eyes. Take a deep, slow breath in through your nose... hold it for a brief moment... and slowly release through your mouth. Let go of any tension in your shoulders, and allow your mind to settle into stillness.",
  }
];

/**
 * Normalizes input script for high-fidelity neural phonemization:
 * - Strips bracketed tags [sigh], [cough], [gasp] so they aren't read aloud as literal words.
 * - Converts [pause: Xms] or pause tags into natural punctuation pauses (..., ,, —).
 * - Cleans markdown artifacts, unpronounceable symbols, and formatting noise.
 * - Replaces non-standard quotes, apostrophes, and dashes with clean equivalents.
 */
export function normalizeHumanScript(text: string): string {
  if (!text) return '';
  let processed = text;

  // 1. Convert bracket pause tags to natural punctuation pauses
  processed = processed.replace(/\[pause:\s*(\d+)\s*(?:ms|s)?\]/gi, (_, val) => {
    const num = parseInt(val, 10);
    if (num >= 800 || val.endsWith('s')) return ' ..... ';
    if (num >= 400) return ' ... ';
    return ', ';
  });

  // 2. Remove bracketed directives, sound effect tags, and emotion tags
  // so the vocoder NEVER pronounces words like "ahem", "cough", "sigh", "applause", etc.
  processed = processed.replace(/\[(cough|sigh|throat|gasp|whisper|shh|laughter|laugh|applause|music|silence|breath|clears throat|snicker|groan|yawn|giggle|cry|sob|snort|pause|interjection)[^\]]*\]/gi, ' ... ');
  processed = processed.replace(/\[[\w\s:-]+\]/g, ' '); // Strip any remaining bracket tags

  // 3. Remove markdown formatting characters (asterisks, underscores, hashes, backticks, tildes)
  processed = processed.replace(/[*_~`#><]/g, '');

  // 4. Normalize unicode quotes, apostrophes, dashes, and ellipsis
  processed = processed.replace(/[“”]/g, '"');
  processed = processed.replace(/[‘’`]/g, "'");
  processed = processed.replace(/[\u2014\u2013]/g, ' — '); // Em-dash and En-dash
  processed = processed.replace(/\.{4,}/g, ' ... ');

  // 5. Clean up stray symbols that cause phoneme artifacts (pipes, slashes, brackets)
  processed = processed.replace(/[{}\[\]\\\/|^~]/g, ' ');

  // 6. Normalize multiple spaces and cleanup whitespace
  processed = processed.replace(/[ \t]+/g, ' ');
  processed = processed.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return processed.trim();
}

/**
 * Splits text into natural sentence / clause chunks for seamless long-form generation.
 * Kokoro ONNX model has a max sequence limit per pass (~512 phonemes / ~20-25 seconds).
 * By chunking at natural sentence and paragraph boundaries, we can synthesize text of
 * ANY length (paragraphs, articles, full stories) without truncation!
 */
export function splitTextIntoChunks(text: string, maxChunkLength = 220): string[] {
  if (!text || !text.trim()) return [];

  const clean = normalizeHumanScript(text);
  if (clean.length <= maxChunkLength && !clean.includes('\n\n')) {
    return [clean];
  }

  const chunks: string[] = [];
  const paragraphs = clean.split(/\n\s*\n/);

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (trimmedPara.length <= maxChunkLength) {
      chunks.push(trimmedPara);
      continue;
    }

    // Split paragraph into sentences by punctuation boundaries: . ! ? ; followed by whitespace or quotes
    const sentenceRegex = /[^.!?;\n]+[.!?;\n]+["'”’]?|[^.!?;\n]+$/g;
    const sentences = trimmedPara.match(sentenceRegex) || [trimmedPara];

    let currentChunk = '';

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      if ((currentChunk + ' ' + sentence).trim().length <= maxChunkLength) {
        currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = '';
        }

        // If a single sentence exceeds maxChunkLength, split by clauses (commas, dashes, colons)
        if (sentence.length > maxChunkLength) {
          const clauseRegex = /[^,:\-—]+[,:\-—]+|[^,:\-—]+$/g;
          const clauses = sentence.match(clauseRegex) || [sentence];
          let subChunk = '';

          for (const rawClause of clauses) {
            const clause = rawClause.trim();
            if (!clause) continue;

            if ((subChunk + ' ' + clause).trim().length <= maxChunkLength) {
              subChunk = subChunk ? `${subChunk} ${clause}` : clause;
            } else {
              if (subChunk) chunks.push(subChunk);

              // If single clause exceeds maxChunkLength, split by words
              if (clause.length > maxChunkLength) {
                const words = clause.split(/\s+/);
                let wordChunk = '';
                for (const word of words) {
                  if ((wordChunk + ' ' + word).trim().length <= maxChunkLength) {
                    wordChunk = wordChunk ? `${wordChunk} ${word}` : word;
                  } else {
                    if (wordChunk) chunks.push(wordChunk);
                    wordChunk = word;
                  }
                }
                if (wordChunk) subChunk = wordChunk;
              } else {
                subChunk = clause;
              }
            }
          }
          if (subChunk) chunks.push(subChunk);
        } else {
          currentChunk = sentence;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }
  }

  return chunks.filter(c => c.trim().length > 0);
}
