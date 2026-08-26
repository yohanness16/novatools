import React, { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { ThemeToggle } from './ThemeToggle';
import { Search, Menu, X, FileText, Image as ImageIcon, Video, Code } from 'lucide-react';

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
      <header className="sticky top-0 z-40 w-full bg-white/75 dark:bg-transparent backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] transition-all">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10 gap-4">
          {/* Brand Name Only (Left) */}
          <div className="flex items-center shrink-0">
            <a href="/" className="flex items-center text-left group">
              <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-[#38BDF8] transition-colors">
                NovaTools
              </span>
            </a>
          </div>

          {/* Quick Search Bar (Center) */}
          <div className="flex-1 max-w-lg hidden md:flex items-center justify-center mx-4">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="w-full flex items-center justify-between gap-3 rounded-lg bg-slate-100 dark:bg-[#0A0F1D]/60 hover:bg-slate-200/80 dark:hover:bg-[#0D1426]/80 border border-slate-200 dark:border-white/10 hover:border-sky-500/50 dark:hover:border-[#38BDF8]/60 px-3.5 py-2 text-xs text-slate-600 dark:text-[#94A3B8] transition-all shadow-inner group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-slate-400 dark:text-[#64748B] group-hover:text-sky-600 dark:group-hover:text-[#38BDF8] transition-colors" />
                <span className="text-xs text-slate-600 dark:text-[#94A3B8] group-hover:text-slate-900 dark:group-hover:text-[#F1F5F9] transition-colors">
                  Search tools, actions & formats...
                </span>
              </div>
              <kbd className="inline-flex items-center rounded bg-white dark:bg-[#050811]/80 px-2 py-0.5 font-mono text-[10px] text-slate-500 dark:text-[#64748B] border border-slate-200 dark:border-white/10 group-hover:border-sky-500/40 dark:group-hover:border-[#38BDF8]/40 group-hover:text-sky-600 dark:group-hover:text-[#38BDF8] transition-colors">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Sections & Mobile Actions (Right) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2">
              <a
                href="/pdf"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-[#94A3B8] hover:text-sky-600 dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#0D1426]/60 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
              >
                <FileText className="h-4 w-4 text-sky-500/80 dark:text-[#38BDF8]/80" />
                <span>PDF</span>
              </a>
              <a
                href="/image"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-[#94A3B8] hover:text-sky-600 dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#0D1426]/60 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
              >
                <ImageIcon className="h-4 w-4 text-sky-500/80 dark:text-[#38BDF8]/80" />
                <span>Image</span>
              </a>
              <a
                href="/video"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-[#94A3B8] hover:text-sky-600 dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#0D1426]/60 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
              >
                <Video className="h-4 w-4 text-sky-500/80 dark:text-[#38BDF8]/80" />
                <span>Video & Audio</span>
              </a>
              <a
                href="/svg"
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-[#94A3B8] hover:text-sky-600 dark:hover:text-[#38BDF8] hover:bg-slate-100 dark:hover:bg-[#0D1426]/60 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
              >
                <Code className="h-4 w-4 text-sky-500/80 dark:text-[#38BDF8]/80" />
                <span>SVG</span>
              </a>
            </nav>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="md:hidden rounded-lg p-2 text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#0D1426]/80 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-[#0D1426]/80 hover:text-slate-900 dark:hover:text-white lg:hidden border border-slate-200 dark:border-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-slate-200 dark:border-[#1E293B] bg-white/95 dark:bg-[#050811]/95 backdrop-blur-xl px-4 py-4 lg:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="/pdf"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-slate-100 dark:bg-[#0A0F1D] p-2.5 text-xs font-medium text-slate-800 dark:text-[#F1F5F9] border border-slate-200 dark:border-[#1E293B] hover:border-sky-500/50 dark:hover:border-[#38BDF8]/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-sky-500 dark:text-[#38BDF8]" />
                PDF Suite
              </a>
              <a
                href="/image"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-slate-100 dark:bg-[#0A0F1D] p-2.5 text-xs font-medium text-slate-800 dark:text-[#F1F5F9] border border-slate-200 dark:border-[#1E293B] hover:border-sky-500/50 dark:hover:border-[#38BDF8]/50 transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-sky-500 dark:text-[#38BDF8]" />
                Image Suite
              </a>
              <a
                href="/video"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-slate-100 dark:bg-[#0A0F1D] p-2.5 text-xs font-medium text-slate-800 dark:text-[#F1F5F9] border border-slate-200 dark:border-[#1E293B] hover:border-sky-500/50 dark:hover:border-[#38BDF8]/50 transition-colors"
              >
                <Video className="h-4 w-4 text-sky-500 dark:text-[#38BDF8]" />
                Video & Audio
              </a>
              <a
                href="/svg"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-slate-100 dark:bg-[#0A0F1D] p-2.5 text-xs font-medium text-slate-800 dark:text-[#F1F5F9] border border-slate-200 dark:border-[#1E293B] hover:border-sky-500/50 dark:hover:border-[#38BDF8]/50 transition-colors"
              >
                <Code className="h-4 w-4 text-sky-500 dark:text-[#38BDF8]" />
                SVG Suite
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};
