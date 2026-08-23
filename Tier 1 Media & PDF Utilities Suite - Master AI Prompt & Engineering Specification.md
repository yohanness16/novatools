# **Master AI System Prompt & Engineering Specification: NovaTools**

As an elite principal frontend engineer and UI/UX designer, the objective is to build NovaTools—a modern, high-performance, 100% client-side document and media manipulation suite. All computations, including video transcoding and PDF manipulation, execute entirely in the user's browser runtime using WebAssembly (WASM), Web Workers, and HTML5 Canvas.

# **1\. Executive Project Overview & Scope**

## **1.1 Product Vision**

NovaTools is a unified, privacy-first web utility suite providing instant document and media transformations directly in the browser. It combines functionality from various utility platforms into a minimalist, "AI-native" interface styled after high-end productivity tools like Linear and Raycast.

## **1.2 Core Scope of Features**

* **PDF Suite**: Merge, Split & Extract, Rotate, Sign, Password Protect, and Redact/Flatten.  
* **Image Suite**: Format Converter (WebP, PNG, JPEG, AVIF, HEIC), Smart Compressor with side-by-side comparison, Resizer, and EXIF Scrubber.  
* **Video & Audio Suite**: H.264/AAC Compression, Interactive Trimmer, Audio Extractor, and Video Muter.  
* **SVG Suite**: Cleaner & Minifier, and SVG-to-React/JSX Exporter.  
* **Monetization & Privacy**: CLS-Proof Ad slots, Ed25519 License Verification, and a "100% Client-Side" privacy badge.

# **2\. Technical Architecture & Worker Pipeline**

NovaTools utilizes a main thread for UI state (React 18\) and offloads heavy processing to dedicated Web Workers.

* **PDF Worker**: Powered by `pdf-lib` and `pdfjs-dist`.  
* **Image Worker**: Utilizes `heic2any` and WASM codecs.  
* **Video Worker**: Leverages `ffmpeg.wasm` for multithreaded transcoding.  
* **SVG Worker**: Employs `svgo` for AST-based optimization.

## **2.1 Technology Stack**

* **Framework**: React 18+ with TypeScript via Vite.  
* **Styling**: Tailwind CSS with custom design tokens.  
* **Icons**: Lucide React.  
* **Animation**: Framer Motion.  
* **Processing Libraries**: `pdf-lib`, `browser-image-compression`, `@ffmpeg/ffmpeg`, and `svgo`.

# **3\. UI/UX Design System: Modern "AI-Native" Aesthetic**

The interface follows a Zinc-based dark theme hierarchy with vibrant indigo and emerald accents.

## **3.1 Design Tokens & Colors**

* **Base Background**: \#09090b (zinc-950)  
* **Glass Surfaces**: rgba(24, 24, 27, 0.65)  
* **Subtle Borders**: \#27272a  
* **Accent Primary**: \#6366f1 (Indigo)  
* **Success Accent**: \#10b981 (Emerald)

## **3.2 Key Visual Components**

1. **Floating Frosted Header**: Includes a pulsing "100% Private" status badge.  
2. **Command Palette (Cmd+K)**: Instant fuzzy-search for tool navigation.  
3. **Universal Interactive Dropzone**: Gradient-bordered area with ambient glow.  
4. **Interactive Workspaces**: Visual diff sliders for images and grid-based thumbnails for PDF management.  
5. **Floating Action Dock**: Sticky bottom bar for batch processing and quality controls.

# **4\. Complete Implementation Code Blueprints**

## **4.1 Tailwind & Configuration Setup**

// tailwind.config.js

module.exports \= {

  darkMode: 'class',

  content: \['./index.html', './src/\*\*/\*.{js,ts,jsx,tsx}'\],

  theme: {

    extend: {

      colors: {

        background: '\#09090b',

        surface: {

          DEFAULT: '\#121215',

          glass: 'rgba(24, 24, 27, 0.65)',

          elevated: '\#1c1c20',

        },

      },

      fontFamily: {

        sans: \['Geist', 'Inter', 'system-ui', 'sans-serif'\],

        mono: \['Geist Mono', 'JetBrains Mono', 'monospace'\],

      },

      boxShadow: {

        'glow-sm': '0 0 16px \-4px rgba(99, 102, 241, 0.25)',

        'glow-lg': '0 0 32px \-6px rgba(99, 102, 241, 0.35)',

        'glass-edge': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',

      },

    },

  },

};

