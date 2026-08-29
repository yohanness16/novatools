import { KokoroTTS } from 'kokoro-js';

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
  } catch (e) {
    return false;
  }
}

async function getOrInitTTS(dtype = 'q8', requestedDevice = 'auto') {
  if (ttsInstance) return ttsInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (ttsInstance) return ttsInstance;
  }

  isInitializing = true;
  try {
    let deviceToUse: string | null = null;

    if (requestedDevice === 'webgpu') {
      const gpuOk = await isWebGPUSupported();
      deviceToUse = gpuOk ? 'webgpu' : null;
    } else if (requestedDevice === 'wasm') {
      deviceToUse = null; // null defaults to wasm in transformers.js
    } else {
      // Auto: check if WebGPU is truly available and functional
      const gpuOk = await isWebGPUSupported();
      deviceToUse = gpuOk ? 'webgpu' : null;
    }

    activeDeviceId = deviceToUse === 'webgpu' ? 'webgpu' : 'wasm';

    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: { 
        progress: 10, 
        loaded: 10, 
        total: 100, 
        message: `Loading Kokoro-82M (${activeDeviceId.toUpperCase()})...` 
      }
    });

    try {
      ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: dtype as any,
        device: deviceToUse as any,
        progress_callback: (p: any) => {
          if (p && typeof p.progress === 'number') {
            const pct = Math.round(p.progress * 100);
            self.postMessage({
              type: 'MODEL_PROGRESS',
              payload: {
                progress: Math.min(95, Math.max(10, pct)),
                loaded: p.loaded || 0,
                total: p.total || 100,
                message: p.file ? `Loading ${p.file} (${pct}%)` : `Downloading neural weights (${pct}%)`
              }
            });
          }
        }
      });
    } catch (primaryErr: any) {
      console.warn('Primary TTS initialization failed, falling back to pure WASM:', primaryErr);
      activeDeviceId = 'wasm';
      self.postMessage({
        type: 'MODEL_PROGRESS',
        payload: { progress: 30, loaded: 30, total: 100, message: 'Initializing universal WASM engine...' }
      });

      ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: 'q8',
        device: null,
      });
    }

    self.postMessage({
      type: 'READY',
      payload: { 
        voices: Object.keys(ttsInstance.voices || {}), 
        device: activeDeviceId 
      }
    });

    return ttsInstance;
  } catch (err: any) {
    console.error('Fatal TTS Worker Init Error:', err);
    self.postMessage({
      type: 'ERROR',
      payload: { id: 'init', error: err?.message || 'Failed to initialize Kokoro TTS engine' }
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
      await getOrInitTTS(payload?.dtype, payload?.device);
    } catch (err) {
      // Handled in getOrInitTTS
    }
  } else if (type === 'GENERATE') {
    const { id, text, voice = 'af_heart', speed = 1.0, dtype = 'q8', device = 'auto' } = payload;
    try {
      const instance = await getOrInitTTS(dtype, device);

      self.postMessage({
        type: 'MODEL_PROGRESS',
        payload: { progress: 95, loaded: 95, total: 100, message: 'Synthesizing 24kHz audio...' }
      });

      // Generate speech
      const audioResult = await instance.generate(text, {
        voice,
        speed: Number(speed) || 1.0,
      });

      // Extract Float32Array PCM samples
      let pcmData: Float32Array;
      if (audioResult && audioResult.audio instanceof Float32Array) {
        pcmData = audioResult.audio;
      } else if (audioResult && audioResult.data instanceof Float32Array) {
        pcmData = audioResult.data;
      } else if (audioResult instanceof Float32Array) {
        pcmData = audioResult;
      } else {
        pcmData = new Float32Array(audioResult?.audio || audioResult?.data || []);
      }

      const sampleRate = audioResult?.sampling_rate || 24000;
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
      console.error('Worker synthesis error:', err);
      self.postMessage({
        type: 'ERROR',
        payload: { id: payload.id, error: err?.message || 'Synthesis failed' }
      });
    }
  }
};
