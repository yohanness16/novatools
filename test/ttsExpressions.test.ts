import { normalizeHumanScript, HUMAN_EXPRESSIONS, PAUSE_PRESETS } from '../src/engines/ttsExpressions';

function runTests() {
  console.log('Running TTS Expressions & Normalizer Tests...');

  // Test 1: Human Interjections
  const test1 = "I tried so hard [sigh], but ugh it broke! [pause: 500ms] Ay what now?";
  const result1 = normalizeHumanScript(test1, true);
  console.log('[Test 1] Input:', test1);
  console.log('[Test 1] Output:', result1);

  if (!result1.includes('...haah...')) {
    throw new Error('Test 1 Failed: [sigh] not converted to breath cadence');
  }
  if (!result1.includes('uughh...')) {
    throw new Error('Test 1 Failed: ugh not converted');
  }
  if (!result1.includes('aay!')) {
    throw new Error('Test 1 Failed: Ay not converted');
  }

  // Test 2: Sound effects & pauses
  const test2 = "Let me think [hmm], [cough] excuse me. [pause: 1000ms] Done!";
  const result2 = normalizeHumanScript(test2, true);
  console.log('[Test 2] Output:', result2);

  if (!result2.includes('*ahem*...')) {
    throw new Error('Test 2 Failed: [cough] not converted');
  }

  // Test 3: Standalone natural conversation
  const test3 = "Whoa, that is awesome! Phew, we made it.";
  const result3 = normalizeHumanScript(test3, true);
  console.log('[Test 3] Output:', result3);

  if (!result3.includes('whoaa!') || !result3.includes('ffyoo...')) {
    throw new Error('Test 3 Failed: Standalone interjections not normalized');
  }

  console.log('✅ ALL TTS Expression & Normalization Tests PASSED successfully!');
}

runTests();
