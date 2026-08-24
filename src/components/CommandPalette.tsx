import React, { useState, useEffect, useRef } from 'react';
import { TOOLS, type ToolMeta } from '../lib/toolsData';
import { Search, X, Layers, Scissors, RotateCw, Lock, EyeOff, FileImage, FilePlus, Repeat, Minimize2, Maximize2, ShieldCheck, Code, Film, Clock, Music, VolumeX, Subtitles, Volume2, Sparkles, Hash } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Layers, Scissors, RotateCw, Lock, EyeOff, FileImage, FilePlus,
  Repeat, Minimize2, Maximize2, ShieldCheck, Code, Film, Clock, Music, VolumeX, Subtitles,
  Volume2, Sparkles, Hash,
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
      setTimeout(() => inputRef.current?.focus(), 50);
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded border border-[#2A2D33] bg-[#131418] shadow-2xl animate-fade-in">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-[#2A2D33] px-3.5 py-3">
          <Search className="h-4 w-4 text-[#8B8F98] mr-2.5 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tools, formats, or actions (e.g. compress, merge, subtitles)..."
            className="w-full bg-transparent font-mono text-xs text-[#ECEDEF] placeholder-[#5B606D] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 text-[#8B8F98] hover:text-[#ECEDEF]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded bg-[#1B1D22] px-1.5 py-0.5 font-mono text-[10px] text-[#8B8F98] border border-[#2A2D33]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {filteredTools.length === 0 ? (
            <div className="py-10 text-center font-mono text-xs text-[#5B606D]">
              No matching tools found for "{query}".
            </div>
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
                    className={`flex items-center justify-between rounded px-3 py-2 transition-colors ${
                      isSelected
                        ? 'bg-[#16233F] text-[#4F8CFF]'
                        : 'text-[#ECEDEF] hover:bg-[#1B1D22]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded border ${
                          isSelected
                            ? 'border-[#4F8CFF]/40 bg-[#131418] text-[#4F8CFF]'
                            : 'border-[#2A2D33] bg-[#1B1D22] text-[#8B8F98]'
                        }`}
                      >
                        <IconComponent className="h-3.5 w-3.5" />
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#ECEDEF]">{tool.name}</span>
                          <span className="rounded bg-[#1B1D22] px-1.5 py-0.5 font-mono text-[9px] text-[#8B8F98] border border-[#2A2D33]">
                            {tool.categoryLabel}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-[#8B8F98]">{tool.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {tool.badge && (
                        <span className="rounded bg-[#16233F] px-1.5 py-0.5 font-mono text-[9px] font-medium text-[#4F8CFF] border border-[#4F8CFF]/30">
                          {tool.badge}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-[#5B606D]">↵</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-[#2A2D33] bg-[#0B0C0F] px-3 py-1.5 text-[10px] text-[#5B606D] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Dismiss</span>
          </div>
          <span className="text-[#3FBE73] flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3FBE73]" />
            100% Client Memory
          </span>
        </div>
      </div>
    </div>
  );
};
