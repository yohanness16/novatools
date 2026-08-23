import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js for browser environment
if (typeof window !== 'undefined') {
  env.allowLocalModels = false;
  env.useBrowserCache = true;
}

export interface SubtitleCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface TranscriptionProgress {
  status: 'loading' | 'decoding' | 'segmenting' | 'transcribing' | 'done' | 'error';
  progress: number; // 0 to 100
  message: string;
}

export interface TranscriptionOptions {
  language?: string; // 'auto', 'en', 'es', 'fr', 'de', 'ja', etc.
  model?: 'whisper-tiny' | 'whisper-base' | 'webspeech';
  maxCharsPerCue?: number;
}

export function formatTimeSrt(seconds: number): string {
  const safeSecs = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = Math.floor(safeSecs % 60);
  const ms = Math.floor((safeSecs % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatTimeVtt(seconds: number): string {
  const safeSecs = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = Math.floor(safeSecs % 60);
  const ms = Math.floor((safeSecs % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function cuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => `${index + 1}\n${formatTimeSrt(cue.start)} --> ${formatTimeSrt(cue.end)}\n${cue.text.trim()}\n`)
    .join('\n');
}

export function cuesToVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue, index) => `${index + 1}\n${formatTimeVtt(cue.start)} --> ${formatTimeVtt(cue.end)}\n${cue.text.trim()}\n`)
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export function cuesToTxt(cues: SubtitleCue[], includeTimestamps = false): string {
  if (!includeTimestamps) {
    return cues.map((c) => c.text.trim()).join(' ');
  }
  return cues.map((c) => `[${formatTimeVtt(c.start)}] ${c.text.trim()}`).join('\n');
}

export function cuesToJson(cues: SubtitleCue[]): string {
  return JSON.stringify(cues, null, 2);
}

export function parseSrt(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  const parseTime = (t: string) => {
    const parts = t.split(/[:,]/);
    if (parts.length < 4) return 0;
    return (
      parseInt(parts[0], 10) * 3600 +
      parseInt(parts[1], 10) * 60 +
      parseInt(parts[2], 10) +
      parseInt(parts[3], 10) / 1000
    );
  };

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
    if (!textLines) continue;

    cues.push({
      id: Math.random().toString(36).substring(2, 9),
      start: parseTime(startStr),
      end: parseTime(endStr),
      text: textLines,
    });
  }
  return cues;
}

export function parseVtt(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^WEBVTT[^\n]*\n+/i, '');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  const parseTime = (t: string) => {
    const parts = t.split(/[:.]/);
    if (parts.length < 3) return 0;
    if (parts.length === 3) {
      // MM:SS.mmm
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10) + parseInt(parts[2], 10) / 1000;
    }
    // HH:MM:SS.mmm
    return (
      parseInt(parts[0], 10) * 3600 +
      parseInt(parts[1], 10) * 60 +
      parseInt(parts[2], 10) +
      parseInt(parts[3], 10) / 1000
    );
  };

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim().split(' ')[0]);
    const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
    if (!textLines) continue;

    cues.push({
      id: Math.random().toString(36).substring(2, 9),
      start: parseTime(startStr),
      end: parseTime(endStr),
      text: textLines,
    });
  }
  return cues;
}

// Global cached pipeline instance
let whisperPipelineInstance: any = null;
let currentModelName: string | null = null;

export class SubtitleEngine {
  /**
   * Decodes and resamples any audio/video file into 16kHz mono PCM Float32Array
   */
  static async decodeAudioTo16k(file: File | Blob): Promise<{ pcm: Float32Array; duration: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) {
      throw new Error('Web Audio API is not supported in this browser.');
    }
    const audioCtx = new AudioCtx();

