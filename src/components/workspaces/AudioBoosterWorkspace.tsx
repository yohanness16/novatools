import React, { useState, useRef, useEffect } from 'react';
import {
  AudioBoosterEngine,
  type BoostResult,
  type BoostProgress,
} from '../../engines/audioBoosterEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import { AudioVisualizerScreen } from './AudioVisualizerScreen';
import {
  Volume2,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Sliders,
  RotateCcw,
  Loader2,
  AlertCircle,
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      if (boostedUrl) URL.revokeObjectURL(boostedUrl);
    };
  }, [originalUrl, boostedUrl]);

  const handleFile = async (selectedFile: File) => {
    const isAudio = selectedFile.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac|wma)$/i.test(selectedFile.name);
    const isVideo = selectedFile.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(selectedFile.name);

    if (!isAudio && !isVideo) {
      setError('Please select a valid audio or video file (MP3, WAV, M4A, MP4, WebM).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (boostedUrl) URL.revokeObjectURL(boostedUrl);

    setError(null);
    setBoostedResult(null);
    setBoostedUrl(null);
    setFile(selectedFile);
    setIsPlaying(false);
    setCurrentTime(0);

    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setActiveSource('original');
  };

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId as any);
    switch (presetId) {
      case 'speech':
        setGainPercent(180);
        setEnableLimiter(true);
        setNormalizePeak(true);
        break;
      case 'podcast':
        setGainPercent(160);
        setEnableLimiter(true);
        setNormalizePeak(true);
        break;
      case 'max':
        setGainPercent(300);
        setEnableLimiter(true);
        setNormalizePeak(false);
        break;
      case 'warmth':
        setGainPercent(175);
        setEnableLimiter(true);
        setNormalizePeak(false);
        break;
      case 'custom':
      default:
        break;
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgressInfo({ stage: 'decoding', progress: 5, message: 'Decoding audio stream into Float32 samples...' });

    try {
      const result = await AudioBoosterEngine.boostAudio(
        file,
        {
          gainMultiplier: gainPercent / 100,
          enableLimiter,
          normalizePeak,
        },
        (progress) => {
          setProgressInfo(progress);
        }
      );

      if (boostedUrl) URL.revokeObjectURL(boostedUrl);
      const url = URL.createObjectURL(result.blob);

      setBoostedResult(result);
      setBoostedUrl(url);
      setActiveSource('boosted');
      setIsPlaying(false);
      setCurrentTime(0);
    } catch (err: any) {
      setError('Audio processing failed: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.debug('Audio play failed:', e));
    }
  };

  const handleSeek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleDownload = () => {
    if (!boostedResult || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(boostedResult.blob, `${baseName}_boosted_${gainPercent}pct.wav`);
  };

  const currentAudioSrc = activeSource === 'boosted' && boostedUrl ? boostedUrl : originalUrl;
  const currentDbGain = AudioBoosterEngine.multiplierToDb(gainPercent / 100);

  return (
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <Volume2 className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop audio or video to boost volume, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Amplify quiet recordings up to 300% (+12 dB) with anti-clipping dynamics limiter.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D33] pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
                <span className="rounded bg-[#1B1D22] px-2 py-0.5 text-[10px] font-mono text-[#8B8F98] border border-[#2A2D33]">
                  {formatBytes(file.size)}
                </span>
                {boostedResult && (
                  <span className="rounded bg-[#122D1F] px-2 py-0.5 text-[10px] font-mono text-[#3FBE73] border border-[#3FBE73]/30">
                    Boosted +{boostedResult.gainDb} dB
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
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
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different file
            </button>
          </div>

          {/* AUDIO WAVE VISUALIZER MONITOR SCREEN BOX */}
          {(boostedResult || originalUrl) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#ECEDEF] flex items-center gap-1.5 font-mono">
                  <Activity className="h-3.5 w-3.5 text-sky-400" />
                  <span>Audio Waveform & Spectrum Monitor</span>
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  Interactive Screen · Click wave to play
                </span>
              </div>

              {/* Dedicated Visualizer Canvas Box */}
              <AudioVisualizerScreen
                audioElement={audioRef.current}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                gainDb={activeSource === 'boosted' ? (boostedResult ? boostedResult.gainDb : currentDbGain) : 0}
                sourceLabel={activeSource === 'boosted' ? `Boosted Audio (+${boostedResult ? boostedResult.gainDb : currentDbGain} dB)` : 'Original Master Audio'}
              />
            </div>
          )}

          {/* Audio Player & A/B Comparison Controls */}
          {(boostedResult || originalUrl) && (
            <div className="rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5 space-y-3">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                {/* A/B Source Toggle Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#8B8F98]">Preview Channel:</span>
                  <div className="flex items-center rounded bg-[#131418] p-0.5 border border-[#2A2D33]">
                    <button
                      onClick={() => {
                        setActiveSource('original');
                        setIsPlaying(false);
                      }}
                      className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeSource === 'original'
                          ? 'bg-[#1B1D22] text-[#ECEDEF]'
                          : 'text-[#8B8F98] hover:text-[#ECEDEF]'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => {
                        setActiveSource('boosted');
                        setIsPlaying(false);
                      }}
                      disabled={!boostedResult}
                      className={`px-2.5 py-0.5 rounded text-xs font-medium transition-colors ${
                        activeSource === 'boosted'
                          ? 'bg-[#4F8CFF] text-white'
                          : 'text-[#8B8F98] hover:text-[#ECEDEF] disabled:opacity-30'
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
                    className="flex items-center gap-1.5 rounded bg-[#122D1F] hover:bg-[#163827] border border-[#3FBE73]/40 px-3 py-1 text-xs font-semibold text-[#3FBE73] transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Boosted WAV ({formatBytes(boostedResult.blob.size)})</span>
                  </button>
                )}
              </div>

              {/* Playback Controls & Timeline Scrubber */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="flex h-8 w-8 items-center justify-center rounded bg-[#4F8CFF] text-white hover:bg-[#3B79F0] transition-colors shrink-0"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                </button>

                <div className="flex-1 space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full accent-[#4F8CFF] h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#8B8F98] font-mono">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preset Selector Grid */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#ECEDEF] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#4F8CFF]" />
              Volume Enhancement Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`flex flex-col items-start p-2.5 rounded border text-left transition-colors ${
                      isSelected
                        ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                        : 'border-[#2A2D33] bg-[#1B1D22] text-[#8B8F98] hover:border-[#4F8CFF]/40 hover:text-[#ECEDEF]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-semibold">{preset.name}</span>
                    </div>
                    <span className="text-[10px] text-[#8B8F98] leading-tight line-clamp-2">
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Controls & Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            {/* Gain Slider */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-[#ECEDEF]">
                  Gain Multiplier
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[#4F8CFF] font-bold">
                    {gainPercent}% ({gainPercent >= 100 ? `+${currentDbGain}` : currentDbGain} dB)
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
                  setGainPercent(Number(e.target.value));
                  setActivePreset('custom');
                }}
                className="w-full accent-[#4F8CFF] h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#8B8F98] font-mono">
                <span>100% (Original)</span>
                <span>200% (+6 dB)</span>
                <span>300% (+12 dB Max)</span>
              </div>
            </div>

            {/* Limiter & Normalization Options */}
            <div className="space-y-2 border-t md:border-t-0 md:border-l border-[#2A2D33] pt-2 md:pt-0 md:pl-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={enableLimiter}
                  onChange={(e) => setEnableLimiter(e.target.checked)}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Anti-Clipping Limiter</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={normalizePeak}
                  onChange={(e) => setNormalizePeak(e.target.checked)}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Auto Peak Normalization</span>
              </label>
            </div>
          </div>

          {/* Action Process Button */}
          <div>
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Audio in Browser...</span>
                </>
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5" />
                  <span>Boost Audio ({gainPercent}%)</span>
                </>
              )}
            </button>

            {isProcessing && progressInfo && (
              <div className="rounded bg-[#16233F] border border-[#4F8CFF]/30 p-3 space-y-1.5 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#ECEDEF] flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4F8CFF]" />
                    {progressInfo.message}
                  </span>
                  <span className="font-mono text-[#4F8CFF] font-bold">{progressInfo.progress}%</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded bg-[#131418]">
                  <div
                    className="h-full bg-[#4F8CFF] transition-all duration-300 rounded"
                    style={{ width: `${progressInfo.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded bg-[#331614] border border-[#F0564B]/40 p-3 text-xs text-[#F0564B]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
