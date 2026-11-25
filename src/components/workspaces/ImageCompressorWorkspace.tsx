import React, { useState, useRef, useCallback } from 'react';
import { ImageEngine } from '../../engines/imageEngine';
import { formatBytes, downloadBlob, readFileAsDataURL } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import { Minimize2, Loader2, Download } from 'lucide-react';

export const ImageCompressorWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState<number>(0.75);
  const [maxWidth, setMaxWidth] = useState<number>(1920);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });
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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Minimize2 className="h-5 w-5" />}
          title="Drop image to compress, or"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">{file.name}</span>
              {compressedBlob && (
                <div className="flex items-center gap-2">
                  <span className="nt-badge-success px-2.5 py-0.5 font-mono text-[10px] font-bold">
                    -{savingsPercent}% Saved
                  </span>
                  <span className="font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">
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
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different image
            </button>
          </div>

          {originalUrl && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-mono px-1">
                <span>Original ({formatBytes(file.size)})</span>
                <span className="font-bold text-[#111214] dark:text-[#60A5FA]">Drag divider to inspect</span>
                <span>Compressed ({compressedBlob ? formatBytes(compressedBlob.size) : '...'})</span>
              </div>

              <div
                ref={containerRef}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                className="nt-well relative h-[280px] sm:h-[360px] w-full select-none overflow-hidden cursor-ew-resize"
              >
                {compressedUrl && (
                  <img
                    src={compressedUrl}
                    alt="Compressed"
                    className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                  />
                )}

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

                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#141413] dark:bg-[#2563EB] pointer-events-none z-20"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2563EB] text-[#141413] border-2 border-[#141413] shadow-card font-mono text-[10px] font-bold">
                    ⟷
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="nt-well grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                  Compression Quality
                </label>
                <span className="nt-badge-yellow px-2 py-0.5 font-mono text-xs font-bold">
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
                className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-[#111214] dark:text-[#F3F4F6]">
                  Max Width Limit
                </label>
                <span className="font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                  {maxWidth}px
                </span>
              </div>
              <select
                value={maxWidth}
                onChange={(e) => handleMaxWidthChange(Number(e.target.value))}
                className="nt-input w-full px-3 py-2 text-xs font-medium"
              >
                <option value="3840">4K Ultra (3840px)</option>
                <option value="1920">Full HD (1920px - Default)</option>
                <option value="1280">Standard HD (1280px)</option>
                <option value="800">Compact Web (800px)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              if (compressedBlob && file) {
                downloadBlob(compressedBlob, `compressed_${file.name}`);
              }
            }}
            disabled={isProcessing || !compressedBlob}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Optimizing Pixels Locally...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Compressed Image ({compressedBlob ? formatBytes(compressedBlob.size) : ''})</span>
              </>
            )}
          </button>

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
