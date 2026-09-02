import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Presentation,
  Table as TableIcon,
  Download,
  Sparkles,
  Upload,
  Copy,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  Palette,
  Eye,
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Sliders,
  Type,
  Code,
  List,
  Bold,
  Heading,
} from 'lucide-react';
import { DocEngine } from '../../engines/docEngine';
import { PptxEngine } from '../../engines/pptxEngine';
import { ExcelEngine } from '../../engines/excelEngine';
import { AiDocEngine } from '../../engines/aiDocEngine';
import type { DocSlide, DocTable, SlideTheme, ToneType } from '../../engines/docTypes';

const SAMPLE_MARKDOWN = `# NovaTools Master Document

NovaTools provides **100% client-side** privacy-first media, document, and AI utilities directly in the browser runtime.

## Core Capabilities

- **Zero-Data-Loss Document Ingestion**: Transform Markdown, Word (.docx), and CSV without losing structure.
- **AI Slide Deck Generation**: Convert text documents into presentation slides (.pptx) with smart cards.
- **Intelligent Spreadsheet Extraction**: Extract structured datasets from narrative notes into Excel (.xlsx).
- **Vector PDF Export**: Crisp paged media typography with math formulas and syntax highlighting.

## System Performance & Benchmarks

| Feature / Engine | Processing Speed | Privacy Guarantee | Target Formats |
| :--- | :--- | :--- | :--- |
| **PDF Engine** | < 120ms | 100% In-Browser | Vector PDF, Print |
| **DOCX OpenXML** | < 250ms | Zero Server Upload | .docx, Word |
| **PPTX Slide Deck** | < 300ms | Client-Side Engine | .pptx, 16:9 Deck |
| **Excel Spreadsheet**| < 80ms | 100% Local | .xlsx, .csv |

## Key Metric Highlights

- 99.99% Uptime & Privacy
- 0 KB Server Data Ingestion
- 5x Faster than Cloud Converters

> "True digital privacy means computations happen entirely on the user's edge device."

\`\`\`typescript
// Pure client-side transformation
export async function convertDocument(input: File): Promise<Blob> {
  const buffer = await input.arrayBuffer();
  return DocEngine.markdownToDocx(buffer);
}
\`\`\`
`;

