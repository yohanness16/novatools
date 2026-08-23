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
      className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 rounded-2xl border border-surface-border bg-surface/95 backdrop-blur-xl p-5 shadow-2xl space-y-3"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold text-zinc-100">
          Privacy & Ad Preferences
        </h4>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        We use cookies and third-party advertising partners (such as Google AdSense) to keep NovaTools free and support 100% client-side privacy tooling.
      </p>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleAccept}
          className="flex-1 py-2 px-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs rounded-xl transition-all active:scale-95"
        >
          Accept All
        </button>
        <button
          onClick={handleDecline}
          className="py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs rounded-xl transition-all border border-zinc-700"
        >
          Essential Only
        </button>
      </div>
    </aside>
  );
};
