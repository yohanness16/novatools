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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  // Draw Audio Waveform Visualization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const barCount = 64;
      const barWidth = width / barCount - 2;
      const progressRatio = duration > 0 ? currentTime / duration : 0;

      for (let i = 0; i < barCount; i++) {
        const barRatio = i / barCount;
        const isPast = barRatio <= progressRatio;

        // Generate synthetic wave amplitude based on sin waves and playback
        const baseAmp = Math.sin(i * 0.25) * 0.35 + 0.5;
        const liveBonus = isPlaying ? Math.sin((i + Date.now() * 0.005) * 0.6) * 0.2 : 0;
        const barHeight = Math.max(4, (baseAmp + liveBonus) * (height - 8));

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        if (isPast) {
          ctx.fillStyle = '#6366f1'; // Indigo 500
        } else {
          ctx.fillStyle = '#334155'; // Slate 700
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
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
      <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-500">
          <Music className="w-8 h-8" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-300">No Audio Generated Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Type your text above and click "Synthesize Speech" to hear studio-quality Kokoro-82M AI voice synthesis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 backdrop-blur-md rounded-2xl border border-indigo-500/30 p-5 shadow-2xl shadow-indigo-950/20">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header with Voice Badge & Audio Meta */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-lg shadow-inner">
            {voiceFlag}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{voiceName}</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                24kHz Hi-Fi
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Duration: {duration.toFixed(1)}s • 100% Client-side Synthesized
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadWav}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download WAV</span>
          </button>
          <button
            onClick={handleDownloadSrt}
            title="Download SRT Subtitles"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SRT</span>
          </button>
        </div>
      </div>

      {/* Waveform Canvas */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-4">
        <canvas
          ref={canvasRef}
          width={600}
          height={60}
          className="w-full h-14 block"
        />
      </div>

      {/* Player Controls Bar */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Replay Button */}
        <button
          type="button"
          onClick={handleRestart}
          title="Restart from beginning"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Current Time / Duration */}
        <span className="text-xs font-mono text-slate-400 shrink-0">
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
          className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>
    </div>
  );
};