export default function DocStudioWorkspace() {
  const [content, setContent] = useState<string>(SAMPLE_MARKDOWN);
  const [docTitle, setDocTitle] = useState<string>('NovaTools Master Document');
  const [activeTab, setActiveTab] = useState<'document' | 'slides' | 'spreadsheet'>('document');
  const [slides, setSlides] = useState<DocSlide[]>([]);
  const [tables, setTables] = useState<DocTable[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [currentTableIdx, setCurrentTableIdx] = useState<number>(0);
  const [slideTheme, setSlideTheme] = useState<SlideTheme>('dark-indigo');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [aiTier, setAiTier] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize and check AI availability
  useEffect(() => {
    AiDocEngine.checkAIAvailability().then((info) => {
      setAiTier(info.statusDescription);
    });
    updateDecksAndTables(content);
  }, []);

  const updateDecksAndTables = (text: string) => {
    const meta = DocEngine.getDocMetadata(text);
    setDocTitle(meta.title);
    const parsedSlides = PptxEngine.markdownToSlides(text);
    setSlides(parsedSlides);
    const parsedTables = ExcelEngine.extractTablesFromMarkdown(text);
    setTables(parsedTables);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    updateDecksAndTables(newContent);
  };

  // Upload handler for DOCX, MD, TXT, CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(`Ingesting ${file.name}...`);

    try {
      if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const { markdown } = await DocEngine.docxToMarkdown(buffer);
        handleContentChange(markdown);
        setStatusMessage('DOCX converted to Markdown losslessly!');
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
        const text = await file.text();
        const lines = text.split('\n').filter(Boolean);
        const mdTable = lines.map((l, idx) => {
          const cells = l.split(',').map((c) => c.replace(/^"|"$/g, '').trim());
          const rowStr = `| ${cells.join(' | ')} |`;
          if (idx === 0) {
            const sep = `| ${cells.map(() => '---').join(' | ')} |`;
            return `${rowStr}\n${sep}`;
          }
          return rowStr;
        }).join('\n');
        const generated = `# ${file.name.replace(/\.[^/.]+$/, '')}\n\n${mdTable}`;
        handleContentChange(generated);
        setStatusMessage('CSV imported as Markdown Table!');
      } else {
        const text = await file.text();
        handleContentChange(text);
        setStatusMessage(`${file.name} loaded successfully!`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error parsing file: ${err.message || err}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 4000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Export handlers
  const handleDownloadDocx = async () => {
    setIsProcessing(true);
    setStatusMessage('Compiling OpenXML DOCX...');
    try {
      const blob = await DocEngine.markdownToDocx(content, docTitle);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.docx`);
      setStatusMessage('DOCX downloaded successfully!');
    } catch (err: any) {
      setStatusMessage(`DOCX Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadPptx = async () => {
    setIsProcessing(true);
    setStatusMessage('Generating PowerPoint presentation...');
    try {
      const blob = await PptxEngine.generatePptxBlob(slides, slideTheme);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.pptx`);
      setStatusMessage('Presentation downloaded successfully!');
    } catch (err: any) {
      setStatusMessage(`PPTX Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadXlsx = () => {
    setIsProcessing(true);
    setStatusMessage('Compiling Excel spreadsheet...');
    try {
      const blob = ExcelEngine.generateXlsxBlob(tables, docTitle);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.xlsx`);
      setStatusMessage('Excel workbook downloaded successfully!');
    } catch (err: any) {
      setStatusMessage(`Excel Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handlePrintPdf = () => {
    setStatusMessage('Opening print preview for Vector PDF...');
    DocEngine.triggerBrowserPdfPrint(content, docTitle);
    setTimeout(() => setStatusMessage(''), 3000);
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

  // AI Actions
  const handleAiSmartSlides = async () => {
    setIsProcessing(true);
    setStatusMessage('AI analyzing document & creating slide deck...');
    try {
      const aiSlides = await AiDocEngine.generateSmartSlideDeck(content, { theme: slideTheme }, (msg) => {
        setStatusMessage(msg);
      });
      setSlides(aiSlides);
      setActiveTab('slides');
      setCurrentSlideIdx(0);
      setStatusMessage('AI Slide Deck Generated!');
    } catch (err: any) {
      setStatusMessage(`AI Slide Generation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleAiExtractTables = async () => {
    setIsProcessing(true);
    setStatusMessage('AI extracting tabular structures...');
    try {
      const aiTables = await AiDocEngine.extractSmartTables(content, (msg) => {
        setStatusMessage(msg);
      });
      setTables(aiTables);
      setActiveTab('spreadsheet');
      setCurrentTableIdx(0);
      setStatusMessage(`Extracted ${aiTables.length} table(s)!`);
    } catch (err: any) {
      setStatusMessage(`Table extraction failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleAiSummarize = async () => {
    setIsProcessing(true);
    setStatusMessage('AI synthesizing executive brief...');
    try {
      const summary = await AiDocEngine.summarizeDocument(content);
      setContent((prev) => `${summary}\n\n---\n\n${prev}`);
      setStatusMessage('Executive summary prepended to document!');
    } catch (err: any) {
      setStatusMessage(`Summarization failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const metadata = DocEngine.getDocMetadata(content);
  const currentSlide = slides[currentSlideIdx] || slides[0];
  const currentTable = tables[currentTableIdx] || tables[0];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="bg-surface/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              {docTitle || 'Document Studio'}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                100% Client-Side Private
              </span>
            </h1>
            <p className="text-xs text-zinc-400 flex items-center gap-3 mt-1">
              <span>{metadata.wordCount} words</span>
              <span>•</span>
              <span>{metadata.readingTimeMinutes} min read</span>
              <span>•</span>
              <span>{slides.length} slides</span>
              <span>•</span>
              <span>{tables.length} tables</span>
            </p>
          </div>
        </div>

        {/* Action Controls & AI Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md,.docx,.txt,.csv,.tsv,.html"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            Upload File
          </button>

          {/* AI Action Menu */}
          <button
            onClick={handleAiSmartSlides}
            disabled={isProcessing}
            className="px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-all shadow-glow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            AI to Slides
          </button>

          <button
            onClick={handleAiExtractTables}
            disabled={isProcessing}
            className="px-3 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 flex items-center gap-1.5 transition-all"
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
            AI to Excel
          </button>

          <button
            onClick={handleAiSummarize}
            disabled={isProcessing}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700/80 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-all"
          >
            <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
            Summarize
          </button>
        </div>
      </div>

      {/* AI Status Notification */}
      {statusMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          {statusMessage}
        </div>
      )}

      {/* Split Dual-Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Markdown Editor */}
        <div className="lg:col-span-6 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-[700px] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Document Editor</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition"
                title="Copy Markdown"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Type or paste Markdown / upload a DOCX..."
            className="flex-1 w-full bg-zinc-950/70 border border-zinc-900 rounded-xl p-4 text-xs sm:text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none overflow-y-auto leading-relaxed shadow-inner"
          />
        </div>

        {/* Right Pane: Multi-Tab Live Preview */}
        <div className="lg:col-span-6 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 sm:p-5 flex flex-col h-[700px] shadow-xl">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'document'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Document
              </button>

              <button
                onClick={() => setActiveTab('slides')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'slides'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                Slides ({slides.length})
              </button>

              <button
                onClick={() => setActiveTab('spreadsheet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  activeTab === 'spreadsheet'
                    ? 'bg-indigo-600 text-white shadow-glow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Sheets ({tables.length})
              </button>
            </div>

            {/* Quick action for active tab */}
            {activeTab === 'slides' && (
              <div className="flex items-center gap-2">
                <select
                  value={slideTheme}
                  onChange={(e) => setSlideTheme(e.target.value as SlideTheme)}
                  className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded-lg px-2 py-1 outline-none"
                >
                  <option value="dark-indigo">Dark Indigo</option>
                  <option value="corporate-blue">Corporate Blue</option>
                  <option value="minimal-emerald">Emerald Clean</option>
                  <option value="sunset-modern">Sunset Modern</option>
                </select>
              </div>
            )}
          </div>

          {/* Tab 1: Rendered Document View */}
          {activeTab === 'document' && (
            <div className="flex-1 bg-zinc-950/70 border border-zinc-900 rounded-xl p-6 overflow-y-auto prose prose-invert prose-indigo max-w-none text-xs sm:text-sm">
              <div dangerouslySetInnerHTML={{ __html: DocEngine.markdownToHtml(content) }} />
            </div>
          )}

          {/* Tab 2: Visual Slide Carousel View */}
          {activeTab === 'slides' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {slides.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs">
                  <Presentation className="w-10 h-10 mb-2 opacity-30" />
                  No slides detected. Add headings (e.g. # Title, ## Topic) or click "AI to Slides".
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Slide Canvas */}
                  <div
                    className={`aspect-video w-full rounded-xl border p-6 flex flex-col justify-between shadow-2xl transition-all duration-300 ${
                      slideTheme === 'corporate-blue'
                        ? 'bg-white border-zinc-300 text-zinc-900'
                        : slideTheme === 'minimal-emerald'
                        ? 'bg-emerald-950 border-emerald-800 text-emerald-50'
                        : slideTheme === 'sunset-modern'
                        ? 'bg-zinc-900 border-orange-950 text-zinc-100'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-100'
                    }`}
                  >
                    {/* Slide Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          {currentSlide?.layout || 'content'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          Slide {currentSlideIdx + 1} / {slides.length}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold tracking-tight mb-1">
                        {currentSlide?.title}
                      </h2>
                      {currentSlide?.subtitle && (
                        <p className="text-xs opacity-75">{currentSlide.subtitle}</p>
                      )}
                    </div>

                    {/* Slide Body by Layout */}
                    <div className="my-auto py-2">
                      {currentSlide?.layout === 'stats' && (
                        <div className="text-center py-4 bg-zinc-900/50 rounded-xl border border-zinc-800/80">
                          <div className="text-4xl sm:text-5xl font-black text-indigo-400 mb-1">
                            {currentSlide.statNumber || '100%'}
                          </div>
                          <div className="text-xs opacity-80">{currentSlide.statLabel || currentSlide.subtitle}</div>
                        </div>
                      )}

                      {currentSlide?.layout === 'quote' && (
                        <blockquote className="italic text-center text-sm sm:text-base border-l-0 p-4 bg-zinc-900/40 rounded-xl">
                          “{currentSlide.quoteText || currentSlide.title}”
                        </blockquote>
                      )}

                      {currentSlide?.layout === 'code' && (
                        <div className="bg-black/80 rounded-lg p-3 font-mono text-[11px] text-emerald-400 border border-zinc-800 overflow-x-auto">
                          {currentSlide.codeSnippet?.code}
                        </div>
                      )}

                      {(!currentSlide?.layout || currentSlide.layout === 'content' || currentSlide.layout === 'title') && (
                        <ul className="space-y-1.5 text-xs sm:text-sm">
                          {(currentSlide?.bullets || ['Overview topic item']).slice(0, 5).map((bullet, bIdx) => (
                            <li key={bIdx} className="flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Slide Footer */}
                    <div className="text-[10px] opacity-40 flex justify-between border-t border-zinc-800/40 pt-2">
                      <span>NovaTools AI Presentation Engine</span>
                      <span>16:9 Widescreen</span>
                    </div>
                  </div>

                  {/* Speaker Notes */}
                  {currentSlide?.speakerNotes && (
                    <div className="mt-3 p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400">
                      <span className="font-semibold text-indigo-400">Speaker Notes:</span> {currentSlide.speakerNotes}
                    </div>
                  )}

                  {/* Carousel Controls */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/60">
                    <button
                      onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentSlideIdx === 0}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 disabled:opacity-30 flex items-center gap-1 hover:bg-zinc-700"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev Slide
                    </button>
                    <span className="text-xs text-zinc-400">
                      {currentSlideIdx + 1} of {slides.length}
                    </span>
                    <button
                      onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                      disabled={currentSlideIdx === slides.length - 1}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-semibold text-zinc-300 disabled:opacity-30 flex items-center gap-1 hover:bg-zinc-700"
                    >
                      Next Slide <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Interactive Spreadsheet Grid View */}
          {activeTab === 'spreadsheet' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {tables.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs">
                  <FileSpreadsheet className="w-10 h-10 mb-2 opacity-30" />
                  No tabular data found. Add a Markdown table or click "AI to Excel".
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {/* Table Switcher if multiple */}
                  {tables.length > 1 && (
                    <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-1">
                      {tables.map((t, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentTableIdx(idx)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                            currentTableIdx === idx
                              ? 'bg-emerald-600 text-white'
                              : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {t.title || `Table ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Grid Table */}
                  <div className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-zinc-900/90 border-b border-zinc-700 sticky top-0">
                          {currentTable?.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5 text-zinc-200 font-semibold border-r border-zinc-800">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentTable?.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-zinc-800/60 hover:bg-zinc-900/40">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-zinc-300 border-r border-zinc-800/40">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-zinc-500 mt-2 flex items-center justify-between">
                    <span>
                      {currentTable?.rows.length} row(s) • {currentTable?.headers.length} column(s)
                    </span>
                    <span className="text-emerald-400">Ready for Excel (.xlsx) Export</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Master Export Dock */}
      <div className="bg-surface/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs text-zinc-400">
            {aiTier || '100% Client-Side Privacy Engine Active'}
          </span>
        </div>

        {/* Master One-Click Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePrintPdf}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-bold text-zinc-100 flex items-center gap-2 transition hover:bg-zinc-800 shadow-sm"
          >
            <Printer className="w-4 h-4 text-indigo-400" />
            PDF Export
          </button>

          <button
            onClick={handleDownloadDocx}
            className="px-4 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-xs font-bold text-blue-300 flex items-center gap-2 transition shadow-sm"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            Word (.docx)
          </button>

          <button
            onClick={handleDownloadPptx}
            className="px-4 py-2.5 rounded-xl bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600/30 text-xs font-bold text-orange-300 flex items-center gap-2 transition shadow-sm"
          >
            <Presentation className="w-4 h-4 text-orange-400" />
            PowerPoint (.pptx)
          </button>

          <button
            onClick={handleDownloadXlsx}
            className="px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-xs font-bold text-emerald-300 flex items-center gap-2 transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Excel (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
}
