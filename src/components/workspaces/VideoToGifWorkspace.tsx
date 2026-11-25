import React, { useState, useRef } from 'react';
import {
  GifEngine,
  type GifProgress,
  type GifResult,
} from '../../engines/gifEngine';
import { formatBytes, formatDuration, downloadBlob } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { Film, Play, Pause, Download, Sparkles, Layers, Clock, Zap, Loader2 } from 'lucide-react';

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

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<GifProgress | null>(null);
  const [gifResult, setGifResult] = useState<GifResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });
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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Film className="h-5 w-5" />}
          title="Drop video to convert to animated GIF, or"
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
                {gifResult && (
                  <span className="nt-badge-success px-2.5 py-0.5 text-[10px] font-mono font-bold">
                    GIF ({gifResult.width}×{gifResult.height} · {formatBytes(gifResult.fileSize)})
                  </span>
                )}
              </div>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
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
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold self-start sm:self-auto"
            >
              Choose different video
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-6 space-y-3">
              <div className="relative rounded-xl overflow-hidden bg-[#141413] border border-[var(--nt-border)] aspect-video flex items-center justify-center">
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

              <div className="nt-well flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={togglePlay}
                    className="nt-btn-yellow flex h-8 w-8 items-center justify-center"
                  >
                    {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
                  </button>
                  <span className="font-mono text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#746D61] dark:text-[#938B7D]">
                  <span>Clip:</span>
                  <span className="font-bold text-[#141413] dark:text-[#FACC15]">{clipDuration}s</span>
                  <span>({estimatedFrames} frames)</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-3.5">
              <div className="nt-well p-4 space-y-3">
                <label className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                    Trim Video Timeline
                  </span>
                  <span className="nt-badge-yellow px-2 py-0.5 font-mono text-[10px] font-bold">
                    {formatDuration(startTime)} → {formatDuration(endTime)}
                  </span>
                </label>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#454038] dark:text-[#CBC4B6] font-mono">
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
                    className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-[#454038] dark:text-[#CBC4B6] font-mono">
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
                    className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="nt-well p-3 space-y-1.5">
                  <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                    Frame Rate (FPS)
                  </label>
                  <select
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value, 10))}
                    className="nt-input w-full px-2.5 py-2 text-xs font-medium"
                  >
                    {FPS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="nt-well p-3 space-y-1.5">
                  <label className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                    Width Scaling
                  </label>
                  <select
                    value={targetWidth}
                    onChange={(e) => setTargetWidth(parseInt(e.target.value, 10))}
                    className="nt-input w-full px-2.5 py-2 text-xs font-medium"
                  >
                    {RESOLUTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
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

          {isProcessing && progressInfo && (
            <WorkspaceProgress message={progressInfo.message} progress={progressInfo.progress} />
          )}

          {gifResult && (
            <div className="nt-well p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--nt-border)] pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#15803D] dark:bg-[#4ADE80]" />
                  <h4 className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] uppercase tracking-wider font-mono">
                    Animated GIF Output
                  </h4>
                </div>

                <button
                  onClick={handleDownload}
                  className="nt-btn-primary flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download GIF ({formatBytes(gifResult.fileSize)})</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                <div className="md:col-span-7 nt-card flex items-center justify-center p-3 bg-checkerboard">
                  <img
                    src={gifResult.dataUrl}
                    alt="Rendered Animated GIF"
                    className="max-h-[260px] w-auto object-contain rounded-lg"
                  />
                </div>

                <div className="md:col-span-5 nt-card p-4 space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-[var(--nt-border)] text-[#746D61]">
                    <span>Dimensions</span>
                    <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">
                      {gifResult.width} × {gifResult.height} px
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--nt-border)] text-[#746D61]">
                    <span>Frame Count</span>
                    <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">{gifResult.frameCount} frames</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--nt-border)] text-[#746D61]">
                    <span>Frame Rate</span>
                    <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">{fps} FPS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[var(--nt-border)] text-[#746D61]">
                    <span>Duration</span>
                    <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">{gifResult.duration.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between py-1 text-[#746D61]">
                    <span>Output Size</span>
                    <span className="font-bold text-[#15803D] dark:text-[#4ADE80]">
                      {formatBytes(gifResult.fileSize)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
