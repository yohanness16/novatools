# Kokoro-82M AI Voice Studio & TTS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% client-side, privacy-first AI Voice Studio and Text-to-Speech tool powered by Kokoro-82M with human-like vocal expression handling, voice blending, real-time waveform visualization, and multi-format audio export.

**Architecture:** Offloads all Kokoro-82M ONNX model inference and phonemization to a dedicated Web Worker (`tts.worker.ts`) using WebGPU with WASM fallback. Employs an expression normalization engine (`ttsExpressions.ts`) to translate human vocal sounds ("ugh", "cough", "ay", "sigh", "hmm", "um") into natural phonetic and pause cadences. The UI provides paragraph-level generation, interactive waveform scrubbing, dual-voice interpolation, and WAV/MP3/SRT export.

**Tech Stack:** Astro 5, React 19, Tailwind CSS, `kokoro-js`, ONNX Runtime Web, Web Audio API, Canvas API, Lucide icons.

---

### Task 1: Install `kokoro-js` & Define Type System

**Files:**
- Modify: `package.json`
- Create: `src/engines/ttsTypes.ts`

- [ ] **Step 1: Install `kokoro-js`**

Run in terminal:
```bash
npm i kokoro-js
```

- [ ] **Step 2: Create `src/engines/ttsTypes.ts`**

Define complete types for voices, voice categories, synthesis requests, worker messages, expression presets, and export formats:

```typescript
export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  language: string; // 'en-us', 'en-gb', 'ja', 'zh', 'es', 'fr', 'hi', 'it', 'pt'
  country: string;
  flag: string;
  description: string;
  category: 'natural' | 'narrative' | 'conversational' | 'character';
  samplePreview?: string;
}

export interface VoiceMixConfig {
  primaryVoice: string;
  secondaryVoice: string;
  blendRatio: number; // 0.0 (100% primary) to 1.0 (100% secondary)
}

export interface SynthesisOptions {
  text: string;
  voice: string;
  voiceMix?: VoiceMixConfig;
  speed: number; // 0.5 to 2.0
  device?: 'webgpu' | 'wasm';
  dtype?: 'q8' | 'q4' | 'fp16' | 'fp32';
  enhanceExpressions?: boolean;
}

export interface AudioCue {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface SynthesizedAudioResult {
  audioBuffer: AudioBuffer | null;
  audioBlob: Blob;
  duration: number;
  sampleRate: number;
  cues: AudioCue[];
  url: string;
}

export interface TTSProgress {
  status: 'idle' | 'loading_model' | 'phonemizing' | 'synthesizing' | 'done' | 'error';
  progress: number; // 0 to 100
  message: string;
  loadedBytes?: number;
  totalBytes?: number;
}

export type TTSWorkerInboundMessage =
  | { type: 'INIT'; payload?: { dtype?: string; device?: string } }
  | { type: 'GENERATE'; payload: SynthesisOptions & { id: string } }
  | { type: 'CANCEL'; payload: { id: string } };

export type TTSWorkerOutboundMessage =
  | { type: 'MODEL_PROGRESS'; payload: { progress: number; loaded: number; total: number; message: string } }
  | { type: 'READY'; payload: { voices: string[]; device: string } }
  | { type: 'CHUNK_GENERATED'; payload: { id: string; pcmData: Float32Array; sampleRate: number; text: string; cues: AudioCue[] } }
  | { type: 'COMPLETE'; payload: { id: string; pcmData: Float32Array; sampleRate: number; duration: number; cues: AudioCue[] } }
  | { type: 'ERROR'; payload: { id: string; error: string } };
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json src/engines/ttsTypes.ts
git commit -m "feat(tts): add kokoro-js dependency and ttsTypes system"
```

---

### Task 2: Human Expression & Interjection Engine

**Files:**
- Create: `src/engines/ttsExpressions.ts`
- Create: `test/ttsExpressions.test.ts` (or validation runner)

- [ ] **Step 1: Create `src/engines/ttsExpressions.ts`**

Implement text normalization that translates human vocal sounds and fillers into natural phonetic representations with breath/pause phrasing:

