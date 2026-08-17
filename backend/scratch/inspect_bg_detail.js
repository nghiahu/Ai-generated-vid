const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');

async function main() {
  await db.initDb();
  const projects = await db.getProjects();
  if (projects.length === 0) {
    console.log("No projects found.");
    return;
  }
  
  // Sort projects to find the latest one (or just list them)
  console.log(`Total projects: ${projects.length}`);
  
  // Let's inspect all projects
  for (const projectSummary of projects) {
    const project = await db.getProjectById(projectSummary.id);
    console.log(`\n===================================`);
    console.log(`PROJECT: ${project.title} (ID: ${project.id})`);
    console.log(`Config:`, JSON.stringify(project.config, null, 2));
    console.log(`Scenes count: ${project.scenes.length}`);
    
    project.scenes.forEach((scene, index) => {
      console.log(`  Scene ${index}:`);
      console.log(`    accentColor: ${scene.accentColor}`);
      console.log(`    bgMediaList:`, JSON.stringify(scene.bgMediaList));
      console.log(`    selectedBgMediaIndex: ${scene.selectedBgMediaIndex}`);
    });
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
