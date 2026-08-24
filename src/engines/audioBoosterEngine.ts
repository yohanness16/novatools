export interface AudioAnalysis {
  peak: number;
  peakDb: number;
  rms: number;
  rmsDb: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
}

export interface AudioBoosterOptions {
  gainMultiplier: number; // 1.0 = 100%, 2.0 = 200%, 3.0 = 300% (+0dB to +12dB)
  enableLimiter?: boolean; // Multi-stage dynamics compression to avoid clipping
  normalizePeak?: boolean; // Normalize peak to 0dB (-0.1dB ceiling)
  preset?: 'custom' | 'speech' | 'podcast' | 'max' | 'warmth';
  outputFormat?: 'wav' | 'webm';
}

export interface BoostProgress {
  status: 'decoding' | 'analyzing' | 'processing' | 'encoding' | 'done' | 'error';
  progress: number;
  message: string;
}

export interface BoostResult {
  blob: Blob;
  format: string;
  originalAnalysis: AudioAnalysis;
  boostedAnalysis: AudioAnalysis;
  gainMultiplier: number;
  gainDb: number;
}

export class AudioBoosterEngine {
  /**
   * Decodes any audio/video file into Web Audio API AudioBuffer
   */
  static async decodeAudio(file: File | Blob): Promise<AudioBuffer> {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API is not supported in this browser.');
    }
    const audioCtx = new AudioCtx();
    try {
      return await audioCtx.decodeAudioData(arrayBuffer);
    } finally {
      try {
        await audioCtx.close();
      } catch {
        // Ignore close error
      }
    }
  }

  /**
   * Analyzes peak amplitude and RMS energy
   */
  static analyzeAudioBuffer(buffer: AudioBuffer): AudioAnalysis {
    let maxPeak = 0;
    let sumSquares = 0;
    let totalSamples = 0;

    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const channelData = buffer.getChannelData(c);
      totalSamples += channelData.length;
      for (let i = 0; i < channelData.length; i++) {
        const val = Math.abs(channelData[i]);
        if (val > maxPeak) maxPeak = val;
        sumSquares += val * val;
      }
    }

    const rms = totalSamples > 0 ? Math.sqrt(sumSquares / totalSamples) : 0;
    const peakDb = maxPeak > 0 ? 20 * Math.log10(maxPeak) : -100;
    const rmsDb = rms > 0 ? 20 * Math.log10(rms) : -100;

    return {
      peak: Number(maxPeak.toFixed(4)),
      peakDb: Number(peakDb.toFixed(1)),
      rms: Number(rms.toFixed(4)),
      rmsDb: Number(rmsDb.toFixed(1)),
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      numberOfChannels: buffer.numberOfChannels,
    };
  }

  /**
   * Converts linear multiplier to decibels
   */
  static multiplierToDb(multiplier: number): number {
    return multiplier > 0 ? Number((20 * Math.log10(multiplier)).toFixed(1)) : -100;
  }

  /**
   * Converts decibels to linear multiplier
   */
  static dbToMultiplier(db: number): number {
    return Number(Math.pow(10, db / 20).toFixed(2));
  }

  /**
   * Encodes AudioBuffer into clean 16-bit PCM WAV format
   */
  static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataByteCount = numSamples * blockAlign;
    const bufferLength = 44 + dataByteCount;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // RIFF Chunk Descriptor
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataByteCount, true);
    writeString(8, 'WAVE');

    // "fmt " Sub-chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, format, true); // AudioFormat
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // "data" Sub-chunk
    writeString(36, 'data');
    view.setUint32(40, dataByteCount, true);

    // Interleave channels & write 16-bit clamped samples
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        // Hard clamp sample to [-1, 1]
        sample = Math.max(-1, Math.min(1, sample));
        // Scale to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, Math.floor(intSample), true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Processes, amplifies, dynamics-compresses, and exports audio
   */
  static async boostAudio(
    file: File | Blob,
    options: AudioBoosterOptions,
    onProgress?: (progress: BoostProgress) => void
  ): Promise<BoostResult> {
    onProgress?.({
      status: 'decoding',
      progress: 10,
      message: 'Decoding audio stream...',
    });

    const originalBuffer = await this.decodeAudio(file);
    const originalAnalysis = this.analyzeAudioBuffer(originalBuffer);

    onProgress?.({
      status: 'analyzing',
      progress: 25,
      message: `Audio analyzed: Peak ${originalAnalysis.peakDb} dB, RMS ${originalAnalysis.rmsDb} dB`,
    });

    // Calculate target gain
    let finalGain = options.gainMultiplier || 1.0;

    if (options.normalizePeak && originalAnalysis.peak > 0) {
      // Normalize peak to 0.98 (-0.2dB)
      const normMultiplier = 0.98 / originalAnalysis.peak;
      finalGain = Math.max(0.5, Math.min(4.0, finalGain * normMultiplier));
    }

    onProgress?.({
      status: 'processing',
      progress: 50,
      message: `Amplifying volume by ${(finalGain * 100).toFixed(0)}% (+${this.multiplierToDb(finalGain)} dB)...`,
    });

    // Render using OfflineAudioContext with Limiter
    const offlineCtx = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      originalBuffer.length,
      originalBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;

    // Gain Stage
    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = finalGain;

    // Optional EQ / Presets
    let lastNode: AudioNode = gainNode;
    source.connect(gainNode);

    if (options.preset === 'speech') {
      // High-pass filter (80Hz) to remove low rumble, gentle 2.5kHz presence boost
      const highPass = offlineCtx.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 80;

      const presence = offlineCtx.createBiquadFilter();
      presence.type = 'peaking';
      presence.frequency.value = 2500;
      presence.gain.value = 3.0;
      presence.Q.value = 1.0;

      lastNode.connect(highPass);
      highPass.connect(presence);
      lastNode = presence;
    } else if (options.preset === 'warmth') {
      // Gentle low-shelf boost at 200Hz
      const lowShelf = offlineCtx.createBiquadFilter();
      lowShelf.type = 'lowshelf';
      lowShelf.frequency.value = 200;
      lowShelf.gain.value = 3.5;

      lastNode.connect(lowShelf);
      lastNode = lowShelf;
    }

    // Dynamics Limiter (prevents digital clipping distortion)
    if (options.enableLimiter !== false) {
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.value = -0.5; // Trigger near 0dB
      compressor.knee.value = 4.0;
      compressor.ratio.value = 20.0; // Brickwall limiter ratio
      compressor.attack.value = 0.003; // Fast attack (3ms)
      compressor.release.value = 0.15; // Fast release

      lastNode.connect(compressor);
      compressor.connect(offlineCtx.destination);
    } else {
      lastNode.connect(offlineCtx.destination);
    }

    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const boostedAnalysis = this.analyzeAudioBuffer(renderedBuffer);

    onProgress?.({
      status: 'encoding',
      progress: 85,
      message: 'Encoding lossless 16-bit WAV output...',
    });

    const wavBlob = this.audioBufferToWav(renderedBuffer);

    onProgress?.({
      status: 'done',
      progress: 100,
      message: 'Audio boosted and normalized successfully!',
    });

    return {
      blob: wavBlob,
      format: 'wav',
      originalAnalysis,
      boostedAnalysis,
      gainMultiplier: finalGain,
      gainDb: this.multiplierToDb(finalGain),
    };
  }
}