```typescript
export interface HumanExpression {
  trigger: string;
  replacement: string;
  category: 'reaction' | 'filler' | 'sound_effect' | 'emotion';
  label: string;
  description: string;
}

export const HUMAN_EXPRESSIONS: HumanExpression[] = [
  { trigger: 'ugh', replacement: 'uughh...', category: 'reaction', label: 'Ugh (Frustration)', description: 'Expressed disappointment or exasperation' },
  { trigger: 'cough', replacement: '*ahem*...', category: 'sound_effect', label: 'Cough / Clearing Throat', description: 'Simulated throat clearing pause' },
  { trigger: 'ay', replacement: 'aay!', category: 'reaction', label: 'Ay (Exclamation)', description: 'Playful or startled exclamation' },
  { trigger: 'sigh', replacement: '...haah...', category: 'emotion', label: 'Sigh (Relief / Weariness)', description: 'Audible breath release' },
  { trigger: 'hmm', replacement: 'hmmm...', category: 'filler', label: 'Hmm (Thinking)', description: 'Reflective contemplation' },
  { trigger: 'um', replacement: 'uhm,', category: 'filler', label: 'Um (Hesitation)', description: 'Natural conversation hesitation' },
  { trigger: 'ah', replacement: 'aah!', category: 'reaction', label: 'Ah (Realization)', description: 'Epiphany or understanding' },
  { trigger: 'whoa', replacement: 'whoaa!', category: 'reaction', label: 'Whoa (Surprise)', description: 'Astonishment or awe' },
  { trigger: 'ha ha', replacement: 'haha!', category: 'emotion', label: 'Laugh / Giggle', description: 'Chuckling expression' },
  { trigger: 'phew', replacement: 'ffyoo...', category: 'emotion', label: 'Phew (Relief)', description: 'Sense of escaped danger/burden' },
];

/**
 * Pre-processes natural script input to inject human-like pauses,
 * interjection phonetics, and realistic conversational cadence.
 */
export function normalizeHumanScript(text: string, enableExpressions = true): string {
  if (!text) return '';
  let processed = text;

  if (enableExpressions) {
    // Replace expression tags like [sigh], [ugh], [cough], [pause: 300ms]
    processed = processed.replace(/\[pause:\s*(\d+)ms\]/gi, ' ... ');
    processed = processed.replace(/\[sigh\]/gi, ' ...haah... ');
    processed = processed.replace(/\[cough\]/gi, ' *ahem*... ');
    processed = processed.replace(/\[ugh\]/gi, ' uughh... ');
    processed = processed.replace(/\[hmm\]/gi, ' hmmm... ');
    processed = processed.replace(/\[ay\]/gi, ' aay! ');

    // Normalize standalone interjections surrounded by word boundaries
    processed = processed.replace(/\b(ugh+)\b/gi, 'uughh...');
    processed = processed.replace(/\b(sigh+)\b/gi, '...haah...');
    processed = processed.replace(/\b(hmmm+)\b/gi, 'hmmm...');
    processed = processed.replace(/\b(ummm?)\b/gi, 'uhm,');
    processed = processed.replace(/\b(cough)\b/gi, '*ahem*...');
  }

  // Smooth multiple punctuation and dashes into natural breath pauses
  processed = processed.replace(/\s+/g, ' ');
  processed = processed.replace(/—/g, ' — ');
  return processed.trim();
}
```

- [ ] **Step 2: Create unit test in `test/ttsExpressions.test.ts`**

```typescript
import { normalizeHumanScript, HUMAN_EXPRESSIONS } from '../src/engines/ttsExpressions';

const input = "I tried to finish the task [sigh], but ugh it failed! [pause: 500ms] Ay what can we do?";
const output = normalizeHumanScript(input, true);
console.log('Normalized output:', output);

if (!output.includes('...haah...') || !output.includes('uughh...')) {
  throw new Error('Expression normalization failed');
}
console.log('Expression normalization tests PASSED');
```

- [ ] **Step 3: Run expression test via node**

Run: `node --loader ts-node/esm test/ttsExpressions.test.ts` (or run with tsx/node)
Expected: `Expression normalization tests PASSED`.

- [ ] **Step 4: Commit**
```bash
git add src/engines/ttsExpressions.ts test/ttsExpressions.test.ts
git commit -m "feat(tts): implement human expressions and interjections normalizer"
```

---

### Task 3: Implement Web Worker & Engine Audio Manager

**Files:**
- Create: `src/engines/workers/tts.worker.ts`
- Create: `src/engines/ttsEngine.ts`

