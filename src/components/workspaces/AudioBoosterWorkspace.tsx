import React, { useState, useRef, useEffect } from 'react';
import {
  AudioBoosterEngine,
  type BoostResult,
  type BoostProgress,
} from '../../engines/audioBoosterEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import { AudioVisualizerScreen } from './AudioVisualizerScreen';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import {
  Volume2,
  Play,
  Pause,
  Download,
  Sparkles,
  Sliders,
  Loader2,
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

  const [gainPercent, setGainPercent] = useState<number>(200);
  const [enableLimiter, setEnableLimiter] = useState<boolean>(true);
  const [normalizePeak, setNormalizePeak] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<'custom' | 'speech' | 'podcast' | 'max' | 'warmth'>('custom');

  const [activeSource, setActiveSource] = useState<'original' | 'boosted'>('boosted');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Volume2 className="h-5 w-5" />}
          title="Drop audio or video to boost volume, or"
          subtitle="Amplify quiet recordings up to 300% (+12 dB) with anti-clipping dynamics limiter."
          badgeText="Web Audio DSP Engine"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
                <span className="nt-badge-yellow px-2 py-0.5 text-[10px] font-mono font-bold">
                  {formatBytes(file.size)}
                </span>
                {boostedResult && (
                  <span className="nt-badge-success px-2.5 py-0.5 text-[10px] font-mono font-bold">
                    Boosted +{boostedResult.gainDb} dB
                  </span>
                )}
              </div>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
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
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold self-start sm:self-auto"
            >
              Choose different file
            </button>
          </div>

          {(boostedResult || originalUrl) && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5 font-mono">
                  <Activity className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                  <span>Audio Waveform & Spectrum Monitor</span>
                </label>
                <span className="text-[11px] font-mono text-[#746D61] dark:text-[#938B7D]">
                  Click wave to play
                </span>
              </div>

              <AudioVisualizerScreen
                audioElement={audioRef.current}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                gainDb={activeSource === 'boosted' ? (boostedResult ? boostedResult.gainDb : currentDbGain) : 0}
                sourceLabel={activeSource === 'boosted' ? `Boosted Audio (+${boostedResult ? boostedResult.gainDb : currentDbGain} dB)` : 'Original Master Audio'}
              />
            </div>
          )}

          {(boostedResult || originalUrl) && (
            <div className="nt-well p-4 space-y-3">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#454038] dark:text-[#CBC4B6]">Preview Channel:</span>
                  <div className="flex items-center rounded-xl bg-white dark:bg-[#141311] p-1 border border-[var(--nt-border)]">
                    <button
                      onClick={() => {
                        setActiveSource('original');
                        setIsPlaying(false);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeSource === 'original'
                          ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413]'
                          : 'text-[#746D61] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
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
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        activeSource === 'boosted'
                          ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413]'
                          : 'text-[#746D61] hover:text-[#141413] dark:hover:text-[#FAF7F0] disabled:opacity-35'
                      }`}
                    >
                      Boosted (+{boostedResult ? boostedResult.gainDb : currentDbGain} dB)
                    </button>
                  </div>
                </div>

                {boostedResult && (
                  <button
                    onClick={handleDownload}
                    className="nt-btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Boosted WAV ({formatBytes(boostedResult.blob.size)})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="nt-btn-yellow flex h-9 w-9 items-center justify-center shrink-0"
                  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
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
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-[#746D61] dark:text-[#938B7D] font-mono">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(duration)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
              Volume Enhancement Presets
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs font-extrabold">{preset.name}</span>
                    </div>
                    <span className={`text-[10px] leading-tight line-clamp-2 ${isSelected ? 'opacity-85' : 'text-[#746D61] dark:text-[#938B7D]'}`}>
                      {preset.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="nt-well grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                  Gain Multiplier
                </label>
                <span className="nt-badge-yellow px-2.5 py-0.5 font-mono text-xs font-bold">
                  {gainPercent}% ({gainPercent >= 100 ? `+${currentDbGain}` : currentDbGain} dB)
                </span>
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
                className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#746D61] dark:text-[#938B7D] font-mono">
                <span>100% (Original)</span>
                <span>200% (+6 dB)</span>
                <span>300% (+12 dB Max)</span>
              </div>
            </div>

            <div className="space-y-2 border-t md:border-t-0 md:border-l border-[var(--nt-border)] pt-3 md:pt-0 md:pl-4">
              <label className="nt-subcard flex items-center gap-2.5 p-2.5 cursor-pointer text-xs font-semibold text-[#141413] dark:text-[#FAF7F0]">
                <input
                  type="checkbox"
                  checked={enableLimiter}
                  onChange={(e) => setEnableLimiter(e.target.checked)}
                  className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                />
                <span>Anti-Clipping Limiter</span>
              </label>

              <label className="nt-subcard flex items-center gap-2.5 p-2.5 cursor-pointer text-xs font-semibold text-[#141413] dark:text-[#FAF7F0]">
                <input
                  type="checkbox"
                  checked={normalizePeak}
                  onChange={(e) => setNormalizePeak(e.target.checked)}
                  className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                />
                <span>Auto Peak Normalization</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleProcess}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
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
            <WorkspaceProgress message={progressInfo.message} progress={progressInfo.progress} />
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
