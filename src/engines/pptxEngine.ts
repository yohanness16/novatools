/**
 * Presentation & Slide Deck Engine for NovaTools
 * Generates Native PowerPoint Presentations (.pptx) from Markdown & Universal AST
 * 100% Client-Side Web Runtime with Theme Customization
 */

import pptxgen from 'pptxgenjs';
import type { DocSlide, SlideTheme, DocTable } from './docTypes';

interface ThemeColorPalette {
  background: string;
  cardBg: string;
  accent: string;
  text: string;
  subtext: string;
  border: string;
}

export class PptxEngine {
  private static THEMES: Record<SlideTheme, ThemeColorPalette> = {
    'dark-indigo': {
      background: '09090B',
      cardBg: '18181B',
      accent: '6366F1',
      text: 'F8FAFC',
      subtext: '94A3B8',
      border: '27272A',
    },
    'corporate-blue': {
      background: 'FFFFFF',
      cardBg: 'F1F5F9',
      accent: '2563EB',
      text: '0F172A',
      subtext: '475569',
      border: 'CBD5E1',
    },
    'minimal-emerald': {
      background: '022C22',
      cardBg: '064E3B',
      accent: '10B981',
      text: 'F0FDF4',
      subtext: 'A7F3D0',
      border: '065F46',
    },
    'sunset-modern': {
      background: '18181B',
      cardBg: '27272A',
      accent: 'F97316',
      text: 'FAFAFA',
      subtext: 'A1A1AA',
      border: '3F3F46',
    },
  };

  /**
   * Decomposes Markdown document into structured presentation slides
   */
  static markdownToSlides(markdown: string): DocSlide[] {
    const lines = markdown.split('\n');
    const slides: DocSlide[] = [];
    let currentSlide: DocSlide | null = null;
    let slideCounter = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) continue;

      // H1 creates Title slide or major transition slide
      if (trimmed.startsWith('# ')) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = {
          id: `slide-${slideCounter++}`,
          title: trimmed.replace(/^#\s+/, ''),
          layout: slides.length === 0 ? 'title' : 'content',
          bullets: [],
        };
        continue;
      }

      // H2 creates a new Content / Topic slide
      if (trimmed.startsWith('## ')) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = {
          id: `slide-${slideCounter++}`,
          title: trimmed.replace(/^##\s+/, ''),
          layout: 'content',
          bullets: [],
        };
        continue;
      }

      // If no slide initialized yet, create a default first slide
      if (!currentSlide) {
        currentSlide = {
          id: `slide-${slideCounter++}`,
          title: 'Overview',
          layout: 'content',
          bullets: [],
        };
      }

