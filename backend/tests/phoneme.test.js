const test = require('node:test');
const assert = require('node:assert');
const { optimizeTextForPhonemes, getSpokenText } = require('../services/phoneme');

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

test('TTS Custom Phoneme Override', async () => {
  const db = require('../services/db');
  // HUST default in static dict is "hớt"
  // We override it with "đại học bách khoa hà nội"
  await db.savePhonemeToCache({
    term: 'hust',
    display_term: 'HUST',
    phoneme: 'đại học bách khoa hà nội',
    manual_override: 1,
    source: 'manual'
  });

  const input = "Tôi học ở HUST.";
  const result = await optimizeTextForPhonemes(input);
  
  // Clean up DB
  await db.deleteCustomPhoneme('hust');

  assert.match(result, /đại học bách khoa hà nội/);
});

test('TTS Phoneme - regular English words and whitelisted tech terms', async () => {
  const input = "Tôi đang học cách deploy dự án react và node.js lên vercel.";
  const result = await optimizeTextForPhonemes(input);
  
  assert.match(result, /đi-ploi/);
  assert.match(result, /ri-ác/);
  assert.match(result, /nốt-chây-ét/);
  assert.match(result, /vơ-xen/);
});

test('TTS Phoneme - strip suggestion text', () => {
  const case1 = "Câu 1: Từ khóa nào trong C báo Compiler không được tối ưu hóa biến trong ngắt? Gợi ý: V _ _ _ _ _ _ E.";
  assert.strictEqual(getSpokenText(case1), "Câu 1: Từ khóa nào trong C báo Compiler không được tối ưu hóa biến trong ngắt?");

  const case2 = "Đây là câu hỏi. (Gợi ý: XYZ)";
  assert.strictEqual(getSpokenText(case2), "Đây là câu hỏi.");

  const case3 = "Đâu là thủ đô của VN? Đáp án: Hà Nội";
  assert.strictEqual(getSpokenText(case3), "Đâu là thủ đô của VN?");
});

test('TTS Phoneme & Normalization - AI models and percentages', async () => {
  const { generateTTS } = require('../services/tts'); // imports normalizeTextForTTS inside
  const input = "Claude 3.7 Sonnet dẫn đầu với 70,3%, bám sát là OpenAI o3 với 68,5% và Gemini 3.8 Flash đạt 62,1%";
  const phonemeOptimized = await optimizeTextForPhonemes(input);
  
  // Verify transliteration of model names
  assert.match(phonemeOptimized, /cờ-lót ba chấm bảy son-nét/i);
  assert.match(phonemeOptimized, /âu-pơn-ây-ai ô-ba/i);
  assert.match(phonemeOptimized, /gie-mi-nai ba chấm tám phờ-lát/i);

  const { normalizeTextForTTS } = require('../services/tts');
  const finalCleanText = normalizeTextForTTS(phonemeOptimized);
  
  assert.match(finalCleanText, /bảy mươi fẩy ba phần trăm/);
  assert.match(finalCleanText, /sáu mươi tám fẩy năm phần trăm/);
  assert.match(finalCleanText, /sáu mươi hai fẩy một phần trăm/);
  assert.match(finalCleanText, /cờ lót ba chấm bảy son nét|cờ-lót ba chấm bảy son-nét/i);
});

