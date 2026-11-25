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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Workflow,
} from 'lucide-react';
import { DiagramEngine } from '../../engines/diagramEngine';
import { DocEngine } from '../../engines/docEngine';
import { PdfEngine } from '../../engines/pdfEngine';
import type { DiagramType, DiagramTheme } from '../../engines/diagramTypes';
import { useHandoffFiles } from '../../lib/useHandoffFiles';

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
  const [diagramTheme, setDiagramTheme] = useState<DiagramTheme>('neutral');
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

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setStatusMessage(`Loading ${file.name}...`);

    try {
      if (file.name.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const { markdown } = await PdfEngine.extractTextAndStructureFromPdf(buffer);
        setDocText(markdown);
        generateDiagram(markdown, diagramType, diagramTheme);
        setStatusMessage('Loaded');
      } else if (file.name.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const { markdown } = await DocEngine.docxToMarkdown(buffer);
        setDocText(markdown);
        generateDiagram(markdown, diagramType, diagramTheme);
        setStatusMessage('Loaded');
      } else {
        const text = await file.text();
        setDocText(text);
        generateDiagram(text, diagramType, diagramTheme);
        setStatusMessage('Loaded');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatusMessage(''), 3000);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useHandoffFiles((files) => {
    if (files[0]) processFile(files[0]);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

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
    <div className="w-full space-y-5">
      <div className="nt-well p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15] flex items-center justify-center shrink-0">
              <Workflow className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[#141413] dark:text-[#FAF7F0]">
              {diagramType.toUpperCase()}
            </span>
          </div>

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
            className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF / DOCX
          </button>

          <button
            onClick={() => generateDiagram(docText, diagramType, diagramTheme)}
            disabled={isProcessing}
            className="nt-btn-yellow px-4 py-2 text-xs flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Regenerate Diagram
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="nt-badge-yellow rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 font-mono font-bold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>{statusMessage}</span>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
          const active = diagramType === item.type;
          return (
            <button
              key={item.type}
              onClick={() => handleTypeChange(item.type)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 border transition-all cursor-pointer ${
                active
                  ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] border-[#141413] shadow-sm'
                  : 'nt-btn-secondary'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 nt-card p-4 flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--nt-border)]">
            <div className="nt-well flex items-center gap-1 p-1 rounded-xl">
              <button
                onClick={() => setLeftTab('doc')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === 'doc'
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413]'
                    : 'text-[#454038] dark:text-[#CBC4B6]'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Source
              </button>

              <button
                onClick={() => setLeftTab('code')}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  leftTab === 'code'
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413]'
                    : 'text-[#454038] dark:text-[#CBC4B6]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                Mermaid
              </button>
            </div>

            <button
              onClick={handleCopyCode}
              className="nt-btn-secondary px-2.5 py-1.5 text-xs flex items-center gap-1 font-bold"
              title="Copy Mermaid Code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#15803D]" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {leftTab === 'doc' ? (
            <textarea
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste document text, architecture specs, or database schema..."
              className="nt-input flex-1 w-full p-4 text-xs font-mono resize-none overflow-y-auto leading-relaxed"
            />
          ) : (
            <textarea
              value={mermaidCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="Mermaid.js syntax..."
              className="nt-input flex-1 w-full p-4 text-xs font-mono resize-none overflow-y-auto leading-relaxed"
            />
          )}
        </div>

        <div className="lg:col-span-7 nt-card p-4 flex flex-col h-[600px]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--nt-border)]">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5 font-mono">
              <Eye className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
              Visual Canvas
            </span>

            <div className="flex items-center gap-2">
              <select
                value={diagramTheme}
                onChange={(e) => handleThemeChange(e.target.value as DiagramTheme)}
                className="nt-input text-xs font-semibold rounded-lg px-2.5 py-1 cursor-pointer"
              >
                <option value="neutral">Neutral Theme</option>
                <option value="default">Classic Theme</option>
                <option value="forest">Forest Theme</option>
                <option value="dark">Dark Theme</option>
              </select>

              <div className="nt-well flex items-center gap-1 p-0.5 rounded-lg">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
                  className="p-1.5 text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0] rounded cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono font-bold text-[#141413] dark:text-[#FAF7F0] px-1">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1.5 text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0] rounded cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0] rounded cursor-pointer"
                  title="Reset Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={canvasRef}
            className={`flex-1 rounded-xl border border-[var(--nt-border)] p-6 overflow-auto flex items-center justify-center relative shadow-well ${
              diagramTheme === 'dark' ? 'bg-[#141311]' : 'bg-[#FCFBF8]'
            }`}
          >
            {renderError ? (
              <div className="text-center p-6 space-y-3 max-w-md">
                <div className="text-[#B91C1C] text-xs font-extrabold">Syntax Error in Diagram</div>
                <div className="nt-badge-danger text-[11px] font-mono p-3 text-left overflow-x-auto">
                  {renderError}
                </div>
                <button
                  onClick={() => generateDiagram(docText, diagramType, diagramTheme)}
                  className="nt-btn-yellow px-4 py-2 text-xs"
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
              <div className="text-xs text-[#746D61] flex items-center gap-2 font-mono">
                <RefreshCw className="w-4 h-4 animate-spin" /> Rendering diagram...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="nt-well p-4 flex flex-wrap items-center justify-end gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadSvg}
            className="nt-btn-yellow px-4 py-2 text-xs flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download SVG (Vector)
          </button>

          <button
            onClick={handleDownloadPng}
            disabled={isProcessing}
            className="nt-btn-primary px-4 py-2 text-xs font-bold flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download 4K PNG
          </button>

          <button
            onClick={handleDownloadCode}
            className="nt-btn-secondary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5"
          >
            <FileCode className="w-4 h-4" />
            Mermaid (.mmd)
          </button>
        </div>
      </div>
    </div>
  );
}
