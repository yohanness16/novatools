import React, { useState, useRef, useEffect } from 'react';
import { SvgEngine, type SvgOptimizeOptions } from '../../engines/svgEngine';
import { formatBytes, downloadBlob, readFileAsText } from '../../lib/utils';
import { Upload, Copy, Check, Download } from 'lucide-react';
import { useHandoffFiles } from '../../lib/useHandoffFiles';

const DEFAULT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <!-- Generator: Adobe Illustrator 28.0, SVG Export Plug-In -->
  <metadata>
    <desc>Sample Vector Icon</desc>
  </metadata>
  <circle cx="50.000" cy="50.000" r="40.000" fill="#141413" />
  <path d="M 35.000 50.000 L 45.000 60.000 L 65.000 40.000" stroke="#FACC15" stroke-width="7.000" fill="none" stroke-linecap="round" stroke-linejoin="round" />
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

  useHandoffFiles((files) => {
    if (files[0]) handleFileUpload(files[0]);
  });

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
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
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
      <div className="nt-card p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--nt-border)] pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
            >
              <Upload className="h-3.5 w-3.5" />
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

            <div className="nt-badge-success flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-1">
              <span>-{savings}%</span>
              <span>({formatBytes(originalBytes)} → {formatBytes(optimizedBytes)})</span>
            </div>
          </div>

          <div className="nt-well flex items-center gap-1 p-1 rounded-xl">
            {(
              [
                { id: 'preview', label: 'Preview' },
                { id: 'svg', label: 'Clean SVG' },
                { id: 'react', label: 'React JSX' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#141413] dark:bg-[#FACC15] text-[#FACC15] dark:text-[#141413] shadow-sm'
                    : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 flex flex-col space-y-4">
            {activeTab === 'preview' && (
              <div className="nt-well relative flex h-72 w-full items-center justify-center p-6 overflow-hidden bg-checkerboard">
                <div
                  className="flex items-center justify-center max-h-full max-w-full"
                  dangerouslySetInnerHTML={{ __html: optimizedSvg }}
                />
                <span className="nt-card absolute bottom-2.5 left-2.5 px-2.5 py-1 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0]">
                  Vector Canvas
                </span>
              </div>
            )}

            {activeTab === 'svg' && (
              <div className="nt-well p-4">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-[var(--nt-border)]">
                  <span className="font-mono text-xs font-bold text-[#454038] dark:text-[#CBC4B6]">
                    SVG Code ({optimizedBytes} bytes)
                  </span>
                  <button
                    onClick={() => copyToClipboard(optimizedSvg, 'svg')}
                    className="nt-btn-secondary flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold"
                  >
                    {copiedSvg ? <Check className="h-3.5 w-3.5 text-[#15803D]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedSvg ? 'Copied' : 'Copy SVG'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={optimizedSvg}
                  rows={9}
                  className="w-full bg-transparent font-mono text-xs text-[#141413] dark:text-[#FAF7F0] focus:outline-none resize-none"
                />
              </div>
            )}

            {activeTab === 'react' && (
              <div className="nt-well p-4">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-[var(--nt-border)]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#454038] dark:text-[#CBC4B6]">Component:</span>
                    <input
                      type="text"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      className="nt-input px-2.5 py-1 font-mono text-xs"
                    />
                  </div>
                  <button
                    onClick={() => copyToClipboard(reactComponentCode, 'react')}
                    className="nt-btn-yellow flex items-center gap-1.5 px-3 py-1 text-xs"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy React JSX'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={reactComponentCode}
                  rows={9}
                  className="w-full bg-transparent font-mono text-xs text-[#141413] dark:text-[#FACC15] focus:outline-none resize-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF7F0] mb-1.5 font-mono">
                Raw SVG Source:
              </label>
              <textarea
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                rows={4}
                className="nt-input w-full p-3 font-mono text-xs"
              />
            </div>
          </div>

          <div className="lg:col-span-4 nt-well p-4 space-y-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#746D61] dark:text-[#938B7D] block border-b border-[var(--nt-border)] pb-2">
              SVGO Clean Rules
            </span>

            <div className="space-y-2 text-xs">
              {[
                { key: 'removeComments', label: 'Strip XML Comments' },
                { key: 'removeDoctype', label: 'Remove DOCTYPE & XML' },
                { key: 'removeMetadata', label: 'Remove Metadata & Titles' },
                { key: 'removeEditorData', label: 'Clean Editor Tags (Figma/AI)' },
                { key: 'roundDecimals', label: 'Round Coordinates (2 Decimals)' },
                { key: 'minifyWhitespace', label: 'Minify Whitespace' },
              ].map((rule) => (
                <label
                  key={rule.key}
                  className="nt-subcard flex items-center gap-2.5 p-2.5 cursor-pointer text-[#141413] dark:text-[#FAF7F0]"
                >
                  <input
                    type="checkbox"
                    checked={options[rule.key as keyof SvgOptimizeOptions]}
                    onChange={() => handleOptionToggle(rule.key as keyof SvgOptimizeOptions)}
                    className="rounded border-[var(--nt-border-strong)] accent-[#141413] dark:accent-[#FACC15]"
                  />
                  <span className="font-medium">{rule.label}</span>
                </label>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--nt-border)]">
              <button
                onClick={() => {
                  const blob = new Blob([optimizedSvg], { type: 'image/svg+xml' });
                  downloadBlob(blob, `${componentName.toLowerCase() || 'optimized'}.svg`);
                }}
                className="w-full flex items-center justify-center gap-2 nt-btn-yellow py-2.5 text-xs"
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
