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
  Radio
} from 'lucide-react';

export const TextToSpeechWorkspace: React.FC = () => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('af_heart');
  const [isBlenderEnabled, setIsBlenderEnabled] = useState<boolean>(false);
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
      }
    });
    ttsEngineRef.current = engine;

    // Trigger non-blocking warm-up / initialization
    engine.init('q8', 'webgpu')
      .then(() => setIsEngineReady(true))
      .catch((e) => console.warn('Background TTS warm-up notice:', e));

    return () => {
      ttsEngineRef.current?.terminate();
      ttsEngineRef.current = null;
    };
  }, []);

  const selectedVoice = useMemo(() => {
    return BUILTIN_VOICES.find(v => v.id === selectedVoiceId) || BUILTIN_VOICES[0];
  }, [selectedVoiceId]);

  const handlePreload = async () => {
    if (isEngineReady || isPreloading) return;
    setIsPreloading(true);
    setErrorMsg(null);

    try {
      if (!ttsEngineRef.current) {
        ttsEngineRef.current = new TTSEngine((p) => setProgress(p));
      }
      await ttsEngineRef.current.init('q8', 'webgpu');
      setIsEngineReady(true);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to download model weights. Please check your connection.');
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
        device: 'webgpu',
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

          {/* Engine Status Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isEngineReady ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  {isEngineReady ? 'Engine Ready (WebGPU/WASM)' : 'Engine Standby'}
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% Client-Side Privacy
                </div>
              </div>
            </div>

            {!isEngineReady && (
              <button
                type="button"
                onClick={handlePreload}
                disabled={isPreloading}
                className="mt-2 sm:mt-0 px-3.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
              >
                {isPreloading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-3.5 h-3.5" />
                    <span>Preload Model (~86MB)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Live Progress Bar (During download or synthesis) */}
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
