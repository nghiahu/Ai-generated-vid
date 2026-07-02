const fs = require('fs');
const path = require('path');
const { EdgeTTS } = require('edge-tts-universal');
const { execSync } = require('child_process');

// Voice mapping for ElevenLabs
const VOICE_IDS = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  antonio: "ErXwobaYiN019PkySvjV",
  bella: "EXAVITQu4vr4xnSDxMaL",
  domic: "AZnzlk1XvdvUeBnXmlld"
};

function getAudioDuration(filePath) {
  try {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8' });
    const duration = parseFloat(output.trim());
    if (!isNaN(duration)) return duration;
  } catch (e) {
    try {
      const output = execSync(`ffmpeg -i "${filePath}" 2>&1`, { encoding: 'utf8' });
      const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        const hundredths = parseInt(match[4], 10);
        return hours * 3600 + minutes * 60 + seconds + hundredths / 100;
      }
    } catch (e2) {
      console.error("Lỗi khi đọc độ dài file audio:", e2.message);
    }
  }
  return 0;
}

function normalizeTextForTTS(text) {
  if (!text) return text;
  
  // Chuyển các từ viết tắt và từ tiếng Anh thông dụng thành phiên âm Việt hóa dễ nghe cho giọng vi-VN.
  let normalized = text
    .replace(/\bAI\b/ig, "A I")
    .replace(/\bai\b/ig, "a i")
    .replace(/\bAPI\b/ig, "A P I")
    .replace(/\bapi\b/ig, "a p i")
    .replace(/\bUI\b/ig, "U I")
    .replace(/\bui\b/ig, "u i")
    .replace(/\bUX\b/ig, "U X")
    .replace(/\bux\b/ig, "u x")
    .replace(/\bURL\b/ig, "U R L")
    .replace(/\burl\b/ig, "u r l")
    .replace(/\bHyperFrames\b/ig, "hai pơ phờ rem")
    .replace(/\bHyperFrame\b/ig, "hai pơ phờ rem")
    .replace(/\bRemotion\b/ig, "ri mo sần")
    .replace(/\bStitch\b/ig, "stít")
    .replace(/\bReact\b/ig, "ri ếch")
    .replace(/\bVite\b/ig, "vít")
    .replace(/\bNext\.js\b/ig, "néc jét")
    .replace(/\bGitHub\b/ig, "gít háp")
    .replace(/\bVS Code\b/ig, "vi ét cốt")
    .replace(/\bVSCode\b/ig, "vi ét cốt")
    .replace(/\bCLI\b/ig, "xê el i")
    .replace(/\bTTS\b/ig, "tê tê ét")
    .replace(/\bSaaS\b/ig, "xát")
    .replace(/\bWidget\b/ig, "uýt dít")
    .replace(/\bWidgets\b/ig, "uýt dít")
    .replace(/\bBento\b/ig, "ben tô")
    .replace(/\bLayout\b/ig, "lay ao")
    .replace(/\bLayouts\b/ig, "lay ao")
    .replace(/\bSetup\b/ig, "xét úp")
    .replace(/\bPipeline\b/ig, "pai lai")
    .replace(/\bLofi\b/ig, "lo fai")
    .replace(/\bVideo\b/ig, "vi đê ô")
    .replace(/\bVideos\b/ig, "vi đê ô")
    .replace(/\bHTML\b/ig, "hát tê em eo")
    .replace(/\bCSS\b/ig, "xi ét ét")
    .replace(/\bJavaScript\b/ig, "da va sờ ríp");
  
  return normalized.toLowerCase();
}


function ensureWavReferenceAudio(mp3Path) {
  const { execSync } = require('child_process');
  
  if (!fs.existsSync(mp3Path)) {
    throw new Error(`Không tìm thấy file giọng mẫu tại: ${mp3Path}`);
  }
  
  if (mp3Path.toLowerCase().endsWith('.wav')) {
    return mp3Path;
  }
  
  const wavPath = mp3Path.slice(0, -path.extname(mp3Path).length) + '.wav';
  
  if (!fs.existsSync(wavPath)) {
    console.log(`Converting reference audio to 16kHz mono WAV: ${mp3Path} -> ${wavPath}...`);
    try {
      execSync(`ffmpeg -y -i "${mp3Path}" -acodec pcm_s16le -ac 1 -ar 16000 "${wavPath}"`, { stdio: 'ignore' });
      console.log(`Reference audio converted successfully.`);
    } catch (err) {
      console.error(`Lỗi chuyển đổi giọng mẫu bằng ffmpeg: ${err.message}`);
      return mp3Path;
    }
  }
  
  return wavPath;
}

// Khóa Mutex để đảm bảo chỉ có tối đa 1 tiến trình OmniVoice chạy tại một thời điểm
// Tránh xung đột tài nguyên GPU/VRAM khi chạy song song hoặc tuần tự quá nhanh
let omnivoiceMutex = Promise.resolve();

