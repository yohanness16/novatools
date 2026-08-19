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
