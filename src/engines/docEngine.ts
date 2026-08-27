/**
 * Universal Document Engine for NovaTools
 * Handles Lossless Ingestion & Generation of Word (.docx), Markdown (.md), PDF, and HTML
 * 100% Client-Side Web Runtime
 */

import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  convertInchesToTwip,
} from 'docx';
import type { DocMetadata, DocTable } from './docTypes';

export class DocEngine {
  private static turndownService: TurndownService | null = null;

  private static getTurndown(): TurndownService {
    if (!this.turndownService) {
      this.turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        strongDelimiter: '**',
      });
      this.turndownService.use(gfm);
    }
    return this.turndownService;
  }

  /**
   * Converts uploaded Word DOCX ArrayBuffer into clean GitHub Flavored Markdown
   */
  static async docxToMarkdown(arrayBuffer: ArrayBuffer): Promise<{ markdown: string; html: string; warnings: string[] }> {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;
    const warnings = result.messages.map((m) => m.message);
    const turndown = this.getTurndown();
    const markdown = turndown.turndown(html);
    return { markdown, html, warnings };
  }

  /**
   * Converts Markdown text to styled HTML with GFM table support
   */
  static markdownToHtml(markdown: string): string {
    return marked.parse(markdown, { async: false, gfm: true, breaks: true }) as string;
  }

  /**
   * Extracts quantitative metadata from document content
   */
  static getDocMetadata(content: string, defaultTitle = 'Untitled Document'): DocMetadata {
    const cleanText = content.replace(/[#*`~_\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;
    const charCount = content.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

    // Extract first H1 as title if present
    const h1Match = content.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1].trim() : defaultTitle;

    // Detect tables
    const tableMatches = content.match(/\|(.+)\|/g) || [];
    const detectedTablesCount = tableMatches.length > 0 ? Math.ceil(tableMatches.length / 3) : 0;

    // Detect headings
    const headingMatches = content.match(/^#{1,6}\s+.+$/gm) || [];
    const detectedHeadingsCount = headingMatches.length;

    return {
      title,
      wordCount: words,
      charCount,
      readingTimeMinutes,
      detectedTablesCount,
      detectedHeadingsCount,
    };
  }

  /**
   * Converts Markdown into a fully styled Microsoft Word (.docx) Document
   */
  static async markdownToDocx(markdown: string, docTitle = 'Document'): Promise<Blob> {
    const lines = markdown.split('\n');
    const docChildren: (Paragraph | Table)[] = [];

    // Header Title Banner
    docChildren.push(
      new Paragraph({
        text: docTitle,
        heading: HeadingLevel.TITLE,
        spacing: { after: convertInchesToTwip(0.3) },
      })
    );

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      // Check for Markdown Table: starts with |
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }

        const table = this.createDocxTableFromMarkdown(tableLines);
        if (table) {
          docChildren.push(table);
          docChildren.push(new Paragraph({ text: '', spacing: { after: 120 } }));
        }
        continue;
      }

      // Headings
      if (trimmed.startsWith('# ')) {
        docChildren.push(
          new Paragraph({
            text: trimmed.replace(/^#\s+/, ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (trimmed.startsWith('## ')) {
        docChildren.push(
          new Paragraph({
            text: trimmed.replace(/^##\s+/, ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (trimmed.startsWith('### ')) {
        docChildren.push(
          new Paragraph({
            text: trimmed.replace(/^###\s+/, ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (trimmed.startsWith('#### ')) {
        docChildren.push(
          new Paragraph({
            text: trimmed.replace(/^####\s+/, ''),
            heading: HeadingLevel.HEADING_4,
            spacing: { before: 120, after: 60 },
          })
        );
      } else if (trimmed.startsWith('> ')) {
        // Blockquote / Callout
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: trimmed.replace(/^>\s+/, ''),
                italics: true,
                color: '475569',
              }),
            ],
            shading: {
              type: ShadingType.CLEAR,
              fill: 'F1F5F9',
            },
            spacing: { before: 100, after: 100 },
          })
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // Bullet List
        docChildren.push(
          new Paragraph({
            children: this.parseInlineFormatting(trimmed.replace(/^[-*]\s+/, '')),
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      } else if (/^\d+\.\s+/.test(trimmed)) {
        // Numbered List
        docChildren.push(
          new Paragraph({
            children: this.parseInlineFormatting(trimmed.replace(/^\d+\.\s+/, '')),
            bullet: { level: 0 },
            spacing: { after: 60 },
          })
        );
      } else if (trimmed.startsWith('```')) {
        // Code Block
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeLines.join('\n'),
                font: 'Courier New',
                size: 20,
                color: '1E293B',
              }),
            ],
            shading: {
              type: ShadingType.CLEAR,
              fill: 'F8FAFC',
            },
            spacing: { before: 120, after: 120 },
          })
        );
      } else {
        // Standard Paragraph with inline formatting
        docChildren.push(
          new Paragraph({
            children: this.parseInlineFormatting(trimmed),
            spacing: { after: 120 },
          })
        );
      }

      i++;
    }

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(1),
                right: convertInchesToTwip(1),
                bottom: convertInchesToTwip(1),
                left: convertInchesToTwip(1),
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  }

  /**
   * Helper to parse bold, italic, and inline code formatting into DOCX TextRuns
   */
  private static parseInlineFormatting(text: string): TextRun[] {
    const runs: TextRun[] = [];
    const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|([^*`]+))/g;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (match[2]) {
        // Bold
        runs.push(new TextRun({ text: match[2], bold: true }));
      } else if (match[3]) {
        // Italic
        runs.push(new TextRun({ text: match[3], italics: true }));
      } else if (match[4]) {
        // Inline Code
        runs.push(new TextRun({ text: match[4], font: 'Courier New', shading: { type: ShadingType.CLEAR, fill: 'E2E8F0' } }));
      } else if (match[5]) {
        // Plain Text
        runs.push(new TextRun({ text: match[5] }));
      }
    }

    if (runs.length === 0) {
      runs.push(new TextRun({ text }));
    }

    return runs;
  }

  /**
   * Creates a structured Word Table from Markdown table lines
   */
  private static createDocxTableFromMarkdown(tableLines: string[]): Table | null {
    if (tableLines.length < 2) return null;

    // Header row
    const headerRowStr = tableLines[0];
    const headerCells = headerRowStr
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    // Body rows (skip separator row at index 1)
    const bodyRows: string[][] = [];
    for (let r = 2; r < tableLines.length; r++) {
      const cells = tableLines[r]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.length > 0) {
        bodyRows.push(cells);
      }
    }

    const docxRows: TableRow[] = [];

    // Header TableRow
    docxRows.push(
      new TableRow({
        tableHeader: true,
        children: headerCells.map(
          (text) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: 'FFFFFF' })], alignment: AlignmentType.CENTER })],
              shading: { type: ShadingType.CLEAR, fill: '4F46E5' }, // Indigo-600
              width: { size: 100 / headerCells.length, type: WidthType.PERCENTAGE },
            })
        ),
      })
    );

    // Body TableRows
    bodyRows.forEach((row, idx) => {
      docxRows.push(
        new TableRow({
          children: row.map(
            (cellText) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: cellText })] })],
                shading: {
                  type: ShadingType.CLEAR,
                  fill: idx % 2 === 0 ? 'F8FAFC' : 'FFFFFF',
                },
                width: { size: 100 / headerCells.length, type: WidthType.PERCENTAGE },
              })
          ),
        })
      );
    });

    return new Table({
      rows: docxRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.NONE },
      },
    });
  }

  /**
   * Generates a high-fidelity printable HTML document with embedded CSS Paged Media for vector PDF export
   */
  static generatePrintableHtml(markdown: string, docTitle = 'Document'): string {
    const rawHtml = this.markdownToHtml(markdown);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 18mm 25mm 18mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: system-ui, sans-serif;
        font-size: 9pt;
        color: #64748b;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 { font-size: 22pt; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; color: #4338ca; }
    h2 { font-size: 16pt; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    h3 { font-size: 13pt; margin-top: 18px; }
    p, ul, ol, blockquote {
      margin-bottom: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
      page-break-inside: avoid;
      break-inside: avoid;
      font-size: 10pt;
    }
    th {
      background: #4f46e5;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #4338ca;
    }
    td {
      padding: 7px 12px;
      border: 1px solid #e2e8f0;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }
    pre {
      background: #0f172a;
      color: #f8fafc;
      padding: 12px 16px;
      border-radius: 6px;
      font-family: "Courier New", Courier, monospace;
      font-size: 9.5pt;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    code {
      font-family: "Courier New", Courier, monospace;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 5px;
      border-radius: 4px;
      font-size: 9.5pt;
    }
    pre code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
    blockquote {
      border-left: 4px solid #6366f1;
      background: #f8fafc;
      padding: 8px 16px;
      margin: 14px 0;
      color: #475569;
      font-style: italic;
    }
    img {
      max-width: 100%;
      height: auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="document-content">
    ${rawHtml}
  </div>
</body>
</html>`;
  }

  /**
   * Triggers the native browser print preview dialog rendering crisp vector PDF
   */
  static triggerBrowserPdfPrint(markdown: string, docTitle = 'Document'): void {
    const printableHtml = this.generatePrintableHtml(markdown, docTitle);
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(printableHtml);
      frameDoc.close();

      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 300);
    }
  }
}
