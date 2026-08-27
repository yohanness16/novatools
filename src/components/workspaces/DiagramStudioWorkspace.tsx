import React, { useState, useEffect, useRef } from 'react';
import {
  GitBranch,
  Database,
  Layers,
  Network,
  Cpu,
  Sparkles,
  Upload,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  FileCode,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Palette,
  FileText,
  Workflow,
  Share2,
} from 'lucide-react';
import { DiagramEngine } from '../../engines/diagramEngine';
import { DocEngine } from '../../engines/docEngine';
import { PdfEngine } from '../../engines/pdfEngine';
import type { DiagramType, DiagramTheme } from '../../engines/diagramTypes';

const SAMPLE_DOCUMENT = `# E-Commerce Microservices Architecture

The system coordinates order processing, user authentication, inventory validation, and payment settlement.

## Processing Workflow
1. User submits checkout cart with payment details
2. API Gateway validates JWT authentication token
3. Order Service creates pending order entry
4. Inventory Service verifies item stock availability
5. Payment Service settles charge with Stripe
6. Notification Service dispatches confirmation email

## Database Entities
- User (id, email, full_name, created_at)
- Order (id, user_id, total_amount, status, created_at)
- OrderItem (id, order_id, product_id, quantity, unit_price)
- Product (id, sku, title, price, stock_count)
`;

