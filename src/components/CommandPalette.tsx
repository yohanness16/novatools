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
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-2xl shadow-2xl shadow-cyan-950/20 animate-fade-in">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-200 dark:border-white/10 px-4 py-3.5 bg-slate-50 dark:bg-[#0D1426]/50">
          <Search className="h-4 w-4 text-sky-500 dark:text-[#38BDF8] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tools, formats, or actions (e.g. compress, merge, subtitles)..."
            className="w-full bg-transparent font-sans text-sm text-slate-900 dark:text-[#F1F5F9] placeholder-slate-400 dark:placeholder-[#64748B] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 text-slate-400 dark:text-[#94A3B8] hover:text-slate-700 dark:hover:text-[#F1F5F9]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded bg-slate-200 dark:bg-[#050811] px-2 py-0.5 font-mono text-[10px] text-slate-600 dark:text-[#94A3B8] border border-slate-300 dark:border-white/10">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-10 text-center font-mono text-xs text-slate-400 dark:text-[#64748B]">
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
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-all ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-[#0C2340] border border-sky-500/40 dark:border-[#38BDF8]/40 text-sky-600 dark:text-[#38BDF8]'
                        : 'text-slate-800 dark:text-[#F1F5F9] hover:bg-slate-100 dark:hover:bg-[#0D1426] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-sky-500/50 dark:border-[#38BDF8]/50 bg-sky-100/80 dark:bg-[#081528] text-sky-600 dark:text-[#38BDF8]'
                            : 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#0D1426] text-slate-500 dark:text-[#94A3B8]'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-[#F1F5F9]">{tool.name}</span>
                          <span className="rounded bg-slate-200/80 dark:bg-[#0D1426] px-1.5 py-0.5 font-mono text-[9px] text-slate-600 dark:text-[#94A3B8] border border-slate-300 dark:border-white/10">
                            {tool.categoryLabel}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-slate-500 dark:text-[#94A3B8]">{tool.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {tool.badge && (
                        <span className="rounded bg-sky-50 dark:bg-[#0C2340] px-1.5 py-0.5 font-mono text-[9px] font-medium text-sky-600 dark:text-[#38BDF8] border border-sky-200 dark:border-[#38BDF8]/30">
                          {tool.badge}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-slate-400 dark:text-[#64748B]">↵</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#050811] px-3.5 py-2 text-[10px] text-slate-500 dark:text-[#64748B] font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
            <span>ESC Dismiss</span>
          </div>
          <span className="text-emerald-600 dark:text-[#34D399] flex items-center gap-1.5 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-[#34D399]" />
            100% Client Memory
          </span>
        </div>
      </div>
    </div>
  );
};
