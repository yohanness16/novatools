import React, { useState, useRef } from 'react';
import { SvgEngine, type SvgOptimizeOptions } from '../../engines/svgEngine';
import { formatBytes, downloadBlob, readFileAsText } from '../../lib/utils';
import { Upload, Code, Copy, Check, Download, CheckCircle, AlertCircle } from 'lucide-react';

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Generator: Adobe Illustrator 28.0, SVG Export Plug-In -->
  <metadata>
    <desc>Sample Vector Icon</desc>
  </metadata>
  <circle cx="50.000" cy="50.000" r="40.000" fill="#6366f1" />
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

  // Run on mount or option change
  React.useEffect(() => {
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
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload SVG File
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

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-medium text-emerald-400 border border-emerald-500/20">
                -{savings}% ({formatBytes(originalBytes)} → {formatBytes(optimizedBytes)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'preview' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Live Preview
            </button>
            <button
              onClick={() => setActiveTab('svg')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'svg' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Optimized SVG
            </button>
            <button
              onClick={() => setActiveTab('react')}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === 'react' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              React / JSX
            </button>
          </div>
        </div>

        {/* Workspace Display Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Center View Area */}
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {activeTab === 'preview' && (
              <div className="relative flex h-80 w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 overflow-hidden">
                <div
                  className="flex items-center justify-center max-h-full max-w-full"
                  dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                />
                <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-2 py-1 font-mono text-[10px] text-zinc-400">
                  Interactive Vector Canvas
                </span>
              </div>
            )}

            {activeTab === 'svg' && (
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-800">
                  <span className="font-mono text-xs text-zinc-400">SVG Output ({optimizedBytes} bytes)</span>
                  <button
                    onClick={() => copyToClipboard(optimizedSvg, 'svg')}
                    className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs text-zinc-200 hover:bg-zinc-700"
                  >
                    {copiedSvg ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSvg ? 'Copied!' : 'Copy SVG'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={optimizedSvg}
                  rows={10}
                  className="w-full bg-transparent font-mono text-xs text-emerald-400 focus:outline-none resize-none"
                />
              </div>
            )}

            {activeTab === 'react' && (
              <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Component:</span>
                    <input
                      type="text"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      className="rounded bg-zinc-900 border border-zinc-700 px-2 py-0.5 font-mono text-xs text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(reactComponentCode, 'react')}
                    className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy JSX Code'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={reactComponentCode}
                  rows={10}
                  className="w-full bg-transparent font-mono text-xs text-brand-300 focus:outline-none resize-none"
                />
              </div>
            )}

            {/* Input SVG Code Editor */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Paste / Edit Raw SVG XML:
              </label>
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Right Options Sidebar */}
          <div className="lg:col-span-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Minification Rules
            </span>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={options.removeComments}
                  onChange={() => handleOptionToggle('removeComments')}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Strip XML Comments</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={options.removeDoctype}
                  onChange={() => handleOptionToggle('removeDoctype')}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Remove DOCTYPE & XML Declaration</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={options.removeMetadata}
                  onChange={() => handleOptionToggle('removeMetadata')}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Remove Metadata & Titles</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={options.removeEditorData}
                  onChange={() => handleOptionToggle('removeEditorData')}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Clean Editor Tags (Illustrator, Inkscape)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={options.roundDecimals}
                  onChange={() => handleOptionToggle('roundDecimals')}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Round Floating Points (2 Decimals)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={options.minifyWhitespace}
                  onChange={() => handleOptionToggle('minifyWhitespace')}
                  className="rounded border-zinc-700 bg-zinc-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Minify Whitespace</span>
              </label>
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
                  downloadBlob(blob, `${componentName.toLowerCase() || 'optimized'}.svg`);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download Optimized .SVG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
