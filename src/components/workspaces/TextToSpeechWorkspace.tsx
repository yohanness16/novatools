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
  Activity
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
    "Hey there! [ay] Welcome to NovaTools AI Voice Studio. [pause: 300ms] " +
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
  const [audioResult, setAudioResult] = useState<SynthesizedAudioResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const ttsEngineRef = useRef<TTSEngine | null>(null);

  useEffect(() => {
    ttsEngineRef.current = new TTSEngine((p) => {
      setProgress(p);
    });

    return () => {
      ttsEngineRef.current?.terminate();
      ttsEngineRef.current = null;
    };
  }, []);

  const selectedVoice = useMemo(() => {
    return BUILTIN_VOICES.find(v => v.id === selectedVoiceId) || BUILTIN_VOICES[0];
  }, [selectedVoiceId]);

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
    } catch (err: any) {
      console.error('TTS Generation Error:', err);
      setErrorMsg(err?.message || 'Speech synthesis failed. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900/90 to-purple-950/80 border border-indigo-500/20 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Kokoro-82M Neural Engine • 100% Private & Client-Side
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              AI Voice Studio & Humanic TTS
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Generate studio-quality voiceovers in your browser. Supports 50+ natural voices, 
              custom voice blending, and conversational human expressions like <em>"ugh"</em>, <em>"cough"</em>, <em>"ay"</em>, <em>"sigh"</em>, and <em>"hmm"</em>.
            </p>
          </div>

          {/* Engine Status / Badges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  WebGPU / WASM Active
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Zero Server Uploads
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading / Download Progress Bar (When downloading weights) */}
        {progress.status === 'loading_model' && (
          <div className="mt-6 pt-4 border-t border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
              <span className="flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                {progress.message || 'Downloading Kokoro Neural Weights...'}
              </span>
              <span className="font-mono text-indigo-300">{progress.progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Workspace 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Script Editor & Controls */}
        <div className="lg:col-span-7 space-y-6">
          <ScriptEditor
            text={scriptText}
            onChange={setScriptText}
            speed={speed}
            onSpeedChange={setSpeed}
            enhanceExpressions={enhanceExpressions}
            onToggleExpressions={setEnhanceExpressions}
          />

          {/* Synthesize Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={handleSynthesize}
              disabled={isSynthesizing || !scriptText.trim()}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
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
                  <span>Generate Speech</span>
                </>
              )}
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Synthesis Notice</strong>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Audio Player Card Output */}
          <AudioPlayerCard
            result={audioResult}
            voiceName={selectedVoice.name}
            voiceFlag={selectedVoice.flag}
          />
        </div>

        {/* Right Column: Voice Selection & Custom Blender */}
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

          {/* Expression Quick Guide */}
          <div className="bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              Human Expression Guide
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <code className="text-amber-400 font-mono">[ugh]</code>
                <p className="text-slate-400 mt-0.5">Frustration / Exasperation</p>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <code className="text-amber-400 font-mono">[sigh]</code>
                <p className="text-slate-400 mt-0.5">Relief or deep breath</p>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <code className="text-amber-400 font-mono">[cough]</code>
                <p className="text-slate-400 mt-0.5">Clearing throat pause</p>
              </div>
              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <code className="text-amber-400 font-mono">[ay]</code>
                <p className="text-slate-400 mt-0.5">Surprise / Upbeat interjection</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              You can also use pause tags like <code className="text-slate-400">[pause: 500ms]</code> to customize breath and timing pauses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
