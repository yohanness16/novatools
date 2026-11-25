import React, { useLayoutEffect, useRef, useState } from 'react';
import type { ToolMeta } from '../lib/toolsData';
import { getToolTheme, type ToolVisualTheme } from '../lib/toolTheme';

interface ToolHoverPreviewProps {
  tool: ToolMeta | null;
  anchorRect: DOMRect | null;
}

type CardTone = 'cream' | 'yellow' | 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'teal';

const TONE_CLASSES: Record<CardTone, string> = {
  cream: 'bg-white border-[#D6CFC0] text-[#141413]',
  yellow: 'bg-[#FACC15] border-[#CA8A04] text-[#141413]',
  red: 'bg-[#DC2626] border-[#B91C1C] text-[#FACC15]',
  blue: 'bg-[#2563EB] border-[#1D4ED8] text-[#FACC15]',
  green: 'bg-[#16A34A] border-[#15803D] text-[#FACC15]',
  orange: 'bg-[#EA580C] border-[#C2410C] text-[#FACC15]',
  purple: 'bg-[#7C3AED] border-[#6D28D9] text-[#FACC15]',
  teal: 'bg-[#0D9488] border-[#0F766E] text-[#FACC15]',
};

const MiniPage: React.FC<{
  label?: string;
  tone?: CardTone;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ label, tone = 'cream', className = '', style, children }) => {
  const isLight = tone === 'cream' || tone === 'yellow';
  return (
    <div
      style={style}
      className={`rounded-md border px-2 py-1.5 flex flex-col justify-between shadow-sm ${TONE_CLASSES[tone]} ${className}`}
    >
      {label && <span className="font-mono text-[9px] font-extrabold leading-none">{label}</span>}
      {children || (
        <div className="space-y-1 mt-1">
          <div
            className={`h-1 w-full rounded-full ${isLight ? 'bg-[#141413]/25' : 'bg-white/35'}`}
          />
          <div
            className={`h-1 w-2/3 rounded-full ${isLight ? 'bg-[#141413]/15' : 'bg-white/25'}`}
          />
        </div>
      )}
    </div>
  );
};

const WaveBars: React.FC<{
  count?: number;
  boosted?: boolean;
  muted?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
}> = ({
  count = 9,
  boosted = false,
  muted = false,
  primaryColor = '#2563EB',
  secondaryColor = '#FACC15',
}) => (
  <div className="flex items-center justify-center gap-1 h-11">
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        style={{
          animation: muted
            ? undefined
            : `nt-wave-bounce ${boosted ? '0.65s' : '0.95s'} ease-in-out ${i * 0.08}s infinite`,
          height: muted
            ? '3px'
            : boosted
            ? `${24 + ((i * 7) % 18)}px`
            : `${14 + ((i * 5) % 16)}px`,
          backgroundColor: muted
            ? 'rgba(147, 139, 125, 0.45)'
            : i % 2 === 0
            ? primaryColor
            : secondaryColor,
        }}
        className="w-1.5 rounded-full transition-all"
      />
    ))}
  </div>
);

