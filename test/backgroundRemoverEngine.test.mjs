import assert from 'node:assert/strict';
import { BackgroundRemoverEngine } from '../src/engines/backgroundRemoverEngine.ts';

console.log('Testing BackgroundRemoverEngine...');

// Test 1: Interface validation
assert.equal(typeof BackgroundRemoverEngine.removeBackground, 'function');
assert.equal(typeof BackgroundRemoverEngine.loadImage, 'function');
assert.equal(typeof BackgroundRemoverEngine.generateMask, 'function');

console.log('✔ BackgroundRemoverEngine unit tests passed!');
