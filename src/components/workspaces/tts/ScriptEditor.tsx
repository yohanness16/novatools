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
  Flame,
  Volume2
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
    title: '💬 Conversational',
    content: "Hey there! [ay] You won't believe what just happened today. [sigh] I tried to export the video three times, but ugh, the server crashed! [pause: 500ms] Fortunately, NovaTools runs 100% in the browser now. Whoa, isn't that cool?",
  },
  {
    title: '📖 Storytelling',
    content: "The old library was quiet — save for the ticking of an antique grandfather clock. [sigh] Clara turned the parchment page, [cough] gazing upon coordinates long forgotten. 'We found it,' she whispered. [pause: 500ms] 'After all these years.'",
  },
  {
    title: '🎙️ Podcast Intro',
    content: "Welcome back to Tech Frontiers! [haha] Today, we are testing client-side AI text to speech with Kokoro-82M. [pause: 300ms] Hmm... zero latency, zero cloud costs, and studio fidelity right in your browser. Let's dive right in!",
  },
  {
    title: '🎭 Dramatic Scene',
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
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-6 sm:p-7 shadow-2xl space-y-6">
      {/* Header & Sample Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            Script & Speech Editor
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Write or paste your script below. Click expression chips to insert realistic human cues.
          </p>
        </div>

        {/* Preset Selector Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {SAMPLE_SCRIPTS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(sample.content)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700/80 text-slate-300 hover:text-white transition-all font-medium cursor-pointer shadow-sm"
            >
              {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Human Expressions Soundboard Toolbar */}
      <div className="bg-slate-950/90 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-400" />
            <span className="text-xs sm:text-sm font-bold text-white">
              Human Expression Soundboard
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (Click to insert at cursor position)
            </span>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-500/30">
            <input
              type="checkbox"
              checked={enhanceExpressions}
              onChange={(e) => onToggleExpressions(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-semibold text-indigo-200">
              Interpret words like "ugh", "sigh", "ay"
            </span>
          </label>
        </div>

        {/* Expression Chips with Generous Padding */}
        <div className="flex flex-wrap items-center gap-2">
          {HUMAN_EXPRESSIONS.map((exp) => (
            <button
              key={exp.tag}
              type="button"
              onClick={() => insertTag(exp.tag)}
              title={exp.description}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-700/90 text-slate-200 transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm hover:shadow-indigo-500/20"
            >
              <span className="text-base">{exp.icon}</span>
              <span>{exp.label}</span>
              <span className="text-[10px] text-slate-400 font-mono">{exp.tag}</span>
            </button>
          ))}

          {/* Pause Presets */}
          <div className="h-6 w-px bg-slate-700/80 mx-1 hidden sm:block" />

          {PAUSE_PRESETS.map((pause) => (
            <button
              key={pause.tag}
              type="button"
              onClick={() => insertTag(pause.tag)}
              className="text-xs font-semibold px-3 py-2 rounded-xl bg-amber-950/50 hover:bg-amber-600 hover:text-white border border-amber-800/60 text-amber-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
            >
              <span>⏱️</span>
              <span>{pause.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Text Area with Generous Padding */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your script here... Type natural conversational phrases with expressions like 'ugh', 'sigh', 'ay', or insert tag markers like [cough] and [pause: 500ms]."
          rows={7}
          className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-y font-sans leading-relaxed shadow-inner"
        />

        {/* Quick Clear / Paste buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handlePaste}
            title="Paste from clipboard"
            className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Paste</span>
          </button>
          {text && (
            <button
              type="button"
              onClick={() => onChange('')}
              title="Clear text"
              className="p-1.5 rounded-xl bg-slate-900/90 hover:bg-red-950/80 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-300 transition-all text-xs cursor-pointer shadow-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Footer Stats & Speed Slider with Ample Spacing */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs sm:text-sm text-slate-300">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2">
            <Type className="w-4 h-4 text-indigo-400" />
            <strong className="text-white font-bold">{wordCount}</strong> words ({charCount} chars)
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Est. Duration: <strong className="text-white font-bold">~{estSeconds}s</strong>
          </span>
        </div>

        {/* Speed Adjustment */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Sliders className="w-4 h-4 text-indigo-400" />
            Pacing: <strong className="text-indigo-400 font-mono font-bold">{speed.toFixed(2)}x</strong>
          </span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-28 sm:w-36 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};