const ToolActionAnimation: React.FC<{ toolId: string; theme: ToolVisualTheme }> = ({
  toolId,
  theme,
}) => {
  switch (toolId) {
    case 'merge-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <MiniPage
            label="PDF"
            tone="red"
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-merge-left 2.4s ease-in-out infinite' }}
          />
          <MiniPage
            label="PDF"
            tone="blue"
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-merge-right 2.4s ease-in-out infinite' }}
          />
          <span
            style={{ color: theme.secondaryHex }}
            className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold"
          >
            A + B → PDF
          </span>
        </div>
      );

    case 'split-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <MiniPage
            label="1–3"
            tone="red"
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-split-left 2.4s ease-in-out infinite' }}
          />
          <div className="h-16 w-0.5 bg-[#2563EB] shadow-[0_0_8px_#2563EB] z-10" />
          <MiniPage
            label="4–8"
            tone="blue"
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-split-right 2.4s ease-in-out infinite' }}
          />
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
            SPLIT
          </span>
        </div>
      );

    case 'rotate-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <MiniPage
            label="PDF"
            tone="red"
            className="w-12 h-14"
            style={{ animation: 'nt-rotate-snap 2.4s ease-in-out infinite' }}
          />
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
            90° / 180°
          </span>
        </div>
      );

    case 'protect-pdf':
      return (
        <div className="relative flex items-center justify-center gap-3 w-full h-full">
          <MiniPage label="PDF" tone="red" className="w-12 h-14" />
          <div
            style={{ animation: 'nt-lock-drop 2.2s ease-in-out infinite' }}
            className="flex flex-col items-center"
          >
            <div className="w-5 h-3.5 border-2 border-[#2563EB] border-b-0 rounded-t-full" />
            <div className="w-7 h-5 rounded bg-[#2563EB] text-[#FACC15] flex items-center justify-center font-mono text-[8px] font-black">
              AES
            </div>
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
            LOCKED
          </span>
        </div>
      );

    case 'redact-flatten-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="w-24 h-16 rounded-md bg-white border border-[#DC2626]/35 p-2 space-y-1.5 shadow-sm">
            <div className="relative h-2 w-full bg-[#DC2626]/15 rounded overflow-hidden">
              <div
                style={{ animation: 'nt-redact-wipe 2.4s ease-in-out infinite' }}
                className="h-full bg-[#DC2626]"
              />
            </div>
            <div className="relative h-2 w-4/5 bg-[#2563EB]/15 rounded overflow-hidden">
              <div
                style={{ animation: 'nt-redact-wipe 2.4s ease-in-out 0.2s infinite' }}
                className="h-full bg-[#2563EB]"
              />
            </div>
            <div className="h-1.5 w-3/5 bg-[#141413]/15 rounded" />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#DC2626] dark:text-[#F87171]">
            FLATTEN
          </span>
        </div>
      );

    case 'pdf-to-images':
      return (
        <div className="relative flex items-center justify-center gap-2 w-full h-full">
          <MiniPage label="PDF" tone="red" className="w-11 h-14" />
          <span className="font-mono text-xs font-extrabold text-[#2563EB]">→</span>
          <div className="relative w-16 h-14 flex items-center">
            <MiniPage
              label="PNG"
              tone="blue"
              className="w-10 h-12 absolute left-0"
              style={{ animation: 'nt-split-left 2.4s ease-in-out infinite' }}
            />
            <MiniPage
              label="JPG"
              tone="yellow"
              className="w-10 h-12 absolute right-0"
              style={{ animation: 'nt-split-right 2.4s ease-in-out infinite' }}
            />
          </div>
        </div>
      );

    case 'images-to-pdf':
      return (
        <div className="relative flex items-center justify-center gap-2 w-full h-full">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <MiniPage
              label="IMG"
              tone="blue"
              className="w-10 h-12 absolute"
              style={{ animation: 'nt-merge-left 2.4s ease-in-out infinite' }}
            />
            <MiniPage
              label="IMG"
              tone="teal"
              className="w-10 h-12 absolute"
              style={{ animation: 'nt-merge-right 2.4s ease-in-out infinite' }}
            />
          </div>
          <span className="font-mono text-xs font-extrabold text-[#DC2626]">→</span>
          <MiniPage label="PDF" tone="red" className="w-11 h-14" />
        </div>
      );

    case 'pdf-page-numberer':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-14 h-16 rounded-md bg-white border border-[#DC2626]/35 p-2 shadow-sm">
            <div className="space-y-1.5">
              <div className="h-1 w-full bg-[#141413]/20 rounded" />
              <div className="h-1 w-3/4 bg-[#141413]/15 rounded" />
              <div className="h-1 w-5/6 bg-[#141413]/15 rounded" />
            </div>
            <span
              style={{ animation: 'nt-stamp-press 2.2s ease-in-out infinite' }}
              className="absolute bottom-1.5 right-1.5 rounded bg-[#2563EB] px-1 py-0.5 font-mono text-[8px] font-black text-[#FACC15]"
            >
              01
            </span>
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#DC2626] dark:text-[#F87171]">
            STAMP #
          </span>
        </div>
      );

    case 'background-remover':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#0284C7]/45 bg-checkerboard flex items-center justify-center shadow-sm">
            <div className="w-9 h-10 rounded-t-full rounded-b-lg bg-[#0284C7] border-2 border-[#FACC15] shadow" />
            <div
              style={{ animation: 'nt-scan-sweep 2.4s ease-in-out infinite' }}
              className="absolute inset-y-0 w-0.5 bg-[#2563EB] shadow-[0_0_10px_#2563EB]"
            />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#0284C7] dark:text-[#38BDF8]">
            ALPHA
          </span>
        </div>
      );

    case 'image-converter':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <div className="rounded-md bg-[#0284C7] px-2.5 py-2 font-mono text-[10px] font-extrabold text-[#FACC15] shadow-sm">
            PNG
          </div>
          <span className="font-mono text-xs font-extrabold text-[#2563EB]">→</span>
          <div className="h-7 overflow-hidden rounded-md bg-[#2563EB] px-2.5 font-mono text-[10px] font-black text-[#FACC15] shadow-sm">
            <div style={{ animation: 'nt-slide-cycle 3s ease-in-out infinite' }} className="leading-7">
              <div>WEBP</div>
              <div>AVIF</div>
              <div>JPG</div>
            </div>
          </div>
        </div>
      );

    case 'image-compressor':
    case 'video-compressor':
      return (
        <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full">
          <div className="w-32 h-6 rounded-md border border-[#2563EB]/30 bg-white dark:bg-[#141311] p-1 flex items-center shadow-sm">
            <div
              style={{
                animation: 'nt-compress-squeeze 2.4s ease-in-out infinite',
                backgroundColor: theme.accentHex,
              }}
              className="h-full rounded"
            />
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-extrabold">
            <span className="text-[#746D61] dark:text-[#CBC4B6]">
              {toolId === 'video-compressor' ? '48 MB' : '4.2 MB'}
            </span>
            <span style={{ color: theme.secondaryHex }}>→</span>
            <span className="text-[#16A34A] dark:text-[#4ADE80]">
              {toolId === 'video-compressor' ? '9 MB' : '380 KB'}
            </span>
          </div>
        </div>
      );

    case 'image-resizer':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div
            style={{ animation: 'nt-resize-frame 2.4s ease-in-out infinite' }}
            className="relative rounded-md border-2 border-dashed border-[#0284C7] bg-[#0284C7]/15 flex items-center justify-center"
          >
            <span className="font-mono text-[9px] font-extrabold text-[#0284C7] dark:text-[#38BDF8]">
              W × H
            </span>
            <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-xs bg-[#FACC15] border border-[#0284C7]" />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#0284C7] dark:text-[#38BDF8]">
            RESIZE
          </span>
        </div>
      );

    case 'exif-scrubber':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-28 h-14 rounded-md border border-[#0284C7]/35 bg-white dark:bg-[#141311] px-2.5 py-2 flex flex-col justify-between overflow-hidden shadow-sm">
            <div className="flex gap-1.5 font-mono text-[8px] font-bold">
              <span className="rounded bg-[#0284C7]/15 px-1 text-[#0284C7]">GPS</span>
              <span className="rounded bg-[#2563EB]/15 px-1 text-[#2563EB]">CAM</span>
              <span className="rounded bg-[#16A34A]/15 px-1 text-[#16A34A]">ISO</span>
            </div>
            <div
              style={{ animation: 'nt-redact-wipe 2.4s ease-in-out infinite' }}
              className="h-1.5 rounded bg-[#0284C7]"
            />
            <div
              style={{ animation: 'nt-scan-sweep 2.4s ease-in-out infinite' }}
              className="absolute inset-y-0 left-1/2 w-0.5 bg-[#2563EB] shadow-[0_0_8px_#2563EB]"
            />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-extrabold text-[#0284C7] dark:text-[#38BDF8]">
            CLEAN
          </span>
        </div>
      );

    case 'svg-optimizer':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <div className="rounded-md border border-[#EA580C]/35 bg-white dark:bg-[#141311] px-2 py-1.5 font-mono text-[9px] font-bold text-[#EA580C]">
            &lt;svg …/&gt;
          </div>
          <span className="font-mono text-xs font-extrabold text-[#2563EB]">→</span>
          <div className="rounded-md bg-[#2563EB] px-2 py-1.5 font-mono text-[9px] font-black text-[#FACC15] animate-pulse shadow-sm">
            &lt;Icon /&gt;
          </div>
        </div>
      );

    case 'video-trimmer':
      return (
        <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full">
          <div className="relative w-32 h-8 rounded-md bg-white dark:bg-[#141311] border border-[#7C3AED]/35 flex items-center justify-between px-1 overflow-hidden shadow-sm">
            <div
              style={{ animation: 'nt-trim-left 2.4s ease-in-out infinite' }}
              className="h-6 w-2 rounded-sm bg-[#7C3AED]"
            />
            <div className="h-4 flex-1 mx-1 rounded bg-[#2563EB]/25 border border-[#2563EB]" />
            <div
              style={{ animation: 'nt-trim-right 2.4s ease-in-out infinite' }}
              className="h-6 w-2 rounded-sm bg-[#7C3AED]"
            />
          </div>
          <span className="font-mono text-[9px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">
            00:04 – 00:18
          </span>
        </div>
      );

    case 'audio-extractor':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <MiniPage label="MP4" tone="purple" className="w-10 h-11" />
          <span className="font-mono text-xs font-extrabold text-[#2563EB]">→</span>
          <WaveBars count={6} primaryColor="#2563EB" secondaryColor="#7C3AED" />
          <span className="font-mono text-[9px] font-extrabold text-[#2563EB] dark:text-[#60A5FA]">
            MP3
          </span>
        </div>
      );

    case 'video-muter':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <WaveBars count={7} muted />
          <span className="rounded bg-[#DC2626] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#FACC15]">
            MUTE
          </span>
        </div>
      );

    case 'subtitle-generator':
    case 'lyrics-video-generator':
      return (
        <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full">
          <WaveBars count={8} primaryColor="#7C3AED" secondaryColor="#2563EB" />
          <div className="h-5 overflow-hidden rounded bg-[#2563EB] px-2.5 font-mono text-[9px] font-black text-[#FACC15] shadow-sm">
            <div style={{ animation: 'nt-slide-cycle 3s ease-in-out infinite' }} className="leading-5">
              <div>00:01 &nbsp;Hello world</div>
              <div>00:03 &nbsp;Auto synced</div>
              <div>00:05 &nbsp;Export SRT</div>
            </div>
          </div>
        </div>
      );

    case 'audio-booster':
      return (
        <div className="relative flex items-center justify-center gap-3 w-full h-full">
          <WaveBars count={8} boosted primaryColor="#7C3AED" secondaryColor="#16A34A" />
          <span className="rounded bg-[#16A34A] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#FACC15]">
            +12 dB
          </span>
        </div>
      );

    case 'video-to-gif':
      return (
        <div className="relative flex items-center justify-center gap-1.5 w-full h-full">
          {(['purple', 'blue', 'yellow'] as const).map((tone, idx) => (
            <div
              key={idx}
              style={{ animation: `nt-wave-bounce 1.2s ease-in-out ${idx * 0.25}s infinite` }}
              className={`w-8 h-10 rounded border flex items-center justify-center font-mono text-[8px] font-black ${TONE_CLASSES[tone]}`}
            >
              F{idx + 1}
            </div>
          ))}
          <span className="ml-1 font-mono text-[9px] font-extrabold text-[#7C3AED] dark:text-[#A78BFA]">
            GIF
          </span>
        </div>
      );

    case 'text-to-speech':
      return (
        <div className="relative flex items-center justify-center gap-3 w-full h-full">
          <MiniPage label="TXT" tone="blue" className="w-10 h-11" />
          <span className="font-mono text-xs font-extrabold text-[#7C3AED]">→</span>
          <WaveBars count={7} boosted primaryColor="#2563EB" secondaryColor="#7C3AED" />
        </div>
      );

    case 'doc-studio':
    case 'md-to-pdf':
    case 'md-to-docx':
    case 'doc-to-pdf':
    case 'pdf-to-doc':
    case 'doc-to-slides':
    case 'doc-to-excel': {
      const targetTone: CardTone =
        toolId === 'md-to-pdf' || toolId === 'doc-to-pdf'
          ? 'red'
          : toolId === 'doc-to-slides'
          ? 'orange'
          : toolId === 'doc-to-excel'
          ? 'green'
          : 'blue';
      const targetBadge =
        toolId === 'md-to-pdf' || toolId === 'doc-to-pdf'
          ? 'PDF'
          : toolId === 'doc-to-slides'
          ? 'PPTX'
          : toolId === 'doc-to-excel'
          ? 'XLSX'
          : toolId === 'doc-studio'
          ? 'DOC'
          : 'DOCX';
      const sourceTone: CardTone = toolId === 'pdf-to-doc' ? 'red' : 'blue';
      const sourceBadge =
        toolId === 'pdf-to-doc' ? 'PDF' : toolId.startsWith('md-') ? 'MD' : 'DOC';
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <MiniPage
            label={sourceBadge}
            tone={sourceTone}
            className="w-11 h-14"
            style={{ animation: 'nt-merge-left 2.4s ease-in-out infinite' }}
          />
          <span style={{ color: theme.secondaryHex }} className="font-mono text-xs font-extrabold">
            →
          </span>
          <MiniPage
            label={targetBadge}
            tone={targetTone}
            className="w-11 h-14"
            style={{ animation: 'nt-merge-right 2.4s ease-in-out infinite' }}
          />
        </div>
      );
    }

    case 'diagram-studio':
    case 'doc-to-flowchart':
    case 'doc-to-erd':
    case 'doc-to-architecture':
    default: {
      const leftNode =
        toolId === 'doc-to-erd' ? 'USER' : toolId === 'doc-to-architecture' ? 'API' : 'IN';
      const rightNode =
        toolId === 'doc-to-erd' ? 'ORDER' : toolId === 'doc-to-architecture' ? 'DB' : 'FLOW';
      return (
        <div className="relative flex items-center justify-center w-full h-full px-6">
          <div className="rounded-md bg-[#2563EB] px-2.5 py-1.5 font-mono text-[9px] font-black text-[#FACC15] z-10 shadow-sm">
            {leftNode}
          </div>
          <div className="relative flex-1 h-0.5 bg-[#0D9488]/35 mx-1">
            <span
              style={{ animation: 'nt-packet-travel 1.8s linear infinite' }}
              className="absolute -top-1 left-0 h-2.5 w-2.5 rounded-full bg-[#0D9488] shadow-[0_0_8px_#0D9488]"
            />
          </div>
          <div className="rounded-md bg-[#0D9488] px-2.5 py-1.5 font-mono text-[9px] font-black text-[#FACC15] z-10 shadow-sm">
            {rightNode}
          </div>
        </div>
      );
    }
  }
};

