import React from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceMixConfig } from '../../../engines/ttsTypes';
import { Sparkles, Sliders, Blend } from 'lucide-react';

interface VoiceBlenderProps {
  config: VoiceMixConfig;
  onChange: (config: VoiceMixConfig) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export const VoiceBlender: React.FC<VoiceBlenderProps> = ({
  config,
  onChange,
  isEnabled,
  onToggle,
}) => {
  const primary = BUILTIN_VOICES.find(v => v.id === config.primaryVoice) || BUILTIN_VOICES[0];
  const secondary = BUILTIN_VOICES.find(v => v.id === config.secondaryVoice) || BUILTIN_VOICES[1];

  const primaryPct = Math.round((1 - config.blendRatio) * 100);
  const secondaryPct = Math.round(config.blendRatio * 100);

  return (
    <div className={`rounded-3xl border transition-all p-6 sm:p-7 shadow-xl ${
      isEnabled 
        ? 'bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-slate-900/80 border-purple-500/50 shadow-purple-500/10' 
        : 'bg-slate-900/80 border-slate-800/90'
    }`}>
      {/* Header with Switch */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${isEnabled ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}>
            <Blend className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">Dual-Voice Blender</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Custom Timbre
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Interpolate between two distinct neural voice styles to craft unique human timbres
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-purple-600' : 'bg-slate-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-5 pt-5 mt-5 border-t border-purple-500/20">
          {/* Dual Voice Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Voice */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-indigo-300">
                Primary Voice ({primaryPct}%)
              </label>
              <select
                value={config.primaryVoice}
                onChange={(e) => onChange({ ...config, primaryVoice: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {BUILTIN_VOICES.map((v) => (
                  <option key={`p_${v.id}`} value={v.id}>
                    {v.flag} {v.name} ({v.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Voice */}
            <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="block text-xs font-bold text-purple-300">
                Secondary Voice ({secondaryPct}%)
              </label>
              <select
                value={config.secondaryVoice}
                onChange={(e) => onChange({ ...config, secondaryVoice: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
              >
                {BUILTIN_VOICES.map((v) => (
                  <option key={`s_${v.id}`} value={v.id}>
                    {v.flag} {v.name} ({v.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interpolation Slider with Visual Ratio Gauge */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="text-indigo-400">{primary.name} ({primaryPct}%)</span>
              <span className="text-purple-400">{secondary.name} ({secondaryPct}%)</span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.blendRatio}
              onChange={(e) => onChange({ ...config, blendRatio: parseFloat(e.target.value) })}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
