import React, { useState, useRef, useEffect } from 'react';
import {
  AudioBoosterEngine,
  type BoostResult,
  type BoostProgress,
} from '../../engines/audioBoosterEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import {
  Volume2,
  VolumeX,
  Volume1,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Sliders,
  ShieldCheck,
  RotateCcw,
  Loader2,
  AlertCircle,
  Check,
  Activity,
  Mic,
  Radio,
  Zap,
  Flame,
} from 'lucide-react';

const PRESETS = [
  { id: 'custom', name: 'Custom Gain', icon: Sliders, desc: 'Manual slider control' },
  { id: 'speech', name: 'Speech Boost', icon: Mic, desc: '+6 dB boost with vocal clarity EQ' },
  { id: 'podcast', name: 'Podcast Normalizer', icon: Radio, desc: 'Auto-normalize peak to -0.2 dB with limiter' },
  { id: 'max', name: 'Max Loudness (+300%)', icon: Zap, desc: '+12 dB maximum volume amplification' },
  { id: 'warmth', name: 'Bass Warmth', icon: Flame, desc: '+5 dB gain with low-end acoustic warmth' },
];

export const AudioBoosterWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [boostedResult, setBoostedResult] = useState<BoostResult | null>(null);
  const [boostedUrl, setBoostedUrl] = useState<string | null>(null);

  // Settings
  const [gainPercent, setGainPercent] = useState<number>(200); // 100% to 300%
  const [enableLimiter, setEnableLimiter] = useState<boolean>(true);
  const [normalizePeak, setNormalizePeak] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'custom' | 'speech' | 'podcast' | 'max' | 'warmth'>('custom');

  // Player State
  const [activeSource, setActiveSource] = useState<'original' | 'boosted'>('boosted');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<BoostProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (boostedUrl) URL.revokeObjectURL(boostedUrl);
    };
  }, [originalUrl, boostedUrl]);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setBoostedResult(null);
    if (boostedUrl) URL.revokeObjectURL(boostedUrl);
    setBoostedUrl(null);

    const isAud = selectedFile.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|webm)$/i.test(selectedFile.name);
    const isVid = selectedFile.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(selectedFile.name);

    if (!isAud && !isVid) {
      setError('Please select a valid audio file (MP3, WAV, M4A, AAC, FLAC) or video file.');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setFile(selectedFile);
  };

  const handlePresetSelect = (presetId: 'custom' | 'speech' | 'podcast' | 'max' | 'warmth') => {
    setActivePreset(presetId);
    if (presetId === 'speech') {
      setGainPercent(200); // +6dB
      setEnableLimiter(true);
      setNormalizePeak(false);
    } else if (presetId === 'podcast') {
      setGainPercent(175);
      setEnableLimiter(true);
      setNormalizePeak(true);
    } else if (presetId === 'max') {
      setGainPercent(300); // +12dB
      setEnableLimiter(true);
      setNormalizePeak(false);
    } else if (presetId === 'warmth') {
      setGainPercent(180);
      setEnableLimiter(true);
      setNormalizePeak(false);
    }
  };

  const handleBoost = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgressInfo({
      status: 'decoding',
      progress: 5,
      message: 'Preparing audio stream...',
    });

    try {
      const multiplier = Number((gainPercent / 100).toFixed(2));
      const result = await AudioBoosterEngine.boostAudio(
        file,
        {
          gainMultiplier: multiplier,
          enableLimiter,
          normalizePeak,
          preset: activePreset,
        },
        (p) => setProgressInfo(p)
      );

      if (boostedUrl) URL.revokeObjectURL(boostedUrl);
      const newUrl = URL.createObjectURL(result.blob);
      setBoostedResult(result);
      setBoostedUrl(newUrl);
      setActiveSource('boosted');
    } catch (err: any) {
      setError('Audio processing failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    if (!boostedResult || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(boostedResult.blob, `${baseName}_boosted_${gainPercent}pct.wav`);
  };

  const currentAudioSrc = activeSource === 'boosted' && boostedUrl ? boostedUrl : originalUrl;
  const currentDbGain = AudioBoosterEngine.multiplierToDb(gainPercent / 100);

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-14 hover:border-zinc-700 hover:bg-surface transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,video/*,.mp3,.wav,.m4a,.aac,.ogg,.flac,.mp4,.webm,.mov"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all shadow-lg">
            <Volume2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-200">
            Upload Audio or Video to Boost Volume
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md text-center">
            Amplify quiet recordings up to 300% (+12 dB) with an automatic anti-clipping dynamics limiter and peak normalization.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>100% Client-Side Web Audio API · Zero Server Uploads</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-200">{file.name}</span>
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                  {formatBytes(file.size)}
                </span>
                {boostedResult && (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30">
                    Boosted +{boostedResult.gainDb} dB
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {boostedResult ? 'Amplification complete · Ready to preview & download' : 'Configure gain levels & presets'}
              </p>
            </div>

            <button
              onClick={() => {
                if (originalUrl) URL.revokeObjectURL(originalUrl);
                if (boostedUrl) URL.revokeObjectURL(boostedUrl);
                setFile(null);
                setOriginalUrl(null);
                setBoostedResult(null);
                setBoostedUrl(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 self-start sm:self-auto transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* Preset Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-400" />
              Volume Enhancement Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id as any)}
                    className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 shadow-glow-sm'
                        : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-400' : 'text-zinc-400'}`} />
                      <span className="text-xs font-semibold text-zinc-200 truncate">{preset.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 leading-tight">{preset.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gain & Processing Controls */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
            {/* Gain Slider (7 cols) */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-brand-400" />
                  Volume Gain Multiplier
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
                    {gainPercent}% ({currentDbGain >= 0 ? `+${currentDbGain}` : currentDbGain} dB)
                  </span>
                </div>
              </div>

              <input
                type="range"
                min={100}
                max={300}
                step={5}
                value={gainPercent}
                onChange={(e) => {
                  setGainPercent(parseInt(e.target.value, 10));
                  setActivePreset('custom');
                }}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />

              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>100% (0 dB)</span>
                <span>150% (+3.5 dB)</span>
                <span>200% (+6 dB)</span>
                <span>250% (+8 dB)</span>
                <span>300% (+12 dB)</span>
              </div>
            </div>

            {/* Quality Toggles (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-center space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLimiter}
                  onChange={(e) => setEnableLimiter(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <div className="text-xs">
                  <span className="font-medium text-zinc-200 block">Anti-Clipping Limiter</span>
                  <span className="text-[10px] text-zinc-400 block">Eliminates harsh distortion and audio crackling</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={normalizePeak}
                  onChange={(e) => setNormalizePeak(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <div className="text-xs">
                  <span className="font-medium text-zinc-200 block">Peak Normalization</span>
                  <span className="text-[10px] text-zinc-400 block">Target maximum clean volume ceiling (-0.2 dB)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Action Button & Progress */}
          <div className="space-y-3">
            <button
              onClick={handleBoost}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 px-4 text-xs font-semibold text-white shadow-glow-sm hover:bg-brand-600 active:scale-[0.99] transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing Audio in Browser...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Boost Audio ({gainPercent}%)</span>
                </>
              )}
            </button>

            {isProcessing && progressInfo && (
              <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200 flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                    {progressInfo.message}
                  </span>
                  <span className="font-mono text-brand-400 font-bold">{progressInfo.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressInfo.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Audio Player & A/B Comparison */}
          {(boostedResult || originalUrl) && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-4">
              {currentAudioSrc && (
                <audio
                  ref={audioRef}
                  src={currentAudioSrc}
                  onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}

              {/* Player Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* A/B Source Toggle Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-zinc-400">Audio Preview:</span>
                  <div className="flex items-center rounded-lg bg-zinc-950 p-1 border border-zinc-800">
                    <button
                      onClick={() => setActiveSource('original')}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        activeSource === 'original'
                          ? 'bg-zinc-800 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Original Audio
                    </button>
                    <button
                      onClick={() => setActiveSource('boosted')}
                      disabled={!boostedResult}
                      className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                        activeSource === 'boosted'
                          ? 'bg-brand-500 text-white shadow-glow-sm'
                          : 'text-zinc-400 hover:text-zinc-200 disabled:opacity-40'
                      }`}
                    >
                      Boosted (+{boostedResult ? boostedResult.gainDb : currentDbGain} dB)
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                {boostedResult && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-sm active:scale-95 transition-all self-start sm:self-auto"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Boosted WAV</span>
                  </button>
                )}
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all shrink-0 shadow-glow-sm"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              </div>

              {/* Analysis Comparison Box */}
              {boostedResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-zinc-800/80 text-xs">
                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Original Peak</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {boostedResult.originalAnalysis.peakDb} dB
                    </span>
                  </div>

                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Boosted Peak</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {boostedResult.boostedAnalysis.peakDb} dB
                    </span>
                  </div>

                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Original RMS (Energy)</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {boostedResult.originalAnalysis.rmsDb} dB
                    </span>
                  </div>

                  <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
                    <span className="text-[10px] text-zinc-500 block">Boosted RMS</span>
                    <span className="font-mono font-bold text-brand-400">
                      {boostedResult.boostedAnalysis.rmsDb} dB
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
