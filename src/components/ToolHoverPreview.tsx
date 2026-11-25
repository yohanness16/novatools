import React, { useLayoutEffect, useRef, useState } from 'react';
import type { ToolMeta } from '../lib/toolsData';

interface ToolHoverPreviewProps {
  tool: ToolMeta | null;
  anchorRect: DOMRect | null;
}

const MiniPage: React.FC<{
  label?: string;
  accent?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ label, accent = false, className = '', style, children }) => (
  <div
    style={style}
    className={`rounded-md border px-2 py-1.5 flex flex-col justify-between shadow-sm ${
      accent
        ? 'bg-[#FACC15] border-[#D4A900] text-[#141413]'
        : 'bg-[#FAF7F0] border-[#D6CFC0] text-[#141413]'
    } ${className}`}
  >
    {label && <span className="font-mono text-[9px] font-extrabold leading-none">{label}</span>}
    {children || (
      <div className="space-y-1 mt-1">
        <div className={`h-1 w-full rounded-full ${accent ? 'bg-[#141413]/30' : 'bg-[#141413]/20'}`} />
        <div className={`h-1 w-2/3 rounded-full ${accent ? 'bg-[#141413]/25' : 'bg-[#141413]/15'}`} />
      </div>
    )}
  </div>
);

const WaveBars: React.FC<{ count?: number; boosted?: boolean; muted?: boolean }> = ({
  count = 9,
  boosted = false,
  muted = false,
}) => (
  <div className="flex items-center justify-center gap-1 h-11">
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        style={{
          animation: muted
            ? undefined
            : `nt-wave-bounce ${boosted ? '0.65s' : '0.95s'} ease-in-out ${i * 0.08}s infinite`,
          height: muted ? '3px' : boosted ? `${24 + ((i * 7) % 18)}px` : `${14 + ((i * 5) % 16)}px`,
        }}
        className={`w-1.5 rounded-full transition-all ${
          muted ? 'bg-[#938B7D]/45' : i % 2 === 0 ? 'bg-[#FACC15]' : 'bg-[#FAF7F0]'
        }`}
      />
    ))}
  </div>
);

