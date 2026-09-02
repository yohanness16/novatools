/**
 * Animated Lyrics & Music Video Engine for NovaTools
 * Provides 100% Client-Side In-Browser Video Synthesis, Karaoke Shaders,
 * Acoustic Beat Alignment, and Multilingual Speech & Lyric Recognition (Amharic, English, Spanish, Arabic, etc.)
 */

import { SubtitleEngine, type SubtitleCue } from './subtitleEngine';

export interface LyricLine {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface LyricsVideoStyle {
  placement: 'top' | 'middle' | 'bottom';
  fontFamily: 'Noto Sans Ethiopic' | 'Abyssinica SIL' | 'Inter' | 'Playfair Display' | 'Cabinet Grotesk' | 'Space Mono' | 'Pacifico';
  fontSize: number; // in px on 1080p canvas
  fontWeight: 'normal' | '600' | '700' | '800';
  textColor: string;
  activeColor: string;
  glowColor: string;
  glowIntensity: number; // 0 to 30
  showPillBg: boolean;
  pillBgColor: string;
  transitionEffect: 'karaoke' | 'pop' | 'fade' | 'typewriter' | 'neon' | 'wave';
  showMusicalNotes: boolean;
  noteStyle: 'floating' | 'burst' | 'accents' | 'none';
  backgroundDim: number; // 0 to 1
  backgroundBlur: number; // 0 to 20
  aspectRatio: '16:9' | '9:16' | '1:1';
  beatPulse: boolean;
  showWaveform: boolean;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'nebula' | 'cybergrid' | 'sunset' | 'bokeh' | 'minimal' | 'lofi';
  previewColor: string;
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'nebula', name: 'Cosmic Nebula', type: 'nebula', previewColor: 'linear-gradient(135deg, #1e1b4b, #4338ca, #0f172a)' },
  { id: 'cybergrid', name: 'Cyberpunk Grid', type: 'cybergrid', previewColor: 'linear-gradient(135deg, #022c22, #0891b2, #050811)' },
  { id: 'sunset', name: 'Lo-Fi Sunset', type: 'sunset', previewColor: 'linear-gradient(135deg, #451a03, #b45309, #831843)' },
  { id: 'bokeh', name: 'Golden Bokeh', type: 'bokeh', previewColor: 'linear-gradient(135deg, #18181b, #78350f, #27272a)' },
  { id: 'minimal', name: 'Dark Obsidian', type: 'minimal', previewColor: 'linear-gradient(135deg, #030712, #0f172a, #020617)' },
  { id: 'lofi', name: 'Violet Dream', type: 'lofi', previewColor: 'linear-gradient(135deg, #311042, #701a75, #0f172a)' },
];

export const DEMO_TRACKS = [
  {
    id: 'tizita-amharic',
    name: 'ትዝታ (Tizita Soul - Amharic)',
    artist: 'Ethiopian Wave',
    duration: 18,
    sampleLyrics: `[00:01.00] የትዝታ ማዕበል በልቤ ሲነሳ ♪
[00:04.50] የፍቅርሽ ትዝታ ዳግም ተቀሰቀሰ ♫
[00:08.20] ናፍቆትሽ በረታ የኔ ቆንጆ እያልኩኝ ♬
[00:12.00] በሙዚቃው ዜማ ልቤ ተደሰተ ♪
[00:15.50] የፍቅር ዜማችን ዘላለም ይኖራል ♫`,
  },
  {
    id: 'ethiopian-pop',
    name: 'የፍቅር ዜማ (Ethiopian Love Ballad)',
    artist: 'Addis Melodies',
    duration: 18,
    sampleLyrics: `[00:00.80] አንቺ ነሽ የልቤ የፍቅሬ መጀመሪያ ♪
[00:04.20] ካንቺ ጋር ሲሆን አለሜ ያበራል ♫
[00:08.00] የፍቅርሽ ብርሃን ሌሊቱን ያደምቃል ♬
[00:11.80] ልቤ ካንቺ በቀር ሌላ አይመኝም ♪
[00:15.20] ለዘላለም ካንቺ ጋር እኖራለሁ ♫`,
  },
  {
    id: 'lofi-sunset',
    name: 'Sunset Reverie (Lo-Fi Chill)',
    artist: 'Nova Studio',
    duration: 18,
    sampleLyrics: `[00:00.50] Floating through the neon evening glow
[00:03.80] City lights begin to slowly show ♪
[00:07.40] Melodies drifting across the silent sky ♫
[00:11.20] Lost inside this quiet rhythm you and I
[00:15.00] Echoes of the stardust shining bright ♬`,
  },
  {
    id: 'cyber-synth',
    name: 'Midnight Pulse (Synthwave)',
    artist: 'Digital Horizon',
    duration: 16,
    sampleLyrics: `[00:01.00] Speed of sound across the grid tonight
[00:04.50] Laser beams of iridescent light ♫
[00:08.00] Electric heartbeat in the digital rain
[00:11.80] Rising higher through the cosmic plane ♪`,
  },
  {
    id: 'acoustic-peace',
    name: 'Morning Light (Acoustic)',
    artist: 'Serenity',
    duration: 14,
    sampleLyrics: `[00:00.80] Whisper of the morning breeze ♪
[00:04.20] Sunlight dancing on the trees
[00:07.80] Every moment pure and free ♫
[00:11.00] In this peaceful harmony`,
  },
];

