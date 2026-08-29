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

async function getOrInitTTS(dtype = 'q8', requestedDevice = 'wasm') {
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
    } else {
      // Default to null (WASM) for 100% universal browser stability
      deviceToUse = null;
    }

    activeDeviceId = deviceToUse === 'webgpu' ? 'webgpu' : 'wasm';

    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: { 
        progress: 10, 
        loaded: 10, 
        total: 100, 
        message: `Connecting to Kokoro-82M repository (${activeDeviceId.toUpperCase()})...` 
      }
    });

    let simulatedProgress = 15;
    const progressInterval = setInterval(() => {
      if (simulatedProgress < 85) {
        simulatedProgress += 5;
        self.postMessage({
          type: 'MODEL_PROGRESS',
          payload: {
            progress: simulatedProgress,
            loaded: simulatedProgress,
            total: 100,
            message: `Downloading neural weights (~86MB, cached in browser) - ${simulatedProgress}%`
          }
        });
      }
    }, 1200);

    try {
      ttsInstance = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
        dtype: dtype as any,
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

          let fileMsg = 'Downloading Kokoro-82M weights';
          if (p.file) {
            fileMsg = `Loading ${p.file.split('/').pop()}`;
          }

          self.postMessage({
            type: 'MODEL_PROGRESS',
            payload: {
              progress: Math.min(92, Math.max(10, simulatedProgress)),
              loaded: p.loaded || simulatedProgress,
              total: p.total || 100,
              message: `${fileMsg} (${Math.min(92, simulatedProgress)}%)`
            }
          });
        }
      });
    } finally {
      clearInterval(progressInterval);
    }

    // Warm-up phonemizer and default voice
    self.postMessage({
      type: 'MODEL_PROGRESS',
      payload: { progress: 95, loaded: 95, total: 100, message: 'Warming up phonemizer & neural graph...' }
    });

    try {
      await ttsInstance.generate('Hello', { voice: 'af_heart' });
    } catch (warmupErr) {
      console.warn('Micro-warmup noticed:', warmupErr);
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
      await getOrInitTTS(payload?.dtype, payload?.device || 'wasm');
    } catch (err) {
      // Handled in getOrInitTTS
    }
  } else if (type === 'GENERATE') {
    const { id, text, voice = 'af_heart', speed = 1.0, dtype = 'q8', device = 'wasm' } = payload;
    try {
      const instance = await getOrInitTTS(dtype, device);

      self.postMessage({
        type: 'MODEL_PROGRESS',
        payload: { progress: 20, loaded: 20, total: 100, message: 'Phonemizing conversational script...' }
      });

      // Periodic progress ticker during neural inference
      let synthProgress = 30;
      const synthTicker = setInterval(() => {
        if (synthProgress < 90) {
          synthProgress += 10;
          self.postMessage({
            type: 'MODEL_PROGRESS',
            payload: {
              progress: synthProgress,
              loaded: synthProgress,
              total: 100,
              message: `Synthesizing neural speech audio (${synthProgress}%)...`
            }
          });
        }
      }, 800);

      let audioResult: any;
      try {
        audioResult = await instance.generate(text, {
          voice,
          speed: Number(speed) || 1.0,
        });
      } finally {
        clearInterval(synthTicker);
      }

      self.postMessage({
        type: 'MODEL_PROGRESS',
        payload: { progress: 95, loaded: 95, total: 100, message: 'Encoding 24kHz Hi-Fi audio buffer...' }
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
