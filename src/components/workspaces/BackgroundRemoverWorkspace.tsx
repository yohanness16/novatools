import React, { useState, useRef, useEffect } from 'react';
import {
  BackgroundRemoverEngine,
  type RemoveBgResult,
  type RemoveBgProgress,
} from '../../engines/backgroundRemoverEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import JSZip from 'jszip';
import {
  Image as ImageIcon,
  Upload,
  Download,
  Sparkles,
  Layers,
  Palette,
  Loader2,
  AlertCircle,
  Check,
  Eye,
  Sliders,
  Scissors,
  ShieldCheck,
} from 'lucide-react';

const COLOR_SWATCHES = [
  { id: 'transparent', label: 'Transparent', value: 'transparent', isChecker: true },
  { id: 'white', label: 'Pure White', value: '#ffffff' },
  { id: 'black', label: 'Dark Studio', value: '#121215' },
  { id: 'gray', label: 'Neutral Gray', value: '#e2e8f0' },
  { id: 'blue', label: 'Studio Blue', value: '#2563eb' },
  { id: 'emerald', label: 'Mint Green', value: '#059669' },
  { id: 'purple', label: 'Deep Purple', value: '#7c3aed' },
];

export const BackgroundRemoverWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [result, setResult] = useState<RemoveBgResult | null>(null);

  // Settings
  const [bgType, setBgType] = useState<'transparent' | 'color' | 'blur'>('transparent');
  const [customColor, setCustomColor] = useState<string>('#ffffff');
  const [splitPos, setSplitPos] = useState<number>(50); // 0 to 100%

  // Processing state
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

    // Auto trigger initial removal
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
    <div className="w-full space-y-6">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border bg-surface/60 p-8 sm:p-14 hover:border-zinc-700 hover:bg-surface transition-all"
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
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all shadow-lg">
            <Scissors className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-200">
            Upload Image to Remove Background
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md text-center">
            Instantly isolate foreground subjects and export crisp transparent PNGs or custom solid backdrops. 100% in-browser processing.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Zero Cloud Uploads · $0 Server Cost · Instant Transparent PNG</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-zinc-200">{file.name}</span>
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                  {formatBytes(file.size)}
                </span>
                {result && (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Background Removed ({result.originalWidth}×{result.originalHeight})
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {result ? 'Drag the slider to inspect before/after diff' : 'Processing image...'}
              </p>
            </div>

            <button
              onClick={() => {
                if (originalUrl) URL.revokeObjectURL(originalUrl);
                setFile(null);
                setOriginalUrl(null);
                setResult(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 self-start sm:self-auto transition-colors"
            >
              Choose different image
            </button>
          </div>

          {/* Interactive Before/After Split Viewer */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDraggingSplit(false)}
            onMouseLeave={() => setIsDraggingSplit(false)}
            className="relative w-full aspect-video sm:aspect-[16/10] max-h-[460px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 select-none flex items-center justify-center cursor-ew-resize"
          >
            {/* Checkerboard Pattern for Transparency */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
              }}
            />

            {/* After Image (Full background) */}
            {result && (
              <img
                src={result.dataUrl}
                alt="Removed Background"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
            )}

            {/* Before Image (Clipped overlay) */}
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

            {/* Splitter Divider Handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-brand-500 shadow-glow-lg z-20 pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div
                onMouseDown={() => setIsDraggingSplit(true)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-900 shadow-xl border border-zinc-200 pointer-events-auto cursor-ew-resize hover:scale-110 active:scale-95 transition-transform"
              >
                <div className="flex gap-0.5">
                  <div className="h-3 w-0.5 bg-zinc-600 rounded" />
                  <div className="h-3 w-0.5 bg-zinc-600 rounded" />
                </div>
              </div>
            </div>

            {/* Badge Labels */}
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-zinc-300 pointer-events-none border border-white/10 z-10">
              Original
            </div>
            <div className="absolute top-3 right-3 bg-brand-500/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] font-mono text-white font-semibold pointer-events-none shadow-glow-sm z-10">
              No Background
            </div>
          </div>

          {/* Background Replacement Bar */}
          <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-brand-400" />
                Background Backdrop Style
              </label>

              <span className="text-[11px] font-mono text-zinc-400">
                Mode: {bgType === 'transparent' ? 'Transparent PNG' : bgType === 'color' ? customColor : 'Blurred Scene'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_SWATCHES.map((swatch) => {
                const isSelected = bgType === (swatch.id === 'transparent' ? 'transparent' : 'color') && (swatch.id === 'transparent' || customColor === swatch.value);

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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 text-brand-300 shadow-glow-sm'
                        : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-white/20 shrink-0"
                      style={
                        swatch.isChecker
                          ? {
                              backgroundImage:
                                'linear-gradient(45deg, #71717a 25%, transparent 25%), linear-gradient(-45deg, #71717a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #71717a 75%), linear-gradient(-45deg, transparent 75%, #71717a 75%)',
                              backgroundSize: '6px 6px',
                            }
                          : { backgroundColor: swatch.value }
                      }
                    />
                    <span>{swatch.label}</span>
                  </button>
                );
              })}

              {/* Custom Hex Color Picker */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange('color', e.target.value)}
                  className="h-7 w-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                  title="Pick custom color"
                />
                <span className="text-xs text-zinc-400 font-mono">{customColor}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="text-xs text-zinc-400">
              {result && (
                <span>Format: Lossless High-Resolution PNG with Full Alpha Channel</span>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={!result || isProcessing}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 px-5 text-xs font-semibold text-white shadow-glow-sm hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Download HD Image (.PNG)</span>
            </button>
          </div>

          {/* Progress Box */}
          {isProcessing && progressInfo && (
            <div className="rounded-xl border border-brand-500/30 bg-brand-500/10 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-200 flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-400" />
                  {progressInfo.message}
                </span>
                <span className="font-mono text-brand-400 font-bold">{progressInfo.progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressInfo.progress}%` }}
                />
              </div>
            </div>
          )}

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
