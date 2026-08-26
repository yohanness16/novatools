import React, { useEffect, useRef, useState } from 'react';
import { 
  Play, 
  Pause, 
  Activity, 
  BarChart2, 
  Radio, 
  Sparkles,
  Sliders,
  Palette,
  ChevronDown,
  ChevronUp,
  Check
} from 'lucide-react';

export interface VisualizerCustomSettings {
  colorPalette: 'sky' | 'emerald' | 'sunset' | 'violet' | 'crimson' | 'ice';
  thickness: 1.5 | 2.5 | 4;
  glowLevel: 0 | 8 | 16 | 24;
  gridStyle: 'scanlines' | 'matrix' | 'dots' | 'none';
  bgTheme: 'cyber' | 'space' | 'slate';
}

interface AudioVisualizerScreenProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  gainDb?: number;
  sourceLabel?: string;
  className?: string;
}

type VisualizerMode = 'wave' | 'bars' | 'cyber';

const COLOR_PALETTES = [
  { id: 'sky', name: 'Electric Sky', primary: '#38BDF8', secondary: '#6366F1', accent: '#34D399' },
  { id: 'emerald', name: 'Cyber Matrix', primary: '#10B981', secondary: '#06B6D4', accent: '#38BDF8' },
  { id: 'sunset', name: 'Golden Sunset', primary: '#F59E0B', secondary: '#F43F5E', accent: '#FB923C' },
  { id: 'violet', name: 'Royal Neon', primary: '#A855F7', secondary: '#EC4899', accent: '#38BDF8' },
  { id: 'crimson', name: 'Cyber Red', primary: '#EF4444', secondary: '#F97316', accent: '#FBBF24' },
  { id: 'ice', name: 'Arctic Ice', primary: '#E0F2FE', secondary: '#38BDF8', accent: '#818CF8' },
];

