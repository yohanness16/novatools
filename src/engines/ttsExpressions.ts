export interface HumanExpression {
  trigger: string;
  replacement: string;
  category: 'reaction' | 'filler' | 'sound_effect' | 'emotion';
  label: string;
  description: string;
  tag: string;
}

export const HUMAN_EXPRESSIONS: HumanExpression[] = [
  { trigger: 'ugh', replacement: 'uughh...', category: 'reaction', label: 'Ugh', description: 'Expressed disappointment, exasperation or disgust', tag: '[ugh]' },
  { trigger: 'cough', replacement: '*ahem*...', category: 'sound_effect', label: 'Cough / Throat Clear', description: 'Simulated throat clearing breath pause', tag: '[cough]' },
  { trigger: 'ay', replacement: 'aay!', category: 'reaction', label: 'Ay!', description: 'Startled, upbeat or energetic exclamation', tag: '[ay]' },
  { trigger: 'sigh', replacement: '...haah...', category: 'emotion', label: 'Sigh', description: 'Deep audible breath release (relief/weariness)', tag: '[sigh]' },
  { trigger: 'hmm', replacement: 'hmmm...', category: 'filler', label: 'Hmm...', description: 'Reflective thoughtful pause', tag: '[hmm]' },
  { trigger: 'um', replacement: 'uhm,', category: 'filler', label: 'Um / Uh', description: 'Natural conversational hesitation', tag: '[um]' },
  { trigger: 'ah', replacement: 'aah!', category: 'reaction', label: 'Ah!', description: 'Realization, pleasure or epiphany', tag: '[ah]' },
  { trigger: 'whoa', replacement: 'whoaa!', category: 'reaction', label: 'Whoa!', description: 'Surprise or amazement', tag: '[whoa]' },
  { trigger: 'ha ha', replacement: 'haha!', category: 'emotion', label: 'Laughter', description: 'Playful chuckling expression', tag: '[haha]' },
  { trigger: 'phew', replacement: 'ffyoo...', category: 'emotion', label: 'Phew', description: 'Sense of relief after tension', tag: '[phew]' },
  { trigger: 'gasp', replacement: '...ha!', category: 'emotion', label: 'Gasp', description: 'Sudden sharp intake of breath', tag: '[gasp]' },
  { trigger: 'shh', replacement: 'shhh...', category: 'sound_effect', label: 'Shh', description: 'Gentle silencing whisper', tag: '[shh]' },
];

export const PAUSE_PRESETS = [
  { label: 'Short Pause (200ms)', tag: '[pause: 200ms]', replacement: ', ' },
  { label: 'Medium Pause (500ms)', tag: '[pause: 500ms]', replacement: ' ... ' },
  { label: 'Long Dramatic Pause (1s)', tag: '[pause: 1000ms]', replacement: ' ..... ' },
];

/**
 * Pre-processes natural script input to inject human-like pauses,
 * interjection phonetics, and realistic conversational cadence.
 */
export function normalizeHumanScript(text: string, enableExpressions = true): string {
  if (!text) return '';
  let processed = text;

  if (enableExpressions) {
    // 1. Process explicit bracket tags: [pause: 500ms], [ugh], [cough], [sigh], etc.
    processed = processed.replace(/\[pause:\s*(\d+)ms\]/gi, (_, ms) => {
      const numMs = parseInt(ms, 10);
      if (numMs >= 800) return ' ..... ';
      if (numMs >= 400) return ' ... ';
      return ', ';
    });

    processed = processed.replace(/\[sigh\]/gi, ' ...haah... ');
    processed = processed.replace(/\[cough\]/gi, ' *ahem*... ');
    processed = processed.replace(/\[ugh\]/gi, ' uughh... ');
    processed = processed.replace(/\[hmm\]/gi, ' hmmm... ');
    processed = processed.replace(/\[ay\]/gi, ' aay! ');
    processed = processed.replace(/\[um\]/gi, ' uhm, ');
    processed = processed.replace(/\[ah\]/gi, ' aah! ');
    processed = processed.replace(/\[whoa\]/gi, ' whoaa! ');
    processed = processed.replace(/\[haha\]/gi, ' haha! ');
    processed = processed.replace(/\[phew\]/gi, ' ffyoo... ');
    processed = processed.replace(/\[gasp\]/gi, ' ...ha! ');
    processed = processed.replace(/\[shh\]/gi, ' shhh... ');

    // 2. Normalize standalone human interjections surrounded by word boundaries
    processed = processed.replace(/\b(ugh+)\b/gi, 'uughh...');
    processed = processed.replace(/\b(sigh+)\b/gi, '...haah...');
    processed = processed.replace(/\b(hmmm+)\b/gi, 'hmmm...');
    processed = processed.replace(/\b(ummm?)\b/gi, 'uhm,');
    processed = processed.replace(/\b(cough)\b/gi, '*ahem*...');
    processed = processed.replace(/\b(phew+)\b/gi, 'ffyoo...');
    processed = processed.replace(/\b(whoa+)\b/gi, 'whoaa!');
    processed = processed.replace(/\b(yay+)\b/gi, 'yaaay!');
    processed = processed.replace(/\b(eww+)\b/gi, 'eeeww!');
    processed = processed.replace(/\b(ay+)\b/gi, 'aay!');
    processed = processed.replace(/\b(gasp)\b/gi, '...ha!');
    processed = processed.replace(/\b(haha+)\b/gi, 'haha!');
  }

  // 3. Smooth multiple punctuation and dashes into natural breath pauses
  processed = processed.replace(/—/g, ' — ');
  processed = processed.replace(/\s+/g, ' ');
  return processed.trim();
}
