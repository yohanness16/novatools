import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Printer,
  Upload,
  Sparkles,
  Download,
  Eye,
  Check,
  RefreshCw,
  Sliders,
  Maximize2,
  FileCode,
  BookOpen,
  LayoutTemplate,
  Copy,
} from 'lucide-react';
import { DocEngine, type DocTheme } from '../../engines/docEngine';
import { downloadBlob } from '../../lib/utils';

const SAMPLE_MARKDOWN = `# Quantum Wave Dynamics & System Architecture

NovaTools compiles **high-precision vector documents** with zero server communication.

## 1. Mathematical Formulation

The time-dependent Schrödinger equation in three-dimensional coordinate space:

$$i\\hbar\\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\left[ -\\frac{\\hbar^2}{2m}\\nabla^2 + V(\\mathbf{r},t) \\right]\\Psi(\\mathbf{r},t)$$

Energy-frequency relation for relativistic mass: $E = mc^2$ and photon momentum $p = \\frac{h}{\\lambda}$.

## 2. Benchmark Metrics & Performance

| Engine Component | Latency | Accuracy | Memory Overhead |
| :--- | :--- | :--- | :--- |
| **Vector PDF Synthesizer** | < 80ms | 100% Crisp Vector | 4.2 MB RAM |
| **KaTeX Math Engine** | < 15ms | Sub-pixel Precision | 1.1 MB RAM |
| **DOCX OpenXML Pipeline** | < 180ms | Microsoft Certified | 6.8 MB RAM |

## 3. Core Implementation Logic

\`\`\`typescript
export function computeVectorFidelity(equations: string[]): number {
  return equations.reduce((acc, eq) => acc + eq.length, 0);
}
\`\`\`

> "Sovereign computation guarantees that sensitive equations, research findings, and legal contracts remain strictly on user hardware."
`;

export default function DocToPdfWorkspace() {
  const [markdown, setMarkdown] = useState<string>(SAMPLE_MARKDOWN);
  const [docTitle, setDocTitle] = useState<string>('Quantum Wave Dynamics');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [theme, setTheme] = useState<DocTheme>('github');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(`Ingesting ${file.name}...`);

    try {
      if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const { markdown: parsedMd } = await DocEngine.docxToMarkdown(buffer);
        setMarkdown(parsedMd);
        setDocTitle(file.name.replace(/\.docx$/i, ''));
        setStatusMessage('DOCX loaded losslessly!');
      } else {
        const text = await file.text();
        setMarkdown(text);
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
        setStatusMessage('Document loaded successfully!');
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'Failed to ingest file'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    setStatusMessage('Generating direct PDF binary in browser RAM...');
    try {
      const pdfBlob = await DocEngine.markdownToPdfBlob(markdown, docTitle || 'Document', theme, pageSize);
      downloadBlob(pdfBlob, `${(docTitle || 'document').toLowerCase().replace(/\s+/g, '-')}.pdf`);
      setStatusMessage('PDF downloaded successfully!');
    } catch (err: any) {
      setStatusMessage(`PDF generation fallback: Opening print preview...`);
      DocEngine.triggerBrowserPdfPrint(markdown, docTitle || 'Document', theme, pageSize);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handlePrintPdf = () => {
    setIsProcessing(true);
    setStatusMessage('Preparing vector print preview...');
    try {
      DocEngine.triggerBrowserPdfPrint(markdown, docTitle || 'Document', theme, pageSize);
      setStatusMessage('Print dialogue ready!');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'Print preview failed'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadDocx = async () => {
    setIsProcessing(true);
    setStatusMessage('Compiling Microsoft Word binary...');
    try {
      const blob = await DocEngine.markdownToDocx(markdown, docTitle || 'Document');
      downloadBlob(blob, `${(docTitle || 'document').toLowerCase().replace(/\s+/g, '-')}.docx`);
      setStatusMessage('DOCX exported successfully!');
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message || 'DOCX export failed'}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    downloadBlob(blob, `${(docTitle || 'document').toLowerCase().replace(/\s+/g, '-')}.md`);
    setStatusMessage('Markdown file downloaded!');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metadata = DocEngine.getDocMetadata(markdown, docTitle);
  const previewHtml = DocEngine.markdownToHtml(markdown);

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.08] pb-4">
        {/* Document Title input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Document Title"
            className="w-full bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.docx"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] hover:bg-slate-100 dark:hover:bg-[#202227] transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Load File</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] hover:bg-slate-100 dark:hover:bg-[#202227] transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] hover:bg-slate-100 dark:hover:bg-[#202227] transition-colors cursor-pointer disabled:opacity-40"
          >
            <FileCode className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Download DOCX</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF (.pdf)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isProcessing}
            title="Open browser vector print dialogue"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#16171a] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] hover:bg-slate-100 dark:hover:bg-[#202227] transition-colors cursor-pointer disabled:opacity-40"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / Vector</span>
          </button>
        </div>
      </div>

      {/* Theme & Styling Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.06] text-xs">
        {/* Visual Themes */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500 dark:text-[#9ca3af] font-medium">Style Theme:</span>
          <div className="flex items-center gap-1">
            {(
              [
                { id: 'github', label: 'GitHub README' },
                { id: 'notion', label: 'Notion Minimal' },
                { id: 'academic', label: 'Academic IEEE' },
                { id: 'executive', label: 'Executive Report' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTheme(t.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  theme === t.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:bg-slate-200 dark:hover:bg-white/[0.06]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page Size Selection */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-500 dark:text-[#9ca3af] font-medium">Page Size:</span>
          <div className="flex items-center gap-1">
            {(['A4', 'Letter'] as const).map((ps) => (
              <button
                key={ps}
                type="button"
                onClick={() => setPageSize(ps)}
                className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer ${
                  pageSize === ps
                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:bg-slate-200 dark:hover:bg-white/[0.06]'
                }`}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workspace Split Editor / Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[520px]">
        {/* LEFT: Markdown Code Editor */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#16171a] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#121316] text-xs font-mono">
            <span className="font-bold text-slate-700 dark:text-[#d1d5db]">MARKDOWN_EDITOR</span>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 text-slate-500 dark:text-[#9ca3af] hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type or paste Markdown, KaTeX formulas ($$E=mc^2$$), and tables here..."
            className="flex-1 p-4 font-mono text-xs sm:text-sm bg-transparent text-slate-900 dark:text-[#f9fafb] focus:outline-none resize-none leading-relaxed"
          />
          <div className="px-4 py-2 border-t border-slate-100 dark:border-white/[0.04] bg-slate-50/50 dark:bg-[#121316] text-[11px] font-mono text-slate-500 dark:text-[#9ca3af] flex justify-between">
            <span>{metadata.wordCount} words · {metadata.charCount} chars</span>
            <span>Est. ~{metadata.readingTimeMinutes} min reading</span>
          </div>
        </div>

        {/* RIGHT: Live KaTeX & Document Preview */}
        <div className="flex flex-col rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#16171a] overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#121316] text-xs font-mono">
            <span className="font-bold text-slate-700 dark:text-[#d1d5db]">
              LIVE_RENDER // {theme.toUpperCase()}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">KaTeX Math Active</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[580px] bg-white text-slate-900 dark:bg-[#1e2025] dark:text-[#d1d5db] prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm">
            <div
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className={`doc-theme-${theme}`}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 p-3 text-xs text-blue-700 dark:text-blue-300 font-mono">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
