const fs = require('fs');
const path = require('path');
const { EdgeTTS } = require('edge-tts-universal');

// Voice mapping for ElevenLabs
const VOICE_IDS = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  antonio: "ErXwobaYiN019PkySvjV",
  bella: "EXAVITQu4vr4xnSDxMaL",
  domic: "AZnzlk1XvdvUeBnXmlld"
};

async function generateTTS(text, projectId, sceneId, voiceKey = "rachel") {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const fileName = `tts_${projectId}_${sceneId}.mp3`;
  const outputDir = path.join(__dirname, '../public/tts');
  const outputPath = path.join(outputDir, fileName);

  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Nhánh xử lý OmniVoice (Chạy offline cục bộ qua omnivoice-infer CLI)
  if (voiceKey.toLowerCase().startsWith("omnivoice_")) {
    try {
      const { execFile } = require("child_process");
      const { promisify } = require("util");
      const execFileAsync = promisify(execFile);

      // Đường dẫn đến omnivoice-infer.exe trong thư mục Scripts của Python
      const omnivoiceExe = process.env.OMNIVOICE_INFER_PATH || 
        "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\omnivoice-infer.exe";

      // Đảm bảo thư mục tài nguyên giọng tham chiếu tồn tại
      const refsDir = path.join(__dirname, '../resources/ref_voices');
      if (!fs.existsSync(refsDir)) {
        fs.mkdirSync(refsDir, { recursive: true });
      }

      // Xác định file giọng tham chiếu (Nữ hoặc Nam) để clone
      const isMale = voiceKey.toLowerCase() === "omnivoice_male";
      const refFileName = isMale ? "ref_vietnamese_male.wav" : "ref_vietnamese_female.wav";
      const refAudioPath = path.join(refsDir, refFileName);
      const refText = "Hệ thống trí tuệ nhân tạo đang tạo giọng nói mẫu.";

      // Tạo file giọng mẫu bằng Edge TTS nếu chưa tồn tại
      if (!fs.existsSync(refAudioPath)) {
        console.log(`Creating OmniVoice reference voice file: ${refFileName}...`);
        const msVoice = isMale ? "vi-VN-NamMinhNeural" : "vi-VN-HoaiMyNeural";
        const ttsInstance = new EdgeTTS(refText, msVoice);
        const result = await ttsInstance.synthesize();
        if (result && result.audio) {
          const ab = await result.audio.arrayBuffer();
          fs.writeFileSync(refAudioPath, Buffer.from(ab));
          console.log(`OmniVoice reference voice created successfully.`);
        }
      }

      // Ánh xạ voiceKey sang instruct string cho OmniVoice
      let instruct = "female"; // Mặc định
      if (voiceKey.toLowerCase() === "omnivoice_male") {
        instruct = "male";
      } else if (voiceKey.toLowerCase() === "omnivoice_whisper") {
        instruct = "female, whisper";
      } else if (voiceKey.toLowerCase() === "omnivoice_british") {
        instruct = "female, british accent";
      }

      // OmniVoice xuất WAV, nên lưu file .wav riêng
      const wavFileName = `tts_${projectId}_${sceneId}.wav`;
      const wavOutputPath = path.join(outputDir, wavFileName);

      console.log(`Calling Local OmniVoice CLI for scene ${sceneId} (Cloning reference voice)...`);
      
      const args = [
        "--text", text,
        "--output", wavOutputPath,
        "--instruct", instruct,
        "--language", "Vietnamese"
      ];

      // Nếu có file giọng tham chiếu, truyền vào để khóa giọng
      if (fs.existsSync(refAudioPath)) {
        args.push("--ref_audio", refAudioPath);
        args.push("--ref_text", refText);
      }
      
      await execFileAsync(omnivoiceExe, args, { timeout: 120000 }); // 2 phút timeout

      if (!fs.existsSync(wavOutputPath)) {
        throw new Error("omnivoice-infer không tạo được file đầu ra");
      }

      console.log(`Successfully saved Local OmniVoice WAV file: ${wavFileName}`);
      return `/tts/${wavFileName}`;
    } catch (error) {
      console.error(`Local OmniVoice CLI failed for scene ${sceneId}: ${error.message}`);
      throw new Error(`Lỗi OmniVoice TTS: ${error.message}`);
    }
  }

  // Nhánh xử lý Microsoft Edge TTS (Miễn phí, giọng đọc tiếng Việt siêu tự nhiên)
  if (voiceKey.toLowerCase().startsWith("microsoft_")) {
    try {
      const msVoice = voiceKey.toLowerCase() === "microsoft_namminh" 
        ? "vi-VN-NamMinhNeural" 
        : "vi-VN-HoaiMyNeural";
      console.log(`Calling Microsoft Edge TTS for scene ${sceneId} using voice ${msVoice}...`);
      const tts = new EdgeTTS(text, msVoice);
      const result = await tts.synthesize();
      if (!result || !result.audio) {
        throw new Error("Không nhận được dữ liệu âm thanh từ Edge TTS");
      }
      const arrayBuffer = await result.audio.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Successfully saved Microsoft Edge TTS file: ${fileName}`);
      return `/tts/${fileName}`;
    } catch (error) {
      console.error("Microsoft Edge TTS failed:", error);
      throw new Error(`Lỗi Microsoft Edge TTS: ${error.message}`);
    }
  }

  // Sử dụng voice ID đã được ánh xạ, hoặc dùng trực tiếp voiceKey nếu đó là Custom Voice ID
  const voiceId = VOICE_IDS[voiceKey.toLowerCase()] || voiceKey;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY chưa được cấu hình trong tệp .env. Vui lòng kiểm tra lại cấu hình Backend.");
  }

  try {
    console.log(`Calling ElevenLabs TTS for scene ${sceneId} with voice ${voiceKey}...`);
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API returned status ${response.status}: ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Successfully saved TTS file: ${fileName}`);
    return `/tts/${fileName}`;

  } catch (error) {
    console.error("Error generating ElevenLabs TTS:", error);
    throw new Error(`Lỗi ElevenLabs TTS: ${error.message}`);
  }
}

module.exports = {
  generateTTS
};
