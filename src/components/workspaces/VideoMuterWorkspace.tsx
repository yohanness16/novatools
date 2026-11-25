import React, { useState, useRef } from 'react';
import { VolumeX, Download, Loader2 } from 'lucide-react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';

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
    <div className="space-y-5">
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
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<VolumeX className="h-5 w-5" />}
          title="Drop video to silence, or"
          subtitle="Strip all audio and sound tracks instantly without re-encoding online."
          badgeText="100% Local Processing"
        />
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
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
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different video
            </button>
          </div>

          {(mutedUrl || videoUrl) && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl border border-[var(--nt-border)] bg-[#141413]">
              <video
                src={mutedUrl || videoUrl!}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {isProcessing && (
            <WorkspaceProgress message="Removing Audio Tracks Locally..." progress={progress} />
          )}

          {!mutedBlob ? (
            <button
              onClick={handleMute}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Removing Audio Channels ({progress}%)...</span>
                </>
              ) : (
                <>
                  <VolumeX className="h-4 w-4" />
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
              className="w-full flex items-center justify-center gap-2 nt-btn-primary py-3 px-4 text-xs font-bold"
            >
              <Download className="h-4 w-4" />
              <span>Download Muted Video ({formatBytes(mutedBlob.size)})</span>
            </button>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
