import assert from 'node:assert/strict';
import { PdfNumbererEngine } from '../src/engines/pdfNumbererEngine.ts';

console.log('Testing PdfNumbererEngine...');

// Test 1: Method existence
assert.equal(typeof PdfNumbererEngine.stampPageNumbers, 'function');

console.log('✔ PdfNumbererEngine unit tests passed!');
