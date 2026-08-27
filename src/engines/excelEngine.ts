/**
 * Spreadsheet & Table Extraction Engine for NovaTools
 * Generates Native Excel Workbooks (.xlsx) and CSV with Zero Data Loss
 * 100% Client-Side Web Runtime
 */

import * as XLSX from 'xlsx';
import type { DocTable } from './docTypes';

export class ExcelEngine {
  /**
   * Extracts all GFM Pipe Tables and structured key-value tables from Markdown text
   */
  static extractTablesFromMarkdown(markdown: string): DocTable[] {
    const lines = markdown.split('\n');
    const tables: DocTable[] = [];
    let currentTableLines: string[] = [];
    let currentTitle = 'Table 1';
    let tableIndex = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track preceding heading as potential table title
      if (line.startsWith('#') || line.startsWith('**')) {
        currentTitle = line.replace(/^[#*`\s]+|[#*`\s]+$/g, '');
      }

      if (line.startsWith('|') && line.endsWith('|')) {
        currentTableLines.push(line);
      } else {
        if (currentTableLines.length >= 2) {
          const parsed = this.parseTableLines(currentTableLines, currentTitle || `Table ${tableIndex++}`);
          if (parsed) tables.push(parsed);
          currentTableLines = [];
        }
      }
    }

    if (currentTableLines.length >= 2) {
      const parsed = this.parseTableLines(currentTableLines, currentTitle || `Table ${tableIndex++}`);
      if (parsed) tables.push(parsed);
    }

    return tables;
  }

  private static parseTableLines(tableLines: string[], title: string): DocTable | null {
    if (tableLines.length < 2) return null;

    const headers = tableLines[0]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());

    // Skip separator row (tableLines[1])
    const rows: string[][] = [];
    for (let r = 2; r < tableLines.length; r++) {
      const cells = tableLines[r]
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.length > 0) {
        // Pad row if missing columns
        while (cells.length < headers.length) {
          cells.push('');
        }
        rows.push(cells.slice(0, headers.length));
      }
    }

    return {
      title,
      headers,
      rows,
    };
  }

  /**
   * Generates a multi-sheet Excel Workbook (.xlsx) Blob from extracted DocTables
   */
  static generateXlsxBlob(tables: DocTable[], docTitle = 'Spreadsheet'): Blob {
    const workbook = XLSX.utils.book_new();

    if (!tables || tables.length === 0) {
      // Create empty placeholder sheet
      const ws = XLSX.utils.aoa_to_sheet([['No tabular data detected in document']]);
      XLSX.utils.book_append_sheet(workbook, ws, 'Summary');
    } else {
      tables.forEach((table, idx) => {
        // Clean sheet name (max 31 chars, no special chars: \ / ? * : [ ])
        const cleanName = (table.title || `Table ${idx + 1}`)
          .replace(/[\\/?*:[\]]/g, '_')
          .slice(0, 28);
        const sheetName = cleanName || `Sheet ${idx + 1}`;

        const sheetData: (string | number)[][] = [];

        // Headers
        sheetData.push(table.headers);

        // Data Rows with auto type conversion for numbers and currencies
        table.rows.forEach((row) => {
          const convertedRow = row.map((cell) => {
            // Check for pure number
            const numVal = Number(cell.replace(/[$,%]/g, '').trim());
            if (!isNaN(numVal) && cell.trim() !== '' && !cell.startsWith('0') && !/^\d{4}-\d{2}/.test(cell)) {
              return numVal;
            }
            return cell;
          });
          sheetData.push(convertedRow);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Auto-calculate column widths
        const colWidths = table.headers.map((h, colIdx) => {
          let maxLen = h.length;
          table.rows.forEach((r) => {
            const cellLen = r[colIdx] ? r[colIdx].length : 0;
            if (cellLen > maxLen) maxLen = cellLen;
          });
          return { wch: Math.min(Math.max(maxLen + 4, 12), 50) };
        });
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
    }

    const binaryString = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
    const buffer = new ArrayBuffer(binaryString.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      view[i] = binaryString.charCodeAt(i) & 0xff;
    }

    return new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Converts a DocTable into a clean RFC-4180 CSV string with UTF-8 BOM
   */
  static tableToCsvString(table: DocTable): string {
    const lines: string[] = [];

    const escapeCell = (cell: string) => {
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };

    // Header
    lines.push(table.headers.map(escapeCell).join(','));

    // Rows
    table.rows.forEach((row) => {
      lines.push(row.map(escapeCell).join(','));
    });

    // Add UTF-8 BOM so Excel opens with proper encoding
    return '\uFEFF' + lines.join('\r\n');
  }
}
