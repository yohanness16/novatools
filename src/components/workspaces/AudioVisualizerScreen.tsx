import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Activity,
  BarChart2,
  Radio,
  Sparkles,
  Palette,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface VisualizerCustomSettings {
  colorPalette: 'gold' | 'amber' | 'emerald' | 'crimson' | 'ice';
  thickness: 1.5 | 2.5 | 4;
  glowLevel: 0 | 8 | 16 | 24;
  gridStyle: 'scanlines' | 'matrix' | 'dots' | 'none';
  bgTheme: 'obsidian' | 'espresso' | 'charcoal';
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
  { id: 'gold', name: 'Studio Yellow', primary: '#FACC15', secondary: '#EAB308', accent: '#FEF08A' },
  { id: 'amber', name: 'Warm Sunset', primary: '#F59E0B', secondary: '#EA580C', accent: '#FDE047' },
  { id: 'emerald', name: 'Emerald Signal', primary: '#10B981', secondary: '#059669', accent: '#FACC15' },
  { id: 'crimson', name: 'Crimson Meter', primary: '#EF4444', secondary: '#F97316', accent: '#FACC15' },
  { id: 'ice', name: 'Bone White', primary: '#FAF7F0', secondary: '#D6CFC0', accent: '#FACC15' },
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

  const [settings, setSettings] = useState<VisualizerCustomSettings>({
    colorPalette: 'gold',
    thickness: 2.5,
    glowLevel: 16,
    gridStyle: 'scanlines',
    bgTheme: 'obsidian',
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const peakCapsRef = useRef<number[]>([]);

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
          } catch {
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

  useEffect(() => {
    if (isPlaying && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [isPlaying]);

  const activePalette = COLOR_PALETTES.find((p) => p.id === settings.colorPalette) || COLOR_PALETTES[0];

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

      let bgColor = '#141311';
      if (settings.bgTheme === 'espresso') bgColor = '#1C1814';
      if (settings.bgTheme === 'charcoal') bgColor = '#0E0D0B';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      if (settings.gridStyle === 'scanlines' || settings.gridStyle === 'matrix') {
        ctx.strokeStyle = 'rgba(250, 247, 240, 0.05)';
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
        ctx.fillStyle = 'rgba(250, 247, 240, 0.09)';
        for (let x = 12; x < width; x += 24) {
          for (let y = 12; y < height; y += 24) {
            ctx.fillRect(x, y, 1.5, 1.5);
          }
        }
      }

      ctx.strokeStyle = 'rgba(250, 247, 240, 0.1)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const analyser = analyserRef.current;
      const hasRealAudio = isPlaying && analyser;

      if (mode === 'wave') {
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

        const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
        gradientFill.addColorStop(0, `${activePalette.primary}33`);
        gradientFill.addColorStop(0.5, `${activePalette.secondary}1A`);
        gradientFill.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        const sliceWidth = width / (bufferLength - 1);
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = gradientFill;
        ctx.fill();

        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.shadowColor = activePalette.primary;
        ctx.shadowBlur = isPlaying ? settings.glowLevel : Math.min(settings.glowLevel, 6);
        ctx.strokeStyle = isPlaying ? activePalette.primary : '#746D61';
        ctx.lineWidth = settings.thickness;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === 'bars') {
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

          ctx.fillStyle = isPlaying ? barGrad : '#454038';
          ctx.beginPath();
          ctx.roundRect(barX, barY, totalBarWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          if (barHeight > (peakCapsRef.current[i] || 0)) {
            peakCapsRef.current[i] = barHeight;
          } else {
            peakCapsRef.current[i] = Math.max(0, (peakCapsRef.current[i] || 0) - 1.2);
          }

          const capY = height - peakCapsRef.current[i] - 14;
          ctx.fillStyle = isPlaying ? '#FAF7F0' : '#746D61';
          ctx.fillRect(barX, Math.max(8, capY), totalBarWidth, 2);
        }
      } else {
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

        ctx.beginPath();
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const deviation = ((timeData[i] - 128) / 128.0) * (height * 0.38);
          const y = centerY - Math.abs(deviation);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.strokeStyle = isPlaying ? activePalette.secondary : '#746D61';
        ctx.shadowColor = activePalette.secondary;
        ctx.shadowBlur = isPlaying ? settings.glowLevel : 4;
        ctx.lineWidth = settings.thickness;
        ctx.stroke();

        ctx.beginPath();
        x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const deviation = ((timeData[i] - 128) / 128.0) * (height * 0.38);
          const y = centerY + Math.abs(deviation);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.strokeStyle = isPlaying ? activePalette.primary : '#454038';
        ctx.shadowColor = activePalette.primary;
        ctx.shadowBlur = isPlaying ? settings.glowLevel : 4;
        ctx.lineWidth = settings.thickness;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

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
    <div className={`w-full overflow-hidden rounded-2xl border border-[#141413] bg-[#141311] shadow-window ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-2.5 bg-[#1C1A16]">
        <div className="flex items-center gap-2.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-[#4ADE80]' : 'bg-[#746D61]'}`} />
            <span className={`font-bold tracking-wider uppercase text-[10px] ${isPlaying ? 'text-[#4ADE80]' : 'text-[#938B7D]'}`}>
              {isPlaying ? 'ACTIVE MONITOR' : 'STANDBY'}
            </span>
          </div>

          <span className="text-white/20">|</span>

          <span className="text-[#FAF7F0] font-semibold truncate max-w-[140px] sm:max-w-xs">
            {sourceLabel}
          </span>

          {gainDb !== 0 && (
            <span className="hidden sm:inline-flex items-center rounded-full bg-[#FACC15] text-[#141413] px-2 py-0.5 text-[9px] font-bold">
              {gainDb > 0 ? `+${gainDb}` : gainDb} dB
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1 bg-[#0E0D0B] p-0.5 rounded-lg border border-white/10">
            {[
              { id: 'wave', label: 'Wave', icon: Activity },
              { id: 'bars', label: 'Spectrum', icon: BarChart2 },
              { id: 'cyber', label: 'Dual', icon: Radio },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setMode(item.id as VisualizerMode)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    mode === item.id
                      ? 'bg-[#FACC15] text-[#141413]'
                      : 'text-[#938B7D] hover:text-[#FAF7F0]'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
              showSettings
                ? 'bg-[#FACC15]/20 border-[#FACC15] text-[#FACC15]'
                : 'bg-[#0E0D0B] border-white/10 text-[#938B7D] hover:text-[#FAF7F0]'
            }`}
          >
            <Palette className="h-3 w-3" />
            <span className="hidden md:inline">Style</span>
            {showSettings ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="border-b border-white/10 bg-[#181612] p-3.5 space-y-3 text-xs font-mono">
          <div className="space-y-1.5">
            <span className="text-[11px] text-[#938B7D] font-semibold block">Color Palette:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {COLOR_PALETTES.map((palette) => {
                const isSelected = settings.colorPalette === palette.id;
                return (
                  <button
                    key={palette.id}
                    onClick={() => setSettings({ ...settings, colorPalette: palette.id as any })}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FACC15] bg-[#FACC15]/15 text-[#FAF7F0]'
                        : 'border-white/10 bg-[#0E0D0B] text-[#938B7D] hover:border-white/25'
                    }`}
                  >
                    <div
                      className="h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})` }}
                    />
                    <span className="text-[10px] truncate">{palette.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="space-y-1">
              <span className="text-[10px] text-[#938B7D]">Line Thickness</span>
              <div className="flex items-center rounded-lg bg-[#0E0D0B] p-0.5 border border-white/10">
                {[
                  { label: 'Fine', val: 1.5 },
                  { label: 'Normal', val: 2.5 },
                  { label: 'Bold', val: 4 },
                ].map((t) => (
                  <button
                    key={t.val}
                    onClick={() => setSettings({ ...settings, thickness: t.val as any })}
                    className={`flex-1 py-1 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                      settings.thickness === t.val ? 'bg-[#FACC15] text-[#141413]' : 'text-[#938B7D] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#938B7D]">Glow Level</span>
              <div className="flex items-center rounded-lg bg-[#0E0D0B] p-0.5 border border-white/10">
                {[
                  { label: 'Off', val: 0 },
                  { label: 'Soft', val: 8 },
                  { label: 'High', val: 16 },
                  { label: 'Max', val: 24 },
                ].map((g) => (
                  <button
                    key={g.val}
                    onClick={() => setSettings({ ...settings, glowLevel: g.val as any })}
                    className={`flex-1 py-1 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                      settings.glowLevel === g.val ? 'bg-[#FACC15] text-[#141413]' : 'text-[#938B7D] hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#938B7D]">Grid Overlay</span>
              <div className="flex items-center rounded-lg bg-[#0E0D0B] p-0.5 border border-white/10">
                {[
                  { label: 'CRT', val: 'scanlines' },
                  { label: 'Mesh', val: 'matrix' },
                  { label: 'Dots', val: 'dots' },
                  { label: 'None', val: 'none' },
                ].map((gr) => (
                  <button
                    key={gr.val}
                    onClick={() => setSettings({ ...settings, gridStyle: gr.val as any })}
                    className={`flex-1 py-1 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                      settings.gridStyle === gr.val ? 'bg-[#FACC15] text-[#141413]' : 'text-[#938B7D] hover:text-white'
                    }`}
                  >
                    {gr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[#938B7D]">Screen BG</span>
              <div className="flex items-center rounded-lg bg-[#0E0D0B] p-0.5 border border-white/10">
                {[
                  { label: 'Obsidian', val: 'obsidian' },
                  { label: 'Espresso', val: 'espresso' },
                  { label: 'Deep', val: 'charcoal' },
                ].map((bg) => (
                  <button
                    key={bg.val}
                    onClick={() => setSettings({ ...settings, bgTheme: bg.val as any })}
                    className={`flex-1 py-1 text-[10px] rounded font-bold transition-colors cursor-pointer ${
                      settings.bgTheme === bg.val ? 'bg-[#FACC15] text-[#141413]' : 'text-[#938B7D] hover:text-white'
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

      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onTogglePlay}
        className="relative w-full h-40 sm:h-48 cursor-pointer select-none overflow-hidden group"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${
            !isPlaying || isHovered ? 'bg-black/35 opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="nt-btn-yellow flex items-center gap-2 px-4 py-2 text-xs font-mono">
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-current" />
                <span>PAUSE MONITOR</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current ml-0.5" />
                <span>PLAY & MONITOR</span>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-2 left-3 pointer-events-none font-mono text-[9px] text-[#938B7D] flex items-center gap-3">
          <span>48.0 kHz · Float32 PCM</span>
          <span>CH1 / CH2 STEREO</span>
        </div>

        <div className="absolute bottom-2 right-3 pointer-events-none font-mono text-[9px] text-[#FACC15] flex items-center gap-1.5">
          <Sparkles className="h-2.5 w-2.5" />
          <span>Local DSP Core</span>
        </div>
      </div>
    </div>
  );
};
