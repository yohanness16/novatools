import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileCode,
  Layers,
  BookOpen,
} from 'lucide-react';
import { PdfEngine } from '../../engines/pdfEngine';
import { DocEngine } from '../../engines/docEngine';
import { WorkspaceDropzone } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';

export default function PdfToDocWorkspace() {
  const [extractedMarkdown, setExtractedMarkdown] = useState<string>('');
  const [extractedPlainText, setExtractedPlainText] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(0);
  const [pages, setPages] = useState<{ pageNumber: number; text: string; markdown: string }[]>([]);
  const [selectedPageIdx, setSelectedPageIdx] = useState<number>(0);
  const [docTitle, setDocTitle] = useState<string>('Converted Document');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [pdfBuffer, setPdfBuffer] = useState<ArrayBuffer | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useHandoffFiles((files) => {
    if (files[0]) processPdfFile(files[0]);
  });

  const processPdfFile = async (file: File) => {
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      setStatusMessage('Please select a valid .pdf document.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setStatusMessage(`Ingesting ${file.name}...`);
    const title = file.name.replace(/\.pdf$/i, '');
    setDocTitle(title);

    try {
      const buffer = await file.arrayBuffer();
      setPdfBuffer(buffer);

      setStatusMessage('Extracting text layers, typography, and semantic structure...');
      const result = await PdfEngine.extractTextAndStructureFromPdf(buffer, (current, total) => {
        setProgressPercent(Math.round((current / total) * 90));
        setStatusMessage(`Processing page ${current} of ${total}...`);
      });

      setExtractedMarkdown(result.markdown);
      setExtractedPlainText(result.plainText);
      setPageCount(result.pageCount);
      setPages(result.pages);
      setSelectedPageIdx(0);
      setProgressPercent(100);
      setStatusMessage(`Successfully converted ${result.pageCount} page(s) to editable Word & Markdown!`);
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Extraction error: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processPdfFile(file);
  };

  const handleDownloadDocx = async () => {
    if (!extractedMarkdown) return;
    setIsProcessing(true);
    setStatusMessage('Compiling native Microsoft Word (.docx)...');

    try {
      const docxBlob = await DocEngine.markdownToDocx(extractedMarkdown, docTitle);
      downloadBlob(docxBlob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.docx`);
      setStatusMessage('Word document downloaded successfully!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Word export error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!extractedMarkdown) return;
    const blob = new Blob([extractedMarkdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.md`);
  };

  const handleDownloadPlainText = () => {
    if (!extractedPlainText) return;
    const blob = new Blob([extractedPlainText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.txt`);
  };

  const handleCopy = () => {
    if (!extractedMarkdown) return;
    navigator.clipboard.writeText(extractedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [activeViewMode, setActiveViewMode] = useState<'preview' | 'editor' | 'visual'>('preview');
  const [pageCanvasUrl, setPageCanvasUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (pdfBuffer && pageCount > 0) {
      PdfEngine.renderPageToCanvas(pdfBuffer, selectedPageIdx + 1, 1.2)
        .then((canvas) => setPageCanvasUrl(canvas.toDataURL()))
        .catch(() => setPageCanvasUrl(null));
    }
  }, [selectedPageIdx, pdfBuffer, pageCount]);

  const handlePageMarkdownChange = (newMd: string) => {
    const updatedPages = [...pages];
    if (updatedPages[selectedPageIdx]) {
      updatedPages[selectedPageIdx].markdown = newMd;
      setPages(updatedPages);
      setExtractedMarkdown(updatedPages.map((p) => p.markdown).join('\n\n'));
    }
  };

  const metadata = DocEngine.getDocMetadata(extractedMarkdown, docTitle);

  return (
    <div className="w-full space-y-5">
      <div className="nt-well p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#141413] dark:text-[#FAF7F0]">
              {docTitle}
            </span>
            <p className="text-xs text-[#746D61] dark:text-[#938B7D] flex items-center gap-2 mt-0.5 font-mono">
              <span>{pageCount} pages</span>
              <span>·</span>
              <span>{metadata.wordCount} words</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,application/pdf"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="nt-btn-yellow px-4 py-2 text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="nt-badge-yellow rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 font-mono font-bold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{statusMessage}</span>
          {progressPercent > 0 && progressPercent < 100 && (
            <span className="ml-auto">{progressPercent}%</span>
          )}
        </div>
      )}

      {!extractedMarkdown ? (
        <WorkspaceDropzone
          onClick={() => fileInputRef.current?.click()}
          onFilesDrop={(files) => files[0] && processPdfFile(files[0])}
          icon={<Upload className="w-5 h-5" />}
          title="Drop your PDF document here, or"
        />
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 nt-card p-4 flex flex-col h-[620px]">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--nt-border)]">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
                  Pages ({pages.length})
                </span>
                <span className="text-[11px] text-[#746D61] font-mono">Select page</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {pages.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPageIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-2 cursor-pointer ${
                      selectedPageIdx === idx
                        ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 border-[#141413] dark:border-[#FACC15] text-[#141413] dark:text-[#FAF7F0] shadow-sm'
                        : 'nt-subcard text-[#454038] dark:text-[#CBC4B6] hover:border-[var(--nt-border-strong)]'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold">Page {p.pageNumber}</div>
                      <p className="text-[11px] opacity-75 line-clamp-2 mt-0.5 font-mono">
                        {p.text.slice(0, 80) || 'Empty or image page'}
                      </p>
                    </div>
                    <span className="nt-badge-dark text-[10px] font-mono px-2 py-0.5 shrink-0 font-bold">
                      {p.text.split(/\s+/).filter(Boolean).length} w
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 nt-card p-4 flex flex-col h-[620px]">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--nt-border)]">
                <div className="nt-well flex items-center gap-1 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveViewMode('preview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeViewMode === 'preview'
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                        : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Word Preview
                  </button>

                  <button
                    onClick={() => setActiveViewMode('editor')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeViewMode === 'editor'
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                        : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    Edit Text
                  </button>

                  <button
                    onClick={() => setActiveViewMode('visual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      activeViewMode === 'visual'
                        ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                        : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Original PDF
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="nt-btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy All'}</span>
                </button>
              </div>

              {activeViewMode === 'preview' && (
                <div className="flex-1 bg-white text-[#141413] rounded-xl p-8 overflow-y-auto shadow-well border border-[var(--nt-border)] prose prose-stone max-w-none text-xs sm:text-sm">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DocEngine.markdownToHtml(pages[selectedPageIdx]?.markdown || extractedMarkdown),
                    }}
                  />
                </div>
              )}

              {activeViewMode === 'editor' && (
                <textarea
                  value={pages[selectedPageIdx]?.markdown || ''}
                  onChange={(e) => handlePageMarkdownChange(e.target.value)}
                  placeholder="Edit extracted text or markdown..."
                  className="nt-input flex-1 w-full p-4 text-xs font-mono resize-none overflow-y-auto leading-relaxed"
                />
              )}

              {activeViewMode === 'visual' && (
                <div className="nt-well flex-1 p-4 flex items-center justify-center overflow-auto">
                  {pageCanvasUrl ? (
                    <img
                      src={pageCanvasUrl}
                      alt={`PDF Page ${selectedPageIdx + 1}`}
                      className="max-h-full max-w-full rounded-xl shadow-card border border-[var(--nt-border)] object-contain"
                    />
                  ) : (
                    <div className="text-xs text-[#746D61] flex items-center gap-2 font-mono">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Rendering page visual...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="nt-well p-4 flex flex-wrap items-center justify-end gap-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadDocx}
                disabled={isProcessing}
                className="nt-btn-yellow px-4 py-2 text-xs flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Download Word (.docx)
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <FileCode className="w-4 h-4" />
                Markdown (.md)
              </button>

              <button
                onClick={handleDownloadPlainText}
                className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Plain Text (.txt)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
