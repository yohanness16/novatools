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
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.categoryLabel.toLowerCase().includes(q) ||
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#141413]/55 dark:bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Desktop Spotlight Window (Instant keyboard response) */}
      <div className="relative w-full max-w-2xl overflow-hidden nt-window shadow-[0_24px_64px_-12px_rgba(20,20,19,0.35)]">
        {/* Search Bar */}
        <div className="flex items-center border-b border-[var(--nt-border)] px-4 py-3.5 bg-[#FCFBF8] dark:bg-[#191714]">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#141413] text-[#FACC15] mr-3 shrink-0">
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
            placeholder="Jump to any tool or format (e.g. compress, merge, subtitles, docx)..."
            className="w-full bg-transparent font-sans text-sm font-medium text-[#141413] dark:text-[#FAF7F0] placeholder-[#746D61] dark:placeholder-[#938B7D] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-lg p-1 text-[#746D61] hover:text-[#141413] dark:hover:text-[#FAF7F0] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 hidden sm:inline-flex items-center rounded-md bg-[#EAE3D4] dark:bg-[#141311] px-2 py-0.5 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0] border border-[var(--nt-border)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto p-2.5 bg-white dark:bg-[#1F1D19]">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center font-mono text-xs text-[#746D61] dark:text-[#938B7D]">
              No matching tools found for "{query}".
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
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 transition-colors border ${
                      isSelected
                        ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 border-[#D9A700]/60 text-[#141413] dark:text-[#FAF7F0] shadow-[0_2px_6px_-2px_rgba(20,20,19,0.10)]'
                        : 'text-[#141413] dark:text-[#FAF7F0] hover:bg-[#FCFBF8] dark:hover:bg-[#26231E] border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-[#141413] border-[#141413] text-[#FACC15]'
                            : 'bg-[#F5F1E8] dark:bg-[#141311] border-[var(--nt-border)] text-[#454038] dark:text-[#CBC4B6]'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs">{tool.name}</span>
                          <span className="rounded-md bg-[#EAE3D4] dark:bg-[#141311] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#454038] dark:text-[#CBC4B6] border border-[var(--nt-border)]">
                            {tool.categoryLabel}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-[#746D61] dark:text-[#938B7D] mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {tool.badge && (
                        <span className="rounded-full bg-[#FACC15] px-2 py-0.5 font-mono text-[9px] font-bold text-[#141413]">
                          {tool.badge}
                        </span>
                      )}
                      <span className="font-mono text-[11px] font-bold text-[#746D61] dark:text-[#938B7D]">↵</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Strip */}
        <div className="flex items-center justify-between border-t border-[var(--nt-border)] bg-[#EAE3D4]/70 dark:bg-[#141311] px-4 py-2.5 text-[10px] text-[#454038] dark:text-[#938B7D] font-mono">
          <div className="flex items-center gap-3 font-medium">
            <span>↑↓ Navigate</span>
            <span>↵ Launch</span>
            <span>ESC Dismiss</span>
          </div>
          <span className="text-[#15803D] dark:text-[#4ADE80] flex items-center gap-1.5 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] dark:bg-[#4ADE80]" />
            100% Client Memory
          </span>
        </div>
      </div>
    </div>
  );
};
