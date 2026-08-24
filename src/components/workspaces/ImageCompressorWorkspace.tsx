import React, { useState, useRef, useCallback } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { Upload, Minimize2, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';

export const ImageCompressorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState<number>(0.75);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFile = async (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      return;
    }

    setError(null);
    setFile(selectedFile);

    try {
      const dataUrl = await readFileAsDataURL(selectedFile);
      setOriginalUrl(dataUrl);
      compress(selectedFile, quality, maxWidth);
    } catch (err: any) {
      setError('Failed to load image: ' + err.message);
    }
  };

  const compress = async (targetFile: File, targetQuality: number, targetMaxWidth: number) => {
    setIsProcessing(true);
    setError(null);

    try {
      const mime = targetFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const result = await ImageEngine.processImage(targetFile, {
        format: mime as any,
        quality: targetQuality,
        maxWidth: targetMaxWidth,
      });

      setCompressedBlob(result.blob);
      setCompressedUrl(result.dataUrl);
    } catch (err: any) {
      setError('Compression failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQualityChange = (val: number) => {
    setQuality(val);
    if (file) compress(file, val, maxWidth);
  };

  const handleMaxWidthChange = (val: number) => {
    setMaxWidth(val);
    if (file) compress(file, quality, val);
  };

  const handleSliderMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleSliderMove(e.clientX);
  };

  const savingsPercent =
    file && compressedBlob
      ? Math.max(0, Math.round(((file.size - compressedBlob.size) / file.size) * 100))
      : 0;

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
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <Minimize2 className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop image to compress, or <span className="text-[#4F8CFF] underline">browse</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Interactive side-by-side diff slider. 100% in-browser processing.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D33] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
              {compressedBlob && (
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#122D1F] px-2 py-0.5 font-mono text-[10px] font-medium text-[#3FBE73] border border-[#3FBE73]/30">
                    -{savingsPercent}% Saved
                  </span>
                  <span className="font-mono text-[10px] text-[#8B8F98]">
                    {formatBytes(file.size)} → {formatBytes(compressedBlob.size)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setFile(null);
                setOriginalUrl(null);
                setCompressedUrl(null);
                setCompressedBlob(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different image
            </button>
          </div>

          {/* Interactive Split Diff Viewer */}
          {originalUrl && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-[#8B8F98] font-mono px-1">
                <span>Original ({formatBytes(file.size)})</span>
                <span className="text-[#4F8CFF]">Drag hairline divider to inspect</span>
                <span>Compressed ({compressedBlob ? formatBytes(compressedBlob.size) : '...'})</span>
              </div>

              <div
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative h-[280px] sm:h-[360px] w-full select-none overflow-hidden rounded border border-[#2A2D33] bg-[#0B0C0F] cursor-ew-resize"
              >
                {/* Background Image (Compressed) */}
                {compressedUrl && (
                  <img
                    src={compressedUrl}
                    alt="Compressed"
                    className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                  />
                )}

                {/* Foreground Image (Original) with Clip-Path */}
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="absolute inset-0 h-full w-full object-contain max-w-none pointer-events-none"
                    style={{
                      width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                      height: '100%',
                    }}
                  />
                </div>

                {/* Slider Handle Line */}
                <div
                  className="absolute top-0 bottom-0 w-[1px] bg-[#4F8CFF] pointer-events-none z-20"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded bg-[#131418] text-[#ECEDEF] border border-[#2A2D33] shadow-md">
                    <span className="font-mono text-[9px] text-[#8B8F98]">⟷</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sliders and Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-[#ECEDEF]">
                  Compression Quality
                </label>
                <span className="font-mono text-xs text-[#4F8CFF] font-semibold">
                  {Math.round(quality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="0.95"
                step="0.05"
                value={quality}
                onChange={(e) => handleQualityChange(parseFloat(e.target.value))}
                className="w-full accent-[#4F8CFF] h-1.5 bg-[#131418] rounded appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-[#ECEDEF]">
                  Max Width Limit
                </label>
                <span className="font-mono text-xs text-[#8B8F98]">
                  {maxWidth}px
                </span>
              </div>
              <select
                value={maxWidth}
                onChange={(e) => handleMaxWidthChange(Number(e.target.value))}
                className="w-full rounded border border-[#2A2D33] bg-[#131418] px-3 py-1.5 text-xs text-[#ECEDEF] focus:border-[#4F8CFF] focus:outline-none"
              >
                <option value="3840">4K Ultra (3840px)</option>
                <option value="1920">Full HD (1920px - Default)</option>
                <option value="1280">Standard HD (1280px)</option>
                <option value="800">Compact Web (800px)</option>
              </select>
            </div>
          </div>

          {/* Download Button */}
          <div>
            <button
              onClick={() => {
                if (compressedBlob && file) {
                  downloadBlob(compressedBlob, `compressed_${file.name}`);
                }
              }}
              disabled={isProcessing || !compressedBlob}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Optimizing Pixels Locally...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Compressed Image ({compressedBlob ? formatBytes(compressedBlob.size) : ''})</span>
                </>
              )}
            </button>
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
