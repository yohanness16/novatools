import React, { useState, useRef, useEffect } from 'react';
import {
  BackgroundRemoverEngine,
  type RemoveBgResult,
  type RemoveBgProgress,
} from '../../engines/backgroundRemoverEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { Download, Palette, Scissors } from 'lucide-react';

const COLOR_SWATCHES = [
  { id: 'transparent', label: 'Transparent', value: 'transparent', isChecker: true },
  { id: 'white', label: 'Pure White', value: '#ffffff' },
  { id: 'black', label: 'Studio Black', value: '#141413' },
  { id: 'cream', label: 'Warm Alabaster', value: '#F5F1E8' },
  { id: 'yellow', label: 'Studio Yellow', value: '#FACC15' },
  { id: 'emerald', label: 'Mint Green', value: '#15803D' },
];

export const BackgroundRemoverWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RemoveBgResult | null>(null);

  const [bgType, setBgType] = useState<'transparent' | 'color' | 'blur'>('transparent');
  const [customColor, setCustomColor] = useState<string>('#ffffff');
  const [splitPos, setSplitPos] = useState<number>(50);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<RemoveBgProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  useEffect(() => {
    return () => {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
    };
  }, [originalUrl]);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setResult(null);

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPEG, WebP).');
      return;
    }

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(selectedFile);
    setOriginalUrl(url);
    setFile(selectedFile);

    runRemoval(selectedFile, 'transparent', '#ffffff');
  };

  const runRemoval = async (
    targetFile: File,
    type: 'transparent' | 'color' | 'blur',
    color: string
  ) => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await BackgroundRemoverEngine.removeBackground(
        targetFile,
        {
          backgroundType: type,
          backgroundColor: type === 'color' ? color : undefined,
          blurRadius: 18,
        },
        (p) => setProgressInfo(p)
      );
      setResult(res);
    } catch (err: any) {
      setError('Background removal failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleColorChange = (type: 'transparent' | 'color' | 'blur', color: string) => {
    setBgType(type);
    setCustomColor(color);
    if (file) {
      runRemoval(file, type, color);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(result.blob, `${baseName}_no_bg.png`);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSplit || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSplitPos((x / rect.width) * 100);
  };

  return (
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<Scissors className="h-5 w-5" />}
          title="Drop image to remove background, or"
          subtitle="Isolate foreground subjects and export transparent PNGs in real-time."
          badgeText="100% Local AI Engine"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">{file.name}</span>
                <span className="nt-badge-yellow px-2 py-0.5 text-[10px] font-mono font-bold">
                  {formatBytes(file.size)}
                </span>
                {result && (
                  <span className="nt-badge-success px-2.5 py-0.5 text-[10px] font-mono font-bold">
                    Isolated ({result.originalWidth}×{result.originalHeight})
                  </span>
                )}
              </div>
              <p className="text-xs text-[#746D61] dark:text-[#938B7D] font-mono mt-0.5">
                {result ? 'Drag divider to inspect before/after difference' : 'Extracting foreground in memory...'}
              </p>
            </div>

            <button
              onClick={() => {
                if (originalUrl) URL.revokeObjectURL(originalUrl);
                setFile(null);
                setOriginalUrl(null);
                setResult(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold self-start sm:self-auto"
            >
              Choose different image
            </button>
          </div>

          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDraggingSplit(false)}
            onMouseLeave={() => setIsDraggingSplit(false)}
            className="relative w-full aspect-video sm:aspect-[16/10] max-h-[400px] rounded-xl overflow-hidden bg-checkerboard border border-[var(--nt-border)] select-none flex items-center justify-center cursor-ew-resize shadow-well"
          >
            {result && (
              <img
                src={result.dataUrl}
                alt="Removed Background"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
            )}

            {originalUrl && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${splitPos}%` }}
              >
                <img
                  src={originalUrl}
                  alt="Original Image"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                  style={{
                    width: containerRef.current?.clientWidth || '100%',
                    maxWidth: 'none',
                  }}
                />
              </div>
            )}

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#141413] dark:bg-[#FACC15] z-20 pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div
                onMouseDown={() => setIsDraggingSplit(true)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-[#FACC15] text-[#141413] border-2 border-[#141413] shadow-card pointer-events-auto cursor-ew-resize font-mono text-[10px] font-bold"
              >
                ⟷
              </div>
            </div>

            <div className="nt-card absolute top-2.5 left-2.5 px-2.5 py-1 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0] pointer-events-none z-10">
              Original
            </div>
            <div className="nt-badge-dark absolute top-2.5 right-2.5 px-2.5 py-1 font-mono text-[10px] font-bold pointer-events-none z-10">
              Background Removed
            </div>
          </div>

          <div className="nt-well p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                Background Replacement Backdrop
              </label>

              <span className="text-[11px] font-mono text-[#746D61] dark:text-[#938B7D]">
                Mode: {bgType === 'transparent' ? 'Transparent PNG' : customColor}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected =
                  bgType === (swatch.id === 'transparent' ? 'transparent' : 'color') &&
                  (swatch.id === 'transparent' || customColor === swatch.value);

                return (
                  <button
                    key={swatch.id}
                    onClick={() => {
                      if (swatch.id === 'transparent') {
                        handleColorChange('transparent', 'transparent');
                      } else {
                        handleColorChange('color', swatch.value);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                        : 'nt-btn-secondary'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-black/20 shrink-0"
                      style={
                        swatch.isChecker
                          ? {
                              backgroundImage:
                                'linear-gradient(45deg, #9f9686 25%, transparent 25%), linear-gradient(-45deg, #9f9686 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #9f9686 75%), linear-gradient(-45deg, transparent 75%, #9f9686 75%)',
                              backgroundSize: '6px 6px',
                            }
                          : { backgroundColor: swatch.value }
                      }
                    />
                    <span>{swatch.label}</span>
                  </button>
                );
              })}

              <div className="flex items-center gap-1.5 pl-2 border-l border-[var(--nt-border)]">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange('color', e.target.value)}
                  className="h-7 w-7 rounded-lg border border-[var(--nt-border)] bg-transparent cursor-pointer"
                  title="Pick custom color"
                />
                <span className="text-[11px] text-[#746D61] dark:text-[#938B7D] font-mono">{customColor}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={!result || isProcessing}
            className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            <span>Download Cutout PNG</span>
          </button>

          {isProcessing && progressInfo && (
            <WorkspaceProgress message={progressInfo.message} progress={progressInfo.progress} />
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
