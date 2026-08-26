import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('novatools-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('novatools-theme', 'light');
    }
  };

  if (!mounted) {
    return <div className={`h-8 w-8 rounded-lg ${className}`} />;
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300 cursor-pointer ${
        theme === 'dark'
          ? 'bg-[#0A0F1D] border-white/10 text-amber-400 hover:border-amber-400/40 hover:bg-[#0D1426] shadow-sm'
          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle color theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
};
