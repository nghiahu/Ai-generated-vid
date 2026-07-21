const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const tts = require("../services/tts");

async function main() {
  console.log("Calling tts.generateTTS directly...");
  try {
    const res = await tts.generateTTS("test text", "test_proj", "test_scene", "omnivoice_duythanh");
    console.log("Success:", res);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}

main();