export default function DiagramStudioWorkspace() {
  const [docText, setDocText] = useState<string>(SAMPLE_DOCUMENT);
  const [diagramType, setDiagramType] = useState<DiagramType>('flowchart');
  const [diagramTheme, setDiagramTheme] = useState<DiagramTheme>('dark');
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [leftTab, setLeftTab] = useState<'doc' | 'code'>('doc');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Generate initial diagram on mount
  useEffect(() => {
    generateDiagram(docText, diagramType, diagramTheme);
  }, []);

  const generateDiagram = async (text: string, type: DiagramType, theme: DiagramTheme) => {
    setIsProcessing(true);
    setStatusMessage(`Generating ${type} diagram...`);
    setRenderError(null);

    try {
      const result = await DiagramEngine.generateDiagramFromDocument(text, type, { type, theme }, (msg) => {
        setStatusMessage(msg);
      });

      setMermaidCode(result.code);
      const { svg, error } = await DiagramEngine.renderToSvg(result.code, theme);

      if (error) {
        setRenderError(error);
      } else {
        setRenderedSvg(svg);
      }
      setStatusMessage('Diagram ready!');
    } catch (err: any) {
      console.error(err);
      setRenderError(err.message || 'Failed to generate diagram');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleTypeChange = (newType: DiagramType) => {
    setDiagramType(newType);
    generateDiagram(docText, newType, diagramTheme);
  };

  const handleThemeChange = async (newTheme: DiagramTheme) => {
    setDiagramTheme(newTheme);
    if (mermaidCode) {
      const { svg, error } = await DiagramEngine.renderToSvg(mermaidCode, newTheme);
      if (error) setRenderError(error);
      else setRenderedSvg(svg);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    setMermaidCode(newCode);
    const { svg, error } = await DiagramEngine.renderToSvg(newCode, diagramTheme);
    if (error) {
      setRenderError(error);
    } else {
      setRenderError(null);
      setRenderedSvg(svg);
    }
  };

  // Upload handler for PDF, DOCX, MD, TXT
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(`Ingesting ${file.name}...`);

    try {
      if (file.name.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const { markdown } = await PdfEngine.extractTextAndStructureFromPdf(buffer);
        setDocText(markdown);
        generateDiagram(markdown, diagramType, diagramTheme);
        setStatusMessage('PDF ingested and converted to diagram!');
      } else if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const { markdown } = await DocEngine.docxToMarkdown(buffer);
        setDocText(markdown);
        generateDiagram(markdown, diagramType, diagramTheme);
        setStatusMessage('DOCX ingested and converted to diagram!');
      } else {
        const text = await file.text();
        setDocText(text);
        generateDiagram(text, diagramType, diagramTheme);
        setStatusMessage('Document loaded and converted!');
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

  // Export handlers
  const handleDownloadSvg = () => {
    if (!renderedSvg) return;
    const blob = new Blob([renderedSvg], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `${diagramType}-diagram.svg`);
  };

  const handleDownloadPng = async () => {
    if (!canvasRef.current) return;
    const svgElem = canvasRef.current.querySelector('svg');
    if (!svgElem) return;

    setIsProcessing(true);
    setStatusMessage('Rasterizing 4K vector PNG...');
    try {
      const pngBlob = await DiagramEngine.svgToPngBlob(svgElem, 3);
      downloadBlob(pngBlob, `${diagramType}-diagram.png`);
      setStatusMessage('High-resolution PNG downloaded!');
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`PNG export failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleDownloadCode = () => {
    if (!mermaidCode) return;
    const blob = new Blob([mermaidCode], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `${diagramType}-diagram.mmd`);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mermaidCode);
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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-surface/80 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              AI Document-to-Diagram Studio
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-medium">
                Mermaid.js Vector
              </span>
            </h1>
            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
              <span>Flowcharts</span>
              <span>•</span>
              <span>ER Diagrams</span>
              <span>•</span>
              <span>Architecture</span>
              <span>•</span>
              <span>Sequence</span>
              <span>•</span>
              <span>100% Client-Side Private</span>
            </p>
          </div>
        </div>

        {/* Action Controls & Dropzone */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.md,.txt,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-zinc-400" />
            Upload PDF / DOCX
          </button>

          <button
            onClick={() => generateDiagram(docText, diagramType, diagramTheme)}
            disabled={isProcessing}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-2 transition shadow-glow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Regenerate AI
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Diagram Type & Discipline Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {(
          [
            { type: 'flowchart', label: 'Flowchart', icon: GitBranch },
            { type: 'erDiagram', label: 'ER Database', icon: Database },
            { type: 'architecture', label: 'Architecture', icon: Layers },
            { type: 'sequenceDiagram', label: 'Sequence', icon: Network },
            { type: 'mindmap', label: 'Mindmap', icon: Cpu },
            { type: 'classDiagram', label: 'Class / OOP', icon: FileCode },
            { type: 'stateDiagram', label: 'State Machine', icon: RotateCcw },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => handleTypeChange(item.type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                diagramType === item.type
                  ? 'bg-purple-600 text-white shadow-glow-sm'
                  : 'bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Studio Split Panes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Source & Mermaid Code Editor */}
        <div className="lg:col-span-5 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
              <button
                onClick={() => setLeftTab('doc')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  leftTab === 'doc' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Document Source
              </button>

              <button
                onClick={() => setLeftTab('code')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  leftTab === 'code' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Mermaid Code
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 transition"
              title="Copy Mermaid Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">Copy Code</span>
            </button>
          </div>

          {leftTab === 'doc' ? (
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste document text, architecture specs, or database schema..."
              className="flex-1 w-full bg-zinc-950/70 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none overflow-y-auto leading-relaxed shadow-inner"
            />
          ) : (
            <textarea
              value={mermaidCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Mermaid.js syntax..."
              className="flex-1 w-full bg-zinc-950/70 border border-zinc-900 rounded-xl p-4 text-xs font-mono text-purple-300 placeholder-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none overflow-y-auto leading-relaxed shadow-inner"
            />
          )}
        </div>

        {/* Right: Interactive Visual Diagram Canvas */}
        <div className="lg:col-span-7 bg-surface/60 backdrop-blur-xl border border-zinc-800/80 rounded-2xl p-4 flex flex-col h-[650px] shadow-xl">
          {/* Canvas Controls Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-purple-400" />
                Visual Canvas
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Picker */}
              <select
                value={diagramTheme}
                onChange={(e) => handleThemeChange(e.target.value as DiagramTheme)}
                className="bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 rounded-lg px-2 py-1 outline-none"
              >
                <option value="dark">Dark Theme</option>
                <option value="forest">Forest Theme</option>
                <option value="neutral">Neutral Theme</option>
                <option value="default">Classic Theme</option>
              </select>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
                  className="p-1 text-zinc-400 hover:text-white rounded"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-zinc-400 px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 text-zinc-400 hover:text-white rounded"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1 text-zinc-400 hover:text-white rounded"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            ref={canvasRef}
            className="flex-1 bg-zinc-950/90 border border-zinc-900 rounded-xl p-6 overflow-auto flex items-center justify-center relative shadow-inner"
          >
            {renderError ? (
              <div className="text-center p-6 space-y-2 max-w-md">
                <div className="text-red-400 text-xs font-bold">Syntax Error in Diagram</div>
                <div className="text-[11px] font-mono text-zinc-400 bg-red-950/40 p-3 rounded-lg border border-red-900/60 text-left overflow-x-auto">
                  {renderError}
                </div>
                <button
                  onClick={() => generateDiagram(docText, diagramType, diagramTheme)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold"
                >
                  Auto-Fix & Regenerate
                </button>
              </div>
            ) : renderedSvg ? (
              <div
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                className="transition-transform duration-150 flex items-center justify-center max-w-full"
                dangerouslySetInnerHTML={{ __html: renderedSvg }}
              />
            ) : (
              <div className="text-xs text-zinc-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> Rendering diagram...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Master Export Dock */}
      <div className="bg-surface/90 backdrop-blur-xl border border-zinc-800/90 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span className="text-xs text-zinc-400">
            100% Client-Side Private • Vector graphics compiled locally
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadSvg}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-2 transition shadow-glow-sm"
          >
            <Download className="w-4 h-4" />
            Download SVG (Vector)
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-xs font-bold text-indigo-300 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            Download 4K PNG
          </button>

          <button
            onClick={handleDownloadCode}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            Mermaid (.mmd)
          </button>
        </div>
      </div>
    </div>
  );
}
