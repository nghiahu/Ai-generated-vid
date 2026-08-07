const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");

async function main() {
  await db.initDb();
  const projects = await db.getProjects();
  console.log("=== INSPECTING LAYOUTS FOR ALL PROJECTS ===");
  for (const p of projects) {
    const fullProj = await db.getProjectById(p.id);
    console.log(`\nProject: "${p.title}" (ID: ${p.id})`);
    if (fullProj.scenes && fullProj.scenes.length > 0) {
      fullProj.scenes.forEach((scene) => {
        console.log(`  - Scene ${scene.sceneIndex}: layoutFamily="${scene.layoutFamily}", visualLayout="${scene.visualLayout}"`);
      });
    } else {
      console.log("  No scenes");
    }
  }
  process.exit(0);
}

main();
