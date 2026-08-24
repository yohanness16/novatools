import React, { useState, useRef } from 'react';
import {
  PdfNumbererEngine,
  type NumbererPosition,
  type NumbererTemplate,
  type NumbererProgress,
  type NumbererResult,
} from '../../engines/pdfNumbererEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import {
  FileText,
  Upload,
  Download,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ShieldCheck,
} from 'lucide-react';

const POSITION_OPTIONS: { id: NumbererPosition; label: string; icon: any }[] = [
  { id: 'top-left', label: 'Top Left', icon: AlignLeft },
  { id: 'top-center', label: 'Top Center', icon: AlignCenter },
  { id: 'top-right', label: 'Top Right', icon: AlignRight },
  { id: 'bottom-left', label: 'Bottom Left', icon: AlignLeft },
  { id: 'bottom-center', label: 'Bottom Center', icon: AlignCenter },
  { id: 'bottom-right', label: 'Bottom Right', icon: AlignRight },
];

const TEMPLATE_PRESETS: { id: NumbererTemplate; label: string }[] = [
  { id: 'Page {page}', label: 'Page {page}' },
  { id: '{page}', label: '{page}' },
  { id: 'Page {page} of {total}', label: 'Page {page} of {total}' },
  { id: '{page} / {total}', label: '{page} / {total}' },
  { id: '- {page} -', label: '- {page} -' },
  { id: 'roman', label: 'Roman (i, ii, iii)' },
];

