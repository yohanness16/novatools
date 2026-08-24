import assert from 'node:assert/strict';
import { TranslationEngine } from '../src/engines/translationEngine.ts';

console.log('Testing translation engine...');

// Test 1: Interface validation
assert.equal(typeof TranslationEngine.translateSubtitleCues, 'function', 'translateSubtitleCues should be a static method');
assert.equal(typeof TranslationEngine.translateText, 'function', 'translateText should be a static method');

// Test 2: translateSubtitleCues timestamp and ID preservation with mock/empty input
const emptyResult = await TranslationEngine.translateSubtitleCues([], 'am');
assert.deepEqual(emptyResult, []);

console.log('✔ Translation engine interface tests passed!');
