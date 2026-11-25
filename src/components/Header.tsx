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
} from 'lucide-react';

interface NavItem {
  label: string;
  shortLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'PDF Suite', shortLabel: 'PDF', href: '/pdf', icon: Layers },
  { label: 'Image Suite', shortLabel: 'Image', href: '/image', icon: ImageIcon },
  { label: 'Video & Audio', shortLabel: 'Video', href: '/video', icon: Video },
  { label: 'Document & AI', shortLabel: 'Docs', href: '/document', icon: FileText },
  { label: 'Diagrams', shortLabel: 'Diagrams', href: '/diagram', icon: Workflow },
  { label: 'SVG Tools', shortLabel: 'SVG', href: '/svg', icon: Code2 },
  { label: 'About', shortLabel: 'About', href: '/about', icon: Info },
];

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentPath(window.location.pathname);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActiveRoute = (href: string) => {
    if (!currentPath) return false;
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-[4.5rem] transition-[background-color,border-color,box-shadow] duration-200 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-[#F5F1E8]/92 dark:bg-[#141311]/92 backdrop-blur-xl border-b border-[var(--nt-border)] shadow-[0_4px_20px_-6px_rgba(20,20,19,0.12)]'
            : 'bg-[#F5F1E8]/75 dark:bg-[#141311]/75 backdrop-blur-md border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Desktop App Brand Mark */}
          <a
            href="/"
            className="flex items-center gap-2.5 group shrink-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
            aria-label="NovaTools Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#141413] text-[#FACC15] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_2px_0_#000000,0_4px_10px_rgba(20,20,19,0.18)] transition-transform duration-150 group-hover:-translate-y-0.5">
              <Layers className="h-4 w-4 stroke-[2.25]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#141413] dark:text-[#FAF7F0]">
                NovaTools
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#FEF7D6] dark:bg-[#FACC15]/15 border border-[#D9A700]/40 px-2 py-0.5 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FACC15]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#15803D] dark:bg-[#4ADE80]" />
                STUDIO
              </span>
            </div>
          </a>

          {/* Center Segmented Desktop Suite Switcher */}
          <nav
            className="hidden lg:flex items-center gap-1 rounded-xl bg-[#EAE3D4]/90 dark:bg-[#1F1D19] p-1 border border-[var(--nt-border)] shadow-[inset_0_1px_2px_rgba(20,20,19,0.07)]"
            aria-label="Main Navigation"
          >
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                    active
                      ? 'bg-white dark:bg-[#2B2722] text-[#141413] dark:text-[#FAF7F0] shadow-[0_1px_3px_rgba(20,20,19,0.12),0_1px_0_rgba(20,20,19,0.06)] border border-[var(--nt-border)]'
                      : 'text-[#454038] dark:text-[#CBC4B6] hover:text-[#141413] dark:hover:text-[#FAF7F0] hover:bg-white/60 dark:hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#CA8A04] dark:text-[#FACC15]' : 'opacity-70'}`} />
                  <span>{item.shortLabel}</span>
                </a>
              );
            })}
          </nav>

          {/* Right Action Cluster: Spotlight Search, Theme Toggle, Quick Launch */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Desktop Spotlight Search Trigger */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden md:flex items-center justify-between gap-3 w-48 lg:w-56 rounded-xl bg-white dark:bg-[#1F1D19] hover:bg-[#FFFDF7] dark:hover:bg-[#26231E] border border-[var(--nt-border)] px-3 py-2 text-xs text-[#746D61] dark:text-[#938B7D] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_2px_5px_-2px_rgba(20,20,19,0.08)] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              aria-label="Search tools with keyboard shortcut Command K"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="h-3.5 w-3.5 text-[#141413] dark:text-[#FACC15] shrink-0" />
                <span className="truncate font-medium">Find a tool...</span>
              </span>
              <kbd className="inline-flex items-center rounded-md bg-[#F5F1E8] dark:bg-[#141311] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0] border border-[var(--nt-border)] shrink-0">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="md:hidden nt-btn-secondary flex h-9 w-9 items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              aria-label="Open search palette"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Primary Yellow Desktop CTA */}
            <a
              href="/#services"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 text-xs nt-btn-yellow focus:outline-none focus:ring-2 focus:ring-[#141413]"
            >
              <span>All Tools</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden nt-btn-secondary flex h-9 w-9 items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FACC15]"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="lg:hidden fixed inset-x-0 top-[4.5rem] border-b border-[var(--nt-border)] bg-[#F5F1E8]/98 dark:bg-[#141311]/98 backdrop-blur-2xl px-4 py-5 shadow-2xl space-y-4 max-h-[calc(100dvh-4.5rem)] overflow-y-auto"
          >
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPaletteOpen(true);
              }}
              className="w-full flex items-center justify-between gap-2.5 rounded-xl bg-white dark:bg-[#1F1D19] border border-[var(--nt-border)] px-3.5 py-3 text-xs text-[#454038] dark:text-[#CBC4B6] shadow-card min-h-[44px]"
            >
              <div className="flex items-center gap-2.5 font-semibold">
                <Search className="h-4 w-4 text-[#141413] dark:text-[#FACC15]" />
                <span>Search all 30+ tools & formats...</span>
              </div>
              <kbd className="font-mono text-[10px] font-bold bg-[#EAE3D4] dark:bg-[#141311] px-2 py-0.5 rounded border border-[var(--nt-border)] text-[#141413] dark:text-[#FAF7F0]">
                ⌘K
              </kbd>
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`nt-card-interactive flex items-center gap-3 p-3 text-xs font-bold min-h-[44px] ${
                      active
                        ? 'border-[#141413] dark:border-[#FACC15] bg-[#FEF7D6] dark:bg-[#FACC15]/10'
                        : 'text-[#141413] dark:text-[#FAF7F0]'
                    }`}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141413] text-[#FACC15] shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>

            <div className="pt-2">
              <a
                href="/#services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 text-xs py-3 nt-btn-yellow min-h-[44px]"
              >
                <span>Browse Full Tool Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}
      </header>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};
