export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  language: string; // 'en-us', 'en-gb', etc.
  country: string;
  flag: string;
  description: string;
  category: 'natural' | 'narrative' | 'conversational' | 'character';
  grade?: string; // 'A' | 'A-' | 'B+' | 'B' | 'B-'
  traits?: string;
  previewUrl?: string;
}

export interface VoiceMixConfig {
  primaryVoice: string;
  secondaryVoice: string;
  blendRatio: number; // 0.0 (100% primary) to 1.0 (100% secondary)
}

export interface VoiceSettings {
  stability: number;   // 0.0 (expressive / dynamic) to 1.0 (stable / monotonic)
  speed: number;       // 0.5 to 2.0 (default 1.0)
  blendEnabled: boolean;
  blendConfig: VoiceMixConfig;
}

export interface SynthesisOptions {
  text: string;
  voice: string;
  voiceMix?: VoiceMixConfig;
  speed: number; // 0.5 to 2.0
  stability?: number;
  device?: 'auto' | 'webgpu' | 'wasm';
  dtype?: 'q8' | 'q4' | 'fp16' | 'fp32';
  enhanceExpressions?: boolean;
}

export interface AudioCue {
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
}

export interface SynthesizedAudioResult {
  audioBuffer: AudioBuffer | null;
  audioBlob: Blob;
  duration: number;
  sampleRate: number;
  cues: AudioCue[];
  url: string;
  voiceId?: string;
  voiceName?: string;
  voiceFlag?: string;
  text?: string;
  createdAt?: number;
}

export interface TTSProgress {
  status: 'idle' | 'loading_model' | 'phonemizing' | 'synthesizing' | 'done' | 'error';
  progress: number; // 0 to 100
  message: string;
  chunkIndex?: number;
  totalChunks?: number;
  elapsedMs?: number;
  estimatedRemainingMs?: number;
  etaFormatted?: string;
  loadedBytes?: number;
  totalBytes?: number;
}

export interface GenerationHistoryItem {
  id: string;
  text: string;
  voiceId: string;
  voiceName: string;
  voiceFlag: string;
  duration: number;
  url: string;
  blob: Blob;
  cues: AudioCue[];
  timestamp: number;
  speed: number;
}

export type TTSWorkerInboundMessage =
  | { type: 'INIT'; payload?: { dtype?: string; device?: string } }
  | { type: 'GENERATE'; payload: SynthesisOptions & { id: string } }
  | { type: 'CANCEL'; payload: { id: string } };

export type TTSWorkerOutboundMessage =
  | { type: 'MODEL_PROGRESS'; payload: { progress: number; loaded: number; total: number; message: string } }
  | { type: 'READY'; payload: { voices: string[]; device: string } }
  | { 
      type: 'CHUNK_PROGRESS'; 
      payload: { 
        id: string;
        chunkIndex: number; 
        totalChunks: number; 
        progress: number; 
        message: string; 
        elapsedMs: number; 
        estimatedRemainingMs: number; 
        etaFormatted: string; 
      } 
    }
  | { type: 'COMPLETE'; payload: { id: string; pcmData: Float32Array; sampleRate: number; duration: number; cues: AudioCue[] } }
  | { type: 'ERROR'; payload: { id: string; error: string } };
