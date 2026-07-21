const { EdgeTTS } = require('edge-tts-universal');
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    const text1 = "mo-đồ và ây-giừn";
    const text2 = "mo đồ và ây giừn";
    
    console.log("Synthesizing text1:", text1);
    const tts1 = new EdgeTTS(text1, "vi-VN-NamMinhNeural");
    const res1 = await tts1.synthesize();
    fs.writeFileSync(path.join(__dirname, "test1.mp3"), Buffer.from(await res1.audio.arrayBuffer()));
    console.log("Saved test1.mp3");

    console.log("Synthesizing text2:", text2);
    const tts2 = new EdgeTTS(text2, "vi-VN-NamMinhNeural");
    const res2 = await tts2.synthesize();
    fs.writeFileSync(path.join(__dirname, "test2.mp3"), Buffer.from(await res2.audio.arrayBuffer()));
    console.log("Saved test2.mp3");
  } catch (err) {
    console.error("Error in EdgeTTS:", err);
  }
}

main();