- [ ] **Step 1: Create `src/engines/workers/tts.worker.ts`**

Worker script managing KokoroTTS ONNX initialization, WebGPU detection, phonemization, and chunked synthesis:

```typescript
import { KokoroTTS } from 'kokoro-js';

let ttsInstance: KokoroTTS | null = null;
let currentDeviceId = 'webgpu';

async function initTTS(dtype = 'q8', device = 'webgpu') {
  try {
    const hasGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    const targetDevice = (device === 'webgpu' && hasGpu) ? 'webgpu' : 'wasm';
    currentDeviceId = targetDevice;

    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: { progress: 10, loaded: 10, total: 100, message: `Loading Kokoro-82M (${targetDevice.toUpperCase()})...` }
    });

    ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: dtype as any,
      device: targetDevice as any,
      progress_callback: (p: any) => {
        if (p && p.progress) {
          self.postMessage({
            type: 'MODEL_PROGRESS',
            payload: {
              progress: Math.round(p.progress * 100),
              loaded: p.loaded || 0,
              total: p.total || 100,
              message: p.file ? `Downloading ${p.file}...` : 'Downloading model weights...'
            }
          });
        }
      }
    });

    const voices = ttsInstance.list_voices ? ttsInstance.list_voices() : [];
    self.postMessage({
      type: 'READY',
      payload: { voices, device: currentDeviceId }
    });
  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      payload: { id: 'init', error: err?.message || 'Failed to load Kokoro TTS engine' }
    });
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    await initTTS(payload?.dtype, payload?.device);
  } else if (type === 'GENERATE') {
    if (!ttsInstance) {
      await initTTS(payload?.dtype, payload?.device);
    }
    if (!ttsInstance) {
      self.postMessage({ type: 'ERROR', payload: { id: payload.id, error: 'TTS Instance not ready' } });
      return;
    }

    try {
      const { id, text, voice, speed = 1.0 } = payload;
      const audioResult = await ttsInstance.generate(text, {
        voice: voice || 'af_heart',
        speed: Number(speed) || 1.0,
      });

      const pcmData = audioResult.audio.data as Float32Array;
      const sampleRate = audioResult.sampling_rate || 24000;
      const duration = pcmData.length / sampleRate;

      self.postMessage({
        type: 'COMPLETE',
        payload: {
          id,
          pcmData,
          sampleRate,
          duration,
          cues: [{ text, start: 0, end: duration }]
        }
      });
    } catch (err: any) {
      self.postMessage({
        type: 'ERROR',
        payload: { id: payload.id, error: err?.message || 'Synthesis failed' }
      });
    }
  }
};
```

- [ ] **Step 2: Create `src/engines/ttsEngine.ts`**

Bridge handling worker lifecycle, audio context decoding, WAV/MP3 conversion, and SRT subtitle export:

