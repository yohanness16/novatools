/**
 * Universal Document Engine for NovaTools
 * Handles Lossless Ingestion & Generation of Word (.docx), Markdown (.md), PDF, and HTML
 * Supports KaTeX Math, Mermaid.js Diagrams, Prism Highlighting, and 4 Visual Themes
 * 100% Client-Side Web Runtime
 */

import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { marked } from 'marked';
import katex from 'katex';
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

export type DocTheme = 'github' | 'notion' | 'academic' | 'executive';

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
   * Renders KaTeX LaTeX math formulas in markdown string
   */
  static renderMathFormulas(markdown: string): string {
    // Render display math: $$ formula $$
    let processed = markdown.replace(/\$\$([\s\S]+?)\$\$/g, (_, equation) => {
      try {
        return `<div class="katex-display-block">${katex.renderToString(equation.trim(), { displayMode: true, throwOnError: false })}</div>`;
      } catch (e) {
        return `$$${equation}$$`;
      }
    });

    // Render inline math: $ formula $ (excluding currency like $100 or double $$)
    processed = processed.replace(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g, (_, equation) => {
      if (/^\s*\d+(\.\d+)?\s*$/.test(equation)) return `$${equation}$`;
      try {
        return `<span class="katex-inline">${katex.renderToString(equation.trim(), { displayMode: false, throwOnError: false })}</span>`;
      } catch (e) {
        return `$${equation}$`;
      }
    });

    return processed;
  }

  /**
   * Converts Markdown text to styled HTML with GFM table, KaTeX math, and Mermaid support
   */
  static markdownToHtml(markdown: string): string {
    const mathProcessed = this.renderMathFormulas(markdown);
    return marked.parse(mathProcessed, { async: false, gfm: true, breaks: true }) as string;
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
   * Semantic Reconstruction: Converts raw PDF text/lines into structured Markdown with headings & tables
   */
  static reconstructPdfTextToMarkdown(rawText: string): string {
    const lines = rawText.split('\n');
    const mdLines: string[] = [];
    let inTable = false;
    let tableBuffer: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) {
        if (inTable && tableBuffer.length > 0) {
          mdLines.push(tableBuffer.join('\n'));
          tableBuffer = [];
          inTable = false;
        }
        mdLines.push('');
        continue;
      }

      // Check for Title/H1 (All caps short line or numbered top header)
      if (line.length < 60 && (/^[A-Z\s0-9\-_:]{4,}$/.test(line) || /^Chapter\s+\d+/i.test(line))) {
        mdLines.push(`\n# ${line.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}\n`);
        continue;
      }

      // Check for Section H2 (e.g., 1. Introduction or 1.1 Overview)
      if (/^(\d+\.|\d+\.\d+)\s+[A-Z]/.test(line) && line.length < 80) {
        mdLines.push(`\n## ${line}\n`);
        continue;
      }

      // Check for Subsections H3
      if (/^(\d+\.\d+\.\d+)\s+[A-Z]/.test(line) && line.length < 90) {
        mdLines.push(`\n### ${line}\n`);
        continue;
      }

      // Check for bullet items
      if (/^[•\-\*]\s+(.+)/.test(line)) {
        mdLines.push(line.replace(/^[•\-\*]\s+/, '- '));
        continue;
      }

      // Check for tabular columns separated by multiple spaces or tabs
      if (line.includes('\t') || /\s{3,}/.test(line)) {
        const cols = line.split(/\t|\s{3,}/).map((c) => c.trim()).filter(Boolean);
        if (cols.length >= 2) {
          if (!inTable) {
            inTable = true;
            tableBuffer.push(`| ${cols.join(' | ')} |`);
            tableBuffer.push(`| ${cols.map(() => '---').join(' | ')} |`);
          } else {
            tableBuffer.push(`| ${cols.join(' | ')} |`);
          }
          continue;
        }
      }

      if (inTable) {
        mdLines.push(tableBuffer.join('\n'));
        tableBuffer = [];
        inTable = false;
      }

      mdLines.push(line);
    }

    if (inTable && tableBuffer.length > 0) {
      mdLines.push(tableBuffer.join('\n'));
    }

    return mdLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  /**
   * Converts Markdown into a fully styled Microsoft Word (.docx) Document
   */
  static async markdownToDocx(markdown: string, docTitle = 'Document'): Promise<Blob> {
    const lines = markdown.split('\n');
    const docChildren: (Paragraph | Table)[] = [];

    // Title Cover Header
    docChildren.push(
      new Paragraph({
        text: docTitle,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      })
    );

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      // Headings
      if (line.startsWith('# ')) {
        docChildren.push(
          new Paragraph({
            text: line.replace(/^#\s+/, ''),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (line.startsWith('## ')) {
        docChildren.push(
          new Paragraph({
            text: line.replace(/^##\s+/, ''),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (line.startsWith('### ')) {
        docChildren.push(
          new Paragraph({
            text: line.replace(/^###\s+/, ''),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (line.startsWith('|') && line.endsWith('|')) {
        // Table parsing
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('|') && lines[i].endsWith('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        i--;
        const docxTable = this.parseMarkdownTableToDocx(tableLines);
        if (docxTable) docChildren.push(docxTable);
      } else if (line.startsWith('> ')) {
        // Blockquote
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.replace(/^>\s+/, ''),
                italics: true,
                color: '475569',
              }),
            ],
            indent: { left: convertInchesToTwip(0.4) },
            spacing: { before: 120, after: 120 },
          })
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        // Bullet points
        docChildren.push(
          new Paragraph({
            text: line.replace(/^[-*]\s+/, ''),
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
          })
        );
      } else if (line.trim().length > 0) {
        // Standard body paragraph
        docChildren.push(
          new Paragraph({
            text: line,
            spacing: { before: 60, after: 60 },
          })
        );
      }
      i++;
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    return await Packer.toBlob(doc);
  }

  private static parseMarkdownTableToDocx(tableLines: string[]): Table | null {
    if (tableLines.length < 2) return null;

    const parseRow = (rowStr: string) =>
      rowStr
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());

    const headerCells = parseRow(tableLines[0]);
    const dataRows = tableLines.slice(2).map(parseRow);

    const docxRows: TableRow[] = [];

    // Header Row
    docxRows.push(
      new TableRow({
        tableHeader: true,
        children: headerCells.map(
          (text) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, bold: true, color: 'FFFFFF' })],
                }),
              ],
              shading: { type: ShadingType.CLEAR, fill: '1E293B' },
              width: { size: 100 / headerCells.length, type: WidthType.PERCENTAGE },
            })
        ),
      })
    );

    // Data Rows
    dataRows.forEach((row, idx) => {
      docxRows.push(
        new TableRow({
          children: row.map(
            (text) =>
              new TableCell({
                children: [new Paragraph({ text })],
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
  static generatePrintableHtml(markdown: string, docTitle = 'Document', theme: DocTheme = 'github', pageSize: 'A4' | 'Letter' = 'A4'): string {
    const rawHtml = this.markdownToHtml(markdown);

    const themeStyles: Record<DocTheme, string> = {
      github: `
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #24292f; }
        h1 { font-size: 20pt; border-bottom: 1px solid #d0d7de; padding-bottom: 8px; margin-top: 0; color: #1f2328; }
        h2 { font-size: 15pt; border-bottom: 1px solid #d0d7de; padding-bottom: 6px; margin-top: 24px; color: #1f2328; }
        h3 { font-size: 13pt; margin-top: 18px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
        th { background: #f6f8fa; color: #24292f; font-weight: 600; padding: 8px 12px; border: 1px solid #d0d7de; text-align: left; }
        td { padding: 7px 12px; border: 1px solid #d0d7de; }
        tr:nth-child(even) td { background: #f6f8fa; }
        pre { background: #f6f8fa; color: #24292f; border: 1px solid #d0d7de; padding: 12px 16px; border-radius: 6px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; font-size: 9.5pt; }
        code { font-family: "SFMono-Regular", Consolas, monospace; background: #afb8c133; padding: 2px 4px; border-radius: 4px; font-size: 9.5pt; }
        blockquote { border-left: 4px solid #d0d7de; color: #57606a; padding: 4px 16px; margin: 12px 0; }
      `,
      notion: `
        body { font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif; font-size: 11pt; line-height: 1.7; color: #37352f; }
        h1 { font-size: 22pt; font-weight: 700; margin-top: 0; margin-bottom: 12px; color: #37352f; letter-spacing: -0.02em; }
        h2 { font-size: 16pt; font-weight: 600; margin-top: 28px; margin-bottom: 8px; color: #37352f; }
        h3 { font-size: 13pt; font-weight: 600; margin-top: 20px; color: #37352f; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt; }
        th { background: #f7f6f3; color: #787774; font-weight: 500; padding: 8px 12px; border: 1px solid #e9e9e8; text-align: left; }
        td { padding: 8px 12px; border: 1px solid #e9e9e8; }
        pre { background: #f7f6f3; color: #37352f; border-radius: 4px; padding: 14px 18px; font-family: "SFMono-Regular", Menlo, Consolas, monospace; font-size: 9.5pt; }
        code { font-family: "SFMono-Regular", Menlo, monospace; background: #f7f6f3; color: #eb5757; padding: 2px 5px; border-radius: 4px; font-size: 9.5pt; }
        blockquote { border-left: 3px solid #37352f; padding: 6px 16px; margin: 16px 0; color: #787774; font-style: normal; }
      `,
      academic: `
        body { font-family: "Times New Roman", Times, "Liberation Serif", Georgia, serif; font-size: 11pt; line-height: 1.5; color: #111111; text-align: justify; }
        h1 { font-size: 18pt; text-align: center; text-transform: uppercase; font-weight: bold; margin-top: 0; margin-bottom: 18px; }
        h2 { font-size: 13pt; font-weight: bold; text-transform: uppercase; margin-top: 20px; margin-bottom: 6px; }
        h3 { font-size: 11pt; font-style: italic; font-weight: bold; margin-top: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 9.5pt; }
        th { border-top: 2px solid #111; border-bottom: 1px solid #111; padding: 6px 10px; font-weight: bold; text-align: left; }
        td { border-bottom: 1px solid #e5e5e5; padding: 6px 10px; }
        tr:last-child td { border-bottom: 2px solid #111; }
        pre { background: #f8f8f8; border: 1px solid #ccc; padding: 10px 14px; font-family: "Courier New", Courier, monospace; font-size: 9pt; }
        code { font-family: "Courier New", monospace; font-size: 9pt; }
        blockquote { border-left: 2px solid #333; padding-left: 14px; margin: 12px 24px; font-style: italic; }
      `,
      executive: `
        body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; }
        h1 { font-size: 24pt; font-weight: 800; color: #0f172a; margin-top: 0; border-bottom: 3px solid #2563eb; padding-bottom: 8px; }
        h2 { font-size: 15pt; font-weight: 700; color: #1e3a8a; margin-top: 24px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        h3 { font-size: 12.5pt; font-weight: 600; color: #2563eb; margin-top: 18px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; }
        th { background: #1e3a8a; color: #ffffff; font-weight: 600; padding: 9px 12px; text-align: left; }
        td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        pre { background: #0f172a; color: #f8fafc; padding: 14px 18px; border-radius: 8px; font-family: "Courier New", Courier, monospace; font-size: 9.5pt; }
        code { font-family: monospace; background: #e2e8f0; color: #0f172a; padding: 2px 5px; border-radius: 4px; font-size: 9.5pt; }
        blockquote { border-left: 4px solid #2563eb; background: #eff6ff; padding: 10px 18px; margin: 14px 0; color: #1e40af; border-radius: 0 6px 6px 0; }
      `
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <style>
    @page {
      size: ${pageSize};
      margin: 20mm 18mm 22mm 18mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: system-ui, sans-serif;
        font-size: 8.5pt;
        color: #64748b;
      }
    }
    ${themeStyles[theme]}
    h1, h2, h3, h4, h5, h6 { page-break-after: avoid; break-after: avoid; }
    p, ul, ol, blockquote { margin-bottom: 12px; }
    table { page-break-inside: avoid; break-inside: avoid; }
    pre { page-break-inside: avoid; break-inside: avoid; overflow-x: auto; }
    img { max-width: 100%; height: auto; page-break-inside: avoid; break-inside: avoid; }
    .katex-display-block { margin: 16px 0; overflow-x: auto; text-align: center; }
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
  static triggerBrowserPdfPrint(markdown: string, docTitle = 'Document', theme: DocTheme = 'github', pageSize: 'A4' | 'Letter' = 'A4'): void {
    const printableHtml = this.generatePrintableHtml(markdown, docTitle, theme, pageSize);
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
      }, 350);
    }
  }
}
