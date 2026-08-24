import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type StampPosition =
  | 'bottom-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'top-right'
  | 'top-left';

export interface PdfNumbererOptions {
  position: StampPosition;
  template: string; // '{page}', 'Page {page} of {total}', '{page} / {total}', '- {page} -', 'roman'
  startNumber?: number; // e.g. 1
  skipFirstNPages?: number; // e.g. 1 to skip cover page
  fontSize?: number; // default 10
  colorHex?: string; // default '#333333'
  margin?: number; // default 30 (points)
}

export interface NumberingProgress {
  status: 'loading' | 'stamping' | 'saving' | 'done' | 'error';
  progress: number;
  currentPage: number;
  totalPages: number;
  message: string;
}

export interface NumberingResult {
  blob: Blob;
  pageCount: number;
  stampedPages: number;
}

function toRoman(num: number): string {
  const lookup: { [key: string]: number } = {
    m: 1000,
    cm: 900,
    d: 500,
    cd: 400,
    c: 100,
    xc: 90,
    l: 50,
    xl: 40,
    x: 10,
    ix: 9,
    v: 5,
    iv: 4,
    i: 1,
  };
  let roman = '';
  for (const i in lookup) {
    while (num >= lookup[i]) {
      roman += i;
      num -= lookup[i];
    }
  }
  return roman || num.toString();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const intVal = parseInt(cleanHex, 16);
  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;
  return { r, g, b };
}

export class PdfNumbererEngine {
  /**
   * Stamps vector page numbers on PDF pages
   */
  static async stampPageNumbers(
    pdfFile: File | Blob,
    options: PdfNumbererOptions = { position: 'bottom-center', template: 'Page {page} of {total}' },
    onProgress?: (progress: NumberingProgress) => void
  ): Promise<NumberingResult> {
    onProgress?.({
      status: 'loading',
      progress: 10,
      currentPage: 0,
      totalPages: 0,
      message: 'Loading PDF document...',
    });

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = options.fontSize || 10;
    const margin = options.margin || 32;
    const color = hexToRgb(options.colorHex || '#333333');
    const startNum = options.startNumber !== undefined ? options.startNumber : 1;
    const skipPages = options.skipFirstNPages || 0;

    let stampedCount = 0;

    onProgress?.({
      status: 'stamping',
      progress: 30,
      currentPage: 0,
      totalPages,
      message: `Stamping page numbers across ${totalPages} pages...`,
    });

    for (let i = 0; i < totalPages; i++) {
      if (i < skipPages) continue;

      const page = pages[i];
      const { width, height } = page.getSize();
      const pageIndex = i - skipPages + startNum;
      const totalDisplay = totalPages - skipPages;

      let text = '';
      if (options.template === 'roman') {
        text = toRoman(pageIndex);
      } else {
        text = options.template
          .replace(/{page}/gi, pageIndex.toString())
          .replace(/{total}/gi, totalDisplay.toString());
      }

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = 0;
      let y = 0;

      switch (options.position) {
        case 'bottom-center':
          x = (width - textWidth) / 2;
          y = margin;
          break;
        case 'bottom-right':
          x = width - margin - textWidth;
          y = margin;
          break;
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'top-center':
          x = (width - textWidth) / 2;
          y = height - margin - textHeight;
          break;
        case 'top-right':
          x = width - margin - textWidth;
          y = height - margin - textHeight;
          break;
        case 'top-left':
          x = margin;
          y = height - margin - textHeight;
          break;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });

      stampedCount++;

      if (i % 5 === 0 || i === totalPages - 1) {
        onProgress?.({
          status: 'stamping',
          progress: 30 + Math.round(((i + 1) / totalPages) * 55),
          currentPage: i + 1,
          totalPages,
          message: `Stamping page ${i + 1} of ${totalPages}...`,
        });
      }
    }

    onProgress?.({
      status: 'saving',
      progress: 90,
      currentPage: totalPages,
      totalPages,
      message: 'Compiling optimized PDF document...',
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });

    onProgress?.({
      status: 'done',
      progress: 100,
      currentPage: totalPages,
      totalPages,
      message: 'Page numbers stamped successfully!',
    });

    return {
      blob,
      pageCount: totalPages,
      stampedPages: stampedCount,
    };
  }
}
