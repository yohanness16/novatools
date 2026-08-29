import type { 
  VoiceOption, 
  SynthesisOptions, 
  SynthesizedAudioResult, 
  TTSProgress, 
  TTSWorkerOutboundMessage,
  AudioCue
} from './ttsTypes';
import { normalizeHumanScript } from './ttsExpressions';

export const BUILTIN_VOICES: VoiceOption[] = [
  // American English (Female)
  { id: 'af_heart', name: 'Heart (Flagship)', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Warm, highly articulate studio voice (Top Quality)', category: 'natural' },
  { id: 'af_bella', name: 'Bella', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Smooth, bright, expressive storytelling tone', category: 'narrative' },
  { id: 'af_sky', name: 'Sky', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Energetic, youthful, clear and upbeat', category: 'conversational' },
  { id: 'af_nicole', name: 'Nicole', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Calm, crisp corporate & educational tone', category: 'narrative' },
  { id: 'af_sarah', name: 'Sarah', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Friendly, casual everyday cadence', category: 'conversational' },
  { id: 'af_alloy', name: 'Alloy', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Modern, balanced neutral synthetic narrator', category: 'character' },
  { id: 'af_aoede', name: 'Aoede', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Warm melodic voice with expressive inflection', category: 'narrative' },
  { id: 'af_kore', name: 'Kore', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Gentle, intimate, soft audiobook cadence', category: 'narrative' },
  { id: 'af_nova', name: 'Nova', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Direct, clear, assertive presenter tone', category: 'conversational' },
  { id: 'af_river', name: 'River', gender: 'female', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Relaxed, calm, ambient narrative tone', category: 'natural' },

  // American English (Male)
  { id: 'am_adam', name: 'Adam', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Deep, resonant, engaging narrative voice', category: 'natural' },
  { id: 'am_michael', name: 'Michael', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Authoritative broadcast & podcast host style', category: 'narrative' },
  { id: 'am_liam', name: 'Liam', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Friendly, casual, modern conversational tone', category: 'conversational' },
  { id: 'am_eric', name: 'Eric', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Articulate educational & documentary voice', category: 'natural' },
  { id: 'am_echo', name: 'Echo', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Crisp baritone with confident clarity', category: 'narrative' },
  { id: 'am_onyx', name: 'Onyx', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Deep, dramatic low-register voice', category: 'character' },
  { id: 'am_puck', name: 'Puck', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Playful, upbeat, animated character style', category: 'character' },
  { id: 'am_fenrir', name: 'Fenrir', gender: 'male', language: 'en-us', country: 'United States', flag: '🇺🇸', description: 'Strong, commanding cinematic voice', category: 'character' },

  // British English (Female & Male)
  { id: 'bf_emma', name: 'Emma', gender: 'female', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Polished British RP, classic literature style', category: 'narrative' },
  { id: 'bf_isabella', name: 'Isabella', gender: 'female', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Gentle, expressive modern British accent', category: 'conversational' },
  { id: 'bf_alice', name: 'Alice', gender: 'female', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Clear, crisp British narrator', category: 'natural' },
  { id: 'bf_lily', name: 'Lily', gender: 'female', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Youthful, bright British voice', category: 'conversational' },
  { id: 'bm_george', name: 'George', gender: 'male', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Sophisticated, deep British narrative voice', category: 'narrative' },
  { id: 'bm_lewis', name: 'Lewis', gender: 'male', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Warm British storytelling voice', category: 'natural' },
  { id: 'bm_fable', name: 'Fable', gender: 'male', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Rich theatrical British speaker', category: 'character' },
  { id: 'bm_daniel', name: 'Daniel', gender: 'male', language: 'en-gb', country: 'United Kingdom', flag: '🇬🇧', description: 'Natural modern British male tone', category: 'conversational' },
];

export class TTSEngine {
  private worker: Worker | null = null;
  public isReady = false;
  private onProgressCallback?: (p: TTSProgress) => void;

  constructor(onProgress?: (p: TTSProgress) => void) {
    this.onProgressCallback = onProgress;
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('./workers/tts.worker.ts', import.meta.url), { type: 'module' });
    }
    return this.worker;
  }

  public async init(dtype = 'q8', device = 'webgpu'): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isReady) return;

    const worker = this.getWorker();

    return new Promise((resolve, reject) => {
      const handleMsg = (e: MessageEvent<TTSWorkerOutboundMessage>) => {
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
          this.isReady = true;
          worker.removeEventListener('message', handleMsg);
          this.onProgressCallback?.({
            status: 'idle',
            progress: 100,
            message: `Engine Ready (${payload.device.toUpperCase()})`
          });
          resolve();
        } else if (type === 'ERROR' && (payload as any).id === 'init') {
          worker.removeEventListener('message', handleMsg);
          this.onProgressCallback?.({
            status: 'error',
            progress: 0,
            message: (payload as any).error
          });
          reject(new Error((payload as any).error));
        }
      };

      worker.addEventListener('message', handleMsg);
      worker.postMessage({ type: 'INIT', payload: { dtype, device } });
    });
  }

  public async synthesize(options: SynthesisOptions): Promise<SynthesizedAudioResult> {
    const worker = this.getWorker();

    const script = normalizeHumanScript(options.text, options.enhanceExpressions ?? true);
    const requestId = `tts_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      this.onProgressCallback?.({
        status: 'synthesizing',
        progress: 10,
        message: 'Processing script phonetics...'
      });

      const handleMsg = (e: MessageEvent<TTSWorkerOutboundMessage>) => {
        const { type, payload } = e.data;

        if (type === 'MODEL_PROGRESS') {
          this.onProgressCallback?.({
            status: 'synthesizing',
            progress: payload.progress,
            message: payload.message
          });
        } else if (type === 'COMPLETE' && payload.id === requestId) {
          worker.removeEventListener('message', handleMsg);

          const { pcmData, sampleRate, duration, cues } = payload;
          const wavBlob = pcmToWavBlob(pcmData, sampleRate);
          const url = URL.createObjectURL(wavBlob);

          this.onProgressCallback?.({
            status: 'done',
            progress: 100,
            message: 'Audio generated successfully!'
          });

          resolve({
            audioBuffer: null,
            audioBlob: wavBlob,
            duration,
            sampleRate,
            cues,
            url
          });
        } else if (type === 'ERROR' && (payload as any).id === requestId) {
          worker.removeEventListener('message', handleMsg);
          this.onProgressCallback?.({
            status: 'error',
            progress: 0,
            message: (payload as any).error
          });
          reject(new Error((payload as any).error));
        }
      };

      worker.addEventListener('message', handleMsg);
      worker.postMessage({
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
      this.isReady = false;
    }
  }
}

/**
 * Converts Float32Array PCM to 16-bit PCM WAV Blob
 */
export function pcmToWavBlob(pcmData: Float32Array, sampleRate = 24000): Blob {
  if (!pcmData || !(pcmData instanceof Float32Array)) {
    console.error('Invalid pcmData supplied to pcmToWavBlob:', pcmData);
    pcmData = new Float32Array(0);
  }

  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcmData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');

  // fmt sub-chunk
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true);  // AudioFormat (1 = PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // BitsPerSample (16)

  // data sub-chunk
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // 16-bit PCM samples with saturation clipping
  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeAscii(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Format timestamp in SRT standard format (HH:MM:SS,mmm)
 */
export function formatTimeSrt(seconds: number): string {
  const safe = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Export cues to SRT subtitle file
 */
export function cuesToSrt(cues: AudioCue[]): string {
  return cues
    .map((c, i) => `${i + 1}\n${formatTimeSrt(c.start)} --> ${formatTimeSrt(c.end)}\n${c.text.trim()}\n`)
    .join('\n');
}
