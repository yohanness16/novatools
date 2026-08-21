import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { Upload, VolumeX, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export const VideoMuterWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [mutedBlob, setMutedBlob] = useState<Blob | null>(null);
  const [mutedUrl, setMutedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv)$/i.test(selectedFile.name)) {
      setError('Please select a valid video file.');
      return;
    }

    setError(null);
    setMutedBlob(null);
    setMutedUrl(null);
    setFile(selectedFile);
    setVideoUrl(URL.createObjectURL(selectedFile));
  };

  const handleMute = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const blob = await VideoEngine.processVideoSegment(
        file,
        {
          muteAudio: true,
        },
        (p) => setProgress(p)
      );

      setMutedBlob(blob);
      setMutedUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      setError('Muting failed: ' + err.message);
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
            <VolumeX className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Video to Remove Audio Track
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Strip all sound channels completely from your video clip.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
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
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different video
            </button>
          </div>

          {/* Video Player */}
          {(mutedUrl || videoUrl) && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl bg-black">
              <video
                src={mutedUrl || videoUrl!}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-mono">
                <span>Rendering Silent Video...</span>
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

          {/* Action */}
          <div className="pt-2">
            {!mutedBlob ? (
              <button
                onClick={handleMute}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Removing Audio Channels... ({progress}%)</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4" />
                    <span>Mute & Strip Audio Track</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const ext = mutedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(mutedBlob, `muted_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Download Muted Video ({formatBytes(mutedBlob.size)})</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {mutedBlob && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Audio track stripped cleanly!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
