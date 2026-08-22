import React, { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { Search, Shield, Menu, X, FileText, Image as ImageIcon, Video, Code } from 'lucide-react';

export const Header: React.FC = () => {
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-surface-border/80 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <a href="/" className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 shadow-glow-sm transition-transform group-hover:scale-105">
                <div className="h-3.5 w-3.5 rounded bg-gradient-to-tr from-brand-500 to-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-semibold tracking-tight text-white">NovaTools</span>
                <span className="rounded bg-brand-500/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-brand-400 border border-brand-500/20">
                  WASM
                </span>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <a
                href="/#pdf-suite"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </a>
              <a
                href="/#image-suite"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </a>
              <a
                href="/#video-suite"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                <Video className="h-3.5 w-3.5" />
                Video & Audio
              </a>
              <a
                href="/#svg-suite"
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-100"
              >
                <Code className="h-3.5 w-3.5" />
                SVG
              </a>
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* 100% Client-Side Privacy Badge */}
            <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-400 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-mono text-[11px]">100% Client-Side</span>
            </div>

            {/* Quick Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-surface-border bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            >
              <Search className="h-3.5 w-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Search utilities...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 border border-zinc-700">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="border-b border-surface-border bg-surface px-4 py-3 md:hidden">
            <div className="flex flex-col gap-2">
              <a
                href="/#pdf-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <FileText className="h-4 w-4" /> PDF Suite
              </a>
              <a
                href="/#image-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <ImageIcon className="h-4 w-4" /> Image Suite
              </a>
              <a
                href="/#video-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <Video className="h-4 w-4" /> Video & Audio
              </a>
              <a
                href="/#svg-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                <Code className="h-4 w-4" /> SVG Suite
              </a>
              <div className="mt-2 pt-2 border-t border-surface-border flex items-center gap-2 text-xs text-emerald-400 font-mono">
                <Shield className="h-3.5 w-3.5" /> 100% Private (Zero Uploads)
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Quick Search Modal */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};
