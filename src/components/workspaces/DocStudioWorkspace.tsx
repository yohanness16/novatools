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
  Edit3,
  RefreshCw,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { DocEngine } from '../../engines/docEngine';
import { PptxEngine, type AdvancedSlideTheme } from '../../engines/pptxEngine';
import { ExcelEngine } from '../../engines/excelEngine';
import { AiDocEngine } from '../../engines/aiDocEngine';
import type { DocSlide, DocTable } from '../../engines/docTypes';

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
  const [currentTableIdx] = useState<number>(0);
  const [slideTheme, setSlideTheme] = useState<AdvancedSlideTheme>('onyx-dark');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [aiTier, setAiTier] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleDownloadPdf = async () => {
    setIsProcessing(true);
    setStatusMessage('Compiling direct vector PDF binary...');
    try {
      const blob = await DocEngine.markdownToPdfBlob(content, docTitle);
      downloadBlob(blob, `${docTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      setStatusMessage('PDF downloaded successfully!');
    } catch {
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
    setStatusMessage(`Generating PowerPoint Deck (${slides.length} slides)...`);
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

  const handleAiSmartSlides = async () => {
    setIsProcessing(true);
    setStatusMessage('AI analyzing document & structuring slide deck...');
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
    <div className="w-full space-y-5">
      {/* Toolbar Card */}
      <div className="nt-well p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#141413] text-[#FACC15] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#141413] dark:text-[#FAF7F0]">
              {docTitle || 'Document Studio'}
            </h2>
            <p className="text-[11px] text-[#746D61] dark:text-[#938B7D] flex items-center gap-2.5 mt-0.5 font-mono">
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
            className="nt-btn-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>

          <button
            onClick={handleAiSmartSlides}
            disabled={isProcessing}
            className="nt-btn-yellow px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI to Slides
          </button>

          <button
            onClick={handleAiExtractTables}
            disabled={isProcessing}
            className="nt-btn-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <TableIcon className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
            AI to Excel
          </button>

          <button
            onClick={handleAiSummarize}
            disabled={isProcessing}
            className="nt-btn-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Summarize
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="nt-badge-yellow rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 font-mono font-bold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Dual Pane Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-6 nt-card p-4 flex flex-col h-[620px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--nt-border)]">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#141413] dark:text-[#FAF7F0] font-mono">
                Document Editor
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="nt-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1 font-semibold"
              title="Copy Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Type or paste Markdown / upload a DOCX..."
            className="nt-input flex-1 w-full p-4 text-xs sm:text-sm font-mono resize-none overflow-y-auto leading-relaxed"
          />
        </div>

        <div className="lg:col-span-6 nt-card p-4 flex flex-col h-[620px]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--nt-border)]">
            <div className="nt-well flex items-center gap-1 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('document')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'document'
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Document
              </button>

              <button
                onClick={() => setActiveTab('slides')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'slides'
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                Slides ({slides.length})
              </button>

              <button
                onClick={() => setActiveTab('spreadsheet')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'spreadsheet'
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Sheets ({tables.length})
              </button>
            </div>

            {activeTab === 'slides' && (
              <select
                value={slideTheme}
                onChange={(e) => setSlideTheme(e.target.value as AdvancedSlideTheme)}
                className="nt-input text-xs font-bold px-2.5 py-1.5 cursor-pointer"
              >
                <option value="onyx-dark">Onyx Dark (Flagship)</option>
                <option value="dark-indigo">Dark Indigo</option>
                <option value="corporate-blue">Corporate Blue</option>
                <option value="minimal-emerald">Emerald Clean</option>
                <option value="sunset-modern">Sunset Modern</option>
              </select>
            )}
          </div>

          {activeTab === 'document' && (
            <div className="nt-well flex-1 p-6 overflow-y-auto prose prose-stone dark:prose-invert max-w-none text-xs sm:text-sm">
              <div dangerouslySetInnerHTML={{ __html: DocEngine.markdownToHtml(content) }} />
            </div>
          )}

          {activeTab === 'slides' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {slides.length === 0 ? (
                <div className="nt-well flex-1 flex flex-col items-center justify-center text-[#746D61] dark:text-[#938B7D] text-xs p-6 text-center">
                  <Presentation className="w-10 h-10 mb-2 opacity-35" />
                  No slides detected. Add headings (# Title, ## Topic) or click "AI to Slides".
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div
                    className={`aspect-video w-full rounded-2xl border p-6 flex flex-col justify-between shadow-card transition-all duration-200 ${
                      slideTheme === 'corporate-blue'
                        ? 'bg-white border-[var(--nt-border)] text-[#141413]'
                        : slideTheme === 'minimal-emerald'
                        ? 'bg-[#022c22] border-emerald-800 text-emerald-50'
                        : slideTheme === 'sunset-modern'
                        ? 'bg-[#1C1814] border-amber-900/60 text-[#FAF7F0]'
                        : 'bg-[#141311] border-white/10 text-[#FAF7F0]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#FACC15] text-[#141413]">
                          {currentSlide?.layout || 'content'}
                        </span>
                        <span className="text-[10px] opacity-65 font-mono">
                          Slide {currentSlideIdx + 1} / {slides.length}
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mb-1">
                        {currentSlide?.title}
                      </h2>
                      {currentSlide?.subtitle && (
                        <p className="text-xs opacity-75">{currentSlide.subtitle}</p>
                      )}
                    </div>

                    <div className="my-auto py-2">
                      {currentSlide?.layout === 'stats' && (
                        <div className="grid grid-cols-2 gap-3 py-2">
                          {(currentSlide.bullets && currentSlide.bullets.length > 0
                            ? currentSlide.bullets.slice(0, 2)
                            : ['99.9% Reliability', '10x Performance']
                          ).map((item, idx) => (
                            <div key={idx} className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                              <div className="text-2xl sm:text-3xl font-black text-[#FACC15]">
                                {item.split(' - ')[0] || item.split(' ')[0]}
                              </div>
                              <div className="text-xs opacity-80 mt-1">
                                {item.split(' - ')[1] || item.replace(/^[0-9.%+x]+/, '').trim() || 'Key Metric'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {currentSlide?.layout === 'quote' && (
                        <blockquote className="text-center italic text-sm sm:text-base opacity-90 border-l-2 border-[#FACC15] pl-4 py-2">
                          “{currentSlide?.quoteText || currentSlide?.title}”
                        </blockquote>
                      )}

                      {currentSlide?.layout === 'code' && (
                        <div className="bg-black/60 rounded-xl p-3 font-mono text-xs text-[#FACC15] border border-white/10 overflow-x-auto max-h-40">
                          <pre>{currentSlide?.codeSnippet?.code || '// Code preview'}</pre>
                        </div>
                      )}

                      {currentSlide?.layout !== 'stats' &&
                        currentSlide?.layout !== 'quote' &&
                        currentSlide?.layout !== 'code' && (
                          <ul className="space-y-2 text-xs sm:text-sm">
                            {currentSlide?.bullets?.map((b, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2">
                                <span className="text-[#FACC15] font-bold">•</span>
                                <span className="opacity-90">{b}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] opacity-60 border-t border-white/10 pt-2 font-mono">
                      <span>NovaTools Studio</span>
                      <span>16:9 Widescreen</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
                      disabled={currentSlideIdx === 0}
                      className="nt-btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-30 flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>

                    <div className="flex items-center gap-1.5">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlideIdx(idx)}
                          className={`h-2 rounded-full transition-all cursor-pointer ${
                            currentSlideIdx === idx ? 'bg-[#141413] dark:bg-[#FACC15] w-5' : 'bg-[#D6CFC0] dark:bg-[#36322B] w-2'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentSlideIdx((prev) => Math.min(slides.length - 1, prev + 1))}
                      disabled={currentSlideIdx === slides.length - 1}
                      className="nt-btn-secondary px-3 py-1.5 text-xs font-bold disabled:opacity-30 flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'spreadsheet' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {tables.length === 0 ? (
                <div className="nt-well flex-1 flex flex-col items-center justify-center text-[#746D61] dark:text-[#938B7D] text-xs p-6 text-center">
                  <TableIcon className="w-10 h-10 mb-2 opacity-35" />
                  No markdown tables detected. Add pipe tables or click "AI to Excel".
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="nt-well flex-1 overflow-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#141413] text-[#FACC15] sticky top-0">
                          {currentTable?.headers.map((h, hIdx) => (
                            <th key={hIdx} className="p-3 font-bold border-r border-white/10">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-[#1F1D19]">
                        {currentTable?.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-[var(--nt-border)] hover:bg-[#FEF7D6]/40 dark:hover:bg-[#26231E]">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 text-[#141413] dark:text-[#FAF7F0] border-r border-[var(--nt-border)]">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-[#746D61] dark:text-[#938B7D] mt-2 flex items-center justify-between font-mono">
                    <span>
                      {currentTable?.rows.length} row(s) • {currentTable?.headers.length} column(s)
                    </span>
                    <span className="text-[#15803D] dark:text-[#4ADE80] font-bold">Ready for Excel (.xlsx) Export</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Master Export Dock */}
      <div className="nt-well p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#15803D] dark:text-[#4ADE80]" />
          <span className="text-xs text-[#454038] dark:text-[#CBC4B6] font-mono font-semibold">
            {aiTier || '100% Client-Side Privacy Engine Active'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            disabled={isProcessing}
            className="nt-btn-yellow px-4 py-2 text-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF (.pdf)
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={isProcessing}
            className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Word (.docx)
          </button>

          <button
            onClick={handleDownloadPptx}
            disabled={isProcessing}
            className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-2"
          >
            <Presentation className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" />
            PowerPoint (.pptx)
          </button>

          <button
            onClick={handleDownloadXlsx}
            disabled={isProcessing}
            className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#15803D] dark:text-[#4ADE80]" />
            Excel (.xlsx)
          </button>

          <button
            onClick={handlePrintPdf}
            disabled={isProcessing}
            title="Open browser vector print dialog"
            className="nt-btn-secondary px-3 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
