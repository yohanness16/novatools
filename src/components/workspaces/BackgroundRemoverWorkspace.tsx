import React, { useState, useRef, useEffect } from 'react';
import {
  BackgroundRemoverEngine,
  type RemoveBgResult,
  type RemoveBgProgress,
} from '../../engines/backgroundRemoverEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import {
  Image as ImageIcon,
  Upload,
  Download,
  Palette,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Scissors,
} from 'lucide-react';

const COLOR_SWATCHES = [
  { id: 'transparent', label: 'Transparent', value: 'transparent', isChecker: true },
  { id: 'white', label: 'Pure White', value: '#ffffff' },
  { id: 'black', label: 'Dark Studio', value: '#121215' },
  { id: 'gray', label: 'Neutral Gray', value: '#e2e8f0' },
  { id: 'blue', label: 'Studio Blue', value: '#4F8CFF' },
  { id: 'emerald', label: 'Mint Green', value: '#3FBE73' },
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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <Scissors className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop image to remove background, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Isolate subjects and export transparent PNGs in real-time. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2D33] pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-[#ECEDEF]">{file.name}</span>
                <span className="rounded bg-[#1B1D22] px-2 py-0.5 text-[10px] font-mono text-[#8B8F98] border border-[#2A2D33]">
                  {formatBytes(file.size)}
                </span>
                {result && (
                  <span className="rounded bg-[#122D1F] px-2 py-0.5 text-[10px] font-mono text-[#3FBE73] border border-[#3FBE73]/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Isolated ({result.originalWidth}×{result.originalHeight})
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
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
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
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
            className="relative w-full aspect-video sm:aspect-[16/10] max-h-[400px] rounded overflow-hidden bg-[#0B0C0F] border border-[#2A2D33] select-none flex items-center justify-center cursor-ew-resize"
          >
            {/* Checkerboard Pattern for Transparency */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #18181b 25%, transparent 25%), linear-gradient(-45deg, #18181b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #18181b 75%), linear-gradient(-45deg, transparent 75%, #18181b 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
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
              className="absolute top-0 bottom-0 w-[1px] bg-[#4F8CFF] z-20 pointer-events-none"
              style={{ left: `${splitPos}%` }}
            >
              <div
                onMouseDown={() => setIsDraggingSplit(true)}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded bg-[#131418] text-[#ECEDEF] border border-[#2A2D33] shadow-md pointer-events-auto cursor-ew-resize"
              >
                <span className="font-mono text-[9px] text-[#8B8F98]">⟷</span>
              </div>
            </div>

            {/* Badge Labels */}
            <div className="absolute top-2.5 left-2.5 bg-[#131418]/90 border border-[#2A2D33] px-2 py-0.5 rounded font-mono text-[10px] text-[#8B8F98] pointer-events-none z-10">
              Original
            </div>
            <div className="absolute top-2.5 right-2.5 bg-[#16233F]/90 border border-[#4F8CFF]/30 px-2 py-0.5 rounded font-mono text-[10px] text-[#4F8CFF] pointer-events-none z-10 font-semibold">
              Background Removed
            </div>
          </div>

          {/* Background Replacement Bar */}
          <div className="bg-[#1B1D22] p-3 rounded border border-[#2A2D33] space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-[#ECEDEF] flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-[#4F8CFF]" />
                Background Replacement Backdrop
              </label>

              <span className="text-[10px] font-mono text-[#8B8F98]">
                Mode: {bgType === 'transparent' ? 'Transparent PNG' : customColor}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
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
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
                      isSelected
                        ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                        : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                    }`}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-white/20 shrink-0"
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
              <div className="flex items-center gap-1.5 pl-2 border-l border-[#2A2D33]">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleColorChange('color', e.target.value)}
                  className="h-6 w-6 rounded border border-[#2A2D33] bg-transparent cursor-pointer"
                  title="Pick custom color"
                />
                <span className="text-[10px] text-[#8B8F98] font-mono">{customColor}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div>
            <button
              onClick={handleDownload}
              disabled={!result || isProcessing}
              className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Cutout PNG</span>
            </button>
          </div>

          {/* Progress Box */}
          {isProcessing && progressInfo && (
            <div className="rounded bg-[#16233F] border border-[#4F8CFF]/30 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#ECEDEF] flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#4F8CFF]" />
                  {progressInfo.message}
                </span>
                <span className="font-mono text-[#4F8CFF] font-bold">{progressInfo.progress}%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded bg-[#131418]">
                <div
                  className="h-full bg-[#4F8CFF] transition-all duration-300 rounded"
                  style={{ width: `${progressInfo.progress}%` }}
                />
              </div>
            </div>
          )}

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
