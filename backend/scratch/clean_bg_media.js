const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');

async function main() {
  await db.initDb();
  const projects = await db.getProjects();
  console.log(`Total projects found: ${projects.length}`);

  const targetImage = "https://res.cloudinary.com/dimxrq8bs/image/upload/v1786704310/ai-video-storyboards/lkrby69zm5qquojkubll.png";

  for (const projectSummary of projects) {
    const project = await db.getProjectById(projectSummary.id);
    let configChanged = false;
    let config = { ...project.config };

    if (config.bgMediaList && config.bgMediaList.includes(targetImage)) {
      // Check if this image is actually selected/used in any scene of this project
      let isUsed = false;
      project.scenes.forEach(scene => {
        const selectedUrl = (scene.selectedBgMediaIndex !== -1 && scene.bgMediaList && scene.bgMediaList.length > 0)
          ? scene.bgMediaList[scene.selectedBgMediaIndex]
          : null;
        if (selectedUrl === targetImage) {
          isUsed = true;
        }
      });

      if (!isUsed) {
        console.log(`Project: "${project.title}" (ID: ${project.id}) has target image in config but it is NOT selected in any scene. Removing from config.bgMediaList...`);
        config.bgMediaList = config.bgMediaList.filter(url => url !== targetImage);
        configChanged = true;
      } else {
        console.log(`Project: "${project.title}" (ID: ${project.id}) IS actively using target image. Keeping it.`);
      }
    }

    if (configChanged) {
      await db.updateProjectConfig(project.id, config);
    }

    // Now clean up scenes
    let scenesUpdated = false;
    const updatedScenes = project.scenes.map(scene => {
      let sceneChanged = false;
      let bgList = [...(scene.bgMediaList || [])];
      let selectedIdx = scene.selectedBgMediaIndex;

      if (bgList.includes(targetImage)) {
        const selectedUrl = (selectedIdx !== -1 && bgList.length > 0) ? bgList[selectedIdx] : null;
        if (selectedUrl !== targetImage) {
          console.log(`Scene ${scene.sceneIndex} in Project "${project.title}" has target image in bgMediaList but it is NOT selected. Removing from scene.bgMediaList...`);
          
          // Get the URL of currently selected bg before filtering
          const currentlySelectedUrl = selectedIdx !== -1 ? bgList[selectedIdx] : null;
          
          bgList = bgList.filter(url => url !== targetImage);
          
          // Recalculate selectedBgMediaIndex
          if (currentlySelectedUrl) {
            selectedIdx = bgList.indexOf(currentlySelectedUrl);
          } else {
            selectedIdx = -1;
          }
          sceneChanged = true;
          scenesUpdated = true;
        }
      }

      if (sceneChanged) {
        return {
          ...scene,
          bgMediaList: bgList,
          selectedBgMediaIndex: selectedIdx
        };
      }
      return scene;
    });

    if (scenesUpdated) {
      await db.updateProjectScenes(project.id, updatedScenes);
      console.log(`Updated scenes for project: "${project.title}" (ID: ${project.id})`);
    }
  }

  console.log("Cleanup complete!");
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
