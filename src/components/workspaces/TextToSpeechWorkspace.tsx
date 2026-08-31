import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  TTSEngine, 
  BUILTIN_VOICES 
} from '../../engines/ttsEngine';
import type { 
  VoiceOption, 
  VoiceSettings,
  SynthesizedAudioResult, 
  TTSProgress,
  GenerationHistoryItem
} from '../../engines/ttsTypes';
import { VoiceSelector } from './tts/VoiceSelector';
import { VoiceSettingsModal } from './tts/VoiceSettingsModal';
import { ScriptEditor } from './tts/ScriptEditor';
import { AudioPlayerCard } from './tts/AudioPlayerCard';
import { GenerationHistory } from './tts/GenerationHistory';
import { 
  Volume2, 
  Sparkles, 
  Sliders, 
  Loader2, 
  AlertCircle, 
  Play,
  ChevronDown,
  Zap,
  Cpu,
  RotateCcw
} from 'lucide-react';

export const TextToSpeechWorkspace: React.FC = () => {
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('af_heart');
  const [isVoiceSelectorOpen, setIsVoiceSelectorOpen] = useState<boolean>(false);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    speed: 1.0,
    blendEnabled: false,
    blendConfig: {
      primaryVoice: 'af_heart',
      secondaryVoice: 'af_bella',
      blendRatio: 0.3,
    },
  });

  const [deviceMode, setDeviceMode] = useState<'auto' | 'webgpu' | 'wasm'>('auto');
  const [activeDevice, setActiveDevice] = useState<string>('wasm');

  const [scriptText, setScriptText] = useState<string>(
    "Welcome to the all-new AI Voice Studio. You can generate studio-quality, lifelike voiceovers for videos, audiobooks, podcasts, and presentations — with unlimited length and crystal-clear acoustic fidelity."
  );

  const [progress, setProgress] = useState<TTSProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [isEngineReady, setIsEngineReady] = useState<boolean>(false);
  const [audioResult, setAudioResult] = useState<SynthesizedAudioResult | null>(null);
  const [historyItems, setHistoryItems] = useState<GenerationHistoryItem[]>([]);
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

    // Trigger non-blocking warm-up in background
    engine.init('q8', deviceMode)
      .then(() => {
        setIsEngineReady(true);
        setActiveDevice(engine.activeDevice);
      })
      .catch((e) => console.warn('TTS warm-up notice:', e));

    return () => {
      ttsEngineRef.current?.terminate();
      ttsEngineRef.current = null;
    };
  }, [deviceMode]);

  const selectedVoice = useMemo(() => {
    return BUILTIN_VOICES.find(v => v.id === selectedVoiceId) || BUILTIN_VOICES[0];
  }, [selectedVoiceId]);

  const handleSynthesize = async () => {
    if (!scriptText.trim() || isSynthesizing) return;

    setErrorMsg(null);
    setIsSynthesizing(true);

    try {
      if (!ttsEngineRef.current) {
        ttsEngineRef.current = new TTSEngine((p) => setProgress(p));
      }

      const activeVoice = voiceSettings.blendEnabled ? voiceSettings.blendConfig.primaryVoice : selectedVoiceId;

      const result = await ttsEngineRef.current.synthesize({
        text: scriptText,
        voice: activeVoice,
        voiceMix: voiceSettings.blendEnabled ? voiceSettings.blendConfig : undefined,
        speed: voiceSettings.speed,
        stability: voiceSettings.stability,
        device: deviceMode,
        dtype: deviceMode === 'webgpu' ? 'fp32' : 'q8',
      });

      result.voiceId = selectedVoice.id;
      result.voiceName = selectedVoice.name;
      result.voiceFlag = selectedVoice.flag;
      result.text = scriptText;
      result.createdAt = Date.now();

      setAudioResult(result);
      setIsEngineReady(true);

      // Add to session history
      const historyItem: GenerationHistoryItem = {
        id: `take_${Date.now()}`,
        text: scriptText,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.name,
        voiceFlag: selectedVoice.flag,
        duration: result.duration,
        url: result.url,
        blob: result.audioBlob,
        cues: result.cues,
        timestamp: Date.now(),
        speed: voiceSettings.speed,
      };

      setHistoryItems((prev) => [historyItem, ...prev]);
    } catch (err: any) {
      console.error('TTS Generation Error:', err);
      setErrorMsg(err?.message || 'Speech synthesis failed. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleSelectHistoryItem = (item: GenerationHistoryItem) => {
    setAudioResult({
      audioBuffer: null,
      audioBlob: item.blob,
      duration: item.duration,
      sampleRate: 24000,
      cues: item.cues,
      url: item.url,
      voiceId: item.voiceId,
      voiceName: item.voiceName,
      voiceFlag: item.voiceFlag,
      text: item.text,
      createdAt: item.timestamp,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      
      {/* Studio Header (ElevenLabs Minimal Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Volume2 className="w-7 h-7 text-indigo-500" />
            AI Voice Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Synthesize lifelike speech with natural cadence, multi-chunk long text support, and ultra-fast neural vocoding.
          </p>
        </div>

        {/* Top Control Bar (Voice Picker & Settings Pill Buttons) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Voice Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsVoiceSelectorOpen(true)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white transition-all shadow-md cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
              {selectedVoice.flag}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white leading-tight">
                  {selectedVoice.name}
                </span>
                {selectedVoice.grade && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    {selectedVoice.grade}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 capitalize">
                {selectedVoice.country} • {selectedVoice.gender}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {/* Voice Settings Button */}
          <button
            type="button"
            onClick={() => setIsVoiceSettingsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-200 hover:text-white transition-all shadow-md cursor-pointer text-xs font-semibold"
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Voice settings</span>
          </button>
        </div>
      </div>

      {/* Main Studio Script Editor */}
      <div className="space-y-4">
        <ScriptEditor
          text={scriptText}
          onChange={setScriptText}
          speed={voiceSettings.speed}
          onGenerate={handleSynthesize}
          isGenerating={isSynthesizing}
        />

        {/* Primary Action Button Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Progress / ETA Banner */}
          <div className="flex-1">
            {isSynthesizing && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span>{progress.message || 'Synthesizing speech...'}</span>
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">
                    {progress.progress > 0 ? `${progress.progress}%` : ''}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(10, progress.progress)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ElevenLabs Style Generate Button */}
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing || !scriptText.trim()}
            className={`py-4 px-8 rounded-2xl font-bold text-sm sm:text-base tracking-wide shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shrink-0 ${
              isSynthesizing || !scriptText.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/60'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-200" />
                <span>
                  {progress.chunkIndex && progress.totalChunks && progress.totalChunks > 1
                    ? `Generating part ${progress.chunkIndex}/${progress.totalChunks}`
                    : 'Generating speech...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <span>Generate speech</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-start gap-3 text-red-200 text-xs sm:text-sm shadow-lg animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Synthesis Alert</strong>
              {errorMsg}
            </div>
          </div>
        )}
      </div>

      {/* Output Audio Waveform Player */}
      <AudioPlayerCard
        result={audioResult}
        voiceName={audioResult?.voiceName || selectedVoice.name}
        voiceFlag={audioResult?.voiceFlag || selectedVoice.flag}
      />

      {/* Generation History Takes */}
      <GenerationHistory
        items={historyItems}
        onSelect={handleSelectHistoryItem}
        onClear={() => setHistoryItems([])}
        selectedId={audioResult?.createdAt ? `take_${audioResult.createdAt}` : undefined}
      />

      {/* Voice Selector Modal Sheet */}
      <VoiceSelector
        selectedVoiceId={selectedVoiceId}
        onSelectVoice={(id) => setSelectedVoiceId(id)}
        isOpen={isVoiceSelectorOpen}
        onClose={() => setIsVoiceSelectorOpen(false)}
      />

      {/* Voice Settings Modal Sheet */}
      <VoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        settings={voiceSettings}
        onChange={setVoiceSettings}
        deviceMode={deviceMode}
        onDeviceChange={setDeviceMode}
        activeDevice={activeDevice}
      />
    </div>
  );
};
