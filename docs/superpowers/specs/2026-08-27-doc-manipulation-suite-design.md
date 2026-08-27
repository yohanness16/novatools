# Master Specification: Client-Side Zero-Data-Loss Document Manipulation & AI Suite

**Author:** NovaTools Architecture Team  
**Date:** August 27, 2026  
**Status:** Approved Specification  
**Classification:** Client-Side Engineering & AI Engine Architecture  

---

## 1. Executive Summary & Vision

NovaTools Document Suite is a 100% client-side, zero-server document transformation, intelligence, and presentation engine. It enables users to:
1. **Upload & Ingest:** Markdown (`.md`), Word (`.docx`), Rich Text (`.html`/`.rtf`), Plain Text (`.txt`), and Tabular Data (`.csv`/`.tsv`/`.json`).
2. **Transform with Zero Data Loss:** Convert seamlessly between Markdown, PDF, DOCX, PowerPoint (`.pptx`), Excel (`.xlsx`), and HTML.
3. **In-Browser AI Enhancement:** Leverage Chrome Built-in AI APIs (Gemini Nano via Prompt, Summarizer, Writer, Rewriter, and Translator APIs) with client-side WebAssembly ONNX fallbacks (`@xenova/transformers`) to intelligently generate slide decks, extract structured spreadsheet tables from unstructured text, summarize documents, and translate text with 100% privacy.
4. **Interactive Studio Workspace:** Real-time Monaco/CodeMirror dual-pane editor, live PDF/HTML preview, visual PPTX slide carousel preview, and interactive Excel grid inspector.

---

## 2. Zero-Data-Loss AST Architecture (The Master Guarantee)

Traditional web document converters suffer from high data loss because they rely on naive regular expressions or shallow string replacements, which drop nested lists, complex table column alignments, code block language metadata, inline formatting, mathematical formulas, and embedded media.

NovaTools solves this through a **Unified AST (Abstract Syntax Tree) Pipeline**:

```
 ┌──────────────────────────────────────────────────────────┐
 │                     INPUT SOURCES                        │
 │  • Markdown (.md)    • Word (.docx)    • HTML / RichText │
 └──────────────┬──────────────────┬─────────────────┬──────┘
                │                  │                 │
                ▼                  ▼                 ▼
        [Remark/Unified]    [Mammoth AST]      [Rehype Parser]
                │                  │                 │
                └──────────────────┼─────────────────┘
                                   │
                                   ▼
                ┌────────────────────────────────────┐
                │   Lossless Universal Document AST  │
                │     (MDAST / HAST Canonical IR)    │
                │  • Metadata & Frontmatter          │
                │  • Headings (H1-H6) & Anchors      │
                │  • Semantic Text & Formatting      │
                │  • Tables (Align, Headers, Spans)  │
                │  • Code Blocks + Language + Prism  │
                │  • Math Formulas (LaTeX / KaTeX)   │
                │  • Footnotes, Callouts, Blockquotes│
                │  • Embedded Images & Media Blobs   │
                └──────────────────┬─────────────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       ▼                           ▼                           ▼
[PDF Vector Generator]     [DOCX Generator]           [PPTX Slide Architect]
  • CSS Paged Media          • `docx` OpenXML           • `pptxgenjs` Engine
  • KaTeX Math Rendering     • Full Table Bordering     • Dynamic Card Layouts
  • Syntax Highlight Theme   • Callout Containers       • Multi-Theme Styling
  • Headers & Page Numbers   • Embedded Media Blobs     • Speaker Notes
       │                           │                           │
       ▼                           ▼                           ▼
[Excel Sheet Builder]      [Markdown / HTML]          [EPUB / Text]
  • `xlsx` / `exceljs`       • `turndown` AST           • E-Book Package
  • Type-Inferred Cells      • Clean GFM Syntax         • Structured Chapters
  • Auto-Sum Formulas        • Base64 Image Preserved   • Metadata Package
```

### 2.1 Lossless Element Mapping Matrix

