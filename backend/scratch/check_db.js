const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");

async function checkDb() {
  await db.initDb();
  const modelEntry = await db.getPhonemeFromCache("model");
  const agentEntry = await db.getPhonemeFromCache("agent");
  console.log("=== DB Cache Check ===");
  console.log("model entry:", modelEntry);
  console.log("agent entry:", agentEntry);
  process.exit(0);
}

checkDb();
