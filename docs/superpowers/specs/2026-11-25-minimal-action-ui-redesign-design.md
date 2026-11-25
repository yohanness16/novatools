# NovaTools Minimal Action-Led UI Redesign Spec

**Date:** 2026-11-25
**Goal:** Transform NovaTools into an ultra-clean, zero-prose, action-led media and document studio that beats iLovePDF with instant universal file drop, 1–2 word action tiles, and bespoke minimalist 3D suite visuals.

---

## 1. Core Principles

1. **Zero Visible Explanation Text (100%):** Remove all explanatory paragraphs, marketing hero copy, typewriter text, "About" architecture blocks, security ledgers, step-by-step guides, FAQs, use cases, dropzone subtitles, and decorative status pills from all visible UI surfaces. Preserve `<title>`, `<meta>`, and JSON-LD in `<head>` for invisible SEO.
2. **One-Word / Action-Led Labels:** Every tool, navigation item, dropzone, and button uses concise 1–2 word action titles (`Merge`, `Split`, `Compress`, `Remove BG`, `Drop file`, `Browse`, `Download`).
3. **Better Than iLovePDF (Drop-First Flow):** Users can either drop any file onto the homepage Universal Drop Bar (auto-detects file type, reveals matching action chips, and hands off the file via IndexedDB directly into the chosen workspace) or pick any tool directly from the visual Action Grid.
4. **Bespoke Visuals:** Replace CSS-bar mockups and old screenshots with 6 cohesive AI-generated minimalist 3D studio renders (`public/images/suite-*.png`) for the 6 suites (`pdf`, `image`, `video`, `document`, `diagram`, `svg`).

---

## 2. Visual & Token System

- **Palette (Warm Desktop Studio Yellow + Black + Cream + Matte Dark Obsidian toggle):**
  - Light: Canvas `#F5F1E8`, Surface `#FFFFFF`, Well `#EAE3D4`, Border `rgba(20, 20, 19, 0.11)`, Ink `#141413`, Muted `#746D61`, Accent `#FACC15`.
  - Dark: Canvas `#141311`, Surface `#1F1D19`, Well `#0E0D0B`, Border `rgba(250, 247, 240, 0.10)`, Bone Ink `#FAF7F0`, Muted `#938B7D`, Accent `#FACC15`.
- **Depth & Borders:** Tactile NovaTools desktop app `.nt-window` frames with subtle studio dots, 2.5D `.nt-card-interactive` lift, recessed `.nt-well` trays, and `.nt-btn-yellow` keycap action buttons—without any explanatory prose.
- **Typography:** `Plus Jakarta Sans` for UI/actions, `JetBrains Mono` strictly for file sizes, counts, durations, and `⌘K`.

---

## 3. Information Architecture & Components

### 3.1 `src/lib/toolsData.ts`
Extend `ToolMeta` with:
- `shortName`: 1–2 word action label shown across all cards, breadcrumbs, search palette, and nav.
- `shortTag`: 1-word suite badge (`PDF`, `Image`, `Video`, `Docs`, `Map`, `SVG`).
- `accepts`: file extensions / MIME prefixes used by the Homepage Universal Dropzone to match dropped files to instant actions.

### 3.2 `src/lib/fileHandoff.ts`
Client-side IndexedDB handoff (`novatools-handoff`) storing dropped `File[]` with target path and a 2-minute TTL, plus a `useHandoffFiles(onFiles)` hook so workspaces automatically ingest files dropped on `/`.

### 3.3 Shell (`Header.tsx`, `Footer.astro`, `CommandPalette.tsx`, `CookieConsent.tsx`)
- **Header:** Brand mark + `NovaTools`, 6 concise 1-word suite links (`PDF`, `Image`, `Video`, `Docs`, `Diagrams`, `SVG`), compact `⌘K` search button, theme toggle.
- **Footer:** Single thin line (`© NovaTools` on left, `Privacy · Terms` on right).
- **CommandPalette:** Search input + `shortName` and `shortTag` rows only.
- **CookieConsent:** Compact single-row bar (`Cookies` · `Accept` · `Essential`) or clean consent toggle without paragraphs.

### 3.4 Homepage (`src/pages/index.astro` + `src/components/ActionHub.tsx`)
Replaces `HeroSection`, `AboutSection`, `ServicesSection`, `AdSenseAd`, and Security Ledger with a single focused component:
1. **Universal Drop Bar:** Drop any file (`PDF`, `PNG/JPG/WebP/SVG`, `MP4/WebM/MP3/WAV`, `MD/DOCX/CSV`) or click `Browse`. Immediately surfaces matching 1–2 word action buttons (`Merge`, `Split`, `Remove BG`, etc.) that store the file in IndexedDB and route straight to the tool.
2. **Visual Suite Strip:** 6 compact suite cards showing bespoke AI-generated 3D renders (`suite-*.png`) + 1-word label (`PDF`, `Image`, `Video`, `Docs`, `Diagrams`, `SVG`) + `All` reset pill.
3. **Action Grid:** Responsive grid of crisp tool tiles (icon + `shortName` + subtle `shortTag` when viewing `All`).

### 3.5 Suite & Tool Pages (`SuiteIndexLayout.astro`, `ToolPageLayout.astro`)
- **SuiteIndexLayout:** Clean suite header (bespoke 3D visual + 1-word title + count) + tool grid (`shortName` + icon only). Removes `pdf/index.astro` Architecture essay and all `AdSenseAd` blocks.
- **ToolPageLayout:** Slim breadcrumb (`Home / Suite / Action`) + `<h1>` (`tool.shortName`) + workspace `<slot />` + minimal related action chips (`shortName` only). Removes all 5 bottom explanation sections, `Privacy Ledger` pill, traffic-light window chrome, and `AdSenseAd`.

### 3.6 Workspaces (`WorkspaceUI.tsx` & `*Workspace.tsx`)
- `WorkspaceDropzone` suppresses verbose subtitles and badge chrome, displaying crisp upload icon + concise verb (`Drop PDF` / `Browse`).
- Wire `useHandoffFiles` across workspaces so homepage-dropped files load immediately.
- Strip explanatory `<p>` blocks across workspaces while keeping functional inputs, metrics, and error alerts intact.
