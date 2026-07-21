const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");

async function main() {
  await db.initDb();
  const projects = await db.getProjects();
  console.log("=== PROJECT DETAILS ===");
  for (const p of projects) {
    const fullProj = await db.getProjectById(p.id);
    console.log(`\nProject ID: ${p.id}`);
    console.log(`Title: "${p.title}"`);
    console.log(`Config voice: "${fullProj.config?.voice}"`);
    console.log("Scenes:");
    for (const scene of fullProj.scenes) {
      console.log(`  - Scene ${scene.sceneIndex}: duration=${scene.duration}, audioUrl="${scene.voiceoverAudioUrl}", ttsText="${scene.voiceoverTts}"`);
    }
  }
  process.exit(0);
}

main();
