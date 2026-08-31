import React from 'react';
import type { GenerationHistoryItem } from '../../../engines/ttsTypes';
import { History, Play, Download, Trash2, Clock, Volume2 } from 'lucide-react';

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
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Recent Takes ({items.length})
          </h4>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
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
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/30 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Left Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-base shrink-0">
                  {item.voiceFlag}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{item.voiceName}</span>
                    <span className="text-[10px] text-slate-500">• {item.duration.toFixed(1)}s</span>
                    <span className="text-[10px] text-slate-500">• {formatTimestamp(item.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 max-w-[280px] sm:max-w-md">
                    "{item.text}"
                  </p>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleDownload(e, item)}
                  title="Download WAV"
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer shadow-sm"
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
