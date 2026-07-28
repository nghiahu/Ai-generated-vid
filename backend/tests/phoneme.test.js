const test = require('node:test');
const assert = require('node:assert');
const { optimizeTextForPhonemes } = require('../services/phoneme');

test('TTS Phoneme Case Sensitivity - clashing terms', async () => {
  // Test case 1: uppercase "AI" should be replaced
  // Test case 2: lowercase "ai" should remain unchanged
  const input = "Không ai biết công nghệ AI sẽ đi về đâu.";
  const result = await optimizeTextForPhonemes(input);
  
  assert.match(result, /Không ai biết/);
  assert.match(result, /công nghệ ây-ai/);
});

test('TTS Phoneme Case Sensitivity - normal terms', async () => {
  // English words should still match case-insensitively
  const input = "Học rikkei hay Rikkei?";
  const result = await optimizeTextForPhonemes(input);
  
  // "rikkei" is not a stop word, so it should be replaced regardless of casing
  assert.doesNotMatch(result, /rikkei/i);
  assert.match(result, /rì-kây/);
});