export const AudioVisualizerScreen: React.FC<AudioVisualizerScreenProps> = ({
  audioElement,
  isPlaying,
  onTogglePlay,
  gainDb = 0,
  sourceLabel = 'Active Channel',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('wave');
  const [isHovered, setIsHovered] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Visualizer customization state
  const [settings, setSettings] = useState<VisualizerCustomSettings>({
    colorPalette: 'sky',
    thickness: 2.5,
    glowLevel: 16,
    gridStyle: 'scanlines',
    bgTheme: 'cyber',
  });

  // Web Audio Nodes refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const peakCapsRef = useRef<number[]>([]);

  // Initialize Web Audio API Analyser
  useEffect(() => {
    if (!audioElement) return;

    if (connectedElementRef.current !== audioElement) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContextClass();
        }

        const audioCtx = audioCtxRef.current;
        if (!analyserRef.current) {
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.82;
          analyserRef.current = analyser;
        }

        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.disconnect();
          } catch (e) {
            // ignore
          }
        }

        try {
          const source = audioCtx.createMediaElementSource(audioElement);
          source.connect(analyserRef.current);
          analyserRef.current.connect(audioCtx.destination);
          sourceNodeRef.current = source;
          connectedElementRef.current = audioElement;
        } catch (err) {
          console.debug('WebAudio connection state:', err);
        }
      } catch (err) {
        console.debug('AudioContext initialization note:', err);
      }
    }
  }, [audioElement]);

  // Handle AudioContext resume on play
  useEffect(() => {
    if (isPlaying && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [isPlaying]);

  // Active color palette
  const activePalette = COLOR_PALETTES.find((p) => p.id === settings.colorPalette) || COLOR_PALETTES[0];

  // Render visualizer animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.save();
      ctx.scale(dpr, dpr);

      // Background theme
      let bgColor = '#060913';
      if (settings.bgTheme === 'space') bgColor = '#030712';
      if (settings.bgTheme === 'slate') bgColor = '#0B1120';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Grid Styles
      if (settings.gridStyle === 'scanlines' || settings.gridStyle === 'matrix') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 24;

        if (settings.gridStyle === 'matrix') {
          for (let x = 0; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      } else if (settings.gridStyle === 'dots') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        for (let x = 12; x < width; x += 24) {
          for (let y = 12; y < height; y += 24) {
            ctx.fillRect(x, y, 1.5, 1.5);
          }
        }
      }

      // Draw Center Baseline Reference
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const analyser = analyserRef.current;
      const hasRealAudio = isPlaying && analyser;

      if (mode === 'wave') {
        // ==========================================
        // MODE 1: OSCILLOSCOPE TIME-DOMAIN WAVEFORM
        // ==========================================
        const bufferLength = analyser ? analyser.frequencyBinCount : 128;
        const timeData = new Uint8Array(bufferLength);

        if (hasRealAudio) {
          analyser.getByteTimeDomainData(timeData);
        } else {
          for (let i = 0; i < bufferLength; i++) {
            const v = isPlaying
              ? 128 + Math.sin(i * 0.15 + phase) * 28 + Math.cos(i * 0.08 - phase * 1.5) * 16
              : 128 + Math.sin(i * 0.08 + phase * 0.3) * 5;
            timeData[i] = v;
          }
        }

        // Fill glow gradient under wave
        const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
        gradientFill.addColorStop(0, `${activePalette.primary}33`);
        gradientFill.addColorStop(0.5, `${activePalette.secondary}1A`);
        gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.moveTo(0, height / 2);

        const sliceWidth = width / (bufferLength - 1);
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradientFill;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.shadowColor = activePalette.primary;
        ctx.shadowBlur = isPlaying ? settings.glowLevel : Math.min(settings.glowLevel, 6);
        ctx.strokeStyle = isPlaying ? activePalette.primary : '#64748B';
        ctx.lineWidth = settings.thickness;
        ctx.stroke();
        ctx.shadowBlur = 0;

      } else if (mode === 'bars') {
        // ==========================================
        // MODE 2: FREQUENCY SPECTRUM EQUALIZER BARS
        // ==========================================
        const numBars = 48;
        const freqData = new Uint8Array(numBars);

        if (hasRealAudio) {
          const fullFreq = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(fullFreq);
          const step = Math.floor(fullFreq.length / numBars);
          for (let i = 0; i < numBars; i++) {
            freqData[i] = fullFreq[i * step];
          }
        } else {
          for (let i = 0; i < numBars; i++) {
            freqData[i] = isPlaying
              ? Math.max(10, Math.floor(Math.abs(Math.sin(i * 0.25 + phase * 2)) * 180 + Math.random() * 40))
              : Math.max(4, Math.floor(Math.abs(Math.sin(i * 0.15 + phase * 0.5)) * 25));
          }
        }

        if (peakCapsRef.current.length !== numBars) {
          peakCapsRef.current = new Array(numBars).fill(0);
        }

        const barGap = 3;
        const totalBarWidth = (width - (numBars + 1) * barGap) / numBars;
        const maxBarHeight = height * 0.78;

        for (let i = 0; i < numBars; i++) {
          const barHeight = (freqData[i] / 255) * maxBarHeight;
          const barX = barGap + i * (totalBarWidth + barGap);
          const barY = height - barHeight - 12;

          const barGrad = ctx.createLinearGradient(0, height, 0, barY);
          barGrad.addColorStop(0, activePalette.secondary);
          barGrad.addColorStop(0.6, activePalette.primary);
          barGrad.addColorStop(1, activePalette.accent);

          ctx.fillStyle = isPlaying ? barGrad : '#334155';
          ctx.beginPath();
          ctx.roundRect(barX, barY, totalBarWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          if (barHeight > (peakCapsRef.current[i] || 0)) {
            peakCapsRef.current[i] = barHeight;
          } else {
            peakCapsRef.current[i] = Math.max(0, (peakCapsRef.current[i] || 0) - 1.2);
          }

          const capY = height - peakCapsRef.current[i] - 14;
          ctx.fillStyle = isPlaying ? '#F8FAFC' : '#475569';
          ctx.fillRect(barX, Math.max(8, capY), totalBarWidth, 2);
        }

      } else {
        // ==========================================
        // MODE 3: DUAL CYBER HARMONIC WAVES
        // ==========================================
        const bufferLength = analyser ? analyser.frequencyBinCount : 128;
        const timeData = new Uint8Array(bufferLength);

        if (hasRealAudio) {
          analyser.getByteTimeDomainData(timeData);
        } else {
          for (let i = 0; i < bufferLength; i++) {
            timeData[i] = isPlaying
              ? 128 + Math.sin(i * 0.2 + phase * 2.5) * 35
              : 128 + Math.sin(i * 0.1 + phase * 0.4) * 8;
          }
        }

        const centerY = height / 2;
        const sliceWidth = width / (bufferLength - 1);

        // Top wave
        ctx.beginPath();
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const deviation = ((timeData[i] - 128) / 128.0) * (height * 0.38);
          const y = centerY - Math.abs(deviation);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.strokeStyle = isPlaying ? activePalette.secondary : '#64748B';
        ctx.shadowColor = activePalette.secondary;
        ctx.shadowBlur = isPlaying ? settings.glowLevel : 4;
        ctx.lineWidth = settings.thickness;
        ctx.stroke();

        // Bottom wave
        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const deviation = ((timeData[i] - 128) / 128.0) * (height * 0.38);
          const y = centerY + Math.abs(deviation);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.strokeStyle = isPlaying ? activePalette.primary : '#475569';
        ctx.shadowColor = activePalette.primary;
        ctx.shadowBlur = isPlaying ? settings.glowLevel : 4;
        ctx.lineWidth = settings.thickness;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Scanline overlay
      if (settings.gridStyle === 'scanlines') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        for (let y = 0; y < height; y += 3) {
          ctx.fillRect(0, y, width, 1);
        }
      }

      ctx.restore();

      phase += isPlaying ? 0.08 : 0.02;
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, mode, settings, activePalette]);

  // Handle ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div className={`w-full overflow-hidden rounded-xl border border-slate-700/60 dark:border-white/15 bg-[#060913] shadow-2xl shadow-cyan-950/30 ${className}`}>
      
      {/* Screen Monitor Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 dark:border-white/10 px-3.5 py-2 bg-[#090E1F]/90 backdrop-blur-md">
        
        {/* Left Status & Channel Details (No Text Pulsing Animations) */}
        <div className="flex items-center gap-2.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span className={`font-semibold tracking-wider uppercase text-[10px] ${isPlaying ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isPlaying ? 'ACTIVE MONITOR' : 'STANDBY'}
            </span>
          </div>

          <span className="text-slate-600 dark:text-slate-500">|</span>

          <span className="text-slate-300 font-medium truncate max-w-[120px] sm:max-w-xs">
            {sourceLabel}
          </span>

          {gainDb !== 0 && (
            <span className="hidden sm:inline-flex items-center rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 text-[9px] font-bold">
              {gainDb > 0 ? `+${gainDb}` : gainDb} dB
            </span>
          )}
        </div>

        {/* Right Actions: Mode Switchers & Customize Toggle */}
        <div className="flex items-center gap-1.5">
          
          {/* Mode Switchers */}
          <div className="flex items-center gap-1 bg-[#050711] p-0.5 rounded-lg border border-slate-800 dark:border-white/10">
            <button
              onClick={() => setMode('wave')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                mode === 'wave'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Oscilloscope Waveform"
              aria-label="Oscilloscope Waveform"
            >
              <Activity className="h-3 w-3" />
              <span className="hidden sm:inline">Wave</span>
            </button>

            <button
              onClick={() => setMode('bars')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                mode === 'bars'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Frequency Spectrum Bars"
              aria-label="Frequency Spectrum Bars"
            >
              <BarChart2 className="h-3 w-3" />
              <span className="hidden sm:inline">Spectrum</span>
            </button>

            <button
              onClick={() => setMode('cyber')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors ${
                mode === 'cyber'
                  ? 'bg-sky-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Harmonic Cyber Pulse"
              aria-label="Harmonic Cyber Pulse"
            >
              <Radio className="h-3 w-3" />
              <span className="hidden sm:inline">Cyber</span>
            </button>
          </div>

          {/* Customize Tool Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono transition-colors ${
              showSettings
                ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                : 'bg-[#050711] border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Customize Colors & Wave Settings"
          >
            <Palette className="h-3 w-3" />
            <span className="hidden md:inline">Customize</span>
            {showSettings ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>

        </div>

      </div>

      {/* Collapsible Customize Settings Panel */}
      {showSettings && (
        <div className="border-b border-slate-800 bg-[#0A0F1E] p-3 space-y-3 animate-fade-in text-xs font-mono">
          
          {/* Color Palettes Selection */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-400 font-semibold block">Color Palette:</span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PALETTES.map((palette) => {
                const isSelected = settings.colorPalette === palette.id;
                return (
                  <button
                    key={palette.id}
                    onClick={() => setSettings({ ...settings, colorPalette: palette.id as any })}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-500/15 text-white'
                        : 'border-slate-800 bg-[#050711] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
                    />
                    <span className="text-[10px] truncate">{palette.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls Grid (Thickness, Glow, Grid, BG) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            
            {/* Wave Line Thickness */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Line Thickness</span>
              <div className="flex items-center rounded bg-[#050711] p-0.5 border border-slate-800">
                {[
                  { label: 'Fine', val: 1.5 },
                  { label: 'Normal', val: 2.5 },
                  { label: 'Bold', val: 4 },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setSettings({ ...settings, thickness: t.val as any })}
                    className={`flex-1 py-0.5 text-[10px] rounded transition-colors ${
                      settings.thickness === t.val ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Glow Intensity */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Glow Level</span>
              <div className="flex items-center rounded bg-[#050711] p-0.5 border border-slate-800">
                {[
                  { label: 'Off', val: 0 },
                  { label: 'Soft', val: 8 },
                  { label: 'High', val: 16 },
                  { label: 'Max', val: 24 },
                ].map((g) => (
                  <button
                    key={g.val}
                    onClick={() => setSettings({ ...settings, glowLevel: g.val as any })}
                    className={`flex-1 py-0.5 text-[10px] rounded transition-colors ${
                      settings.glowLevel === g.val ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Screen Grid Style */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Grid Overlay</span>
              <div className="flex items-center rounded bg-[#050711] p-0.5 border border-slate-800">
                {[
                  { label: 'CRT', val: 'scanlines' },
                  { label: 'Mesh', val: 'matrix' },
                  { label: 'Dots', val: 'dots' },
                  { label: 'None', val: 'none' },
                ].map((gr) => (
                  <button
                    key={gr.val}
                    onClick={() => setSettings({ ...settings, gridStyle: gr.val as any })}
                    className={`flex-1 py-0.5 text-[10px] rounded transition-colors ${
                      settings.gridStyle === gr.val ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {gr.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Screen Backdrop Theme */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400">Screen BG</span>
              <div className="flex items-center rounded bg-[#050711] p-0.5 border border-slate-800">
                {[
                  { label: 'Cyber', val: 'cyber' },
                  { label: 'Space', val: 'space' },
                  { label: 'Slate', val: 'slate' },
                ].map((bg) => (
                  <button
                    key={bg.val}
                    onClick={() => setSettings({ ...settings, bgTheme: bg.val as any })}
                    className={`flex-1 py-0.5 text-[10px] rounded transition-colors ${
                      settings.bgTheme === bg.val ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Screen Canvas Box with Hover Overlay Play/Pause Button */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onTogglePlay}
        className="relative w-full h-40 sm:h-48 cursor-pointer select-none overflow-hidden group"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Center Hover / Play Indicator Overlay */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
            !isPlaying || isHovered
              ? 'bg-black/30 backdrop-blur-[1px] opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 hover:bg-sky-600 border border-sky-400/40 px-4 py-2 text-white shadow-xl transition-transform group-hover:scale-105">
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-white" />
                <span className="text-xs font-mono font-bold tracking-wider">PAUSE MONITOR</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white ml-0.5" />
                <span className="text-xs font-mono font-bold tracking-wider">PLAY & MONITOR</span>
              </>
            )}
          </div>
        </div>

        {/* Micro HUD Watermark Details */}
        <div className="absolute bottom-2 left-3 pointer-events-none font-mono text-[9px] text-slate-500/80 flex items-center gap-3">
          <span>48.0 kHz · Float32 PCM</span>
          <span>CH1 / CH2 STEREO</span>
        </div>

        <div className="absolute bottom-2 right-3 pointer-events-none font-mono text-[9px] text-sky-400/80 flex items-center gap-1.5">
          <Sparkles className="h-2.5 w-2.5" />
          <span>WASM Audio Core</span>
        </div>
      </div>

    </div>
  );
};
