# NovaTools — Master UI Redesign Prompt

> Paste this whole document into Claude Code / Cursor / your coding agent as the design brief.
> **Scope: visual design and layout only. Do not touch business logic, WASM pipelines, routing, or state management.**

---

## 0. Brief, in one paragraph

NovaTools is a 100%-client-side media/PDF productivity suite (21 tools across PDF, Image, Video/Audio, SVG). Everything runs locally in WASM — no uploads, no servers, no quotas. The UI must *feel* like that promise: fast, private, industrial-grade, precise. The target reference points are **Google Flow / Google Labs product surfaces** and **enterprise cloud consoles (AWS Console, Azure Portal, Vercel, Linear)** — not a landing-page-style "AI SaaS" dashboard. Reject: rounded gradient blobs, glassmorphic cards with glowing purple/indigo blur, centered hero with big fuzzy headline, emoji-as-icons, generic feature-grid-of-3-cards. This is a **tool**, not a pitch.

---

## 1. What "generic AI-looking" means here — explicitly ban these

Before designing anything, rule out the current defaults already in the codebase and in most AI-generated dashboards:

- ❌ Dark **glassmorphic** panels with soft indigo/emerald glow (`#6366f1`, `#10b981`) — this is the current NovaTools look and reads as templated.
- ❌ Backdrop-blur cards floating over a gradient mesh background.
- ❌ Emoji used as section icons (📄🖼️🎬⚡) — replace with a real icon system.
- ❌ Centered hero: giant headline + subhead + two pill buttons + trust-logo row.
- ❌ Feature grid of 3–6 identical rounded cards with an icon-on-top, title, one-line description.
- ❌ Bento-grid dashboards with mismatched card sizes just for visual variety.
- ❌ Purple-to-blue or pink-to-orange gradient text/buttons.
- ❌ Rounded-everything (16–24px radii on every element) with no sharp edge anywhere.

If a screen you design could be mistaken for a generic "AI startup" template, revise it.

---

## 2. Reference direction: console, not landing page

Think of NovaTools less like a marketing site and more like a **workbench** — closer to:
- **Google Flow / Labs**: dense but calm dark canvas, generous negative space around the *actual work surface*, minimal chrome, tools presented as a sober grid or list rather than marketing cards, typography does the talking instead of color.
- **AWS Console / Azure Portal / GCP Console**: left rail for navigation between services, breadcrumb + service name as page header, content area is function-first (upload zone, settings panel, preview pane), status and system feedback treated as first-class UI (not toasts that vanish).
- **Linear / Vercel dashboard**: restrained monochrome base, one deliberate accent used sparingly (not as decoration, but as a status/action signal), sharp hairlines instead of glow/shadow to separate regions.

The unifying idea: **structure over decoration.** Every visual element should either help the user understand where they are, what a tool does, or what state their file is in — not create mood.

---

## 3. Design token system (define these first, derive everything else from them)

### Color — pick ONE of these two directions, do not blend them

**Direction A — Console Light** (Azure/GCP console feel, best for a "professional tool" read)
- `--bg-canvas: #FAFAFA` (page background)
- `--bg-surface: #FFFFFF` (panels, cards)
- `--bg-sunken: #F1F2F4` (input wells, drop zones, code/preview areas)
- `--border-hairline: #E2E4E8`
- `--text-primary: #16181D`
- `--text-secondary: #5B616E`
- `--accent: #1A56DB` (single functional blue — used ONLY for primary actions, active nav, progress, links — never decorative)
- `--accent-subtle: #EAF1FE` (accent tint for selected states)
- `--success: #146C43` / `--warning: #92600B` / `--danger: #B3261E` (desaturated, not neon)

**Direction B — Console Dark** (Google Flow feel, best for a "creative tool" read)
- `--bg-canvas: #0B0C0F`
- `--bg-surface: #131418`
- `--bg-sunken: #1B1D22`
- `--border-hairline: #2A2D33` (hairline, not glow — no box-shadow blur for separation)
- `--text-primary: #ECEDEF`
- `--text-secondary: #8B8F98`
- `--accent: #4F8CFF` (or your indigo, but flat — no gradient, no blur halo)
- `--accent-subtle: #16233F`
- `--success: #3FBE73` / `--warning: #E0A93E` / `--danger: #F0564B`

Rule: **one accent color, used with intent** (primary CTA, active state, progress bars, links, focus ring). Everything else is neutral grays. No secondary "emerald" accent competing with the primary — pick one.

### Typography
- Display/UI face: a **grotesque/geometric sans** with real personality at small sizes — e.g. **Inter, IBM Plex Sans, or Geist** (not the same "Inter for everything" if you want the console-native feel — Geist or IBM Plex Sans reads more "cloud console").
- Monospace face for file names, byte sizes, technical readouts, timestamps, coordinates: **IBM Plex Mono, JetBrains Mono, or Berkeley Mono**. Use this deliberately anywhere a number or filename appears — it's the detail that makes a UI feel engineered rather than templated.
- Type scale should be tight and utilitarian: page titles ~20–24px semibold, section labels ~13px uppercase with letter-spacing (used sparingly, only for true section headers — not on every card), body ~14px, captions/metadata ~12px mono.
- No large decorative display serif anywhere. This is not editorial content.

### Layout system
- Base unit: 4px grid. Panels, inputs, and buttons align to it strictly — this precision reads as "engineered."
- Radius: small and consistent — **6–8px** on cards/buttons, **4px** on inputs/chips. Not 0 (too brutalist for a tool people drop files into), not 16px+ (too soft/AI-generic).
- Shadows: none-to-minimal. Prefer **1px hairline borders** to separate surfaces over drop shadows. If a shadow is used (e.g. a modal), keep it tight and low-opacity — no ambient glow.
- Density: console-dense, not marketing-airy. Reduce vertical whitespace between functional elements versus a typical landing page — but keep generous margin around the *primary work surface* (drop zone / canvas / preview) so the file itself is what draws the eye.

