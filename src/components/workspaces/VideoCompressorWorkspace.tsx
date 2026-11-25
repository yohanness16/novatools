import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { Film, Loader2, Download, Zap, MessageSquare, Mail } from 'lucide-react';

export type CompressionPreset = 'discord_8mb' | 'discord_25mb' | 'email_20mb' | '720p' | '480p';

export const VideoCompressorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>('discord_8mb');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('video/') && !/\.(mp4|webm|mov|mkv)$/i.test(selectedFile.name)) {
      setError('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    setError(null);
    setCompressedBlob(null);
    setFile(selectedFile);
    setVideoUrl(URL.createObjectURL(selectedFile));
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    const targetRes =
      selectedPreset === '480p' || selectedPreset === 'discord_8mb' ? '480p' : '720p';

    try {
      const blob = await VideoEngine.processVideoSegment(
        file,
        {
          targetResolution: targetRes,
        },
        (p) => setProgress(p)
      );

      setCompressedBlob(blob);
    } catch (err: any) {
      setError('Compression error: ' + err.message);
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
          icon={<Film className="h-5 w-5" />}
          title="Drop video to compress, or"
          subtitle="Hardware-accelerated in-browser video compression with target size presets."
          badgeText="Zero Cloud Uploads"
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
              <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                Original Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setCompressedBlob(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different video
            </button>
          </div>

          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl border border-[var(--nt-border)] bg-[#141413]">
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}

          <div className="nt-well p-4 space-y-2.5">
            <label className="block text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0]">
              Target Preset / Output Target
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'discord_8mb', label: 'Discord Free (8MB)', icon: MessageSquare },
                { id: 'discord_25mb', label: 'Discord Nitro (25MB)', icon: MessageSquare },
                { id: 'email_20mb', label: 'Email (20MB)', icon: Mail },
                { id: '720p', label: 'Web HD (720p)', icon: Zap },
              ].map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id as CompressionPreset)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isProcessing && (
            <WorkspaceProgress message="Compressing Video Frames Locally..." progress={progress} />
          )}

          {!compressedBlob ? (
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Compressing Video ({progress}%)...</span>
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  <span>Compress Video</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <WorkspaceAlert
                variant="success"
                message={`Compression complete! Output: ${formatBytes(compressedBlob.size)} (Saved ${Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100))}%)`}
                action={
                  <button
                    onClick={() => {
                      const ext = compressedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                      downloadBlob(compressedBlob, `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                    }}
                    className="nt-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download ({formatBytes(compressedBlob.size)})</span>
                  </button>
                }
              />
            </div>
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