const ToolActionAnimation: React.FC<{ toolId: string }> = ({ toolId }) => {
  switch (toolId) {
    case 'merge-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <MiniPage
            label="A"
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-merge-left 2.4s ease-in-out infinite' }}
          />
          <MiniPage
            label="B"
            accent
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-merge-right 2.4s ease-in-out infinite' }}
          />
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            A + B → PDF
          </span>
        </div>
      );

    case 'split-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <MiniPage
            label="1–3"
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-split-left 2.4s ease-in-out infinite' }}
          />
          <div className="h-16 w-0.5 bg-[#FACC15] shadow-[0_0_8px_#FACC15] z-10" />
          <MiniPage
            label="4–8"
            accent
            className="w-11 h-14 absolute"
            style={{ animation: 'nt-split-right 2.4s ease-in-out infinite' }}
          />
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            SPLIT
          </span>
        </div>
      );

    case 'rotate-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <MiniPage
            label="PDF"
            accent
            className="w-12 h-14"
            style={{ animation: 'nt-rotate-snap 2.4s ease-in-out infinite' }}
          />
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            90° / 180°
          </span>
        </div>
      );

    case 'protect-pdf':
      return (
        <div className="relative flex items-center justify-center gap-3 w-full h-full">
          <MiniPage label="PDF" className="w-12 h-14" />
          <div
            style={{ animation: 'nt-lock-drop 2.2s ease-in-out infinite' }}
            className="flex flex-col items-center"
          >
            <div className="w-5 h-3.5 border-2 border-[#FACC15] border-b-0 rounded-t-full" />
            <div className="w-7 h-5 rounded bg-[#FACC15] text-[#141413] flex items-center justify-center font-mono text-[8px] font-black">
              AES
            </div>
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            ENCRYPT
          </span>
        </div>
      );

    case 'redact-flatten-pdf':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="w-24 h-16 rounded-md bg-[#FAF7F0] border border-[#D6CFC0] p-2 space-y-1.5">
            <div className="relative h-2 w-full bg-[#141413]/15 rounded overflow-hidden">
              <div
                style={{ animation: 'nt-redact-wipe 2.4s ease-in-out infinite' }}
                className="h-full bg-[#141413]"
              />
            </div>
            <div className="relative h-2 w-4/5 bg-[#141413]/15 rounded overflow-hidden">
              <div
                style={{ animation: 'nt-redact-wipe 2.4s ease-in-out 0.2s infinite' }}
                className="h-full bg-[#FACC15]"
              />
            </div>
            <div className="h-1.5 w-3/5 bg-[#141413]/20 rounded" />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            FLATTEN
          </span>
        </div>
      );

    case 'pdf-to-images':
      return (
        <div className="relative flex items-center justify-center gap-2 w-full h-full">
          <MiniPage label="PDF" className="w-11 h-14" />
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <div className="relative w-16 h-14 flex items-center">
            <MiniPage
              label="PNG"
              accent
              className="w-10 h-12 absolute left-0"
              style={{ animation: 'nt-split-left 2.4s ease-in-out infinite' }}
            />
            <MiniPage
              label="JPG"
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
              className="w-10 h-12 absolute"
              style={{ animation: 'nt-merge-left 2.4s ease-in-out infinite' }}
            />
            <MiniPage
              label="IMG"
              accent
              className="w-10 h-12 absolute"
              style={{ animation: 'nt-merge-right 2.4s ease-in-out infinite' }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <MiniPage label="PDF" accent className="w-11 h-14" />
        </div>
      );

    case 'pdf-page-numberer':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-14 h-16 rounded-md bg-[#FAF7F0] border border-[#D6CFC0] p-2">
            <div className="space-y-1.5">
              <div className="h-1 w-full bg-[#141413]/20 rounded" />
              <div className="h-1 w-3/4 bg-[#141413]/15 rounded" />
              <div className="h-1 w-5/6 bg-[#141413]/15 rounded" />
            </div>
            <span
              style={{ animation: 'nt-stamp-press 2.2s ease-in-out infinite' }}
              className="absolute bottom-1.5 right-1.5 rounded bg-[#FACC15] px-1 py-0.5 font-mono text-[8px] font-black text-[#141413]"
            >
              01
            </span>
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            STAMP #
          </span>
        </div>
      );

    case 'background-remover':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-[#FACC15]/40 bg-checkerboard flex items-center justify-center">
            <div className="w-9 h-10 rounded-t-full rounded-b-lg bg-[#141413] border-2 border-[#FACC15] shadow" />
            <div
              style={{ animation: 'nt-scan-sweep 2.4s ease-in-out infinite' }}
              className="absolute inset-y-0 w-0.5 bg-[#FACC15] shadow-[0_0_10px_#FACC15]"
            />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            ALPHA
          </span>
        </div>
      );

    case 'image-converter':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <div className="rounded-md bg-[#FAF7F0] px-2.5 py-2 font-mono text-[10px] font-extrabold text-[#141413]">
            PNG
          </div>
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <div className="h-7 overflow-hidden rounded-md bg-[#FACC15] px-2.5 font-mono text-[10px] font-black text-[#141413]">
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
          <div className="w-32 h-6 rounded-md border border-[#FAF7F0]/25 bg-[#1F1D19] p-1 flex items-center">
            <div
              style={{ animation: 'nt-compress-squeeze 2.4s ease-in-out infinite' }}
              className="h-full rounded bg-[#FACC15]"
            />
          </div>
          <div className="flex items-center gap-2 font-mono text-[9px] font-bold">
            <span className="text-[#CBC4B6]">{toolId === 'video-compressor' ? '48 MB' : '4.2 MB'}</span>
            <span className="text-[#FACC15]">→</span>
            <span className="text-[#FACC15]">{toolId === 'video-compressor' ? '9 MB' : '380 KB'}</span>
          </div>
        </div>
      );

    case 'image-resizer':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div
            style={{ animation: 'nt-resize-frame 2.4s ease-in-out infinite' }}
            className="relative rounded-md border-2 border-dashed border-[#FACC15] bg-[#FACC15]/15 flex items-center justify-center"
          >
            <span className="font-mono text-[9px] font-bold text-[#FAF7F0]">W × H</span>
            <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-xs bg-[#FACC15]" />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            RESIZE
          </span>
        </div>
      );

    case 'exif-scrubber':
      return (
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="relative w-28 h-14 rounded-md border border-[#FAF7F0]/25 bg-[#1F1D19] px-2.5 py-2 flex flex-col justify-between overflow-hidden">
            <div className="flex gap-1.5 font-mono text-[8px] font-bold">
              <span className="rounded bg-[#FAF7F0]/15 px-1 text-[#CBC4B6]">GPS</span>
              <span className="rounded bg-[#FAF7F0]/15 px-1 text-[#CBC4B6]">CAM</span>
              <span className="rounded bg-[#FAF7F0]/15 px-1 text-[#CBC4B6]">ISO</span>
            </div>
            <div
              style={{ animation: 'nt-redact-wipe 2.4s ease-in-out infinite' }}
              className="h-1.5 rounded bg-[#FACC15]"
            />
            <div
              style={{ animation: 'nt-scan-sweep 2.4s ease-in-out infinite' }}
              className="absolute inset-y-0 left-1/2 w-0.5 bg-[#FACC15] shadow-[0_0_8px_#FACC15]"
            />
          </div>
          <span className="absolute bottom-2 right-2.5 font-mono text-[9px] font-bold text-[#FACC15]">
            CLEAN
          </span>
        </div>
      );

    case 'svg-optimizer':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <div className="rounded-md border border-[#FAF7F0]/25 bg-[#1F1D19] px-2 py-1.5 font-mono text-[9px] text-[#CBC4B6]">
            &lt;svg …/&gt;
          </div>
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <div className="rounded-md bg-[#FACC15] px-2 py-1.5 font-mono text-[9px] font-black text-[#141413] animate-pulse">
            &lt;Icon /&gt;
          </div>
        </div>
      );

    case 'video-trimmer':
      return (
        <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full">
          <div className="relative w-32 h-8 rounded-md bg-[#1F1D19] border border-[#FAF7F0]/20 flex items-center justify-between px-1 overflow-hidden">
            <div
              style={{ animation: 'nt-trim-left 2.4s ease-in-out infinite' }}
              className="h-6 w-2 rounded-sm bg-[#FACC15]"
            />
            <div className="h-4 flex-1 mx-1 rounded bg-[#FACC15]/25 border border-[#FACC15]/60" />
            <div
              style={{ animation: 'nt-trim-right 2.4s ease-in-out infinite' }}
              className="h-6 w-2 rounded-sm bg-[#FACC15]"
            />
          </div>
          <span className="font-mono text-[9px] font-bold text-[#FACC15]">00:04 – 00:18</span>
        </div>
      );

    case 'audio-extractor':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <MiniPage label="MP4" className="w-10 h-11" />
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <WaveBars count={6} />
          <span className="font-mono text-[9px] font-bold text-[#FACC15]">MP3</span>
        </div>
      );

    case 'video-muter':
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <WaveBars count={7} muted />
          <span className="rounded bg-[#FACC15] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#141413]">
            MUTE
          </span>
        </div>
      );

    case 'subtitle-generator':
    case 'lyrics-video-generator':
      return (
        <div className="relative flex flex-col items-center justify-center gap-2 w-full h-full">
          <WaveBars count={8} />
          <div className="h-5 overflow-hidden rounded bg-[#FACC15] px-2.5 font-mono text-[9px] font-black text-[#141413]">
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
          <WaveBars count={8} boosted />
          <span className="rounded bg-[#FACC15] px-1.5 py-0.5 font-mono text-[9px] font-black text-[#141413]">
            +12 dB
          </span>
        </div>
      );

    case 'video-to-gif':
      return (
        <div className="relative flex items-center justify-center gap-1.5 w-full h-full">
          {[0, 1, 2].map((idx) => (
            <div
              key={idx}
              style={{ animation: `nt-wave-bounce 1.2s ease-in-out ${idx * 0.25}s infinite` }}
              className={`w-8 h-10 rounded border flex items-center justify-center font-mono text-[8px] font-bold ${
                idx === 1
                  ? 'bg-[#FACC15] border-[#D4A900] text-[#141413]'
                  : 'bg-[#FAF7F0] border-[#D6CFC0] text-[#141413]'
              }`}
            >
              F{idx + 1}
            </div>
          ))}
          <span className="ml-1 font-mono text-[9px] font-bold text-[#FACC15]">GIF</span>
        </div>
      );

    case 'text-to-speech':
      return (
        <div className="relative flex items-center justify-center gap-3 w-full h-full">
          <MiniPage label="TXT" className="w-10 h-11" />
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <WaveBars count={7} boosted />
        </div>
      );

    case 'doc-studio':
    case 'md-to-pdf':
    case 'md-to-docx':
    case 'doc-to-pdf':
    case 'pdf-to-doc':
    case 'doc-to-slides':
    case 'doc-to-excel': {
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
      const sourceBadge =
        toolId === 'pdf-to-doc' ? 'PDF' : toolId.startsWith('md-') ? 'MD' : 'DOC';
      return (
        <div className="relative flex items-center justify-center gap-2.5 w-full h-full">
          <MiniPage
            label={sourceBadge}
            className="w-11 h-14"
            style={{ animation: 'nt-merge-left 2.4s ease-in-out infinite' }}
          />
          <span className="font-mono text-xs font-bold text-[#FACC15]">→</span>
          <MiniPage
            label={targetBadge}
            accent
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
      const leftNode = toolId === 'doc-to-erd' ? 'USER' : toolId === 'doc-to-architecture' ? 'API' : 'IN';
      const rightNode = toolId === 'doc-to-erd' ? 'ORDER' : toolId === 'doc-to-architecture' ? 'DB' : 'FLOW';
      return (
        <div className="relative flex items-center justify-center w-full h-full px-6">
          <div className="rounded-md bg-[#FAF7F0] px-2.5 py-1.5 font-mono text-[9px] font-black text-[#141413] z-10">
            {leftNode}
          </div>
          <div className="relative flex-1 h-0.5 bg-[#FAF7F0]/30 mx-1">
            <span
              style={{ animation: 'nt-packet-travel 1.8s linear infinite' }}
              className="absolute -top-1 left-0 h-2.5 w-2.5 rounded-full bg-[#FACC15] shadow-[0_0_8px_#FACC15]"
            />
          </div>
          <div className="rounded-md bg-[#FACC15] px-2.5 py-1.5 font-mono text-[9px] font-black text-[#141413] z-10">
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
    if (top + panelHeight > window.innerHeight - margin && anchorRect.top - panelHeight - 10 > margin) {
      top = anchorRect.top - panelHeight - 10;
    } else if (top + panelHeight > window.innerHeight - margin) {
      top = Math.max(margin, window.innerHeight - panelHeight - margin);
    }

    setCoords({ left, top });
  }, [tool, anchorRect]);

  if (!tool || !anchorRect) return null;

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
          <span className="h-2 w-2 rounded-full bg-[#141413] dark:bg-[#FAF7F0]/35" />
          <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
          <span className="h-2 w-2 rounded-full bg-[#D6CFC0] dark:bg-[#454038]" />
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

      {/* Vertical Part 1: Animated GIF-like Tool Action */}
      <div className="relative h-[126px] w-full bg-[#141413] dark:bg-[#0E0D0B] border-b border-[var(--nt-border)] overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(rgba(250, 204, 21, 0.45) 1px, transparent 1px)',
            backgroundSize: '14px 14px',
          }}
        />
        <div className="absolute top-2 left-2.5 flex items-center gap-1.5 z-10">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FACC15] animate-pulse" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#CBC4B6]">
            Preview
          </span>
        </div>
        <ToolActionAnimation toolId={tool.id} />
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
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FACC15]" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
