# PDF Page Numberer & Stamper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a 100% client-side PDF Page Numberer & Header/Footer Stamper that adds customizable page numbers (e.g., *"Page 1 of 10"*, roman numerals, custom prefixes) and header/footer metadata stamps to any PDF document.

**Architecture:** `pdf-lib` injects vector text overlays on each PDF page at specified geometric coordinates with customizable typography, margins, opacity, and page range filtering (e.g. skip cover page). React workspace features an interactive visual PDF page preview showing real-time stamp position.

**Tech Stack:** Astro, React 19, Tailwind CSS, Lucide Icons, `pdf-lib`, `pdfjs-dist`.

---

### Task 1: PDF Numbering Engine

**Files:**
- Create: `src/engines/pdfNumbererEngine.ts`

- [ ] **Step 1: Implement Position Matrix (Top-Left, Top-Center, Top-Right, Bottom-Left, Bottom-Center, Bottom-Right)**
- [ ] **Step 2: Implement Template Formatter (`{page}`, `{total}`, `Page {page} of {total}`, Roman Numerals `i, ii, iii`)**
- [ ] **Step 3: Implement `PdfNumbererEngine.stampPageNumbers(pdfFile, options)` using `pdf-lib`**
- [ ] **Step 4: Commit**
```bash
git add src/engines/pdfNumbererEngine.ts
git commit -m "feat(pdf-numberer): implement vector page number stamp engine using pdf-lib"
```

---

### Task 2: PDF Page Numberer Workspace Component

**Files:**
- Create: `src/components/workspaces/PdfNumbererWorkspace.tsx`

- [ ] **Step 1: Build Interactive PDF Page Preview with Visual Stamp Alignment Selector**
- [ ] **Step 2: Add Numbering Format Options (Start Page, Template, Font Size, Margin, Color)**
- [ ] **Step 3: Add Instant Download & PDF Inspector**
- [ ] **Step 4: Commit**
```bash
git add src/components/workspaces/PdfNumbererWorkspace.tsx
git commit -m "feat(numberer-workspace): add visual alignment grid, format templates, and live PDF preview"
```

---

### Task 3: Route & Tool Metadata Registration

**Files:**
- Modify: `src/lib/toolsData.ts`
- Create: `src/pages/pdf/page-numberer.astro`

- [ ] **Step 1: Add `pdf-page-numberer` metadata to `TOOLS` in `toolsData.ts`**
- [ ] **Step 2: Create `src/pages/pdf/page-numberer.astro`**
- [ ] **Step 3: Run `npm run build` to verify build succeeds**
- [ ] **Step 4: Commit**
```bash
git add src/lib/toolsData.ts src/pages/pdf/page-numberer.astro
git commit -m "feat(routes): register PDF Page Numberer tool page"
```
