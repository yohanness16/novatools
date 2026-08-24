import assert from 'node:assert/strict';
import { GifEngine } from '../src/engines/gifEngine.ts';

console.log('Testing GifEngine...');

// Test 1: Method existence
assert.equal(typeof GifEngine.renderVideoToGif, 'function');
assert.equal(typeof GifEngine.quantizeFrame, 'function');

console.log('✔ GifEngine unit tests passed!');
