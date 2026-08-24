import React, { useEffect, useRef } from 'react';

export type AdSlotType = 'leaderboard' | 'rectangle' | 'large-rectangle' | 'mobile-banner' | 'in-feed';

interface AdSlotProps {
  type?: AdSlotType;
  adClient?: string;
  adSlot?: string;
  className?: string;
  label?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({
  type = 'rectangle',
  adClient = 'ca-pub-6768212179657827',
  adSlot,
  className = '',
  label = 'Sponsored'
}) => {
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      }
    } catch {
      // Ad blocker or script deferred
    }
  }, [adClient, adSlot]);

  const getDimensions = () => {
    switch (type) {
      case 'leaderboard':
        return 'w-full min-h-[90px] max-w-[728px]';
      case 'large-rectangle':
        return 'w-full min-h-[280px] max-w-[336px]';
      case 'rectangle':
        return 'w-full min-h-[250px] max-w-[300px]';
      case 'mobile-banner':
        return 'w-full min-h-[50px] max-w-[320px]';
      case 'in-feed':
        return 'w-full min-h-[120px] max-w-full';
      default:
        return 'w-full min-h-[250px] max-w-[300px]';
    }
  };

  return (
    <aside
      className={`relative mx-auto flex flex-col items-center justify-center overflow-hidden rounded border border-[#2A2D33] bg-[#131418] p-2 text-center ${getDimensions()} ${className}`}
      aria-label="Advertisement"
      role="complementary"
    >
      <span className="mb-1 text-[9px] font-mono font-medium tracking-widest text-[#5B606D] uppercase">
        {label}
      </span>

      <div ref={adRef} className="w-full flex items-center justify-center flex-1">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          data-ad-client={adClient}
          {...(adSlot ? { 'data-ad-slot': adSlot } : {})}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
};
