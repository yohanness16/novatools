import React, { useState, useRef, useEffect } from 'react';
import { SvgEngine, type SvgOptimizeOptions } from '../../engines/svgEngine';
import { formatBytes, downloadBlob, readFileAsText } from '../../lib/utils';
import { Upload, Code, Copy, Check, Download, CheckCircle2, AlertCircle } from 'lucide-react';

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Generator: Adobe Illustrator 28.0, SVG Export Plug-In -->
  <metadata>
    <desc>Sample Vector Icon</desc>
  </metadata>
  <circle cx="50.000" cy="50.000" r="40.000" fill="#4F8CFF" />
  <path d="M 35.000 50.000 L 45.000 60.000 L 65.000 40.000" stroke="#ffffff" stroke-width="6.000" fill="none" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;

export const SvgOptimizerWorkspace: React.FC = () => {
  const [svgInput, setSvgInput] = useState<string>(DEFAULT_SVG);
  const [optimizedSvg, setOptimizedSvg] = useState<string>('');
  const [reactComponentCode, setReactComponentCode] = useState<string>('');
  const [componentName, setComponentName] = useState<string>('CheckIcon');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'svg' | 'react'>('preview');

  const [options, setOptions] = useState<SvgOptimizeOptions>({
    removeComments: true,
    removeDoctype: true,
    removeMetadata: true,
    removeEditorData: true,
    cleanupIds: true,
    minifyWhitespace: true,
    roundDecimals: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const runOptimization = (raw: string, currentOptions: SvgOptimizeOptions) => {
    const cleaned = SvgEngine.optimize(raw, currentOptions);
    setOptimizedSvg(cleaned);
    const jsx = SvgEngine.toReactComponent(cleaned, componentName);
    setReactComponentCode(jsx);
  };

  useEffect(() => {
    runOptimization(svgInput, options);
  }, [svgInput, options, componentName]);

  const handleFileUpload = async (file: File) => {
    try {
      const text = await readFileAsText(file);
      setSvgInput(text);
      const name = file.name.replace('.svg', '').replace(/[^a-zA-Z0-9]/g, '');
      if (name) {
        setComponentName(name.charAt(0).toUpperCase() + name.slice(1) + 'Icon');
      }
    } catch {
      // ignore
    }
  };

  const handleOptionToggle = (key: keyof SvgOptimizeOptions) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
  };

  const copyToClipboard = async (text: string, type: 'react' | 'svg') => {
    await navigator.clipboard.writeText(text);
    if (type === 'react') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const originalBytes = new Blob([svgInput]).size;
  const optimizedBytes = new Blob([optimizedSvg]).size;
  const savings = Math.max(0, Math.round(((originalBytes - optimizedBytes) / (originalBytes || 1)) * 100));

  return (
    <div className="w-full space-y-4">
      <div className="rounded border border-[#2A2D33] bg-[#131418] p-4 sm:p-5 space-y-4">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2D33] pb-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded bg-[#1B1D22] border border-[#2A2D33] px-3 py-1.5 text-xs font-medium text-[#ECEDEF] hover:border-[#4F8CFF] transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-[#8B8F98]" />
              Upload .SVG
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                e.target.value = '';
              }}
            />

            <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8B8F98] bg-[#1B1D22] px-2 py-1 rounded border border-[#2A2D33]">
              <span className="text-[#3FBE73]">-{savings}%</span>
              <span>({formatBytes(originalBytes)} → {formatBytes(optimizedBytes)})</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#1B1D22] p-0.5 rounded border border-[#2A2D33]">
            <button
              onClick={() => setActiveTab('preview')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-[#131418] text-[#ECEDEF]' : 'text-[#8B8F98] hover:text-[#ECEDEF]'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('svg')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'svg' ? 'bg-[#131418] text-[#ECEDEF]' : 'text-[#8B8F98] hover:text-[#ECEDEF]'
              }`}
            >
              Clean SVG
            </button>
            <button
              onClick={() => setActiveTab('react')}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                activeTab === 'react' ? 'bg-[#131418] text-[#ECEDEF]' : 'text-[#8B8F98] hover:text-[#ECEDEF]'
              }`}
            >
              React JSX
            </button>
          </div>
        </div>

        {/* Workspace Display Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left / Center View Area */}
          <div className="lg:col-span-8 flex flex-col space-y-3">
            {activeTab === 'preview' && (
              <div className="relative flex h-72 w-full items-center justify-center rounded border border-[#2A2D33] bg-[#0B0C0F] p-6 overflow-hidden">
                <div
                  className="flex items-center justify-center max-h-full max-w-full"
                  dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                />
                <span className="absolute bottom-2.5 left-2.5 rounded bg-[#1B1D22] border border-[#2A2D33] px-2 py-0.5 font-mono text-[10px] text-[#8B8F98]">
                  Vector Canvas
                </span>
              </div>
            )}

            {activeTab === 'svg' && (
              <div className="relative rounded border border-[#2A2D33] bg-[#0B0C0F] p-3.5">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#2A2D33]">
                  <span className="font-mono text-xs text-[#8B8F98]">SVG Code ({optimizedBytes} bytes)</span>
                  <button
                    onClick={() => copyToClipboard(optimizedSvg, 'svg')}
                    className="flex items-center gap-1.5 rounded bg-[#1B1D22] border border-[#2A2D33] px-2.5 py-1 text-xs text-[#ECEDEF] hover:border-[#4F8CFF]"
                  >
                    {copiedSvg ? <Check className="h-3.5 w-3.5 text-[#3FBE73]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSvg ? 'Copied' : 'Copy SVG'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={optimizedSvg}
                  rows={9}
                  className="w-full bg-transparent font-mono text-xs text-[#3FBE73] focus:outline-none resize-none"
                />
              </div>
            )}

            {activeTab === 'react' && (
              <div className="relative rounded border border-[#2A2D33] bg-[#0B0C0F] p-3.5">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-[#2A2D33]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8B8F98]">Component:</span>
                    <input
                      type="text"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      className="rounded bg-[#1B1D22] border border-[#2A2D33] px-2 py-0.5 font-mono text-xs text-[#ECEDEF] focus:outline-none focus:border-[#4F8CFF]"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(reactComponentCode, 'react')}
                    className="flex items-center gap-1.5 rounded bg-[#4F8CFF] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#3B79F0]"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy React JSX'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={reactComponentCode}
                  rows={9}
                  className="w-full bg-transparent font-mono text-xs text-[#4F8CFF] focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Input SVG Code Editor */}
            <div>
              <label className="block text-[11px] font-medium text-[#8B8F98] mb-1 font-mono">
                Raw SVG Source:
              </label>
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                rows={3}
                className="w-full rounded border border-[#2A2D33] bg-[#1B1D22] p-2.5 font-mono text-xs text-[#ECEDEF] placeholder-[#5B606D] focus:border-[#4F8CFF] focus:outline-none"
              />
            </div>
          </div>

          {/* Right Options Sidebar */}
          <div className="lg:col-span-4 rounded bg-[#1B1D22] border border-[#2A2D33] p-3.5 space-y-2.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8B8F98] block border-b border-[#2A2D33] pb-1.5">
              SVGO Clean Rules
            </span>

            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={options.removeComments}
                  onChange={() => handleOptionToggle('removeComments')}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Strip XML Comments</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={options.removeDoctype}
                  onChange={() => handleOptionToggle('removeDoctype')}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Remove DOCTYPE & XML</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={options.removeMetadata}
                  onChange={() => handleOptionToggle('removeMetadata')}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Remove Metadata & Titles</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={options.removeEditorData}
                  onChange={() => handleOptionToggle('removeEditorData')}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Clean Editor Tags (Illustrator/Inkscape)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={options.roundDecimals}
                  onChange={() => handleOptionToggle('roundDecimals')}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Round Coordinates (2 Decimals)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[#ECEDEF]">
                <input
                  type="checkbox"
                  checked={options.minifyWhitespace}
                  onChange={() => handleOptionToggle('minifyWhitespace')}
                  className="rounded border-[#2A2D33] bg-[#131418] text-[#4F8CFF] focus:ring-0"
                />
                <span>Minify Whitespace</span>
              </label>
            </div>

            <div className="pt-2 border-t border-[#2A2D33]">
              <button
                onClick={() => {
                  const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
                  downloadBlob(blob, `${componentName.toLowerCase() || 'optimized'}.svg`);
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-[#131418] hover:bg-[#181920] border border-[#2A2D33] py-2 text-xs font-medium text-[#ECEDEF] transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-[#8B8F98]" />
                <span>Download Optimized .SVG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
