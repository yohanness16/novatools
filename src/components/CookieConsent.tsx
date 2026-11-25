import React, { useState, useEffect } from 'react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('novatools_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (value: string) => {
    localStorage.setItem('novatools_cookie_consent', value);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookies"
      className="fixed bottom-4 left-4 z-50 nt-window px-3.5 py-2.5 flex items-center gap-3"
    >
      <span className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">Cookies</span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => saveConsent('granted')}
          className="px-2.5 py-1 nt-btn-yellow text-[11px]"
        >
          Accept
        </button>
        <button
          onClick={() => saveConsent('essential_only')}
          className="px-2.5 py-1 nt-btn-secondary text-[11px] font-semibold"
        >
          Essential
        </button>
      </div>
    </aside>
  );
};
