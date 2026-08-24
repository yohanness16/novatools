import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob, formatDuration } from '../../lib/utils';
import { Upload, Scissors, VolumeX, Volume2, CheckCircle2, AlertCircle, Loader2, Play, Download } from 'lucide-react';

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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <Scissors className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop video to trim, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Millisecond timestamp timeline cutter. 100% in-browser processing.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                Total Length: {formatDuration(duration)} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setTrimmedBlob(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Video Preview */}
          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded border border-[#2A2D33] bg-[#0B0C0F]">
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
          <div className="space-y-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#4F8CFF]">Start: {formatDuration(startTime)}</span>
              <span className="text-[#8B8F98]">Clip Length: {formatDuration(Math.max(0, endTime - startTime))}</span>
              <span className="text-[#3FBE73]">End: {formatDuration(endTime)}</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-[#8B8F98] font-mono block mb-1">Start Trim Marker</label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                  className="w-full accent-[#4F8CFF] h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#8B8F98] font-mono block mb-1">End Trim Marker</label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                  className="w-full accent-[#3FBE73] h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Mute toggle */}
            <div className="pt-2 border-t border-[#2A2D33]">
              <label className="flex items-center gap-2 text-xs text-[#ECEDEF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                {muteAudio ? <VolumeX className="h-3.5 w-3.5 text-[#F0564B]" /> : <Volume2 className="h-3.5 w-3.5 text-[#8B8F98]" />}
                <span>Mute audio track in exported clip</span>
              </label>
            </div>
          </div>

          {/* Processing Progress */}
          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#8B8F98] font-mono">
                <span>Rendering Video Segment in WASM...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-[#1B1D22]">
                <div
                  className="h-full bg-[#4F8CFF] transition-all duration-150 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div>
            {!trimmedBlob ? (
              <button
                onClick={handleTrim}
                disabled={isProcessing || endTime <= startTime}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Rendering Segment ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-3.5 w-3.5" />
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
                className="w-full flex items-center justify-center gap-2 rounded bg-[#122D1F] hover:bg-[#163827] border border-[#3FBE73]/40 py-2.5 px-4 text-xs font-semibold text-[#3FBE73] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Trimmed Clip ({formatBytes(trimmedBlob.size)})</span>
              </button>
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
