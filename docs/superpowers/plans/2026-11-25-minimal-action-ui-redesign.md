# Minimal Action-Led UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the NovaTools UI into a crisp, zero-prose, action-led studio with AI-generated 3D suite visuals and an iLovePDF-beating Universal Drop + Action Grid on the homepage.

**Architecture:** Preserve all client-side WASM/Canvas/AI engines and routes while replacing the marketing shell, design tokens, homepage, suite layouts, tool page layout, and dropzone chrome. Add an IndexedDB file-handoff utility so files dropped on `/` automatically pre-load inside the destination tool workspace.

**Tech Stack:** Astro 5, React 19, Tailwind CSS v3, Lucide Icons, Browser IndexedDB, Node test runner / Astro build.

---

### Task 1: Generate 6 Bespoke Minimalist 3D Suite Visuals
**Files:**
- Create: `public/images/suite-pdf.png`
- Create: `public/images/suite-image.png`
- Create: `public/images/suite-video.png`
- Create: `public/images/suite-document.png`
- Create: `public/images/suite-diagram.png`
- Create: `public/images/suite-svg.png`
- [ ] Generate all 6 cohesive studio-light minimalist 3D object renders via `image-generator` with no embedded text.

### Task 2: Update Design Tokens & Tailwind Configuration
**Files:**
- Modify: `tailwind.config.mjs`
- Modify: `src/styles/global.css`
- [ ] Replace warm cream/yellow/bevel tokens with Crisp Light Studio (`#FAFAFA` / `#FFFFFF` / `#2563EB`) and Matte Dark (`#0B0C0F` / `#13151A` / `#3B82F6`) CSS variables while keeping `.nt-*` class names backward-compatible for workspaces.

### Task 3: Extend Tool Metadata & Add IndexedDB File Handoff
**Files:**
- Modify: `src/lib/toolsData.ts`
- Create: `src/lib/fileHandoff.ts`
- Create: `test/fileHandoff.test.mjs`
- [ ] Add `shortName`, `shortTag`, and `accepts` matching helper (`matchToolsForFiles`) in `toolsData.ts` / `fileHandoff.ts`.
- [ ] Write and run unit tests for file extension/MIME matching (`test/fileHandoff.test.mjs`).

### Task 4: Rebuild Minimalist App Shell (`Layout`, `Header`, `Footer`, `CommandPalette`, `CookieConsent`)
**Files:**
- Modify: `src/layouts/Layout.astro`
- Modify: `src/components/Header.tsx`
- Modify: `src/components/Footer.astro`
- Modify: `src/components/CommandPalette.tsx`
- Modify: `src/components/ThemeToggle.tsx`
- Modify: `src/components/CookieConsent.tsx`
- [ ] Strip badges, verbose placeholders, and multi-column footer links; convert to silent minimal top bar + thin 1-line footer.

### Task 5: Build Universal Drop + Visual Action Grid Homepage
**Files:**
- Create: `src/components/ActionHub.tsx`
- Modify: `src/pages/index.astro`
- [ ] Build `ActionHub` with top Universal Drop bar (file detection + action pills + IndexedDB handoff), 6 bespoke suite visual cards, category filter pills, and 1–2 word action tool tiles.
- [ ] Replace `index.astro` body with `<ActionHub client:load />`.

### Task 6: Rebuild Suite Pages & Tool Page Layouts (Zero Prose)
**Files:**
- Modify: `src/components/SuiteIndexLayout.astro`
- Modify: `src/components/ToolPageLayout.astro`
- Modify: `src/pages/pdf/index.astro`
- Modify: `src/pages/image/index.astro`
- Modify: `src/pages/video/index.astro`
- Modify: `src/pages/document/index.astro`
- Modify: `src/pages/diagram/index.astro`
- Modify: `src/pages/svg/index.astro`
- [ ] Remove all explanatory sections, FAQs, guides, traffic-light window chrome, and ads from `SuiteIndexLayout`, `ToolPageLayout`, and `pdf/index.astro`.

### Task 7: Clean Workspaces, Wire Handoff, Verify, Commit, Push & Deploy
**Files:**
- Modify: `src/components/workspaces/WorkspaceUI.tsx`
- Modify: `src/components/workspaces/*.tsx` (strip dropzone subtitles/prose & wire `useHandoffFiles`)
- [ ] Audit all workspace `<p>` elements and dropzone copy.
- [ ] Run unit tests + `npm run build` to verify zero TypeScript/Astro errors across every route.
- [ ] Commit, push to `origin/main`, and verify/trigger deployment.
