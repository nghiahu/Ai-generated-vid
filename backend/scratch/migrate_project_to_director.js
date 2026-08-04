const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');

async function main() {
  await db.initDb();
  const projects = await db.getProjects();
  if (projects.length === 0) {
    console.log('No projects found in database.');
    return;
  }

  // Find the latest AIGEN project
  const targetProject = projects.find(p => p.type === 'AIGEN');
  if (!targetProject) {
    console.log('No AIGEN project found to migrate.');
    return;
  }

  console.log(`Migrating project ${targetProject.id} ("${targetProject.title}") to DIRECTOR...`);
  
  const fullProject = await db.getProjectById(targetProject.id);
  
  const newScenes = fullProject.scenes.map((s, idx) => {
    // Map supporting points
    let supporting = [];
    if (s.points) {
      supporting = s.points.map(p => typeof p === 'string' ? p : p.text || '');
    }

    const durationSec = parseFloat(s.duration) || 6.0;

    return {
      sceneIndex: idx,
      intent: {
        sceneIndex: idx,
        duration: durationSec,
        purpose: idx === 0 ? 'hook' : idx === fullProject.scenes.length - 1 ? 'cta' : 'explain',
        emotion: 'powerful',
        narrativeMoment: idx === 0 ? 'opening' : idx === fullProject.scenes.length - 1 ? 'closing' : 'rising',
        informationDensity: 'medium',
        viewerAction: idx === 0 ? 'feel_emotion' : 'absorb_list',
        tempo: 'medium',
        emphasis: 'supporting'
      },
      content: {
        heading: s.heading || 'Phân cảnh',
        primary: s.heading ? s.heading.substring(0, 15) : 'Điểm chính',
        supporting: supporting.filter(Boolean),
        voiceover: s.voiceover || ''
      },
      audioUrl: s.audioUrl || s.voiceoverAudioUrl || '',
      audioDuration: durationSec,
      subtitlesJson: s.subtitlesJson || []
    };
  });

  const manifest = {
    version: 'director-v1',
    projectId: targetProject.id,
    plannerVersion: 'director-migrator-v1',
    generatedAt: new Date().toISOString(),
    metadata: {
      width: 1080,
      height: 1920,
      fps: 30,
      theme: 'AI_HUB_DARK'
    },
    scenes: newScenes
  };

  // Save as DIRECTOR project using db helper
  await db.saveDirectorProject(targetProject.id, targetProject.title, manifest);
  console.log(`Successfully migrated project ${targetProject.id} to DIRECTOR! ✅`);
}

main().catch(e => { console.error('[FAIL]', e); process.exit(1); });
