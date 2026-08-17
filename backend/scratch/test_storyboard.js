const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');
const ai = require('../services/ai');

async function main() {
  console.log("Initializing DB...");
  await db.initDb();
  
  console.log("Calling generateStoryboard directly...");
  try {
    const res = await ai.generateStoryboard(
      "test_project",
      "Chào bạn. Đây là kịch bản thử nghiệm tạo video.",
      "rikkei",
      [],
      "Short (~60s)"
    );
    console.log("Success! Generated scenes count:", res.length);
  } catch (err) {
    console.error("Caught error:", err);
  }
}
main();
