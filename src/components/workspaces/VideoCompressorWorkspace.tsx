import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { Upload, Film, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';

export const VideoCompressorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetRes, setTargetRes] = useState<'1080p' | '720p' | '480p'>('720p');
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
            <Film className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Video to Compress
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Compress MP4, WebM, or MOV videos 100% locally on your computer.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-surface-border pb-4">
            <div>
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Original Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setCompressedBlob(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different video
            </button>
          </div>

          {/* Video Player */}
          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl bg-black">
              <video src={videoUrl} controls className="h-full w-full object-contain" />
            </div>
          )}

          {/* Resolution Options */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Target Resolution & Compression Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: '1080p', label: '1080p Full HD', desc: 'High Quality' },
                { id: '720p', label: '720p Standard HD', desc: 'Balanced (Recommended)' },
                { id: '480p', label: '480p Compact', desc: 'Smallest File Size' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTargetRes(item.id as any)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    targetRes === item.id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-300'
                      : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[10px] opacity-75">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-400 font-mono">
                <span>Encoding Frames Locally...</span>
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
            {!compressedBlob ? (
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Compressing Video... ({progress}%)</span>
                  </>
                ) : (
                  <span>Compress Video</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const ext = compressedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(compressedBlob, `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>Download Compressed Video ({formatBytes(compressedBlob.size)})</span>
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
          {compressedBlob && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Video compressed from {formatBytes(file.size)} to {formatBytes(compressedBlob.size)}!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
