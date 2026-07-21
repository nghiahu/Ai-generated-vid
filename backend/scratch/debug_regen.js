const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("../services/db");
const phoneme = require("../services/phoneme");
const tts = require("../services/tts");
const aligner = require("../services/aligner");

async function main() {
  await db.initDb();
  const projectId = "proj_cn0ghd4kw";
  const project = await db.getProjectById(projectId);
  if (!project) {
    console.error("Project not found!");
    process.exit(1);
  }

  const voiceKey = project.config?.voice === 'custom' && project.config.customVoiceId 
    ? project.config.customVoiceId 
    : (project.config?.voice || 'rachel');

  console.log("Resolved voiceKey:", voiceKey);

  const updatedScenes = [];
  for (const scene of project.scenes) {
    if (scene.voiceover) {
      console.log(`\n--- Scene ${scene.sceneIndex} ---`);
      console.log(`Original voiceover: "${scene.voiceover}"`);
      const voiceoverText = scene.voiceoverTts || scene.voiceover;
      console.log(`TTS text: "${voiceoverText}"`);
      
      console.log("Calling tts.generateTTS...");
      try {
        const ttsResult = await tts.generateTTS(voiceoverText, projectId, scene.id, voiceKey);
        console.log("TTS Result:", ttsResult);
        
        const absoluteAudioPath = path.join(__dirname, '../public', ttsResult.url);
        console.log("Running aligner...");
        const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);
        console.log("Aligned subtitles count:", subtitlesJson.length);

        updatedScenes.push({
          ...scene,
          duration: ttsResult.duration,
          voiceoverAudioUrl: ttsResult.url,
          voiceoverDuration: ttsResult.duration,
          subtitlesJson
        });
      } catch (err) {
        console.error("Error in scene TTS generation:", err);
      }
    }
  }
  process.exit(0);
}

main();