export const PdfNumbererWorkspace: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<NumbererResult | null>(null);

  // Stamping Parameters
  const [position, setPosition] = useState<NumbererPosition>('bottom-center');
  const [template, setTemplate] = useState<NumbererTemplate>('Page {page} of {total}');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstNPages, setSkipFirstNPages] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(11);
  const [colorHex, setColorHex] = useState<string>('#333333');

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<NumbererProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (selectedFile: File) => {
    setError(null);
    setResult(null);

    if (
      selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('Please select a valid PDF document.');
      return;
    }

    setFile(selectedFile);
  };

  const handleStamp = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProgressInfo({ stage: 'parsing', progress: 10, message: 'Reading vector PDF stream...' });

    try {
      const res = await PdfNumbererEngine.addPageNumbers(
        file,
        {
          position,
          template,
          startNumber,
          skipFirstNPages,
          fontSize,
          colorHex,
          marginPoints: 32,
        },
        (progress) => {
          setProgressInfo(progress);
        }
      );

      setResult(res);
    } catch (err: any) {
      setError('Page numbering failed: ' + (err?.message || err));
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
    <div className="w-full space-y-4">
      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative flex cursor-pointer flex-col items-center justify-center rounded border border-dashed border-[#2A2D33] bg-[#1B1D22] p-6 sm:p-10 hover:border-[#4F8CFF] hover:bg-[#151820] transition-colors"
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
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#131418] border border-[#2A2D33] text-[#8B8F98] group-hover:text-[#4F8CFF] group-hover:border-[#4F8CFF]/40 transition-colors">
            <FileText className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-xs font-semibold text-[#ECEDEF]">
            Drop PDF to stamp page numbers, or <span className="text-[#4F8CFF] underline">browse files</span>
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-[#8B8F98]">
            Vector page numbering and Roman numerals across 6 alignment anchors. 100% local WASM.
          </p>
        </div>
      ) : (
        <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
          {/* Header Bar */}
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
                    {result.stampedPages} Pages Stamped
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                {result ? 'PDF stamped · Ready to download' : 'Select stamp alignment and numbering format'}
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="font-mono text-[11px] text-[#8B8F98] hover:text-[#ECEDEF] transition-colors"
            >
              Choose different PDF
            </button>
          </div>

          {/* Main Controls & Live Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Visual Page Preview Mockup (5 cols) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-[#0B0C0F] rounded border border-[#2A2D33] space-y-3">
              <span className="text-[11px] font-mono text-[#8B8F98]">Page Layout Preview</span>

              {/* Simulated Paper Sheet */}
              <div className="relative w-[180px] h-[240px] bg-white rounded shadow-md border border-[#2A2D33] p-3 flex flex-col justify-between overflow-hidden">
                {/* Dummy lines representing page body */}
                <div className="space-y-1.5 pointer-events-none opacity-25">
                  <div className="h-1.5 w-3/4 bg-zinc-900 rounded" />
                  <div className="h-1 w-full bg-zinc-800 rounded" />
                  <div className="h-1 w-full bg-zinc-800 rounded" />
                  <div className="h-1 w-5/6 bg-zinc-800 rounded" />
                  <div className="h-1 w-full bg-zinc-800 rounded" />
                  <div className="h-1 w-2/3 bg-zinc-800 rounded" />
                </div>

                {/* Simulated Stamp Position */}
                <div
                  className={`absolute font-mono text-zinc-800 font-semibold px-2 transition-all ${
                    position === 'top-left'
                      ? 'top-2.5 left-2.5 text-left'
                      : position === 'top-center'
                      ? 'top-2.5 inset-x-0 text-center'
                      : position === 'top-right'
                      ? 'top-2.5 right-2.5 text-right'
                      : position === 'bottom-left'
                      ? 'bottom-2.5 left-2.5 text-left'
                      : position === 'bottom-center'
                      ? 'bottom-2.5 inset-x-0 text-center'
                      : 'bottom-2.5 right-2.5 text-right'
                  }`}
                  style={{
                    fontSize: `${Math.max(8, fontSize - 3)}px`,
                    color: colorHex,
                  }}
                >
                  <span className="bg-[#4F8CFF]/15 text-[#16233F] px-1 py-0.5 rounded border border-[#4F8CFF]/30">
                    {getPreviewSampleText()}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#8B8F98]">
                {position.replace('-', ' ').toUpperCase()} · {template}
              </span>
            </div>

            {/* Settings & Configuration Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              {/* Position Matrix Grid */}
              <div className="bg-[#1B1D22] p-3 rounded border border-[#2A2D33] space-y-2">
                <label className="text-xs font-medium text-[#ECEDEF] block">
                  Stamp Position on Page
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {POSITION_OPTIONS.map((pos) => {
                    const Icon = pos.icon;
                    const isSelected = position === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id)}
                        className={`flex items-center justify-center gap-1.5 p-2 rounded border text-xs font-medium transition-colors ${
                          isSelected
                            ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                            : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                        }`}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{pos.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Number Format Presets */}
              <div className="bg-[#1B1D22] p-3 rounded border border-[#2A2D33] space-y-2">
                <label className="text-xs font-medium text-[#ECEDEF] block">
                  Number Format Template
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {TEMPLATE_PRESETS.map((preset) => {
                    const isSelected = template === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setTemplate(preset.id)}
                        className={`p-1.5 rounded border text-xs text-center font-mono transition-colors ${
                          isSelected
                            ? 'border-[#4F8CFF] bg-[#16233F] text-[#4F8CFF]'
                            : 'border-[#2A2D33] bg-[#131418] text-[#8B8F98] hover:text-[#ECEDEF]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-[#1B1D22] p-3 rounded border border-[#2A2D33] text-xs">
                {/* Starting Number */}
                <div className="space-y-1">
                  <label className="text-[#8B8F98] font-medium block">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full rounded border border-[#2A2D33] bg-[#131418] px-2 py-1 text-[#ECEDEF] font-mono focus:border-[#4F8CFF] focus:outline-none"
                  />
                </div>

                {/* Skip First N Pages */}
                <div className="space-y-1">
                  <label className="text-[#8B8F98] font-medium block">Skip Cover Pages</label>
                  <input
                    type="number"
                    min={0}
                    value={skipFirstNPages}
                    onChange={(e) => setSkipFirstNPages(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded border border-[#2A2D33] bg-[#131418] px-2 py-1 text-[#ECEDEF] font-mono focus:border-[#4F8CFF] focus:outline-none"
                  />
                </div>

                {/* Font Size */}
                <div className="space-y-1">
                  <label className="text-[#8B8F98] font-medium block">Font Size ({fontSize}pt)</label>
                  <input
                    type="range"
                    min={8}
                    max={18}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-[#131418] rounded appearance-none cursor-pointer accent-[#4F8CFF] mt-2"
                  />
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleStamp}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded bg-[#4F8CFF] hover:bg-[#3B79F0] py-2.5 px-4 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Stamping PDF in Browser...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Apply Page Numbers & Stamp</span>
                  </>
                )}
              </button>
            </div>
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

          {/* Result Download Bar */}
          {result && (
            <div className="rounded border border-[#3FBE73]/30 bg-[#122D1F] p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h5 className="text-xs font-bold text-[#ECEDEF] flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-[#3FBE73]" />
                  Numbered PDF Ready
                </h5>
                <p className="text-[10px] text-[#8B8F98] font-mono mt-0.5">
                  {result.stampedPages} of {result.pageCount} pages stamped with vector typography
                </p>
              </div>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 rounded bg-[#3FBE73] hover:bg-[#349e5f] px-3.5 py-1.5 text-xs font-semibold text-black transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Numbered PDF ({formatBytes(result.blob.size)})</span>
              </button>
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
