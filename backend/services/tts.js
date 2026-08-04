const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

    // Trim all start/end silence, then pad exactly 150ms at start and 150ms at end, boost volume by 1.6x, and apply highpass filter at 80Hz to increase clarity
    const filter = "silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,adelay=150|150,apad=pad_dur=0.15,volume=1.6,highpass=f=80";
    
    execSync(`ffmpeg -y -i "${tempPath}" -af "${filter}" "${filePath}"`, { stdio: 'ignore' });

    // Delete temp file
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    console.log(`Successfully trimmed and padded 150ms start/end silence to ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`Failed to add silent padding to ${filePath}:`, error.message);
    // Rollback if failed
    if (fs.existsSync(tempPath)) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { }
      }
      try { fs.renameSync(tempPath, filePath); } catch (e) { }
    }
  }
}

function normalizeTextForTTS(text) {
  if (!text) return "";
  
  // Thay thế dấu ngoặc kép bằng khoảng trắng để tránh lỗi command line
  let temp = text.replace(/["'“”‘’]/g, ' ');
  
  // Chuyển đổi dấu gạch ngang dài (em-dash, en-dash) thành dấu phẩy để tạo điểm nghỉ tự nhiên
  temp = temp.replace(/[—–]/g, ', ');

  // Chuyển đổi dấu gạch ngang ngắn (-) thành khoảng trắng để đọc mượt mà, tránh lỗi vấp và lỗi kết nối TTS
  temp = temp.replace(/-/g, ' ');
  
  // Thay thế các ký tự toán học bằng chữ viết tương đương để không bị mất chữ khi đọc
  temp = temp.replace(/>/g, ' lớn hơn ');
  temp = temp.replace(/</g, ' nhỏ hơn ');
  temp = temp.replace(/=/g, ' bằng ');
  
  // Thay thế các chuỗi nhiều dấu chấm liên tục (ellipsis) bằng một dấu chấm duy nhất
  temp = temp.replace(/\.{2,}/g, '. ');
  
  // Chuyển thành chữ thường nhưng giữ nguyên chữ hoa cho âm vị CMU trong [ ]
  let normalized = temp.toLowerCase();
  normalized = normalized.replace(/\[([^\]]+)\]/g, (match, p1) => {
    return `[${p1.toUpperCase()}]`;
  });
  
  // Thu gọn nhiều khoảng trắng liên tiếp và trim
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  return normalized;
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

  omnivoiceMutex = resultPromise.catch(() => { });
  return resultPromise;
}

async function generateTTS(text, projectId, sceneId, voiceKey = "omnivoice_duythanh") {
  console.log("[generateTTS DEBUG] Arguments length:", arguments.length);
  console.log("[generateTTS DEBUG] arg 0 (text) =", text ? text.substring(0, 30) : text);
  console.log("[generateTTS DEBUG] arg 1 (projectId) =", projectId);
  console.log("[generateTTS DEBUG] arg 2 (sceneId) =", sceneId);
  console.log("[generateTTS DEBUG] arg 3 (voiceKey) =", voiceKey);
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
        try { fs.unlinkSync(path.join(outputDir, file)); } catch (e) { }
      }
    });
  } catch (e) { }

  const fileName = `tts_${projectId}_${sceneId}_${version}.mp3`;
  const outputPath = path.join(outputDir, fileName);

  let effectiveVoice = voiceKey;
  if (!effectiveVoice || (!effectiveVoice.toLowerCase().startsWith("omnivoice_") && !effectiveVoice.toLowerCase().startsWith("vbee_"))) {
    console.warn(`[generateTTS] Legacy or unsupported voice "${voiceKey}" detected. Auto-fallback to "omnivoice_duythanh".`);
    effectiveVoice = "omnivoice_duythanh";
  }

  // Nhánh xử lý Vbee (Cloud TTS)
  if (effectiveVoice.toLowerCase().startsWith("vbee_")) {
    try {
      const vbeeApiKey = process.env.VBEE_API_KEY;
      const vbeeAppId = process.env.VBEE_APP_ID;

      if (!vbeeApiKey || !vbeeAppId) {
        throw new Error("Thiếu VBEE_API_KEY hoặc VBEE_APP_ID trong cấu hình .env");
      }

      // Ánh xạ voiceKey sang voice_code của Vbee
      const voiceMap = {
        "vbee_ngochuyen": "hn_female_ngochuyen_full_48k-fhg",
        "vbee_manhdung": "hn_male_manhdung_news_48k-fhg",
        "vbee_thutrang": "hn_female_thutrang_news_48k-fhg",
        "vbee_minhhoang": "sg_female_minhhoang_news_48k-fhg",
        "vbee_naman": "sg_male_naman_news_48k-fhg",
        "vbee_minhquan": "hn_male_minhquan_yt_24k-pre"
      };

      const voiceCode = voiceMap[effectiveVoice.toLowerCase()] || "hn_female_ngochuyen_full_48k-fhg";
      
      console.log(`[TTS Engine] Calling Vbee API for text: "${text.substring(0, 30)}..." with voice: ${voiceCode}`);

      // Gửi yêu cầu khởi tạo job đến Vbee
      const ttsUrl = "https://vbee.vn/api/v1/tts";
      const initRes = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${vbeeApiKey}`,
          "x-app-id": vbeeAppId
        },
        body: JSON.stringify({
          app_id: vbeeAppId,
          input_text: text,
          voice_code: voiceCode,
          callback_url: "https://example.com/callback"
        })
      });

      if (!initRes.ok) {
        const errText = await initRes.text();
        throw new Error(`Vbee API request failed: status ${initRes.status} - ${errText}`);
      }

      const initBody = await initRes.json();
      if (initBody.status !== 1 || !initBody.result || !initBody.result.request_id) {
        throw new Error(`Khởi tạo Vbee job thất bại: ${JSON.stringify(initBody)}`);
      }

      const requestId = initBody.result.request_id;
      console.log(`[TTS Engine] Created Vbee job with request_id: ${requestId}. Starting polling...`);

      // Polling Vbee status
      const statusUrl = `https://vbee.vn/api/v1/tts/${requestId}`;
      let audioLink = "";
      let pollAttempts = 0;
      const maxPollAttempts = 60; // Tăng lên 60 lần × 2s = 120s timeout

      while (pollAttempts < maxPollAttempts) {
        pollAttempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s mỗi lần thay vì 1.5s
        
        try {
          const checkRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${vbeeApiKey}`,
              "x-app-id": vbeeAppId
            }
          });

          if (!checkRes.ok) {
            console.warn(`[TTS Engine] Poll attempt ${pollAttempts}/${maxPollAttempts}: HTTP ${checkRes.status}, retrying...`);
            continue;
          }

          const checkBody = await checkRes.json();
          const currentStatus = checkBody?.result?.status;
          console.log(`[TTS Engine] Poll attempt ${pollAttempts}/${maxPollAttempts}: status=${currentStatus}`);

          if (checkBody.status === 1 && checkBody.result) {
            if (currentStatus === "SUCCESS") {
              audioLink = checkBody.result.audio_link;
              break;
            } else if (currentStatus === "FAILED") {
              throw new Error("Tiến trình render giọng Vbee bị lỗi (FAILED).");
            }
            // currentStatus === "PROCESSING" hoặc "PENDING" → tiếp tục poll
          }
        } catch (pollErr) {
          if (pollErr.message.includes("FAILED")) throw pollErr; // Re-throw lỗi thật
          console.warn(`[TTS Engine] Lỗi polling Vbee attempt ${pollAttempts}: ${pollErr.message}`);
        }
      }

      if (!audioLink) {
        throw new Error(`Timeout/Lỗi khi polling giọng Vbee cho request_id: ${requestId}`);
      }

      console.log(`[TTS Engine] Vbee render success. Downloading audio from: ${audioLink}`);

      // Tải file audio về thư mục public/tts
      const audioRes = await fetch(audioLink);
      if (!audioRes.ok) {
        throw new Error(`Không thể tải file âm thanh từ Vbee: status ${audioRes.status}`);
      }

      const audioBuffer = await audioRes.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
      console.log(`[TTS Engine] Saved downloaded audio to: ${outputPath}`);

      // Áp dụng khoảng lặng/hậu kỳ
      addSilentPadding(outputPath);
      const duration = getAudioDuration(outputPath);

      return { url: `/tts/${fileName}`, duration };
    } catch (error) {
      // error_code 1051 = quota exceeded; any Vbee error falls back to OmniVoice
      const isQuotaError = error.message && error.message.includes('1051');
      if (isQuotaError) {
        console.warn(`[TTS Engine] Vbee quota exceeded for scene ${sceneId}. Falling back to OmniVoice...`);
      } else {
        console.warn(`[TTS Engine] Vbee TTS failed for scene ${sceneId}: ${error.message}. Falling back to OmniVoice...`);
      }
      // Fall through to OmniVoice below — do NOT re-throw here
      effectiveVoice = 'omnivoice_duythanh';
    }
  }

  // Nhánh xử lý OmniVoice (Chạy offline cục bộ qua omnivoice-infer CLI)
  if (effectiveVoice.toLowerCase().startsWith("omnivoice_")) {
    try {
      const { execFile } = require("child_process");
      const { promisify } = require("util");
      const execFileAsync = promisify(execFile);

      // Đường dẫn đến omnivoice-infer.exe trong thư mục Scripts của Python
      const omnivoiceExe = process.env.OMNIVOICE_INFER_PATH ||
        "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\omnivoice-infer.exe";

      // Xác định file giọng tham chiếu để clone
      let refAudioPath = path.join(__dirname, '../../mp3/duy_thanh_nguyen/voice_duy_thanh.mp3');
      let refText = "Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt. Bỗng dưng từ đâu xuất hiện rất nhiều chuyên gia, am hiểu tường tận mọi lĩnh vực, cái gì cũng phân tích được. Rồi nhiều khóa học xuất hiện hơn, nhiều video xuất hiện hơn, dạy về cách sử dụng, cách tối ưu hóa AI, mà mình thấy tần xuất nó ngày càng dày đặc hơn.";

      if (effectiveVoice.toLowerCase() === "omnivoice_quanganh" || effectiveVoice.toLowerCase() === "omnivoice_quang_anh") {
        refAudioPath = path.join(__dirname, '../../mp3/quang_anh/voice_quang_anh.mp3');
        refText = "Năm nay thế giới chi khoảng hai nghìn năm trăm chín mươi tỷ đô cho AI con số này lớn hơn GDP của phần lớn quốc gia trên thế giới nhưng phần thú vị nằm ở chỗ số tiền đó đang kẹt vài con số cho thấy AI không còn là chuyện tương lai chat GPT giờ có chín trăm triệu người dùng mỗi tuần";
      }

      // Đảm bảo file giọng tham chiếu luôn ở dạng WAV 16kHz Mono sạch để tránh lỗi giải mã gây tiếng xì xồ
      if (fs.existsSync(refAudioPath)) {
        refAudioPath = ensureWavReferenceAudio(refAudioPath);
      }

      // Ánh xạ voiceKey sang instruct string cho OmniVoice
      let instruct = "male";

      // OmniVoice xuất WAV, nên lưu file .wav riêng
      const wavFileName = `tts_${projectId}_${sceneId}_${version}.wav`;
      const wavOutputPath = path.join(outputDir, wavFileName);

      const cleanText = normalizeTextForTTS(text);

      console.log(`Calling Local OmniVoice CLI for scene ${sceneId} (Cloning reference voice)... Normalized text: "${cleanText}"`);

      const backendDir = path.resolve(__dirname, '..');
      const relativeWavOutputPath = path.relative(backendDir, wavOutputPath).replace(/\\/g, '/');
      const relativeRefAudioPath = path.relative(backendDir, refAudioPath).replace(/\\/g, '/');

      const speed = parseFloat(process.env.OMNIVOICE_SPEED) || 0.95;
      const args = [
        "--text", cleanText,
        "--output", relativeWavOutputPath,
        "--language", "Vietnamese",
        "--speed", speed.toString()
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

      let success = false;
      let attempts = 0;
      const maxAttempts = 2;
      let lastExecResult = null;

      while (!success && attempts < maxAttempts) {
        try {
          attempts++;
          lastExecResult = await runOmniVoiceSequentially(async () => {
            return await execFileAsync(omnivoiceExe, args, {
              cwd: backendDir,
              timeout: 300000,
              maxBuffer: 10 * 1024 * 1024, // 10MB để tránh tràn buffer do progress bars
              env: {
                ...process.env,
                PYTHONUTF8: "1",
                PYTHONIOENCODING: "utf-8"
              }
            });
          });
          success = true;
        } catch (execErr) {
          console.warn(`[TTS Engine] Lỗi tiến trình OmniVoice (Lần thử ${attempts}/${maxAttempts}): ${execErr.message}`);
          if (attempts >= maxAttempts) {
            throw execErr;
          }
          console.log("[TTS Engine] Đang chờ 2.5 giây trước khi tự động chạy lại...");
          await new Promise(resolve => setTimeout(resolve, 2500));
        }
      }

      if (!fs.existsSync(wavOutputPath)) {
        const errorDetails = new Error("omnivoice-infer không tạo được file đầu ra");
        if (lastExecResult) {
          errorDetails.stdout = lastExecResult.stdout;
          errorDetails.stderr = lastExecResult.stderr;
        }
        throw errorDetails;
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
  throw new Error(`Giọng đọc không được hỗ trợ: "${voiceKey}". Chỉ sử dụng OmniVoice Duy Thanh.`);
}

module.exports = {
  generateTTS
};
