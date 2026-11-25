import React, { useState, useRef } from 'react';
import {
  PdfNumbererEngine,
  type NumbererPosition,
  type NumbererTemplate,
  type NumbererProgress,
  type NumbererResult,
} from '../../engines/pdfNumbererEngine';
import { formatBytes, downloadBlob } from '../../lib/utils';
import { WorkspaceDropzone, WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import {
  FileText,
  Download,
  Sparkles,
  Loader2,
  AlignLeft,
  AlignCenter,
  AlignRight,
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

  const [position, setPosition] = useState<NumbererPosition>('bottom-center');
  const [template, setTemplate] = useState<NumbererTemplate>('Page {page} of {total}');
  const [startNumber, setStartNumber] = useState<number>(1);
  const [skipFirstNPages, setSkipFirstNPages] = useState<number>(0);
  const [fontSize, setFontSize] = useState<number>(11);
  const [colorHex] = useState<string>('#141413');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<NumbererProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    if (files[0]) handleFile(files[0]);
  });

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
    <div className="w-full space-y-5">
      {!file ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && handleFile(files[0])}
          icon={<FileText className="h-5 w-5" />}
          title="Drop PDF to stamp page numbers, or"
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
        </WorkspaceDropzone>
      ) : (
        <div className="nt-card p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-extrabold text-[#111214] dark:text-[#F3F4F6]">{file.name}</span>
                <span className="nt-badge-yellow px-2 py-0.5 text-[10px] font-mono font-bold">
                  {formatBytes(file.size)}
                </span>
                {result && (
                  <span className="nt-badge-success px-2 py-0.5 text-[10px] font-mono font-bold">
                    {result.stampedPages} Pages Stamped
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] font-mono mt-0.5">
                {result ? 'PDF stamped · Ready to download' : 'Select stamp alignment and numbering format'}
              </p>
            </div>

            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="nt-btn-secondary px-3 py-1.5 font-mono text-[11px] font-semibold"
            >
              Choose different PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Live Page Mockup */}
            <div className="lg:col-span-5 nt-well flex flex-col items-center justify-center p-5 space-y-3">
              <span className="text-[11px] font-mono font-bold text-[#6B7280] dark:text-[#9CA3AF]">
                Page Layout Preview
              </span>

              <div className="nt-card relative w-[184px] h-[246px] !bg-white p-4 flex flex-col justify-between overflow-hidden">
                <div className="space-y-2 pointer-events-none opacity-25">
                  <div className="h-2 w-3/4 bg-[#141413] rounded" />
                  <div className="h-1.5 w-full bg-[#746D61] rounded" />
                  <div className="h-1.5 w-full bg-[#746D61] rounded" />
                  <div className="h-1.5 w-5/6 bg-[#746D61] rounded" />
                  <div className="h-1.5 w-full bg-[#746D61] rounded" />
                  <div className="h-1.5 w-2/3 bg-[#746D61] rounded" />
                </div>

                <div
                  className={`absolute font-mono font-bold px-2 transition-all ${
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
                  style={{ fontSize: `${Math.max(8, fontSize - 3)}px` }}
                >
                  <span className="bg-[#2563EB] text-[#141413] px-1.5 py-0.5 rounded shadow-sm">
                    {getPreviewSampleText()}
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono font-semibold text-[#6B7280] dark:text-[#9CA3AF]">
                {position.replace('-', ' ').toUpperCase()} · {template}
              </span>
            </div>

            {/* Settings */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="nt-well p-3.5 space-y-2">
                <label className="text-xs font-extrabold text-[#111214] dark:text-[#F3F4F6] block">
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
                        className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#111214] dark:bg-[#2563EB] text-white border-[#141413] shadow-sm'
                            : 'nt-btn-secondary'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{pos.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="nt-well p-3.5 space-y-2">
                <label className="text-xs font-extrabold text-[#111214] dark:text-[#F3F4F6] block">
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
                        className={`p-2 rounded-xl border text-xs text-center font-mono font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#111214] dark:bg-[#2563EB] text-white border-[#141413] shadow-sm'
                            : 'nt-btn-secondary'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="nt-well grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 text-xs">
                <div className="space-y-1">
                  <label className="text-[#4B5563] dark:text-[#D1D5DB] font-bold block">Start Number</label>
                  <input
                    type="number"
                    min={1}
                    value={startNumber}
                    onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                    className="nt-input w-full px-2.5 py-1.5 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#4B5563] dark:text-[#D1D5DB] font-bold block">Skip Cover Pages</label>
                  <input
                    type="number"
                    min={0}
                    value={skipFirstNPages}
                    onChange={(e) => setSkipFirstNPages(parseInt(e.target.value, 10) || 0)}
                    className="nt-input w-full px-2.5 py-1.5 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[#4B5563] dark:text-[#D1D5DB] font-bold block">Font Size ({fontSize}pt)</label>
                  <input
                    type="range"
                    min={8}
                    max={18}
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full h-1.5 bg-white dark:bg-[#141311] rounded appearance-none cursor-pointer mt-2.5"
                  />
                </div>
              </div>

              <button
                onClick={handleStamp}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-3 px-4 text-xs disabled:opacity-40"
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

          {isProcessing && progressInfo && (
            <WorkspaceProgress message={progressInfo.message} progress={progressInfo.progress} />
          )}

          {result && (
            <WorkspaceAlert
              variant="success"
              message={`Numbered PDF Ready (${result.stampedPages} of ${result.pageCount} pages stamped)`}
              action={
                <button
                  onClick={handleDownload}
                  className="nt-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download ({formatBytes(result.blob.size)})</span>
                </button>
              }
            />
          )}

          {error && <WorkspaceAlert variant="error" message={error} />}
        </div>
      )}
    </div>
  );
};
