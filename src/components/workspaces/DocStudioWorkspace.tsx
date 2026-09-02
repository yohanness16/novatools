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
} from 'lucide-react';
import { DocEngine } from '../../engines/docEngine';
import { PptxEngine, type AdvancedSlideTheme } from '../../engines/pptxEngine';
import { ExcelEngine } from '../../engines/excelEngine';
import { AiDocEngine } from '../../engines/aiDocEngine';
import type { DocSlide, DocTable, SlideTheme } from '../../engines/docTypes';

const SAMPLE_MARKDOWN = `# NovaTools Master Executive Brief

NovaTools provides **100% client-side** privacy-first media, document, and AI utilities directly in the browser runtime.

## Core Capabilities & Architecture

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

## Key Quantitative Metrics

- 99.99% Reliability & Privacy
- 0 KB Server Data Ingestion
- 10x Faster than Cloud Converters

> "True digital sovereignty means sensitive computations happen entirely on local hardware."

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
  const [docTitle, setDocTitle] = useState<string>('NovaTools Master Executive Brief');
  const [activeTab, setActiveTab] = useState<'document' | 'slides' | 'spreadsheet'>('document');
  const [slides, setSlides] = useState<DocSlide[]>([]);
  const [tables, setTables] = useState<DocTable[]>([]);
  const [currentSlideIdx, setCurrentSlideIdx] = useState<number>(0);
  const [currentTableIdx, setCurrentTableIdx] = useState<number>(0);
  const [slideTheme, setSlideTheme] = useState<AdvancedSlideTheme>('onyx-dark');
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

  const handleContentChange = (newText: string) => {
    setContent(newText);
    updateDecksAndTables(newText);
  };

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
        setStatusMessage('DOCX converted losslessly to Markdown!');
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
        const buffer = await file.arrayBuffer();
        const { markdown } = ExcelEngine.xlsxToMarkdown(buffer);
        handleContentChange(markdown);
        setStatusMessage('Spreadsheet converted to Markdown!');
      } else {
        const text = await file.text();
        handleContentChange(text);
        setStatusMessage('Document loaded successfully!');
      }
    } catch (err: any) {
      setStatusMessage(`Ingestion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
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

  // Direct One-Click Downloads
  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    setStatusMessage('Compiling direct vector PDF binary...');
    try {
      const blob = await DocEngine.markdownToPdfBlob(content, docTitle);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      setStatusMessage('PDF downloaded successfully!');
    } catch (err: any) {
      DocEngine.triggerBrowserPdfPrint(content, docTitle);
      setStatusMessage('Print preview ready!');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadDocx = async () => {
    setIsProcessing(true);
    setStatusMessage('Compiling Microsoft Word document...');
    try {
      const blob = await DocEngine.markdownToDocx(content, docTitle);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.docx`);
      setStatusMessage('Word document (.docx) downloaded successfully!');
    } catch (err: any) {
      setStatusMessage(`DOCX Export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadPptx = async () => {
    setIsProcessing(true);
    setStatusMessage(`Generating PowerPoint Onyx Deck (${slides.length} slides)...`);
    try {
      const blob = await PptxEngine.generatePptxBlob(slides, slideTheme);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}-slides.pptx`);
      setStatusMessage('PowerPoint presentation (.pptx) downloaded successfully!');
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
      setStatusMessage('Excel workbook (.xlsx) downloaded successfully!');
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

  // AI Actions
  const handleAiSmartSlides = async () => {
    setIsProcessing(true);
    setStatusMessage('AI analyzing document & structuring Onyx slide deck...');
    try {
      const aiSlides = await AiDocEngine.generateSmartSlideDeck(content, { theme: slideTheme }, (msg) => {
        setStatusMessage(msg);
      });
      setSlides(aiSlides);
      setActiveTab('slides');
      setCurrentSlideIdx(0);
      setStatusMessage('AI Onyx Slide Deck Generated!');
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
      <div className="bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 sm:p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {docTitle || 'Document Studio'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#9ca3af] flex items-center gap-3 mt-1 font-mono">
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
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#202227] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>

          {/* AI Action Menu */}
          <button
            onClick={handleAiSmartSlides}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            AI to Slides
          </button>

          <button
            onClick={handleAiExtractTables}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
            AI to Excel
          </button>

          <button
            onClick={handleAiSummarize}
            disabled={isProcessing}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#202227] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Summarize
          </button>
        </div>
      </div>

      {/* AI Status Notification */}
      {statusMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 flex items-center gap-2 font-mono">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          {statusMessage}
        </div>
      )}

      {/* Split Dual-Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Markdown Editor */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 sm:p-5 flex flex-col h-[650px] shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white font-mono">Document Editor</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-[#16171a] hover:bg-slate-200 dark:hover:bg-[#202227] text-slate-500 dark:text-[#9ca3af] text-xs flex items-center gap-1 transition cursor-pointer"
                title="Copy Markdown"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Type or paste Markdown / upload a DOCX..."
            className="flex-1 w-full bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] rounded-lg p-4 text-xs sm:text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none overflow-y-auto leading-relaxed"
          />
        </div>

        {/* Right Pane: Multi-Tab Live Preview */}
        <div className="lg:col-span-6 bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 sm:p-5 flex flex-col h-[650px] shadow-sm">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#16171a] rounded-lg border border-slate-200 dark:border-white/[0.08]">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'document'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Document
              </button>

              <button
                onClick={() => setActiveTab('slides')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'slides'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                Slides ({slides.length})
              </button>

              <button
                onClick={() => setActiveTab('spreadsheet')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'spreadsheet'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-[#9ca3af] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Sheets ({tables.length})
              </button>
            </div>

            {/* Slide Theme Picker */}
            {activeTab === 'slides' && (
              <div className="flex items-center gap-2">
                <select
                  value={slideTheme}
                  onChange={(e) => setSlideTheme(e.target.value as AdvancedSlideTheme)}
                  className="bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-800 dark:text-white rounded-lg px-2.5 py-1 outline-none cursor-pointer"
                >
                  <option value="onyx-dark">Onyx Dark (Flagship)</option>
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
            <div className="flex-1 bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.06] rounded-lg p-6 overflow-y-auto prose prose-slate dark:prose-invert max-w-none text-xs sm:text-sm">
              <div dangerouslySetInnerHTML={{ __html: DocEngine.markdownToHtml(content) }} />
            </div>
          )}

          {/* Tab 2: Visual Slide Carousel View */}
          {activeTab === 'slides' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {slides.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-[#9ca3af] text-xs">
                  <Presentation className="w-10 h-10 mb-2 opacity-30" />
                  No slides detected. Add headings (e.g. # Title, ## Topic) or click "AI to Slides".
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  {/* Slide Canvas */}
                  <div
                    className={`aspect-video w-full rounded-xl border p-6 flex flex-col justify-between shadow-lg transition-all duration-300 ${
                      slideTheme === 'corporate-blue'
                        ? 'bg-white border-slate-200 text-slate-900'
                        : slideTheme === 'minimal-emerald'
                        ? 'bg-[#022c22] border-emerald-800 text-emerald-50'
                        : slideTheme === 'sunset-modern'
                        ? 'bg-[#18181b] border-orange-950 text-slate-100'
                        : 'bg-[#0a0b0e] border-[#282e3e] text-white'
                    }`}
                  >
                    {/* Slide Header */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {currentSlide?.layout || 'content'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
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

                    {/* Slide Body */}
                    <div className="my-auto py-2">
                      {currentSlide?.layout === 'stats' && (
                        <div className="grid grid-cols-2 gap-3 py-2">
                          {(currentSlide.bullets && currentSlide.bullets.length > 0
                            ? currentSlide.bullets.slice(0, 2)
                            : ['99.9% Reliability', '10x Performance']
                          ).map((item, idx) => (
                            <div key={idx} className="text-center p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="text-2xl sm:text-3xl font-black text-blue-400">
                                {item.split(' - ')[0] || item.split(' ')[0]}
                              </div>
                              <div className="text-xs text-slate-300 mt-1">
                                {item.split(' - ')[1] || item.replace(/^[0-9.%+x]+/, '').trim() || 'Key Metric'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentSlide?.layout === 'quote' && (
                        <blockquote className="text-center italic text-sm sm:text-base opacity-90 border-l-2 border-blue-500 pl-4 py-2">
                          “{currentSlide?.quoteText || currentSlide?.title}”
                        </blockquote>
                      )}

                      {currentSlide?.layout === 'code' && (
                        <div className="bg-black/60 rounded-lg p-3 font-mono text-xs text-blue-300 border border-white/10 overflow-x-auto max-h-40">
                          <pre>{currentSlide?.codeSnippet?.code || '// Code preview'}</pre>
                        </div>
                      )}

                      {currentSlide?.layout !== 'stats' &&
                        currentSlide?.layout !== 'quote' &&
                        currentSlide?.layout !== 'code' && (
                          <ul className="space-y-2 text-xs sm:text-sm">
                            {currentSlide?.bullets?.map((b, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold">•</span>
                                <span className="opacity-90">{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>

                    {/* Slide Footer */}
                    <div className="flex items-center justify-between text-[10px] opacity-60 border-t border-white/10 pt-2 font-mono">
                      <span>NovaTools Onyx</span>
                      <span>16:9 Widescreen</span>
                    </div>
                  </div>

                  {/* Carousel Controls */}
                  <div className="flex items-center justify-between pt-3">
                    <button
                      onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentSlideIdx === 0}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-white disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIdx(idx)}
                          className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                            currentSlideIdx === idx ? 'bg-blue-600 w-4' : 'bg-slate-300 dark:bg-white/20'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                      disabled={currentSlideIdx === slides.length - 1}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-white disabled:opacity-30 flex items-center gap-1 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Extracted Tables View */}
          {activeTab === 'spreadsheet' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {tables.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-[#9ca3af] text-xs">
                  <TableIcon className="w-10 h-10 mb-2 opacity-30" />
                  No markdown tables detected. Add GFM pipe tables or click "AI to Excel".
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex-1 bg-slate-50 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] rounded-lg overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-[#121316] border-b border-slate-200 dark:border-white/[0.08] sticky top-0">
                          {currentTable?.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-2.5 text-slate-900 dark:text-white font-bold border-r border-slate-200 dark:border-white/[0.06]">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {currentTable?.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-200/60 dark:border-white/[0.04] hover:bg-slate-100 dark:hover:bg-[#1e2025]">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2.5 text-slate-700 dark:text-[#d1d5db] border-r border-slate-200/60 dark:border-white/[0.04]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-[#9ca3af] mt-2 flex items-center justify-between font-mono">
                    <span>
                      {currentTable?.rows.length} row(s) • {currentTable?.headers.length} column(s)
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Ready for Excel (.xlsx) Export</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Floating Master Export Dock */}
      <div className="bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs text-slate-600 dark:text-[#9ca3af] font-mono">
            {aiTier || '100% Client-Side Privacy Engine Active'}
          </span>
        </div>

        {/* Master One-Click Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white flex items-center gap-2 transition shadow-sm cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download PDF (.pdf)
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-lg bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#202227] text-xs font-bold text-slate-800 dark:text-[#d1d5db] flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Word (.docx)
          </button>

          <button
            onClick={handleDownloadPptx}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <Presentation className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            PowerPoint (.pptx)
          </button>

          <button
            onClick={handleDownloadXlsx}
            disabled={isProcessing}
            className="px-3.5 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2 transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Excel (.xlsx)
          </button>

          <button
            onClick={handlePrintPdf}
            disabled={isProcessing}
            title="Open browser vector print dialog"
            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#16171a] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-[#202227] text-xs font-semibold text-slate-700 dark:text-[#9ca3af] flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