```typescript
import type { 
  VoiceOption, 
  SynthesisOptions, 
  SynthesizedAudioResult, 
  TTSProgress, 
  TTSWorkerOutboundMessage 
} from './ttsTypes';
import { normalizeHumanScript } from './ttsExpressions';

export const BUILTIN_VOICES: VoiceOption[] = [
  // American English (Female)
  { id: 'af_heart', name: 'Heart (Default)', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Warm, highly natural, articulate flagship voice', category: 'natural' },
  { id: 'af_bella', name: 'Bella', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Smooth, bright, expressive storytelling tone', category: 'narrative' },
  { id: 'af_sky', name: 'Sky', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Energetic, youthful, clear and upbeat', category: 'conversational' },
  { id: 'af_nicole', name: 'Nicole', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Professional, calm, corporate narration style', category: 'narrative' },
  { id: 'af_sarah', name: 'Sarah', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Casual, friendly everyday cadence', category: 'conversational' },

  // American English (Male)
  { id: 'am_adam', name: 'Adam', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Deep, confident, engaging narrative voice', category: 'natural' },
  { id: 'am_michael', name: 'Michael', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Authoritative, clear broadcast & podcast style', category: 'narrative' },
  { id: 'am_liam', name: 'Liam', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Friendly, casual, modern conversational tone', category: 'conversational' },
  { id: 'am_eric', name: 'Eric', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Crisp, articulate educational voice', category: 'natural' },

  // British English
  { id: 'bf_emma', name: 'Emma', gender: 'female', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Polished British RP, classic audiobook style', category: 'narrative' },
  { id: 'bf_isabella', name: 'Isabella', gender: 'female', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Gentle, expressive British accent', category: 'conversational' },
  { id: 'bm_george', name: 'George', gender: 'male', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Sophisticated, deep British narrative voice', category: 'narrative' },
  { id: 'bm_lewis', name: 'Lewis', gender: 'male', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Warm British storytelling voice', category: 'natural' },

  // International
  { id: 'jf_alpha', name: 'Alpha (Japanese)', gender: 'female', language: 'ja', country: 'Japan', flag: '🇯🇵', description: 'Natural Japanese female voice', category: 'natural' },
  { id: 'ff_siwis', name: 'Siwis (French)', gender: 'female', language: 'fr', country: 'France', flag: '🇫🇷', description: 'Expressive French female voice', category: 'natural' },
  { id: 'ef_dora', name: 'Dora (Spanish)', gender: 'female', language: 'es', country: 'Spain', flag: '🇪🇸', description: 'Clear Spanish female narrator', category: 'natural' },
  { id: 'if_sara', name: 'Sara (Italian)', gender: 'female', language: 'it', country: 'Italy', flag: '🇮🇹', description: 'Vibrant Italian female narrator', category: 'natural' },
  { id: 'hf_alpha', name: 'Alpha (Hindi)', gender: 'female', language: 'hi', country: 'India', flag: '🇮🇳', description: 'Clear Hindi female narrator', category: 'natural' },
];

export class TTSEngine {
  private worker: Worker | null = null;
  private audioCtx: AudioContext | null = null;
  private onProgressCallback?: (p: TTSProgress) => void;

  constructor(onProgress?: (p: TTSProgress) => void) {
    this.onProgressCallback = onProgress;
  }

  public async init(dtype = 'q8', device = 'webgpu'): Promise<void> {
    if (typeof window === 'undefined') return;

    if (!this.worker) {
      this.worker = new Worker(new URL('./workers/tts.worker.ts', import.meta.url), { type: 'module' });
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker initialization failed'));

      this.worker.onmessage = (e: MessageEvent<TTSWorkerOutboundMessage>) => {
        const { type, payload } = e.data;
        if (type === 'MODEL_PROGRESS') {
          this.onProgressCallback?.({
            status: 'loading_model',
            progress: payload.progress,
            message: payload.message,
            loadedBytes: payload.loaded,
            totalBytes: payload.total
          });
        } else if (type === 'READY') {
          this.onProgressCallback?.({
            status: 'idle',
            progress: 100,
            message: `Engine ready (${payload.device.toUpperCase()})`
          });
          resolve();
        } else if (type === 'ERROR' && (payload as any).id === 'init') {
          reject(new Error((payload as any).error));
        }
      };

      this.worker.postMessage({ type: 'INIT', payload: { dtype, device } });
    });
  }

  public async synthesize(options: SynthesisOptions): Promise<SynthesizedAudioResult> {
    if (!this.worker) {
      await this.init(options.dtype || 'q8', options.device || 'webgpu');
    }

    const script = normalizeHumanScript(options.text, options.enhanceExpressions ?? true);
    const requestId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error('Worker not available'));

      this.onProgressCallback?.({
        status: 'synthesizing',
        progress: 30,
        message: 'Synthesizing speech with Kokoro-82M...'
      });

      const handleMsg = (e: MessageEvent<TTSWorkerOutboundMessage>) => {
        const { type, payload } = e.data;

        if (type === 'COMPLETE' && payload.id === requestId) {
          this.worker?.removeEventListener('message', handleMsg);

          const { pcmData, sampleRate, duration, cues } = payload;
          const wavBlob = pcmToWavBlob(pcmData, sampleRate);
          const url = URL.createObjectURL(wavBlob);

          this.onProgressCallback?.({
            status: 'done',
            progress: 100,
            message: 'Audio generated successfully'
          });

          resolve({
            audioBuffer: null, // hydrated on demand in AudioContext
            audioBlob: wavBlob,
            duration,
            sampleRate,
            cues,
            url
          });
        } else if (type === 'ERROR' && (payload as any).id === requestId) {
          this.worker?.removeEventListener('message', handleMsg);
          this.onProgressCallback?.({
            status: 'error',
            progress: 0,
            message: (payload as any).error
          });
          reject(new Error((payload as any).error));
        }
      };

      this.worker.addEventListener('message', handleMsg);
      this.worker.postMessage({
        type: 'GENERATE',
        payload: {
          ...options,
          text: script,
          id: requestId
        }
      });
    });
  }

  public terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * Converts Float32Array PCM to standard 16-bit PCM WAV Blob
 */
export function pcmToWavBlob(pcmData: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF chunk
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write 16-bit PCM samples with clipping
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
```

