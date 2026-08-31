import React, { useRef, useState } from 'react';
import { SAMPLE_SCRIPTS, type SampleScript } from '../../../engines/ttsExpressions';
import { 
  Clipboard, 
  Trash2, 
  Sparkles, 
  Clock, 
  Type, 
  ChevronDown, 
  FileText,
  Check
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
  const [copiedNotification, setCopiedNotification] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  // Standard human speech rate: ~150 words per minute
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
    <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col transition-all">
      
      {/* Top Header of Editor Card */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Script / Prompt
          </span>
        </div>

        {/* Sample Scripts Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-sm hover:text-white"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sample scripts</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSamplesMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Choose a sample
              </div>
              {SAMPLE_SCRIPTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSample(s)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-indigo-600/20 hover:text-white text-slate-300 text-xs transition-colors flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-bold text-white">{s.title}</span>
                  <span className="text-[11px] text-slate-400 line-clamp-1">{s.content}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative p-6 flex-1 min-h-[220px]">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Start typing or paste your text here to generate lifelike speech..."
          rows={8}
          className="w-full h-full bg-transparent border-0 text-slate-100 placeholder-slate-500 focus:outline-none resize-y text-base sm:text-lg leading-relaxed font-sans"
        />
      </div>

      {/* Footer Status Bar with Word/Char Counts & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-slate-800/80 bg-slate-950/60 text-xs text-slate-400">
        
        {/* Stats */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              <strong className="text-white font-bold">{charCount.toLocaleString()}</strong> characters
              <span className="text-slate-500 ml-1">({wordCount} words)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Est. <strong className="text-white font-bold">~{estSeconds}s</strong>
            </span>
          </div>
        </div>

        {/* Action Buttons & Shortcut Hint */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePaste}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm text-xs font-medium"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Paste</span>
          </button>

          {text && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950/80 hover:text-red-300 hover:border-red-500/40 border border-transparent text-slate-400 transition-all cursor-pointer shadow-sm text-xs font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-1 pl-2 text-[11px] text-slate-500 border-l border-slate-800">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">Enter</kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
