import React, { useState, useEffect } from 'react';
import { CommandPalette } from './CommandPalette';
import { Search, Shield, Menu, X, FileText, Image as ImageIcon, Video, Code, Terminal, Cpu } from 'lucide-react';

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
      <header className="sticky top-0 z-40 w-full border-b border-[#2A2D33] bg-[#131418]">
        <div className="mx-auto flex h-13 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-2.5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2.5 text-left group">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1B1D22] border border-[#2A2D33] text-[#4F8CFF]">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-[#ECEDEF]">NovaTools</span>
                <span className="font-mono text-[10px] text-[#8B8F98] bg-[#1B1D22] px-1.5 py-0.5 rounded border border-[#2A2D33]">
                  WASM v2.0
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#2A2D33]">
              <a
                href="/#pdf-suite"
                className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-[#8B8F98] hover:text-[#ECEDEF] hover:bg-[#1B1D22] transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </a>
              <a
                href="/#image-suite"
                className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-[#8B8F98] hover:text-[#ECEDEF] hover:bg-[#1B1D22] transition-colors"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Image
              </a>
              <a
                href="/#video-suite"
                className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-[#8B8F98] hover:text-[#ECEDEF] hover:bg-[#1B1D22] transition-colors"
              >
                <Video className="h-3.5 w-3.5" />
                Video & Audio
              </a>
              <a
                href="/#svg-suite"
                className="flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium text-[#8B8F98] hover:text-[#ECEDEF] hover:bg-[#1B1D22] transition-colors"
              >
                <Code className="h-3.5 w-3.5" />
                SVG
              </a>
            </nav>
          </div>

          {/* Right Action Area */}
          <div className="flex items-center gap-3">
            {/* Privacy Ledger Strip */}
            <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-[#8B8F98] bg-[#1B1D22] px-2.5 py-1 rounded border border-[#2A2D33]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#3FBE73]" />
              <span>0 bytes uploaded</span>
              <span className="text-[#5B606D]">·</span>
              <span className="text-[#ECEDEF]">100% Local WASM</span>
            </div>

            {/* Quick Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="flex items-center gap-2 rounded bg-[#1B1D22] border border-[#2A2D33] px-3 py-1 text-xs text-[#8B8F98] hover:border-[#4F8CFF] hover:text-[#ECEDEF] transition-colors"
            >
              <Search className="h-3.5 w-3.5 text-[#8B8F98]" />
              <span className="hidden sm:inline">Search console...</span>
              <kbd className="hidden sm:inline-flex items-center rounded bg-[#131418] px-1.5 py-0.5 font-mono text-[10px] text-[#8B8F98] border border-[#2A2D33]">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded p-1.5 text-[#8B8F98] hover:bg-[#1B1D22] hover:text-[#ECEDEF] md:hidden border border-[#2A2D33]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="border-t border-[#2A2D33] bg-[#131418] px-4 py-3 md:hidden space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                href="/#pdf-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded bg-[#1B1D22] p-2 text-xs font-medium text-[#ECEDEF] border border-[#2A2D33]"
              >
                <FileText className="h-3.5 w-3.5 text-[#8B8F98]" />
                PDF Suite
              </a>
              <a
                href="/#image-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded bg-[#1B1D22] p-2 text-xs font-medium text-[#ECEDEF] border border-[#2A2D33]"
              >
                <ImageIcon className="h-3.5 w-3.5 text-[#8B8F98]" />
                Image Suite
              </a>
              <a
                href="/#video-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded bg-[#1B1D22] p-2 text-xs font-medium text-[#ECEDEF] border border-[#2A2D33]"
              >
                <Video className="h-3.5 w-3.5 text-[#8B8F98]" />
                Video & Audio
              </a>
              <a
                href="/#svg-suite"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded bg-[#1B1D22] p-2 text-xs font-medium text-[#ECEDEF] border border-[#2A2D33]"
              >
                <Code className="h-3.5 w-3.5 text-[#8B8F98]" />
                SVG Suite
              </a>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#2A2D33] font-mono text-[11px] text-[#8B8F98]">
              <span>Privacy Ledger</span>
              <span className="text-[#3FBE73]">100% Client-Side Active</span>
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};