export const ToolHoverPreview: React.FC<ToolHoverPreviewProps> = ({ tool, anchorRect }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  useLayoutEffect(() => {
    if (!tool || !anchorRect) return;
    const panelWidth = 296;
    const panelHeight = panelRef.current?.offsetHeight || 310;
    const margin = 12;

    let left = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - panelWidth - margin));

    let top = anchorRect.bottom + 10;
    if (
      top + panelHeight > window.innerHeight - margin &&
      anchorRect.top - panelHeight - 10 > margin
    ) {
      top = anchorRect.top - panelHeight - 10;
    } else if (top + panelHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - panelHeight - margin);
    }

    setCoords({ left, top });
  }, [tool, anchorRect]);

  if (!tool || !anchorRect) return null;

  const theme = getToolTheme(tool);

  return (
    <div
      ref={panelRef}
      role="tooltip"
      style={{ left: `${coords.left}px`, top: `${coords.top}px`, width: '296px' }}
      className="hidden md:block fixed z-50 pointer-events-none nt-window nt-hover-panel-enter overflow-hidden"
    >
      {/* Desktop Mini Titlebar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--nt-border)] bg-[#FCFBF8] dark:bg-[#191714]">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span style={{ backgroundColor: theme.accentHex }} className="h-2 w-2 rounded-full" />
          <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
          <span style={{ backgroundColor: theme.secondaryHex }} className="h-2 w-2 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          {tool.badge && (
            <span className="nt-badge-yellow px-1.5 py-0.5 font-mono text-[9px] font-bold">
              {tool.badge}
            </span>
          )}
          <span className="font-mono text-[10px] font-bold text-[#746D61] dark:text-[#938B7D]">
            {tool.shortTag}
          </span>
        </div>
      </div>

      {/* Vertical Part 1: Multi-Color Animated GIF-like Tool Action */}
      <div
        className={`relative h-[126px] w-full border-b border-[var(--nt-border)] overflow-hidden ${theme.stageClass}`}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(${theme.dotRgba} 1px, transparent 1px)`,
            backgroundSize: '14px 14px',
          }}
        />
        <div className="absolute top-2 left-2.5 flex items-center gap-1.5 z-10">
          <span
            style={{ backgroundColor: theme.accentHex }}
            className="h-1.5 w-1.5 rounded-full animate-pulse"
          />
          <span className="font-mono text-[9px] font-extrabold uppercase tracking-wider text-[#454038] dark:text-[#CBC4B6]">
            Action
          </span>
        </div>
        <ToolActionAnimation toolId={tool.id} theme={theme} />
      </div>

      {/* Vertical Part 2: Detailed Tool Description */}
      <div className="p-3.5 bg-white dark:bg-[#1F1D19] space-y-2.5">
        <div className="space-y-1">
          <h3 className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] leading-snug">
            {tool.name}
          </h3>
          <p className="text-[11px] leading-relaxed text-[#454038] dark:text-[#CBC4B6]">
            {tool.longDescription}
          </p>
        </div>

        {tool.features.length > 0 && (
          <ul className="space-y-1 pt-2 border-t border-[var(--nt-border)]">
            {tool.features.slice(0, 2).map((feat, idx) => (
              <li
                key={idx}
                className="flex items-start gap-1.5 text-[10px] leading-snug text-[#746D61] dark:text-[#938B7D]"
              >
                <span
                  style={{ backgroundColor: idx === 0 ? theme.accentHex : theme.secondaryHex }}
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
