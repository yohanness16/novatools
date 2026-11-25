import React from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceMixConfig } from '../../../engines/ttsTypes';
import { Blend } from 'lucide-react';

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
  const primary = BUILTIN_VOICES.find((v) => v.id === config.primaryVoice) || BUILTIN_VOICES[0];
  const secondary = BUILTIN_VOICES.find((v) => v.id === config.secondaryVoice) || BUILTIN_VOICES[1];

  const primaryPct = Math.round((1 - config.blendRatio) * 100);
  const secondaryPct = Math.round(config.blendRatio * 100);

  return (
    <div
      className={`nt-card p-5 sm:p-6 transition-all ${
        isEnabled ? 'border-[#141413] dark:border-[#FACC15] bg-[#FEF7D6]/45 dark:bg-[#FACC15]/10' : ''
      }`}
    >
      {/* Header with Switch */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl flex items-center justify-center transition-colors ${
              isEnabled
                ? 'bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15]'
                : 'nt-well text-[#454038] dark:text-[#CBC4B6]'
            }`}
          >
            <Blend className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-[#141413] dark:text-[#FAF7F0]">
            Voice Blend
          </span>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!isEnabled)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-[var(--nt-border-strong)] p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
            isEnabled ? 'bg-[#FACC15]' : 'bg-[#EAE3D4] dark:bg-[#141311]'
          }`}
          aria-pressed={isEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full shadow-sm transition duration-200 ease-in-out ${
              isEnabled
                ? 'translate-x-5 bg-white'
                : 'translate-x-0 bg-white dark:bg-[#6B7280]'
            }`}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-4 pt-5 mt-5 border-t border-[var(--nt-border)]">
          {/* Dual Voice Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="nt-well p-4 space-y-2">
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                Primary Voice ({primaryPct}%)
              </label>
              <select
                value={config.primaryVoice}
                onChange={(e) => onChange({ ...config, primaryVoice: e.target.value })}
                className="nt-input w-full px-3 py-2 text-xs sm:text-sm font-semibold"
              >
                {BUILTIN_VOICES.map((v) => (
                  <option key={`p_${v.id}`} value={v.id}>
                    {v.flag} {v.name} ({v.country})
                  </option>
                ))}
              </select>
            </div>

            <div className="nt-well p-4 space-y-2">
              <label className="block text-xs font-bold text-[#141413] dark:text-[#FAF7F0]">
                Secondary Voice ({secondaryPct}%)
              </label>
              <select
                value={config.secondaryVoice}
                onChange={(e) => onChange({ ...config, secondaryVoice: e.target.value })}
                className="nt-input w-full px-3 py-2 text-xs sm:text-sm font-semibold"
              >
                {BUILTIN_VOICES.map((v) => (
                  <option key={`s_${v.id}`} value={v.id}>
                    {v.flag} {v.name} ({v.country})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interpolation Slider */}
          <div className="nt-well p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-[#141413] dark:text-[#FAF7F0]">
              <span>
                {primary.name} ({primaryPct}%)
              </span>
              <span>
                {secondary.name} ({secondaryPct}%)
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={config.blendRatio}
              onChange={(e) => onChange({ ...config, blendRatio: parseFloat(e.target.value) })}
              className="w-full h-2 bg-white dark:bg-[#141311] rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
