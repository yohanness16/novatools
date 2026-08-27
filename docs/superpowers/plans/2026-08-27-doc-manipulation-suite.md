# Client-Side Zero-Data-Loss Document Manipulation & In-Browser AI Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive, 100% client-side Document Manipulation Suite that enables upload and conversion of Markdown (`.md`), Word (`.docx`), Plain Text (`.txt`), and CSV into PDF, DOCX, PowerPoint presentations (`.pptx`), Excel spreadsheets (`.xlsx`), and HTML with **zero data loss**, paired with an **In-Browser Smart AI Engine** (Chrome Built-in AI + Transformers.js ONNX fallback) for intelligent slide generation, table extraction, summarization, and tone rewriting.

**Architecture:**
- **AST Lossless Engine:** Universal Abstract Syntax Tree pipeline parsing Markdown/DOCX/HTML into a canonical intermediate representation (MDAST/HAST) preserving headings, tables, code blocks, math formulas (KaTeX), lists, callouts, and embedded media.
- **Office Converters:** 
  - DOCX Ingestion & Generation (`mammoth` + `turndown` + `docx` OpenXML library).
  - Presentation Engine (`pptxgenjs` with customizable AI slide templates & theme palettes).
  - Spreadsheet Engine (`xlsx` SheetJS with table parsing, column type inference, and formula totals).
  - PDF Engine (CSS Paged Media `@page` layout with vector typography, running headers/footers, and print styles).
- **In-Browser AI Engine (`aiDocEngine.ts`):** 
  - Tier 1: Chrome Built-in AI APIs (`ai.languageModel` / Prompt API, `ai.summarizer`, `ai.writer`, `ai.rewriter`, `ai.translator`).
  - Tier 2: `@xenova/transformers` ONNX WebAssembly fallback for non-Chrome browsers.
  - Tier 3: Deterministic heuristic AST parser for 100% offline & zero-dependency execution.
- **Interactive Studio UI:** Dual-pane split editor with Monaco/rich Markdown editor, live multi-tab preview (Document View, PPTX Slide Carousel View, Excel Grid View), AI action toolbar, and floating action dock.

**Tech Stack:** Astro, React 19, Tailwind CSS, Lucide Icons, `mammoth`, `turndown`, `turndown-plugin-gfm`, `docx`, `pptxgenjs`, `xlsx`, `marked`, `katex`, `prismjs`, `@xenova/transformers`.

---

## Task Breakdown & Roadmap

### Task 1: Package Dependencies & Core Engine Types

**Files:**
- Modify: `package.json`
- Create: `src/engines/docTypes.ts`

- [ ] **Step 1: Install document manipulation and presentation dependencies**
  - Install `docx`, `pptxgenjs`, `xlsx`, `mammoth`, `turndown`, `turndown-plugin-gfm`, `marked`, `katex`, `prismjs` and their `@types`.
- [ ] **Step 2: Define Universal Document AST and Conversion Types**
  - Define interfaces for `DocNode`, `DocTable`, `DocSlide`, `DocTheme`, `ExportFormat`, `AIProcessingOptions`, and `ConversionResult`.

---

### Task 2: Lossless Universal Document Engine (`docEngine.ts`)

**Files:**
- Create: `src/engines/docEngine.ts`

- [ ] **Step 1: Implement DOCX Ingestion (DOCX -> Markdown/AST)**
  - Read uploaded `.docx` ArrayBuffer via `mammoth.convertToHtml()` with custom style maps.
  - Convert HTML into clean GFM Markdown via `turndown` with table and tasklist plugins.
- [ ] **Step 2: Implement DOCX OpenXML Generation (Markdown/AST -> DOCX)**
  - Parse AST and construct native Word document elements using `docx` (`Paragraph`, `HeadingLevel`, `Table`, `TableCell`, `TextRun`, `ImageRun`, `CalloutBorder`).
  - Style tables with distinct headers, alternating row fills, and borders.
  - Add code block styling with shaded monospace backgrounds.
- [ ] **Step 3: Implement High-Fidelity PDF Generation**
  - Build vector printable HTML container with CSS Paged Media `@page` styles, page break rules, KaTeX math rendering, and Prism syntax highlighting.
  - Provide direct browser print stream and downloadable formatted PDF.

---

### Task 3: Presentation & Slide Deck Engine (`pptxEngine.ts`)

**Files:**
- Create: `src/engines/pptxEngine.ts`

- [ ] **Step 1: Implement Slide Layout Templates & Themes**
  - Define themes: *Nova Dark Indigo*, *Clean Minimal*, *Corporate Blue*, *Emerald Modern*.
  - Build slide templates: Title Banner Slide, Agenda Slide, 2-Column Comparison Slide, Key Metric / Statistic Cards, Bulleted Feature Slide, Code Window Slide, Table Slide, Quote Slide, and Summary / Takeaway Slide.
- [ ] **Step 2: Implement AST to PPTX Converter**
  - Decompose Markdown headings (`#`, `##`, `###`), lists, tables, and callouts into structured slide objects.
  - Map each slide to the optimal layout template based on content density.
  - Generate native `.pptx` presentations via `pptxgenjs` with embedded speaker notes.

