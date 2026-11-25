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
  Layers,
  Workflow,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'PDF', href: '/pdf', icon: Layers },
  { label: 'Image', href: '/image', icon: ImageIcon },
  { label: 'Video', href: '/video', icon: Video },
  { label: 'Docs', href: '/document', icon: FileText },
  { label: 'Diagrams', href: '/diagram', icon: Workflow },
  { label: 'SVG', href: '/svg', icon: Code2 },
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
      setIsScrolled(window.scrollY > 8);
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
        className={`fixed top-0 left-0 right-0 z-50 h-14 transition-[background-color,border-color] duration-150 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-white/95 dark:bg-[#0B0C0F]/95 backdrop-blur-md border-b border-[var(--nt-border)]'
            : 'bg-[#FAFAFA]/90 dark:bg-[#0B0C0F]/90 backdrop-blur-sm border-b border-[var(--nt-border)]/70'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Brand */}
          <a
            href="/"
            className="flex items-center gap-2.5 shrink-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            aria-label="NovaTools"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#111214] dark:bg-[#2563EB] text-white">
              <Layers className="h-4 w-4 stroke-[2.2]" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#111214] dark:text-[#F3F4F6]">
              NovaTools
            </span>
          </a>

          {/* Suite Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Suites">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActiveRoute(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    active
                      ? 'bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]'
                      : 'text-[#4B5563] dark:text-[#9CA3AF] hover:text-[#111214] dark:hover:text-[#F3F4F6] hover:bg-[#F3F4F6] dark:hover:bg-[#1A1D24]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Search & Theme */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center justify-between gap-3 w-44 rounded-lg bg-white dark:bg-[#13151A] hover:bg-[#F8FAFC] dark:hover:bg-[#1A1D24] border border-[var(--nt-border)] px-3 py-1.5 text-xs text-[#6B7280] dark:text-[#9CA3AF] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              aria-label="Search tools"
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-[#4B5563] dark:text-[#9CA3AF]" />
                <span>Search</span>
              </span>
              <kbd className="font-mono text-[10px] text-[#6B7280] dark:text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#1A1D24] px-1.5 py-0.5 rounded border border-[var(--nt-border)]">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => setIsPaletteOpen(true)}
              className="sm:hidden nt-btn-secondary flex h-8 w-8 items-center justify-center"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            <ThemeToggle />

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden nt-btn-secondary flex h-8 w-8 items-center justify-center"
              aria-label="Menu"
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
            className="md:hidden fixed inset-x-0 top-14 border-b border-[var(--nt-border)] bg-white dark:bg-[#0B0C0F] px-4 py-4 shadow-lg"
          >
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActiveRoute(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-semibold ${
                      active
                        ? 'border-[#2563EB]/30 bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]'
                        : 'border-[var(--nt-border)] text-[#111214] dark:text-[#F3F4F6]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
};
