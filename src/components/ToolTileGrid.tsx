import React, { useEffect, useState } from 'react';
import type { ToolMeta } from '../lib/toolsData';
import { getToolTheme } from '../lib/toolTheme';
import { ToolHoverPreview } from './ToolHoverPreview';
import {
  ArrowRight,
  Layers,
  Scissors,
  RotateCw,
  Lock,
  EyeOff,
  FileImage,
  FilePlus,
  Repeat,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Code,
  Film,
  Clock,
  Music,
  VolumeX,
  Subtitles,
  Volume2,
  Sparkles,
  Hash,
  FileText,
  Presentation,
  FileSpreadsheet,
  Printer,
  Workflow,
  Database,
  GitBranch,
} from 'lucide-react';

export const TOOL_ICON_MAP: Record<string, React.ElementType> = {
  Layers,
  Scissors,
  RotateCw,
  Lock,
  EyeOff,
  FileImage,
  FilePlus,
  Repeat,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Code,
  Film,
  Clock,
  Music,
  VolumeX,
  Subtitles,
  Volume2,
  Sparkles,
  Hash,
  FileText,
  Presentation,
  FileSpreadsheet,
  Printer,
  Workflow,
  Database,
  GitBranch,
};

interface ToolTileGridProps {
  tools: ToolMeta[];
  showTag?: boolean;
}

export const ToolTileGrid: React.FC<ToolTileGridProps> = ({ tools, showTag = false }) => {
  const [hoveredTool, setHoveredTool] = useState<ToolMeta | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setCanHover(mq.matches);
    update();
    mq.addEventListener?.('change', update);
    return () => mq.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!hoveredTool) return;
    const clearHover = () => {
      setHoveredTool(null);
      setAnchorRect(null);
    };
    window.addEventListener('scroll', clearHover, { passive: true, capture: true });
    window.addEventListener('resize', clearHover, { passive: true });
    return () => {
      window.removeEventListener('scroll', clearHover, { capture: true });
      window.removeEventListener('resize', clearHover);
    };
  }, [hoveredTool]);

  const handleEnter = (tool: ToolMeta, el: HTMLElement) => {
    if (!canHover) return;
    setHoveredTool(tool);
    setAnchorRect(el.getBoundingClientRect());
  };

  const handleLeave = () => {
    setHoveredTool(null);
    setAnchorRect(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {tools.map((tool) => {
          const Icon = TOOL_ICON_MAP[tool.iconName] || Layers;
          const theme = getToolTheme(tool);
          const isPdf = tool.category === 'pdf';
          return (
            <a
              key={tool.id}
              href={tool.path}
              onMouseEnter={(e) => handleEnter(tool, e.currentTarget)}
              onMouseLeave={handleLeave}
              onFocus={(e) => handleEnter(tool, e.currentTarget)}
              onBlur={handleLeave}
              className="group nt-card-interactive p-3.5 sm:p-4 flex flex-col justify-between gap-3 sm:gap-4 min-h-[96px] sm:min-h-[106px]"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`relative flex h-9 w-9 items-center justify-center rounded-xl shadow-sm transition-transform duration-150 group-hover:scale-105 ${theme.iconBoxClass} ${theme.iconColorClass}`}
                >
                  <Icon className="h-4 w-4" />
                  {isPdf && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -right-1 rounded bg-[#FACC15] px-1 py-[1px] font-mono text-[7px] font-black leading-none text-[#141413] shadow-xs"
                    >
                      PDF
                    </span>
                  )}
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-[#746D61] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-[#141413] dark:group-hover:text-[#FACC15] transition-all" />
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0] truncate">
                  {tool.shortName}
                </span>
                {showTag && (
                  <span className="font-mono text-[10px] font-bold text-[#746D61] dark:text-[#938B7D] shrink-0">
                    {tool.shortTag}
                  </span>
                )}
              </div>
            </a>
          );
        })}
      </div>

      <ToolHoverPreview tool={hoveredTool} anchorRect={anchorRect} />
    </>
  );
};