---

### Task 4: Spreadsheet & Table Extraction Engine (`excelEngine.ts`)

**Files:**
- Create: `src/engines/excelEngine.ts`

- [ ] **Step 1: Implement Markdown & HTML Table Parser**
  - Detect all GFM tables (`| col1 | col2 |`) and HTML `<table>` elements in the document.
  - Parse rows, headers, cell alignment, and data types (numbers, dates, currency strings, booleans).
- [ ] **Step 2: Implement Multi-Sheet XLSX Workbook Generator**
  - Generate `.xlsx` workbook using `xlsx` (SheetJS) / `exceljs`.
  - Create separate named worksheets for each detected table.
  - Auto-calculate column widths and apply header cell styling.
  - Add auto-sum formulas (`=SUM(B2:B10)`) for numerical columns.

---

### Task 5: In-Browser Smart AI Engine (`aiDocEngine.ts`)

**Files:**
- Create: `src/engines/aiDocEngine.ts`

- [ ] **Step 1: Implement Chrome Built-in AI (Gemini Nano) Provider**
  - Integrate `window.ai.languageModel` (Prompt API) with structured schema output.
  - Integrate `window.ai.summarizer` for instant document summarization and key takeaways.
  - Integrate `window.ai.writer` & `window.ai.rewriter` for document tone adjustments (Formal, Concise, Academic, Executive).
  - Integrate `window.ai.translator` for instant multilingual document translation.
- [ ] **Step 2: Implement Client-Side WASM & Heuristic Fallbacks**
  - Integrate `@xenova/transformers` ONNX pipeline fallback when Chrome Built-in AI is absent.
  - Implement heuristic NLP algorithm for rule-based slide decomposition and table synthesis when running completely offline.
- [ ] **Step 3: Build High-Level AI Transformation Functions**
  - `aiGenerateSlideDeck(docText, options)` -> returns structured `DocSlide[]`.
  - `aiExtractTablesToExcel(docText)` -> identifies implicit tabular data in narrative text and outputs structured rows/columns.
  - `aiSummarizeDocument(docText, format)` -> returns executive brief or slide outline.
  - `aiRewriteDocumentTone(docText, tone)` -> returns polished Markdown.

---

### Task 6: Interactive Document Studio Workspace (`DocStudioWorkspace.tsx`)

**Files:**
- Create: `src/components/workspaces/DocStudioWorkspace.tsx`
- Create: `src/pages/document/studio.astro`
- Create: `src/pages/document/index.astro`

- [ ] **Step 1: Build Top Navigation & File Ingestion Dropzone**
  - Universal upload zone supporting `.md`, `.docx`, `.txt`, `.html`, `.csv`, `.json`.
  - Real-time word count, character count, and estimated reading time.
  - Format converter export menu (PDF, DOCX, PPTX, XLSX, Markdown, HTML, EPUB).
- [ ] **Step 2: Build Dual-Pane Split Editor**
  - Left pane: Markdown / Document editor with line numbers, formatting toolbar, and table wizard.
  - Right pane: Multi-tab preview:
    - Tab 1: **Document View** (Rendered HTML/PDF layout with math and code highlighting).
    - Tab 2: **Slides View** (Interactive visual slide carousel with live PPTX preview, layout controls, and theme picker).
    - Tab 3: **Spreadsheet View** (Interactive editable grid with formula bar and table switcher).
- [ ] **Step 3: Build In-Browser AI Assistant Drawer / Toolbar**
  - One-click actions: "Auto-Generate Slides", "Extract Tables to Excel", "Summarize Executive Brief", "Polish Tone", "Translate".
  - Live AI generation progress indicator with token streaming support.
- [ ] **Step 4: Build Sticky Action Dock**
  - Instant 1-click download button for active format.
  - Copy to clipboard button (Formatted Markdown, HTML, CSV).
  - Privacy indicator ("100% Client-Side Private • Zero Server Uploads").

---

### Task 7: Routing, Navigation & End-to-End Verification

**Files:**
- Modify: `src/components/Header.tsx` (Add Document Suite navigation link)
- Modify: `src/components/CommandPalette.tsx` (Register document conversion shortcuts)
- Modify: `src/pages/index.astro` (Add Document Suite feature card to homepage)
- Create: `src/pages/document/md-to-pdf.astro`
- Create: `src/pages/document/md-to-docx.astro`
- Create: `src/pages/document/doc-to-slides.astro`
- Create: `src/pages/document/doc-to-excel.astro`

- [ ] **Step 1: Wire up navigation links and Command Palette (Cmd+K) actions**
- [ ] **Step 2: Create dedicated landing/tool pages for SEO and direct access**
- [ ] **Step 3: Run build check (`npm run build`) and verify 100% zero runtime errors**
- [ ] **Step 4: Test end-to-end file conversions with sample Markdown, DOCX, tables, math formulas, and AI slide generation**
