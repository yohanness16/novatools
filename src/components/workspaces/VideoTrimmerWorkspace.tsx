import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob, formatDuration } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { Scissors, VolumeX, Volume2, Loader2, Download } from 'lucide-react';

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

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });

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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Scissors className="h-5 w-5" />}
          title="Drop video to trim, or"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">{file.name}</span>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">
                Total Length: {formatDuration(duration)} · {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setTrimmedBlob(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different video
            </button>
          </div>

          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl border border-[var(--nt-border)] bg-[#141413]">
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                onLoadedMetadata={onLoadedMetadata}
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <div className="nt-well p-4 space-y-3.5">
            <div className="flex justify-between items-center text-xs font-mono font-bold">
              <span className="nt-badge-yellow px-2.5 py-0.5">Start: {formatDuration(startTime)}</span>
              <span className="text-[#4B5563] dark:text-[#D1D5DB]">
                Clip: {formatDuration(Math.max(0, endTime - startTime))}
              </span>
              <span className="nt-badge-success px-2.5 py-0.5">End: {formatDuration(endTime)}</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-[#4B5563] dark:text-[#D1D5DB] font-mono font-semibold block mb-1">
                  Start Trim Marker
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#4B5563] dark:text-[#D1D5DB] font-mono font-semibold block mb-1">
                  End Trim Marker
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--nt-border)]">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#111214] dark:text-[#F3F4F6] cursor-pointer">
                <input
                  type="checkbox"
                  checked={muteAudio}
                  onChange={(e) => setMuteAudio(e.target.checked)}
                  className="rounded border-[var(--nt-border-strong)] accent-[#2563EB]"
                />
                {muteAudio ? <VolumeX className="h-4 w-4 text-[#B91C1C]" /> : <Volume2 className="h-4 w-4 text-[#746D61]" />}
                <span>Mute audio track in exported clip</span>
              </label>
            </div>
          </div>

          {isProcessing && (
            <WorkspaceProgress message="Rendering Video Segment Locally..." progress={progress} />
          )}

          {!trimmedBlob ? (
            <button
              onClick={handleTrim}
              disabled={isProcessing || endTime <= startTime}
              className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Rendering Segment ({progress}%)...</span>
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
              className="w-full flex items-center justify-center gap-2 nt-btn-primary py-3 px-4 text-xs font-bold"
            >
              <Download className="h-4 w-4" />
              <span>Download Trimmed Clip ({formatBytes(trimmedBlob.size)})</span>
            </button>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
