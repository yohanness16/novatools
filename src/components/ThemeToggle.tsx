import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
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
    return <div className={`h-8 w-8 rounded-xl ${className}`} />;
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`nt-btn-secondary flex h-8 w-8 items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#FACC15] ${className}`}
      aria-label="Theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-[#FACC15]" />
      ) : (
        <Moon className="h-4 w-4 text-[#141413]" />
      )}
    </button>
  );
};
