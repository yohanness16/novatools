import assert from 'node:assert/strict';
import { AudioBoosterEngine } from '../src/engines/audioBoosterEngine.ts';

console.log('Testing AudioBoosterEngine...');

// Test 1: Method existence
assert.equal(typeof AudioBoosterEngine.boostAudio, 'function');
assert.equal(typeof AudioBoosterEngine.multiplierToDb, 'function');
assert.equal(typeof AudioBoosterEngine.dbToMultiplier, 'function');
assert.equal(typeof AudioBoosterEngine.audioBufferToWav, 'function');

// Test 2: Multiplier to dB conversion
assert.equal(AudioBoosterEngine.multiplierToDb(1.0), 0);
assert.equal(AudioBoosterEngine.multiplierToDb(2.0), 6);
assert.equal(AudioBoosterEngine.dbToMultiplier(0), 1.0);
assert.equal(AudioBoosterEngine.dbToMultiplier(6), 2.0);

console.log('✔ AudioBoosterEngine unit tests passed!');
