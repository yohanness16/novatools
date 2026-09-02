import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { Upload, Film, CheckCircle2, AlertCircle, Loader2, Download, Zap, MessageSquare, Mail } from 'lucide-react';

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
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-white/[0.1] bg-slate-50 dark:bg-[#16171a] p-10 text-center hover:border-blue-500 hover:bg-slate-100 dark:hover:bg-[#1e2025] transition-all cursor-pointer"
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-[#9ca3af] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <Film className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-bold text-slate-900 dark:text-white">
            Drop video to compress, or <span className="text-blue-600 dark:text-blue-400 underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-[#9ca3af]">
            Hardware-accelerated in-browser video compression. Zero cloud uploads.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#1e2025] p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.06] pb-3">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">{file.name}</span>
              <p className="text-[10px] text-slate-500 dark:text-[#9ca3af] font-mono mt-0.5">
                Original Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setCompressedBlob(null);
              }}
              className="font-mono text-[11px] text-slate-500 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Choose different video
            </button>
          </div>

          {/* Video Player */}
          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-white/[0.08] bg-black">
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {/* Social Platform & Size Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              Target Preset / Output Target:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'discord_8mb', label: 'Discord Free (8MB)', icon: MessageSquare },
                { id: 'discord_25mb', label: 'Discord Nitro (25MB)', icon: MessageSquare },
                { id: 'email_20mb', label: 'Email Attachment (20MB)', icon: Mail },
                { id: '720p', label: 'Web HD (720p)', icon: Zap },
              ].map((preset) => {
                const Icon = preset.icon;
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id as CompressionPreset)}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-slate-700 dark:text-[#9ca3af] hover:bg-slate-100 dark:hover:bg-[#202227]'
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
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-[#9ca3af] font-mono">
                <span>Compressing Video Frames Locally...</span>
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

          {/* Action Button */}
          <div>
            {!compressedBlob ? (
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 py-2.5 px-4 text-xs font-bold text-white transition-colors disabled:opacity-40 cursor-pointer active:scale-95"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Compressing Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5" />
                    <span>Compress Video</span>
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 font-mono">
                  <span>Compression complete! Output size: {formatBytes(compressedBlob.size)}</span>
                  <span className="font-bold">
                    Saved {Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100))}%
                  </span>
                </div>
                <button
                  onClick={() => {
                    const ext = compressedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                    downloadBlob(compressedBlob, `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 py-2.5 px-4 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Compressed Video ({formatBytes(compressedBlob.size)})</span>
                </button>
              </div>
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
