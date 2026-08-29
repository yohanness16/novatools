import React, { useRef } from 'react';
import { HUMAN_EXPRESSIONS, PAUSE_PRESETS } from '../../../engines/ttsExpressions';
import { 
  FileText, 
  Sparkles, 
  Trash2, 
  Clipboard, 
  Clock, 
  Type, 
  Smile, 
  Sliders, 
  Flame 
} from 'lucide-react';

interface ScriptEditorProps {
  text: string;
  onChange: (text: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  enhanceExpressions: boolean;
  onToggleExpressions: (enhance: boolean) => void;
}

const SAMPLE_SCRIPTS = [
  {
    title: 'Natural Conversational',
    content: "Hey there! [ay] You won't believe what just happened today. [sigh] I tried to export the video three times, but ugh, the server crashed! [pause: 500ms] Fortunately, NovaTools runs 100% in the browser now. Whoa, isn't that cool?",
  },
  {
    title: 'Storyteller & Narrative',
    content: "The old library was quiet — save for the ticking of an antique grandfather clock. [sigh] Clara turned the parchment page, [cough] gazing upon coordinates long forgotten. 'We found it,' she whispered. [pause: 500ms] 'After all these years.'",
  },
  {
    title: 'Podcast Host Opener',
    content: "Welcome back to Tech Frontiers! [haha] Today, we are testing client-side AI text to speech with Kokoro-82M. [pause: 300ms] Hmm... zero latency, zero cloud costs, and studio fidelity right in your browser. Let's dive right in!",
  },
  {
    title: 'Dramatic Dialogue',
    content: "Wait, stop right there! [gasp] Did you hear that sound? [pause: 500ms] Phew... it was just the wind. Ugh, you really scared me for a second!",
  }
];

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  text,
  onChange,
  speed,
  onSpeedChange,
  enhanceExpressions,
  onToggleExpressions,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  // Estimated reading duration based on ~150 words per minute scaled by speed
  const estSeconds = Math.max(1, Math.round((wordCount / (150 * (speed || 1))) * 60));

  const insertTag = (tag: string) => {
    if (!textareaRef.current) {
      onChange(text + ' ' + tag);
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newText = text.substring(0, start) + ' ' + tag + ' ' + text.substring(end);
    onChange(newText);

    setTimeout(() => {
      el.focus();
      const nextPos = start + tag.length + 2;
      el.setSelectionRange(nextPos, nextPos);
    }, 0);
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChange(clipText);
      }
    } catch (e) {
      // Fallback
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
      {/* Header & Sample Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            Script & Speech Editor
          </h3>
          <p className="text-xs text-slate-400">
            Type or paste your text. Insert human expressions and pauses for ultra-realistic cadence.
          </p>
        </div>

        {/* Sample Templates Dropdown */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Samples:</span>
          {SAMPLE_SCRIPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(sample.content)}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-slate-300 transition-all"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Expression & Pause Toolbar */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-200">
              Human Expression & Breath Markers
            </span>
            <span className="text-[10px] text-slate-400">
              (Click to insert at cursor)
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={enhanceExpressions}
              onChange={(e) => onToggleExpressions(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-300">
              Auto-interpret "ugh", "sigh", "ay", "cough", etc.
            </span>
          </label>
        </div>

        {/* Expression Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {HUMAN_EXPRESSIONS.map((exp) => (
            <button
              key={exp.tag}
              type="button"
              onClick={() => insertTag(exp.tag)}
              title={exp.description}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800/90 hover:bg-indigo-600 hover:text-white border border-slate-700 text-slate-300 transition-all flex items-center gap-1"
            >
              <span>{exp.label}</span>
              <span className="text-[9px] text-slate-500 font-mono">{exp.tag}</span>
            </button>
          ))}

          {/* Pause Presets */}
          <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block" />

          {PAUSE_PRESETS.map((pause) => (
            <button
              key={pause.tag}
              type="button"
              onClick={() => insertTag(pause.tag)}
              className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-950/40 hover:bg-amber-600 hover:text-white border border-amber-800/40 text-amber-300 transition-all"
            >
              {pause.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your script here... Type natural conversational phrases with expressions like 'ugh', 'sigh', 'ay', or insert tag markers like [cough] and [pause: 500ms]."
          rows={6}
          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-y font-sans leading-relaxed"
        />

        {/* Quick Clear / Paste buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          {text && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Clear text"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-red-900/60 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-all text-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Footer Stats & Speed Slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-indigo-400" />
            <strong className="text-white">{wordCount}</strong> words ({charCount} chars)
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            Est. Duration: <strong className="text-white">~{estSeconds}s</strong>
          </span>
        </div>

        {/* Speed Adjustment */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            Speed: <strong className="text-indigo-400 font-mono">{speed.toFixed(2)}x</strong>
          </span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-24 sm:w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
