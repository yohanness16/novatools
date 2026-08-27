import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileCode,
  ShieldCheck,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { PdfEngine } from '../../engines/pdfEngine';
import { DocEngine } from '../../engines/docEngine';

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // Render canvas visual thumbnail whenever selected page changes
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
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              PDF to Word (DOCX) & Markdown Converter
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                Lossless Typography
              </span>
            </h1>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
              <span>{pageCount} page(s)</span>
              <span>•</span>
              <span>{metadata.wordCount} words extracted</span>
              <span>•</span>
              <span>100% Client-Side Private</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
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
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-glow-sm"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-300 flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{statusMessage}</span>
          {progressPercent > 0 && progressPercent < 100 && (
            <span className="ml-auto font-mono text-[11px] font-bold">{progressPercent}%</span>
          )}
        </div>
      )}

      {/* Main Workspace Area */}
      {!extractedMarkdown ? (
        /* Empty State Dropzone */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-zinc-800 hover:border-blue-500/50 rounded-2xl p-12 text-center cursor-pointer transition-all bg-surface/40 hover:bg-surface/60 flex flex-col items-center justify-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Drop your PDF document here</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Extracts text layers, headings, bullet lists, and converts into editable Microsoft Word (.docx) and Markdown with 100% privacy.
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-300">
            Select PDF File
          </span>
        </div>
      ) : (
        /* Split Extracted View & Page Inspector */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Page Navigator */}
            <div className="lg:col-span-4 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Pages ({pages.length})
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">Select page</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {pages.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPageIdx(idx)}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-start justify-between gap-2 ${
                      selectedPageIdx === idx
                        ? 'bg-blue-600/20 border-blue-500/50 text-blue-200'
                        : 'bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-zinc-200">Page {p.pageNumber}</div>
                      <p className="text-[11px] opacity-70 line-clamp-2 mt-0.5 font-mono">
                        {p.text.slice(0, 80) || 'Empty or image page'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                      {p.text.split(/\s+/).filter(Boolean).length} w
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Multi-Mode Live Document Inspector */}
            <div className="lg:col-span-8 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
              {/* Header Mode Switcher */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setActiveViewMode('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeViewMode === 'preview'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Word Preview
                  </button>

                  <button
                    onClick={() => setActiveViewMode('editor')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeViewMode === 'editor'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    Edit Text
                  </button>

                  <button
                    onClick={() => setActiveViewMode('visual')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      activeViewMode === 'visual'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Original PDF
                  </button>
                </div>

                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition"
                  title="Copy Full Markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">Copy All</span>
                </button>
              </div>

              {/* View Mode 1: Rendered HTML/Word Document */}
              {activeViewMode === 'preview' && (
                <div className="flex-1 bg-white text-zinc-900 rounded-xl p-8 overflow-y-auto shadow-inner border border-zinc-300 prose prose-indigo max-w-none text-xs sm:text-sm">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DocEngine.markdownToHtml(pages[selectedPageIdx]?.markdown || extractedMarkdown),
                    }}
                  />
                </div>
              )}

              {/* View Mode 2: Editable Markdown Editor */}
              {activeViewMode === 'editor' && (
                <textarea
                  value={pages[selectedPageIdx]?.markdown || ''}
                  onChange={(e) => handlePageMarkdownChange(e.target.value)}
                  placeholder="Edit extracted text or markdown..."
                  className="flex-1 w-full bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none overflow-y-auto leading-relaxed shadow-inner"
                />
              )}

              {/* View Mode 3: Original Visual PDF Canvas Snapshot */}
              {activeViewMode === 'visual' && (
                <div className="flex-1 bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 flex items-center justify-center overflow-auto">
                  {pageCanvasUrl ? (
                    <img
                      src={pageCanvasUrl}
                      alt={`PDF Page ${selectedPageIdx + 1}`}
                      className="max-h-full max-w-full rounded shadow-2xl border border-zinc-700 object-contain"
                    />
                  ) : (
                    <div className="text-xs text-zinc-500 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" /> Rendering page visual...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Master Export Dock */}
          <div className="bg-surface/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-zinc-400">
                100% Client-Side Private • Extracted directly inside browser memory
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadDocx}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-2 transition shadow-glow-sm"
              >
                <FileText className="w-4 h-4" />
                Download Word (.docx)
              </button>

              <button
                onClick={handleDownloadMarkdown}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
              >
                <FileCode className="w-4 h-4 text-indigo-400" />
                Markdown (.md)
              </button>

              <button
                onClick={handleDownloadPlainText}
                className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
              >
                <FileText className="w-4 h-4 text-zinc-400" />
                Plain Text (.txt)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