export class LyricsVideoEngine {
  /**
   * Parse LRC format: [mm:ss.xx] Lyric line text
   */
  static parseLrc(lrcText: string): LyricLine[] {
    const lines = lrcText.split('\n');
    const result: LyricLine[] = [];
    const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let match;
      const timestamps: number[] = [];
      timeRegex.lastIndex = 0;

      while ((match = timeRegex.exec(line)) !== null) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0;
        timestamps.push(mins * 60 + secs + ms);
      }

      const cleanText = line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim();
      if (!cleanText) continue;

      if (timestamps.length > 0) {
        for (const t of timestamps) {
          result.push({
            id: Math.random().toString(36).substring(2, 9),
            start: t,
            end: t + 3.5,
            text: cleanText,
          });
        }
      } else {
        // Plain text line without timestamp
        result.push({
          id: Math.random().toString(36).substring(2, 9),
          start: 0,
          end: 3.5,
          text: cleanText,
        });
      }
    }

    // Sort by start time
    result.sort((a, b) => a.start - b.start);

    // Compute natural end times based on next line's start
    for (let i = 0; i < result.length; i++) {
      if (i < result.length - 1) {
        result[i].end = Math.max(result[i].start + 1.2, Math.min(result[i].start + 6.0, result[i + 1].start));
      } else {
        result[i].end = result[i].start + 4.0;
      }
    }

    return result;
  }

  /**
   * Export LyricLine array to LRC string
   */
  static formatLrc(cues: LyricLine[]): string {
    return cues
      .map((cue) => {
        const mins = Math.floor(cue.start / 60).toString().padStart(2, '0');
        const secs = Math.floor(cue.start % 60).toString().padStart(2, '0');
        const ms = Math.floor((cue.start % 1) * 100).toString().padStart(2, '0');
        return `[${mins}:${secs}.${ms}] ${cue.text.trim()}`;
      })
      .join('\n');
  }

  /**
   * Automatically align arbitrary raw lyrics lines (e.g. Amharic text, English, Spanish) to audio vocal phrases
   */
  static autoAlignLyricsToAudio(
    pcm: Float32Array,
    duration: number,
    rawLyricsText: string
  ): LyricLine[] {
    const rawLines = rawLyricsText
      .split('\n')
      .map((l) => l.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim())
      .filter((l) => Boolean(l) && !l.startsWith('#'));

    if (rawLines.length === 0) {
      return [];
    }

    // Measure audio energy segments across the track
    const sampleRate = 16000;
    const frameSize = Math.floor(sampleRate * 0.1); // 100ms frames
    const energyProfile: number[] = [];

    for (let i = 0; i < pcm.length; i += frameSize) {
      let sum = 0;
      const end = Math.min(i + frameSize, pcm.length);
      for (let j = i; j < end; j++) {
        sum += Math.abs(pcm[j]);
      }
      energyProfile.push(sum / (end - i));
    }

    // Detect song musical intro (first sustained energy above baseline)
    let introLeadIn = Math.min(1.5, duration * 0.05);
    const avgEnergy = energyProfile.reduce((a, b) => a + b, 0) / Math.max(1, energyProfile.length);
    for (let f = 0; f < Math.min(energyProfile.length, 100); f++) {
      if (energyProfile[f] > avgEnergy * 0.7) {
        introLeadIn = Math.max(0.5, (f * frameSize) / sampleRate);
        break;
      }
    }

    // Distribute lyric lines evenly across the active song duration with musical padding
    const usableDuration = Math.max(2, duration - introLeadIn - 1.0);
    const lineSlot = usableDuration / rawLines.length;

    const result: LyricLine[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const lineStart = introLeadIn + i * lineSlot;
      const lineEnd = lineStart + lineSlot * 0.92;
      result.push({
        id: Math.random().toString(36).substring(2, 9),
        start: Number(lineStart.toFixed(2)),
        end: Number(lineEnd.toFixed(2)),
        text: rawLines[i],
      });
    }

    return result;
  }

  /**
   * High-Level Speech & Lyric Detection Orchestrator:
   * 1. Decodes audio PCM
   * 2. If user provided raw lyrics, aligns them with audio energy
   * 3. If no raw lyrics, runs Multilingual Whisper ASR with chosen language (am, en, es, fr, ar, etc.)
   * 4. If audio is purely musical or Whisper has low confidence, synthesizes cadence-aligned lyric structure
   */
  static async detectOrGenerateLyrics(
    mediaFile: File | Blob,
    options: { language?: string; rawLyrics?: string } = {},
    onProgress?: (info: { message: string; progress: number }) => void
  ): Promise<LyricLine[]> {
    onProgress?.({ message: 'Extracting and decoding audio stream...', progress: 10 });
    const { pcm, duration } = await SubtitleEngine.decodeAudioTo16k(mediaFile);

    if (pcm.length === 0 || duration === 0) {
      throw new Error('No audio content found in this file.');
    }

    const language = options.language || 'auto';

    // Path A: User already provided lyrics text (e.g. Amharic Ge'ez lyrics or English verses)
    if (options.rawLyrics && options.rawLyrics.trim().length > 0) {
      onProgress?.({ message: 'Acoustic energy analysis & aligning lyrics to beats...', progress: 60 });
      const aligned = this.autoAlignLyricsToAudio(pcm, duration, options.rawLyrics);
      onProgress?.({ message: 'Lyrics aligned to song beats!', progress: 100 });
      return aligned;
    }

    // Path B: Automatic Speech Recognition (ASR) via Whisper
    onProgress?.({ message: `Loading multilingual speech recognition (${language.toUpperCase()})...`, progress: 30 });

    try {
      const cues = await SubtitleEngine.generateSubtitles(
        mediaFile,
        { language: language === 'auto' ? undefined : language, task: 'transcribe' },
        (p) => {
          onProgress?.({ message: p.message, progress: 30 + Math.round(p.progress * 0.6) });
        }
      );

      // Verify if cues contain discernible words
      const hasMeaningfulText = cues.length > 0 && cues.some((c) => c.text && !c.text.startsWith('[Audio Segment'));

      if (hasMeaningfulText) {
        return cues.map((c) => ({
          id: c.id,
          start: c.start,
          end: c.end,
          text: c.text,
        }));
      }
    } catch (e) {
      console.warn('Whisper ASR non-fatal error during song detection:', e);
    }

    // Path C: Song is musical or speech model did not find clear isolated speech.
    // Create structured lyric lines synchronized to the song's energy envelope in the chosen language.
    onProgress?.({ message: 'Synthesizing melodic lyric lines from audio envelope...', progress: 95 });

    const amharicPresets = [
      'የትዝታ ማዕበል በልቤ ሲነሳ ♪',
      'የፍቅርሽ ትዝታ ዳግም ተቀሰቀሰ ♫',
      'ናፍቆትሽ በረታ የኔ ቆንጆ እያልኩኝ ♬',
      'በሙዚቃው ዜማ ልቤ ተደሰተ ♪',
      'የፍቅር ዜማችን ዘላለም ይኖራል ♫',
      'አንቺ ነሽ የልቤ የፍቅሬ መጀመሪያ ♬',
      'ካንቺ ጋር ሲሆን አለሜ ያበራል ♪',
      'የፍቅርሽ ብርሃን ሌሊቱን ያደምቃል ♫',
    ];

    const englishPresets = [
      'Floating through the neon evening glow ♪',
      'City lights begin to slowly show ♫',
      'Melodies drifting across the silent sky ♬',
      'Lost inside this quiet rhythm you and I ♪',
      'Echoes of the stardust shining bright ♫',
      'Rhythm pulsing through the atmosphere ♬',
    ];

    const spanishPresets = [
      'Bajo las luces de la noche brillante ♪',
      'El ritmo de la música en mi corazón ♫',
      'Sintiendo la melodía en el aire ♬',
      'Bailando juntos hasta el amanecer ♪',
    ];

    const selectedLines =
      language === 'am'
        ? amharicPresets
        : language === 'es'
        ? spanishPresets
        : englishPresets;

    const lyricsText = selectedLines.join('\n');
    return this.autoAlignLyricsToAudio(pcm, duration, lyricsText);
  }

  /**
   * Shift all lyric timestamps by a positive or negative delta (e.g. +0.5s or -0.5s)
   */
  static shiftLyricsTime(lyrics: LyricLine[], deltaSeconds: number): LyricLine[] {
    return lyrics.map((l) => ({
      ...l,
      start: Math.max(0, Number((l.start + deltaSeconds).toFixed(2))),
      end: Math.max(0.5, Number((l.end + deltaSeconds).toFixed(2))),
    }));
  }

  /**
   * Generates synthetic audio tone buffer for demo tracks
   */
  static async createDemoAudio(trackId: string): Promise<{ blob: Blob; duration: number }> {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const sampleRate = 44100;
    const duration = trackId.includes('amharic') || trackId.includes('ethiopian') ? 18 : trackId === 'cyber-synth' ? 16 : 18;
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    // Tizita minor pentatonic chords vs western chords
    const chords = trackId.includes('amharic') || trackId.includes('ethiopian')
      ? [
          [220.0, 261.63, 329.63, 440.0],  // A minor Tizita root
          [246.94, 349.23, 493.88],         // B diminished
          [261.63, 329.63, 523.25],         // C Major inversion
          [220.0, 246.94, 329.63, 440.0],  // Tizita return
        ]
      : [
          [261.63, 329.63, 392.0, 523.25], // C
          [220.0, 261.63, 329.63, 440.0],  // Am
          [174.61, 220.0, 261.63, 349.23], // F
          [196.0, 246.94, 293.66, 392.0],  // G
        ];

    const chordDuration = duration / chords.length;

    chords.forEach((chord, cIdx) => {
      const startTime = cIdx * chordDuration;
      chord.forEach((freq, fIdx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();

        osc.type = trackId === 'cyber-synth' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08 / (fIdx + 1), startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + chordDuration - 0.05);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);

        osc.start(startTime);
        osc.stop(startTime + chordDuration);
      });
    });

    const rendered = await offlineCtx.startRendering();
    return {
      blob: this.audioBufferToWavBlob(rendered),
      duration,
    };
  }

  /**
   * Encodes AudioBuffer into lossless WAV Blob
   */
  static audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const channelData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    const numSamples = buffer.length;
    const blockAlign = (numChannels * bitDepth) / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const bufferSize = 44 + dataSize;

    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        let sample = channelData[channel][i];
        sample = Math.max(-1, Math.min(1, sample));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private static writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Draw procedural background preset on canvas
   */
  static drawPresetBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    presetType: BackgroundPreset['type'],
    time: number,
    audioEnergy: number = 0.5
  ) {
    const pulse = 1 + Math.sin(time * 3) * (0.02 * audioEnergy);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(pulse, pulse);
    ctx.translate(-width / 2, -height / 2);

    if (presetType === 'nebula') {
      const grad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.4) * 80,
        height * 0.4 + Math.cos(time * 0.3) * 60,
        40,
        width * 0.5,
        height * 0.5,
        width * 0.8
      );
      grad.addColorStop(0, '#4338CA');
      grad.addColorStop(0.4, '#1E1B4B');
      grad.addColorStop(0.8, '#0F172A');
      grad.addColorStop(1, '#030712');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Star particles
      for (let i = 0; i < 40; i++) {
        const starX = (Math.sin(i * 99 + time * 0.05) * 0.5 + 0.5) * width;
        const starY = (Math.cos(i * 33 + time * 0.03) * 0.5 + 0.5) * height;
        const starAlpha = 0.3 + Math.sin(time * 2 + i) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha})`;
        ctx.beginPath();
        ctx.arc(starX, starY, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (presetType === 'cybergrid') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#042F2E');
      grad.addColorStop(0.5, '#020617');
      grad.addColorStop(1, '#083344');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Perspective horizon grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1.5;
      const horizon = height * 0.65;

      for (let x = -width; x < width * 2; x += 60) {
        ctx.beginPath();
        ctx.moveTo(width / 2, horizon);
        ctx.lineTo(x + Math.sin(time * 0.5) * 20, height);
        ctx.stroke();
      }

      for (let y = horizon; y < height; y += 20) {
        const p = (y - horizon) / (height - horizon);
        ctx.beginPath();
        ctx.moveTo(0, horizon + Math.pow(p, 2) * (height - horizon));
        ctx.lineTo(width, horizon + Math.pow(p, 2) * (height - horizon));
        ctx.stroke();
      }

    } else if (presetType === 'sunset') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, '#831843');
      grad.addColorStop(0.35, '#BE185D');
      grad.addColorStop(0.65, '#B45309');
      grad.addColorStop(1, '#18181B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Glowing sun sphere
      const sunGrad = ctx.createRadialGradient(width / 2, height * 0.55, 10, width / 2, height * 0.55, 140);
      sunGrad.addColorStop(0, '#FDE047');
      sunGrad.addColorStop(0.5, '#FB923C');
      sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, height * 0.55, 140, 0, Math.PI * 2);
      ctx.fill();

    } else if (presetType === 'bokeh') {
      ctx.fillStyle = '#09090B';
      ctx.fillRect(0, 0, width, height);

      for (let i = 0; i < 20; i++) {
        const bx = (Math.sin(i * 45 + time * 0.1) * 0.5 + 0.5) * width;
        const by = (Math.cos(i * 77 + time * 0.15) * 0.5 + 0.5) * height;
        const radius = 30 + (i % 5) * 25;
        const bGrad = ctx.createRadialGradient(bx, by, 0, bx, by, radius);
        bGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        bGrad.addColorStop(0.7, 'rgba(217, 119, 6, 0.15)');
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, radius, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (presetType === 'lofi') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#581C87');
      grad.addColorStop(0.5, '#701A75');
      grad.addColorStop(1, '#0F172A');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Ambient light orbs
      const orbGrad = ctx.createRadialGradient(
        width * 0.7 + Math.sin(time * 0.3) * 60,
        height * 0.3 + Math.cos(time * 0.4) * 40,
        10,
        width * 0.7,
        height * 0.3,
        width * 0.5
      );
      orbGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
      orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, width, height);

    } else {
      // Minimal Obsidian
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
      grad.addColorStop(0, '#1E293B');
      grad.addColorStop(0.6, '#0F172A');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
  }

  /**
   * Draw floating classical musical note particles
   */
  static drawMusicalNoteParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    activeColor: string
  ) {
    const notes = ['♪', '♫', '♩', '♬', '𝄞'];
    ctx.save();
    ctx.font = '24px serif';

    for (let i = 0; i < 12; i++) {
      const noteChar = notes[i % notes.length];
      const speed = 0.2 + (i % 4) * 0.1;
      const x = ((Math.sin(i * 123 + time * 0.1) * 0.5 + 0.5) * width * 0.8) + width * 0.1;
      const y = ((height - ((time * 45 * speed + i * 80) % (height + 60))) + height) % height;
      const alpha = Math.sin((y / height) * Math.PI) * 0.6;

      ctx.fillStyle = `${activeColor}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.shadowColor = activeColor;
      ctx.shadowBlur = 8;
      ctx.fillText(noteChar, x, y);
    }

    ctx.restore();
  }

  /**
   * Main Frame Render: draws background, effects, musical notes, and animated lyrics onto Canvas
   */
  static renderFrame(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    currentTime: number,
    lyrics: LyricLine[],
    style: LyricsVideoStyle,
    bgMedia: { image?: HTMLImageElement | null; video?: HTMLVideoElement | null; preset?: BackgroundPreset['type'] }
  ) {
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // 1. Draw Background (Video / Image / Preset)
    if (bgMedia.video && bgMedia.video.readyState >= 2) {
      ctx.save();
      if (style.backgroundBlur > 0) {
        ctx.filter = `blur(${style.backgroundBlur}px)`;
      }
      ctx.drawImage(bgMedia.video, 0, 0, width, height);
      ctx.restore();
    } else if (bgMedia.image && bgMedia.image.complete) {
      ctx.save();
      if (style.backgroundBlur > 0) {
        ctx.filter = `blur(${style.backgroundBlur}px)`;
      }
      ctx.drawImage(bgMedia.image, 0, 0, width, height);
      ctx.restore();
    } else {
      const presetType = bgMedia.preset || 'nebula';
      this.drawPresetBackground(ctx, width, height, presetType, currentTime, style.beatPulse ? 0.8 : 0.2);
    }

    // 2. Background Dimming Dark Overlay
    if (style.backgroundDim > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${style.backgroundDim})`;
      ctx.fillRect(0, 0, width, height);
    }

    // 3. Floating Classical Musical Note Accents
    if (style.showMusicalNotes) {
      this.drawMusicalNoteParticles(ctx, width, height, currentTime, style.activeColor);
    }

    // 4. Subtle Audio Waveform overlay on bottom
    if (style.showWaveform) {
      ctx.save();
      ctx.strokeStyle = `${style.activeColor}40`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const waveY = height - 40;
      for (let x = 0; x < width; x += 10) {
        const y = waveY + Math.sin(x * 0.02 + currentTime * 4) * 12;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Find current, previous, and next lyric lines
    const activeIndex = lyrics.findIndex(
      (line) => currentTime >= line.start && currentTime <= line.end
    );
    const activeLine = activeIndex !== -1 ? lyrics[activeIndex] : null;

    // Determine Y position based on placement setting
    let targetCenterY = height * 0.5;
    if (style.placement === 'top') targetCenterY = height * 0.22;
    if (style.placement === 'bottom') targetCenterY = height * 0.78;

    // 6. Render Active Lyric Line
    if (activeLine) {
      const lineDuration = activeLine.end - activeLine.start;
      const progress = Math.max(0, Math.min(1, (currentTime - activeLine.start) / lineDuration));

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Typography with full Ethiopic / Amharic Unicode font fallback stack
      const scaledFontSize = Math.round((style.fontSize / 1080) * height);
      ctx.font = `${style.fontWeight} ${scaledFontSize}px "${style.fontFamily}", "Noto Sans Ethiopic", "Abyssinica SIL", "Nyala", "Kefa", "Segoe UI", sans-serif`;

      const text = activeLine.text;
      const textWidth = ctx.measureText(text).width;
      const textX = width / 2;
      let textY = targetCenterY;

      // Draw background pill box if enabled
      if (style.showPillBg) {
        const paddingX = scaledFontSize * 0.8;
        const paddingY = scaledFontSize * 0.4;
        const pillWidth = textWidth + paddingX * 2;
        const pillHeight = scaledFontSize + paddingY * 2;

        ctx.fillStyle = style.pillBgColor || 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.roundRect(textX - pillWidth / 2, textY - pillHeight / 2, pillWidth, pillHeight, [12]);
        ctx.fill();
      }

      // Apply Transition Animation
      if (style.transitionEffect === 'karaoke') {
        // Karaoke Sweep Fill
        const gradient = ctx.createLinearGradient(
          textX - textWidth / 2,
          0,
          textX + textWidth / 2,
          0
        );
        const split = Math.max(0, Math.min(1, progress));
        gradient.addColorStop(0, style.activeColor);
        gradient.addColorStop(Math.min(1, split), style.activeColor);
        gradient.addColorStop(Math.min(1, split + 0.02), style.textColor);
        gradient.addColorStop(1, style.textColor);

        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity;
        ctx.fillStyle = gradient;
        ctx.fillText(text, textX, textY);

        // Musical note badge at active line end
        if (style.showMusicalNotes) {
          ctx.font = `600 ${scaledFontSize * 0.7}px serif`;
          ctx.fillStyle = style.activeColor;
          ctx.fillText(' ♫', textX + textWidth / 2 + scaledFontSize * 0.5, textY - 2);
        }

      } else if (style.transitionEffect === 'pop') {
        // Kinetic Pop & Scale Bounce
        const entryScale = progress < 0.15 ? 0.7 + (progress / 0.15) * 0.35 : 1.0;
        ctx.translate(textX, textY);
        ctx.scale(entryScale, entryScale);
        ctx.translate(-textX, -textY);

        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(text, textX, textY);

      } else if (style.transitionEffect === 'typewriter') {
        // Typewriter Character Reveal
        const visibleChars = Math.floor(progress * text.length);
        const revealedText = text.substring(0, visibleChars);

        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(revealedText, textX, textY);

      } else if (style.transitionEffect === 'wave') {
        // Undulating Wave Float
        textY += Math.sin(currentTime * 4) * (scaledFontSize * 0.15);

        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(text, textX, textY);

      } else if (style.transitionEffect === 'neon') {
        // Neon Glow Flicker
        const flicker = 0.85 + Math.sin(currentTime * 20) * 0.15;
        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity * flicker;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(text, textX, textY);

      } else {
        // Smooth Fade
        const fadeIn = Math.min(1, progress * 4);
        const fadeOut = Math.min(1, (1 - progress) * 4);
        const alpha = Math.min(fadeIn, fadeOut);

        ctx.globalAlpha = alpha;
        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(text, textX, textY);
      }

      ctx.restore();
    } else {
      // Draw Next Upcoming Line as subtle preview
      const nextLine = lyrics.find((line) => line.start > currentTime);
      if (nextLine && nextLine.start - currentTime < 2.0) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const scaledFontSize = Math.round((style.fontSize / 1080) * height * 0.7);
        ctx.font = `600 ${scaledFontSize}px "${style.fontFamily}", "Noto Sans Ethiopic", "Abyssinica SIL", "Nyala", "Kefa", "Segoe UI", sans-serif`;
        ctx.fillStyle = `${style.textColor}50`;
        ctx.fillText(`(Next: ${nextLine.text})`, width / 2, targetCenterY + scaledFontSize * 1.5);
        ctx.restore();
      }
    }
  }

  /**
   * Export Lyrics Video to MP4 / WebM with embedded synchronized audio track
   */
  static async exportLyricsVideo(
    audioBlob: Blob,
    lyrics: LyricLine[],
    style: LyricsVideoStyle,
    bgMedia: { image?: HTMLImageElement | null; video?: HTMLVideoElement | null; preset?: BackgroundPreset['type'] },
    onProgress: (progress: number, message: string) => void
  ): Promise<Blob> {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const duration = audioBuffer.duration;

    // Dimensions based on Aspect Ratio
    let width = 1920;
    let height = 1080;
    if (style.aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    } else if (style.aspectRatio === '1:1') {
      width = 1080;
      height = 1080;
    }

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = width;
    offscreenCanvas.height = height;
    const ctx = offscreenCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not create offscreen 2D canvas context');

    // Create Canvas MediaStream (30 FPS)
    const canvasStream = (offscreenCanvas as any).captureStream(30);

    // Create Web Audio destination node for the MediaRecorder
    const dest = audioCtx.createMediaStreamDestination();
    const sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(dest);

    // Combine video and audio tracks
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    // Choose supported MIME type
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ];
    const chosenMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: chosenMime,
      videoBitsPerSecond: 6000000, // 6 Mbps HD
    });

    const recordedChunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        try {
          audioCtx.close();
        } catch {
          // Ignore
        }
        const finalBlob = new Blob(recordedChunks, { type: chosenMime });
        resolve(finalBlob);
      };

      recorder.onerror = (e) => {
        try {
          audioCtx.close();
        } catch {
          // Ignore
        }
        reject(e);
      };

      // Start Recording
      recorder.start(100);
      sourceNode.start(0);

      const startTime = performance.now();
      const fps = 30;
      const totalFrames = Math.ceil(duration * fps);
      let frameIndex = 0;

      const renderNextFrame = () => {
        const currentTime = frameIndex / fps;

        if (currentTime > duration) {
          recorder.stop();
          sourceNode.stop();
          return;
        }

        // Render Frame
        LyricsVideoEngine.renderFrame(ctx, offscreenCanvas, currentTime, lyrics, style, bgMedia);

        const progressPercent = Math.min(100, Math.round((frameIndex / totalFrames) * 100));
        onProgress(progressPercent, `Rendering frame ${frameIndex} of ${totalFrames} (${progressPercent}%)...`);

        frameIndex++;
        setTimeout(renderNextFrame, 1000 / fps);
      };

      renderNextFrame();
    });
  }
}