    try {
      const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const targetSampleRate = 16000;
      const targetLength = Math.max(1, Math.ceil(originalBuffer.duration * targetSampleRate));

      const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = originalBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      const renderedBuffer = await offlineCtx.startRendering();
      return {
        pcm: renderedBuffer.getChannelData(0),
        duration: renderedBuffer.duration,
      };
    } finally {
      try {
        await audioCtx.close();
      } catch {
        // Ignore close error
      }
    }
  }

  /**
   * Voice Activity Detection (VAD) audio segmenter for natural sentence boundaries
   */
  static segmentAudioBySilence(
    pcm: Float32Array,
    sampleRate = 16000,
    minSilenceMs = 400
  ): { start: number; end: number }[] {
    const frameSize = Math.floor(sampleRate * 0.05); // 50ms window
    const segments: { start: number; end: number }[] = [];
    let inSpeech = false;
    let speechStart = 0;
    let silenceFrames = 0;
    const silenceThreshold = 0.012;
    const minSilenceFrames = Math.floor(minSilenceMs / 50);

    for (let i = 0; i < pcm.length; i += frameSize) {
      let sum = 0;
      const endIdx = Math.min(i + frameSize, pcm.length);
      for (let j = i; j < endIdx; j++) {
        sum += Math.abs(pcm[j]);
      }
      const energy = sum / (endIdx - i);

      if (energy > silenceThreshold) {
        if (!inSpeech) {
          inSpeech = true;
          speechStart = Math.max(0, (i - frameSize) / sampleRate);
        }
        silenceFrames = 0;
      } else {
        if (inSpeech) {
          silenceFrames++;
          if (silenceFrames >= minSilenceFrames || i + frameSize >= pcm.length) {
            inSpeech = false;
            const speechEnd = Math.min(pcm.length / sampleRate, (i - (silenceFrames - 1) * frameSize) / sampleRate);
            if (speechEnd - speechStart > 0.4) {
              segments.push({ start: speechStart, end: speechEnd });
            }
          }
        }
      }
    }

    if (inSpeech) {
      segments.push({ start: speechStart, end: pcm.length / sampleRate });
    }

    return segments.length > 0 ? segments : [{ start: 0, end: pcm.length / sampleRate }];
  }

  /**
   * Get or load client-side Whisper ASR pipeline
   */
  static async getWhisperPipeline(
    modelName = 'Xenova/whisper-tiny',
    onProgress?: (progress: number, text: string) => void
  ) {
    if (whisperPipelineInstance && currentModelName === modelName) {
      return whisperPipelineInstance;
    }

    onProgress?.(10, 'Loading in-browser AI model (WebAssembly)...');

    const transcriber = await pipeline('automatic-speech-recognition', modelName, {
      progress_callback: (p: any) => {
        if (p.status === 'progress' && typeof p.progress === 'number') {
          onProgress?.(10 + Math.round(p.progress * 0.4), `Downloading AI weights (${p.file || ''}): ${Math.round(p.progress)}%`);
        }
      },
    });

    whisperPipelineInstance = transcriber;
    currentModelName = modelName;
    return transcriber;
  }

  /**
   * Transcribe speech and produce synchronized subtitle cues
   */
  static async generateSubtitles(
    mediaFile: File | Blob,
    options: TranscriptionOptions = {},
    onProgress?: (info: TranscriptionProgress) => void
  ): Promise<SubtitleCue[]> {
    onProgress?.({
      status: 'decoding',
      progress: 5,
      message: 'Extracting and decoding audio stream...',
    });

    const { pcm, duration } = await this.decodeAudioTo16k(mediaFile);

    // If duration is 0 or pcm is empty
    if (pcm.length === 0 || duration === 0) {
      throw new Error('No audio content found in this file.');
    }

    const language = options.language && options.language !== 'auto' ? options.language : undefined;
    const isEnglishOnly = language === 'en';
    const chosenModel = isEnglishOnly ? 'Xenova/whisper-tiny.en' : 'Xenova/whisper-tiny';

    onProgress?.({
      status: 'loading',
      progress: 15,
      message: 'Initializing AI transcription model...',
    });

    try {
      const transcriber = await this.getWhisperPipeline(chosenModel, (p, text) => {
        onProgress?.({
          status: 'loading',
          progress: p,
          message: text,
        });
      });

      onProgress?.({
        status: 'transcribing',
        progress: 55,
        message: 'Transcribing speech and extracting timestamps...',
      });

      const output = await transcriber(pcm, {
        language: language,
        task: 'transcribe',
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
      });

      onProgress?.({
        status: 'segmenting',
        progress: 90,
        message: 'Formatting and aligning subtitle cues...',
      });

      const rawChunks = output.chunks || [];
      const cues: SubtitleCue[] = [];

      if (rawChunks.length > 0) {
        for (const chunk of rawChunks) {
          const text = (chunk.text || '').trim();
          if (!text) continue;

          let [start, end] = chunk.timestamp || [0, duration];
          if (typeof start !== 'number' || isNaN(start)) start = 0;
          if (typeof end !== 'number' || isNaN(end) || end <= start) end = start + 2.5;

          // Split long text chunks into concise readable subtitle lines if necessary
          const maxChars = options.maxCharsPerCue || 80;
          if (text.length > maxChars) {
            const words = text.split(' ');
            const mid = Math.ceil(words.length / 2);
            const part1 = words.slice(0, mid).join(' ');
            const part2 = words.slice(mid).join(' ');
            const midTime = start + (end - start) * 0.5;

            cues.push({
              id: Math.random().toString(36).substring(2, 9),
              start,
              end: midTime,
              text: part1,
            });
            cues.push({
              id: Math.random().toString(36).substring(2, 9),
              start: midTime,
              end,
              text: part2,
            });
          } else {
            cues.push({
              id: Math.random().toString(36).substring(2, 9),
              start,
              end,
              text,
            });
          }
        }
      } else if (output.text && output.text.trim()) {
        // Fallback: Segment by silence boundaries and map words
        const segments = this.segmentAudioBySilence(pcm);
        const fullText = output.text.trim();
        const sentences = fullText.split(/(?<=[.?!])\s+/).filter(Boolean);

        if (sentences.length <= segments.length) {
          for (let i = 0; i < sentences.length; i++) {
            const seg = segments[i] || segments[segments.length - 1];
            cues.push({
              id: Math.random().toString(36).substring(2, 9),
              start: seg.start,
              end: seg.end,
              text: sentences[i],
            });
          }
        } else {
          // Distribute evenly
          const segDuration = duration / sentences.length;
          for (let i = 0; i < sentences.length; i++) {
            cues.push({
              id: Math.random().toString(36).substring(2, 9),
              start: i * segDuration,
              end: Math.min(duration, (i + 1) * segDuration),
              text: sentences[i],
            });
          }
        }
      }

      onProgress?.({
        status: 'done',
        progress: 100,
        message: 'Subtitles generated successfully!',
      });

      return cues.length > 0
        ? cues
        : [
            {
              id: 'cue-1',
              start: 0,
              end: duration,
              text: output.text || 'No discernible speech detected.',
            },
          ];
    } catch (aiErr: any) {
      console.warn('Whisper AI failed, attempting VAD voice segmentation fallback:', aiErr);

      // Graceful fallback with VAD speech segments
      const segments = this.segmentAudioBySilence(pcm);
      const fallbackCues: SubtitleCue[] = segments.map((seg, i) => ({
        id: `cue-${i + 1}`,
        start: seg.start,
        end: seg.end,
        text: `[Audio Segment ${i + 1}]`,
      }));

      onProgress?.({
        status: 'done',
        progress: 100,
        message: 'Speech boundaries detected.',
      });

      return fallbackCues;
    }
  }
}
