import React, { useState, useEffect, useRef } from 'react';
import { TOOLS, type ToolMeta } from '../lib/toolsData';
import { Search, X, Layers, Scissors, RotateCw, Lock, EyeOff, FileImage, FilePlus, Repeat, Minimize2, Maximize2, ShieldCheck, Code, Film, Clock, Music, VolumeX, Subtitles } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Layers, Scissors, RotateCw, Lock, EyeOff, FileImage, FilePlus,
  Repeat, Minimize2, Maximize2, ShieldCheck, Code, Film, Clock, Music, VolumeX, Subtitles
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
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl animate-fade-in">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-surface-border px-4 py-3.5">
          <Search className="h-5 w-5 text-zinc-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tools, actions, or formats (e.g. compress, merge, webp)..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="rounded p-1 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="ml-2 hidden sm:inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredTools.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
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
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                      isSelected
                        ? 'bg-zinc-800/80 text-white'
                        : 'text-zinc-300 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                          isSelected
                            ? 'border-brand-500/40 bg-brand-500/10 text-brand-400'
                            : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-zinc-100">{tool.name}</span>
                          <span className="rounded bg-zinc-800 px-1.5 py-0.2 font-mono text-[10px] text-zinc-400">
                            {tool.categoryLabel}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-400">{tool.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {tool.badge && (
                        <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-medium text-brand-400 border border-brand-500/20">
                          {tool.badge}
                        </span>
                      )}
                      <span className="text-xs text-zinc-500 font-mono">↵</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between border-t border-surface-border bg-zinc-900/50 px-4 py-2 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-emerald-500 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            100% In-Browser Execution
          </span>
        </div>
      </div>
    </div>
  );
};
