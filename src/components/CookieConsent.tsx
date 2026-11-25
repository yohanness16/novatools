import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('novatools_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('novatools_cookie_consent', 'granted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('novatools_cookie_consent', 'essential_only');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and Privacy Preferences"
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 nt-window p-4 space-y-3"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#141413] text-[#FACC15]">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <h4 className="text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
          Privacy & Runtime Preferences
        </h4>
      </div>

      <p className="text-[11px] text-[#454038] dark:text-[#CBC4B6] leading-relaxed">
        NovaTools processes 100% of your files locally in browser memory. Cookies are used only to remember theme settings and support open advertising partners.
      </p>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={handleAccept}
          className="flex-1 py-2 px-3 nt-btn-yellow text-xs"
        >
          Accept All
        </button>
        <button
          onClick={handleDecline}
          className="py-2 px-3 nt-btn-secondary text-xs font-semibold"
        >
          Essential Only
        </button>
      </div>
    </aside>
  );
};
