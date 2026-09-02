import React, { useEffect, useState, useRef } from 'react';

export type AdSlotType = 'leaderboard' | 'sidebar' | 'in-feed' | 'mobile-anchor';

interface AdUnitProps {
  slotType: AdSlotType;
  slotId?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdUnit({ slotType = 'leaderboard', slotId = '5386318888', className = '' }: AdUnitProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const adPushedRef = useRef(false);

  // Initialize and push AdSense ad once mounted
  useEffect(() => {
    if (typeof window !== 'undefined' && !adPushedRef.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        adPushedRef.current = true;
      } catch (err) {
        console.debug('AdSense unit push pending site approval/live domain');
      }
    }
  }, []);

  if (isDismissed) return null;

  switch (slotType) {
    case 'leaderboard':
      return (
        <div
          ref={containerRef}
          className={`ad-slot-leaderboard max-w-5xl mx-auto my-6 px-4 flex flex-col justify-center items-center rounded-xl bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden relative ${className}`}
          style={{ minHeight: '90px', contain: 'layout size' }}
        >
          <div className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-mono text-slate-500 dark:text-[#9ca3af] uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.04]">
            <span>Advertisement</span>
            <span>Sponsored Display</span>
          </div>

          {/* Actual Google AdSense Responsive Display Unit */}
          <div className="w-full flex justify-center py-1">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', maxWidth: '728px', minHeight: '90px' }}
              data-ad-client="ca-pub-6768212179657827"
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      );

    case 'sidebar':
      return (
        <div
          ref={containerRef}
          className={`ad-slot-sidebar sticky top-6 bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 flex flex-col justify-between shadow-sm overflow-hidden ${className}`}
          style={{ minHeight: '600px', contain: 'layout size' }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06] text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-[#9ca3af]">
            <span>Sponsored Partner</span>
            <span className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-[9px]">
              Display Ad
            </span>
          </div>

          {/* Actual Google AdSense Responsive Display Unit */}
          <div className="my-auto flex justify-center py-2">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minWidth: '250px', minHeight: '250px' }}
              data-ad-client="ca-pub-6768212179657827"
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      );

    case 'in-feed':
      return (
        <div
          ref={containerRef}
          className={`ad-slot-in-feed bg-white dark:bg-[#1e2025] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 shadow-sm overflow-hidden ${className}`}
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-slate-500 dark:text-[#9ca3af] uppercase tracking-wider pb-2 mb-2 border-b border-slate-100 dark:border-white/[0.04]">
            <span>Sponsored Feed Content</span>
            <span>Advertisement</span>
          </div>
          <div className="w-full">
            <ins
              className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client="ca-pub-6768212179657827"
              data-ad-slot={slotId === '5386318888' ? '1208717370' : slotId}
              data-ad-format="fluid"
              data-ad-layout-key="-eb+6l-2v-aq+u1"
            />
          </div>
        </div>
      );

    case 'mobile-anchor':
      return (
        <div
          ref={containerRef}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#16171a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/[0.08] flex items-center justify-between px-4 h-[52px] shadow-2xl transition-transform"
          style={{ contain: 'layout size' }}
        >
          <div className="flex items-center space-x-2">
            <span className="text-[9px] uppercase font-mono font-bold bg-slate-100 dark:bg-white/[0.04] px-1.5 py-0.5 rounded text-slate-600 dark:text-[#9ca3af] border border-slate-200 dark:border-white/[0.08]">
              Ad
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[180px]">
              Sponsored Partner
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <ins
              className="adsbygoogle"
              style={{ display: 'inline-block', width: '320px', height: '50px' }}
              data-ad-client="ca-pub-6768212179657827"
              data-ad-slot={slotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            <button
              onClick={() => setIsDismissed(true)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm p-1 ml-1 cursor-pointer"
              aria-label="Close Ad"
            >
              ✕
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
