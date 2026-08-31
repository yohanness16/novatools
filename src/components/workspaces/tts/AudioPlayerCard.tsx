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
  Volume2,
  VolumeX,
  Sparkles,
  ChevronDown
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
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (result?.url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = result.url;
        audioRef.current.playbackRate = playbackRate;
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

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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
      const numBars = 80;
      const barWidth = 3;
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
          const sine = Math.sin(phase + i * 0.28);
          const amp = Math.sin((i / numBars) * Math.PI);
          barHeight = Math.max(6, Math.abs(sine) * 44 * amp + 6);
        } else {
          const staticAmp = Math.sin((i / numBars) * Math.PI);
          barHeight = Math.max(6, staticAmp * 28 + (i % 4) * 3);
        }

        const y = (canvas.height - barHeight) / 2;

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
    a.download = `voice-generation-${Date.now()}.wav`;
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

  if (!result) return null;

  return (
    <div className="bg-slate-900/95 backdrop-blur-2xl rounded-3xl border border-indigo-500/30 p-6 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner">
            {voiceFlag}
          </div>
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <span>{voiceName}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                24kHz Hi-Fi
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Duration: {duration.toFixed(1)}s • Complete Take
            </p>
          </div>
        </div>

        {/* Action Downloads */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadWav}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audio (WAV)</span>
          </button>
          
          {result.cues && result.cues.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadSrt}
              title="Download Subtitles (.SRT)"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>SRT</span>
            </button>
          )}
        </div>
      </div>

      {/* Waveform Visualization Canvas */}
      <div className="bg-slate-950/90 rounded-2xl p-3 border border-slate-800 shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={60}
          className="w-full h-14 block"
        />
      </div>

      {/* Audio Controls Bar */}
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0 hover:scale-105 active:scale-95"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        {/* Restart Button */}
        <button
          type="button"
          onClick={handleRestart}
          title="Restart from beginning"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Timeline Scrubber */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs font-mono text-slate-300 font-semibold shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Rate Dropdown */}
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 text-xs">
          {[1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-1 rounded-lg font-mono font-medium transition-all cursor-pointer ${
                playbackRate === rate ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Mute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
