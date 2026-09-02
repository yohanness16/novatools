import { EDUCATIONAL_CONTENT } from './educationalData';

export interface ToolMeta {
  id: string;
  slug: string;
  name: string;
  category: 'pdf' | 'image' | 'video' | 'svg' | 'document' | 'diagram';
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
  about?: {
    paragraphs: string[];
    technicalMechanism: string;
    supportedFormats: string[];
  };
  useCases?: {
    title: string;
    description: string;
  }[];
}

const RAW_TOOLS: ToolMeta[] = [
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
  {
    id: 'pdf-page-numberer',
    slug: 'page-numberer',
    name: 'PDF Page Numberer & Stamper',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Add page numbers, Roman numerals, and header/footer metadata stamps to PDFs.',
    longDescription: 'Stamp crisp vector page numbers onto PDF documents in your browser. Customize 6-point page alignment, number formatting ("Page 1 of 10", Roman numerals), font size, margins, and skip cover pages with 100% privacy.',
    iconName: 'FileText',
    badge: 'Vector Stamp',
    path: '/pdf/page-numberer',
    keywords: ['number pdf pages', 'add page numbers to pdf', 'pdf bates numbering', 'pdf header footer', 'paginate pdf online'],
    features: [
      '6-Point page alignment (Top/Bottom, Left/Center/Right)',
      'Templates: "Page 1 of 10", "1 / 10", "Page 1", "- 1 -", Roman numerals',
      'Skip cover pages option and custom starting index',
      'Crisp vector typography injected via pdf-lib with zero server uploads'
    ],
    howToSteps: [
      { step: 1, title: 'Upload PDF Document', desc: 'Select the PDF file you wish to paginate.' },
      { step: 2, title: 'Choose Alignment & Format', desc: 'Click the alignment grid (e.g. Bottom Center) and pick your preferred numbering template.' },
      { step: 3, title: 'Stamp & Download', desc: 'Download your newly paginated PDF document with embedded vector page numbers.' }
    ],
    faqs: [
      { question: 'Will adding page numbers affect existing text or layout?', answer: 'No! The numbers are drawn directly as vector overlay layers without modifying existing text flow or image quality.' },
      { question: 'Can I skip numbering on the first/cover page?', answer: 'Yes, simply set "Skip Cover Pages" to 1 (or any number of introductory pages) to start numbering from subsequent pages.' }
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
      'Fast HTML5 Canvas and Local In-Browser Pipeline'
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
  },
  {
    id: 'lyrics-video-generator',
    slug: 'lyrics-video-generator',
    name: 'Animated Lyrics Video Generator',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Create synchronized animated lyrics videos with custom backgrounds, karaoke transitions, and musical note effects.',
    longDescription: 'Turn music tracks into animated lyric videos directly in your browser. Upload custom video/image backgrounds or pick procedural animated presets, adjust lyric placement (top, center, bottom), style typography and glow colors, add floating classical musical note icons, and download the finished video with zero server uploads.',
    iconName: 'Music',
    badge: 'Creator Studio',
    path: '/video/lyrics-video-generator',
    keywords: ['lyrics video maker', 'animated lyrics generator', 'karaoke video maker', 'music video with lyrics', 'lyrics video creator', 'lrc to video'],
    features: [
      '100% Client-Side Video Rendering: Zero uploads, instant browser export',
      'AI Speech & Lyrics Recognition with timestamp synchronization',
      'Flexible Lyric Placement: Top, Center / Middle, or Bottom',
      'Transitions: Karaoke Word Fill, Kinetic Pop, Cinematic Fade, Typewriter, Neon Flash, Wave Float',
      'Classical Musical Note Accents (♪ ♫ ♩ ♬ 𝄞) and particle effects',
      'Custom Video/Image backgrounds & 6 procedural animated visualizers',
      'Export ready-to-share MP4/WebM videos in 16:9, 9:16 Shorts/TikTok, or 1:1'
    ],
    howToSteps: [
      { step: 1, title: 'Load Music & Lyrics', desc: 'Upload your audio track and auto-detect lyrics or paste timestamped lines.' },
      { step: 2, title: 'Choose Background & Style', desc: 'Select a custom image/video or procedural background, and customize font, color, and placement.' },
      { step: 3, title: 'Animate & Download', desc: 'Preview with real-time synchronized playback and export your finished lyrics video.' }
    ],
    faqs: [
      { question: 'Can I export in vertical format for TikTok, Reels, or YouTube Shorts?', answer: 'Yes! You can choose 9:16 Vertical, 16:9 Landscape, or 1:1 Square canvas format before rendering.' },
      { question: 'Are my audio and video files uploaded to any external server?', answer: 'No! All audio decoding, canvas animation, and video compilation execute 100% locally inside your browser memory.' }
    ]
  },
  {
    id: 'text-to-speech',
    slug: 'text-to-speech',
    name: 'AI Voice Studio & Text-to-Speech',
    category: 'video',
    categoryLabel: 'Video & Audio',
    description: 'Synthesize studio-quality, natural human voiceovers with Kokoro-82M, human expressions (ugh, sigh, cough), voice blending, and WAV export.',
    longDescription: 'Turn scripts and articles into lifelike speech 100% in your browser using the open-weight Kokoro-82M neural model. Features 50+ diverse voices, custom dual-voice blending, natural conversational interjections (ugh, sigh, cough, ay, hmm), dynamic speed/pause control, interactive waveform visualizer, and instant 24kHz WAV & SRT subtitle export with zero server costs or data tracking.',
    iconName: 'Volume2',
    badge: 'Kokoro-82M AI',
    path: '/video/text-to-speech',
    keywords: ['text to speech', 'ai voice generator', 'kokoro tts', 'voiceover studio', 'ai narrator', 'humanic tts', 'client-side tts', 'tts with expressions'],
    features: [
      '100% Client-Side Neural Inference via Kokoro-82M ONNX and WebGPU / Local Engine',
      'Humanic Expressions & Interjections: Handles "ugh", "cough", "ay", "sigh", "hmm", "whoa", "phew", etc.',
      '50+ High-Fidelity Voices across American, British, Japanese, French, Spanish, Italian, and Hindi accents',
      'Dual-Voice Blender: Interpolate between two voice styles to forge custom unique human timbres',
      'Interactive Animated Waveform Visualizer and timecode playback scrubber',
      'Multi-Format Export: High-fidelity 24kHz WAV and timestamped SRT subtitles'
    ],
    howToSteps: [
      { step: 1, title: 'Write or Paste Script', desc: 'Type your text and click expression buttons like [ugh], [sigh], or [pause: 500ms] to craft natural cadence.' },
      { step: 2, title: 'Choose or Blend Voices', desc: 'Pick from 50+ built-in voices or enable the Voice Blender to mix two distinct styles.' },
      { step: 3, title: 'Generate & Export', desc: 'Click "Generate Speech" to synthesize speech locally on your GPU/CPU, preview waveform, and download WAV audio.' }
    ],
    faqs: [
      { question: 'Does Kokoro-82M TTS require sending text to a server?', answer: 'No! The neural network model executes entirely inside your browser sandbox via WebGPU and client-side processing. Your text and audio never leave your computer.' },
      { question: 'How are human expressions like "ugh" and "sigh" generated?', answer: 'NovaTools uses an intelligent expression normalizer that maps natural interjections into phonetic breath and pause cadences that the neural vocoder renders smoothly.' },
      { question: 'Is WebGPU required to use this tool?', answer: 'No! If your browser supports WebGPU, it utilizes hardware acceleration for sub-second synthesis. If not, it automatically falls back to multi-threaded in-browser execution.' }
    ]
  },
  // DOCUMENT & AI SUITE
  {
    id: 'doc-studio',
    slug: 'studio',
    name: 'Universal Document Studio',
    category: 'document',
    categoryLabel: 'Document Suite',
    description: '100% client-side document editor with AI slide generation, table extraction, and multi-format export (PDF, DOCX, PPTX, XLSX).',
    longDescription: 'Transform Markdown, Word DOCX, and CSV files in your browser. Real-time split editor, AI presentation generation, structured spreadsheet synthesis, and crisp vector PDF printing with zero server uploads.',
    iconName: 'FileText',
    badge: 'AI Powered',
    path: '/document/studio',
    keywords: ['document studio', 'markdown to pdf', 'markdown to docx', 'doc to pptx', 'doc to excel', 'client-side document converter'],
    features: [
      '100% Client-Side: Zero server uploads, total confidentiality',
      'Lossless AST Transformation between Markdown, Word, PowerPoint, and Excel',
      'In-Browser AI Assistant: Generates presentations, extracts data, and polishes tone',
      'Instant Vector PDF and Word (.docx) generation with tables and code blocks'
    ],
    howToSteps: [
      { step: 1, title: 'Input Content', desc: 'Type Markdown or upload a .docx, .md, or .csv file.' },
      { step: 2, title: 'AI Enhance & Preview', desc: 'Click "AI to Slides" or "AI to Excel" to generate presentations and sheets.' },
      { step: 3, title: 'Export', desc: 'Download as PDF, DOCX, PPTX, or XLSX with a single click.' }
    ],
    faqs: [
      { question: 'Are my confidential documents uploaded to any AI server?', answer: 'No! All processing runs 100% locally in your browser using Chrome Built-in AI (Gemini Nano) or WebAssembly AST algorithms.' }
    ]
  },
  {
    id: 'md-to-pdf',
    slug: 'md-to-pdf',
    name: 'Markdown to PDF',
    category: 'document',
    categoryLabel: 'Document Suite',
    description: 'Convert Markdown documents into beautiful vector PDFs with CSS Paged Media typography.',
    longDescription: 'High-fidelity Markdown to PDF conversion in browser. Preserves tables, syntax-highlighted code blocks, blockquotes, and math equations with crisp vector typography.',
    iconName: 'Printer',
    badge: 'Lossless',
    path: '/document/md-to-pdf',
    keywords: ['markdown to pdf', 'md to pdf', 'convert markdown to pdf in browser'],
    features: [
      'Zero server upload, instant local rendering',
      'Full GFM Table support with styled borders',
      'Syntax highlighted code blocks'
    ],
    howToSteps: [
      { step: 1, title: 'Paste Markdown', desc: 'Enter your markdown notes or drop a .md file.' },
      { step: 2, title: 'Review Preview', desc: 'Inspect the live rendered document layout.' },
      { step: 3, title: 'Print / Save PDF', desc: 'Click "PDF Export" to trigger crisp vector printing.' }
    ],
    faqs: [
      { question: 'Can I include tables and code?', answer: 'Yes! All GFM tables, syntax-highlighted code blocks, and blockquotes are rendered losslessly.' }
    ]
  },
  {
    id: 'md-to-docx',
    slug: 'md-to-docx',
    name: 'Markdown to Word (DOCX)',
    category: 'document',
    categoryLabel: 'Document Suite',
    description: 'Convert Markdown or edit DOCX files into native Microsoft Word (.docx) documents.',
    longDescription: 'Generate fully styled Microsoft Word (.docx) OpenXML documents directly in the browser. Ingest existing .docx files or compile Markdown into Word tables, styled headers, and callouts.',
    iconName: 'FileText',
    badge: 'Popular',
    path: '/document/md-to-docx',
    keywords: ['markdown to word', 'markdown to docx', 'md to docx', 'docx editor'],
    features: [
      'Native OpenXML DOCX compilation',
      'Ingests uploaded .docx files into clean Markdown',
      'Formatted Word tables with header styling and shading'
    ],
    howToSteps: [
      { step: 1, title: 'Upload or Type', desc: 'Upload a .docx file or write Markdown.' },
      { step: 2, title: 'Preview & Format', desc: 'Verify your headings, lists, and tables.' },
      { step: 3, title: 'Download DOCX', desc: 'Download standard Microsoft Word OpenXML file.' }
    ],
    faqs: [
      { question: 'Does it work with Microsoft Word and Google Docs?', answer: 'Yes! The generated .docx files are fully compatible with Word, Google Docs, LibreOffice, and Apple Pages.' }
    ]
  },
  {
    id: 'doc-to-slides',
    slug: 'doc-to-slides',
    name: 'Document to Slides (PPTX)',
    category: 'document',
    categoryLabel: 'Document Suite',
    description: 'Transform documents and notes into professional PowerPoint presentation slide decks.',
    longDescription: 'Intelligently decompose documents into 16:9 widescreen PowerPoint (.pptx) presentations with multiple card layouts, statistic callouts, code slides, and speaker notes.',
    iconName: 'Presentation',
    badge: 'AI Slides',
    path: '/document/doc-to-slides',
    keywords: ['doc to pptx', 'markdown to slides', 'markdown to powerpoint', 'ai presentation generator'],
    features: [
      'AI-powered semantic slide chunking',
      '4 Designer Themes: Dark Indigo, Corporate Blue, Emerald Clean, Sunset Modern',
      'Automatic speaker notes and metric statistic cards'
    ],
    howToSteps: [
      { step: 1, title: 'Paste Document', desc: 'Enter document notes or project specifications.' },
      { step: 2, title: 'Generate Slides', desc: 'Use AI or heuristic parser to generate 16:9 slides.' },
      { step: 3, title: 'Download PPTX', desc: 'Export native PowerPoint presentation.' }
    ],
    faqs: [
      { question: 'Are the slides editable in PowerPoint?', answer: 'Yes! The downloaded .pptx is a native presentation with fully editable text boxes, shapes, and tables.' }
    ]
  },
  {
    id: 'doc-to-excel',
    slug: 'doc-to-excel',
    name: 'Document to Excel (XLSX)',
    category: 'document',
    categoryLabel: 'Document Suite',
    description: 'Extract tables and synthesize structured datasets from documents into Excel (.xlsx) workbooks.',
    longDescription: 'Scan narrative text or Markdown documents for tabular data and export formatted multi-sheet Excel (.xlsx) workbooks and CSV files with auto-detected data types.',
    iconName: 'FileSpreadsheet',
    badge: 'Smart Data',
    path: '/document/doc-to-excel',
    keywords: ['doc to excel', 'markdown to xlsx', 'markdown table to excel', 'extract tables to excel'],
    features: [
      'Extracts all GFM and HTML tables from documents',
      'AI Smart Extractor for unstructured text',
      'Multi-sheet Excel workbook generation with column auto-sizing'
    ],
    howToSteps: [
      { step: 1, title: 'Input Notes/Tables', desc: 'Paste document with tables or narrative text.' },
      { step: 2, title: 'Extract & Inspect', desc: 'Review the interactive spreadsheet grid.' },
      { step: 3, title: 'Download XLSX', desc: 'Export multi-sheet Excel spreadsheet.' }
    ],
    faqs: [
      { question: 'Does it auto-detect numbers and currency?', answer: 'Yes! Numbers and financial values are automatically parsed and formatted as numeric cells.' }
    ]
  },
  {
    id: 'doc-to-pdf',
    slug: 'doc-to-pdf',
    name: 'Word & Doc to PDF',
    category: 'document',
    categoryLabel: 'Document Suite',
    description: 'Convert Word (.docx) and Markdown files into crisp vector PDFs with CSS Paged Media typography.',
    longDescription: 'High-performance in-browser Word and Document to PDF conversion. Preserves tables, syntax-highlighted code blocks, blockquotes, and custom margins with 100% privacy and zero server uploads.',
    iconName: 'Printer',
    badge: 'Vector PDF',
    path: '/document/doc-to-pdf',
    keywords: ['doc to pdf', 'docx to pdf', 'word to pdf', 'convert word to pdf in browser'],
    features: [
      '100% Client-Side: Zero server uploads, total confidentiality',
      'Lossless OpenXML parsing for .docx and Markdown',
      'Crisp vector PDF typography with table border styling'
    ],
    howToSteps: [
      { step: 1, title: 'Upload DOCX / MD', desc: 'Select or drag your Word document or Markdown file.' },
      { step: 2, title: 'Preview & Format', desc: 'Inspect live rendered vector layout.' },
      { step: 3, title: 'Export PDF', desc: 'Click "Export Vector PDF" to print or save your document.' }
    ],
    faqs: [
      { question: 'Is my document uploaded to a cloud server?', answer: 'No! All parsing and PDF rendering occurs completely inside your local browser memory.' }
    ]
  },
  {
    id: 'pdf-to-doc',
    slug: 'pdf-to-doc',
    name: 'PDF to Word (DOCX)',
    category: 'pdf',
    categoryLabel: 'PDF Suite',
    description: 'Extract text, structure, and headings from PDF into editable Microsoft Word (.docx) and Markdown.',
    longDescription: 'Convert PDF documents into editable Microsoft Word (.docx), Markdown (.md), and plain text. Reconstructs line hierarchy, detects headings from font weights, and exports OpenXML with zero server uploads.',
    iconName: 'FileText',
    badge: 'Editable DOCX',
    path: '/pdf/pdf-to-doc',
    keywords: ['pdf to doc', 'pdf to docx', 'pdf to word', 'convert pdf to word in browser', 'extract text from pdf'],
    features: [
      '100% Client-Side: Zero server uploads, total confidentiality',
      'Semantic text and typography reconstruction',
      'Exports native editable Microsoft Word (.docx) and Markdown'
    ],
    howToSteps: [
      { step: 1, title: 'Upload PDF', desc: 'Select or drop your PDF document.' },
      { step: 2, title: 'Inspect Extraction', desc: 'Review extracted pages and structured formatting.' },
      { step: 3, title: 'Download DOCX', desc: 'Download native Microsoft Word file or Markdown.' }
    ],
    faqs: [
      { question: 'Will the generated Word file be fully editable?', answer: 'Yes! The exported .docx contains native editable paragraphs, headings, and bullet points compatible with Microsoft Word and Google Docs.' }
    ]
  },
  // DIAGRAM & VISUALIZER SUITE
  {
    id: 'diagram-studio',
    slug: 'studio',
    name: 'AI Document-to-Diagram Studio',
    category: 'diagram',
    categoryLabel: 'Diagram Suite',
    description: 'Transform documents, architecture notes, and schemas into interactive Mermaid.js Flowcharts, ERDs, and Architecture maps.',
    longDescription: '100% client-side AI diagram studio. Ingest PDF, Word DOCX, or Markdown and synthesize flowcharts, database ERDs, sequence diagrams, and software architecture maps with vector SVG and 4K PNG export.',
    iconName: 'Workflow',
    badge: 'AI Diagram',
    path: '/diagram/studio',
    keywords: ['document to diagram', 'ai diagram generator', 'markdown to mermaid', 'pdf to flowchart', 'pdf to erd', 'architecture visualizer'],
    features: [
      '100% Client-Side: Zero server uploads, total confidentiality',
      'Supports Flowcharts, Database ERDs, Sequence, Architecture & Mindmaps',
      'Interactive visual canvas with live zoom, pan, and theme styling',
      'One-click export to Vector SVG, 4K PNG, and Mermaid code'
    ],
    howToSteps: [
      { step: 1, title: 'Upload or Paste', desc: 'Drop a PDF/DOCX document or paste text specs.' },
      { step: 2, title: 'Select Diagram Type', desc: 'Choose Flowchart, ERD, Sequence, Architecture, or Mindmap.' },
      { step: 3, title: 'Export Graphic', desc: 'Download as Vector SVG, High-Res PNG, or copy code.' }
    ],
    faqs: [
      { question: 'Are my architecture and database diagrams uploaded to a remote AI server?', answer: 'No! All diagram parsing, AI prompting, and Mermaid rendering execute 100% locally inside your browser.' }
    ]
  },
  {
    id: 'doc-to-flowchart',
    slug: 'doc-to-flowchart',
    name: 'Document to Flowchart',
    category: 'diagram',
    categoryLabel: 'Diagram Suite',
    description: 'Decompose business processes and algorithmic steps from text into clean visual flowcharts.',
    longDescription: 'Turn complex user flows, onboarding steps, and decision logic into beautiful Mermaid flowcharts with directional controls and SVG export.',
    iconName: 'GitBranch',
    badge: 'Flowchart',
    path: '/diagram/doc-to-flowchart',
    keywords: ['doc to flowchart', 'text to flowchart', 'ai flowchart maker'],
    features: [
      'Automatic decision diamond and process node detection',
      'Supports Top-Down (TD) and Left-to-Right (LR) layouts',
      'Crisp vector SVG export'
    ],
    howToSteps: [
      { step: 1, title: 'Input Process', desc: 'Enter bullet points, SOP notes, or algorithm steps.' },
      { step: 2, title: 'Generate Flowchart', desc: 'Inspect the generated decision flow.' },
      { step: 3, title: 'Download SVG/PNG', desc: 'Export high-resolution diagram.' }
    ],
    faqs: [
      { question: 'Can I edit the flowchart code manually?', answer: 'Yes! The studio includes a live Mermaid code editor with real-time preview.' }
    ]
  },
  {
    id: 'doc-to-erd',
    slug: 'doc-to-erd',
    name: 'Document to Database ERD',
    category: 'diagram',
    categoryLabel: 'Diagram Suite',
    description: 'Extract database entities, tables, attributes, and relationships into visual Entity-Relationship diagrams.',
    longDescription: 'Scan SQL schemas, documentation, or tables to extract entities, primary/foreign keys, and cardinalities into clean Mermaid ER diagrams.',
    iconName: 'Database',
    badge: 'Database ERD',
    path: '/diagram/doc-to-erd',
    keywords: ['doc to erd', 'sql to erd', 'ai database diagram', 'entity relationship diagram generator'],
    features: [
      'Extracts tables, columns, and data types',
      'Automatic primary and foreign key mapping',
      'Relationship cardinality modeling (1:N, M:N)'
    ],
    howToSteps: [
      { step: 1, title: 'Input Schema/Docs', desc: 'Paste database tables, SQL, or specification text.' },
      { step: 2, title: 'Generate ERD', desc: 'Review entity relationships and tables.' },
      { step: 3, title: 'Export', desc: 'Download as SVG or copy Mermaid code.' }
    ],
    faqs: [
      { question: 'Does it support SQL schemas?', answer: 'Yes! Paste CREATE TABLE statements or Markdown tables to instantly extract ER diagrams.' }
    ]
  },
  {
    id: 'doc-to-architecture',
    slug: 'doc-to-architecture',
    name: 'Document to Architecture Map',
    category: 'diagram',
    categoryLabel: 'Diagram Suite',
    description: 'Visualize system tiers, microservices, cloud infrastructure, and component relationships.',
    longDescription: 'Map software architecture specifications into multi-tier diagrams with Client, API Gateway, Microservices, and Database subgraphs.',
    iconName: 'Layers',
    badge: 'Architecture',
    path: '/diagram/doc-to-architecture',
    keywords: ['doc to architecture', 'system architecture diagram', 'microservices diagram generator'],
    features: [
      'Multi-tier subgraph grouping',
      'Microservice dependency mapping',
      'Theme customization with dark and light palettes'
    ],
    howToSteps: [
      { step: 1, title: 'Input Tech Stack', desc: 'Paste architecture notes or system specs.' },
      { step: 2, title: 'Synthesize Architecture', desc: 'Inspect tiers and service connections.' },
      { step: 3, title: 'Export Diagram', desc: 'Download 4K PNG or vector SVG.' }
    ],
    faqs: [
      { question: 'Is this suitable for design docs and RFCs?', answer: 'Yes! Perfect for embedding in engineering RFCs, system documentation, and pitch decks.' }
    ]
  }
];

export const TOOLS: ToolMeta[] = RAW_TOOLS.map((tool) => {
  const edu = EDUCATIONAL_CONTENT[tool.id];
  if (!edu) return tool;
  return {
    ...tool,
    about: edu.about,
    useCases: edu.useCases,
  };
});

export const CATEGORIES = [
  { id: 'all', label: 'All Tools', count: TOOLS.length },
  { id: 'diagram', label: 'Diagram Suite', count: TOOLS.filter(t => t.category === 'diagram').length },
  { id: 'document', label: 'Document Suite', count: TOOLS.filter(t => t.category === 'document').length },
  { id: 'pdf', label: 'PDF Suite', count: TOOLS.filter(t => t.category === 'pdf').length },
  { id: 'image', label: 'Image Suite', count: TOOLS.filter(t => t.category === 'image').length },
  { id: 'video', label: 'Video & Audio', count: TOOLS.filter(t => t.category === 'video').length },
  { id: 'svg', label: 'SVG Tools', count: TOOLS.filter(t => t.category === 'svg').length },
];


