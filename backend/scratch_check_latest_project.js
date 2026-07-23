const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./services/db');
const fs = require('fs');

async function main() {
  const projectId = 'proj_ucvspgep8';
  console.log('Fetching project:', projectId);
  try {
    const project = await db.getProjectById(projectId);
    if (!project) {
      console.log('Project not found in database.');
      return;
    }
    console.log('Project title:', project.title);
    console.log('Project type:', project.type);
    console.log('Project config:', JSON.stringify(project.config, null, 2));
    console.log('Number of scenes:', project.scenes.length);
    
    project.scenes.forEach((scene, index) => {
      console.log(`\n--- Scene ${index} (ID: ${scene.id}) ---`);
      console.log('Duration:', scene.duration);
      console.log('Voiceover:', scene.voiceover);
      console.log('Voiceover TTS:', scene.voiceoverTts);
      console.log('Voiceover Audio URL:', scene.voiceoverAudioUrl);
      
      if (scene.voiceoverAudioUrl) {
        const absolutePath = path.join(__dirname, 'public', scene.voiceoverAudioUrl);
        const exists = fs.existsSync(absolutePath);
        console.log(`File path: ${absolutePath}`);
        console.log(`File exists on disk: ${exists}`);
        if (exists) {
          const stats = fs.statSync(absolutePath);
          console.log(`File size: ${stats.size} bytes`);
        }
      }
    });
  } catch (err) {
    console.error('Error running script:', err);
  }
}

main().then(() => process.exit(0));
