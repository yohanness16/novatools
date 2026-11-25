import React from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceSettings } from '../../../engines/ttsTypes';
import { Sliders, X, Blend, RotateCcw, Cpu } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
  deviceMode: 'auto' | 'webgpu' | 'wasm';
  onDeviceChange: (device: 'auto' | 'webgpu' | 'wasm') => void;
  activeDevice: string;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onChange,
  deviceMode,
  onDeviceChange,
  activeDevice,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    onChange({
      stability: 0.5,
      speed: 1.0,
      blendEnabled: false,
      blendConfig: {
        primaryVoice: 'af_heart',
        secondaryVoice: 'af_bella',
        blendRatio: 0.3,
      },
    });
  };

  const primaryVoiceObj =
    BUILTIN_VOICES.find((v) => v.id === settings.blendConfig.primaryVoice) || BUILTIN_VOICES[0];
  const secondaryVoiceObj =
    BUILTIN_VOICES.find((v) => v.id === settings.blendConfig.secondaryVoice) || BUILTIN_VOICES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#141413]/55 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="nt-window relative w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nt-border)] bg-[#EFE9DC]/70 dark:bg-[#191714]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141413] text-[#FACC15] flex items-center justify-center shadow-card">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                Voice Settings
              </h3>
              <p className="text-xs font-mono text-[#746D61] dark:text-[#938B7D]">
                Adjust pacing, expression, and neural styling
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="nt-btn-secondary p-2"
            aria-label="Close voice settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Speed / Pacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#141413] dark:text-[#FAF7F0]">Speaking Speed</span>
              <span className="nt-badge-yellow px-2 py-0.5 font-mono">{settings.speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.75"
              step="0.05"
              value={settings.speed}
              onChange={(e) => onChange({ ...settings, speed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#EAE3D4] dark:bg-[#141311] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[10px] text-[#746D61] dark:text-[#938B7D]">
              <span>Slower (0.6x)</span>
              <span>Default (1.0x)</span>
              <span>Faster (1.75x)</span>
            </div>
          </div>

          {/* Stability / Expressiveness */}
          <div className="space-y-2 pt-4 border-t border-[var(--nt-border)]">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#141413] dark:text-[#FAF7F0]">Expressiveness &amp; Stability</span>
              <span className="nt-badge-yellow px-2 py-0.5 font-mono">
                {settings.stability < 0.4
                  ? 'Dynamic / Expressive'
                  : settings.stability > 0.6
                  ? 'Stable / Uniform'
                  : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.stability}
              onChange={(e) => onChange({ ...settings, stability: parseFloat(e.target.value) })}
              className="w-full h-2 bg-[#EAE3D4] dark:bg-[#141311] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between font-mono text-[10px] text-[#746D61] dark:text-[#938B7D]">
              <span>More Emotive</span>
              <span>Natural Balanced</span>
              <span>More Consistent</span>
            </div>
          </div>

          {/* Dual-Voice Blender */}
          <div className="space-y-4 pt-4 border-t border-[var(--nt-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Blend className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" />
                <span className="text-xs sm:text-sm font-extrabold text-[#141413] dark:text-[#FAF7F0]">
                  Dual-Voice Blending
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...settings, blendEnabled: !settings.blendEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[var(--nt-border-strong)] p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.blendEnabled ? 'bg-[#141413] dark:bg-[#FACC15]' : 'bg-[#EAE3D4] dark:bg-[#141311]'
                }`}
                aria-pressed={settings.blendEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full shadow-sm transition duration-200 ease-in-out ${
                    settings.blendEnabled
                      ? 'translate-x-5 bg-[#FACC15] dark:bg-[#141413]'
                      : 'translate-x-0 bg-white dark:bg-[#454038]'
                  }`}
                />
              </button>
            </div>

            {settings.blendEnabled && (
              <div className="nt-well p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#454038] dark:text-[#CBC4B6] mb-1">
                      Primary Voice
                    </label>
                    <select
                      value={settings.blendConfig.primaryVoice}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          blendConfig: { ...settings.blendConfig, primaryVoice: e.target.value },
                        })
                      }
                      className="nt-input w-full px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      {BUILTIN_VOICES.map((v) => (
                        <option key={`p_${v.id}`} value={v.id}>
                          {v.flag} {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#454038] dark:text-[#CBC4B6] mb-1">
                      Secondary Voice
                    </label>
                    <select
                      value={settings.blendConfig.secondaryVoice}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          blendConfig: { ...settings.blendConfig, secondaryVoice: e.target.value },
                        })
                      }
                      className="nt-input w-full px-2.5 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      {BUILTIN_VOICES.map((v) => (
                        <option key={`s_${v.id}`} value={v.id}>
                          {v.flag} {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono text-[11px] font-bold text-[#141413] dark:text-[#FAF7F0]">
                    <span>
                      {primaryVoiceObj.name} ({Math.round((1 - settings.blendConfig.blendRatio) * 100)}%)
                    </span>
                    <span>
                      {secondaryVoiceObj.name} ({Math.round(settings.blendConfig.blendRatio * 100)}%)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.blendConfig.blendRatio}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        blendConfig: { ...settings.blendConfig, blendRatio: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full h-2 bg-white dark:bg-[#141311] rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hardware Acceleration Mode */}
          <div className="space-y-2.5 pt-4 border-t border-[var(--nt-border)]">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-[#141413] dark:text-[#FAF7F0] flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" />
                Hardware Acceleration
              </span>
              <span className="nt-badge-success px-2 py-0.5 text-[10px] font-mono">
                Active: {activeDevice.toUpperCase()}
              </span>
            </div>
            <div className="nt-well grid grid-cols-2 gap-1.5 p-1">
              <button
                type="button"
                onClick={() => onDeviceChange('auto')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'auto' || deviceMode === 'webgpu'
                    ? 'bg-[#141413] text-[#FACC15]'
                    : 'text-[#746D61] dark:text-[#938B7D] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                Auto (WebGPU Fast)
              </button>
              <button
                type="button"
                onClick={() => onDeviceChange('wasm')}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'wasm'
                    ? 'bg-[#141413] text-[#FACC15]'
                    : 'text-[#746D61] dark:text-[#938B7D] hover:text-[#141413] dark:hover:text-[#FAF7F0]'
                }`}
              >
                CPU (Universal)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--nt-border)] bg-[#EFE9DC]/70 dark:bg-[#191714] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="nt-btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to defaults</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="nt-btn-yellow px-5 py-2 text-xs"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
