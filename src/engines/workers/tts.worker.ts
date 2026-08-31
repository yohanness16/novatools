import { KokoroTTS } from 'kokoro-js';
import { splitTextIntoChunks, normalizeHumanScript } from '../ttsExpressions';
import type { AudioCue } from '../ttsTypes';

let ttsInstance: any = null;
let activeDeviceId = 'wasm';
let isInitializing = false;

async function isWebGPUSupported(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
    return false;
  }
  try {
    const adapter = await (navigator.gpu as any).requestAdapter();
    return !!adapter;
  } catch {
    return false;
  }
}

function formatEta(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds) || !isFinite(seconds)) return 'a moment';
  const sec = Math.ceil(seconds);
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  return `${mins}m ${remSec}s`;
}

async function getOrInitTTS(dtype = 'q8', requestedDevice = 'auto') {
  if (ttsInstance) return ttsInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (ttsInstance) return ttsInstance;
  }

  isInitializing = true;
  try {
    let deviceToUse: string | null = null;
    let selectedDtype = dtype;

    if (requestedDevice === 'webgpu' || requestedDevice === 'auto') {
      const gpuOk = await isWebGPUSupported();
      if (gpuOk) {
        deviceToUse = 'webgpu';
        selectedDtype = 'fp32'; // WebGPU performs best and most stable with fp32 in transformers.js
      }
    }

    activeDeviceId = deviceToUse === 'webgpu' ? 'webgpu' : 'wasm';

    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: {
        progress: 15,
        loaded: 15,
        total: 100,
        message: `Loading Kokoro-82M (${activeDeviceId.toUpperCase()})...`,
      },
    });

    let simulatedProgress = 20;
    const progressInterval = setInterval(() => {
      if (simulatedProgress < 85) {
        simulatedProgress += 8;
        self.postMessage({
          type: 'MODEL_PROGRESS',
          payload: {
            progress: simulatedProgress,
            loaded: simulatedProgress,
            total: 100,
            message: `Loading neural weights (${simulatedProgress}%)...`,
          },
        });
      }
    }, 800);

    try {
      try {
        ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
          dtype: selectedDtype as any,
          device: deviceToUse as any,
          progress_callback: (p: any) => {
            if (!p) return;
            let pct = 0;
            if (typeof p.progress === 'number' && !isNaN(p.progress)) {
              pct = Math.round(p.progress * 100);
            } else if (p.status === 'done') {
              pct = 90;
            }

            if (pct > 0) {
              simulatedProgress = Math.max(simulatedProgress, pct);
            }

            self.postMessage({
              type: 'MODEL_PROGRESS',
              payload: {
                progress: Math.min(92, Math.max(15, simulatedProgress)),
                loaded: p.loaded || simulatedProgress,
                total: p.total || 100,
                message: `Loading neural vocoder (${Math.min(92, simulatedProgress)}%)`,
              },
            });
          },
        });
      } catch (gpuInitErr) {
        // If WebGPU failed to initialize, fallback to WASM CPU
        if (deviceToUse === 'webgpu') {
          console.warn('WebGPU initialization failed, falling back to WASM:', gpuInitErr);
          activeDeviceId = 'wasm';
          ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
            dtype: 'q8',
            device: null,
          });
        } else {
          throw gpuInitErr;
        }
      }
    } finally {
      clearInterval(progressInterval);
    }

    // Micro-warmup for instant first-utterance response
    try {
      await ttsInstance.generate('Hi', { voice: 'af_heart' });
    } catch {
      // Non-fatal micro-warmup
    }

    self.postMessage({
      type: 'READY',
      payload: {
        voices: Object.keys(ttsInstance.voices || {}),
        device: activeDeviceId,
      },
    });

    return ttsInstance;
  } catch (err: any) {
    console.error('Fatal TTS Worker Init Error:', err);
    self.postMessage({
      type: 'ERROR',
      payload: { id: 'init', error: err?.message || 'Failed to initialize Kokoro TTS engine' },
    });
    throw err;
  } finally {
    isInitializing = false;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    try {
      await getOrInitTTS(payload?.dtype || 'q8', payload?.device || 'auto');
    } catch {
      // Handled in getOrInitTTS
    }
  } else if (type === 'GENERATE') {
    const { id, text, voice = 'af_heart', speed = 1.0, dtype = 'q8', device = 'auto' } = payload;
    try {
      const instance = await getOrInitTTS(dtype, device);

      // 1. Normalize text and split into natural sentence chunks
      const cleanText = normalizeHumanScript(text);
      const chunks = splitTextIntoChunks(cleanText, 220);

      if (chunks.length === 0) {
        throw new Error('Script text is empty after normalization.');
      }

      const totalChunks = chunks.length;
      const totalChars = chunks.reduce((acc, c) => acc + c.length, 0);

      const pcmChunks: Float32Array[] = [];
      const cues: AudioCue[] = [];
      let sampleRate = 24000;
      let cumulativeTime = 0;
      let charsProcessed = 0;
      const startTime = performance.now();

      // Estimated rate based on backend device (characters per second)
      // WebGPU: ~90 chars/sec, WASM: ~22 chars/sec
      const defaultRate = activeDeviceId === 'webgpu' ? 90 : 22;

      for (let i = 0; i < totalChunks; i++) {
        const chunk = chunks[i];
        const chunkIndex = i + 1;

        // Dynamic ETA calculation
        const elapsedMs = performance.now() - startTime;
        let estimatedRemainingMs = 0;

        if (charsProcessed > 0 && elapsedMs > 200) {
          const currentRate = charsProcessed / (elapsedMs / 1000); // chars / sec
          const charsLeft = Math.max(0, totalChars - charsProcessed);
          estimatedRemainingMs = (charsLeft / Math.max(5, currentRate)) * 1000;
        } else {
          const charsLeft = totalChars - charsProcessed;
          estimatedRemainingMs = (charsLeft / defaultRate) * 1000;
        }

        const pct = Math.round(((i) / totalChunks) * 85) + 10;
        const etaFormatted = formatEta(estimatedRemainingMs / 1000);

        self.postMessage({
          type: 'CHUNK_PROGRESS',
          payload: {
            id,
            chunkIndex,
            totalChunks,
            progress: Math.min(95, pct),
            message: totalChunks > 1 
              ? `Synthesizing part ${chunkIndex} of ${totalChunks} (ETA: ${etaFormatted})`
              : `Synthesizing speech (ETA: ${etaFormatted})...`,
            elapsedMs,
            estimatedRemainingMs,
            etaFormatted,
          },
        });

        // Run neural synthesis on this chunk
        const audioResult = await instance.generate(chunk, {
          voice,
          speed: Number(speed) || 1.0,
        });

        // Extract Float32Array PCM samples
        let chunkPcm: Float32Array;
        if (audioResult && audioResult.audio instanceof Float32Array) {
          chunkPcm = audioResult.audio;
        } else if (audioResult && audioResult.data instanceof Float32Array) {
          chunkPcm = audioResult.data;
        } else if (audioResult instanceof Float32Array) {
          chunkPcm = audioResult;
        } else {
          chunkPcm = new Float32Array(audioResult?.audio || audioResult?.data || []);
        }

        sampleRate = audioResult?.sampling_rate || 24000;
        const chunkDuration = chunkPcm.length / sampleRate;

        // Record timestamp cue for this sentence
        cues.push({
          text: chunk,
          start: Math.round(cumulativeTime * 1000) / 1000,
          end: Math.round((cumulativeTime + chunkDuration) * 1000) / 1000,
        });

        pcmChunks.push(chunkPcm);
        cumulativeTime += chunkDuration;
        charsProcessed += chunk.length;

        // Insert subtle 70ms natural acoustic breath pause between sentence chunks (if not last)
        if (i < totalChunks - 1) {
          const pauseLength = Math.floor(sampleRate * 0.07);
          const pausePcm = new Float32Array(pauseLength);
          pcmChunks.push(pausePcm);
          cumulativeTime += 0.07;
        }
      }

      // Merge all PCM chunks into one single continuous Float32Array buffer
      const totalLength = pcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedPcm = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of pcmChunks) {
        combinedPcm.set(chunk, offset);
        offset += chunk.length;
      }

      const finalDuration = combinedPcm.length / sampleRate;

      self.postMessage({
        type: 'COMPLETE',
        payload: {
          id,
          pcmData: combinedPcm,
          sampleRate,
          duration: finalDuration,
          cues,
        },
      });
    } catch (err: any) {
      console.error('Worker synthesis error:', err);
      self.postMessage({
        type: 'ERROR',
        payload: { id: payload.id, error: err?.message || 'Synthesis failed' },
      });
    }
  }
};
