import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  Upload,
  Download,
  FileCode,
  Copy,
  Check,
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
    } catch {
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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--nt-border)] pb-4">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#141413] text-[#FACC15] shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="Document Title"
            className="nt-input w-full px-3 py-2 text-xs sm:text-sm font-bold"
          />
        </div>

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
            className="nt-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Load File</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="nt-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download .MD</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadDocx}
            disabled={isProcessing}
            className="nt-btn-secondary inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold disabled:opacity-40"
          >
            <FileCode className="h-3.5 w-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
            <span>Download DOCX</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            className="nt-btn-yellow inline-flex items-center gap-1.5 px-4 py-2 text-xs disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download PDF (.pdf)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintPdf}
            disabled={isProcessing}
            className="nt-btn-secondary inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold disabled:opacity-40"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div className="nt-well flex flex-wrap items-center justify-between gap-4 p-3.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[#746D61] dark:text-[#938B7D] font-bold">Style Theme:</span>
          <div className="flex flex-wrap items-center gap-1">
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
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  theme === t.id
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:bg-white/70 dark:hover:bg-[#26231E]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[#746D61] dark:text-[#938B7D] font-bold">Page Size:</span>
          <div className="flex items-center gap-1">
            {(['A4', 'Letter'] as const).map((ps) => (
              <button
                key={ps}
                type="button"
                onClick={() => setPageSize(ps)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                  pageSize === ps
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413]'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:bg-white/70 dark:hover:bg-[#26231E]'
                }`}
              >
                {ps}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[520px]">
        <div className="nt-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--nt-border)] bg-[#FCFBF8] dark:bg-[#191714] text-xs font-mono">
            <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">MARKDOWN_EDITOR</span>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 text-[#746D61] hover:text-[#141413] dark:hover:text-[#FACC15] font-semibold cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type or paste Markdown, KaTeX formulas ($$E=mc^2$$), and tables here..."
            className="flex-1 p-4 font-mono text-xs sm:text-sm bg-transparent text-[#141413] dark:text-[#FAF7F0] focus:outline-none resize-none leading-relaxed"
          />
          <div className="px-4 py-2.5 border-t border-[var(--nt-border)] bg-[#FCFBF8] dark:bg-[#191714] text-[11px] font-mono text-[#746D61] dark:text-[#938B7D] flex justify-between">
            <span>{metadata.wordCount} words · {metadata.charCount} chars</span>
            <span>Est. ~{metadata.readingTimeMinutes} min reading</span>
          </div>
        </div>

        <div className="nt-card flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--nt-border)] bg-[#FCFBF8] dark:bg-[#191714] text-xs font-mono">
            <span className="font-bold text-[#141413] dark:text-[#FAF7F0]">
              LIVE_RENDER // {theme.toUpperCase()}
            </span>
            <span className="nt-badge-success px-2 py-0.5 text-[10px] font-bold">KaTeX Active</span>
          </div>

          <div className="flex-1 p-6 overflow-y-auto max-h-[580px] bg-white text-[#141413] dark:bg-[#1F1D19] dark:text-[#FAF7F0] prose prose-stone dark:prose-invert max-w-none text-xs sm:text-sm">
            <div
              dangerouslySetInnerHTML={{ __html: previewHtml }}
              className={`doc-theme-${theme}`}
            />
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="nt-badge-yellow rounded-xl p-3 text-xs font-mono font-bold">
          {statusMessage}
        </div>
      )}
    </div>
  );
}