async function runOmniVoiceSequentially(fn) {
  const resultPromise = omnivoiceMutex.then(async () => {
    try {
      const res = await fn();
      // Chờ 3.5 giây sau khi tiến trình kết thúc để driver CUDA của GPU giải phóng hoàn toàn VRAM
      // trước khi cho phép tiến trình tiếp theo khởi chạy
      await new Promise(resolve => setTimeout(resolve, 3500));
      return res;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 3500));
      throw err;
    }
  });
  
  omnivoiceMutex = resultPromise.catch(() => {});
  return resultPromise;
}

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

      // Xác định file giọng tham chiếu (Nữ, Nam, hoặc tùy chỉnh Anh Quý) để clone
      const isAnhQuy = voiceKey.toLowerCase() === "omnivoice_anhquy";
      const isMale = voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy;
      
      const refFileName = isMale ? "ref_vietnamese_male.wav" : "ref_vietnamese_female.wav";
      let refAudioPath = isAnhQuy 
        ? path.join(__dirname, '../../mp3/voiceanhquy.mp3')
        : path.join(refsDir, refFileName);
      const refText = isAnhQuy ? "" : "Hệ thống trí tuệ nhân tạo đang tạo giọng nói mẫu.";

      // Tạo file giọng mẫu bằng Edge TTS nếu chưa tồn tại (chỉ cho các giọng mặc định)
      if (!isAnhQuy && !fs.existsSync(refAudioPath)) {
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

      // Đảm bảo file giọng tham chiếu luôn ở dạng WAV 16kHz Mono sạch để tránh lỗi giải mã gây tiếng xì xồ
      if (fs.existsSync(refAudioPath)) {
        refAudioPath = ensureWavReferenceAudio(refAudioPath);
      }

      // Ánh xạ voiceKey sang instruct string cho OmniVoice
      let instruct = "female"; // Mặc định
      if (voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy) {
        instruct = "male";
      } else if (voiceKey.toLowerCase() === "omnivoice_whisper") {
        instruct = "female, whisper";
      } else if (voiceKey.toLowerCase() === "omnivoice_british") {
        instruct = "female, british accent";
      }

      // OmniVoice xuất WAV, nên lưu file .wav riêng
      const wavFileName = `tts_${projectId}_${sceneId}.wav`;
      const wavOutputPath = path.join(outputDir, wavFileName);

      const cleanText = normalizeTextForTTS(text);

      console.log(`Calling Local OmniVoice CLI for scene ${sceneId} (Cloning reference voice)... Normalized text: "${cleanText}"`);
      
      const relativeWavOutputPath = path.relative(process.cwd(), wavOutputPath);
      const relativeRefAudioPath = path.relative(process.cwd(), refAudioPath);

      const args = [
        "--text", cleanText,
        "--output", relativeWavOutputPath,
        "--language", "Vietnamese"
      ];

      // Nếu có file giọng tham chiếu, truyền vào để khóa giọng (Cloning mode)
      // Không được truyền --instruct khi đã dùng --ref_audio vì sẽ gây crash mô hình
      if (fs.existsSync(refAudioPath)) {
        args.push("--ref_audio", relativeRefAudioPath);
        if (refText) {
          args.push("--ref_text", refText);
        }
      } else {
        // Chỉ dùng Voice Design mode khi không có file giọng mẫu
        args.push("--instruct", instruct);
      }
      
      await runOmniVoiceSequentially(async () => {
        await execFileAsync(omnivoiceExe, args, {
          timeout: 300000,
          maxBuffer: 10 * 1024 * 1024, // 10MB để tránh tràn buffer do progress bars
          env: {
            ...process.env,
            PYTHONUTF8: "1",
            PYTHONIOENCODING: "utf-8"
          }
        });
      });

      if (!fs.existsSync(wavOutputPath)) {
        throw new Error("omnivoice-infer không tạo được file đầu ra");
      }

      console.log(`Successfully saved Local OmniVoice WAV file: ${wavFileName}`);
      const duration = getAudioDuration(wavOutputPath);
      return { url: `/tts/${wavFileName}`, duration };
    } catch (error) {
      console.error(`Local OmniVoice CLI failed for scene ${sceneId}: ${error.message}`);
      
      // Ghi log chi tiết lỗi ra file error.log để debug
      try {
        const logPath = path.join(__dirname, '../error.log');
        const logContent = `\n\n--- [${new Date().toISOString()}] ERROR TTS SCENE ${sceneId} ---\n` +
          `Message: ${error.message}\n` +
          `Stdout: ${error.stdout || 'None'}\n` +
          `Stderr: ${error.stderr || 'None'}\n` +
          `Stack: ${error.stack}\n`;
        fs.appendFileSync(logPath, logContent, 'utf8');
      } catch (logErr) {
        console.error("Không thể ghi file log lỗi:", logErr);
      }

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
      const cleanText = normalizeTextForTTS(text);
      const tts = new EdgeTTS(cleanText, msVoice);
      const result = await tts.synthesize();
      if (!result || !result.audio) {
        throw new Error("Không nhận được dữ liệu âm thanh từ Edge TTS");
      }
      const arrayBuffer = await result.audio.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Successfully saved Microsoft Edge TTS file: ${fileName}`);
      const duration = getAudioDuration(outputPath);
      return { url: `/tts/${fileName}`, duration };
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
    const duration = getAudioDuration(outputPath);
    return { url: `/tts/${fileName}`, duration };

  } catch (error) {
    console.error("Error generating ElevenLabs TTS:", error);
    throw new Error(`Lỗi ElevenLabs TTS: ${error.message}`);
  }
}

module.exports = {
  generateTTS
};
