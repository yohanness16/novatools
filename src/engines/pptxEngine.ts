/**
 * Presentation & Slide Deck Engine for NovaTools
 * Generates Native PowerPoint Presentations (.pptx) from Markdown & Universal AST
 * Features AI-Level Content Ingestion, Onyx Dark Theme, Bento Grid Cards, and Multi-Column Layouts
 * 100% Client-Side Web Runtime
 */

import pptxgen from 'pptxgenjs';
import type { DocSlide, SlideTheme, DocTable } from './docTypes';

export type AdvancedSlideTheme = 'onyx-dark' | 'dark-indigo' | 'corporate-blue' | 'minimal-emerald' | 'sunset-modern';

interface ThemeColorPalette {
  background: string;
  cardBg: string;
  accent: string;
  accentSecondary: string;
  text: string;
  subtext: string;
  border: string;
  codeBg: string;
}

export class PptxEngine {
  public static THEMES: Record<string, ThemeColorPalette> = {
    'onyx-dark': {
      background: '0A0B0E',
      cardBg: '141721',
      accent: '3B82F6', // Electric Blue
      accentSecondary: '10B981', // Emerald
      text: 'F8FAFC',
      subtext: '94A3B8',
      border: '282E3E',
      codeBg: '07080B',
    },
    'dark-indigo': {
      background: '09090B',
      cardBg: '18181B',
      accent: '6366F1',
      accentSecondary: 'A855F7',
      text: 'F8FAFC',
      subtext: '94A3B8',
      border: '27272A',
      codeBg: '050507',
    },
    'corporate-blue': {
      background: 'FFFFFF',
      cardBg: 'F8FAFC',
      accent: '1E40AF',
      accentSecondary: '0284C7',
      text: '0F172A',
      subtext: '475569',
      border: 'E2E8F0',
      codeBg: '0F172A',
    },
    'minimal-emerald': {
      background: '022C22',
      cardBg: '064E3B',
      accent: '10B981',
      accentSecondary: '34D399',
      text: 'F0FDF4',
      subtext: 'A7F3D0',
      border: '065F46',
      codeBg: '011A14',
    },
    'sunset-modern': {
      background: '18181B',
      cardBg: '27272A',
      accent: 'F97316',
      accentSecondary: 'FB923C',
      text: 'FAFAFA',
      subtext: 'A1A1AA',
      border: '3F3F46',
      codeBg: '0F0F12',
    },
  };

