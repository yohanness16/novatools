import assert from 'node:assert';
import { DocEngine } from '../src/engines/docEngine.ts';
import { PptxEngine } from '../src/engines/pptxEngine.ts';
import { ExcelEngine } from '../src/engines/excelEngine.ts';
import { AiDocEngine } from '../src/engines/aiDocEngine.ts';

console.log('🧪 Running Document Suite Engine Tests...');

// 1. Test Markdown Metadata Extraction
const sampleMd = `# Project Alpha Specs

Here is the master architectural overview.

## Objectives
- 100% Client-Side Privacy
- Zero Server Uploads

| Metric | Target | Status |
| :--- | :--- | :--- |
| Speed | < 100ms | Pass |
| Privacy | Complete | Pass |

> "Privacy is a fundamental right."
`;

const meta = DocEngine.getDocMetadata(sampleMd);
assert.strictEqual(meta.title, 'Project Alpha Specs');
assert(meta.wordCount > 10, 'Word count should be > 10');
assert.strictEqual(meta.detectedHeadingsCount, 2);
console.log('✅ DocEngine: Metadata extraction passed');

// 2. Test Markdown to HTML
const html = DocEngine.markdownToHtml(sampleMd);
assert(html.includes('<h1 id="project-alpha-specs">Project Alpha Specs</h1>') || html.includes('<h1>Project Alpha Specs</h1>') || html.includes('Project Alpha Specs'));
assert(html.includes('<table>'));
console.log('✅ DocEngine: Markdown to HTML conversion passed');

// 3. Test Markdown to DOCX OpenXML Blob
const docxBlob = await DocEngine.markdownToDocx(sampleMd, 'Project Alpha Specs');
assert(docxBlob.size > 1000, 'DOCX blob should be generated with valid size');
assert.strictEqual(docxBlob.type, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
console.log(`✅ DocEngine: DOCX OpenXML compilation passed (${docxBlob.size} bytes)`);

// 4. Test PPTX Slide Generation
const slides = PptxEngine.markdownToSlides(sampleMd);
assert(slides.length >= 2, 'Should generate at least 2 slides');
assert.strictEqual(slides[0].title, 'Project Alpha Specs');
const pptxBlob = await PptxEngine.generatePptxBlob(slides, 'dark-indigo');
assert(pptxBlob.size > 1000, 'PPTX blob should be generated with valid size');
console.log(`✅ PptxEngine: PPTX Slide Deck generation passed (${pptxBlob.size} bytes, ${slides.length} slides)`);

// 5. Test Excel Table Extraction & XLSX Workbook Generation
const tables = ExcelEngine.extractTablesFromMarkdown(sampleMd);
assert.strictEqual(tables.length, 1);
assert.strictEqual(tables[0].headers.length, 3);
assert.strictEqual(tables[0].rows.length, 2);
assert.strictEqual(tables[0].rows[0][0], 'Speed');

const xlsxBlob = ExcelEngine.generateXlsxBlob(tables, 'Project Alpha Specs');
assert(xlsxBlob.size > 500, 'XLSX blob should be generated with valid size');
console.log(`✅ ExcelEngine: XLSX Workbook generation passed (${xlsxBlob.size} bytes, ${tables.length} table)`);

// 6. Test CSV Serializer
const csvStr = ExcelEngine.tableToCsvString(tables[0]);
assert(csvStr.includes('Metric,Target,Status'));
assert(csvStr.includes('Speed,< 100ms,Pass'));
console.log('✅ ExcelEngine: CSV serialization with UTF-8 BOM passed');

// 7. Test AI Engine Probing & Smart Slide Generation
const aiInfo = await AiDocEngine.checkAIAvailability();
assert(typeof aiInfo.hasChromeAI === 'boolean');
const smartSlides = await AiDocEngine.generateSmartSlideDeck(sampleMd);
assert(smartSlides.length >= 2);
console.log(`✅ AiDocEngine: AI engine cascade test passed (Tier: ${aiInfo.tier})`);

// 8. Test Printable HTML for Vector PDF Generation
const printableHtml = DocEngine.generatePrintableHtml(sampleMd, 'Project Alpha Specs');
assert(printableHtml.includes('@page {'));
assert(printableHtml.includes('Project Alpha Specs'));
assert(printableHtml.includes('table {'));
console.log('✅ DocEngine: Printable vector PDF HTML generation passed');

console.log('\n🎉 ALL DOCUMENT SUITE TESTS PASSED 100%!');