---

## 4. Global structure

```
┌─────────────────────────────────────────────────────────┐
│ Top bar: wordmark (small, left) · global search (⌘K)    │
│          · suite switcher · theme toggle · (no auth CTA  │
│          needed — no server, say so quietly if at all)   │
├───────────┬───────────────────────────────────────────────┤
│           │  Breadcrumb: PDF Suite / Merge PDF            │
│  Left     │  ─────────────────────────────────────────── │
│  rail:    │                                                │
│  4 suites │   [ Work surface — drop zone / file list /    │
│  as icon  │     canvas / settings panel — tool-specific ] │
│  groups,  │                                                │
│  each     │   Right-hand or below: contextual settings    │
│  expands  │   panel (options relevant to THIS tool only,  │
│  to its   │   not a generic sidebar)                       │
│  tool     │                                                │
│  list     │                                                │
└───────────┴───────────────────────────────────────────────┘
```

- **Left rail**, not a horizontal mega-nav. Four groups (PDF, Image, Video & Audio, SVG) as icon + label; clicking expands/reveals the tool list for that group (accordion or flyout — pick one, be consistent). This is the single biggest departure from "AI landing page" and the strongest console signal.
- **Breadcrumb-as-title**: every tool page's header is `Suite / Tool Name`, small and functional, not a big marketing headline.
- **No hero section on tool pages.** The drop zone / work surface IS the hero. Make it the largest, most visually resolved element on the page — precise dashed or hairline border, clear affordance text in the user's vocabulary ("Drop PDFs here, or browse files" not "Get Started").
- Homepage (`/`) is the one place a slightly more composed layout is earned — but keep it a **catalog/index**, styled like a console's service catalog (search + filterable grid of tool tiles with monochrome icons), not a marketing hero + feature grid.

---

## 5. Iconography

- Replace all emoji with a proper icon set: **Lucide** (already in stack) is fine, but use it consistently at one weight/size, monochrome (`text-secondary` at rest, `accent` on hover/active) — never colored icon chips.
- Each tool gets one Lucide icon, used identically everywhere that tool is referenced (rail, catalog, breadcrumb) — icon = identity, not decoration.

---

## 6. Signature element (pick one, execute it well)

Choose one distinguishing detail that recurs across the whole product and would be recognizable as *NovaTools*, not "a Claude-generated tool site." Options, pick the one that fits your chosen color direction:

1. **The privacy ledger strip** — a persistent, thin monospace status line pinned to the bottom or top of the work surface reading something like `0 bytes uploaded · 100% local · <processing/idle>` that updates live as a tool runs. This directly encodes the product's core promise as UI, not copy.
2. **Local-processing meter** — instead of a generic spinner/progress bar, a small waveform-or-block meter styled like a system resource monitor (console-native, ties to "runs on your CPU" story).
3. **File chip system** — every file, at every stage, renders as a consistent monospace chip (`filename.pdf · 2.4 MB · 3 pages`) that travels visually from drop zone → settings → output, so the user always sees the object they're manipulating rendered the same way.

Pick one. Use it everywhere. Do not do all three.

---

## 7. Per-suite notes (content-specific, not generic)

- **PDF Suite**: work surface should look like a **page-strip / thumbnail rail** (this is genuinely how PDF tools differ from image tools) — horizontal or grid thumbnails with page numbers in mono type, drag handles as plain lines not colorful icons.
- **Image Suite**: work surface is a **before/after split** (compressor, background remover) — keep the divider handle thin and precise, a hairline with a small grip, not a fat rounded pill.
- **Video/Audio Suite**: work surface is a **timeline** — waveform in monochrome with the single accent color marking selection/trim range; transport controls (play/trim handles) styled like a DAW, not like a media player app icon set.
- **SVG Suite**: work surface is a **code + preview split** — monospace code pane (like a console log panel) next to rendered SVG, reinforcing "engineering tool" identity.

---

## 8. Motion

- Minimal. Panel expand/collapse in the left rail: 120–160ms ease-out. Progress indication: continuous, not bouncy. No page-load choreography, no scroll-reveal fade-ups, no hover-lift-and-glow on cards.
- The one place motion can be "a moment": the transition from empty work surface → file loaded (e.g. thumbnail rail assembling itself). Keep it quick and mechanical, not springy/playful.

---

## 9. Copy tone

- Every label is what the user controls, in plain terms: "Drop files here", "Merge order", "Download ZIP" — not "Get Started", "Unlock", "Supercharge".
- Status/empty states speak in the interface's voice: "No file loaded yet." / "3 pages ready to merge." — factual, not cheerful marketing voice.
- Keep the privacy promise present as **functional UI copy** (the ledger strip, or a single quiet line near the drop zone), not as a marketing banner with a lock emoji.

---

## 10. Process for the agent executing this

1. Pick Direction A or B (light console vs dark console) and state the choice.
2. Build the token system (Section 3) as CSS variables / Tailwind theme config first — no page work until this exists.
3. Build the global shell (top bar + left rail + breadcrumb) once, shared across all 21 tool routes.
4. Pick and implement the signature element (Section 6) inside the shared work-surface component so it's consistent everywhere for free.
5. Re-skin one tool page per suite (Merge PDF, Compressor, Video Trimmer, SVG Optimizer) as reference implementations.
6. Self-critique against Section 1's ban list before rolling the pattern out to all remaining tool pages.

**No logic changes.** All WASM/processing code, routes, and state stay exactly as-is — this is a visual re-skin using the existing component tree wherever possible.
