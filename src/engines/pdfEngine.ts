import { PDFDocument, degrees, PageSizes } from 'pdf-lib';

export class PdfEngine {
  /**
   * Safe client-side loader for pdfjs-dist
   */
  private static async loadPdfJs() {
    if (typeof window === 'undefined') return null;
    const pdfjsLib = await import('pdfjs-dist');
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/workers/pdf.worker.min.mjs';
    }
    return pdfjsLib;
  }

  /**
   * Get page count of a PDF
   */
  static async getPageCount(sourceBuffer: ArrayBuffer): Promise<number> {
    const doc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    return doc.getPageCount();
  }

  /**
   * Render a single PDF page onto a canvas
   */
  static async renderPageToCanvas(
    sourceBuffer: ArrayBuffer,
    pageNumber: number,
    scale: number = 1.5
  ): Promise<HTMLCanvasElement> {
    const pdfjsLib = await this.loadPdfJs();
    if (!pdfjsLib) throw new Error('PDF.js renderer is not available.');

    const cloned = sourceBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(cloned) });
    const pdfDoc = await loadingTask.promise;
    const page = await pdfDoc.getPage(pageNumber);

    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext: any = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
    return canvas;
  }

  /**
   * Render all pages of a PDF document to genuine images (PNG/JPEG)
   */
  static async renderAllPagesToImages(
    sourceBuffer: ArrayBuffer,
    format: 'png' | 'jpeg',
    scale: number = 2,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ pageNumber: number; dataUrl: string; blob: Blob }[]> {
    const pdfjsLib = await this.loadPdfJs();
    if (!pdfjsLib) throw new Error('PDF.js renderer is not available.');

    const cloned = sourceBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(cloned) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const results: { pageNumber: number; dataUrl: string; blob: Blob }[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext: any = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, 0.95);

      const blob: Blob = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), mime, 0.95);
      });

      results.push({ pageNumber: i, dataUrl, blob });
      if (onProgress) onProgress(i, numPages);
    }

    return results;
  }

  /**
   * Merge multiple PDF buffers in sequential order
   */
  static async mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
    if (pdfBuffers.length === 0) throw new Error('At least one PDF file is required');
    const mergedDoc = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    return await mergedDoc.save();
  }

  /**
   * Split PDF by parsing range strings like "1-3, 5, 8-10"
   */
  static async splitPdf(sourceBuffer: ArrayBuffer, pageRangeStr: string): Promise<Uint8Array> {
    const doc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();
    const targetIndices = this.parsePageRanges(pageRangeStr, totalPages);

    if (targetIndices.length === 0) {
      throw new Error('No valid pages found in the specified range.');
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(doc, targetIndices);
    copiedPages.forEach((page) => newDoc.addPage(page));

    return await newDoc.save();
  }

  /**
   * Burst every page of a PDF into individual single-page documents
   */
  static async burstPdf(sourceBuffer: ArrayBuffer): Promise<{ pageNumber: number; data: Uint8Array }[]> {
    const doc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const totalPages = doc.getPageCount();
    const results: { pageNumber: number; data: Uint8Array }[] = [];

    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copiedPage] = await singleDoc.copyPages(doc, [i]);
      singleDoc.addPage(copiedPage);
      const data = await singleDoc.save();
      results.push({ pageNumber: i + 1, data });
    }

    return results;
  }

  /**
   * Rotate specific pages by specified degree increments (90, 180, 270)
   */
  static async rotatePages(sourceBuffer: ArrayBuffer, rotations: Record<number, number>): Promise<Uint8Array> {
    const doc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    const pageCount = doc.getPageCount();

    for (let i = 0; i < pageCount; i++) {
      const rotationAngle = rotations[i];
      if (rotationAngle !== undefined && rotationAngle !== 0) {
        const page = doc.getPage(i);
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationAngle) % 360));
      }
    }

    return await doc.save();
  }

  /**
   * Flatten form fields, annotations, and make content static
   */
  static async flattenPdf(sourceBuffer: ArrayBuffer): Promise<Uint8Array> {
    const doc = await PDFDocument.load(sourceBuffer, { ignoreEncryption: true });
    try {
      const form = doc.getForm();
      form.flatten();
    } catch {
      // Document might not contain interactive form fields
    }
    return await doc.save();
  }

  /**
   * Create a PDF from a list of image data URLs
   */
  static async imagesToPdf(
    images: { dataUrl: string; type: string }[],
    pageSize: 'A4' | 'LETTER' | 'FIT' = 'A4',
    margin: number = 20
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    for (const item of images) {
      let embeddedImage;
      if (item.type.includes('png')) {
        embeddedImage = await pdfDoc.embedPng(item.dataUrl);
      } else {
        embeddedImage = await pdfDoc.embedJpg(item.dataUrl);
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      let pageWidth: number;
      let pageHeight: number;

      if (pageSize === 'A4') {
        [pageWidth, pageHeight] = PageSizes.A4;
      } else if (pageSize === 'LETTER') {
        [pageWidth, pageHeight] = PageSizes.Letter;
      } else {
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      }

      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const posX = margin + (availableWidth - drawWidth) / 2;
      const posY = margin + (availableHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x: posX,
        y: posY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    return await pdfDoc.save();
  }

  /**
   * Extract structured text, headings, and lists from a PDF document
   */
  static async extractTextAndStructureFromPdf(
    sourceBuffer: ArrayBuffer,
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    markdown: string;
    plainText: string;
    pageCount: number;
    pages: { pageNumber: number; text: string; markdown: string }[];
  }> {
    const pdfjsLib = await this.loadPdfJs();
    if (!pdfjsLib) throw new Error('PDF.js renderer is not available.');

    const cloned = sourceBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(cloned) });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pagesData: { pageNumber: number; text: string; markdown: string }[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as Array<{
        str: string;
        transform: number[];
        width: number;
        height: number;
      }>;

      // Group text items by roughly the same Y coordinate (within 4pt tolerance)
      const linesMap = new Map<number, typeof items>();

      for (const item of items) {
        if (!item.str || item.str.trim() === '') continue;
        const y = Math.round(item.transform[5]); // Y coordinate
        let foundLineY: number | null = null;

        for (const existingY of linesMap.keys()) {
          if (Math.abs(existingY - y) <= 4) {
            foundLineY = existingY;
            break;
          }
        }

        if (foundLineY !== null) {
          linesMap.get(foundLineY)!.push(item);
        } else {
          linesMap.set(y, [item]);
        }
      }

      // Sort lines by Y descending (top of page to bottom)
      const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
      const pageLines: string[] = [];
      const pageRawLines: string[] = [];

      for (const y of sortedY) {
        const lineItems = linesMap.get(y)!;
        // Sort items in the line by X ascending (left to right)
        lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

        // Check if items have large horizontal gaps indicating table columns
        const isMultiColumn = lineItems.length >= 2 && lineItems.some((it, idx) => {
          if (idx === 0) return false;
          const prev = lineItems[idx - 1];
          const gap = it.transform[4] - (prev.transform[4] + prev.width);
          return gap > 30; // 30pt gap indicates column separation
        });

        let lineText = '';
        if (isMultiColumn) {
          const cells = lineItems.map((it) => it.str.trim()).filter(Boolean);
          if (cells.length >= 2) {
            lineText = `| ${cells.join(' | ')} |`;
          } else {
            lineText = lineItems.map((it) => it.str).join(' ').trim();
          }
        } else {
          // Format text with bold/italic if font indicates it
          const formattedWords = lineItems.map((it) => {
            let str = it.str;
            const fontLower = (it as any).fontName?.toLowerCase() || '';
            if (fontLower.includes('bold') && !str.startsWith('**') && str.length > 1) {
              str = `**${str}**`;
            } else if ((fontLower.includes('italic') || fontLower.includes('oblique')) && !str.startsWith('*') && str.length > 1) {
              str = `*${str}*`;
            }
            return str;
          });
          lineText = formattedWords.join(' ').trim();
        }

        if (!lineText) continue;

        pageRawLines.push(lineItems.map((it) => it.str).join(' ').trim());

        // Approximate font size from transform matrix
        const avgFontSize = lineItems.reduce((acc, it) => acc + (it.height || Math.abs(it.transform[0]) || 12), 0) / lineItems.length;

        // Detect Markdown headings based on font size / casing
        if (!lineText.startsWith('|') && (avgFontSize >= 20 || (avgFontSize >= 16 && lineText.length < 60 && !lineText.endsWith('.')))) {
          pageLines.push(`\n## ${lineText.replace(/[*_]/g, '')}\n`);
        } else if (!lineText.startsWith('|') && (avgFontSize >= 14 && lineText.length < 80 && !lineText.endsWith('.'))) {
          pageLines.push(`\n### ${lineText.replace(/[*_]/g, '')}\n`);
        } else if (lineText.startsWith('•') || lineText.startsWith('-') || lineText.startsWith('*')) {
          pageLines.push(`- ${lineText.replace(/^[•\-*]\s*/, '')}`);
        } else if (/^\d+[\.\)]\s+/.test(lineText)) {
          pageLines.push(lineText);
        } else {
          pageLines.push(lineText);
        }
      }

      // Check if consecutive table lines need a Markdown separator row
      const processedLines: string[] = [];
      let inTable = false;
      for (let lIdx = 0; lIdx < pageLines.length; lIdx++) {
        const curLine = pageLines[lIdx];
        if (curLine.startsWith('|') && curLine.endsWith('|')) {
          if (!inTable) {
            inTable = true;
            processedLines.push(curLine);
            // Insert separator row
            const colCount = curLine.split('|').length - 2;
            const sep = `| ${Array(colCount).fill('---').join(' | ')} |`;
            processedLines.push(sep);
          } else {
            processedLines.push(curLine);
          }
        } else {
          inTable = false;
          processedLines.push(curLine);
        }
      }

      const pageMd = processedLines.join('\n');
      const pagePlain = pageRawLines.join('\n');
      pagesData.push({ pageNumber: i, text: pagePlain, markdown: pageMd });

      if (onProgress) onProgress(i, numPages);
    }

    const fullMarkdown = pagesData.map((p) => p.markdown).join('\n\n');
    const fullPlainText = pagesData.map((p) => p.text).join('\n\n');

    return {
      markdown: fullMarkdown,
      plainText: fullPlainText,
      pageCount: numPages,
      pages: pagesData,
    };
  }

  /**
   * Converts a PDF directly into a styled Microsoft Word (.docx) document
   */
  static async pdfToDocx(
    sourceBuffer: ArrayBuffer,
    docTitle = 'Converted Document',
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob> {
    const { markdown } = await this.extractTextAndStructureFromPdf(sourceBuffer, onProgress);
    const { DocEngine } = await import('./docEngine');
    return await DocEngine.markdownToDocx(markdown, docTitle);
  }

  /**
   * Parse range text (e.g. "1-3, 5, 7-9") into 0-based page indices
   */
  private static parsePageRanges(rangesStr: string, totalPages: number): number[] {
    const indicesSet = new Set<number>();
    const parts = rangesStr.split(',').map((p) => p.trim()).filter(Boolean);

    for (const part of parts) {
      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = Math.max(1, parseInt(startStr, 10) || 1);
        const end = Math.min(totalPages, parseInt(endStr, 10) || totalPages);
        for (let i = start; i <= end; i++) {
          indicesSet.add(i - 1);
        }
      } else {
        const pageNum = parseInt(part, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
          indicesSet.add(pageNum - 1);
        }
      }
    }

    return Array.from(indicesSet).sort((a, b) => a - b);
  }
}

