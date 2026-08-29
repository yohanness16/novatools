import { KokoroTTS } from 'kokoro-js';

let ttsInstance: any = null;
let activeDeviceId = 'wasm'; // Default safe, WebGPU if supported
let isInitializing = false;

async function getOrInitTTS(dtype = 'q8', requestedDevice = 'webgpu') {
  if (ttsInstance) return ttsInstance;
  if (isInitializing) {
    // Wait for in-flight initialization
    while (isInitializing) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (ttsInstance) return ttsInstance;
  }

  isInitializing = true;
  try {
    const hasGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    activeDeviceId = (requestedDevice === 'webgpu' && hasGpu) ? 'webgpu' : 'wasm';

    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: { 
        progress: 5, 
        loaded: 5, 
        total: 100, 
        message: `Loading Kokoro-82M weights (${activeDeviceId.toUpperCase()})...` 
      }
    });

    try {
      ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: dtype as any,
        device: activeDeviceId as any,
        progress_callback: (p: any) => {
          if (p && typeof p.progress === 'number') {
            const pct = Math.round(p.progress * 100);
            self.postMessage({
              type: 'MODEL_PROGRESS',
              payload: {
                progress: Math.min(95, Math.max(5, pct)),
                loaded: p.loaded || 0,
                total: p.total || 100,
                message: p.file ? `Loading ${p.file} (${pct}%)` : `Downloading neural weights (${pct}%)`
              }
            });
          }
        }
      });
    } catch (gpuErr) {
      if (activeDeviceId === 'webgpu') {
        console.warn('WebGPU failed in worker, falling back to WASM:', gpuErr);
        activeDeviceId = 'wasm';
        self.postMessage({
          type: 'MODEL_PROGRESS',
          payload: { progress: 50, loaded: 50, total: 100, message: 'WebGPU fallback -> Initializing WASM runtime...' }
        });
        ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
          dtype: dtype as any,
          device: 'wasm' as any,
        });
      } else {
        throw gpuErr;
      }
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
      // Error handled inside getOrInitTTS
    }
  } else if (type === 'GENERATE') {
    const { id, text, voice = 'af_heart', speed = 1.0, dtype = 'q8', device = 'webgpu' } = payload;
    try {
      const instance = await getOrInitTTS(dtype, device);

      self.postMessage({
        type: 'MODEL_PROGRESS',
        payload: { progress: 95, loaded: 95, total: 100, message: 'Synthesizing audio samples...' }
      });

      // Generate speech
      const audioResult = await instance.generate(text, {
        voice,
        speed: Number(speed) || 1.0,
      });

      // Extract Float32Array PCM
      let pcmData: Float32Array;
      if (audioResult.audio instanceof Float32Array) {
        pcmData = audioResult.audio;
      } else if (audioResult.data instanceof Float32Array) {
        pcmData = audioResult.data;
      } else if (audioResult instanceof Float32Array) {
        pcmData = audioResult;
      } else {
        pcmData = new Float32Array(audioResult.audio || audioResult.data || []);
      }

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
      console.error('Worker synthesis error:', err);
      self.postMessage({
        type: 'ERROR',
        payload: { id: payload.id, error: err?.message || 'Synthesis failed' }
      });
    }
  }
};
