import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { Upload, Minimize2, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react';

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
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-12 hover:border-zinc-700 hover:bg-surface transition-all"
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
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all">
            <Minimize2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-zinc-200">
            Upload Image to Compress with Visual Diff
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Compare original vs compressed quality side-by-side in real time.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-zinc-200">{file.name}</span>
              {compressedBlob && (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-400 border border-emerald-500/20">
                    -{savingsPercent}% Saved
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
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
              className="text-xs text-zinc-400 hover:text-zinc-200"
            >
              Choose different image
            </button>
          </div>

          {/* Interactive Split Diff Viewer */}
          {originalUrl && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs text-zinc-400 px-1">
                <span>← Original File</span>
                <span className="text-brand-400 font-mono text-[11px]">Drag divider to compare</span>
                <span>Compressed Output →</span>
              </div>

              <div
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="relative h-[320px] sm:h-[400px] w-full select-none overflow-hidden rounded-2xl border border-zinc-800 bg-black/60 cursor-ew-resize"
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
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow-lg pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-900 shadow-xl border border-zinc-200">
                    <span className="text-[10px] font-bold tracking-tighter">⟷</span>
                  </div>
                </div>

                {/* Corner Indicator Labels */}
                <span className="absolute bottom-3 left-3 rounded-lg bg-black/70 px-2 py-1 font-mono text-[10px] text-zinc-300 backdrop-blur-sm pointer-events-none">
                  Original: {formatBytes(file.size)}
                </span>
                <span className="absolute bottom-3 right-3 rounded-lg bg-emerald-950/80 border border-emerald-500/30 px-2 py-1 font-mono text-[10px] text-emerald-300 backdrop-blur-sm pointer-events-none">
                  Compressed: {compressedBlob ? formatBytes(compressedBlob.size) : '...'}
                </span>
              </div>
            </div>
          )}

          {/* Sliders and Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Compression Quality
                </label>
                <span className="font-mono text-xs text-brand-400 font-semibold">
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
                className="w-full accent-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Max Width Limit
                </label>
                <span className="font-mono text-xs text-zinc-400">
                  {maxWidth}px
                </span>
              </div>
              <select
                value={maxWidth}
                onChange={(e) => handleMaxWidthChange(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-100 focus:border-brand-500 focus:outline-none"
              >
                <option value="3840">4K Ultra (3840px)</option>
                <option value="1920">Full HD (1920px - Default)</option>
                <option value="1280">Standard HD (1280px)</option>
                <option value="800">Compact Web (800px)</option>
              </select>
            </div>
          </div>

          {/* Download Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (compressedBlob && file) {
                  downloadBlob(compressedBlob, `compressed_${file.name}`);
                }
              }}
              disabled={isProcessing || !compressedBlob}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-glow-sm transition-all hover:bg-brand-600 active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Optimizing Pixels...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download Compressed Image ({compressedBlob ? formatBytes(compressedBlob.size) : ''})</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
