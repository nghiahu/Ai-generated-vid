const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../services/db');
const ai = require('../services/ai');
const tts = require('../services/tts');
const aligner = require('../services/aligner');
const vde = require('../services/vde');

async function main() {
  await db.initDb();
  const projectId = "test_project_" + Math.random().toString(36).substr(2, 4);
  
  // Create project
  console.log("Creating project:", projectId);
  const project = await db.createProject("Test Project");
  
  const scriptText = "Chào bạn. Đây là kịch bản thử nghiệm tạo video.";
  const visualStyle = "rikkei";
  const traits = [];
  const selectedMedia = [];
  const selectedBgMedia = [];
  
  try {
    console.log("1. Generating storyboard via Gemini...");
    const rawScenes = await ai.generateStoryboard(
      project.id,
      scriptText,
      visualStyle,
      traits,
      "Short (~60s)"
    );
    
    console.log("2. Running TTS and aligner for each scene...");
    const scenes = [];
    for (let i = 0; i < rawScenes.length; i++) {
      const scene = rawScenes[i];
      const sceneId = `scene_${project.id}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      
      const voiceKey = 'omnivoice_duythanh';
      const voiceoverText = scene.voiceoverTts || scene.voiceover;
      
      console.log(`Generating TTS for scene ${i}...`);
      const ttsResult = await tts.generateTTS(voiceoverText, project.id, sceneId, voiceKey);
      console.log(`TTS generated: ${ttsResult.url}, duration: ${ttsResult.duration}`);
      
      const absoluteAudioPath = path.join(__dirname, '../public', ttsResult.url);
      console.log(`Running aligner on ${absoluteAudioPath}...`);
      const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);
      console.log(`Subtitles generated successfully!`);
    }
    console.log("ALL SUCCESS!");
  } catch (err) {
    console.error("FATAL ERROR IN PIPELINE:", err);
  }
}
main();
