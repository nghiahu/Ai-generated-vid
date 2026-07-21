const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");

async function main() {
  await db.initDb();
  const projectId = "proj_39m5h1hp9";
  const project = await db.getProjectById(projectId);
  if (!project) {
    console.log(`Project ${projectId} not found.`);
  } else {
    console.log("=== PROJECT DETAILS ===");
    console.log(`Project ID: ${project.id}`);
    console.log(`Title: "${project.title}"`);
    console.log(`Config voice: "${project.config?.voice}"`);
    console.log("Scenes:");
    for (const scene of project.scenes) {
      if (scene.sceneIndex !== 0) continue;
      console.log(`\n  - Scene ${scene.sceneIndex} (ID: ${scene.id})`);
      console.log(`    voiceover: "${scene.voiceover}"`);
      console.log(`    voiceoverTts: "${scene.voiceoverTts}"`);
      console.log(`    audioUrl: "${scene.voiceoverAudioUrl}"`);
      console.log(`    duration: ${scene.voiceoverDuration}`);
      console.log(`    subtitlesJson:`, JSON.stringify(scene.subtitlesJson, null, 2));
    }
  }
  process.exit(0);
}

main();


