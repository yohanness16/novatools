import React, { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { Search, Menu, X, FileText, Image as ImageIcon, Video, Code, Cpu } from 'lucide-react';

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
      <header className="sticky top-0 z-40 w-full border-b border-[#1E293B]/70 bg-[#050811]/85 backdrop-blur-xl transition-all">
        <div className="w-full flex h-16 items-center justify-between px-4 sm:px-6 lg:px-10 gap-4">
          {/* Logo & Brand (Left) */}
          <div className="flex items-center shrink-0">
            <a href="/" className="flex items-center gap-3 text-left group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-blue-500/10 to-indigo-500/20 border border-cyan-500/30 text-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.2)] group-hover:border-[#38BDF8] group-hover:shadow-[0_0_22px_rgba(56,189,248,0.35)] transition-all">
                <Cpu className="h-5 w-5" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-white group-hover:text-[#38BDF8] transition-colors">
                NovaTools
              </span>
            </a>
          </div>

          {/* Quick Search Bar (Center) */}
          <div className="flex-1 max-w-lg hidden md:flex items-center justify-center mx-4">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="w-full flex items-center justify-between gap-3 rounded-lg bg-[#0A0F1D]/80 hover:bg-[#0D1426] border border-[#1E293B] hover:border-[#38BDF8]/60 px-3.5 py-2 text-xs text-[#94A3B8] transition-all shadow-inner group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-[#64748B] group-hover:text-[#38BDF8] transition-colors" />
                <span className="text-xs text-[#94A3B8] group-hover:text-[#F1F5F9] transition-colors">
                  Search tools, actions & formats...
                </span>
              </div>
              <kbd className="inline-flex items-center rounded bg-[#050811] px-2 py-0.5 font-mono text-[10px] text-[#64748B] border border-[#1E293B] group-hover:border-[#38BDF8]/40 group-hover:text-[#38BDF8] transition-colors">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Navigation Sections & Mobile Actions (Right) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1.5 sm:gap-2">
              <a
                href="/#pdf-suite"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#0D1426] border border-transparent hover:border-[#1E293B] transition-all"
              >
                <FileText className="h-4 w-4 text-[#38BDF8]/80" />
                <span>PDF</span>
              </a>
              <a
                href="/#image-suite"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#0D1426] border border-transparent hover:border-[#1E293B] transition-all"
              >
                <ImageIcon className="h-4 w-4 text-[#38BDF8]/80" />
                <span>Image</span>
              </a>
              <a
                href="/#video-suite"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#0D1426] border border-transparent hover:border-[#1E293B] transition-all"
              >
                <Video className="h-4 w-4 text-[#38BDF8]/80" />
                <span>Video & Audio</span>
              </a>
              <a
                href="/#svg-suite"
                className="flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#38BDF8] hover:bg-[#0D1426] border border-transparent hover:border-[#1E293B] transition-all"
              >
                <Code className="h-4 w-4 text-[#38BDF8]/80" />
                <span>SVG</span>
              </a>
            </nav>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="md:hidden rounded-lg p-2 text-[#94A3B8] hover:bg-[#0D1426] hover:text-white border border-[#1E293B] transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-[#94A3B8] hover:bg-[#0D1426] hover:text-white lg:hidden border border-[#1E293B] transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-[#1E293B] bg-[#050811]/95 backdrop-blur-xl px-4 py-4 lg:hidden space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="/#pdf-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-[#0A0F1D] p-2.5 text-xs font-medium text-[#F1F5F9] border border-[#1E293B] hover:border-[#38BDF8]/50 transition-colors"
              >
                <FileText className="h-4 w-4 text-[#38BDF8]" />
                PDF Suite
              </a>
              <a
                href="/#image-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-[#0A0F1D] p-2.5 text-xs font-medium text-[#F1F5F9] border border-[#1E293B] hover:border-[#38BDF8]/50 transition-colors"
              >
                <ImageIcon className="h-4 w-4 text-[#38BDF8]" />
                Image Suite
              </a>
              <a
                href="/#video-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-[#0A0F1D] p-2.5 text-xs font-medium text-[#F1F5F9] border border-[#1E293B] hover:border-[#38BDF8]/50 transition-colors"
              >
                <Video className="h-4 w-4 text-[#38BDF8]" />
                Video & Audio
              </a>
              <a
                href="/#svg-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2.5 rounded-lg bg-[#0A0F1D] p-2.5 text-xs font-medium text-[#F1F5F9] border border-[#1E293B] hover:border-[#38BDF8]/50 transition-colors"
              >
                <Code className="h-4 w-4 text-[#38BDF8]" />
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
