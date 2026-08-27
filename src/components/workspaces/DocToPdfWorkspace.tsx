import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  Upload,
  Sparkles,
  Download,
  Eye,
  Settings,
  ShieldCheck,
  Check,
  RefreshCw,
  Sliders,
  Maximize2,
  FileCode,
} from 'lucide-react';
import { DocEngine } from '../../engines/docEngine';

export default function DocToPdfWorkspace() {
  const [markdown, setMarkdown] = useState<string>(`# Executive Proposal: NovaTools

NovaTools is a **100% client-side** privacy-first media, document, and AI utility suite.

## Strategic Objectives

- **Complete Data Sovereignty**: All processing executes in the user's local browser memory.
- **Sub-Second Performance**: Near-instantaneous transformations powered by WebAssembly.
- **Zero Cloud Dependence**: Eliminates server egress costs, API keys, and vendor lock-in.

### Key Milestones & Projections

| Milestone Phase | Target Timeline | Security Rating | Status |
| :--- | :--- | :--- | :--- |
| **Alpha Release** | Q1 2026 | Enterprise Zero-Trust | Completed |
| **Beta Rollout** | Q2 2026 | SOC2 In-Browser Spec | Active |
| **V1 Production** | Q3 2026 | 100% Verified Private | On Track |

> "Privacy is not a setting; it is an architectural foundation."

### Implementation Verification

\`\`\`typescript
export async function verifyClientIntegrity(): Promise<boolean> {
  // Confirm zero outbound network transmission during document conversion
  return window.location.protocol.startsWith('http');
}
\`\`\`
`);
  const [docTitle, setDocTitle] = useState<string>('Executive Proposal');
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
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
      console.error(err);
      setStatusMessage(`Error loading document: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePrintPdf = () => {
    setStatusMessage('Opening print dialog for Vector PDF generation...');
    DocEngine.triggerBrowserPdfPrint(markdown, docTitle);
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const metadata = DocEngine.getDocMetadata(markdown, docTitle);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              Word / Doc to PDF Converter
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                Vector Quality
              </span>
            </h1>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
              <span>{metadata.wordCount} words</span>
              <span>•</span>
              <span>{metadata.readingTimeMinutes} min read</span>
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
            accept=".docx,.md,.txt,.html"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            Upload DOCX / MD
          </button>

          <button
            onClick={handlePrintPdf}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2 transition shadow-glow-sm"
          >
            <Printer className="w-4 h-4" />
            Export Vector PDF
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          {statusMessage}
        </div>
      )}

      {/* Side-by-side Editor and Live PDF Document Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Editor */}
        <div className="lg:col-span-5 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Source Content
            </span>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="Type or paste document content..."
            className="flex-1 w-full bg-zinc-950/70 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none overflow-y-auto leading-relaxed shadow-inner"
          />
        </div>

        {/* Right Live Rendered PDF View */}
        <div className="lg:col-span-7 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              Print / PDF Live Preview
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">Format: A4 Vector</span>
          </div>

          <div className="flex-1 bg-white text-zinc-900 rounded-xl p-8 overflow-y-auto shadow-2xl border border-zinc-300 prose prose-indigo max-w-none text-xs sm:text-sm">
            <div dangerouslySetInnerHTML={{ __html: DocEngine.markdownToHtml(markdown) }} />
          </div>
        </div>
      </div>
    </div>
  );
}
