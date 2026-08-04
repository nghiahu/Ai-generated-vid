const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const tts = require("../services/tts");

async function main() {
  console.log("Calling generateTTS with vbee_ngochuyen...");
  try {
    const res = await tts.generateTTS("Chào bạn, đây là kiểm tra tích hợp Vbee.", "test_proj", "test_scene", "vbee_ngochuyen");
    console.log("Success:", res);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}

main();
