export interface LyricLine {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export interface LyricsVideoStyle {
  placement: 'top' | 'middle' | 'bottom';
  fontFamily: 'Inter' | 'Playfair Display' | 'Cabinet Grotesk' | 'Space Mono' | 'Pacifico';
  fontSize: number; // in px on 1080p canvas
  fontWeight: 'normal' | '600' | '800';
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

      for (const t of timestamps) {
        result.push({
          id: Math.random().toString(36).substring(2, 9),
          start: t,
          end: t + 3.5, // temporary end
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
   * Generates synthetic audio tone buffer for demo tracks
   */
  static async createDemoAudio(trackId: string): Promise<{ blob: Blob; duration: number }> {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const sampleRate = 44100;
    const duration = trackId === 'lofi-sunset' ? 18 : trackId === 'cyber-synth' ? 16 : 14;
    const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

    // Build gentle chord progression
    const chords = [
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

    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer to WAV Blob
    const wavBlob = this.audioBufferToWav(renderedBuffer);
    return { blob: wavBlob, duration };
  }

  /**
   * Helper: AudioBuffer to WAV Blob
   */
  private static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const length = buffer.length * numChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

    // RIFF chunk
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    this.writeString(view, 8, 'WAVE');

    // fmt subchunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);

    // data subchunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, length, true);

    // Interleave channels
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
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

      // Typography
      const scaledFontSize = Math.round((style.fontSize / 1080) * height);
      ctx.font = `${style.fontWeight} ${scaledFontSize}px ${style.fontFamily}, sans-serif`;

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
        // Neon Flash Pulse
        const flashGlow = style.glowIntensity * (1 + Math.sin(currentTime * 6) * 0.5);
        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = flashGlow;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(text, textX, textY);

      } else {
        // Cinematic Smooth Fade
        const alpha = Math.min(1, progress * 4);
        ctx.globalAlpha = alpha;
        ctx.shadowColor = style.glowColor;
        ctx.shadowBlur = style.glowIntensity;
        ctx.fillStyle = style.activeColor;
        ctx.fillText(text, textX, textY);
      }

      ctx.restore();

      // Draw Previous & Next Lines as subtle secondary text
      if (style.placement === 'middle') {
        const subFontSize = Math.round(scaledFontSize * 0.65);
        ctx.font = `normal ${subFontSize}px ${style.fontFamily}, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `${style.textColor}55`;

        if (activeIndex > 0) {
          ctx.fillText(lyrics[activeIndex - 1].text, width / 2, targetCenterY - scaledFontSize * 1.5);
        }
        if (activeIndex < lyrics.length - 1) {
          ctx.fillText(lyrics[activeIndex + 1].text, width / 2, targetCenterY + scaledFontSize * 1.5);
        }
      }
    } else {
      // Idle / Interlude Text with classical musical note icon
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const scaledFontSize = Math.round((style.fontSize / 1080) * height * 0.7);
      ctx.font = `600 ${scaledFontSize}px ${style.fontFamily}, sans-serif`;
      ctx.fillStyle = `${style.textColor}66`;
      ctx.shadowColor = style.glowColor;
      ctx.shadowBlur = 6;
      ctx.fillText('♪ ♫ ♪', width / 2, targetCenterY);
      ctx.restore();
    }
  }

  /**
   * Export Lyrics Video to MP4/WebM using MediaRecorder
   */
  static async exportVideo(
    canvas: HTMLCanvasElement,
    audioBlob: Blob,
    lyrics: LyricLine[],
    style: LyricsVideoStyle,
    bgMedia: { image?: HTMLImageElement | null; video?: HTMLVideoElement | null; preset?: BackgroundPreset['type'] },
    totalDuration: number,
    onProgress: (percent: number, message: string) => void
  ): Promise<Blob> {
    onProgress(5, 'Preparing audio & canvas rendering stream...');

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();

    try {
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);

      const streamDestination = audioCtx.createMediaStreamDestination();
      const audioSource = audioCtx.createBufferSource();
      audioSource.buffer = audioBuffer;
      audioSource.connect(streamDestination);

      // Canvas capture stream at 30 fps
      const canvasStream = canvas.captureStream(30);
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...streamDestination.stream.getAudioTracks(),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      return new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const finalBlob = new Blob(chunks, { type: 'video/webm' });
          audioCtx.close().catch(() => {});
          resolve(finalBlob);
        };

        recorder.onerror = (err) => {
          audioCtx.close().catch(() => {});
          reject(err);
        };

        recorder.start(100);
        audioSource.start();

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          recorder.stop();
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }

        const startTime = performance.now();
        const durationMs = totalDuration * 1000;

        const animateLoop = () => {
          const elapsed = (performance.now() - startTime) / 1000;

          if (elapsed >= totalDuration) {
            onProgress(100, 'Finalizing video packaging...');
            recorder.stop();
            return;
          }

          LyricsVideoEngine.renderFrame(ctx, canvas, elapsed, lyrics, style, bgMedia);
          const percent = Math.min(99, Math.round((elapsed / totalDuration) * 95));
          onProgress(percent, `Rendering frame: ${Math.round(elapsed)}s / ${Math.round(totalDuration)}s...`);

          requestAnimationFrame(animateLoop);
        };

        requestAnimationFrame(animateLoop);
      });
    } catch (err) {
      audioCtx.close().catch(() => {});
      throw err;
    }
  }
}
