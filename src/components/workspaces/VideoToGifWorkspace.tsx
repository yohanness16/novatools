import React, { useState, useRef } from 'react';
import {
  GifEngine,
  type GifProgress,
  type GifResult,
} from '../../engines/gifEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import {
  Film,
  Upload,
  Play,
  Pause,
  Download,
  Sparkles,
  Layers,
  Clock,
  Zap,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const FPS_OPTIONS = [
  { value: 10, label: '10 FPS', desc: 'Compact file size' },
  { value: 15, label: '15 FPS', desc: 'Standard web balance' },
  { value: 20, label: '20 FPS', desc: 'Smooth motion' },
  { value: 24, label: '24 FPS', desc: 'Cinematic rate' },
  { value: 30, label: '30 FPS', desc: 'Maximum fluidity' },
];

const RESOLUTION_OPTIONS = [
  { value: 320, label: '320px', desc: 'Compact sticker' },
  { value: 480, label: '480px', desc: 'Standard web' },
  { value: 640, label: '640px', desc: 'High definition' },
  { value: 0, label: 'Original', desc: 'Source resolution' },
];

export const VideoToGifWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(3);
  const [fps, setFps] = useState<number>(15);
  const [targetWidth, setTargetWidth] = useState<number>(480);

  // Player state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<GifProgress | null>(null);
  const [gifResult, setGifResult] = useState<GifResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleFile = (selectedFile: File) => {
    const isVideo =
      selectedFile.type.startsWith('video/') ||
      /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(selectedFile.name);

    if (!isVideo) {
      setError('Please select a valid video file (MP4, WebM, MOV, MKV).');
      return;
    }

    if (videoUrl) URL.revokeObjectURL(videoUrl);

    setError(null);
    setGifResult(null);
    setFile(selectedFile);
    setIsPlaying(false);
    setCurrentTime(0);

    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 5;
      setDuration(dur);
      setStartTime(0);
      setEndTime(Math.min(dur, 4));
    }
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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <Film className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop video to convert to animated GIF, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Color quantization & LZW byte stream encoder. 100% local processing.
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
                {gifResult && (
                  <span className="rounded bg-[#122D1F] px-2 py-0.5 text-[10px] font-mono text-[#3FBE73] border border-[#3FBE73]/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    GIF Created ({gifResult.width}×{gifResult.height} · {formatBytes(gifResult.fileSize)})
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
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
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Video Preview & Timeline Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Video Player (6 cols) */}
            <div className="lg:col-span-6 space-y-2">
              <div className="relative rounded overflow-hidden bg-[#0B0C0F] border border-[#2A2D33] aspect-video flex items-center justify-center">
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
              <div className="flex items-center justify-between bg-[#1B1D22] p-2.5 rounded border border-[#2A2D33]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className="flex h-7 w-7 items-center justify-center rounded bg-[#4F8CFF] text-white hover:bg-[#3B79F0] transition-colors"
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
                  </button>
                  <span className="font-mono text-xs text-[#ECEDEF]">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8B8F98]">
                  <span>Clip:</span>
                  <span className="font-semibold text-[#4F8CFF]">{clipDuration}s</span>
                  <span>({estimatedFrames} frames)</span>
                </div>
              </div>
            </div>

            {/* Trimming & Settings Panel (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              {/* Range Trimming Sliders */}
              <div className="bg-[#1B1D22] p-3 rounded border border-[#2A2D33] space-y-2.5">
                <label className="text-xs font-medium text-[#ECEDEF] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#4F8CFF]" />
                    Trim Video Timeline
                  </span>
                  <span className="font-mono text-[10px] text-[#4F8CFF] font-semibold">
                    {formatDuration(startTime)} → {formatDuration(endTime)}
                  </span>
                </label>

                {/* Start Time Slider */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[#8B8F98] font-mono">
                    <span>Start Position</span>
                    <span>{formatDuration(startTime)}</span>
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
                    className="w-full h-1.5 bg-[#131418] rounded appearance-none cursor-pointer accent-[#4F8CFF]"
                  />
                </div>

                {/* End Time Slider */}
                <div className="space-y-0.5">
                  <div className="flex justify-between text-[10px] text-[#8B8F98] font-mono">
                    <span>End Position</span>
                    <span>{formatDuration(endTime)}</span>
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
                    className="w-full h-1.5 bg-[#131418] rounded appearance-none cursor-pointer accent-[#4F8CFF]"
                  />
                </div>
              </div>

              {/* Framerate & Resolution Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* FPS Selection */}
                <div className="bg-[#1B1D22] p-2.5 rounded border border-[#2A2D33] space-y-1.5">
                  <label className="text-xs font-medium text-[#ECEDEF] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#4F8CFF]" />
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value, 10))}
                    className="w-full rounded border border-[#2A2D33] bg-[#131418] px-2.5 py-1.5 text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
                  >
                    {FPS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Resolution Scaling */}
                <div className="bg-[#1B1D22] p-2.5 rounded border border-[#2A2D33] space-y-1.5">
                  <label className="text-xs font-medium text-[#ECEDEF] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#4F8CFF]" />
                    Width Scaling
                  </label>
                  <select
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(parseInt(e.target.value, 10))}
                    className="w-full rounded border border-[#2A2D33] bg-[#131418] px-2.5 py-1.5 text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
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
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Rendering Animated GIF...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Convert to GIF ({estimatedFrames} frames)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Box */}
          {isProcessing && progressInfo && (
            <div className="rounded bg-[#16233F] border border-[#4F8CFF]/30 p-3 space-y-1.5">
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

          {/* Output GIF Inspector */}
          {gifResult && (
            <div className="rounded border border-[#3FBE73]/30 bg-[#122D1F] p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2A2D33] pb-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#3FBE73]" />
                  <h4 className="text-xs font-bold text-[#ECEDEF] uppercase tracking-wider font-mono">
                    Animated GIF Output
                  </h4>
                </div>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded bg-[#3FBE73] hover:bg-[#349e5f] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download GIF ({formatBytes(gifResult.fileSize)})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* GIF Image Preview (7 cols) */}
                <div className="md:col-span-7 flex items-center justify-center p-2 bg-[#0B0C0F] rounded border border-[#2A2D33]">
                  <img
                    src={gifResult.dataUrl}
                    alt="Rendered Animated GIF"
                    className="max-h-[260px] w-auto object-contain rounded"
                  />
                </div>

                {/* Metadata Details (5 cols) */}
                <div className="md:col-span-5 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[#2A2D33] text-[#8B8F98]">
                    <span>Dimensions</span>
                    <span className="text-[#ECEDEF]">
                      {gifResult.width} × {gifResult.height} px
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#2A2D33] text-[#8B8F98]">
                    <span>Frame Count</span>
                    <span className="text-[#ECEDEF]">
                      {gifResult.frameCount} frames
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#2A2D33] text-[#8B8F98]">
                    <span>Frame Rate</span>
                    <span className="text-[#ECEDEF]">{fps} FPS</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-[#2A2D33] text-[#8B8F98]">
                    <span>Clip Duration</span>
                    <span className="text-[#ECEDEF]">
                      {gifResult.duration.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex justify-between py-1 text-[#8B8F98]">
                    <span>Output File Size</span>
                    <span className="font-bold text-[#3FBE73]">
                      {formatBytes(gifResult.fileSize)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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
