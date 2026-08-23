export interface ExtractedAudioTrack {
  id: string;
  name: string;
  description: string;
  blob: Blob;
  duration: number;
  sampleRate: number;
  channels: number;
}

export class VideoEngine {
  /**
   * Extract all audio tracks and discrete channels from a video file into WAV Blobs
   */
  static async extractAllAudioTracks(videoFile: File | Blob): Promise<ExtractedAudioTrack[]> {
    const arrayBuffer = await videoFile.arrayBuffer();
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    let audioBuffer: AudioBuffer;
    try {
      audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    } catch (err: any) {
      await audioCtx.close();
      throw new Error('No supported audio stream found in this video: ' + err.message);
    }

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const tracks: ExtractedAudioTrack[] = [];

    // 1. Full Master Audio Mix (Stereo or Multi-channel)
    const masterBlob = this.audioBufferToWav(audioBuffer);
    tracks.push({
      id: 'master-mix',
      name: 'Full Master Audio Mix',
      description: `Complete mixed audio (${numChannels === 1 ? 'Mono' : numChannels === 2 ? 'Stereo' : numChannels + ' Channels'})`,
      blob: masterBlob,
      duration,
      sampleRate,
      channels: numChannels,
    });

    // 2. If video has multiple audio channels (Stereo, Quad, 5.1, 7.1), extract each discrete track / stem
    if (numChannels >= 2) {
      const channelLabels: Record<number, string[]> = {
        2: ['Left Audio Track (Channel 1)', 'Right Audio Track (Channel 2)'],
        4: ['Front Left (Ch 1)', 'Front Right (Ch 2)', 'Rear Left (Ch 3)', 'Rear Right (Ch 4)'],
        6: [
          'Front Left (Ch 1)',
          'Front Right (Ch 2)',
          'Center Dialogue (Ch 3)',
          'Subwoofer / LFE (Ch 4)',
          'Surround Left (Ch 5)',
          'Surround Right (Ch 6)',
        ],
        8: [
          'Front Left (Ch 1)',
          'Front Right (Ch 2)',
          'Center (Ch 3)',
          'LFE (Ch 4)',
          'Side Left (Ch 5)',
          'Side Right (Ch 6)',
          'Rear Left (Ch 7)',
          'Rear Right (Ch 8)',
        ],
      };

      const labels = channelLabels[numChannels] || Array.from({ length: numChannels }, (_, i) => `Audio Channel ${i + 1}`);

      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        // Create an isolated single-channel AudioBuffer
        const singleBuffer = audioCtx.createBuffer(1, channelData.length, sampleRate);
        singleBuffer.copyToChannel(channelData, 0, 0);

        const singleChannelWav = this.audioBufferToWav(singleBuffer);
        tracks.push({
          id: `channel-${ch + 1}`,
          name: labels[ch] || `Audio Track ${ch + 1}`,
          description: `Isolated discrete channel track (${sampleRate} Hz, 16-bit PCM)`,
          blob: singleChannelWav,
          duration,
          sampleRate,
          channels: 1,
        });
      }
    }

    await audioCtx.close();
    return tracks;
  }

  /**
   * Extract audio stream from a video file into a lossless WAV Blob
   */
  static async extractAudioToWav(videoFile: File | Blob): Promise<Blob> {
    const tracks = await this.extractAllAudioTracks(videoFile);
    return tracks[0].blob;
  }

  /**
   * Mute video or trim video using MediaRecorder and HTML5 Video Element
   */
  static async processVideoSegment(
    videoFile: File | Blob,
    options: {
      startTime?: number;
      endTime?: number;
      muteAudio?: boolean;
      targetResolution?: '1080p' | '720p' | '480p' | 'original';
    },
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = options.muteAudio ?? false;
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = async () => {
        const duration = video.duration;
        const start = options.startTime ?? 0;
        const end = Math.min(options.endTime ?? duration, duration);
        const segmentDuration = end - start;

        let width = video.videoWidth;
        let height = video.videoHeight;

        if (options.targetResolution === '720p' && width > 1280) {
          height = Math.round((height * 1280) / width);
          width = 1280;
        } else if (options.targetResolution === '480p' && width > 854) {
          height = Math.round((height * 854) / width);
          width = 854;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        const canvasStream = canvas.captureStream(30);
        let combinedStream = canvasStream;

        // Capture audio track if not muted
        if (!options.muteAudio && (video as any).captureStream) {
          try {
            const videoStream = (video as any).captureStream();
            const audioTracks = videoStream.getAudioTracks();
            if (audioTracks.length > 0) {
              combinedStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...audioTracks,
              ]);
            }
          } catch {
            // Audio capture from element not supported or blocked
          }
        }

        // Determine supported mime type
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/mp4';
        }

        let mediaRecorder: MediaRecorder;
        try {
          mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType,
            videoBitsPerSecond: options.targetResolution === '480p' ? 1000000 : 2500000,
          });
        } catch {
          mediaRecorder = new MediaRecorder(combinedStream);
        }

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          URL.revokeObjectURL(video.src);
          const finalBlob = new Blob(chunks, { type: mimeType });
          resolve(finalBlob);
        };

        video.currentTime = start;

        video.onseeked = () => {
          mediaRecorder.start(100);
          video.play();

          const drawFrame = () => {
            if (video.currentTime >= end || video.paused || video.ended) {
              if (mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
              }
              return;
            }

            ctx.drawImage(video, 0, 0, width, height);

            if (onProgress) {
              const currentProgress = Math.min(
                100,
                Math.round(((video.currentTime - start) / segmentDuration) * 100)
              );
              onProgress(currentProgress);
            }

            requestAnimationFrame(drawFrame);
          };

          drawFrame();
        };
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video: ' + e));
      };
    });
  }

  /**
   * Convert AudioBuffer into a standardized 16-bit PCM WAV Blob
   */
  private static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    let result: Float32Array;
    if (numChannels === 2) {
      const ch0 = buffer.getChannelData(0);
      const ch1 = buffer.getChannelData(1);
      result = new Float32Array(ch0.length + ch1.length);
      for (let i = 0; i < ch0.length; i++) {
        result[i * 2] = ch0[i];
        result[i * 2 + 1] = ch1[i];
      }
    } else if (numChannels === 1) {
      result = buffer.getChannelData(0);
    } else {
      // Multi-channel interleaved
      const length = buffer.length;
      result = new Float32Array(length * numChannels);
      for (let ch = 0; ch < numChannels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          result[i * numChannels + ch] = data[i];
        }
      }
    }

    const dataByteLength = result.length * (bitDepth / 8);
    const headerByteLength = 44;
    const totalLength = headerByteLength + dataByteLength;
    const outBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(outBuffer);

    // RIFF identifier
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalLength - 8, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataByteLength, true);

    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
