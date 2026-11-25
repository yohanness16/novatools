import assert from 'node:assert';
import { matchToolsForFiles } from '../src/lib/fileHandoff.ts';

const SAMPLE_TOOLS = [
  { id: 'merge-pdf', shortName: 'Merge', shortTag: 'PDF', category: 'pdf', path: '/pdf/merge', iconName: 'Layers', accepts: ['.pdf', 'application/pdf'] },
  { id: 'split-pdf', shortName: 'Split', shortTag: 'PDF', category: 'pdf', path: '/pdf/split', iconName: 'Scissors', accepts: ['.pdf', 'application/pdf'] },
  { id: 'background-remover', shortName: 'Remove BG', shortTag: 'IMG', category: 'image', path: '/image/background-remover', iconName: 'Scissors', accepts: ['.png', '.jpg', '.jpeg', '.webp', '.avif', 'image/*'] },
  { id: 'svg-optimizer', shortName: 'Clean SVG', shortTag: 'SVG', category: 'svg', path: '/image/svg-optimizer', iconName: 'Code', accepts: ['.svg', 'image/svg+xml'] },
  { id: 'video-trimmer', shortName: 'Trim', shortTag: 'VID', category: 'video', path: '/video/trimmer', iconName: 'Clock', accepts: ['.mp4', '.webm', '.mov', '.mkv', 'video/*'] },
];

// Single PDF prioritizes split before merge
const singlePdf = matchToolsForFiles([{ name: 'report.pdf', type: 'application/pdf' }], SAMPLE_TOOLS);
assert.strictEqual(singlePdf[0].id, 'split-pdf');
assert(singlePdf.some((t) => t.id === 'merge-pdf'));

// Multiple PDFs prioritize merge first
const multiPdf = matchToolsForFiles(
  [{ name: 'a.pdf', type: 'application/pdf' }, { name: 'b.pdf', type: 'application/pdf' }],
  SAMPLE_TOOLS
);
assert.strictEqual(multiPdf[0].id, 'merge-pdf');

// SVG prioritizes svg-optimizer
const svgMatch = matchToolsForFiles([{ name: 'logo.svg', type: 'image/svg+xml' }], SAMPLE_TOOLS);
assert.strictEqual(svgMatch[0].id, 'svg-optimizer');

// Image matches background-remover
const imgMatch = matchToolsForFiles([{ name: 'photo.png', type: 'image/png' }], SAMPLE_TOOLS);
assert.strictEqual(imgMatch[0].id, 'background-remover');

// Video matches video-trimmer
const vidMatch = matchToolsForFiles([{ name: 'clip.mp4', type: 'video/mp4' }], SAMPLE_TOOLS);
assert.strictEqual(vidMatch[0].id, 'video-trimmer');

console.log('✅ fileHandoff matching tests passed');
