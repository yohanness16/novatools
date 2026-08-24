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
      <div className="rounded border border-[#2A2D33] bg-[#131418] p-2 space-y-1">
        <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#5B606D] font-semibold border-b border-[#2A2D33] mb-1 flex items-center justify-between">
          <span>Tool Suites (21)</span>
          <span className="text-[#3FBE73]">Local</span>
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
                className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-medium text-[#ECEDEF] hover:bg-[#1B1D22] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <SuiteIcon className="h-3.5 w-3.5 text-[#8B8F98]" />
                  <span>{suite.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-[#5B606D]">{suiteTools.length}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 text-[#5B606D]" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-[#5B606D]" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l border-[#2A2D33] ml-3.5">
                  {suiteTools.map((tool) => {
                    const ToolIcon = ICON_MAP[tool.iconName] || FileText;
                    const isActive = tool.id === currentToolId;

                    return (
                      <a
                        key={tool.id}
                        href={tool.path}
                        className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                          isActive
                            ? 'bg-[#16233F] text-[#4F8CFF] font-medium border border-[#4F8CFF]/30'
                            : 'text-[#8B8F98] hover:text-[#ECEDEF] hover:bg-[#1B1D22]'
                        }`}
                      >
                        <ToolIcon className={`h-3 w-3 ${isActive ? 'text-[#4F8CFF]' : 'text-[#8B8F98]'}`} />
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
      <div className="hidden lg:block rounded border border-[#2A2D33] bg-[#131418] p-3 font-mono text-[11px] space-y-1.5 text-[#8B8F98]">
        <div className="text-[10px] uppercase text-[#5B606D] font-semibold">Engine Telemetry</div>
        <div className="flex justify-between">
          <span>Execution:</span>
          <span className="text-[#ECEDEF]">Browser WASM</span>
        </div>
        <div className="flex justify-between">
          <span>Uploads:</span>
          <span className="text-[#3FBE73]">0 Bytes</span>
        </div>
        <div className="flex justify-between">
          <span>Storage:</span>
          <span className="text-[#ECEDEF]">Local RAM</span>
        </div>
      </div>
    </aside>
  );
};
