import React from 'react';
import { BUILTIN_VOICES } from '../../../engines/ttsEngine';
import type { VoiceMixConfig, VoiceSettings } from '../../../engines/ttsTypes';
import { Sliders, X, Sparkles, Blend, RotateCcw, Cpu, Zap, Info } from 'lucide-react';

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

  const primaryVoiceObj = BUILTIN_VOICES.find(v => v.id === settings.blendConfig.primaryVoice) || BUILTIN_VOICES[0];
  const secondaryVoiceObj = BUILTIN_VOICES.find(v => v.id === settings.blendConfig.secondaryVoice) || BUILTIN_VOICES[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden text-slate-100 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Voice Settings</h3>
              <p className="text-xs text-slate-400">Adjust pacing, expression, and neural styling</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Speed / Pacing */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">Speaking Speed</span>
              <span className="font-mono text-indigo-400 font-bold">{settings.speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.75"
              step="0.05"
              value={settings.speed}
              onChange={(e) => onChange({ ...settings, speed: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Slower (0.6x)</span>
              <span>Default (1.0x)</span>
              <span>Faster (1.75x)</span>
            </div>
          </div>

          {/* Stability / Expressiveness */}
          <div className="space-y-2.5 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200">Expressiveness & Stability</span>
              <span className="font-mono text-indigo-400 font-bold">
                {settings.stability < 0.4 ? 'Dynamic / Expressive' : settings.stability > 0.6 ? 'Stable / Uniform' : 'Balanced'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={settings.stability}
              onChange={(e) => onChange({ ...settings, stability: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>More Emotive</span>
              <span>Natural Balanced</span>
              <span>More Consistent</span>
            </div>
          </div>

          {/* Dual-Voice Blender */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Blend className="w-4 h-4 text-purple-400" />
                <span className="text-xs sm:text-sm font-bold text-white">Dual-Voice Blending</span>
              </div>
              <button
                type="button"
                onClick={() => onChange({ ...settings, blendEnabled: !settings.blendEnabled })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.blendEnabled ? 'bg-purple-600' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    settings.blendEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.blendEnabled && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-purple-500/30 space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Primary Voice</label>
                    <select
                      value={settings.blendConfig.primaryVoice}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          blendConfig: { ...settings.blendConfig, primaryVoice: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      {BUILTIN_VOICES.map((v) => (
                        <option key={`p_${v.id}`} value={v.id}>
                          {v.flag} {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Secondary Voice</label>
                    <select
                      value={settings.blendConfig.secondaryVoice}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          blendConfig: { ...settings.blendConfig, secondaryVoice: e.target.value },
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
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
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{primaryVoiceObj.name} ({Math.round((1 - settings.blendConfig.blendRatio) * 100)}%)</span>
                    <span>{secondaryVoiceObj.name} ({Math.round(settings.blendConfig.blendRatio * 100)}%)</span>
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
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Hardware Acceleration Mode */}
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-200 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Hardware Acceleration
              </span>
              <span className="text-[11px] font-mono text-emerald-400 capitalize">
                Active: {activeDevice.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onDeviceChange('auto')}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'auto' || deviceMode === 'webgpu'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Auto (WebGPU Fast)
              </button>
              <button
                type="button"
                onClick={() => onDeviceChange('wasm')}
                className={`py-1.5 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  deviceMode === 'wasm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                WASM (Universal)
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
