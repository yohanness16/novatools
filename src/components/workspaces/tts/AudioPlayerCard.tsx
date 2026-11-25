import React, { useState, useRef, useEffect } from 'react';
import type { SynthesizedAudioResult } from '../../../engines/ttsTypes';
import { cuesToSrt, cuesToVtt } from '../../../engines/ttsEngine';
import {
  Play,
  Pause,
  RotateCcw,
  Download,
  FileText,
  Volume2,
  VolumeX,
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
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(console.error);
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
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
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

        ctx.fillStyle = isPast ? '#FACC15' : '#454038';
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

  const handleDownloadVtt = () => {
    if (!result?.cues || result.cues.length === 0) return;
    const vttContent = cuesToVtt(result.cues);
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles-${Date.now()}.vtt`;
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
    <div className="nt-card p-5 sm:p-6 space-y-5">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--nt-border)]">
        <div className="flex items-center gap-3.5">
          <div className="nt-well w-11 h-11 flex items-center justify-center text-xl">
            {voiceFlag}
          </div>
          <div>
            <h4 className="text-base font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-2">
              <span>{voiceName}</span>
              <span className="nt-badge-success px-2 py-0.5 text-[10px] font-bold font-mono">
                24kHz Hi-Fi
              </span>
            </h4>
            <p className="text-xs text-[#746D61] dark:text-[#938B7D] mt-0.5 font-mono">
              Duration: {duration.toFixed(1)}s · Lossless Take
            </p>
          </div>
        </div>

        {/* Action Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadWav}
            className="nt-btn-yellow flex items-center gap-1.5 px-4 py-2 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audio (WAV)</span>
          </button>

          {result.cues && result.cues.length > 0 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleDownloadSrt}
                title="Download Subtitles (.SRT)"
                className="nt-btn-secondary flex items-center gap-1 px-2.5 py-2 text-xs font-mono font-bold"
              >
                <FileText className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                <span>SRT</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadVtt}
                title="Download Subtitles (.VTT)"
                className="nt-btn-secondary flex items-center gap-1 px-2.5 py-2 text-xs font-mono font-bold"
              >
                <FileText className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                <span>VTT</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Waveform Visualization Canvas */}
      <div className="bg-[#141311] rounded-2xl p-3.5 border border-[var(--nt-border)] shadow-well">
        <canvas
          ref={canvasRef}
          width={600}
          height={60}
          className="w-full h-14 block"
        />
      </div>

      {/* Audio Controls Bar */}
      <div className="nt-well p-3.5 flex flex-wrap sm:flex-nowrap items-center gap-3.5">
        <button
          type="button"
          onClick={togglePlay}
          className="nt-btn-yellow w-11 h-11 flex items-center justify-center shrink-0"
          aria-label={isPlaying ? 'Pause playback' : 'Play playback'}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={handleRestart}
          title="Restart from beginning"
          className="nt-btn-secondary p-2.5 shrink-0"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Timeline Scrubber */}
        <div className="flex-1 min-w-[140px] flex items-center gap-3">
          <span className="text-xs font-mono text-[#141413] dark:text-[#FAF7F0] font-bold shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-white dark:bg-[#141311] rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs font-mono text-[#746D61] dark:text-[#938B7D] shrink-0">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Rate Dropdown */}
        <div className="nt-subcard flex items-center gap-1 p-1 text-xs">
          {[1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => handleRateChange(rate)}
              className={`px-2 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                playbackRate === rate
                  ? 'bg-[#141413] text-[#FACC15]'
                  : 'text-[#746D61] dark:text-[#938B7D] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
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
          className="nt-btn-secondary p-2 shrink-0"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-[#B91C1C] dark:text-[#F87171]" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
