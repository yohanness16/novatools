import React, { useState } from 'react';
import { TOOLS, type ToolMeta } from '../lib/toolsData';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Code,
  ChevronDown,
  ChevronRight,
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
  Film,
  Clock,
  Music,
  VolumeX,
  Volume2,
  Subtitles,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
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
  Volume2,
  Subtitles,
  FileText,
};

const SUITES = [
  { id: 'pdf', label: 'PDF Suite', icon: FileText },
  { id: 'image', label: 'Image Suite', icon: ImageIcon },
  { id: 'video', label: 'Video & Audio', icon: Video },
  { id: 'svg', label: 'SVG Suite', icon: Code },
];

interface ConsoleRailProps {
  currentToolId?: string;
  currentCategory?: string;
}

export const ConsoleRail: React.FC<ConsoleRailProps> = ({ currentToolId, currentCategory }) => {
  // Default all suites open or keep active open
  const [openSuites, setOpenSuites] = useState<Record<string, boolean>>({
    pdf: true,
    image: true,
    video: true,
    svg: true,
  });

  const toggleSuite = (suiteId: string) => {
    setOpenSuites((prev) => ({
      ...prev,
      [suiteId]: !prev[suiteId],
    }));
  };

  return (
    <aside className="w-full lg:w-56 shrink-0 space-y-4">
      <div className="rounded-xl border border-slate-200 dark:border-[#2A2D33] bg-white dark:bg-[#131418] p-2 space-y-1 shadow-sm">
        <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 dark:text-[#5B606D] font-semibold border-b border-slate-200 dark:border-[#2A2D33] mb-1 flex items-center justify-between">
          <span>Tool Suites (21)</span>
          <span className="text-emerald-600 dark:text-[#3FBE73]">Local</span>
        </div>

        {SUITES.map((suite) => {
          const SuiteIcon = suite.icon;
          const isOpen = !!openSuites[suite.id];
          const suiteTools = TOOLS.filter((t) => t.category === suite.id);

          return (
            <div key={suite.id} className="space-y-0.5">
              <button
                type="button"
                onClick={() => toggleSuite(suite.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold text-slate-800 dark:text-[#ECEDEF] hover:bg-slate-100 dark:hover:bg-[#1B1D22] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SuiteIcon className="h-3.5 w-3.5 text-slate-500 dark:text-[#8B8F98]" />
                  <span>{suite.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-slate-400 dark:text-[#5B606D]">{suiteTools.length}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 text-slate-400 dark:text-[#5B606D]" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-slate-400 dark:text-[#5B606D]" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l border-slate-200 dark:border-[#2A2D33] ml-3.5">
                  {suiteTools.map((tool) => {
                    const ToolIcon = ICON_MAP[tool.iconName] || FileText;
                    const isActive = tool.id === currentToolId;

                    return (
                      <a
                        key={tool.id}
                        href={tool.path}
                        className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs transition-colors ${
                          isActive
                            ? 'bg-sky-50 dark:bg-[#16233F] text-sky-600 dark:text-[#4F8CFF] font-semibold border border-sky-300 dark:border-[#4F8CFF]/30'
                            : 'text-slate-600 dark:text-[#8B8F98] hover:text-slate-900 dark:hover:text-[#ECEDEF] hover:bg-slate-100 dark:hover:bg-[#1B1D22]'
                        }`}
                      >
                        <ToolIcon className={`h-3 w-3 ${isActive ? 'text-sky-600 dark:text-[#4F8CFF]' : 'text-slate-400 dark:text-[#8B8F98]'}`} />
                        <span className="truncate">{tool.name}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* System Telemetry Box */}
      <div className="hidden lg:block rounded-xl border border-slate-200 dark:border-[#2A2D33] bg-white dark:bg-[#131418] p-3 font-mono text-[11px] space-y-1.5 text-slate-600 dark:text-[#8B8F98] shadow-sm">
        <div className="text-[10px] uppercase text-slate-400 dark:text-[#5B606D] font-semibold">Engine Telemetry</div>
        <div className="flex justify-between">
          <span>Execution:</span>
          <span className="text-slate-900 dark:text-[#ECEDEF] font-semibold">Browser WASM</span>
        </div>
        <div className="flex justify-between">
          <span>Uploads:</span>
          <span className="text-emerald-600 dark:text-[#3FBE73] font-semibold">0 Bytes</span>
        </div>
        <div className="flex justify-between">
          <span>Storage:</span>
          <span className="text-slate-900 dark:text-[#ECEDEF] font-semibold">Local RAM</span>
        </div>
      </div>
    </aside>
  );
};
