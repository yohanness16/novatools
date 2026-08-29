import { KokoroTTS } from 'kokoro-js';

let ttsInstance: any = null;
let activeDeviceId = 'webgpu';

async function getOrInitTTS(dtype = 'q8', device = 'webgpu') {
  if (ttsInstance) return ttsInstance;

  try {
    const hasGpu = typeof navigator !== 'undefined' && 'gpu' in navigator;
    activeDeviceId = (device === 'webgpu' && hasGpu) ? 'webgpu' : 'wasm';

    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: { 
        progress: 10, 
        loaded: 10, 
        total: 100, 
        message: `Initializing Kokoro-82M (${activeDeviceId.toUpperCase()})...` 
      }
    });

    ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: dtype as any,
      device: activeDeviceId as any,
      progress_callback: (p: any) => {
        if (p && typeof p.progress === 'number') {
          self.postMessage({
            type: 'MODEL_PROGRESS',
            payload: {
              progress: Math.round(p.progress * 100),
              loaded: p.loaded || 0,
              total: p.total || 100,
              message: p.file ? `Loading ${p.file}...` : 'Downloading Kokoro neural weights...'
            }
          });
        }
      }
    });

    const voices = ttsInstance.list_voices ? ttsInstance.list_voices() : [];
    self.postMessage({
      type: 'READY',
      payload: { voices, device: activeDeviceId }
    });

    return ttsInstance;
  } catch (err: any) {
    self.postMessage({
      type: 'ERROR',
      payload: { id: 'init', error: err?.message || 'Failed to initialize Kokoro TTS' }
    });
    throw err;
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
    const { id, text, voice = 'af_heart', speed = 1.0, dtype = 'q8', device = 'webgpu' } = payload;
    try {
      const instance = await getOrInitTTS(dtype, device);
      
      const audioResult = await instance.generate(text, {
        voice,
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
        payload: { id, error: err?.message || 'Synthesis failed' }
      });
    }
  }
};
