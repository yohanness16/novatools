import assert from 'node:assert/strict';
import {
  SUPPORTED_LANGUAGES,
  getLanguageByCode,
  searchLanguages,
  POPULAR_LANGUAGES,
  AFRICAN_LANGUAGES,
  EUROPEAN_LANGUAGES,
  ASIAN_LANGUAGES,
  MIDDLE_EASTERN_LANGUAGES,
  AMERICAS_LANGUAGES,
} from '../src/lib/languages.ts';

console.log('Testing language registry...');

// Test 1: Supported languages length and Amharic presence
assert.ok(SUPPORTED_LANGUAGES.length >= 100, `Expected >= 100 languages, got ${SUPPORTED_LANGUAGES.length}`);
const amharic = getLanguageByCode('am');
assert.ok(amharic, 'Amharic should exist in languages registry');
assert.equal(amharic?.name, 'Amharic');
assert.equal(amharic?.nativeName, 'አማርኛ');
assert.equal(amharic?.whisperSupported, true);
assert.equal(amharic?.translateSupported, true);

// Test 2: Search by English name, native script, and code
const searchByEnglish = searchLanguages('amharic');
assert.ok(searchByEnglish.some((l) => l.code === 'am'));

const searchByNative = searchLanguages('አማርኛ');
assert.ok(searchByNative.some((l) => l.code === 'am'));

const searchByCode = searchLanguages('am');
assert.ok(searchByCode.some((l) => l.code === 'am'));

// Case insensitivity and partial matching
const searchPartial = searchLanguages('span');
assert.ok(searchPartial.some((l) => l.code === 'es'));

// Empty query returns all supported languages
assert.equal(searchLanguages('').length, SUPPORTED_LANGUAGES.length);

// Test 3: Regional groups
assert.ok(POPULAR_LANGUAGES.length > 0);
assert.ok(AFRICAN_LANGUAGES.some((l) => l.code === 'am'));
assert.ok(AFRICAN_LANGUAGES.some((l) => l.code === 'ti' || l.code === 'om' || l.code === 'sw'));
assert.ok(EUROPEAN_LANGUAGES.length > 0);
assert.ok(ASIAN_LANGUAGES.length > 0);
assert.ok(MIDDLE_EASTERN_LANGUAGES.length > 0);
assert.ok(AMERICAS_LANGUAGES.length > 0);

// Test 5: Verify alphabetical order (A-Z)
for (let i = 1; i < SUPPORTED_LANGUAGES.length; i++) {
  const prev = SUPPORTED_LANGUAGES[i - 1].name;
  const curr = SUPPORTED_LANGUAGES[i].name;
  assert.ok(
    prev.localeCompare(curr) <= 0,
    `Languages should be sorted alphabetically: "${prev}" comes before "${curr}"`
  );
}

console.log('✔ Language registry tests passed!');
