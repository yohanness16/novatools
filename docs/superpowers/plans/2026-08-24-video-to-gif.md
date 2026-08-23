# Video to GIF Maker & Optimizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 100% client-side Video-to-GIF converter that renders animated GIFs from MP4, WebM, and MOV videos with custom frame rates (10–30 FPS), trimming range, resolution presets, and color dithering.

**Architecture:** HTML5 `<video>` and 2D `<canvas>` element capture frames at uniform time intervals. Color palette quantization (NeuQuant / Median Cut) and LZW encoding compile frames into an animated GIF Blob. React workspace features an interactive range timeline, FPS selector, live GIF preview, and size savings meter.

**Tech Stack:** Astro, React 19, Tailwind CSS, Lucide Icons, HTML5 Canvas API, JSZip.

---

### Task 1: GIF Encoding Engine

**Files:**
- Create: `src/engines/gifEngine.ts`

- [ ] **Step 1: Implement Canvas Frame Extraction & NeuQuant / Octree Palette Quantization**
- [ ] **Step 2: Implement LZW Animated GIF Stream Encoder**
- [ ] **Step 3: Add `GifEngine.renderVideoToGif(file, options, onProgress)` method**
- [ ] **Step 4: Commit**
```bash
git add src/engines/gifEngine.ts
git commit -m "feat(gif-engine): implement client-side canvas frame extractor and GIF encoder"
```

---

### Task 2: Video to GIF Workspace Component

**Files:**
- Create: `src/components/workspaces/VideoToGifWorkspace.tsx`

- [ ] **Step 1: Build Workspace with Video Player, Range Timeline, and Settings Panel**
  - Settings: FPS (10, 15, 20, 24, 30), Width Scaling (320px, 480px, 640px, Original), Dithering toggle, Quality slider.
- [ ] **Step 2: Add Progress Bar with Estimated Time & Frame Counter**
- [ ] **Step 3: Add Output GIF Inspector with Loop Playback & Direct Download**
- [ ] **Step 4: Commit**
```bash
git add src/components/workspaces/VideoToGifWorkspace.tsx
git commit -m "feat(gif-workspace): add interactive timeline, resolution scaling, and GIF preview"
```

---

### Task 3: Route & Tool Metadata Registration

**Files:**
- Modify: `src/lib/toolsData.ts`
- Create: `src/pages/video/video-to-gif.astro`

- [ ] **Step 1: Add `video-to-gif` metadata to `TOOLS` array in `toolsData.ts`**
- [ ] **Step 2: Create `src/pages/video/video-to-gif.astro` page layout**
- [ ] **Step 3: Run `npm run build` to verify build succeeds**
- [ ] **Step 4: Commit**
```bash
git add src/lib/toolsData.ts src/pages/video/video-to-gif.astro
git commit -m "feat(routes): register Video to GIF Maker tool page"
```
