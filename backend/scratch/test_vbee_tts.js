require('dotenv').config();
const tts = require('../services/tts');

async function testVbee() {
  console.log("Testing Vbee TTS integration...");
  try {
    const result = await tts.generateTTS(
      "Xin chào, đây là giọng đọc thử nghiệm Vbee Minh Tiến trong hệ thống HyperFrame.",
      "test_proj",
      "scene_vbee_1",
      "vbee_minhtien"
    );
    console.log("Vbee TTS Test Result:", result);
  } catch (err) {
    console.error("Vbee TTS Test Failed:", err);
  }
}

testVbee();
