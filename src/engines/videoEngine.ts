import {
  demuxMp4AudioTracks,
  demuxMatroskaAudioTracks,
  isMp4OrMov,
  isMatroskaOrWebm,
  audioBufferToWav,
  safeDecodeAudioData,
} from './demuxer';

export interface ExtractedAudioTrack {
  id: string;
  name: string;
  description: string;
  language?: string;
  codec?: string;
  blob: Blob;
  duration: number;
  sampleRate: number;
  channels: number;
}

export class VideoEngine {
  /**
   * Extract all audio tracks (including language dubs and alternate streams) from a video file into WAV Blobs
   */
  static async extractAllAudioTracks(videoFile: File | Blob): Promise<ExtractedAudioTrack[]> {
    const arrayBuffer = await videoFile.arrayBuffer();
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) {
      throw new Error('Web Audio API is not supported in this browser.');
    }
    const audioCtx = new AudioCtxClass();

    try {
      // 1. Try MP4 / MOV Demuxing (Handles multi-track AAC/MP4 dubs)
      if (isMp4OrMov(arrayBuffer)) {
        try {
          const mp4Tracks = await demuxMp4AudioTracks(arrayBuffer, audioCtx);
          if (mp4Tracks && mp4Tracks.length > 0) {
            return mp4Tracks;
          }
        } catch (mp4Err) {
          console.warn('MP4 container demuxing fallback to audio decoding:', mp4Err);
        }
      }

      // 2. Try MKV / WebM Demuxing (Handles multi-track Opus/AAC/Vorbis dubs)
      if (isMatroskaOrWebm(arrayBuffer)) {
        try {
          const mkvTracks = await demuxMatroskaAudioTracks(arrayBuffer, audioCtx);
          if (mkvTracks && mkvTracks.length > 0) {
            return mkvTracks;
          }
        } catch (mkvErr) {
          console.warn('Matroska container demuxing fallback to audio decoding:', mkvErr);
        }
      }

      // 3. Fallback: Direct Web Audio decoding for single-stream videos / unsupported containers
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await safeDecodeAudioData(audioCtx, arrayBuffer);
      } catch (err: any) {
        throw new Error('No supported audio stream could be extracted from this video file: ' + (err?.message || err));
      }

      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const duration = audioBuffer.duration;
      const masterBlob = audioBufferToWav(audioBuffer);

      return [
        {
          id: 'audio-track-1',
          name: 'Full Audio Track',
          description: `${numChannels === 1 ? 'Mono' : numChannels === 2 ? 'Stereo' : numChannels + ' Channels'} · ${(sampleRate / 1000).toFixed(1)} kHz · 16-bit PCM WAV`,
          blob: masterBlob,
          duration,
          sampleRate,
          channels: numChannels,
        },
      ];
    } finally {
      try {
        await audioCtx.close();
      } catch {
        // Ignore AudioContext close errors
      }
    }
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
}
