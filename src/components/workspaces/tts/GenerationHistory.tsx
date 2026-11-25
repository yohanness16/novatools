import React from 'react';
import type { GenerationHistoryItem } from '../../../engines/ttsTypes';
import { History, Download, Trash2 } from 'lucide-react';

interface GenerationHistoryProps {
  items: GenerationHistoryItem[];
  onSelect: (item: GenerationHistoryItem) => void;
  onClear: () => void;
  selectedId?: string;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  items,
  onSelect,
  onClear,
  selectedId,
}) => {
  if (items.length === 0) return null;

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDownload = (e: React.MouseEvent, item: GenerationHistoryItem) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = item.url;
    a.download = `${item.voiceName.toLowerCase()}-take-${item.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="nt-card p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--nt-border)] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF6FF] dark:bg-[#3B82F6]/15 text-[#2563EB] dark:text-[#60A5FA]">
            <History className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-extrabold text-[#111214] dark:text-[#F3F4F6] uppercase tracking-wider">
            Recent Takes
          </h4>
          <span className="nt-badge-yellow px-2 py-0.5 font-mono text-[10px] font-bold">
            {items.length}
          </span>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="nt-btn-secondary flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold hover:text-[#B91C1C]"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear History</span>
        </button>
      </div>

      {/* Takes List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
        {items.map((item) => {
          const isCurrent = item.id === selectedId;
          return (
            <div
              key={item.id}
              onClick={() => onSelect(item)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-[#FEF7D6]/85 dark:bg-[#2563EB]/10 border-[#2563EB] ring-1 ring-[#FACC15]/40 shadow-sm'
                  : 'nt-subcard hover:border-[var(--nt-border-strong)]'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="nt-well w-9 h-9 flex items-center justify-center text-base shrink-0">
                  {item.voiceFlag}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-xs font-extrabold font-sans text-[#111214] dark:text-[#F3F4F6]">
                      {item.voiceName}
                    </span>
                    <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                      · {item.duration.toFixed(1)}s
                    </span>
                    <span className="text-[10px] text-[#6B7280] dark:text-[#9CA3AF]">
                      · {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563] dark:text-[#D1D5DB] truncate mt-0.5 max-w-[280px] sm:max-w-md">
                    &quot;{item.text}&quot;
                  </p>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, item)}
                  title="Download WAV"
                  className="nt-btn-secondary p-2"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
