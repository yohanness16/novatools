import React, { useState, useEffect, useRef } from 'react';
import { TOOLS } from '../lib/toolsData';
import {
  Search,
  X,
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

const iconMap: Record<string, React.ElementType> = {
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

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTools = TOOLS.filter((tool) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      tool.shortName.toLowerCase().includes(q) ||
      tool.name.toLowerCase().includes(q) ||
      tool.shortTag.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 20);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredTools.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredTools.length) % (filteredTools.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredTools[selectedIndex]) {
          window.location.href = filteredTools[selectedIndex].path;
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTools, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16 sm:pt-24">
      <div
        className="fixed inset-0 bg-[#141413]/55 dark:bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg overflow-hidden nt-window shadow-[0_24px_64px_-12px_rgba(20,20,19,0.35)]">
        <div className="flex items-center border-b border-[var(--nt-border)] px-3.5 py-3 bg-[#FCFBF8] dark:bg-[#191714]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#141413] text-[#FACC15] mr-2.5 shrink-0">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search"
            className="w-full bg-transparent text-sm font-medium text-[#141413] dark:text-[#FAF7F0] placeholder-[#746D61] dark:placeholder-[#938B7D] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-md p-1 text-[#746D61] hover:text-[#141413] dark:hover:text-[#FAF7F0] cursor-pointer"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="ml-2 rounded-md bg-[#EAE3D4] dark:bg-[#141311] px-2 py-0.5 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0] border border-[var(--nt-border)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2 bg-white dark:bg-[#1F1D19]">
          {filteredTools.length === 0 ? (
            <div className="py-10 text-center font-mono text-xs text-[#746D61] dark:text-[#938B7D]">
              No results
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTools.map((tool, index) => {
                const IconComponent = iconMap[tool.iconName] || Layers;
                const isSelected = index === selectedIndex;

                return (
                  <a
                    key={tool.id}
                    href={tool.path}
                    onClick={onClose}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors border ${
                      isSelected
                        ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 border-[#D9A700]/60 text-[#141413] dark:text-[#FAF7F0]'
                        : 'text-[#141413] dark:text-[#FAF7F0] hover:bg-[#FCFBF8] dark:hover:bg-[#26231E] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[#141413] border-[#141413] text-[#FACC15]'
                            : 'bg-[#F5F1E8] dark:bg-[#141311] border-[var(--nt-border)] text-[#454038] dark:text-[#CBC4B6]'
                        }`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-bold truncate">{tool.shortName}</span>
                    </div>
                    <span className="rounded-md bg-[#EAE3D4] dark:bg-[#141311] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#454038] dark:text-[#CBC4B6] border border-[var(--nt-border)] shrink-0">
                      {tool.shortTag}
                    </span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