| Document Element | Markdown (`.md`) | Word (`.docx`) | Presentation (`.pptx`) | Spreadsheet (`.xlsx`) | PDF (`.pdf`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Document Title** | `# Title` or Frontmatter | `Heading 1` (Title Style) | Slide 1 Title Banner | Sheet Name / Title Cell | Page 1 Header / Cover |
| **Section Headings** | `##`, `###`, `####` | `Heading 2`, `Heading 3` | New Slide / Card Header | Section Header Row | CSS `@page` Bookmarks |
| **Paragraphs & Quotes** | Text / `> Quote` | Normal / Callout Box | Text Box / Quote Callout | Cell Comments / Rows | Formatted Text Block |
| **Inline Formatting** | `**Bold**`, `*Italic*`, `~~Del~~`, `code` | Strong, Italic, Strike, Code Run | Formatted RichText Runs | Formatted Cell Runs | Exact Canvas/Vector Font |
| **Ordered/Bullet Lists** | `- item` / `1. item` | Native Word Bullet/Numbering | Bulleted Text Box | Ordered Rows with Indent | Styled `<ul>` / `<ol>` |
| **Tables** | GFM Pipe Table (`\| col \|`) | `Table` with border & shading | Native `addTable` Slide Shape | Native Worksheet Grid | Vector Rendered Table |
| **Code Blocks** | ` ```ts ` fenced block | Monospace Shaded Paragraph | Code Window Card Shape | Code Cell Block | Highlighted Prism/Shiki |
| **Math & Formulas** | `$E=mc^2$` / `$$...$$` | Office Math ML / Math Images | Math Formula Shape / Image | Formula Cell (`=SUM()`) | KaTeX Vector SVG |
| **Images** | `![alt](url/base64)` | Embedded `word/media/` | `slide.addImage()` | Floating Image in Sheet | Embedded PDF Image |
| **Checklists** | `- [x] Done` | Formatted Checkbox Symbols | Task Status Shape / Pill | Boolean/Check Column | Interactive Checkbox |

---

## 3. In-Browser Smart AI Engine Specification

NovaTools integrates an on-device AI system operating in a 3-tier cascade to ensure zero-cost, zero-latency, and 100% client-side privacy.

### 3.1 Three-Tier Intelligence Cascade

1. **Tier 1: Chrome Built-in AI APIs (Gemini Nano)**
   - **`window.ai.languageModel` / `ai.languageModel.create()`**: Prompt API with structured JSON output formatting.
   - **`window.ai.summarizer` / `ai.summarizer.create({ type: 'key-points', format: 'markdown' })`**: Instant extraction of executive summaries, slide bullet points, and key takeaways.
   - **`window.ai.writer` & `ai.rewriter`**: Tone adaptation (e.g., convert casual notes into an executive report or technical documentation).
   - **`window.ai.translator`**: Multi-language translation with zero API keys.

2. **Tier 2: Client-Side WebAssembly ONNX (`@xenova/transformers`)**
   - Fallback when running on Firefox, Safari, Edge, or older Chrome versions without Gemini Nano.
   - Employs lightweight quantized ONNX models:
     - `Xenova/Qwen1.5-0.5B-Chat` or `SmolLM-135M-Instruct` for local in-browser document decomposition.
     - `Xenova/bge-small-en-v1.5` for semantic sectioning and table extraction.

3. **Tier 3: Deterministic Rule-Based Fallback**
   - When no AI or WebGPU is available, pure algorithmic parsing generates slide decks based on Markdown heading depth (`#` -> Slide, `##` -> Section, `###` -> Card), extracts GFM tables to Excel, and formats documents with zero external dependencies.

### 3.2 AI-Powered Features

1. **AI Doc-to-Slides Architect:**
   - Analyzes document semantic structure.
   - Generates a balanced 10–15 slide deck with title slide, agenda, 2-column comparison cards, key metric highlight cards, quote callouts, and summary slides.
   - Auto-generates speaker notes for every slide based on document paragraphs.

2. **AI Smart Table Extractor & Spreadsheet Synthesizer:**
   - Scans unstructured narrative text (e.g., invoices, meeting notes, financial statements, project specs).
   - Identifies tabular relationships, extracts them into structured columns, infers data types (Numbers, Currencies, Dates, Percentages), and auto-generates formula totals (`=SUM(B2:B10)`).

3. **AI Document Summarizer & Executive Brief Generator:**
   - Produces a concise 1-page executive summary or slide outline from a 50-page document.

4. **AI Tone & Style Polisher:**
   - Rewrites raw notes into polished formal documentation or academic papers before DOCX/PDF export.

---

## 4. Technical Engine Blueprints

### 4.1 Document Conversion Engine (`src/engines/docEngine.ts`)

- **DOCX Ingestion:** Uses `mammoth` with custom style maps + `turndown` with GFM table plugins.
- **DOCX Generation:** Uses `docx` (`Paragraph`, `TextRun`, `Table`, `TableRow`, `TableCell`, `WidthType`, `BorderStyle`, `HeadingLevel`, `ImageRun`) to compile Universal AST directly into standard OpenXML.
- **PPTX Generation:** Uses `pptxgenjs` with pre-engineered slide themes:
  - *Nova Dark Indigo* (`#09090b` background, `#6366f1` accents, `#f8fafc` text)
  - *Clean Corporate* (`#ffffff` background, `#2563eb` accents, `#1e293b` text)
  - *Minimal Emerald* (`#0f172a` background, `#10b981` accents, `#e2e8f0` text)
  - *Sunset Modern* (`#18181b` background, `#f97316` accents, `#fafafa` text)
- **Excel Generation:** Uses `xlsx` (SheetJS) / `exceljs` with column auto-sizing, cell format tagging, multiple sheets (one per extracted table), and auto-formula generation.
- **PDF Generation:** Combines CSS Paged Media (`@page { size: A4; margin: 20mm; }`, `page-break-inside: avoid;`, running headers/footers) with `window.print()` / `html2pdf.js` vector rendering for 100% sharp text.

---

## 5. UI/UX Workspace Specification

### 5.1 Workspace Layout
- **Top Command Bar:**
  - File Dropzone / Ingestion button (Upload `.md`, `.docx`, `.txt`, `.html`, `.csv`).
  - Document Title & Word/Character/Reading Time metrics.
  - One-Click Export Menu: `PDF`, `DOCX`, `PPTX`, `XLSX`, `HTML`, `Markdown`, `JSON`.
  - AI Assistant Dropdown: `Generate Slides Deck`, `Extract to Spreadsheet`, `Summarize Brief`, `Change Tone`, `Translate`.

- **Main Split View:**
  - **Left Pane:** Full-featured Markdown / Document source editor with syntax highlighting, line numbers, table helper toolbar, and format buttons.
  - **Right Pane:** Multi-Tab Real-time Preview:
    1. *Document View:* High-fidelity rendered PDF/Document layout with KaTeX math and highlighted code.
    2. *Slides View:* Interactive carousel with slide thumbnails, live PPTX preview, layout switcher, and theme picker.
    3. *Data/Spreadsheet View:* Interactive editable table grid with column sorting, formula bar, and Sheet tabs.

- **Floating Action Dock:**
  - Quick Download button for primary selected format.
  - Copy to Clipboard (as Clean Markdown, HTML, or CSV).
  - Privacy Status: "100% Client-Side Private • No Server Uploads".
