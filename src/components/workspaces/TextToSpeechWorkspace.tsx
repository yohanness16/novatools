import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  TTSEngine,
  BUILTIN_VOICES,
} from '../../engines/ttsEngine';
import type {
  VoiceSettings,
  SynthesizedAudioResult,
  TTSProgress,
  GenerationHistoryItem,
} from '../../engines/ttsTypes';
import { VoiceSelector } from './tts/VoiceSelector';
import { VoiceSettingsModal } from './tts/VoiceSettingsModal';
import { ScriptEditor } from './tts/ScriptEditor';
import { AudioPlayerCard } from './tts/AudioPlayerCard';
import { GenerationHistory } from './tts/GenerationHistory';
import { WorkspaceAlert, WorkspaceProgress } from './WorkspaceUI';
import { useHandoffFiles } from '../../lib/useHandoffFiles';
import {
  Volume2,
  Sparkles,
  Sliders,
  Loader2,
  ChevronDown,
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
    'Welcome to NovaTools Voice Studio.'
  );

  useHandoffFiles((files) => {
    if (files[0]) {
      files[0].text().then((t) => {
        if (t.trim()) setScriptText(t);
      }).catch(() => {});
    }
  });

  const [progress, setProgress] = useState<TTSProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [, setIsEngineReady] = useState<boolean>(false);
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
    engine
      .init('q8', deviceMode)
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
    return BUILTIN_VOICES.find((v) => v.id === selectedVoiceId) || BUILTIN_VOICES[0];
  }, [selectedVoiceId]);

  const handleSynthesize = async () => {
    if (!scriptText.trim() || isSynthesizing) return;

    setErrorMsg(null);
    setIsSynthesizing(true);

    try {
      if (!ttsEngineRef.current) {
        ttsEngineRef.current = new TTSEngine((p) => setProgress(p));
      }

      const activeVoice = voiceSettings.blendEnabled
        ? voiceSettings.blendConfig.primaryVoice
        : selectedVoiceId;

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
    <div className="w-full space-y-6">
      {/* Studio Top Bar */}
      <div className="nt-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FEF7D6] dark:bg-[#FACC15]/15 text-[#CA8A04] dark:text-[#FACC15]">
            <Volume2 className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-[#141413] dark:text-[#FAF7F0]">
            {selectedVoice.name} · {selectedVoice.country}
          </span>
        </div>

        {/* Voice Picker & Settings Pill Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsVoiceSelectorOpen(true)}
            className="nt-btn-secondary flex items-center gap-3 px-3.5 py-2 text-left group"
          >
            <div className="nt-well w-8 h-8 flex items-center justify-center text-base shrink-0">
              {selectedVoice.flag}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#141413] dark:text-[#FAF7F0] leading-tight">
                  {selectedVoice.name}
                </span>
                {selectedVoice.grade && (
                  <span className="nt-badge-yellow px-1.5 py-0.5 text-[10px] font-bold">
                    {selectedVoice.grade}
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] text-[#746D61] dark:text-[#938B7D] capitalize">
                {selectedVoice.country} · {selectedVoice.gender}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#746D61] ml-1" />
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceSettingsOpen(true)}
            className="nt-btn-secondary flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold"
          >
            <Sliders className="w-4 h-4 text-[#CA8A04] dark:text-[#FACC15]" />
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
          <div className="flex-1">
            {isSynthesizing && (
              <WorkspaceProgress
                message={progress.message || 'Synthesizing speech...'}
                progress={progress.progress > 0 ? progress.progress : 12}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing || !scriptText.trim()}
            className="nt-btn-yellow py-3.5 px-7 text-sm sm:text-base tracking-tight flex items-center justify-center gap-2 shrink-0 disabled:opacity-45"
          >
            {isSynthesizing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {progress.chunkIndex && progress.totalChunks && progress.totalChunks > 1
                    ? `Generating part ${progress.chunkIndex}/${progress.totalChunks}`
                    : 'Generating speech...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate speech</span>
              </>
            )}
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && <WorkspaceAlert variant="error" message={`Synthesis Alert: ${errorMsg}`} />}
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
