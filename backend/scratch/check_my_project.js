const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");

async function main() {
  await db.initDb();
  const projects = await db.getProjects();
  const projectId = projects[projects.length - 1].id;
  const project = await db.getProjectById(projectId);
  console.log("Keys of scenes[0]:", Object.keys(project.scenes[0]));
  console.log("id of scenes[0]:", project.scenes[0].id);
  console.log("sceneIndex of scenes[0]:", project.scenes[0].sceneIndex);
  process.exit(0);
}

main();
