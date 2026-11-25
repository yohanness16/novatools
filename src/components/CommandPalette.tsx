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
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--nt-border)] bg-white dark:bg-[#13151A] shadow-dropdown">
        <div className="flex items-center border-b border-[var(--nt-border)] px-3.5 py-3">
          <Search className="h-4 w-4 text-[#6B7280] mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search"
            className="w-full bg-transparent text-sm font-medium text-[#111214] dark:text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded-md p-1 text-[#6B7280] hover:text-[#111214] dark:hover:text-white cursor-pointer"
              aria-label="Clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="ml-2 rounded bg-[#F3F4F6] dark:bg-[#1A1D24] px-1.5 py-0.5 font-mono text-[10px] text-[#6B7280] border border-[var(--nt-border)]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-1.5">
          {filteredTools.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#6B7280]">No results</div>
          ) : (
            <div className="space-y-0.5">
              {filteredTools.map((tool, index) => {
                const IconComponent = iconMap[tool.iconName] || Layers;
                const isSelected = index === selectedIndex;

                return (
                  <a
                    key={tool.id}
                    href={tool.path}
                    onClick={onClose}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                      isSelected
                        ? 'bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]'
                        : 'text-[#111214] dark:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D24]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <IconComponent className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-semibold truncate">{tool.shortName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#6B7280] dark:text-[#9CA3AF] shrink-0">
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