  /**
   * AI-Level Smart Semantic Content Ingestion:
   * Analyzes document structure, statistical indicators, tables, and comparisons
   * to automatically produce visually balanced, high-converting keynote slide decks.
   */
  static markdownToSlides(markdown: string): DocSlide[] {
    const rawSections = markdown.split(/\n(?=#{1,3}\s+)/);
    const slides: DocSlide[] = [];
    let slideIndex = 1;

    for (let sIdx = 0; sIdx < rawSections.length; sIdx++) {
      const section = rawSections[sIdx].trim();
      if (!section) continue;

      const lines = section.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const headerMatch = lines[0].match(/^(#{1,3})\s+(.+)$/);
      const title = headerMatch ? headerMatch[2].replace(/[*_`]/g, '') : `Slide ${slideIndex}`;
      const headerLevel = headerMatch ? headerMatch[1].length : 2;
      const bodyLines = headerMatch ? lines.slice(1) : lines;

      // 1. First H1 Header is always a Hero Title Slide
      if (sIdx === 0 && headerLevel === 1) {
        const subtitleLine = bodyLines.find((l) => !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('`')) || '';
        slides.push({
          id: `slide-${slideIndex++}`,
          title: title,
          subtitle: subtitleLine.replace(/[*_`]/g, ''),
          layout: 'title',
          bullets: bodyLines.filter((l) => l.startsWith('- ') || l.startsWith('* ')).map((b) => b.replace(/^[-*]\s+/, '').replace(/[*_`]/g, '')),
          speakerNotes: `Welcome everyone. Today we are presenting ${title}.`,
        });
        continue;
      }

      // 2. Check for Code Block Slide
      const codeBlockMatch = section.match(/```(\w*)\n([\s\S]+?)```/);
      if (codeBlockMatch) {
        slides.push({
          id: `slide-${slideIndex++}`,
          title: title,
          layout: 'code',
          codeSnippet: {
            language: codeBlockMatch[1] || 'typescript',
            code: codeBlockMatch[2].trim(),
          },
          speakerNotes: `Walk through the implementation logic and architecture for ${title}.`,
        });
        continue;
      }

      // 3. Check for Table Slide
      if (section.includes('|') && bodyLines.some((l) => l.startsWith('|') && l.endsWith('|'))) {
        const tableLines = bodyLines.filter((l) => l.startsWith('|') && l.endsWith('|'));
        if (tableLines.length >= 2) {
          const headers = tableLines[0].split('|').slice(1, -1).map((c) => c.trim().replace(/[*_`]/g, ''));
          const rows: string[][] = [];
          for (let r = 2; r < tableLines.length; r++) {
            const cells = tableLines[r].split('|').slice(1, -1).map((c) => c.trim().replace(/[*_`]/g, ''));
            if (cells.length > 0) rows.push(cells);
          }
          slides.push({
            id: `slide-${slideIndex++}`,
            title: title,
            layout: 'table',
            tableData: { headers, rows },
            speakerNotes: `Review the comparative data matrix and performance specifications.`,
          });
          continue;
        }
      }

      // 4. Check for Blockquote Slide
      const quoteLine = bodyLines.find((l) => l.startsWith('> '));
      if (quoteLine && bodyLines.length <= 3) {
        const quoteText = quoteLine.replace(/^>\s+/, '').replace(/[*_`]/g, '');
        slides.push({
          id: `slide-${slideIndex++}`,
          title: title,
          layout: 'quote',
          quoteText: quoteText,
          quoteAuthor: 'Executive Strategy Directive',
          speakerNotes: `Emphasize this core principle: "${quoteText}"`,
        });
        continue;
      }

      // 5. Check for Metrics / Stats Slide (Look for numbers with %, $, K, M, ms, x)
      const metricLines = bodyLines.filter((l) => {
        const cleaned = l.replace(/^[-*]\s+|\d+\.\s+/, '');
        return /([$€£¥]?[0-9,.]+[KM%Bx+]?)\s*[-:]\s*(.+)/i.test(cleaned) || /\b\d+(\.\d+)?(%)|\b\d+x\b|\b\$\d+/i.test(cleaned);
      });

      if (metricLines.length >= 2) {
        const bullets = metricLines.map((m) => m.replace(/^[-*]\s+|\d+\.\s+/, '').replace(/[*_`]/g, ''));
        slides.push({
          id: `slide-${slideIndex++}`,
          title: title,
          layout: 'stats',
          bullets: bullets,
          speakerNotes: `Highlight critical milestones, quantitative KPIs, and growth vectors.`,
        });
        continue;
      }

      // 6. Check for Agenda / Roadmaps / Milestones
      if (/agenda|roadmap|table of contents|overview|timeline/i.test(title)) {
        const bullets = bodyLines.map((l) => l.replace(/^[-*]\s+|\d+\.\s+/, '').replace(/[*_`]/g, ''));
        slides.push({
          id: `slide-${slideIndex++}`,
          title: title,
          layout: 'agenda',
          bullets: bullets.slice(0, 5),
          speakerNotes: `Outline today's roadmap and strategic agenda items.`,
        });
        continue;
      }

      // 7. Check for Two-Column Comparison / Split
      const bulletItems = bodyLines
        .filter((l) => l.startsWith('- ') || l.startsWith('* ') || /^\d+\.\s+/.test(l) || (l.length > 0 && !l.startsWith('#')))
        .map((l) => l.replace(/^[-*]\s+|\d+\.\s+/, '').replace(/[*_`]/g, ''));

      if (bulletItems.length >= 4 && bulletItems.length % 2 === 0) {
        const half = bulletItems.length / 2;
        slides.push({
          id: `slide-${slideIndex++}`,
          title: title,
          layout: 'two-column',
          columns: [
            { title: 'Core Advantages', bullets: bulletItems.slice(0, half) },
            { title: 'Strategic Execution', bullets: bulletItems.slice(half) },
          ],
          speakerNotes: `Break down the primary pillars and execution mechanics for ${title}.`,
        });
        continue;
      }

      // 8. Default High-Impact Content Slide
      slides.push({
        id: `slide-${slideIndex++}`,
        title: title,
        layout: 'content',
        bullets: bulletItems.length > 0 ? bulletItems.slice(0, 5) : ['Key objective overview', 'Detailed contextual insight', 'Actionable recommendation'],
        speakerNotes: `Present the key strategic findings of ${title} clearly to stakeholders.`,
      });
    }

    // If only 1 slide generated, ensure title slide is properly formatted
    if (slides.length === 1 && slides[0].layout === 'content') {
      slides[0].layout = 'title';
    }

    return slides;
  }

  /**
   * Generates a native PowerPoint presentation (.pptx) Blob with 16:9 Widescreen Onyx Dark Theme
   */
  static async generatePptxBlob(slides: DocSlide[], theme: SlideTheme | AdvancedSlideTheme = 'onyx-dark'): Promise<Blob> {
    const pptx = new pptxgen();
    const colors = this.THEMES[theme] || this.THEMES['onyx-dark'];

    // 16:9 Widescreen Layout (13.33 x 7.5 inches)
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'NovaTools AI Presentation Suite';
    pptx.company = 'NovaTools';

    for (let index = 0; index < slides.length; index++) {
      const slideData = slides[index];
      const slide = pptx.addSlide();

      // Background color
      slide.background = { color: colors.background };

      // Footer / Page Counter / Branding
      slide.addText(`NovaTools Onyx  •  Slide ${index + 1} of ${slides.length}`, {
        x: 0.8,
        y: 6.9,
        w: 11.7,
        h: 0.35,
        fontSize: 9.5,
        color: colors.subtext,
        align: 'right',
      });

      // Speaker Notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }

      switch (slideData.layout) {
        // ==========================================
        // 1. HERO KEYNOTE TITLE SLIDE
        // ==========================================
        case 'title': {
          // Category Pill Tag
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 1.2,
            y: 1.8,
            w: 2.2,
            h: 0.4,
            fill: { color: colors.cardBg },
            line: { color: colors.accent, width: 1 },
          });

          slide.addText('KEYNOTE BRIEF', {
            x: 1.2,
            y: 1.8,
            w: 2.2,
            h: 0.4,
            fontSize: 10,
            bold: true,
            color: colors.accent,
            align: 'center',
          });

          // Large Title
          slide.addText(slideData.title, {
            x: 1.2,
            y: 2.4,
            w: 10.8,
            h: 1.8,
            fontSize: 42,
            bold: true,
            color: colors.text,
            align: 'left',
          });

          // Horizontal Accent Bar
          slide.addShape(pptx.ShapeType.rect, {
            x: 1.2,
            y: 4.4,
            w: 1.6,
            h: 0.08,
            fill: { color: colors.accent },
            line: { color: colors.accent },
          });

          // Subtitle / Executive Summary Card
          const subText =
            slideData.subtitle ||
            (slideData.bullets && slideData.bullets.length > 0
              ? slideData.bullets.join('  •  ')
              : '100% Client-Side In-Browser Executive Presentation');

          slide.addText(subText, {
            x: 1.2,
            y: 4.6,
            w: 10.5,
            h: 1.4,
            fontSize: 18,
            color: colors.subtext,
            align: 'left',
          });
          break;
        }

        // ==========================================
        // 2. STATS & MULTI-METRIC KPI GRID SLIDE
        // ==========================================
        case 'stats': {
          // Section Kicker
          slide.addText('KEY PERFORMANCE INDICATORS', {
            x: 0.8,
            y: 0.6,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: colors.accent,
          });

          // Slide Title
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.7,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          const statItems = slideData.bullets && slideData.bullets.length > 0
            ? slideData.bullets
            : [slideData.statNumber ? `${slideData.statNumber} - ${slideData.statLabel || 'Metric'}` : '99.9% - Reliability'];

          const cardCount = Math.min(4, Math.max(2, statItems.length));
          const cardWidth = (11.5 - (cardCount - 1) * 0.3) / cardCount;

          statItems.slice(0, 4).forEach((item, idx) => {
            const cardX = 0.8 + idx * (cardWidth + 0.3);
            const cardY = 1.9;
            const cardHeight = 4.6;

            // Stat Card Container
            slide.addShape(pptx.ShapeType.roundRect, {
              x: cardX,
              y: cardY,
              w: cardWidth,
              h: cardHeight,
              fill: { color: colors.cardBg },
              line: { color: idx === 0 ? colors.accent : colors.border, width: 1.5 },
            });

            // Parse stat number vs label
            const match = item.match(/^([$€£¥]?[0-9,.]+[KM%Bx+]?)\s*[-:]\s*(.+)$/i);
            const num = match ? match[1] : item.split(' ')[0];
            const label = match ? match[2] : item.replace(num, '').trim() || 'Performance Score';

            // Big Number
            slide.addText(num, {
              x: cardX + 0.2,
              y: cardY + 0.8,
              w: cardWidth - 0.4,
              h: 1.2,
              fontSize: 38,
              bold: true,
              color: idx % 2 === 0 ? colors.accent : colors.accentSecondary,
              align: 'center',
            });

            // Divider line
            slide.addShape(pptx.ShapeType.rect, {
              x: cardX + 0.4,
              y: cardY + 2.2,
              w: cardWidth - 0.8,
              h: 0.04,
              fill: { color: colors.border },
              line: { color: colors.border },
            });

            // Label text
            slide.addText(label, {
              x: cardX + 0.3,
              y: cardY + 2.4,
              w: cardWidth - 0.6,
              h: 1.8,
              fontSize: 14,
              color: colors.text,
              align: 'center',
            });
          });
          break;
        }

        // ==========================================
        // 3. TWO-COLUMN SPLIT COMPARISON SLIDE
        // ==========================================
        case 'two-column': {
          slide.addText('STRATEGIC BREAKDOWN', {
            x: 0.8,
            y: 0.6,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: colors.accent,
          });

          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.7,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          const cols = slideData.columns && slideData.columns.length >= 2
            ? slideData.columns
            : [
                { title: 'Core Advantages', bullets: slideData.bullets?.slice(0, 3) || ['Scalable design', 'Instant execution'] },
                { title: 'Implementation', bullets: slideData.bullets?.slice(3) || ['Zero dependencies', 'Private compute'] },
              ];

          cols.slice(0, 2).forEach((col, cIdx) => {
            const colX = 0.8 + cIdx * 5.9;
            const colY = 1.9;

            // Column Card
            slide.addShape(pptx.ShapeType.roundRect, {
              x: colX,
              y: colY,
              w: 5.6,
              h: 4.6,
              fill: { color: colors.cardBg },
              line: { color: cIdx === 0 ? colors.accent : colors.border, width: 1.5 },
            });

            // Column Header
            slide.addText(col.title || `Pillar ${cIdx + 1}`, {
              x: colX + 0.4,
              y: colY + 0.3,
              w: 4.8,
              h: 0.5,
              fontSize: 18,
              bold: true,
              color: cIdx === 0 ? colors.accent : colors.accentSecondary,
            });

            const bullets = col.bullets.map((b) => ({
              text: b,
              options: {
                bullet: true,
                fontSize: 14,
                color: colors.text,
                breakLine: true,
                spaceBefore: 10,
              },
            }));

            slide.addText(bullets, {
              x: colX + 0.4,
              y: colY + 1.0,
              w: 4.8,
              h: 3.2,
            });
          });
          break;
        }

        // ==========================================
        // 4. NUMBERED AGENDA / ROADMAP SLIDE
        // ==========================================
        case 'agenda': {
          slide.addText('EXECUTIVE ROADMAP', {
            x: 0.8,
            y: 0.6,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: colors.accent,
          });

          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.7,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          const items = slideData.bullets && slideData.bullets.length > 0 ? slideData.bullets.slice(0, 4) : ['Executive Brief', 'Architecture', 'Execution Plan', 'Next Steps'];

          items.forEach((item, idx) => {
            const itemY = 1.9 + idx * 1.15;

            // Agenda item background card
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 0.8,
              y: itemY,
              w: 11.7,
              h: 0.95,
              fill: { color: colors.cardBg },
              line: { color: colors.border, width: 1 },
            });

            // Number badge
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 1.1,
              y: itemY + 0.15,
              w: 0.8,
              h: 0.65,
              fill: { color: idx === 0 ? colors.accent : '282E3E' },
            });

            slide.addText(`0${idx + 1}`, {
              x: 1.1,
              y: itemY + 0.15,
              w: 0.8,
              h: 0.65,
              fontSize: 14,
              bold: true,
              color: 'FFFFFF',
              align: 'center',
            });

            // Item text
            slide.addText(item, {
              x: 2.2,
              y: itemY + 0.2,
              w: 10.0,
              h: 0.55,
              fontSize: 16,
              bold: true,
              color: colors.text,
            });
          });
          break;
        }

        // ==========================================
        // 5. CODE & TECHNICAL ARCHITECTURE SLIDE
        // ==========================================
        case 'code': {
          slide.addText('TECHNICAL IMPLEMENTATION', {
            x: 0.8,
            y: 0.6,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: colors.accent,
          });

          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.7,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          // Terminal window card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 1.8,
            w: 11.7,
            h: 4.8,
            fill: { color: colors.codeBg },
            line: { color: colors.border, width: 1.5 },
          });

          // macOS window buttons (Red, Yellow, Green dots)
          slide.addShape(pptx.ShapeType.oval, { x: 1.1, y: 2.05, w: 0.16, h: 0.16, fill: { color: 'EF4444' } });
          slide.addShape(pptx.ShapeType.oval, { x: 1.35, y: 2.05, w: 0.16, h: 0.16, fill: { color: 'F59E0B' } });
          slide.addShape(pptx.ShapeType.oval, { x: 1.6, y: 2.05, w: 0.16, h: 0.16, fill: { color: '10B981' } });

          // Language Tag
          slide.addText((slideData.codeSnippet?.language || 'typescript').toUpperCase(), {
            x: 9.8,
            y: 1.95,
            w: 2.4,
            h: 0.35,
            fontSize: 10,
            bold: true,
            color: colors.accent,
            align: 'right',
          });

          // Code Text
          slide.addText(slideData.codeSnippet?.code || '// Implementation code here', {
            x: 1.1,
            y: 2.4,
            w: 11.1,
            h: 3.9,
            fontSize: 12.5,
            fontFace: 'Courier New',
            color: 'E2E8F0',
            align: 'left',
          });
          break;
        }

        // ==========================================
        // 6. QUOTE & STRATEGIC HIGHLIGHT SLIDE
        // ==========================================
        case 'quote': {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 1.2,
            y: 1.5,
            w: 10.9,
            h: 4.8,
            fill: { color: colors.cardBg },
            line: { color: colors.accent, width: 2 },
          });

          // Big Quote Mark
          slide.addText('“', {
            x: 1.6,
            y: 1.7,
            w: 1.0,
            h: 0.8,
            fontSize: 54,
            bold: true,
            color: colors.accent,
          });

          slide.addText(slideData.quoteText || slideData.title, {
            x: 1.8,
            y: 2.4,
            w: 9.7,
            h: 2.4,
            fontSize: 24,
            italic: true,
            color: colors.text,
            align: 'center',
          });

          slide.addText(`— ${slideData.quoteAuthor || 'Executive Strategic Directive'}`, {
            x: 1.8,
            y: 5.0,
            w: 9.7,
            h: 0.6,
            fontSize: 15,
            bold: true,
            color: colors.accentSecondary,
            align: 'right',
          });
          break;
        }

        // ==========================================
        // 7. STRUCTURED DATA TABLE SLIDE
        // ==========================================
        case 'table': {
          slide.addText('DATA MATRIX & BENCHMARKS', {
            x: 0.8,
            y: 0.6,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: colors.accent,
          });

          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.7,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          if (slideData.tableData && slideData.tableData.headers.length > 0) {
            const tableRows: pptxgen.TableRow[] = [];

            // Header Row
            tableRows.push(
              slideData.tableData.headers.map((header) => ({
                text: header,
                options: {
                  fill: { color: colors.accent },
                  color: 'FFFFFF',
                  bold: true,
                  fontSize: 12,
                  align: 'center',
                },
              }))
            );

            // Data Rows
            slideData.tableData.rows.slice(0, 6).forEach((row, rIdx) => {
              tableRows.push(
                row.map((cell) => ({
                  text: cell,
                  options: {
                    fill: { color: rIdx % 2 === 0 ? colors.cardBg : colors.background },
                    color: colors.text,
                    fontSize: 11,
                  },
                }))
              );
            });

            slide.addTable(tableRows, {
              x: 0.8,
              y: 1.8,
              w: 11.7,
              border: { type: 'solid', color: colors.border, pt: 1 },
            });
          }
          break;
        }

        // ==========================================
        // 8. BENTO GRID FEATURE CARDS (Default Content)
        // ==========================================
        case 'content':
        default: {
          slide.addText('CORE STRATEGY', {
            x: 0.8,
            y: 0.6,
            w: 11.5,
            h: 0.3,
            fontSize: 10,
            bold: true,
            color: colors.accent,
          });

          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.9,
            w: 11.5,
            h: 0.7,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          const bulletItems = slideData.bullets && slideData.bullets.length > 0
            ? slideData.bullets
            : ['Key topic summary point 1', 'Detailed contextual insight 2', 'Actionable takeaway point 3'];

          // 3-Card Bento Grid Layout
          if (bulletItems.length === 3) {
            const cardWidth = 3.7;
            bulletItems.forEach((bText, bIdx) => {
              const cardX = 0.8 + bIdx * 4.0;
              const cardY = 1.9;

              slide.addShape(pptx.ShapeType.roundRect, {
                x: cardX,
                y: cardY,
                w: cardWidth,
                h: 4.6,
                fill: { color: colors.cardBg },
                line: { color: bIdx === 0 ? colors.accent : colors.border, width: 1.5 },
              });

              slide.addShape(pptx.ShapeType.roundRect, {
                x: cardX + 0.3,
                y: cardY + 0.4,
                w: 0.5,
                h: 0.5,
                fill: { color: bIdx === 0 ? colors.accent : colors.accentSecondary },
              });

              slide.addText(`0${bIdx + 1}`, {
                x: cardX + 0.3,
                y: cardY + 0.4,
                w: 0.5,
                h: 0.5,
                fontSize: 11,
                bold: true,
                color: 'FFFFFF',
                align: 'center',
              });

              slide.addText(bText, {
                x: cardX + 0.3,
                y: cardY + 1.2,
                w: cardWidth - 0.6,
                h: 3.0,
                fontSize: 15,
                color: colors.text,
                align: 'left',
              });
            });
          } else {
            // Standard Single Bento Container
            slide.addShape(pptx.ShapeType.roundRect, {
              x: 0.8,
              y: 1.9,
              w: 11.7,
              h: 4.6,
              fill: { color: colors.cardBg },
              line: { color: colors.border, width: 1 },
            });

            const formattedBullets = bulletItems.slice(0, 5).map((b) => ({
              text: b,
              options: {
                bullet: true,
                fontSize: 16,
                color: colors.text,
                breakLine: true,
                spaceBefore: 12,
              },
            }));

            slide.addText(formattedBullets, {
              x: 1.3,
              y: 2.2,
              w: 10.7,
              h: 4.0,
            });
          }
          break;
        }
      }
    }

    const arrayBuffer = (await pptx.write({ outputType: 'arraybuffer' })) as ArrayBuffer;
    return new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });
  }
}
