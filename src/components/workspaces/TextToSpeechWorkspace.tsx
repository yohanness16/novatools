import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  TTSEngine, 
  BUILTIN_VOICES,
  cuesToSrt 
} from '../../engines/ttsEngine';
import type { 
  VoiceOption, 
  VoiceMixConfig, 
  SynthesizedAudioResult, 
  TTSProgress 
} from '../../engines/ttsTypes';
import { VoiceSelector } from './tts/VoiceSelector';
import { VoiceBlender } from './tts/VoiceBlender';
import { ScriptEditor } from './tts/ScriptEditor';
import { AudioPlayerCard } from './tts/AudioPlayerCard';
import { 
  Volume2, 
  Sparkles, 
  Zap, 
  Cpu, 
  ShieldCheck, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Play,
  Layers,
  HelpCircle,
  Activity,
  DownloadCloud,
  Check,
  Flame,
  Radio,
  Settings2,
  HardDrive
} from 'lucide-react';

export const TextToSpeechWorkspace: React.FC = () => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('af_heart');
  const [isBlenderEnabled, setIsBlenderEnabled] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<'wasm' | 'webgpu'>('wasm');
  const [activeEngineTag, setActiveEngineTag] = useState<string>('WASM (Universal)');
  const [voiceMix, setVoiceMix] = useState<VoiceMixConfig>({
    primaryVoice: 'af_heart',
    secondaryVoice: 'af_bella',
    blendRatio: 0.3,
  });

  const [scriptText, setScriptText] = useState<string>(
    "Hey there! [ay] Welcome to the all-new NovaTools AI Voice Studio. [pause: 300ms] " +
    "You can generate studio-quality, human-like voiceovers with natural expressions like 'ugh', 'sigh', 'cough', and 'whoa' — all running 100% privately in your browser! [sigh] Isn't that amazing?"
  );
  const [speed, setSpeed] = useState<number>(1.0);
  const [enhanceExpressions, setEnhanceExpressions] = useState<boolean>(true);

  const [progress, setProgress] = useState<TTSProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isPreloading, setIsPreloading] = useState<boolean>(false);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [audioResult, setAudioResult] = useState<SynthesizedAudioResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ttsEngineRef = useRef<TTSEngine | null>(null);

  // Initialize engine manager on mount
  useEffect(() => {
    const engine = new TTSEngine((p) => {
      setProgress(p);
      if (p.status === 'idle' && p.progress === 100) {
        setIsEngineReady(true);
        if (p.message.includes('WEBGPU')) {
          setActiveEngineTag('WebGPU Active');
        } else {
          setActiveEngineTag('WASM (Universal)');
        }
      }
    });
    ttsEngineRef.current = engine;

    // Trigger non-blocking warm-up in background
    engine.init('q8', deviceMode)
      .then(() => {
        setIsEngineReady(true);
        setActiveEngineTag(deviceMode === 'webgpu' ? 'WebGPU Active' : 'WASM (Universal)');
      })
      .catch((e) => console.warn('Background TTS warm-up notice:', e));

    return () => {
      ttsEngineRef.current?.terminate();
      ttsEngineRef.current = null;
    };
  }, [deviceMode]);

  const selectedVoice = useMemo(() => {
    return BUILTIN_VOICES.find(v => v.id === selectedVoiceId) || BUILTIN_VOICES[0];
  }, [selectedVoiceId]);

  const handlePreload = async () => {
    if (isPreloading) return;
    setIsPreloading(true);
    setErrorMsg(null);

    try {
      if (!ttsEngineRef.current) {
        ttsEngineRef.current = new TTSEngine((p) => setProgress(p));
      }
      await ttsEngineRef.current.init('q8', deviceMode);
      setIsEngineReady(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to initialize engine.');
    } finally {
      setIsPreloading(false);
    }
  };

  const handleSynthesize = async () => {
    if (!scriptText.trim()) return;

    setErrorMsg(null);
    setIsSynthesizing(true);

    try {
      if (!ttsEngineRef.current) {
        ttsEngineRef.current = new TTSEngine((p) => setProgress(p));
      }

      const activeVoice = isBlenderEnabled ? voiceMix.primaryVoice : selectedVoiceId;

      const result = await ttsEngineRef.current.synthesize({
        text: scriptText,
        voice: activeVoice,
        voiceMix: isBlenderEnabled ? voiceMix : undefined,
        speed,
        enhanceExpressions,
        device: deviceMode,
        dtype: 'q8',
      });

      setAudioResult(result);
      setIsEngineReady(true);
    } catch (err: any) {
      console.error('TTS Generation Error:', err);
      setErrorMsg(err?.message || 'Speech synthesis failed. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Studio Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Kokoro-82M High-Fidelity Neural Vocoder
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              AI Voice Studio & Humanic TTS
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Synthesize lifelike, studio-grade speech right in your browser. Features 24+ natural voices, 
              custom dual-voice blending, and realistic human expressions (<em>"ugh"</em>, <em>"sigh"</em>, <em>"cough"</em>, <em>"ay"</em>, <em>"whoa"</em>).
            </p>
          </div>

          {/* Engine Status & Backend Controls */}
          <div className="flex flex-col gap-3 bg-slate-950/85 p-4 rounded-2xl border border-slate-800 shrink-0 shadow-lg min-w-[280px]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${isEngineReady ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    {isEngineReady ? activeEngineTag : 'Engine Initializing...'}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    100% Local & Private (No API Key)
                  </div>
                </div>
              </div>

              {!isEngineReady && (
                <button
                  type="button"
                  onClick={handlePreload}
                  disabled={isPreloading}
                  className="px-3 py-1 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-[11px] font-semibold flex items-center justify-center gap-1 shadow transition-all cursor-pointer"
                >
                  {isPreloading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-3 h-3" />
                      <span>Preload Model</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Backend Device Mode Switcher */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Mode:
              </span>
              <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeviceMode('wasm')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                    deviceMode === 'wasm' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WASM (Universal CPU)
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('webgpu')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                    deviceMode === 'webgpu' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WebGPU
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Progress Bar */}
        {(progress.status === 'loading_model' || isSynthesizing) && (
          <div className="mt-6 pt-4 border-t border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {progress.message || (isSynthesizing ? 'Synthesizing audio samples...' : 'Loading neural weights...')}
              </span>
              <span className="font-mono text-indigo-300 font-bold">
                {progress.progress > 0 ? `${progress.progress}%` : 'Processing'}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(8, progress.progress)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 text-right">
              💡 Kokoro-82M weights (~86MB) are stored in your browser's Cache/IndexedDB for instant reuse.
            </p>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Studio Column: Script Editor + CTA + Player */}
        <div className="lg:col-span-7 space-y-6">
          <ScriptEditor
            text={scriptText}
            onChange={setScriptText}
            speed={speed}
            onSpeedChange={setSpeed}
            enhanceExpressions={enhanceExpressions}
            onToggleExpressions={setEnhanceExpressions}
          />

          {/* Primary Action Button */}
          <div>
            <button
              type="button"
              onClick={handleSynthesize}
              disabled={isSynthesizing || !scriptText.trim()}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide shadow-2xl flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isSynthesizing || !scriptText.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
                  <span>Synthesizing Speech ({progress.progress > 0 ? `${progress.progress}%` : 'Processing'}...)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Generate Speech Audio</span>
                </>
              )}
            </button>
          </div>

          {/* Error Notice Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs shadow-lg">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Synthesis Notice</strong>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Audio Waveform Player Output */}
          <AudioPlayerCard
            result={audioResult}
            voiceName={selectedVoice.name}
            voiceFlag={selectedVoice.flag}
          />
        </div>

        {/* Right Studio Column: Voices & Blender & Guide */}
        <div className="lg:col-span-5 space-y-6">
          <VoiceSelector
            selectedVoiceId={selectedVoiceId}
            onSelectVoice={(id) => setSelectedVoiceId(id)}
          />

          <VoiceBlender
            config={voiceMix}
            onChange={setVoiceMix}
            isEnabled={isBlenderEnabled}
            onToggle={setIsBlenderEnabled}
          />

          {/* Expression Quick Soundboard */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Human Expression Guide
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ugh]</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Frustration / Exasperation</p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[sigh]</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Deep breath release</p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[cough]</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Throat clearing pause</p>
              </div>
              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ay]</span>
                <p className="text-[11px] text-slate-400 mt-0.5">Upbeat exclamation</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              💡 Tip: You can also insert timing tags like <code className="text-indigo-300 font-mono">[pause: 500ms]</code> or commas to create natural breathing pauses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
