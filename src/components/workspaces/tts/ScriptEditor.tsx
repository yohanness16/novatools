import React, { useRef, useState } from 'react';
import { SAMPLE_SCRIPTS, type SampleScript } from '../../../engines/ttsExpressions';
import {
  Clipboard,
  Trash2,
  Sparkles,
  Clock,
  Type,
  ChevronDown,
} from 'lucide-react';

interface ScriptEditorProps {
  text: string;
  onChange: (text: string) => void;
  speed: number;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChange,
  speed,
  onGenerate,
  isGenerating,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const estSeconds = Math.max(1, Math.round((wordCount / (150 * (speed || 1))) * 60));

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChange(clipText);
      }
    } catch {
      // Fallback
    }
  };

  const handleSelectSample = (sample: SampleScript) => {
    onChange(sample.content);
    setShowSamplesMenu(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onGenerate && !isGenerating && text.trim()) {
        onGenerate();
      }
    }
  };

  return (
    <div className="relative nt-card overflow-visible flex flex-col">
      {/* Top Header of Editor Card */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--nt-border)] bg-[#EFE9DC]/70 dark:bg-[#191714] rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#454038] dark:text-[#CBC4B6]">
            Script / Prompt
          </span>
        </div>

        {/* Sample Scripts Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="nt-btn-secondary flex items-center gap-2 px-3 py-1.5 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
            <span>Sample scripts</span>
            <ChevronDown className="w-3 h-3 text-[#746D61]" />
          </button>

          {showSamplesMenu && (
            <div className="nt-window absolute right-0 mt-2 w-72 py-1.5 z-30 origin-top-right">
              <div className="px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#746D61] dark:text-[#938B7D] border-b border-[var(--nt-border)]">
                Choose a sample
              </div>
              {SAMPLE_SCRIPTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-[#FEF7D6] dark:hover:bg-[#FACC15]/10 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-extrabold text-[#141413] dark:text-[#FAF7F0]">{s.title}</span>
                  <span className="text-[11px] text-[#746D61] dark:text-[#938B7D] line-clamp-1">{s.content}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative p-5 sm:p-6 flex-1 min-h-[210px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing or paste your text here to generate lifelike speech..."
          rows={7}
          className="w-full h-full bg-transparent border-0 text-[#141413] dark:text-[#FAF7F0] placeholder:text-[#746D61] dark:placeholder:text-[#938B7D] focus:outline-none resize-y text-base sm:text-lg leading-relaxed font-sans"
        />
      </div>

      {/* Footer Status Bar with Word/Char Counts & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-[var(--nt-border)] bg-[#EFE9DC]/60 dark:bg-[#191714] rounded-b-2xl text-xs text-[#454038] dark:text-[#CBC4B6]">
        {/* Stats */}
        <div className="flex items-center gap-5 font-mono">
          <div className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-[#CA8A04] dark:text-[#FACC15]" />
            <span>
              <strong className="text-[#141413] dark:text-[#FAF7F0] font-extrabold">{charCount.toLocaleString()}</strong> chars
              <span className="text-[#746D61] dark:text-[#938B7D] ml-1">({wordCount} words)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#15803D] dark:text-[#4ADE80]" />
            <span>
              Est. <strong className="text-[#141413] dark:text-[#FAF7F0] font-extrabold">~{estSeconds}s</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons & Shortcut Hint */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePaste}
            className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          {text && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold hover:text-[#B91C1C]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 pl-2 text-[11px] text-[#746D61] dark:text-[#938B7D] border-l border-[var(--nt-border)]">
            <kbd className="nt-well px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0]">
              Ctrl
            </kbd>
            <span>+</span>
            <kbd className="nt-well px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#141413] dark:text-[#FAF7F0]">
              Enter
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
