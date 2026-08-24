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
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 rounded border border-[#2A2D33] bg-[#131418] p-4 shadow-2xl space-y-2.5"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#122D1F] border border-[#3FBE73]/30 text-[#3FBE73]">
          <ShieldCheck className="h-3.5 w-3.5" />
        </div>
        <h4 className="text-xs font-semibold text-[#ECEDEF]">
          Privacy & Runtime Preferences
        </h4>
      </div>

      <p className="text-[11px] text-[#8B8F98] leading-relaxed">
        NovaTools processes 100% of files in client-side memory. We use cookies and third-party advertising partners (such as Google AdSense) to support open infrastructure.
      </p>

      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={handleAccept}
          className="flex-1 py-1.5 px-3 bg-[#4F8CFF] hover:bg-[#3B79F0] text-white font-semibold text-xs rounded transition-colors"
        >
          Accept All
        </button>
        <button
          onClick={handleDecline}
          className="py-1.5 px-3 bg-[#1B1D22] hover:bg-[#22242B] text-[#8B8F98] hover:text-[#ECEDEF] font-medium text-xs rounded transition-colors border border-[#2A2D33]"
        >
          Essential Only
        </button>
      </div>
    </aside>
  );
};
