const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");

async function main() {
  await db.initDb();
  const fullProj = await db.getProjectById("proj_cn0ghd4kw");
  console.log("=== proj_cn0ghd4kw SCENES AFTER REGEN ===");
  for (const scene of fullProj.scenes) {
    console.log(`- Scene ${scene.sceneIndex}: audioUrl="${scene.voiceoverAudioUrl}", duration=${scene.duration}`);
  }
  process.exit(0);
}

main();
