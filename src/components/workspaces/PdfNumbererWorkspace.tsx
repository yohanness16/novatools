import React, { useState, useRef, useEffect } from 'react';
import {
  PdfNumbererEngine,
  type StampPosition,
  type NumberingResult,
  type NumberingProgress,
} from '../../engines/pdfNumbererEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import {
  FileText,
  Upload,
  Download,
  Sparkles,
  Sliders,
  RotateCcw,
  Loader2,
  AlertCircle,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';

const POSITION_OPTIONS: { id: StampPosition; label: string; icon: any }[] = [
  { id: 'top-left', label: 'Top Left', icon: ArrowUpLeft },
  { id: 'top-center', label: 'Top Center', icon: ArrowUp },
  { id: 'top-right', label: 'Top Right', icon: ArrowUpRight },
  { id: 'bottom-left', label: 'Bottom Left', icon: ArrowDownLeft },
  { id: 'bottom-center', label: 'Bottom Center', icon: ArrowDown },
  { id: 'bottom-right', label: 'Bottom Right', icon: ArrowDownRight },
];

const TEMPLATE_PRESETS = [
  { id: 'Page {page} of {total}', label: 'Page 1 of 10' },
  { id: '{page} / {total}', label: '1 / 10' },
  { id: 'Page {page}', label: 'Page 1' },
  { id: '{page}', label: '1' },
  { id: '- {page} -', label: '- 1 -' },
  { id: 'roman', label: 'Roman (i, ii, iii)' },
];

export const PdfNumbererWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<StampPosition>('bottom-center');
  const [template, setTemplate] = useState<string>('Page {page} of {total}');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstNPages, setSkipFirstNPages] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(11);
  const [colorHex, setColorHex] = useState<string>('#333333');
  const [margin, setMargin] = useState<number>(32);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<NumberingProgress | null>(null);
  const [result, setResult] = useState<NumberingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setResult(null);

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    setFile(selectedFile);
  };

  const handleStamp = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgressInfo({
      status: 'loading',
      progress: 5,
      currentPage: 0,
      totalPages: 0,
      message: 'Opening PDF document...',
    });

    try {
      const res = await PdfNumbererEngine.stampPageNumbers(
        file,
        {
          position,
          template,
          startNumber,
          skipFirstNPages,
          fontSize,
          colorHex,
          margin,
        },
        (p) => setProgressInfo(p)
      );

      setResult(res);
    } catch (err: any) {
      setError('Numbering failed: ' + (err?.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    downloadBlob(result.blob, `${baseName}_numbered.pdf`);
  };

  const getPreviewSampleText = () => {
    if (template === 'roman') return 'i';
    return template.replace(/{page}/gi, '1').replace(/{total}/gi, '10');
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
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
              e.target.value = '';
            }}
          />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:scale-105 group-hover:border-brand-500/50 group-hover:text-brand-400 transition-all shadow-lg">
            <FileText className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-zinc-200">
            Upload PDF Document to Add Page Numbers
          </h3>
          <p className="mt-1 text-xs text-zinc-400 max-w-md text-center">
            Add customizable vector page numbers, Roman numerals, and header/footer metadata stamps to all PDF pages with 100% in-browser security.
          </p>
          <div className="mt-4 flex items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>100% Client-Side vector text injection via pdf-lib · Zero Server Uploads</span>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-surface-border bg-surface p-4 sm:p-6 space-y-6">
          {/* Header Bar */}
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
                    {result.stampedPages} Pages Stamped
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {result ? 'PDF stamped · Ready to download' : 'Select stamp alignment and numbering format'}
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 self-start sm:self-auto transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {/* Main Controls & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Page Preview Mockup (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-zinc-950/80 rounded-2xl border border-zinc-800 space-y-4">
              <span className="text-xs font-medium text-zinc-400">Live Page Layout Preview</span>

              {/* Simulated Paper Sheet */}
              <div className="relative w-[210px] h-[280px] bg-white rounded-lg shadow-2xl border border-zinc-200 p-4 flex flex-col justify-between overflow-hidden">
                {/* Dummy lines representing page body */}
                <div className="space-y-2 pointer-events-none opacity-20">
                  <div className="h-2 w-3/4 bg-zinc-900 rounded" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded" />
                  <div className="h-1.5 w-5/6 bg-zinc-800 rounded" />
                  <div className="h-1.5 w-full bg-zinc-800 rounded" />
                  <div className="h-1.5 w-2/3 bg-zinc-800 rounded" />
                </div>

                {/* Simulated Stamp Position */}
                <div
                  className={`absolute font-mono text-zinc-800 font-semibold px-2 transition-all ${
                    position === 'top-left'
                      ? 'top-3 left-3 text-left'
                      : position === 'top-center'
                      ? 'top-3 inset-x-0 text-center'
                      : position === 'top-right'
                      ? 'top-3 right-3 text-right'
                      : position === 'bottom-left'
                      ? 'bottom-3 left-3 text-left'
                      : position === 'bottom-center'
                      ? 'bottom-3 inset-x-0 text-center'
                      : 'bottom-3 right-3 text-right'
                  }`}
                  style={{
                    fontSize: `${Math.max(9, fontSize - 2)}px`,
                    color: colorHex,
                  }}
                >
                  <span className="bg-brand-500/15 text-brand-700 px-1 py-0.5 rounded border border-brand-500/30">
                    {getPreviewSampleText()}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-zinc-500">
                Position: {position.replace('-', ' ').toUpperCase()} · Template: {template}
              </span>
            </div>

            {/* Settings & Configuration Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Position Matrix Grid */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-2.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Stamp Position on Page
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {POSITION_OPTIONS.map((pos) => {
                    const Icon = pos.icon;
                    const isSelected = position === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id)}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-brand-300 shadow-glow-sm'
                            : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{pos.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number Format Presets */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-2.5">
                <label className="text-xs font-medium text-zinc-300 block">
                  Number Format Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TEMPLATE_PRESETS.map((preset) => {
                    const isSelected = template === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setTemplate(preset.id)}
                        className={`p-2 rounded-lg border text-xs text-center font-mono font-medium transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-brand-300 shadow-glow-sm'
                            : 'border-zinc-800 bg-zinc-950/70 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 text-xs">
                {/* Starting Number */}
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium block">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-zinc-200 font-mono focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Skip First N Pages */}
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium block">Skip Cover Pages</label>
                  <input
                    type="number"
                    min={0}
                    value={skipFirstNPages}
                    onChange={(e) => setSkipFirstNPages(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-zinc-200 font-mono focus:border-brand-500 focus:outline-none"
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <label className="text-zinc-400 font-medium block">Font Size ({fontSize}pt)</label>
                  <input
                    type="range"
                    min={8}
                    max={18}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-brand-500 mt-2"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleStamp}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 px-4 text-xs font-semibold text-white shadow-glow-sm hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Stamping PDF in Browser...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Apply Page Numbers & Stamp</span>
                  </>
                )}
              </button>
            </div>
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

          {/* Result Download Bar */}
          {result && (
            <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
              <div>
                <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Numbered PDF Ready
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {result.stampedPages} of {result.pageCount} pages stamped with vector typography
                </p>
              </div>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow-glow-sm active:scale-95 transition-all self-start sm:self-auto"
              >
                <Download className="h-4 w-4" />
                <span>Download Numbered PDF ({formatBytes(result.blob.size)})</span>
              </button>
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
