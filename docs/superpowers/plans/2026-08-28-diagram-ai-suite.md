# AI Document-to-Diagram & Architecture Visualizer Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100% client-side AI Document-to-Diagram Suite that ingests PDF, Word (.docx), Markdown, or raw text and automatically generates Flowcharts, ER Diagrams, Sequence Diagrams, Architecture Diagrams, Class Diagrams, State Diagrams, and Mindmaps using Mermaid.js with SVG and high-res PNG export.

**Architecture:**
- **Core Dependencies:** `mermaid` for rendering, `@types/mermaid` (or custom wrapper), SVG-to-PNG canvas serializer.
- **Engines:**
  - `src/engines/diagramEngine.ts`: In-browser AI generator + heuristic AST rule-based parser for each diagram type with syntax sanitization and auto-correction.
- **UI Workspace:**
  - `src/components/workspaces/DiagramStudioWorkspace.tsx`: Dual-pane editor with live interactive diagram canvas, pan/zoom controls, theme switcher, and 1-click AI generation buttons.
- **Pages & Routes:**
  - `/diagram` (Suite hub)
  - `/diagram/studio` (Full Diagram Studio)
  - `/diagram/doc-to-flowchart`
  - `/diagram/doc-to-erd`
  - `/diagram/doc-to-sequence`
  - `/diagram/doc-to-architecture`

---

## Tasks & Steps

### Task 1: Dependencies & Diagram Engine Types
- [ ] Install `mermaid` via npm.
- [ ] Create `src/engines/diagramTypes.ts` with diagram formats, themes, and extraction options.

### Task 2: AI & Heuristic Diagram Engine (`src/engines/diagramEngine.ts`)
- [ ] Implement AI prompt generator for Flowcharts, ERDs, Sequence, Architecture, Class, State, and Mindmap diagrams.
- [ ] Implement heuristic deterministic parsers for each diagram type when running offline without Gemini Nano.
- [ ] Implement syntax sanitizer (fixing escaping, brackets, quotes, and invalid node IDs).
- [ ] Implement SVG to PNG export renderer using HTML5 Canvas.

### Task 3: Interactive Diagram Studio Workspace (`src/components/workspaces/DiagramStudioWorkspace.tsx`)
- [ ] Build dual-pane editor (Source Document / Mermaid Code Editor vs Interactive Canvas).
- [ ] Implement Mermaid client-side rendering with pan, zoom, reset, and theme switcher (Dark Indigo, Forest, Neutral, Midnight).
- [ ] Implement File Ingestion Dropzone (PDF, DOCX, Markdown, Text).
- [ ] Implement 1-click export dock (Vector SVG, High-Res PNG, Mermaid Code, Copy).

### Task 4: Routes, Navigation & Metadata Registration
- [ ] Add `'diagram'` category and tools to `src/lib/toolsData.ts`.
- [ ] Add Diagram Suite to `src/components/Header.tsx` and `src/components/CommandPalette.tsx`.
- [ ] Create pages in `src/pages/diagram/`.

### Task 5: Testing, Build & Push
- [ ] Write unit and integration tests in `test/diagramEngine.test.mjs`.
- [ ] Run test suite and production build (`npm run build`).
- [ ] Commit and push to `main`.
