import React, { useState, useRef, useEffect } from 'react';
import type { SynthesizedAudioResult } from '../../../engines/ttsTypes';
import { cuesToSrt } from '../../../engines/ttsEngine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  FileText, 
  Music, 
  Check, 
  Sparkles, 
  Volume2,
  Share2
} from 'lucide-react';

interface AudioPlayerCardProps {
  result: SynthesizedAudioResult | null;
  voiceName: string;
  voiceFlag: string;
}

export const AudioPlayerCard: React.FC<AudioPlayerCardProps> = ({
  result,
  voiceName,
  voiceFlag,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (result?.url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = result.url;
        audioRef.current.load();
      }
      setCurrentTime(0);
      setIsPlaying(false);
      setDuration(result.duration || 0);
    }
  }, [result?.url, result?.duration]);

  const togglePlay = () => {
    if (!audioRef.current || !result) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Waveform visualization animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const numBars = 70;
      const barWidth = 4;
      const spacing = 3;
      const totalWidth = numBars * (barWidth + spacing);
      const startX = (canvas.width - totalWidth) / 2;

      phase += 0.08;

      for (let i = 0; i < numBars; i++) {
        const x = startX + i * (barWidth + spacing);
        const progressPos = duration > 0 ? currentTime / duration : 0;
        const barPosRatio = i / numBars;
        const isPast = barPosRatio <= progressPos;

        // Wave profile calculation
        let barHeight = 6;
        if (isPlaying) {
          const sine = Math.sin(phase + i * 0.25);
          const amp = Math.sin((i / numBars) * Math.PI);
          barHeight = Math.max(6, Math.abs(sine) * 48 * amp + 6);
        } else {
          const staticAmp = Math.sin((i / numBars) * Math.PI);
          barHeight = Math.max(6, staticAmp * 32 + (i % 3) * 4);
        }

        const y = (canvas.height - barHeight) / 2;

        if (isPast) {
          ctx.fillStyle = '#818cf8'; // Indigo 400
        } else {
          ctx.fillStyle = '#334155'; // Slate 700
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, duration]);

  const handleDownloadWav = () => {
    if (!result?.url) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `kokoro-speech-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSrt = () => {
    if (!result?.cues || result.cues.length === 0) return;
    const srtContent = cuesToSrt(result.cues);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles-${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs || 0);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, '0')}`;
  };

  if (!result) {
    return (
      <div className="bg-slate-900/60 rounded-3xl border border-slate-800/90 p-8 sm:p-10 text-center flex flex-col items-center justify-center gap-4 shadow-xl">
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-500 shadow-inner">
          <Music className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-200">No Audio Generated Yet</h4>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md">
            Type or customize your script above and click "Generate Speech Audio" to hear high-fidelity 24kHz Kokoro-82M AI synthesis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-xl rounded-3xl border border-indigo-500/40 p-6 sm:p-7 shadow-2xl shadow-indigo-950/30 space-y-5">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header with Voice Badge & Audio Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl shadow-inner">
            {voiceFlag}
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{voiceName}</span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                24kHz Hi-Fi
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Duration: {duration.toFixed(1)}s • 100% Client-Side Synthesized
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadWav}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download WAV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadSrt}
            title="Download SRT Subtitles"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">SRT</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="bg-slate-950/90 rounded-2xl p-4 border border-slate-800/80 shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={70}
          className="w-full h-16 sm:h-20 block"
        />
      </div>

      {/* Player Controls Bar */}
      <div className="flex items-center gap-4 p-2">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleRestart}
          title="Restart from beginning"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Current Time / Duration */}
        <span className="text-xs sm:text-sm font-mono text-slate-300 font-semibold shrink-0">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        {/* Scrub Slider */}
        <input
          type="range"
          min="0"
          max={duration || 1}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    </div>
  );
};
