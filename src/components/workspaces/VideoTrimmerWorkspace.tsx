import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob, formatDuration } from '../../lib/utils';
import { Upload, Scissors, VolumeX, Volume2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const VideoTrimmerWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [muteAudio, setMuteAudio] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv)$/i.test(selectedFile.name)) {
      setError('Please select a valid video file.');
      return;
    }

    setError(null);
    setTrimmedBlob(null);
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVideoUrl(url);
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setStartTime(0);
      setEndTime(dur);
    }
  };

  const handleStartTimeChange = (val: number) => {
    const clamped = Math.min(val, endTime - 0.5);
    setStartTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleEndTimeChange = (val: number) => {
    const clamped = Math.max(val, startTime + 0.5);
    setEndTime(clamped);
    if (videoRef.current) {
      videoRef.current.currentTime = clamped;
    }
  };

  const handleTrim = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const blob = await VideoEngine.processVideoSegment(
        file,
        {
          startTime,
          endTime,
          muteAudio,
        },
        (p) => setProgress(p)
      );

      setTrimmedBlob(blob);
    } catch (err: any) {
      setError('Trim failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-12 hover:border-zinc-700 hover:bg-surface transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
            <Scissors className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Video to Trim & Cut
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Set custom start and end timestamps with live visual scrubbing.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Total Length: {formatDuration(duration)} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setTrimmedBlob(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different video
            </button>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl bg-black">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onLoadedMetadata={onLoadedMetadata}
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {/* Trim Timeline Controls */}
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-brand-400">Start: {formatDuration(startTime)}</span>
              <span className="text-zinc-500 font-mono">Clip Length: {formatDuration(Math.max(0, endTime - startTime))}</span>
              <span className="font-mono text-emerald-400">End: {formatDuration(endTime)}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">Start Marker (Seconds)</label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                  className="w-full accent-brand-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1">End Marker (Seconds)</label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Mute toggle */}
            <div className="pt-2 border-t border-zinc-800">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                {muteAudio ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-zinc-400" />}
                <span>Mute audio track in exported clip</span>
              </label>
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-mono">
                <span>Trimming Video Segment...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-brand-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {!trimmedBlob ? (
              <button
                onClick={handleTrim}
                disabled={isProcessing || endTime <= startTime}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Rendering Trimmed Clip ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-4 w-4" />
                    <span>Export Trimmed Segment ({formatDuration(endTime - startTime)})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const ext = trimmedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(trimmedBlob, `trimmed_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Download Trimmed Clip ({formatBytes(trimmedBlob.size)})</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {trimmedBlob && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Segment exported successfully!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
