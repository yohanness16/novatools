# Audio Volume Booster & Normalizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% client-side Audio Volume Booster & Normalizer that amplifies quiet audio/video files up to 300% (+12dB) with an automatic soft-knee limiter and EBU R128 / Peak Normalization to eliminate distortion and clipping.

**Architecture:** Web Audio API `OfflineAudioContext` with `GainNode` and `DynamicsCompressorNode` for transparent multi-band dynamics compression. React workspace includes before/after waveform preview, gain slider (+100% to +300%), normalization presets, and lossless WAV / AAC export.

**Tech Stack:** Astro, React 19, Tailwind CSS, Lucide Icons, Web Audio API, JSZip.

---

### Task 1: Audio Booster & Normalizer Engine

**Files:**
- Create: `src/engines/audioBoosterEngine.ts`

- [ ] **Step 1: Implement Peak Analysis & RMS Loudness Calculator**
- [ ] **Step 2: Implement Multi-Stage Gain Amplifier with Dynamics Limiter**
- [ ] **Step 3: Implement Lossless WAV & WebM Export Pipeline**
- [ ] **Step 4: Commit**
```bash
git add src/engines/audioBoosterEngine.ts
git commit -m "feat(audio-booster): implement client-side audio booster and dynamics compressor"
```

---

### Task 2: Audio Booster Workspace Component

**Files:**
- Create: `src/components/workspaces/AudioBoosterWorkspace.tsx`

- [ ] **Step 1: Build Interactive Volume Slider (100% to 300% / +0dB to +12dB)**
- [ ] **Step 2: Add Preset Quick Buttons (Speech Boost, Podcast Normalization, Max Clarity, Bass Warmth)**
- [ ] **Step 3: Add Live Synchronized Before vs After Audio Player**
- [ ] **Step 4: Commit**
```bash
git add src/components/workspaces/AudioBoosterWorkspace.tsx
git commit -m "feat(booster-workspace): add gain slider, limiter toggle, and A/B audio player"
```

---

### Task 3: Tool Metadata & Page Route Registration

**Files:**
- Modify: `src/lib/toolsData.ts`
- Create: `src/pages/video/audio-booster.astro`

- [ ] **Step 1: Add `audio-booster` metadata to `TOOLS` in `toolsData.ts`**
- [ ] **Step 2: Create `src/pages/video/audio-booster.astro`**
- [ ] **Step 3: Run `npm run build` to verify build succeeds**
- [ ] **Step 4: Commit**
```bash
git add src/lib/toolsData.ts src/pages/video/audio-booster.astro
git commit -m "feat(routes): register Audio Booster & Normalizer tool page"
```