- [ ] **Step 3: Verify TypeScript builds**

Run: `npx tsc --noEmit`
Expected: 0 type errors.

- [ ] **Step 4: Commit**
```bash
git add src/engines/workers/tts.worker.ts src/engines/ttsEngine.ts
git commit -m "feat(tts): implement KokoroTTS Web Worker and audio manager"
```

---

### Task 4: Build Studio UI Subcomponents (Voice Selector, Blender, Script Editor, Audio Player)

**Files:**
- Create: `src/components/workspaces/tts/VoiceSelector.tsx`
- Create: `src/components/workspaces/tts/VoiceBlender.tsx`
- Create: `src/components/workspaces/tts/ScriptEditor.tsx`
- Create: `src/components/workspaces/tts/AudioPlayerCard.tsx`

- [ ] **Step 1: Create `src/components/workspaces/tts/VoiceSelector.tsx`**

Provides voice cards with filtering by gender, nationality, and style, plus quick audio preview and voice stats.

- [ ] **Step 2: Create `src/components/workspaces/tts/VoiceBlender.tsx`**

Allows selecting primary + secondary voices and sliding the blend ratio (0% to 100%) for custom human timbres.

- [ ] **Step 3: Create `src/components/workspaces/tts/ScriptEditor.tsx`**

Script editor with word/char counters, paragraph splitter, and clickable expression insert buttons (`[ugh]`, `[sigh]`, `[cough]`, `[ay]`, `[pause: 300ms]`).

- [ ] **Step 4: Create `src/components/workspaces/tts/AudioPlayerCard.tsx`**

Canvas-based animated waveform visualizer, play/pause controls, seek bar, playback speed changer, and WAV / MP3 / Subtitle download buttons.

- [ ] **Step 5: Commit**
```bash
git add src/components/workspaces/tts/
git commit -m "feat(tts): add UI subcomponents for Voice Studio"
```

---

### Task 5: Build `TextToSpeechWorkspace.tsx` & Astro Route

**Files:**
- Create: `src/components/workspaces/TextToSpeechWorkspace.tsx`
- Create: `src/pages/video/text-to-speech.astro`

- [ ] **Step 1: Create `src/components/workspaces/TextToSpeechWorkspace.tsx`**

Assemble complete interactive studio with model download banner, voice selector modal, script editor, expression tags, and waveform audio card.

- [ ] **Step 2: Create `src/pages/video/text-to-speech.astro`**

Configure SEO metadata, breadcrumbs, ToolPageLayout wrapper, and client:load React component mounting.

- [ ] **Step 3: Commit**
```bash
git add src/components/workspaces/TextToSpeechWorkspace.tsx src/pages/video/text-to-speech.astro
git commit -m "feat(tts): create TextToSpeechWorkspace and Astro page route"
```

---

### Task 6: Update Navigation, Header & Command Palette

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/CommandPalette.tsx`
- Modify: `src/pages/video/index.astro` (add AI Voice Studio card)

- [ ] **Step 1: Add TTS to Command Palette and Video Hub**

Include "AI Voice Studio (Kokoro TTS)", "Text to Speech", "Voiceover Generator" with direct routing to `/video/text-to-speech`.

- [ ] **Step 2: Commit**
```bash
git add src/components/Header.tsx src/components/CommandPalette.tsx src/pages/video/index.astro
git commit -m "feat(tts): register AI Voice Studio in navigation and command palette"
```

---

### Task 7: Production Build Verification & Testing

**Files:**
- Run full Astro & TypeScript builds

- [ ] **Step 1: Run TypeScript type check**
Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run Astro build**
Run: `npm run build`
Expected: 48+ pages successfully built into `dist/`.

- [ ] **Step 3: Commit**
```bash
git add -A
git commit -m "chore(tts): verify build and finalize Kokoro TTS studio integration"
```
