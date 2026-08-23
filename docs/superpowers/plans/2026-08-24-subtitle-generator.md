# AI Subtitle Generator & Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% client-side AI Subtitle & Caption Generator that extracts speech from video/audio, creates timed subtitle cues, provides an interactive synchronized studio editor, and exports to `.SRT`, `.VTT`, `.TXT`, and `.JSON`.

**Architecture:** Web Audio API decodes audio to 16kHz mono PCM with energy-based Voice Activity Detection (VAD) chunking. Hybrid transcription uses `@xenova/transformers` (Whisper ONNX in WebAssembly) with fallback to native Web Speech API. React workspace displays a synchronized video player with live subtitle overlay and an interactive editable cue timeline.

**Tech Stack:** Astro, React 19, Tailwind CSS, Lucide Icons, Web Audio API, Web Speech API, `@xenova/transformers`, JSZip.

---

### Task 1: Subtitle Engine & Format Serializers

**Files:**
- Create: `src/engines/subtitleEngine.ts`

- [ ] **Step 1: Write format conversion utilities (SRT, VTT, TXT, JSON, and parsers)**

```typescript
export interface SubtitleCue {
  id: string;
  start: number; // in seconds
  end: number;   // in seconds
  text: string;
}

export function formatTimeSrt(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function formatTimeVtt(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function cuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => `${index + 1}\n${formatTimeSrt(cue.start)} --> ${formatTimeSrt(cue.end)}\n${cue.text.trim()}\n`)
    .join('\n');
}

export function cuesToVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue, index) => `${index + 1}\n${formatTimeVtt(cue.start)} --> ${formatTimeVtt(cue.end)}\n${cue.text.trim()}\n`)
    .join('\n');
  return `WEBVTT\n\n${body}`;
}

export function cuesToTxt(cues: SubtitleCue[], includeTimestamps = false): string {
  if (!includeTimestamps) {
    return cues.map((c) => c.text.trim()).join(' ');
  }
  return cues.map((c) => `[${formatTimeVtt(c.start)}] ${c.text.trim()}`).join('\n');
}

export function cuesToJson(cues: SubtitleCue[]): string {
  return JSON.stringify(cues, null, 2);
}

export function parseSrt(content: string): SubtitleCue[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) continue;

    const timeLine = lines.find((l) => l.includes('-->'));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
    const parseTime = (t: string) => {
      const parts = t.split(/[:,]/);
      if (parts.length < 4) return 0;
      return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10) + parseInt(parts[3], 10) / 1000;
    };

    const textLines = lines.slice(lines.indexOf(timeLine) + 1).join(' ').trim();
    cues.push({
      id: Math.random().toString(36).substring(2, 9),
      start: parseTime(startStr),
      end: parseTime(endStr),
      text: textLines,
    });
  }
  return cues;
}
```

- [ ] **Step 2: Add audio decoding and VAD segmentation to `src/engines/subtitleEngine.ts`**

```typescript
export class SubtitleEngine {
  static async decodeAudioTo16k(file: File | Blob): Promise<{ pcm: Float32Array; duration: number }> {
    const arrayBuffer = await file.arrayBuffer();
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();

    try {
      const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const targetSampleRate = 16000;
      const targetLength = Math.ceil(originalBuffer.duration * targetSampleRate);

      const offlineCtx = new OfflineAudioContext(1, targetLength, targetSampleRate);
      const source = offlineCtx.createBufferSource();
      source.buffer = originalBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      const renderedBuffer = await offlineCtx.startRendering();
      return {
        pcm: renderedBuffer.getChannelData(0),
        duration: renderedBuffer.duration,
      };
    } finally {
      await audioCtx.close();
    }
  }

  static segmentAudioBySilence(pcm: Float32Array, sampleRate = 16000, minSilenceMs = 500): { start: number; end: number }[] {
    const frameSize = Math.floor(sampleRate * 0.05); // 50ms window
    const segments: { start: number; end: number }[] = [];
    let inSpeech = false;
    let speechStart = 0;
    let silenceFrames = 0;
    const silenceThreshold = 0.015;
    const minSilenceFrames = Math.floor(minSilenceMs / 50);

    for (let i = 0; i < pcm.length; i += frameSize) {
      let sum = 0;
      const endIdx = Math.min(i + frameSize, pcm.length);
      for (let j = i; j < endIdx; j++) {
        sum += Math.abs(pcm[j]);
      }
      const energy = sum / (endIdx - i);

      if (energy > silenceThreshold) {
        if (!inSpeech) {
          inSpeech = true;
          speechStart = i / sampleRate;
        }
        silenceFrames = 0;
      } else {
        if (inSpeech) {
          silenceFrames++;
          if (silenceFrames >= minSilenceFrames || i + frameSize >= pcm.length) {
            inSpeech = false;
            const speechEnd = (i - silenceFrames * frameSize) / sampleRate;
            if (speechEnd - speechStart > 0.5) {
              segments.push({ start: speechStart, end: speechEnd });
            }
          }
        }
      }
    }

    if (inSpeech) {
      segments.push({ start: speechStart, end: pcm.length / sampleRate });
    }

    return segments.length > 0 ? segments : [{ start: 0, end: pcm.length / sampleRate }];
  }
}
```

- [ ] **Step 3: Verify formatting and parsing in node test**
- [ ] **Step 4: Commit**
```bash
git add src/engines/subtitleEngine.ts
git commit -m "feat(subtitle-engine): add audio preprocessor, VAD segmenter, and SRT/VTT format serializers"
```

---

### Task 2: Subtitle Studio Workspace Component

**Files:**
- Create: `src/components/workspaces/SubtitleGeneratorWorkspace.tsx`

- [ ] **Step 1: Build React Studio with Synchronized Video Player & Editable Cue List**
- [ ] **Step 2: Wire up Playback Time Sync, Seek on Click, and In-Place Timestamp Nudging**
- [ ] **Step 3: Add Export Bar (.SRT, .VTT, .TXT, .JSON, and ZIP)**
- [ ] **Step 4: Commit**
```bash
git add src/components/workspaces/SubtitleGeneratorWorkspace.tsx
git commit -m "feat(subtitle-studio): add synchronized video player and interactive cue editor"
```

---

### Task 3: Tool Metadata & Route Registration

**Files:**
- Modify: `src/lib/toolsData.ts`
- Create: `src/pages/video/subtitle-generator.astro`

- [ ] **Step 1: Add `subtitle-generator` metadata to `TOOLS` array in `toolsData.ts`**
- [ ] **Step 2: Create `src/pages/video/subtitle-generator.astro` route**
- [ ] **Step 3: Run `npm run build` to verify clean build**
- [ ] **Step 4: Commit**
```bash
git add src/lib/toolsData.ts src/pages/video/subtitle-generator.astro
git commit -m "feat(routes): register AI Subtitle Generator & Studio tool page"
```