      // H3 / Subtitles
      if (trimmed.startsWith('### ')) {
        if (!currentSlide.subtitle) {
          currentSlide.subtitle = trimmed.replace(/^###\s+/, '');
        } else {
          currentSlide.bullets = currentSlide.bullets || [];
          currentSlide.bullets.push(`📌 ${trimmed.replace(/^###\s+/, '')}`);
        }
        continue;
      }

      // Blockquotes -> Quote Slide
      if (trimmed.startsWith('> ')) {
        const quoteContent = trimmed.replace(/^>\s+/, '');
        currentSlide.layout = 'quote';
        currentSlide.quoteText = quoteContent;
        continue;
      }

      // Code blocks -> Code Slide
      if (trimmed.startsWith('```')) {
        const lang = trimmed.replace(/^```/, '') || 'code';
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        currentSlide.layout = 'code';
        currentSlide.codeSnippet = {
          language: lang,
          code: codeLines.join('\n'),
        };
        continue;
      }

      // Tables
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const tableLines: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        i--; // Adjust loop pointer

        if (tableLines.length >= 2) {
          const headerCells = tableLines[0].split('|').slice(1, -1).map((c) => c.trim());
          const bodyRows: string[][] = [];
          for (let r = 2; r < tableLines.length; r++) {
            const cells = tableLines[r].split('|').slice(1, -1).map((c) => c.trim());
            if (cells.length > 0) bodyRows.push(cells);
          }
          currentSlide.layout = 'table';
          currentSlide.tableData = {
            headers: headerCells,
            rows: bodyRows,
          };
        }
        continue;
      }

      // Bullets
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s+/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-*]\s+|\d+\.\s+/, '');
        currentSlide.bullets = currentSlide.bullets || [];
        currentSlide.bullets.push(bulletText);
        continue;
      }

      // Key metrics detection (e.g., "$50M Revenue" or "99.9% Uptime")
      const metricMatch = trimmed.match(/^([$€£¥]?[0-9,.]+[KM%B+]?)\s*[-:]\s*(.+)$/i);
      if (metricMatch && !currentSlide.statNumber) {
        currentSlide.layout = 'stats';
        currentSlide.statNumber = metricMatch[1];
        currentSlide.statLabel = metricMatch[2];
        continue;
      }

      // Regular paragraph text
      currentSlide.bullets = currentSlide.bullets || [];
      currentSlide.bullets.push(trimmed);
    }

    if (currentSlide) {
      slides.push(currentSlide);
    }

    // If only 1 slide generated, ensure title slide is properly styled
    if (slides.length === 1 && slides[0].layout === 'content') {
      slides[0].layout = 'title';
    }

    return slides;
  }

  /**
   * Generates a native PowerPoint presentation (.pptx) Blob
   */
  static async generatePptxBlob(slides: DocSlide[], theme: SlideTheme = 'dark-indigo'): Promise<Blob> {
    const pptx = new pptxgen();
    const colors = this.THEMES[theme] || this.THEMES['dark-indigo'];

    // 16:9 Widescreen Layout
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'NovaTools AI Presentation Suite';
    pptx.company = 'NovaTools';

    for (let index = 0; index < slides.length; index++) {
      const slideData = slides[index];
      const slide = pptx.addSlide();

      // Background color
      slide.background = { color: colors.background };

      // Add Footer / Page Number
      slide.addText(`NovaTools  •  Slide ${index + 1} of ${slides.length}`, {
        x: 0.8,
        y: 6.9,
        w: 11.5,
        h: 0.4,
        fontSize: 10,
        color: colors.subtext,
        align: 'right',
      });

      // Speaker Notes
      if (slideData.speakerNotes) {
        slide.addNotes(slideData.speakerNotes);
      }

      switch (slideData.layout) {
        case 'title': {
          // Accent Decorative Top Bar
          slide.addShape(pptx.ShapeType.rect, {
            x: 1.5,
            y: 2.2,
            w: 1.2,
            h: 0.08,
            fill: { color: colors.accent },
            line: { color: colors.accent },
          });

          // Title
          slide.addText(slideData.title, {
            x: 1.5,
            y: 2.5,
            w: 10.0,
            h: 1.6,
            fontSize: 40,
            bold: true,
            color: colors.text,
            align: 'left',
          });

          // Subtitle
          const subtitleText = slideData.subtitle || (slideData.bullets && slideData.bullets.length > 0 ? slideData.bullets.join('  •  ') : 'Generated with NovaTools 100% Client-Side Document Suite');
          slide.addText(subtitleText, {
            x: 1.5,
            y: 4.3,
            w: 10.0,
            h: 1.0,
            fontSize: 18,
            color: colors.subtext,
            align: 'left',
          });
          break;
        }

        case 'stats': {
          // Slide Title
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.8,
            w: 11.5,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: colors.text,
          });

          // Stat Card
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 2.5,
            y: 2.0,
            w: 8.0,
            h: 4.2,
            fill: { color: colors.cardBg },
            line: { color: colors.border, width: 1 },
          });

          // Big Stat Number
          slide.addText(slideData.statNumber || '100%', {
            x: 2.5,
            y: 2.5,
            w: 8.0,
            h: 1.8,
            fontSize: 64,
            bold: true,
            color: colors.accent,
            align: 'center',
          });

          // Stat Label
          slide.addText(slideData.statLabel || slideData.subtitle || 'Key Performance Metric', {
            x: 2.8,
            y: 4.4,
            w: 7.4,
            h: 1.2,
            fontSize: 20,
            color: colors.text,
            align: 'center',
          });
          break;
        }

        case 'quote': {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 1.2,
            y: 1.5,
            w: 10.8,
            h: 4.8,
            fill: { color: colors.cardBg },
            line: { color: colors.accent, width: 2 },
          });

          slide.addText(`“${slideData.quoteText || slideData.title}”`, {
            x: 1.8,
            y: 2.2,
            w: 9.6,
            h: 2.6,
            fontSize: 26,
            italic: true,
            color: colors.text,
            align: 'center',
          });

          if (slideData.quoteAuthor || slideData.title) {
            slide.addText(`— ${slideData.quoteAuthor || slideData.title}`, {
              x: 1.8,
              y: 5.0,
              w: 9.6,
              h: 0.6,
              fontSize: 16,
              bold: true,
              color: colors.accent,
              align: 'right',
            });
          }
          break;
        }

        case 'code': {
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.8,
            w: 11.5,
            h: 0.8,
            fontSize: 26,
            bold: true,
            color: colors.text,
          });

          // Code Container Shape
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 1.8,
            w: 11.5,
            h: 4.8,
            fill: { color: '0F172A' },
            line: { color: '334155', width: 1 },
          });

          // Language Badge
          slide.addText((slideData.codeSnippet?.language || 'code').toUpperCase(), {
            x: 1.2,
            y: 2.0,
            w: 2.0,
            h: 0.4,
            fontSize: 11,
            bold: true,
            color: colors.accent,
          });

          // Code Content
          slide.addText(slideData.codeSnippet?.code || '', {
            x: 1.2,
            y: 2.5,
            w: 10.7,
            h: 3.8,
            fontSize: 13,
            fontFace: 'Courier New',
            color: 'E2E8F0',
            align: 'left',
          });
          break;
        }

        case 'table': {
          slide.addText(slideData.title, {
            x: 0.8,
            y: 0.8,
            w: 11.5,
            h: 0.8,
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
            slideData.tableData.rows.slice(0, 7).forEach((row, rIdx) => {
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
              w: 11.5,
              border: { type: 'solid', color: colors.border, pt: 1 },
            });
          }
          break;
        }

        case 'content':
        default: {
          // Header Accent bar
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.8,
            y: 0.8,
            w: 0.08,
            h: 0.8,
            fill: { color: colors.accent },
            line: { color: colors.accent },
          });

          // Title
          slide.addText(slideData.title, {
            x: 1.1,
            y: 0.8,
            w: 11.0,
            h: 0.8,
            fontSize: 28,
            bold: true,
            color: colors.text,
          });

          // Subtitle if available
          if (slideData.subtitle) {
            slide.addText(slideData.subtitle, {
              x: 1.1,
              y: 1.6,
              w: 11.0,
              h: 0.5,
              fontSize: 14,
              color: colors.subtext,
            });
          }

          // Bullets card container
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.8,
            y: 2.2,
            w: 11.5,
            h: 4.4,
            fill: { color: colors.cardBg },
            line: { color: colors.border, width: 1 },
          });

          const bulletItems = slideData.bullets && slideData.bullets.length > 0 ? slideData.bullets : ['Key topic summary point 1', 'Detailed contextual insight 2', 'Actionable takeaway point 3'];

          const formattedBullets = bulletItems.slice(0, 6).map((b) => ({
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
            y: 2.5,
            w: 10.5,
            h: 3.8,
          });
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
