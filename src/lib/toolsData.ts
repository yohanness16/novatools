export interface ToolMeta {
  id: string;
  slug: string;
  name: string;
  category: 'pdf' | 'image' | 'video' | 'svg';
  categoryLabel: string;
  description: string;
  longDescription: string;
  iconName: string;
  badge?: string;
  path: string;
  keywords: string[];
  features: string[];
  howToSteps: { step: number; title: string; desc: string }[];
  faqs: { question: string; answer: string }[];
}

export const TOOLS: ToolMeta[] = [
  // PDF SUITE
  {
    id: 'merge-pdf',
    slug: 'merge',
    name: 'Merge PDF',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Combine multiple PDF documents into a single organized file in seconds.',
    longDescription: 'Merge unlimited PDF documents right in your browser with zero file uploads. Drag and reorder pages, combine reports, and download instantly.',
    iconName: 'Layers',
    badge: 'Popular',
    path: '/pdf/merge',
    keywords: ['merge pdf', 'combine pdfs', 'join pdf files', 'pdf binder', 'merge documents'],
    features: [
      '100% Client-Side: Zero server uploads, total confidentiality',
      'Drag-and-drop file reordering before merging',
      'Preserves original vector quality, bookmarks, and links',
      'No file size limits or daily quotas'
    ],
    howToSteps: [
      { step: 1, title: 'Upload PDF Files', desc: 'Select or drag-and-drop multiple PDF files into the dropzone.' },
      { step: 2, title: 'Reorder Files', desc: 'Arrange the documents in your desired sequential order.' },
      { step: 3, title: 'Merge & Download', desc: 'Click "Merge PDFs" to instantly compile and download your unified document.' }
    ],
    faqs: [
      { question: 'Is it safe to merge confidential documents here?', answer: 'Yes! NovaTools operates 100% in your local browser using WebAssembly. Your files never leave your device.' },
      { question: 'Are there any limits on the number of PDFs?', answer: 'No artificial limits! You can merge as many files as your device memory allows.' }
    ]
  },
  {
    id: 'split-pdf',
    slug: 'split',
    name: 'Split & Extract PDF',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Extract specific page ranges or burst all pages into individual files.',
    longDescription: 'Separate a large PDF into individual page files or extract custom page intervals (e.g. 1-5, 8, 11-14) directly on your device.',
    iconName: 'Scissors',
    path: '/pdf/split',
    keywords: ['split pdf', 'extract pdf pages', 'separate pdf', 'pdf page extractor'],
    features: [
      'Flexible page range selection (e.g., 1-3, 5, 7-10)',
      'Burst mode to extract all pages into a downloadable ZIP archive',
      'Instant client-side processing without uploading to remote servers'
    ],
    howToSteps: [
      { step: 1, title: 'Choose PDF', desc: 'Upload the PDF document you want to split or extract pages from.' },
      { step: 2, title: 'Define Range', desc: 'Type custom page ranges or choose to extract every page separately.' },
      { step: 3, title: 'Download Output', desc: 'Save the extracted pages as new PDFs or a packaged ZIP.' }
    ],
    faqs: [
      { question: 'How do I specify multiple ranges?', answer: 'You can enter comma-separated ranges such as "1-4, 7, 9-12".' }
    ]
  },
  {
    id: 'rotate-pdf',
    slug: 'rotate',
    name: 'Rotate PDF Pages',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Rotate individual pages or entire documents 90°, 180°, or 270° permanently.',
    longDescription: 'Fix upside-down or sideways scanned pages. View visual page thumbnails, rotate specific pages or all pages at once, and export the corrected PDF.',
    iconName: 'RotateCw',
    path: '/pdf/rotate',
    keywords: ['rotate pdf', 'turn pdf pages', 'fix upside down pdf', 'pdf orientation'],
    features: [
      'Rotate all pages or individual target pages by 90°, 180°, or 270°',
      'Interactive visual thumbnail inspector',
      'Saves orientation changes permanently to PDF metadata'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Document', desc: 'Select the PDF with orientation issues.' },
      { step: 2, title: 'Rotate Pages', desc: 'Click the rotation buttons on individual pages or use the global rotate control.' },
      { step: 3, title: 'Apply & Save', desc: 'Download the newly aligned PDF file.' }
    ],
    faqs: [
      { question: 'Does rotating reduce text clarity?', answer: 'Not at all. The PDF internal rotation matrix is updated losslessly without re-rendering or degrading vector text.' }
    ]
  },
  {
    id: 'protect-pdf',
    slug: 'protect',
    name: 'Password Protect PDF',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Encrypt documents with standard AES password protection and restrictions.',
    longDescription: 'Secure your sensitive PDF files with user passwords. Prevent unauthorized opening, copying, or printing directly inside your browser.',
    iconName: 'Lock',
    badge: 'Security',
    path: '/pdf/protect',
    keywords: ['protect pdf', 'encrypt pdf', 'lock pdf with password', 'secure pdf'],
    features: [
      'Standard PDF encryption compatible with all PDF readers (Adobe Acrobat, Apple Preview, browsers)',
      'Zero transmission of passwords or files over the internet',
      'Instant client-side key generation'
    ],
    howToSteps: [
      { step: 1, title: 'Select PDF', desc: 'Pick the PDF document you wish to encrypt.' },
      { step: 2, title: 'Set Password', desc: 'Enter and confirm a strong access password.' },
      { step: 3, title: 'Lock & Download', desc: 'Export the password-protected document.' }
    ],
    faqs: [
      { question: 'Can NovaTools recover my password if I forget it?', answer: 'No. Because all encryption happens locally on your computer, no passwords or keys are ever stored on any server.' }
    ]
  },
  {
    id: 'redact-flatten-pdf',
    slug: 'redact-flatten',
    name: 'Redact & Flatten PDF',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Flatten interactive form fields, comments, and securely rasterize sensitive content.',
    longDescription: 'Lock form values permanently and flatten layers into a non-editable document to prevent tampering or unintended edits before distribution.',
    iconName: 'EyeOff',
    path: '/pdf/redact-flatten',
    keywords: ['flatten pdf', 'lock pdf form', 'make pdf non editable', 'redact pdf'],
    features: [
      'Flattens fillable form fields into static text',
      'Removes interactive layers and hidden form metadata',
      'Prevents post-signature modifications'
    ],
    howToSteps: [
      { step: 1, title: 'Upload File', desc: 'Load the completed PDF form or layered document.' },
      { step: 2, title: 'Flatten Layers', desc: 'Choose flattening options and process the document.' },
      { step: 3, title: 'Export', desc: 'Download the secured, flattened PDF.' }
    ],
    faqs: [
      { question: 'What does flattening a PDF do?', answer: 'Flattening merges all form fields, annotations, and vector layers into the base document so they can no longer be edited.' }
    ]
  },
  {
    id: 'pdf-to-images',
    slug: 'pdf-to-images',
    name: 'PDF to Images',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Convert PDF pages into high-resolution PNG or JPEG graphics.',
    longDescription: 'Render each page of a PDF document into crystal-clear images. Download all pages bundled in a ZIP file or grab individual page images.',
    iconName: 'FileImage',
    path: '/pdf/pdf-to-images',
    keywords: ['pdf to png', 'pdf to jpg', 'convert pdf to image', 'extract images from pdf'],
    features: [
      'Render pages at 1x, 2x, or 3x high-DPI resolution',
      'Support for PNG (lossless) and JPEG (compact)',
      'Batch download as a convenient ZIP archive'
    ],
    howToSteps: [
      { step: 1, title: 'Upload PDF', desc: 'Select the PDF document to convert.' },
      { step: 2, title: 'Select Format & Scale', desc: 'Choose PNG or JPEG and your preferred DPI resolution scale.' },
      { step: 3, title: 'Render & Download', desc: 'Download individual page snapshots or a packaged ZIP file.' }
    ],
    faqs: [
      { question: 'Will text remain sharp in the converted images?', answer: 'Yes! Selecting 2x or 3x scale renders vector text with razor-sharp anti-aliasing.' }
    ]
  },
  {
    id: 'images-to-pdf',
    slug: 'images-to-pdf',
    name: 'Images to PDF',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Convert multiple JPG, PNG, and WebP images into a single PDF document.',
    longDescription: 'Compile photo collections, scanned receipts, or document photos into a clean, paginated PDF with customizable orientation and page sizes.',
    iconName: 'FilePlus',
    path: '/pdf/images-to-pdf',
    keywords: ['jpg to pdf', 'png to pdf', 'images to pdf converter', 'photo to pdf'],
    features: [
      'Support for JPEG, PNG, WebP, BMP, and GIF',
      'Adjustable page sizes (A4, Letter, Auto-Fit)',
      'Custom margin spacing (None, Small, Normal)',
      'Reorder images before generating PDF'
    ],
    howToSteps: [
      { step: 1, title: 'Add Images', desc: 'Drag-and-drop all your image files into the workspace.' },
      { step: 2, title: 'Configure Layout', desc: 'Set page size (A4, Letter, Fit), margin width, and sort order.' },
      { step: 3, title: 'Generate PDF', desc: 'Compile all images into one clean PDF document.' }
    ],
    faqs: [
      { question: 'Can I reorder images before creating the PDF?', answer: 'Yes, simply use the reorder buttons or drag cards into your desired sequence.' }
    ]
  },

  // IMAGE SUITE
  {
    id: 'background-remover',
    slug: 'background-remover',
    name: 'AI Background Remover',
    category: 'image',
    categoryLabel: 'Image Suite',
    description: 'Erase image backgrounds with 1 click and export crisp transparent PNGs.',
    longDescription: 'Isolate people, products, animals, and graphics from photos in your browser. Replace backgrounds with pure transparency, studio colors, or artistic blur with zero server uploads.',
    iconName: 'Scissors',
    badge: 'AI Powered',
    path: '/image/background-remover',
    keywords: ['remove background', 'background remover', 'transparent png maker', 'cut out image', 'remove bg online', 'photo cutout'],
    features: [
      '1-Click automated background removal in the browser',
      'Interactive side-by-side visual diff slider',
      'Replace background with transparent alpha, solid studio colors, or blur',
      'Lossless HD PNG export with zero cloud uploads'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Image', desc: 'Select any PNG, JPEG, WebP, or AVIF photo.' },
      { step: 2, title: 'Inspect & Customize', desc: 'Drag the split-screen slider to inspect the cutout and choose a backdrop color.' },
      { step: 3, title: 'Download HD PNG', desc: 'Save your isolated subject as a transparent PNG or high-res graphic.' }
    ],
    faqs: [
      { question: 'Is my photo uploaded to an external server?', answer: 'No! All segmentation and alpha mask compositing execute 100% inside your browser using HTML5 Canvas.' },
      { question: 'What image types work best?', answer: 'Photos with clear subjects (people, ecommerce products, vehicles, animals, logos) produce razor-sharp edges.' }
    ]
  },
  {
    id: 'image-converter',
    slug: 'converter',
    name: 'Image Converter',
    category: 'image',
    categoryLabel: 'Image Suite',
    description: 'Convert between PNG, JPEG, WebP, AVIF, BMP, and ICO formats instantly.',
    longDescription: 'Convert image files in bulk between modern web formats like WebP and AVIF, or traditional JPEG and PNG formats. Set quality levels per format.',
    iconName: 'Repeat',
    badge: 'Essential',
    path: '/image/converter',
    keywords: ['image converter', 'png to webp', 'webp to jpg', 'avif converter', 'convert images online'],
    features: [
      'Output formats: WebP, PNG, JPEG, AVIF, BMP, ICO',
      'Batch multi-file conversion simultaneously',
      'Adjustable compression quality slider',
      'Fast HTML5 Canvas and WASM pipeline'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Images', desc: 'Select one or more images from your computer or phone.' },
      { step: 2, title: 'Pick Target Format', desc: 'Select WebP, PNG, JPEG, AVIF, BMP, or ICO.' },
      { step: 3, title: 'Convert & Download', desc: 'Download converted files individually or together in a ZIP.' }
    ],
    faqs: [
      { question: 'Why should I convert to WebP or AVIF?', answer: 'WebP and AVIF offer 30% to 50% smaller file sizes than standard JPEG/PNG while maintaining superior visual fidelity.' }
    ]
  },
  {
    id: 'image-compressor',
    slug: 'compressor',
    name: 'Smart Image Compressor',
    category: 'image',
    categoryLabel: 'Image Suite',
    description: 'Compress images with an interactive side-by-side visual diff slider.',
    longDescription: 'Shrink image file sizes by up to 80% without noticeable quality loss. Compare original vs compressed image in real time with our dual-slider viewport.',
    iconName: 'Minimize2',
    badge: 'Interactive Diff',
    path: '/image/compressor',
    keywords: ['compress image', 'shrink png', 'jpeg compressor', 'reduce photo size', 'image optimizer'],
    features: [
      'Interactive Split-Screen Slider: Compare Original vs Compressed in real-time',
      'Live size savings meter (e.g. -72% saved)',
      'Fine-tuned quality and max dimension constraints',
      'Zero server upload—all compression occurs in memory'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Image', desc: 'Drop an image to compress.' },
      { step: 2, title: 'Tune Quality', desc: 'Drag the quality slider and inspect the side-by-side visual diff.' },
      { step: 3, title: 'Download', desc: 'Save your ultra-optimized lightweight image.' }
    ],
    faqs: [
      { question: 'How does the side-by-side comparison work?', answer: 'Move the visual splitter handle left and right to inspect the exact pixel clarity before downloading.' }
    ]
  },
  {
    id: 'image-resizer',
    slug: 'resizer',
    name: 'Image Resizer',
    category: 'image',
    categoryLabel: 'Image Suite',
    description: 'Resize dimensions by exact pixels or percentage with aspect ratio lock.',
    longDescription: 'Quickly resize photos and graphics for social media, email newsletters, or web publishing. Maintain exact aspect ratios or scale with custom presets.',
    iconName: 'Maximize2',
    path: '/image/resizer',
    keywords: ['resize image', 'scale photo', 'change image dimensions', 'pixel resizer'],
    features: [
      'Pixel width/height scaling with aspect ratio lock',
      'Percentage scaling (25%, 50%, 75%, 150%, 200%)',
      'Social media presets (Instagram, Twitter/X, YouTube, LinkedIn)',
      'High-quality bicubic interpolation'
    ],
    howToSteps: [
      { step: 1, title: 'Select Image', desc: 'Load the image you wish to resize.' },
      { step: 2, title: 'Set Dimensions', desc: 'Enter custom pixels or select a preset scale.' },
      { step: 3, title: 'Export', desc: 'Download your resized image with clean dimensions.' }
    ],
    faqs: [
      { question: 'Will resizing distort my image?', answer: 'With "Lock Aspect Ratio" checked, the height will automatically calculate to keep your image proportion intact.' }
    ]
  },
  {
    id: 'exif-scrubber',
    slug: 'exif-scrubber',
    name: 'EXIF & Metadata Scrubber',
    category: 'image',
    categoryLabel: 'Image Suite',
    description: 'Inspect hidden metadata (GPS, camera, date) and scrub it for privacy.',
    longDescription: 'Digital photos store hidden metadata including exact GPS coordinates, camera model, lens parameters, and timestamps. Strip all EXIF data before sharing online.',
    iconName: 'ShieldCheck',
    badge: 'Privacy',
    path: '/image/exif-scrubber',
    keywords: ['remove exif', 'scrub photo metadata', 'delete gps from photo', 'image privacy cleaner'],
    features: [
      'Inspect embedded EXIF tags (GPS coordinates, camera model, ISO, shutter speed)',
      '1-Click metadata scrubbing',
      'Protects your home location and personal privacy from social sharing'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Photo', desc: 'Choose any JPEG, PNG, or TIFF photo.' },
      { step: 2, title: 'Review EXIF Data', desc: 'Inspect location, device tags, and metadata found in the file.' },
      { step: 3, title: 'Scrub & Download', desc: 'Download a clean, sanitised image completely free of private tags.' }
    ],
    faqs: [
      { question: 'Why should I remove EXIF data?', answer: 'Photos taken with smartphones often contain precise latitude/longitude coordinates of where you live or work. Scrubbing prevents privacy leaks.' }
    ]
  },
  {
    id: 'svg-optimizer',
    slug: 'svg-optimizer',
    name: 'SVG Cleaner & React Exporter',
    category: 'svg',
    categoryLabel: 'SVG Suite',
    description: 'Minify SVG code, remove editor junk, and export clean React/JSX components.',
    longDescription: 'Optimize raw vector graphics from Figma, Illustrator, or Sketch. Remove unneeded XML namespaces, comments, and metadata, or transform directly into React JSX.',
    iconName: 'Code',
    badge: 'Developer Tool',
    path: '/image/svg-optimizer',
    keywords: ['svg optimizer', 'svgo online', 'svg to react', 'svg to jsx', 'minify svg'],
    features: [
      'AST-based SVG optimization (removes comments, doctype, editor tags, unused IDs)',
      'Live code comparison and byte savings calculator',
      '1-Click Export to React/JSX Component with TypeScript props',
      'Tailwind CSS class integration ready'
    ],
    howToSteps: [
      { step: 1, title: 'Paste or Upload SVG', desc: 'Paste raw SVG code or upload an `.svg` file.' },
      { step: 2, title: 'Optimize', desc: 'Toggle minification options and see instant size reductions.' },
      { step: 3, title: 'Copy or Download', desc: 'Copy optimized SVG or export clean React JSX code.' }
    ],
    faqs: [
      { question: 'Can I use the React JSX code directly in Next.js or Astro?', answer: 'Yes! The exported JSX uses clean standard React syntax with camelCased attributes.' }
    ]
  },

  // VIDEO & AUDIO SUITE
  {
    id: 'video-compressor',
    slug: 'compressor',
    name: 'Video Compressor',
    category: 'video',
    categoryLabel: 'Video Suite',
    description: 'Compress MP4, WebM, and MOV video clips with client-side resolution scaling.',
    longDescription: 'Reduce video file sizes directly on your computer without uploading large video files to external servers. Adjust bitrate, scale resolution (1080p, 720p, 480p), and preview output.',
    iconName: 'Film',
    badge: 'Client-Side',
    path: '/video/compressor',
    keywords: ['compress video', 'reduce mp4 size', 'client side video compressor', 'shrink video file'],
    features: [
      'In-browser compression using HTML5 Canvas & WebCodecs pipeline',
      'Preset targets: High (1080p), Medium (720p), Compact (480p)',
      'No file size caps and zero server bandwidth wait times'
    ],
    howToSteps: [
      { step: 1, title: 'Select Video File', desc: 'Choose an MP4, WebM, or MOV video.' },
      { step: 2, title: 'Choose Target Quality', desc: 'Select desired resolution and target compression ratio.' },
      { step: 3, title: 'Process & Download', desc: 'Download your lightweight compressed video file.' }
    ],
    faqs: [
      { question: 'How can video compress without uploading to a server?', answer: 'Modern browsers provide powerful hardware-accelerated video rendering pipelines that allow video compression locally in your browser.' }
    ]
  },
  {
    id: 'video-trimmer',
    slug: 'trimmer',
    name: 'Video Trimmer & Cutter',
    category: 'video',
    categoryLabel: 'Video Suite',
    description: 'Cut and trim video clips interactively with millisecond precision.',
    longDescription: 'Trim unwanted beginnings or endings of video clips with an intuitive visual timeline slider. Preview your exact cut before exporting.',
    iconName: 'Clock',
    path: '/video/trimmer',
    keywords: ['trim video', 'cut video online', 'video clip cutter', 'video trimmer'],
    features: [
      'Interactive dual-handle range timeline slider',
      'Millisecond timestamp precision',
      'Live synchronized video preview playback',
      'Audio mute option on export'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Video', desc: 'Load the video clip you want to cut.' },
      { step: 2, title: 'Adjust Range', desc: 'Drag the start and end sliders to set your trim markers.' },
      { step: 3, title: 'Export Clip', desc: 'Export and download the trimmed segment.' }
    ],
    faqs: [
      { question: 'Is the original video quality retained?', answer: 'Yes, video frames within the selected range are rendered at original resolution.' }
    ]
  },
  {
    id: 'audio-extractor',
    slug: 'audio-extractor',
    name: 'Extract Audio from Video',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Extract crystal-clear MP3 or WAV audio tracks from any video file.',
    longDescription: 'Pull the background music, voiceover, or soundtrack out of MP4, WebM, or MOV video files into a standalone audio file in seconds.',
    iconName: 'Music',
    path: '/video/audio-extractor',
    keywords: ['extract audio from video', 'mp4 to mp3', 'video to audio converter', 'extract soundtrack'],
    features: [
      'Extract audio as WAV (Lossless) or MP3 / AAC',
      'Audio waveform visualizer preview',
      'Fast client-side decoding using Web Audio API'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Video', desc: 'Select any video containing sound.' },
      { step: 2, title: 'Choose Audio Format', desc: 'Select WAV or standard audio output.' },
      { step: 3, title: 'Extract & Save', desc: 'Download your extracted audio track.' }
    ],
    faqs: [
      { question: 'Can I extract audio from 4K or large video files?', answer: 'Yes! Because the browser reads the file locally, large video files process swiftly without waiting for slow cloud uploads.' }
    ]
  },
  {
    id: 'video-muter',
    slug: 'muter',
    name: 'Video Audio Remover',
    category: 'video',
    categoryLabel: 'Video Suite',
    description: 'Remove background audio or sound tracks from video files in 1 second.',
    longDescription: 'Silence any video file effortlessly. Strip noisy background chatter, copyrighted music, or wind noise before publishing to social media.',
    iconName: 'VolumeX',
    path: '/video/muter',
    keywords: ['remove audio from video', 'mute video', 'silence mp4', 'strip sound from video'],
    features: [
      'Completely strips all audio channels',
      'Lightning-fast 1-second processing',
      'Preserves original visual stream fidelity'
    ],
    howToSteps: [
      { step: 1, title: 'Choose Video', desc: 'Upload the video clip you want to mute.' },
      { step: 2, title: 'Silence Audio', desc: 'Click "Remove Audio Track".' },
      { step: 3, title: 'Download Muted Video', desc: 'Save your silent video file.' }
    ],
    faqs: [
      { question: 'Why mute a video before posting?', answer: 'Muting avoids copyright strikes from ambient background music and creates cleaner social media clips.' }
    ]
  },
  {
    id: 'subtitle-generator',
    slug: 'subtitle-generator',
    name: 'AI Subtitle Generator & Studio',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Auto-generate timed subtitles from audio & video with synchronized studio editing.',
    longDescription: 'Transcribe speech from video and audio files into synchronized subtitles. Edit timestamps and cues in an interactive studio and export to .SRT, .VTT, .TXT, or .JSON 100% in your browser.',
    iconName: 'Subtitles',
    badge: 'AI Powered',
    path: '/video/subtitle-generator',
    keywords: ['generate subtitles from video', 'auto subtitle generator', 'video to srt', 'audio to vtt', 'ai transcription', 'caption generator'],
    features: [
      '100% Client-Side AI: Whisper speech-to-text with zero server uploads',
      'Multi-format export: .SRT, .VTT (WebVTT), .TXT, and .JSON',
      'Synchronized video player with live subtitle overlay preview',
      'Interactive cue editor with timestamp nudging and search/replace'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Video or Audio', desc: 'Select any MP4, WebM, MOV, MKV, MP3, WAV, or M4A file, or import an existing .SRT/.VTT.' },
      { step: 2, title: 'Transcribe & Generate', desc: 'Select audio spoken language and let the in-browser AI generate timed subtitle cues.' },
      { step: 3, title: 'Edit & Export', desc: 'Preview with synchronized video playback, adjust cues, and download as .SRT, .VTT, or ZIP.' }
    ],
    faqs: [
      { question: 'Is my media uploaded to any server for transcription?', answer: 'No! The AI model runs entirely inside your browser using WebAssembly and WebGPU. Your media never leaves your device.' },
      { question: 'What subtitle formats can I export?', answer: 'You can export SubRip (.srt), WebVTT (.vtt), plain text transcript (.txt), or structured JSON.' }
    ]
  },
  {
    id: 'audio-booster',
    slug: 'audio-booster',
    name: 'Audio Volume Booster & Normalizer',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Amplify quiet audio and video volume up to 300% (+12 dB) with anti-clipping limiter.',
    longDescription: 'Boost low-volume audio and video recordings in your browser. Features precision gain amplification (+0 to +12 dB), automatic soft-knee dynamics limiter to eliminate distortion, and EBU peak normalization.',
    iconName: 'Volume2',
    badge: 'Pro Audio',
    path: '/video/audio-booster',
    keywords: ['volume booster', 'audio booster', 'amplify mp3', 'boost audio online', 'audio normalizer', 'increase sound volume'],
    features: [
      'Gain amplification from 100% to 300% (+0 dB to +12 dB)',
      'Anti-clipping brickwall dynamics limiter prevents distortion',
      'Presets: Speech Boost, Podcast Normalizer, Max Loudness, Bass Warmth',
      'Live A/B comparison player and lossless 16-bit WAV export'
    ],
    howToSteps: [
      { step: 1, title: 'Upload Media', desc: 'Select any audio (MP3, WAV, M4A, AAC) or video (MP4, WebM) file.' },
      { step: 2, title: 'Adjust Volume Gain', desc: 'Move the volume multiplier slider or select an audio preset.' },
      { step: 3, title: 'Boost & Download', desc: 'Preview with live A/B comparison and download your crystal-clear boosted audio.' }
    ],
    faqs: [
      { question: 'Will boosting volume cause audio distortion or crackling?', answer: 'No! The built-in dynamics limiter automatically suppresses harsh signal clipping so your boosted audio remains smooth and distortion-free.' },
      { question: 'Can I boost audio from video files?', answer: 'Yes, upload any MP4, WebM, or MOV video and the tool extracts and amplifies the soundtrack directly.' }
    ]
  },
  {
    id: 'video-to-gif',
    slug: 'video-to-gif',
    name: 'Video to GIF Maker & Optimizer',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Convert video clips into high-framerate animated GIFs with custom scaling and trimming.',
    longDescription: 'Turn video clips (MP4, WebM, MOV) into animated GIFs directly in your browser. Trim exact clip intervals, tune frame rates from 10 to 30 FPS, and adjust width resolution with zero server uploads.',
    iconName: 'Film',
    badge: 'Creator Tool',
    path: '/video/video-to-gif',
    keywords: ['video to gif', 'mp4 to gif', 'make animated gif', 'gif converter', 'trim video to gif', 'gif maker online'],
    features: [
      'Interactive range trimmer with real-time video playback',
      'Selectable frame rate (10, 15, 20, 24, 30 FPS)',
      'Resolution scaling presets (320px, 480px, 640px, or Source)',
      'High-performance client-side Canvas & LZW quantization'
    ],
    howToSteps: [
      { step: 1, title: 'Select Video', desc: 'Choose any MP4, WebM, or MOV video clip.' },
      { step: 2, title: 'Set Trim & FPS', desc: 'Drag the start/end timestamps and choose your target frame rate.' },
      { step: 3, title: 'Export GIF', desc: 'Preview animated loop and download your optimized GIF.' }
    ],
    faqs: [
      { question: 'How can I reduce the output GIF file size?', answer: 'Lower the frame rate to 10-15 FPS or choose a smaller width preset like 320px or 480px to create ultra-compact GIF files.' },
      { question: 'Does this tool upload my video to a remote server?', answer: 'No! All frame extraction, palette quantization, and LZW byte stream encoding happen entirely in local browser memory.' }
    ]
  }
];

export const CATEGORIES = [
  { id: 'all', label: 'All Tools', count: TOOLS.length },
  { id: 'pdf', label: 'PDF Suite', count: TOOLS.filter(t => t.category === 'pdf').length },
  { id: 'image', label: 'Image Suite', count: TOOLS.filter(t => t.category === 'image').length },
  { id: 'video', label: 'Video & Audio', count: TOOLS.filter(t => t.category === 'video').length },
  { id: 'svg', label: 'SVG Tools', count: TOOLS.filter(t => t.category === 'svg').length },
];
