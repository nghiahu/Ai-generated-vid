const fs = require("fs");
const path = require("path");

const content = fs.readFileSync(path.join(__dirname, "../services/tts.js"), "utf8");
const lines = content.split("\n");
lines.forEach((line, index) => {
  if (line.includes("voiceKey") && index >= 150 && index <= 350) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
