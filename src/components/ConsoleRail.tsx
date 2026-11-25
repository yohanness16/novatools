import React, { useState } from 'react';
import { TOOLS } from '../lib/toolsData';
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

export const ConsoleRail: React.FC<ConsoleRailProps> = ({ currentToolId }) => {
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
    <aside className="w-full lg:w-60 shrink-0 space-y-4">
      <div className="nt-card p-2.5 space-y-1">
        <div className="px-2.5 py-2 font-mono text-[10px] uppercase tracking-wider text-[#746D61] dark:text-[#938B7D] font-bold border-b border-[var(--nt-border)] mb-1.5 flex items-center justify-between">
          <span>Workspace Apps</span>
          <span className="nt-badge-success px-2 py-0.5 text-[9px] font-bold">Local</span>
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
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#141413] dark:text-[#FAF7F0] hover:bg-[#F5F1E8] dark:hover:bg-[#26231E] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <SuiteIcon className="h-3.5 w-3.5 text-[#746D61] dark:text-[#FACC15]" />
                  <span>{suite.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-[#746D61] dark:text-[#938B7D]">{suiteTools.length}</span>
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 text-[#746D61]" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-[#746D61]" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="pl-3 pr-1 py-0.5 space-y-0.5 border-l border-[var(--nt-border)] ml-3.5">
                  {suiteTools.map((tool) => {
                    const ToolIcon = ICON_MAP[tool.iconName] || FileText;
                    const isActive = tool.id === currentToolId;

                    return (
                      <a
                        key={tool.id}
                        href={tool.path}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors border ${
                          isActive
                            ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#141413] dark:text-[#FACC15] font-bold border-[#D9A700]/50 shadow-sm'
                            : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0] hover:bg-[#F5F1E8] dark:hover:bg-[#26231E] border-transparent'
                        }`}
                      >
                        <ToolIcon className={`h-3 w-3 ${isActive ? 'text-[#141413] dark:text-[#FACC15]' : 'text-[#746D61]'}`} />
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

      <div className="hidden lg:block nt-card p-3.5 font-mono text-[11px] space-y-2 text-[#454038] dark:text-[#CBC4B6]">
        <div className="text-[10px] uppercase text-[#746D61] dark:text-[#938B7D] font-bold">Runtime Status</div>
        <div className="flex justify-between">
          <span>Execution:</span>
          <span className="text-[#141413] dark:text-[#FAF7F0] font-bold">In-Browser</span>
        </div>
        <div className="flex justify-between">
          <span>Uploads:</span>
          <span className="text-[#15803D] dark:text-[#4ADE80] font-bold">0 Bytes</span>
        </div>
        <div className="flex justify-between">
          <span>Storage:</span>
          <span className="text-[#141413] dark:text-[#FAF7F0] font-bold">Local RAM</span>
        </div>
      </div>
    </aside>
  );
};
