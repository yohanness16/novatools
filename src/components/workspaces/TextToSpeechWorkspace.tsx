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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Studio Header Banner with Generous Padding */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-950 border border-indigo-500/30 p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Kokoro-82M High-Fidelity Neural Vocoder
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              AI Voice Studio & Humanic TTS
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Synthesize lifelike, studio-grade speech right in your browser. Features 24+ natural voices, 
              custom dual-voice blending, and realistic human expressions (<em>"ugh"</em>, <em>"sigh"</em>, <em>"cough"</em>, <em>"ay"</em>, <em>"whoa"</em>).
            </p>
          </div>

          {/* Engine Status & Backend Controls Card */}
          <div className="flex flex-col gap-4 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 shrink-0 shadow-2xl min-w-[300px]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3.5 h-3.5 rounded-full ${isEngineReady ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    {isEngineReady ? activeEngineTag : 'Engine Initializing...'}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    100% Client-Side Privacy
                  </div>
                </div>
              </div>

              {!isEngineReady && (
                <button
                  type="button"
                  onClick={handlePreload}
                  disabled={isPreloading}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  {isPreloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <DownloadCloud className="w-3.5 h-3.5" />
                      <span>Preload Model</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Backend Device Mode Switcher */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Backend:
              </span>
              <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeviceMode('wasm')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    deviceMode === 'wasm' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WASM (Universal CPU)
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('webgpu')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    deviceMode === 'webgpu' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  WebGPU
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Live Progress Bar with Clear Metrics */}
        {(progress.status === 'loading_model' || isSynthesizing) && (
          <div className="mt-8 pt-6 border-t border-indigo-500/20 space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm text-slate-200 font-semibold">
              <span className="flex items-center gap-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                {progress.message || (isSynthesizing ? 'Synthesizing audio samples...' : 'Loading neural weights...')}
              </span>
              <span className="font-mono text-indigo-300 font-black text-sm">
                {progress.progress > 0 ? `${progress.progress}%` : 'Processing'}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${Math.max(8, progress.progress)}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 text-right">
              💡 Model weights (~86MB) are stored in your browser's IndexedDB for instant offline reuse.
            </p>
          </div>
        )}
      </div>

      {/* Main Studio Grid with Spacious Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Studio Column: Script Editor + CTA + Player */}
        <div className="lg:col-span-7 space-y-8">
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
              className={`w-full py-5 px-8 rounded-3xl font-black text-base tracking-wide shadow-2xl flex items-center justify-center gap-3 transition-all cursor-pointer ${
                isSynthesizing || !scriptText.trim()
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 hover:scale-[1.01] active:scale-[0.99]'
              }`}
            >
              {isSynthesizing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
                  <span>Synthesizing Speech ({progress.progress > 0 ? `${progress.progress}%` : 'Processing'}...)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 text-amber-300" />
                  <span>Generate Speech Audio</span>
                </>
              )}
            </button>
          </div>

          {/* Error Notice Banner */}
          {errorMsg && (
            <div className="p-5 rounded-3xl bg-red-950/70 border border-red-500/50 flex items-start gap-3.5 text-red-200 text-xs sm:text-sm shadow-xl">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block mb-1">Synthesis Notice</strong>
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
        <div className="lg:col-span-5 space-y-8">
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

          {/* Expression Quick Soundboard Guide Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 p-6 sm:p-7 shadow-xl space-y-4">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              Human Expression Guide
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ugh]</span>
                <p className="text-xs text-slate-400 mt-1">Frustration / Exasperation</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[sigh]</span>
                <p className="text-xs text-slate-400 mt-1">Deep breath release</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[cough]</span>
                <p className="text-xs text-slate-400 mt-1">Throat clearing pause</p>
              </div>
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                <span className="font-mono text-amber-400 font-bold">[ay]</span>
                <p className="text-xs text-slate-400 mt-1">Upbeat exclamation</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              💡 Tip: You can also insert timing tags like <code className="text-indigo-300 font-mono">[pause: 500ms]</code> or commas to create natural breathing pauses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
