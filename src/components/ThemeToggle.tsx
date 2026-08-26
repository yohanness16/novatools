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
    return <div className={`h-9 w-9 rounded-lg ${className}`} />;
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-500 ${
        theme === 'dark'
          ? 'bg-white/[0.04] border-white/10 text-amber-300 hover:bg-white/[0.08] hover:text-amber-200'
          : 'bg-slate-100 border-slate-200/80 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
      } ${className}`}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle color theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-transform duration-200" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200" />
      )}
    </button>
  );
};
