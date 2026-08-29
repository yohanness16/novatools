# Design Spec: NovaTools Kokoro-82M AI Voice Studio & TTS

## 1. Overview
A 100% client-side, privacy-first **AI Voice Studio and Text-to-Speech (TTS)** workspace powered by **Kokoro-82M** running via ONNX Runtime Web (`kokoro-js`) in a dedicated Web Worker. It enables users to synthesize natural, human-like voiceovers with custom voice blending, natural human expressions/interjections ("ugh", "cough", "ay", "sigh", "hmm", etc.), dynamic speed/pause controls, synchronized audio waveform playback, and multi-format export (WAV, MP3, SRT subtitles).

---

## 2. Technical Architecture

### 2.1 Dependencies & Models
- **Runtime:** `kokoro-js` with `@huggingface/transformers` / ONNX Runtime Web.
- **Model:** `onnx-community/Kokoro-82M-v1.0-ONNX` (default `q8` ~86MB quantization; optional `q4` ~45MB for memory-constrained environments).
- **Execution Target:** Automatic WebGPU acceleration (`device: "webgpu"`) with automatic fallback to WebAssembly with SIMD (`device: "wasm"`).
- **Offline Caching:** Handled via browser `CacheStorage` / `IndexedDB` for instant subsequent loads.

### 2.2 Web Worker Engine (`src/engines/workers/tts.worker.ts`)
All neural network inference and G2P phonemization run in an isolated Web Worker to keep the UI thread running at 60 FPS without frame drops.

Messages:
- `INIT`: Load weights, initialize ONNX session, and report download progress (0-100%).
- `GENERATE`: Process text chunk, normalize interjections/expressions, synthesize audio Float32Array PCM at 24kHz, and return audio buffers with timestamp cues.
- `CANCEL`: Abort ongoing synthesis immediately.

---

## 3. Human-like Speech & Expression Processing

### 3.1 Expression & Interjection Normalization
To handle spontaneous human sounds and expressions (e.g., *"ugh"*, *"cough"*, *"ay"*, *"sigh"*, *"hmm"*, *"whoa"*, *"ha ha"*, *"um"*):
- **Phoneme & Sound Effect Map:** A text pre-processor maps interjections to phonetic approximations and pause patterns that Kokoro renders naturally.
- **Pause & Punctuation Enhancer:** Inserts breath markers, em-dashes (`—`), and micro-pauses (`...`, `[pause: 300ms]`) to simulate realistic human cadence and breath intervals.

### 3.2 Voice Library & Custom Voice Blender
- **Rich Voice Catalog:** 50+ built-in voices across American English (`af_heart`, `af_bella`, `af_sky`, `af_nicole`, `am_adam`, `am_michael`, `am_liam`), British English (`bf_emma`, `bf_isabella`, `bm_george`, `bm_lewis`), Spanish, French, Italian, Portuguese, Japanese, and Hindi.
- **Voice Blender:** Dual-voice interpolation allowing users to blend two voice styles (e.g. 70% Heart + 30% Bella) for unique human timbres.
- **Speed & Pacing Control:** 0.5x to 2.0x real-time speed adjustments.

---

## 4. UI / Workspace Layout (`src/components/workspaces/TextToSpeechWorkspace.tsx`)

### 4.1 Layout Sections
1. **Header Toolbar:**
   - Model download progress & engine badge (WebGPU / WASM Active).
   - Voice quick-switcher + Voice Blender toggle.
   - Preset selector (Conversational, Storyteller, Energetic, Podcast Host).
2. **Script Editor:**
   - Multi-paragraph text area with line numbers and character/word counter.
   - Expression quick-tags toolbar (*"Insert Sigh"*, *"Insert Ugh"*, *"Insert Ay"*, *"Insert Pause"*).
   - Chunk segmentation preview (splits by sentence/paragraph for progressive playback).
3. **Playback & Waveform Visualizer:**
   - Canvas-based audio waveform visualizer.
   - Timecode display and scrub bar.
   - Active sentence/word highlighting synced during playback.
4. **Export Suite:**
   - High-fidelity WAV download (24kHz 16-bit PCM).
   - Compressed MP3 download.
   - Timestamped Subtitles (.SRT and .VTT).
   - Multi-clip ZIP export.

---

## 5. File Structure
```
src/
├── engines/
│   ├── ttsEngine.ts                  # Public engine API, worker manager, audio converters
│   ├── ttsTypes.ts                   # Types for voices, audio buffers, presets, interjections
│   ├── ttsExpressions.ts             # Expression dictionary, interjections & phoneme mapping
│   └── workers/
│       └── tts.worker.ts             # Dedicated Web Worker running kokoro-js
├── components/workspaces/
│   ├── TextToSpeechWorkspace.tsx      # Main workspace component
│   └── tts/
│       ├── VoiceSelector.tsx          # Categorized voice browser with audio previews
│       ├── VoiceBlender.tsx           # 2-voice interpolation slider
│       ├── ScriptEditor.tsx           # Text input with interjection helpers & word counts
│       └── AudioPlayerCard.tsx        # Interactive waveform, audio playback & export buttons
└── pages/
    └── video/
        └── text-to-speech.astro       # Astro route & SEO metadata
```
