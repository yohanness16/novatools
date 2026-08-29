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
    <div className={`rounded-2xl border transition-all p-4 ${
      isEnabled 
        ? 'bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/60 border-purple-500/40 shadow-lg shadow-purple-500/5' 
        : 'bg-slate-900/40 border-slate-800/80 opacity-90'
    }`}>
      {/* Header with Switch */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isEnabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
            <Blend className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white">Dual-Voice Blender</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                Custom Timbre
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interpolate between two distinct neural voice styles to craft unique human timbres
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-purple-600' : 'bg-slate-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-4 pt-2 border-t border-purple-500/20">
          {/* Dual Voice Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Primary Voice */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Primary Voice ({primaryPct}%)
              </label>
              <select
                value={config.primaryVoice}
                onChange={(e) => onChange({ ...config, primaryVoice: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {BUILTIN_VOICES.map((v) => (
                  <option key={`p_${v.id}`} value={v.id}>
                    {v.flag} {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Voice */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Secondary Voice ({secondaryPct}%)
              </label>
              <select
                value={config.secondaryVoice}
                onChange={(e) => onChange({ ...config, secondaryVoice: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {BUILTIN_VOICES.map((v) => (
                  <option key={`s_${v.id}`} value={v.id}>
                    {v.flag} {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interpolation Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-300">
              <span>{primary.name} ({primaryPct}%)</span>
              <span className="text-purple-400 font-semibold">Interpolation Ratio</span>
              <span>{secondary.name} ({secondaryPct}%)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.blendRatio}
              onChange={(e) => onChange({ ...config, blendRatio: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
