import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Activity, BarChart2, Radio, Volume2, Sparkles } from 'lucide-react';

interface AudioVisualizerScreenProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  gainDb?: number;
  sourceLabel?: string;
  className?: string;
}

type VisualizerMode = 'wave' | 'bars' | 'cyber';

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

    // Connect to AudioContext if not already connected to this element
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

        // Only createMediaElementSource once per audio element
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
          // If already connected or CORS prevented, keep going with visual synthesis
          console.debug('WebAudio connection:', err);
        }
      } catch (err) {
        console.debug('AudioContext initialization error:', err);
      }
    }
  }, [audioElement]);

  // Handle AudioContext resume on play
  useEffect(() => {
    if (isPlaying && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
  }, [isPlaying]);

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

      // Clear Screen with deep sci-fi canvas gradient
      ctx.fillStyle = '#060913';
      ctx.fillRect(0, 0, width, height);

      // Draw Screen Grid Lines
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;

      const gridSize = 24;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Center Reference Baseline
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
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
          // Resting animated harmonic wave when paused/idle
          for (let i = 0; i < bufferLength; i++) {
            const v = isPlaying
              ? 128 + Math.sin(i * 0.15 + phase) * 28 + Math.cos(i * 0.08 - phase * 1.5) * 16
              : 128 + Math.sin(i * 0.08 + phase * 0.3) * 6;
            timeData[i] = v;
          }
        }

        // Draw filled glow area under the wave
        const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
        gradientFill.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        gradientFill.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
        gradientFill.addColorStop(1, 'rgba(6, 9, 19, 0)');

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

        // Draw the glowing sharp waveform stroke
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

        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = isPlaying ? 16 : 6;
        ctx.strokeStyle = isPlaying ? '#38BDF8' : '#64748B';
        ctx.lineWidth = isPlaying ? 2.5 : 1.5;
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

        // Initialize peak caps if size changed
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

          // Bar Gradient (cyan -> indigo -> emerald top)
          const barGrad = ctx.createLinearGradient(0, height, 0, barY);
          barGrad.addColorStop(0, '#0284C7');
          barGrad.addColorStop(0.6, '#38BDF8');
          barGrad.addColorStop(1, '#34D399');

          ctx.fillStyle = isPlaying ? barGrad : '#334155';
          ctx.beginPath();
          ctx.roundRect(barX, barY, totalBarWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();

          // Peak hold cap
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
        // MODE 3: DUAL CYBER MIRRORED SINE HARMONICS
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

        // Top and Bottom Mirrored Waves
        ctx.beginPath();
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const deviation = ((timeData[i] - 128) / 128.0) * (height * 0.38);
          const y = centerY - Math.abs(deviation);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }

        ctx.strokeStyle = isPlaying ? '#EC4899' : '#64748B';
        ctx.shadowColor = '#EC4899';
        ctx.shadowBlur = isPlaying ? 12 : 4;
        ctx.lineWidth = 2;
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

        ctx.strokeStyle = isPlaying ? '#38BDF8' : '#475569';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = isPlaying ? 12 : 4;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Draw Scanline CRT Overlay Effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      for (let y = 0; y < height; y += 3) {
        ctx.fillRect(0, y, width, 1);
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
  }, [isPlaying, mode]);

  // Handle ResizeObserver for Retina pixel density
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
        
        {/* Left Status & Channel Details */}
        <div className="flex items-center gap-2.5 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]' : 'bg-slate-500'}`} />
            <span className={`font-bold tracking-wider uppercase text-[10px] ${isPlaying ? 'text-emerald-400' : 'text-slate-400'}`}>
              {isPlaying ? 'LIVE MONITOR' : 'MONITOR STANDBY'}
            </span>
          </div>

          <span className="text-slate-600 dark:text-slate-500">|</span>

          <span className="text-slate-300 font-medium truncate max-w-[140px] sm:max-w-xs">
            {sourceLabel}
          </span>

          {gainDb !== 0 && (
            <span className="hidden sm:inline-flex items-center rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.2 text-[9px] font-bold">
              {gainDb > 0 ? `+${gainDb}` : gainDb} dB
            </span>
          )}
        </div>

        {/* Right Mode Switchers */}
        <div className="flex items-center gap-1 bg-[#050711] p-1 rounded-lg border border-slate-800 dark:border-white/10">
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

      </div>

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
          className={`absolute inset-0 flex items-center justify-center transition-all duration-200 ${
            !isPlaying || isHovered
              ? 'bg-black/30 backdrop-blur-[1px] opacity-100'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 rounded-full bg-slate-900/90 hover:bg-sky-600 border border-sky-400/40 px-4 py-2 text-white shadow-xl transition-all group-hover:scale-105">
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-white" />
                <span className="text-xs font-mono font-bold tracking-wider">PAUSE MONITOR</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white ml-0.5" />
                <span className="text-xs font-mono font-bold tracking-wider">CLICK TO PLAY & ANIMATE</span>
              </>
            )}
          </div>
        </div>

        {/* Micro HUD Watermark Details */}
        <div className="absolute bottom-2 left-3 pointer-events-none font-mono text-[9px] text-slate-500/80 flex items-center gap-3">
          <span>48.0 kHz · Float32 PCM</span>
          <span>CH1 / CH2 MASTER</span>
        </div>

        <div className="absolute bottom-2 right-3 pointer-events-none font-mono text-[9px] text-sky-400/80 flex items-center gap-1.5">
          <Sparkles className="h-2.5 w-2.5" />
          <span>WASM Audio Core</span>
        </div>
      </div>

    </div>
  );
};
