const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const tts = require("../services/tts");
const db = require("../services/db");

async function main() {
  try {
    await db.initDb();
    console.log("Generating TTS using EdgeTTS with normalized hyphens...");
    
    // This calls generateTTS which internally calls normalizeTextForTTS
    const result = await tts.generateTTS("mo-đồ và ây-giừn", "test_proj", "test_scene", "microsoft_hoaimy");
    console.log("Result:", result);
    process.exit(0);
  } catch (err) {
    console.error("Error generating TTS:", err);
    process.exit(1);
  }
}

main();
