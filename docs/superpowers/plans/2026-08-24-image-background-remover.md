# Client-Side AI Background Remover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 100% client-side AI Background Remover that isolates subjects from photos and graphics with $0 server cost, transparent PNG export, and custom background color replacement.

**Architecture:** Client-side WebAssembly / WebGPU model segmentation (RMBG-1.4 ONNX via `@xenova/transformers` / Web Workers) generates a high-precision alpha mask. HTML5 Canvas compositing blends the alpha mask with original pixel data or custom background fills. React workspace features a split-slider before/after preview, background color picker, and 1-click HD download.

**Tech Stack:** Astro, React 19, Tailwind CSS, Lucide Icons, HTML5 Canvas API, `@xenova/transformers`, JSZip.

---

### Task 1: Background Removal Engine

**Files:**
- Create: `src/engines/backgroundRemoverEngine.ts`

- [ ] **Step 1: Implement Client-Side Image Preprocessing & Alpha Mask Generator**
- [ ] **Step 2: Implement Canvas Mask Compositor (Transparent PNG, Solid Colors, Gradients)**
- [ ] **Step 3: Add Batch Multi-Image Processing Pipeline**
- [ ] **Step 4: Commit**
```bash
git add src/engines/backgroundRemoverEngine.ts
git commit -m "feat(bg-engine): implement client-side AI background remover and canvas compositor"
```

---

### Task 2: Background Remover Workspace Component

**Files:**
- Create: `src/components/workspaces/BackgroundRemoverWorkspace.tsx`

- [ ] **Step 1: Build Interactive Before/After Split-Screen Diff Viewport**
- [ ] **Step 2: Add Background Swatch Picker (Transparent, White, Black, Custom Hex, Blur)**
- [ ] **Step 3: Add Batch Queue with 1-Click ZIP Download**
- [ ] **Step 4: Commit**
```bash
git add src/components/workspaces/BackgroundRemoverWorkspace.tsx
git commit -m "feat(bg-workspace): add split-diff viewer, background color replacer, and HD download"
```

---

### Task 3: Tool Metadata & Page Route Registration

**Files:**
- Modify: `src/lib/toolsData.ts`
- Create: `src/pages/image/background-remover.astro`

- [ ] **Step 1: Add `background-remover` metadata to `TOOLS` array in `toolsData.ts`**
- [ ] **Step 2: Create `src/pages/image/background-remover.astro`**
- [ ] **Step 3: Run `npm run build` to verify build succeeds**
- [ ] **Step 4: Commit**
```bash
git add src/lib/toolsData.ts src/pages/image/background-remover.astro
git commit -m "feat(routes): register AI Background Remover tool page"
```
