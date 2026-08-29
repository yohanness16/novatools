export interface VoiceOption {
  id: string;
  name: string;
  gender: 'female' | 'male';
  language: string; // 'en-us', 'en-gb', 'ja', 'zh', 'es', 'fr', 'hi', 'it', 'pt'
  country: string;
  flag: string;
  description: string;
  category: 'natural' | 'narrative' | 'conversational' | 'character';
  samplePreview?: string;
}

export interface VoiceMixConfig {
  primaryVoice: string;
  secondaryVoice: string;
  blendRatio: number; // 0.0 (100% primary) to 1.0 (100% secondary)
}

export interface SynthesisOptions {
  text: string;
  voice: string;
  voiceMix?: VoiceMixConfig;
  speed: number; // 0.5 to 2.0
  device?: 'webgpu' | 'wasm';
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
}

export interface TTSProgress {
  status: 'idle' | 'loading_model' | 'phonemizing' | 'synthesizing' | 'done' | 'error';
  progress: number; // 0 to 100
  message: string;
  loadedBytes?: number;
  totalBytes?: number;
}

export type TTSWorkerInboundMessage =
  | { type: 'INIT'; payload?: { dtype?: string; device?: string } }
  | { type: 'GENERATE'; payload: SynthesisOptions & { id: string } }
  | { type: 'CANCEL'; payload: { id: string } };

export type TTSWorkerOutboundMessage =
  | { type: 'MODEL_PROGRESS'; payload: { progress: number; loaded: number; total: number; message: string } }
  | { type: 'READY'; payload: { voices: string[]; device: string } }
  | { type: 'CHUNK_GENERATED'; payload: { id: string; pcmData: Float32Array; sampleRate: number; text: string; cues: AudioCue[] } }
  | { type: 'COMPLETE'; payload: { id: string; pcmData: Float32Array; sampleRate: number; duration: number; cues: AudioCue[] } }
  | { type: 'ERROR'; payload: { id: string; error: string } };
