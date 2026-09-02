import React, { useState, useEffect, useRef } from 'react';
import { CommandPalette } from './CommandPalette';
import { ThemeToggle } from './ThemeToggle';
import { 
  Search, 
  Menu, 
  X, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Code2, 
  Info, 
  ArrowRight,
  Layers,
  Workflow,
  ShieldCheck
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'PDF Suite', href: '/pdf', icon: Layers },
  { label: 'Image Suite', href: '/image', icon: ImageIcon },
  { label: 'Video & Audio', href: '/video', icon: Video },
  { label: 'Document & AI', href: '/document', icon: FileText },
  { label: 'Diagrams', href: '/diagram', icon: Workflow },
  { label: 'SVG Tools', href: '/svg', icon: Code2 },
  { label: 'About', href: '/about', icon: Info },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Scroll listener for auto-hide & glassmorphism backdrop blur
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setIsScrolled(currentScrollY > 20);

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Global Command+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200 ease-out ${
          isVisible || isMobileMenuOpen || isPaletteOpen ? 'translate-y-0' : '-translate-y-full'
        } ${
          isScrolled || isMobileMenuOpen
            ? 'bg-[#ffffff]/90 dark:bg-[#16171a]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] shadow-sm'
            : 'bg-[#ffffff]/60 dark:bg-[#16171a]/60 backdrop-blur-sm border-b border-slate-200/60 dark:border-white/[0.04]'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-4 shrink-0">
            <a
              href="/"
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1 -m-1"
              aria-label="NovaTools Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm transition-transform duration-150 group-hover:scale-105">
                <Layers className="h-4 w-4 stroke-[2.2]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:opacity-90 transition-opacity duration-150">
                NovaTools
              </span>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-[#d1d5db] hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-md transition-colors duration-150"
                >
                  <Icon className="h-3.5 w-3.5 opacity-70" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Quick Search Trigger */}
          <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm justify-end">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="w-full flex items-center justify-between gap-2.5 rounded-lg bg-slate-100/90 dark:bg-[#121316] hover:bg-slate-200/90 dark:hover:bg-[#1a1b1f] border border-slate-200 dark:border-white/[0.08] px-3 py-1.5 text-xs text-slate-500 dark:text-[#9ca3af] transition-colors duration-150 shadow-inner group cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search tools with keyboard shortcut Command K"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="h-3.5 w-3.5 text-slate-400 dark:text-[#9ca3af] group-hover:text-slate-700 dark:group-hover:text-white transition-colors duration-150 shrink-0" />
                <span className="truncate group-hover:text-slate-700 dark:group-hover:text-white transition-colors duration-150">
                  Search tools & formats...
                </span>
              </div>
              <kbd className="inline-flex items-center rounded bg-white dark:bg-[#1e2025] px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:text-[#9ca3af] border border-slate-200 dark:border-white/[0.08] group-hover:text-slate-700 dark:group-hover:text-white transition-colors duration-150 shrink-0">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Actions: Theme Toggle & Call To Action (CTA) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-[#d1d5db] hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open search palette"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* CTA: Explore Tools */}
            <a
              href="/#services"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95"
            >
              <span>Explore</span>
              <ArrowRight className="h-3 w-3" />
            </a>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 dark:text-[#d1d5db] hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div 
            ref={mobileMenuRef}
            className="lg:hidden fixed inset-x-0 top-16 border-b border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#16171a]/95 backdrop-blur-2xl px-4 py-6 shadow-2xl space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            {/* Quick Search on Mobile */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPaletteOpen(true);
              }}
              className="w-full flex items-center justify-between gap-2.5 rounded-lg bg-slate-100 dark:bg-[#121316] border border-slate-200 dark:border-white/[0.08] px-3.5 py-2.5 text-xs text-slate-600 dark:text-[#d1d5db] min-h-[44px]"
            >
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Search all tools & formats...</span>
              </div>
              <kbd className="font-mono text-[10px] bg-white dark:bg-[#1e2025] px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-[#9ca3af]">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Nav Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06] p-3 text-xs font-semibold text-slate-800 dark:text-[#f9fafb] transition-colors duration-150 min-h-[44px]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            {/* Mobile Bottom CTA */}
            <div className="pt-2 border-t border-slate-200 dark:border-white/[0.08] flex flex-col gap-2">
              <a
                href="/#services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-center text-xs font-semibold py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-150 shadow-sm min-h-[44px]"
              >
                <span>Explore Full Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
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
