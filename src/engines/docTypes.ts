/**
 * Universal Document Types & Format Enums for NovaTools Document Suite
 * 100% Client-Side Lossless Transformations
 */

export type DocumentFormat = 'markdown' | 'docx' | 'pdf' | 'pptx' | 'xlsx' | 'html' | 'txt' | 'csv' | 'json';

export type SlideTheme = 'dark-indigo' | 'corporate-blue' | 'minimal-emerald' | 'sunset-modern';

export type ToneType = 'formal' | 'concise' | 'academic' | 'executive' | 'creative' | 'casual';

export interface DocTable {
  headers: string[];
  rows: string[][];
  alignments?: ('left' | 'center' | 'right')[];
  title?: string;
}

export interface DocSlide {
  id: string;
  title: string;
  subtitle?: string;
  layout: 'title' | 'agenda' | 'content' | 'two-column' | 'stats' | 'quote' | 'table' | 'code' | 'summary';
  bullets?: string[];
  columns?: { title?: string; bullets: string[] }[];
  statNumber?: string;
  statLabel?: string;
  quoteText?: string;
  quoteAuthor?: string;
  codeSnippet?: { language: string; code: string };
  tableData?: DocTable;
  speakerNotes?: string;
}

export interface DocMetadata {
  title: string;
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  detectedTablesCount: number;
  detectedHeadingsCount: number;
}

export interface AIProcessingOptions {
  theme?: SlideTheme;
  slideCount?: number;
  tone?: ToneType;
  targetLanguage?: string;
  includeSpeakerNotes?: boolean;
}

export interface ConversionProgress {
  stage: 'idle' | 'parsing' | 'transforming' | 'generating' | 'done' | 'error';
  progressPercent: number;
  message: string;
}
