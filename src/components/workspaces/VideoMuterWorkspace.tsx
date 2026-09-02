import React, { useState, useRef } from 'react';
import { VolumeX, Download, Loader2, AlertCircle, Video } from 'lucide-react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';

export const VideoMuterWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mutedBlob, setMutedBlob] = useState<Blob | null>(null);
  const [mutedUrl, setMutedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (uploaded: File) => {
    if (!uploaded.type.startsWith('video/')) {
      setError('Please upload a valid video file (.mp4, .webm, .mov).');
      return;
    }
    setFile(uploaded);
    setVideoUrl(URL.createObjectURL(uploaded));
    setMutedBlob(null);
    setMutedUrl(null);
    setError(null);
  };

  const handleMute = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const output = await VideoEngine.processVideoSegment(
        file,
        { muteAudio: true },
        (p) => setProgress(p)
      );
      setMutedBlob(output);
      setMutedUrl(URL.createObjectURL(output));
    } catch (err: any) {
      setError(err.message || 'Failed to strip audio tracks from video.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#16171a] p-10 text-center hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-[#1e2025] transition-all cursor-pointer"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#9ca3af] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <VolumeX className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-bold text-slate-900 dark:text-white">
            Drop video to silence, or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-[#9ca3af]">
            Remove all audio and sound tracks in 1 second. 100% local processing.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</span>
              <p className="text-[10px] text-slate-500 dark:text-[#9ca3af] font-mono mt-0.5">
                Video Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setMutedBlob(null);
                setMutedUrl(null);
              }}
              className="font-mono text-[11px] text-slate-500 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Choose different video
            </button>
          </div>

          {/* Video Player Preview */}
          {(mutedUrl || videoUrl) && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.08] bg-black">
              <video
                src={mutedUrl || videoUrl!}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-[#9ca3af] font-mono">
                <span>Removing Audio Tracks Locally...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded bg-slate-100 dark:bg-[#121316]">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-150 rounded"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action */}
          <div>
            {!mutedBlob ? (
              <button
                onClick={handleMute}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 px-4 text-xs font-bold text-white transition-colors disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Removing Audio Channels ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Strip Audio Channels</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const ext = mutedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(mutedBlob, `muted_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Muted Video ({formatBytes(mutedBlob.size)})</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
