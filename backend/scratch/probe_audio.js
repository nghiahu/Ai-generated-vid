const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

function getAudioDuration(filePath) {
  try {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' });
    return parseFloat(output.trim());
  } catch (e) {
    return 0;
  }
}

const audioFile = path.join(__dirname, "../public/tts/tts_proj_39m5h1hp9_scene_proj_39m5h1hp9_0_xm4j_r5mo.wav");
if (fs.existsSync(audioFile)) {
  console.log("File exists:", audioFile);
  console.log("Duration:", getAudioDuration(audioFile));
} else {
  console.log("File not found:", audioFile);
}
