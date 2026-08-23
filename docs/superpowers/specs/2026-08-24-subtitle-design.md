# NovaTools — AI Subtitle Generator & Studio Specification

## 1. Overview
The **AI Subtitle Generator & Studio** is a 100% client-side privacy-first tool for NovaTools. It automatically transcribes speech from video and audio files into accurately timed subtitle cues and provides a synchronized subtitle studio for editing, retiming, and exporting to industry-standard subtitle formats (`.SRT`, `.VTT`, `.TXT`, `.JSON`).

---

## 2. Key Capabilities & Features
1. **Multi-Format Media Support**:
   - **Video**: MP4, WebM, MKV, MOV, AVI, M4V, TS
   - **Audio**: MP3, WAV, M4A, AAC, OGG, FLAC, WEBM
   - **Existing Subtitles**: Import `.srt` or `.vtt` files to edit and synchronize against video/audio.

2. **Client-Side Speech-to-Text Engines**:
   - **Whisper AI Engine (ONNX WebAssembly / WebGPU)**: Powered by client-side Transformers (`@xenova/transformers` / Whisper models) with support for 100+ languages and automatic silence/sentence timestamp generation.
   - **Web Speech API Engine**: Native browser speech recognition fallback for ultra-fast instant transcription on supported browsers.
   - **VAD & Silence Boundary Segmenter**: Analyzes audio energy to segment speech into natural subtitle cues with millisecond timestamps.

3. **Synchronized Studio & Video Player**:
   - Live media player with real-time subtitle overlay rendering.
   - Active cue auto-scrolling & highlighting as media plays.
   - Click any cue to immediately seek video playback to that exact timestamp.

4. **Interactive Subtitle Editor**:
   - In-place editable text for each subtitle cue.
   - Millisecond-precision start and end time adjusters (`+0.1s` / `-0.1s` nudge buttons and direct timestamp input).
   - Add new cue, split cue, delete cue, and search & replace text.

5. **Multi-Format Subtitle Exporter**:
   - **SubRip (`.srt`)**: Standard format formatted as `00:01:23,456 --> 00:01:28,789`.
   - **WebVTT (`.vtt`)**: HTML5 `<track>` standard formatted as `00:01:23.456 --> 00:01:28.789`.
   - **Plain Text (`.txt`)**: Clean transcript with or without timestamps.
   - **JSON (`.json`)**: Structured subtitle cue array for programmatic workflows.
   - **Copy to Clipboard** & **Download All (ZIP)**.

---

## 3. Architecture & File Structure

### Routes & Data
- `src/pages/video/subtitle-generator.astro`: Tool page layout wrapper.
- `src/lib/toolsData.ts`: Metadata entry for `subtitle-generator` in the `video` category.

### Engine (`src/engines/subtitleEngine.ts`)
- `SubtitleCue`: Data model containing `id`, `start` (seconds), `end` (seconds), and `text` (string).
- `decodeAudioForTranscription(mediaFile: File | Blob)`: Prepares 16kHz mono Float32Array PCM stream from any video/audio file.
- `segmentSpeechByVad(audioData: Float32Array, sampleRate: number)`: Voice Activity Detection for natural cue segmentation.
- `generateSubtitles(mediaFile: File, options)`: Hybrid Whisper AI / Web Speech transcription pipeline.
- `cuesToSrt(cues: SubtitleCue[])`: Converts cues to standard `.srt` format.
- `cuesToVtt(cues: SubtitleCue[])`: Converts cues to standard `.vtt` format.
- `cuesToTxt(cues: SubtitleCue[], includeTimestamps?: boolean)`: Converts cues to `.txt`.
- `cuesToJson(cues: SubtitleCue[])`: Converts cues to JSON string.
- `srtToCues(srtString: string)`: Parses `.srt` into `SubtitleCue[]`.
- `vttToCues(vttString: string)`: Parses `.vtt` into `SubtitleCue[]`.

### Workspace Component (`src/components/workspaces/SubtitleGeneratorWorkspace.tsx`)
- Drag-and-drop dropzone supporting video, audio, and subtitle files.
- Dual-pane layout: Media player with subtitle overlay on the left/top; interactive editable cue list and search bar on the right/bottom.
- Toolbar for language selection, transcription execution, cue management, and format export.

---

## 4. Privacy & Offline Guarantees
- All audio decoding, transcription, and subtitle serialization happen entirely within the user's browser memory.
- Zero server communication or cloud uploads.
