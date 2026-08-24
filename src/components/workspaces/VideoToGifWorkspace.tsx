import React, { useState, useRef, useEffect } from 'react';
import {
  GifEngine,
  type GifResult,
  type GifProgress,
} from '../../engines/gifEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import {
  Film,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Sliders,
  RotateCcw,
  Loader2,
  AlertCircle,
  Check,
  Clock,
  Zap,
  Repeat,
  Layers,
  ShieldCheck,
} from 'lucide-react';

const FPS_OPTIONS = [
  { value: 10, label: '10 FPS', desc: 'Small file size, compact' },
  { value: 15, label: '15 FPS', desc: 'Recommended balance' },
  { value: 20, label: '20 FPS', desc: 'Smooth motion' },
  { value: 24, label: '24 FPS', desc: 'Cinematic' },
  { value: 30, label: '30 FPS', desc: 'Ultra smooth 60Hz' },
];

const RESOLUTION_OPTIONS = [
  { value: 320, label: '320px', desc: 'Discord / Email' },
  { value: 480, label: '480px', desc: 'Standard Web' },
  { value: 640, label: '640px', desc: 'Crisp HD' },
  { value: 0, label: 'Original', desc: 'Source resolution' },
];

export const VideoToGifWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Settings
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [fps, setFps] = useState<number>(15);
  const [targetWidth, setTargetWidth] = useState<number>(480);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<GifProgress | null>(null);
  const [gifResult, setGifResult] = useState<GifResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (gifResult?.dataUrl) URL.revokeObjectURL(gifResult.dataUrl);
    };
  }, [videoUrl, gifResult]);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setGifResult(null);

    const isVid = selectedFile.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(selectedFile.name);
    if (!isVid) {
      setError('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
    setFile(selectedFile);
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const dur = e.currentTarget.duration || 1;
    setDuration(dur);
    setStartTime(0);
    // Cap default GIF duration to max 8 seconds for optimal performance
    setEndTime(Math.min(dur, 8));
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgressInfo({
      status: 'loading',
      progress: 5,
      currentFrame: 0,
      totalFrames: 0,
      message: 'Extracting video frames...',
    });

    try {
      const result = await GifEngine.renderVideoToGif(
        file,
        {
          fps,
          width: targetWidth > 0 ? targetWidth : undefined,
          startTime,
          endTime,
        },
        (p) => setProgressInfo(p)
      );

      setGifResult(result);
    } catch (err: any) {
      setError('GIF creation failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    if (!gifResult || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(gifResult.blob, `${baseName}_animated.gif`);
  };

  const clipDuration = Math.max(0.1, Number((endTime - startTime).toFixed(1)));
  const estimatedFrames = Math.max(1, Math.round(clipDuration * fps));

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
            accept="video/*,.mp4,.webm,.mov,.mkv,.m4v"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all shadow-lg">
            <Film className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-200">
            Upload Video to Create Animated GIF
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md text-center">
            Trim video clips and export high-framerate animated GIFs with custom resolution scaling and zero server uploads.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>100% Client-Side Canvas & LZW Encoding · Zero Cloud Limits</span>
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
                {gifResult && (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    GIF Created ({gifResult.width}×{gifResult.height} · {formatBytes(gifResult.fileSize)})
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {gifResult ? 'GIF rendered · Ready to inspect & download' : 'Select trim range and frame rate settings'}
              </p>
            </div>

            <button
              onClick={() => {
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                setFile(null);
                setVideoUrl(null);
                setGifResult(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 self-start sm:self-auto transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Video Preview & Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Video Player (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 aspect-video flex items-center justify-center">
                {videoUrl && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Playback Controls & Timestamp */}
              <div className="flex items-center justify-between bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white hover:bg-brand-600 active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </button>
                  <span className="font-mono text-xs text-zinc-300">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                  <span>Clip:</span>
                  <span className="font-semibold text-brand-400">{clipDuration}s</span>
                  <span>({estimatedFrames} frames)</span>
                </div>
              </div>
            </div>

            {/* Trimming & Settings Panel (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Range Trimming Sliders */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <label className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-brand-400" />
                    Trim Video Range
                  </span>
                  <span className="font-mono text-[11px] text-brand-400 font-semibold">
                    {formatDuration(startTime)} → {formatDuration(endTime)}
                  </span>
                </label>

                {/* Start Time Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>Start Timestamp</span>
                    <span className="font-mono">{formatDuration(startTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, endTime - 0.2)}
                    step={0.1}
                    value={startTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setStartTime(val);
                      handleSeek(val);
                    }}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>

                {/* End Time Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-zinc-400">
                    <span>End Timestamp</span>
                    <span className="font-mono">{formatDuration(endTime)}</span>
                  </div>
                  <input
                    type="range"
                    min={startTime + 0.2}
                    max={duration || 1}
                    step={0.1}
                    value={endTime}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setEndTime(val);
                      handleSeek(val);
                    }}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>
              </div>

              {/* Framerate & Resolution Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* FPS Selection */}
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-brand-400" />
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-brand-500 focus:outline-none"
                  >
                    {FPS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution Scaling */}
                <div className="bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-brand-400" />
                    Width Scaling
                  </label>
                  <select
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 focus:border-brand-500 focus:outline-none"
                  >
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Convert Button */}
              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 px-4 text-xs font-semibold text-white shadow-glow-sm hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rendering Animated GIF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Convert to GIF ({estimatedFrames} frames)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Box */}
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

          {/* Output GIF Inspector */}
          {gifResult && (
            <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/90 p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                    Animated GIF Output
                  </h4>
                </div>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-glow-sm active:scale-95 transition-all self-start sm:self-auto"
                >
                  <Download className="h-4 w-4" />
                  <span>Download GIF ({formatBytes(gifResult.fileSize)})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* GIF Image Preview (7 cols) */}
                <div className="md:col-span-7 flex items-center justify-center p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <img
                    src={gifResult.dataUrl}
                    alt="Rendered Animated GIF"
                    className="max-h-[300px] w-auto object-contain rounded-lg shadow-lg"
                  />
                </div>

                {/* Metadata Details (5 cols) */}
                <div className="md:col-span-5 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-400">
                    <span>Dimensions</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      {gifResult.width} × {gifResult.height} px
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-400">
                    <span>Frame Count</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      {gifResult.frameCount} frames
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-400">
                    <span>Frame Rate</span>
                    <span className="font-mono font-semibold text-zinc-200">{fps} FPS</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-zinc-800 text-zinc-400">
                    <span>Clip Duration</span>
                    <span className="font-mono font-semibold text-zinc-200">
                      {gifResult.duration.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 text-zinc-400">
                    <span>Output File Size</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatBytes(gifResult.fileSize)}
                    </span>
                  </div>
                </div>
              </div>
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
