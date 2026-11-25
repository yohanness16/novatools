import type { ToolMeta } from './toolsData';

export interface ToolVisualTheme {
  /** Popular domain background color for the tool icon badge (replaces uniform black) */
  iconBoxClass: string;
  /** Yellow icon stroke color */
  iconColorClass: string;
  /** Subtle folded-corner / file-type indicator for popular formats */
  badgeLabel: string;
  /** Action animation stage background (light + dark) */
  stageClass: string;
  /** Primary action accent hex used inside the animated preview */
  accentHex: string;
  /** Secondary contrasting action hex (e.g. blue/green/orange) for multi-step animations */
  secondaryHex: string;
  /** Dot-grid tint in preview stage */
  dotRgba: string;
}

const PDF_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#DC2626] border border-[#B91C1C] group-hover:bg-[#B91C1C]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'PDF',
  stageClass: 'bg-[#FEF2F2] dark:bg-[#1E1313]',
  accentHex: '#DC2626',
  secondaryHex: '#2563EB',
  dotRgba: 'rgba(220, 38, 38, 0.22)',
};

const DOCS_BLUE_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#2563EB] border border-[#1D4ED8] group-hover:bg-[#1D4ED8]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'DOC',
  stageClass: 'bg-[#EFF6FF] dark:bg-[#121A29]',
  accentHex: '#2563EB',
  secondaryHex: '#0EA5E9',
  dotRgba: 'rgba(37, 99, 235, 0.22)',
};

const EXCEL_GREEN_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#15803D] border border-[#166534] group-hover:bg-[#166534]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'XLS',
  stageClass: 'bg-[#ECFDF5] dark:bg-[#101E17]',
  accentHex: '#16A34A',
  secondaryHex: '#2563EB',
  dotRgba: 'rgba(22, 163, 74, 0.22)',
};

const SLIDES_ORANGE_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#EA580C] border border-[#C2410C] group-hover:bg-[#C2410C]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'PPT',
  stageClass: 'bg-[#FFF7ED] dark:bg-[#221610]',
  accentHex: '#EA580C',
  secondaryHex: '#2563EB',
  dotRgba: 'rgba(234, 88, 12, 0.22)',
};

const IMAGE_SKY_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#0284C7] border border-[#0369A1] group-hover:bg-[#0369A1]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'IMG',
  stageClass: 'bg-[#F0F9FF] dark:bg-[#101C26]',
  accentHex: '#0284C7',
  secondaryHex: '#10B981',
  dotRgba: 'rgba(2, 132, 199, 0.22)',
};

const VIDEO_VIOLET_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#7C3AED] border border-[#6D28D9] group-hover:bg-[#6D28D9]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'VID',
  stageClass: 'bg-[#F5F3FF] dark:bg-[#191326]',
  accentHex: '#7C3AED',
  secondaryHex: '#2563EB',
  dotRgba: 'rgba(124, 58, 237, 0.22)',
};

const DIAGRAM_TEAL_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#0D9488] border border-[#0F766E] group-hover:bg-[#0F766E]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'MAP',
  stageClass: 'bg-[#F0FDFA] dark:bg-[#101E1D]',
  accentHex: '#0D9488',
  secondaryHex: '#2563EB',
  dotRgba: 'rgba(13, 148, 136, 0.22)',
};

const SVG_AMBER_THEME: ToolVisualTheme = {
  iconBoxClass:
    'bg-[#C2410C] border border-[#9A3412] group-hover:bg-[#9A3412]',
  iconColorClass: 'text-[#FACC15]',
  badgeLabel: 'SVG',
  stageClass: 'bg-[#FFFBEB] dark:bg-[#211910]',
  accentHex: '#D97706',
  secondaryHex: '#2563EB',
  dotRgba: 'rgba(217, 119, 6, 0.24)',
};

export function getToolTheme(tool: Pick<ToolMeta, 'id' | 'category'>): ToolVisualTheme {
  if (tool.id === 'doc-to-excel') return EXCEL_GREEN_THEME;
  if (tool.id === 'doc-to-slides') return SLIDES_ORANGE_THEME;
  if (tool.id === 'pdf-to-doc') {
    return { ...PDF_THEME, secondaryHex: '#2563EB' };
  }
  if (tool.id === 'pdf-to-images') {
    return { ...PDF_THEME, secondaryHex: '#0284C7' };
  }

  switch (tool.category) {
    case 'pdf':
      return PDF_THEME;
    case 'image':
      return IMAGE_SKY_THEME;
    case 'video':
      return VIDEO_VIOLET_THEME;
    case 'document':
      return DOCS_BLUE_THEME;
    case 'diagram':
      return DIAGRAM_TEAL_THEME;
    case 'svg':
      return SVG_AMBER_THEME;
    default:
      return DOCS_BLUE_THEME;
  }
}
