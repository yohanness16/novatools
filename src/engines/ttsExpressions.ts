export interface HumanExpression {
  trigger: string;
  replacement: string;
  category: 'reaction' | 'filler' | 'sound_effect' | 'emotion';
  label: string;
  description: string;
  tag: string;
  icon: string;
}

export const HUMAN_EXPRESSIONS: HumanExpression[] = [
  { trigger: 'ugh', replacement: ' ugh, ', category: 'reaction', label: 'Ugh', description: 'Frustration / Annoyance', tag: '[ugh]', icon: '😤' },
  { trigger: 'sigh', replacement: ' ... haah ... ', category: 'emotion', label: 'Sigh', description: 'Deep breath release (Relief/Weariness)', tag: '[sigh]', icon: '😮‍💨' },
  { trigger: 'cough', replacement: ' ... ahem, ... ', category: 'sound_effect', label: 'Cough / Throat Clear', description: 'Clearing throat breath break', tag: '[cough]', icon: '🗣️' },
  { trigger: 'ay', replacement: ' ay! ', category: 'reaction', label: 'Ay!', description: 'Startled or upbeat interjection', tag: '[ay]', icon: '⚡' },
  { trigger: 'hmm', replacement: ' hmmm ... ', category: 'filler', label: 'Hmm', description: 'Reflective thoughtful pause', tag: '[hmm]', icon: '🤔' },
  { trigger: 'um', replacement: ' uhm, ', category: 'filler', label: 'Um', description: 'Natural conversation hesitation', tag: '[um]', icon: '💬' },
  { trigger: 'ah', replacement: ' aah! ', category: 'reaction', label: 'Ah!', description: 'Realization or delight', tag: '[ah]', icon: '✨' },
  { trigger: 'whoa', replacement: ' whoaa! ', category: 'reaction', label: 'Whoa', description: 'Surprise or amazement', tag: '[whoa]', icon: '😲' },
  { trigger: 'haha', replacement: ' haha! ', category: 'emotion', label: 'Laugh', description: 'Playful chuckling expression', tag: '[haha]', icon: '😄' },
  { trigger: 'phew', replacement: ' phew ... ', category: 'emotion', label: 'Phew', description: 'Relief after tension', tag: '[phew]', icon: '😌' },
  { trigger: 'gasp', replacement: ' ... ha! ', category: 'emotion', label: 'Gasp', description: 'Sharp intake of breath', tag: '[gasp]', icon: '🫢' },
  { trigger: 'shh', replacement: ' shhh ... ', category: 'sound_effect', label: 'Shh', description: 'Whisper / Quiet down', tag: '[shh]', icon: '🤫' },
];

export const PAUSE_PRESETS = [
  { label: 'Micro (200ms)', tag: '[pause: 200ms]', replacement: ', ' },
  { label: 'Breath (500ms)', tag: '[pause: 500ms]', replacement: ' ... ' },
  { label: 'Dramatic (1s)', tag: '[pause: 1000ms]', replacement: ' ..... ' },
];

/**
 * Pre-processes natural script input into clean, natural phonetics
 * and breathing pauses that Kokoro & eSpeak render smoothly.
 */
export function normalizeHumanScript(text: string, enableExpressions = true): string {
  if (!text) return '';
  let processed = text;

  // 1. Remove dangerous unpronounceable characters (asterisks, brackets, backticks)
  processed = processed.replace(/[*_~`]/g, '');

  if (enableExpressions) {
    // 2. Process bracket tags: [pause: 500ms], [ugh], [cough], [sigh], etc.
    processed = processed.replace(/\[pause:\s*(\d+)ms\]/gi, (_, ms) => {
      const numMs = parseInt(ms, 10);
      if (numMs >= 800) return ' ..... ';
      if (numMs >= 400) return ' ... ';
      return ', ';
    });

    processed = processed.replace(/\[sigh\]/gi, ' ... haah ... ');
    processed = processed.replace(/\[cough\]/gi, ' ... ahem, ... ');
    processed = processed.replace(/\[ugh\]/gi, ' ugh, ');
    processed = processed.replace(/\[hmm\]/gi, ' hmmm ... ');
    processed = processed.replace(/\[ay\]/gi, ' ay! ');
    processed = processed.replace(/\[um\]/gi, ' uhm, ');
    processed = processed.replace(/\[ah\]/gi, ' aah! ');
    processed = processed.replace(/\[whoa\]/gi, ' whoaa! ');
    processed = processed.replace(/\[haha\]/gi, ' haha! ');
    processed = processed.replace(/\[phew\]/gi, ' phew ... ');
    processed = processed.replace(/\[gasp\]/gi, ' ... ha! ');
    processed = processed.replace(/\[shh\]/gi, ' shhh ... ');

    // 3. Normalize standalone human interjections surrounded by word boundaries
    processed = processed.replace(/\b(ugh+)\b/gi, 'ugh,');
    processed = processed.replace(/\b(sigh+)\b/gi, '... haah ...');
    processed = processed.replace(/\b(hmmm+)\b/gi, 'hmmm ...');
    processed = processed.replace(/\b(ummm?)\b/gi, 'uhm,');
    processed = processed.replace(/\b(cough)\b/gi, '... ahem, ...');
    processed = processed.replace(/\b(phew+)\b/gi, 'phew ...');
    processed = processed.replace(/\b(whoa+)\b/gi, 'whoaa!');
    processed = processed.replace(/\b(yay+)\b/gi, 'yaaay!');
    processed = processed.replace(/\b(eww+)\b/gi, 'eeew!');
    processed = processed.replace(/\b(ay+)\b/gi, 'ay!');
    processed = processed.replace(/\b(gasp)\b/gi, '... ha!');
    processed = processed.replace(/\b(haha+)\b/gi, 'haha!');
  }

  // 4. Smooth punctuation and whitespace into natural breath pauses
  processed = processed.replace(/—/g, ' , ');
  processed = processed.replace(/\s+/g, ' ');
  return processed.trim();
}
