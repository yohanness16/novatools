# NovaTools — 100% Client-Side Media & PDF Productivity Suite

**NovaTools** is a high-performance, privacy-first web utility suite that provides document, image, video, and audio processing directly in the browser. 

All computations—including AI speech-to-text, video transcoding, PDF vector manipulation, and audio dynamics limiting—execute entirely on your local device using **WebAssembly (WASM)**, **Web Audio API**, **HTML5 Canvas**, and **Web Workers**.

> **Privacy Guarantee**: Zero file uploads, zero server bandwidth costs, no daily quotas, and complete data confidentiality. Your files never leave your computer or phone.

---

## 📑 Core Suites & Feature Breakdown

```
 NovaTools Architecture
 ├── 📄 PDF Suite (8 Tools)
 ├── 🖼️ Image Suite (5 Tools)
 ├── 🎬 Video & Audio Suite (7 Tools)
 └── ⚡ SVG Suite (1 Tool)
```

---

## 1. 📄 PDF Suite

| Tool | Route | What It Does | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Merge PDF** | `/pdf/merge` | Combines multiple PDF files into one document | Drag-and-drop page reordering, preserves bookmarks, links, and vector clarity. |
| **Split & Extract** | `/pdf/split` | Extracts custom page intervals or separates documents | Custom ranges (e.g. `1-3, 5, 8-12`), burst mode to download every page as a ZIP. |
| **Rotate PDF** | `/pdf/rotate` | Permanently fixes page orientation | 90°, 180°, 270° lossless rotation on individual pages or entire documents. |
| **Password Protect** | `/pdf/protect` | Encrypts PDFs with user passwords | Standard AES encryption compatible with Adobe Acrobat, Apple Preview, and browsers. |
| **Redact & Flatten** | `/pdf/redact-flatten` | Flattens interactive forms and annotations | Merges fillable form fields and layers into static non-editable vector output. |
| **PDF to Images** | `/pdf/pdf-to-images` | Converts PDF pages into high-res images | Lossless PNG and compact JPEG export at 1x, 2x, or 3x high-DPI resolution. |
| **Images to PDF** | `/pdf/images-to-pdf` | Compiles image collections into a PDF | Supports JPG, PNG, WebP, BMP, and GIF with custom margins and page formats (A4, Letter, Auto-Fit). |
| **PDF Page Numberer** | `/pdf/page-numberer` | Stamps page numbers and header/footers | 6-point alignment grid, formats (`"Page 1 of 10"`, `"- 1 -"`, Roman numerals `i, ii, iii`), skip cover pages option. |

---

## 2. 🖼️ Image Suite

| Tool | Route | What It Does | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **AI Background Remover** | `/image/background-remover` | Erases photo backgrounds in 1 click | In-browser subject segmentation, interactive split-screen diff slider, transparent PNG or custom studio backdrop colors. |
| **Image Converter** | `/image/converter` | Converts between modern and legacy formats | Converts in bulk between **WebP, AVIF, PNG, JPEG, BMP, and ICO** with adjustable quality. |
| **Smart Image Compressor** | `/image/compressor` | Shrinks file size with real-time visual diff | Interactive before/after split slider, live savings percentage counter (-80%), max dimension controls. |
| **Image Resizer** | `/image/resizer` | Scales photo dimensions | Exact pixel scaling with aspect ratio lock, percentage scale (25%-200%), and social media presets (Instagram, YouTube, X). |
| **EXIF & Privacy Scrubber** | `/image/exif-scrubber` | Cleans hidden metadata from photos | Inspects and strips GPS coordinates, camera model, lens metadata, and timestamps to protect location privacy. |

---

## 3. 🎬 Video & Audio Suite

| Tool | Route | What It Does | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **AI Subtitle Generator & Studio** | `/video/subtitle-generator` | Transcribes speech and edits subtitles | • **100+ Languages Supported** (Alphabetical A–Z registry including Amharic, Spanish, Arabic, French, etc.)<br>• **Whisper AI Speech Recognition** running locally in WebAssembly<br>• **1-Click High-Speed Translation** preserving millisecond timestamps<br>• **Multi-Track Studio Editor** with live video overlay and waveform sync<br>• **Exports**: `.SRT`, `.VTT`, `.TXT`, `.JSON`, and Multi-Track `.ZIP`. |
| **Audio Volume Booster** | `/video/audio-booster` | Amplifies quiet audio up to 300% (+12 dB) | Anti-clipping soft-knee dynamics limiter, EBU peak normalization, presets (*Speech Boost, Podcast Normalizer, Max Loudness*), live A/B comparison player, lossless 16-bit WAV export. |
| **Video to GIF Maker** | `/video/video-to-gif` | Converts video clips to animated GIFs | Custom frame rates (10, 15, 20, 24, 30 FPS), timeline trimming, width scaling (320px, 480px, 640px), 256-color palette quantization, and LZW byte stream encoding. |
| **Video Compressor** | `/video/compressor` | Reduces video file size | Hardware-accelerated Canvas & WebCodecs pipeline, presets (1080p, 720p, 480p), zero server upload wait times. |
| **Video Trimmer & Cutter** | `/video/trimmer` | Cuts segment intervals from videos | Dual-handle timeline range slider with millisecond precision and live playback preview. |
| **Extract Audio from Video** | `/video/audio-extractor` | Pulls soundtrack and audio out of video | Extracts crystal-clear lossless WAV or MP3 audio tracks with waveform visualization. |
| **Video Audio Remover (Muter)**| `/video/muter` | Strips background audio in 1 second | Completely removes audio channels while keeping original video visual quality untouched. |

---

## 4. ⚡ SVG Suite

| Tool | Route | What It Does | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **SVG Cleaner & React Exporter** | `/image/svg-optimizer` | Minifies SVG and generates React code | SVGO AST optimization, removes unneeded XML metadata/editor comments, and transforms raw SVG into clean React JSX components. |

---

## 🛠️ Technical Architecture & Under-the-Hood Stack

* **Frontend Framework**: Astro 5 (Static Site Generation for sub-50ms page loads) + React 19 interactive workspaces.
* **Styling & Design System**: Tailwind CSS with dark glassmorphic theme, zinc hierarchy (`#09090b`), glowing accents (`#6366f1` Indigo, `#10b981` Emerald), and Lucide Icons.
* **AI & Machine Learning**: `@xenova/transformers` (ONNX WebAssembly runtime in browser for Whisper ASR and neural vision models).
* **Document Engine**: `pdf-lib` & `pdfjs-dist` (Vector PDF composition, encryption, annotation flattening, and rasterization).
* **Audio Engine**: Web Audio API `OfflineAudioContext`, `BiquadFilterNode`, `GainNode`, and `DynamicsCompressorNode` for real-time DSP.
* **Video & Canvas**: HTML5 `<video>`, 2D `<canvas>`, WebCodecs, and custom LZW byte encoders for animated GIF compilation.
* **Archive Packaging**: `jszip` for client-side batch multi-file exports.

---

## 🌟 Key Value Proposition for Users

1. **🔒 Zero Privacy Risk**: Medical records, legal contracts, private photos, and confidential videos never touch third-party servers.
2. **⚡ Blazing Speed**: No upload/download latency for gigabyte-sized files; everything processes at local disk and CPU/GPU memory speeds.
3. **💸 Free & Uncapped**: No monthly subscription paywalls, no file size limits, and no daily conversion quotas.
4. **🌐 Offline Ready**: Once loaded, tools run smoothly even without an active internet connection.
