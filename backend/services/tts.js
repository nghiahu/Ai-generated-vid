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

  // Nhánh xử lý OmniVoice (Chạy offline cục bộ qua OpenAI-compatible API)
  if (voiceKey.toLowerCase().startsWith("omnivoice_")) {
    try {
      const omniVoiceUrl = process.env.OMNIVOICE_API_URL || "http://localhost:8000/v1/audio/speech";
      
      // Ánh xạ voiceKey của hệ thống sang thuộc tính mô tả giọng đọc (instruct) cho OmniVoice
      let mappedVoice = "female"; // Mặc định
      if (voiceKey.toLowerCase() === "omnivoice_male") {
        mappedVoice = "male";
      } else if (voiceKey.toLowerCase() === "omnivoice_whisper") {
        mappedVoice = "female, whisper";
      } else if (voiceKey.toLowerCase() === "omnivoice_british") {
        mappedVoice = "female, british accent";
      }

      console.log(`Calling Local OmniVoice TTS for scene ${sceneId} using voice: ${mappedVoice}...`);
      
      const response = await fetch(omniVoiceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: "omnivoice",
          voice: mappedVoice,
          response_format: "mp3"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OmniVoice API trả về lỗi ${response.status}: ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(outputPath, buffer);
      
      console.log(`Successfully saved Local OmniVoice TTS file: ${fileName}`);
      return `/tts/${fileName}`;
    } catch (error) {
      console.error("Local OmniVoice TTS failed:", error);
      throw new Error(`Lỗi Local OmniVoice TTS: ${error.message}`);
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
