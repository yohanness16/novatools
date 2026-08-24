import React, { useState, useRef } from 'react';
import { VideoEngine } from '../../engines/videoEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { Upload, Film, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';

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
            <Film className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop video to compress, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Hardware-accelerated WebCodecs in-memory compression. Zero uploads.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2D33] pb-3">
            <div>
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                Original Size: {formatBytes(file.size)}
              </p>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setVideoUrl(null);
                setCompressedBlob(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different video
            </button>
          </div>

          {/* Video Player */}
          {videoUrl && (
            <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded border border-[#2A2D33] bg-[#0B0C0F]">
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-contain"
              />
            </div>
          )}

          {/* Resolution Options */}
          <div className="space-y-2 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <label className="text-xs font-medium text-[#ECEDEF] block">
              Target Resolution Profile
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['1080p', '720p', '480p'] as const).map((res) => (
                <button
                  key={res}
                  type="button"
                  onClick={() => setTargetRes(res)}
                  className={`rounded border py-2 text-xs font-medium transition-colors ${
                    targetRes === res
                      ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                      : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                  }`}
                >
                  <span className="font-semibold block">{res}</span>
                  <span className="text-[10px] text-[#5B606D]">
                    {res === '1080p' ? 'Full HD' : res === '720p' ? 'Standard HD' : 'Compact'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#8B8F98] font-mono">
                <span>Compressing Video Frames in WASM...</span>
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

          {/* Action */}
          <div>
            {!compressedBlob ? (
              <button
                onClick={handleCompress}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Compressing Video ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Film className="h-3.5 w-3.5" />
                    <span>Compress Video ({targetRes})</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  const ext = compressedBlob.type.includes('mp4') ? 'mp4' : 'webm';
                  downloadBlob(compressedBlob, `compressed_${file.name.replace(/\.[^/.]+$/, '')}.${ext}`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#122D1F] hover:bg-[#163827] border border-[#3FBE73]/40 py-2.5 px-4 text-xs font-semibold text-[#3FBE73] transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Compressed Video ({formatBytes(compressedBlob.size)})</span>
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