## **4.2 PDF Engine (`src/engines/pdfEngine.ts`)**

import { PDFDocument, degrees, rgb } from 'pdf-lib';

import \* as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc \= '/workers/pdf.worker.min.js';

export class PdfEngine {

  static async mergePdfs(pdfBuffers: ArrayBuffer\[\]): Promise\<Uint8Array\> {

    const mergedDoc \= await PDFDocument.create();

    for (const buffer of pdfBuffers) {

      const doc \= await PDFDocument.load(buffer, { ignoreEncryption: true });

      const copiedPages \= await mergedDoc.copyPages(doc, doc.getPageIndices());

      copiedPages.forEach((page) \=\> mergedDoc.addPage(page));

    }

    return await mergedDoc.save();

  }

  static async rotatePages(sourceBuffer: ArrayBuffer, rotations: Record\<number, number\>): Promise\<Uint8Array\> {

    const doc \= await PDFDocument.load(sourceBuffer);

    Object.entries(rotations).forEach((\[pageIdxStr, rotationAngle\]) \=\> {

      const pageIndex \= parseInt(pageIdxStr, 10);

      const page \= doc.getPage(pageIndex);

      const currentRotation \= page.getRotation().angle;

      page.setRotation(degrees((currentRotation \+ rotationAngle) % 360));

    });

    return await doc.save();

  }

}

## **4.3 Video & Audio Engine (`src/engines/videoEngine.ts`)**

import { FFmpeg } from '@ffmpeg/ffmpeg';

import { fetchFile, toBlobURL } from '@ffmpeg/util';

export class VideoEngine {

  private static ffmpeg: FFmpeg | null \= null;

  private static isLoaded \= false;

  static async compressVideo(videoBlob: Blob, crf: number \= 28, maxScaleWidth: number \= 1280): Promise\<Blob\> {

    const ffmpeg \= await this.load();

    await ffmpeg.writeFile('input.mp4', await fetchFile(videoBlob));

    await ffmpeg.exec(\[

      '-i', 'input.mp4',

      '-vf', \`scale='min(${maxScaleWidth},iw)':-2\`,

      '-vcodec', 'libx264',

      '-crf', String(crf),

      '-preset', 'ultrafast',

      'output.mp4'

    \]);

    const data \= (await ffmpeg.readFile('output.mp4')) as Uint8Array;

    return new Blob(\[data.buffer\], { type: 'video/mp4' });

  }

}

# **5\. File Structure Blueprint**

* **public/**: Contains WASM workers and headers for COOP/COEP.  
* **src/engines/**: Business logic for PDF, Image, Video, and SVG processing.  
* **src/components/**: UI elements (Header, Dropzone, CommandPalette, ActionDock).  
* **src/components/workspaces/**: Specialized editors for each file type.  
* **src/lib/**: Utility functions and Ed25519 licensing logic.

# **6\. Execution Steps for the AI Developer**

1. **Initialize Repo**: Scaffold project using Vite and React-TS template.  
2. **Install Core Dependencies**: Add processing libraries (`pdf-lib`, `@ffmpeg/ffmpeg`, `svgo`) and UI libraries (`lucide-react`, `framer-motion`).  
3. **Configure Environment**: Set up dark theme tokens and Cross-Origin Isolation headers.  
4. **Implement Engines**: Code the core processing logic for each media type within the `engines` directory.  
5. **Construct UI**: Build the interactive glass components and workspaces.  
6. **Integrate Monetization**: Deploy the license verification modal and ad containers.  
7. **Deploy**: Push static assets to Cloudflare Pages or Vercel.

