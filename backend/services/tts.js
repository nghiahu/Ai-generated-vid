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

function addSilentPadding(filePath) {
  const tempPath = filePath + '.temp' + path.extname(filePath);
  try {
    if (!fs.existsSync(filePath)) return;
    
    // Rename original file to temp
    fs.renameSync(filePath, tempPath);
    
    // Run ffmpeg adelay filter to insert 300ms silence at the beginning
    execSync(`ffmpeg -y -i "${tempPath}" -filter_complex "adelay=300|300" "${filePath}"`, { stdio: 'ignore' });
    
    // Delete temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.log(`Successfully added 300ms silent padding to ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Failed to add silent padding to ${filePath}:`, error.message);
    // Rollback if failed
    if (fs.existsSync(tempPath)) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
      try { fs.renameSync(tempPath, filePath); } catch (e) {}
    }
  }
}

function normalizeTextForTTS(text) {
  if (!text) return text;
  
  const matchedProtections = [];
  let protectionIndex = 0;
  
  // Bảo vệ các từ "ai" trong tiếng Việt mang ý nghĩa "ai đó/không ai" để không bị chuyển thành "ây-ai"
  const protectionRegexes = [
    /\bkhông\s+ai\b/gi,
    /\bchẳng\s+ai\b/gi,
    /\bchưa\s+ai\b/gi,
    /\bcó\s+ai\b/gi,
    /\bcho\s+ai\b/gi,
    /\bvới\s+ai\b/gi,
    /\bnhư\s+ai\b/gi,
    /\bai\s+cũng\b/gi,
    /\bai\s+đó\b/gi,
    /\bai\s+đấy\b/gi,
    /\bai\s+nấy\b/gi
  ];

  let tempText = text;
  protectionRegexes.forEach(regex => {
    tempText = tempText.replace(regex, (match) => {
      const placeholder = `___PROT_WHO_${protectionIndex}___`;
      matchedProtections.push({ placeholder, original: match });
      protectionIndex++;
      return placeholder;
    });
  });

  // Chuyển đổi các từ viết tắt công nghệ không phân biệt chữ hoa/thường (Dùng gạch nối để đọc tách âm tốt hơn)
  tempText = tempText
    .replace(/\bai\b/gi, "ây-ai")
    .replace(/\bapi\b/gi, "ây-pi-ai")
    .replace(/\bui\b/gi, "iu-ai")
    .replace(/\bux\b/gi, "iu-ích")
    .replace(/\burl\b/gi, "u-rờ-lờ")
    .replace(/\bit\b/gi, "ây-ti")
    .replace(/\bcrud\b/gi, "cờ-rút");

  // Khôi phục lại các từ "ai" tiếng Việt đã được bảo vệ
  matchedProtections.forEach(p => {
    tempText = tempText.replace(p.placeholder, p.original);
  });

  // Tránh việc ghép các từ viết tắt dạng viết hoa dính liền làm crash tokenizer của OmniVoice.
  // Đồng thời giữ nguyên cách phát âm tiếng Anh tự nhiên thay vì phiên âm tiếng Việt kỳ quặc.
  let normalized = tempText;

  // Safety net: reverse-map common phonetic Vietnamese back to lowercase English.
  // Prevents OmniVoice tokenizer crash when Gemini slips and phonetically translates tech terms.
  normalized = normalized
    .replace(/hát tê em lờ/gi, "html")
    .replace(/xê ét ét/gi, "css")
    .replace(/gia va sờ cờ ríp/gi, "javascript")
    .replace(/gia va xờ cờ ríp/gi, "javascript")
    .replace(/ri ắc/gi, "react")
    .replace(/nốt đề ếch es/gi, "node.js")
    .replace(/nốt đề ếch ét/gi, "node.js")
    .replace(/nếch t chấm gi ét/gi, "next.js")
    .replace(/em pê bốn/gi, "mp4")
    .replace(/em pê 4/gi, "mp4")
    .replace(/em pê ba/gi, "mp3")
    .replace(/em pê 3/gi, "mp3")
    .replace(/tai pi xờ cờ ríp/gi, "typescript")
    .replace(/ét qu i/gi, "sql")
    .replace(/đốc cờ ro/gi, "docker")
    .replace(/gít hớp/gi, "github");

  // Chuyển toàn bộ sang viết thường. Thực nghiệm chứng minh: Viết thường 100% giúp OmniVoice 
  // tokenizer không bao giờ bị treo/crash, đồng thời AI vẫn đọc tiếng Anh cực kỳ chuẩn và tự nhiên.
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
      // Tính toán thời lượng để áp dụng fade-out chuẩn xác ở cuối file nhằm khử click/pop/giật cục
      const duration = getAudioDuration(mp3Path);
      const fadeDuration = 0.25; // 250ms fade-in và fade-out rất mượt
      const fadeOutStart = Math.max(0, duration - fadeDuration);
      
      const filterStr = `afade=t=in:ss=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration}`;
      
      execSync(`ffmpeg -y -i "${mp3Path}" -af "${filterStr}" -acodec pcm_s16le -ac 1 -ar 16000 "${wavPath}"`, { stdio: 'ignore' });
      console.log(`Reference audio converted successfully with fade filters.`);
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
  const version = Math.random().toString(36).substr(2, 4);
  const outputDir = path.join(__dirname, '../public/tts');
  
  // Ensure directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean up any existing audio files for this scene to prevent disk bloat
  try {
    const files = fs.readdirSync(outputDir);
    const prefix = `tts_${projectId}_${sceneId}`;
    files.forEach(file => {
      if (file.startsWith(prefix)) {
        try { fs.unlinkSync(path.join(outputDir, file)); } catch (e) {}
      }
    });
  } catch (e) {}

  const fileName = `tts_${projectId}_${sceneId}_${version}.mp3`;
  const outputPath = path.join(outputDir, fileName);

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

      // Xác định file giọng tham chiếu (Nữ, Nam, hoặc tùy chỉnh Anh Quý / Đô Trịnh / BeatVN) để clone
      const isAnhQuy = voiceKey.toLowerCase() === "omnivoice_anhquy";
      const isDoTrinh = voiceKey.toLowerCase() === "omnivoice_dotrinh";
      const isBeatvn = voiceKey.toLowerCase() === "omnivoice_beatvn";
      const isBeatvn2 = voiceKey.toLowerCase() === "omnivoice_beatvn2";
      const isMale = voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy || isDoTrinh;
      
      const refFileName = isMale ? "ref_vietnamese_male.wav" : "ref_vietnamese_female.wav";
      let refAudioPath = isAnhQuy 
        ? path.join(__dirname, '../../mp3/anhquy/voice_anh_quy.mp3')
        : isDoTrinh
        ? path.join(__dirname, '../../mp3/elevenlab/do_trinh/voice_preview_đô trịnh - giọng hay.mp3')
        : isBeatvn
        ? path.join(__dirname, '../../mp3/beatvn/voice_beatvn.mp3')
        : isBeatvn2
        ? path.join(__dirname, '../../mp3/beatvn_voice2/beatV2.mp3')
        : path.join(refsDir, refFileName);
      const refText = isAnhQuy 
        ? "Rồi chào các bạn nhá nốt tiếp nội dung của bài liên quan đến ứng dụng quản lý quản lý sinh viên bây giờ là chúng ta sẽ cùng nhau đi giải quyết nốt chức năng phân trang cho danh sách sinh viên này"
        : isDoTrinh
        ? "Giọng trầm ấm, rõ chữ, mang phong cách chuyên nghiệp, hiện đại, phù hợp cho các nội dung công nghệ, AI, kinh doanh, giáo dục và phát triển bản thân"
        : isBeatvn
        ? "giáo viên trường trung học phổ thông chuyên Tuyên Quang vừa bị tạm giữ từng đạt giải học sinh giỏi quốc gia môn Toán tuyển thẳng vào đại học và Tốt nghiệp loại giỏi sinh năm 1998 được giảng dạy ở một trường chuyên của tỉnh Tuyên Quang có nghĩa là người thầy giáo này phải thật sự giỏi"
        : isBeatvn2
        ? "Ông em khổ nhất tiktok là đây chỉ muốn làm họa sĩ đem những nét vẽ làm đẹp cho đời nhưng lên video nào mọi người cũng khuyên em đi đóng phim thật lòng thì em vẽ cũng đẹp thật nhưng thế méo nào nhìn đi nhìn lại cũng thấy giống như hai giọt nước"
        : "Hệ thống trí tuệ nhân tạo đang tạo giọng nói mẫu.";

      // Tạo file giọng mẫu bằng Edge TTS nếu chưa tồn tại (chỉ cho các giọng mặc định)
      if (!isAnhQuy && !isDoTrinh && !isBeatvn && !isBeatvn2 && !fs.existsSync(refAudioPath)) {
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
      if (voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy || isDoTrinh) {
        instruct = "male";
      } else if (voiceKey.toLowerCase() === "omnivoice_whisper") {
        instruct = "female, whisper";
      } else if (voiceKey.toLowerCase() === "omnivoice_british") {
        instruct = "female, british accent";
      }

      // OmniVoice xuất WAV, nên lưu file .wav riêng
      const wavFileName = `tts_${projectId}_${sceneId}_${version}.wav`;
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
      addSilentPadding(wavOutputPath);
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
      addSilentPadding(outputPath);
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
    addSilentPadding(outputPath);
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
