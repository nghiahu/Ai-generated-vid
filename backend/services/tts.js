const fs = require('fs');
const path = require('path');
const { execSync, execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);

/**
 * Normalize text before sending to TTS API
 */
function normalizeTextForTTS(text) {
  if (!text) return "";

  // Chuẩn hóa số có dấu chấm ngăn cách phần nghìn tiếng Việt (vd: 2.048.000 -> 2048000, 1.500 -> 1500)
  // để tránh TTS đọc nhầm thành dấu chấm câu hoặc số thập phân lẻ
  let temp = text.replace(/\b(\d+)(?:\.(\d{3}))+\b/g, m => m.replace(/\./g, ''));

  temp = temp.replace(/["""'']/g, ' ');
  temp = temp.replace(/[—–]/g, ', ');
  temp = temp.replace(/-/g, ' ');
  temp = temp.replace(/>/g, ' lớn hơn ');
  temp = temp.replace(/</g, ' nhỏ hơn ');
  temp = temp.replace(/=/g, ' bằng ');
  temp = temp.replace(/\.{2,}/g, '. ');
  
  let normalized = temp.toLowerCase();
  normalized = normalized.replace(/\[([^\]]+)\]/g, (match, p1) => {
    return `[${p1.toUpperCase()}]`;
  });
  
  return normalized.replace(/\s+/g, ' ').trim();
}

/**
 * Get Audio Duration using ffprobe (if available) or file size fallback
 */
function getAudioDuration(filePath) {
  try {
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const duration = parseFloat(output.trim());
    if (!isNaN(duration)) return duration;
  } catch (e) {
    try {
      const output = execSync(`ffmpeg -i "${filePath}" 2>&1`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
      if (match) {
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        const hundredths = parseInt(match[4], 10);
        return hours * 3600 + minutes * 60 + seconds + hundredths / 100;
      }
    } catch (e2) {
      // Fallback: estimate from file size (mp3 ~16KB/s at 128kbps, wav ~176KB/s at 1411kbps mono/stereo)
      const ext = path.extname(filePath).toLowerCase();
      const fileSizeBytes = fs.statSync(filePath).size;
      if (ext === '.wav') {
        return fileSizeBytes / 32000; // rough estimation for 16kHz mono 16-bit WAV
      }
      return fileSizeBytes / 16000; // rough estimation for 128kbps MP3
    }
  }
  return 0;
}

/**
 * Add silent padding and boost audio volume using ffmpeg
 */
function addSilentPadding(filePath) {
  const tempPath = filePath + '.temp' + path.extname(filePath);
  try {
    if (!fs.existsSync(filePath)) return;
    fs.renameSync(filePath, tempPath);
    const filter = "silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,adelay=150|150,apad=pad_dur=0.15,volume=1.6,highpass=f=80";
    execSync(`ffmpeg -y -i "${tempPath}" -af "${filter}" "${filePath}"`, { stdio: 'ignore' });
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  } catch (error) {
    console.warn(`[TTS] Failed to apply ffmpeg audio filters:`, error.message);
    if (fs.existsSync(tempPath)) {
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { }
      }
      try { fs.renameSync(tempPath, filePath); } catch (e) { }
    }
  }
}

/**
 * Ensure WAV reference audio for OmniVoice cloning
 */
function ensureWavReferenceAudio(mp3Path) {
  if (!fs.existsSync(mp3Path)) {
    throw new Error(`Không tìm thấy file giọng mẫu tại: ${mp3Path}`);
  }
  if (mp3Path.toLowerCase().endsWith('.wav')) {
    return mp3Path;
  }
  const wavPath = mp3Path.slice(0, -path.extname(mp3Path).length) + '.wav';
  if (!fs.existsSync(wavPath)) {
    console.log(`[TTS] Converting reference audio to WAV: ${mp3Path} -> ${wavPath}`);
    try {
      const duration = getAudioDuration(mp3Path);
      const fadeDuration = 0.25;
      const fadeOutStart = Math.max(0, duration - fadeDuration);
      const filterStr = `afade=t=in:ss=0:d=${fadeDuration},afade=t=out:st=${fadeOutStart}:d=${fadeDuration}`;
      execSync(`ffmpeg -y -i "${mp3Path}" -af "${filterStr}" -acodec pcm_s16le -ac 1 -ar 16000 "${wavPath}"`, { stdio: 'ignore' });
    } catch (err) {
      console.error(`[TTS] ffmpeg conversion failed: ${err.message}`);
      return mp3Path;
    }
  }
  return wavPath;
}

// Mutex lock for sequential OmniVoice runs (prevents CUDA out of memory errors)
let omnivoiceMutex = Promise.resolve();
async function runOmniVoiceSequentially(fn) {
  const resultPromise = omnivoiceMutex.then(async () => {
    try {
      const res = await fn();
      await new Promise(resolve => setTimeout(resolve, 3500)); // Release VRAM delay
      return res;
    } catch (err) {
      await new Promise(resolve => setTimeout(resolve, 3500));
      throw err;
    }
  });
  omnivoiceMutex = resultPromise.catch(() => { });
  return resultPromise;
}

// Run process and append stdout/stderr to local tts_debug.log in real-time to ease debugging
function runProcessWithLogging(spawnExe, spawnArgs, options) {
  return new Promise((resolve, reject) => {
    const debugLogPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'tts_debug.log');
    
    try {
      fs.appendFileSync(debugLogPath, `\n--- [${new Date().toISOString()}] TTS Run ---\nCommand: "${spawnExe}" ${spawnArgs.join(' ')}\n`);
    } catch (err) {
      console.warn("Failed to write to tts_debug.log header:", err.message);
    }

    const child = execFile(spawnExe, spawnArgs, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        try {
          fs.appendFileSync(debugLogPath, data.toString());
        } catch (e) {}
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        try {
          fs.appendFileSync(debugLogPath, data.toString());
        } catch (e) {}
      });
    }
  });
}

/**
 * Generate TTS audio using VBEE (online) or OmniVoice (offline).
 */
async function generateTTS(text, projectId, sceneId, voiceKey = "vbee_ngochuyen") {
  const version = Math.random().toString(36).substr(2, 4);
  const outputDir = path.join(__dirname, '../public/tts');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clean up old files
  try {
    const files = fs.readdirSync(outputDir);
    const prefix = `tts_${projectId}_${sceneId}`;
    files.forEach(file => {
      if (file.startsWith(prefix)) {
        try { fs.unlinkSync(path.join(outputDir, file)); } catch (e) { }
      }
    });
  } catch (e) { }

  let effectiveVoice = voiceKey || "vbee_ngochuyen";
  
  // ─── Off-line/Online Cloud OmniVoice Path ───
  if (effectiveVoice.toLowerCase().startsWith("omnivoice_")) {
    const cloudApiUrl = process.env.OMNIVOICE_CLOUD_API_URL;
    const cloudApiKey = process.env.OMNIVOICE_CLOUD_API_KEY;
    const cleanText = normalizeTextForTTS(text);
    const wavFileName = `tts_${projectId}_${sceneId}_${version}.wav`;
    const wavOutputPath = path.join(outputDir, wavFileName);
    const speed = parseFloat(process.env.OMNIVOICE_SPEED) || 0.95;

    // --- CASE A: Cloud Serverless Path ---
    if (cloudApiUrl && cloudApiKey) {
      console.log(`[TTS] Routing OmniVoice request to RunPod Cloud API for scene ${sceneId}...`);
      let voiceId = "duythanh";
      if (effectiveVoice.toLowerCase() === "omnivoice_quanganh" || effectiveVoice.toLowerCase() === "omnivoice_quang_anh") {
        voiceId = "quanganh";
      }

      try {
        const response = await fetch(cloudApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cloudApiKey}`
          },
          body: JSON.stringify({
            input: {
              text: cleanText,
              voice: voiceId,
              speed: speed
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`RunPod API request failed: status ${response.status} - ${errText}`);
        }

        const body = await response.json();
        if (body.status === "FAILED") {
          throw new Error(`RunPod generation job failed: ${body.error || JSON.stringify(body)}`);
        }

        const audioBase64 = body.output?.audio_base64;
        if (!audioBase64) {
          throw new Error(`RunPod did not return audio_base64. Response: ${JSON.stringify(body)}`);
        }

        // Decode and write to output path
        fs.writeFileSync(wavOutputPath, Buffer.from(audioBase64, 'base64'));
        
        // Postprocessing
        addSilentPadding(wavOutputPath);
        const duration = getAudioDuration(wavOutputPath);
        return { url: `/tts/${wavFileName}`, duration };

      } catch (err) {
        console.error(`[TTS] Cloud OmniVoice failed: ${err.message}. Falling back to local execution checks...`);
        // Fall through to local implementation if cloud fails
      }
    }

    // --- CASE B: Local Fallback Path ---
    let omnivoiceExe = process.env.OMNIVOICE_INFER_PATH;
    
    // Auto-detect and prefer the bundled offline runtime if it exists
    const defaultBundledPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'Python311', 'Scripts', 'omnivoice-infer.exe');
    const alternativeBundledPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'Scripts', 'omnivoice-infer.exe');
    
    if (fs.existsSync(defaultBundledPath)) {
      omnivoiceExe = defaultBundledPath;
    } else if (fs.existsSync(alternativeBundledPath)) {
      omnivoiceExe = alternativeBundledPath;
    }

    if (!omnivoiceExe || !fs.existsSync(omnivoiceExe)) {
      throw new Error(`Chưa cài đặt OmniVoice hoặc cấu hình sai đường dẫn OMNIVOICE_INFER_PATH trong Settings. File không tìm thấy: "${omnivoiceExe || 'trống'}"`);
    }

    let refAudioPath = path.join(__dirname, '../../mp3/duy_thanh_nguyen/voice_duy_thanh.mp3');
    let refText = "Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt. Bỗng dưng từ đâu xuất hiện rất nhiều chuyên gia, am hiểu tường tận mọi lĩnh vực, cái gì cũng phân tích được. Rồi nhiều khóa học xuất hiện hơn, nhiều video xuất hiện hơn, dạy về cách sử dụng, cách tối ưu hóa AI, mà mình thấy tần xuất nó ngày càng dày đặc hơn.";

    if (effectiveVoice.toLowerCase() === "omnivoice_quanganh" || effectiveVoice.toLowerCase() === "omnivoice_quang_anh") {
      refAudioPath = path.join(__dirname, '../../mp3/quang_anh/voice_quang_anh.mp3');
      refText = "Năm nay thế giới chi khoảng hai nghìn năm trăm chín mươi tỷ đô cho AI con số này lớn hơn GDP của phần lớn quốc gia trên thế giới nhưng phần thú vị nằm ở chỗ số tiền đó đang kẹt vài con số cho thấy AI không còn là chuyện tương lai chat GPT giờ có chín trăm triệu người dùng mỗi tuần";
    }

    if (fs.existsSync(refAudioPath)) {
      refAudioPath = ensureWavReferenceAudio(refAudioPath);
    }

    console.log(`[TTS] Local OmniVoice offline for scene ${sceneId} with voice ${effectiveVoice}...`);

    const backendDir = path.resolve(__dirname, '..');
    const relativeWavOutputPath = path.relative(backendDir, wavOutputPath).replace(/\\/g, '/');
    const relativeRefAudioPath = path.relative(backendDir, refAudioPath).replace(/\\/g, '/');

    const args = [
      "--text", cleanText,
      "--output", relativeWavOutputPath,
      "--language", "Vietnamese",
      "--speed", speed.toString()
    ];

    if (fs.existsSync(refAudioPath)) {
      args.push("--ref_audio", relativeRefAudioPath);
      if (refText) {
        args.push("--ref_text", refText);
      }
    } else {
      args.push("--instruct", "male");
    }

    let success = false;
    let attempts = 0;
    const maxAttempts = 2;

    let spawnExe = omnivoiceExe;
    let spawnArgs = args;

    // Detect if we can run via python -m omnivoice.cli.infer to bypass broken wrapper exe
    if (omnivoiceExe) {
      const parentDir = path.dirname(omnivoiceExe);
      const grandParentDir = path.dirname(parentDir);
      const pythonCandidates = [
        path.join(grandParentDir, 'python.exe'),
        path.join(parentDir, 'python.exe')
      ];
      
      for (const candidate of pythonCandidates) {
        if (fs.existsSync(candidate)) {
          spawnExe = candidate;
          spawnArgs = ["-m", "omnivoice.cli.infer", ...args];
          console.log(`[TTS] Bypassing wrapper. Using python: "${candidate}"`);
          break;
        }
      }
    }

    while (!success && attempts < maxAttempts) {
      try {
        attempts++;
        await runOmniVoiceSequentially(async () => {
          return await runProcessWithLogging(spawnExe, spawnArgs, {
            cwd: backendDir,
            timeout: 300000,
            maxBuffer: 10 * 1024 * 1024,
            env: {
              ...process.env,
              PYTHONUTF8: "1",
              PYTHONIOENCODING: "utf-8",
              HF_ENDPOINT: "https://hf-mirror.com",
              HF_HOME: process.env.HF_HOME || path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'hf_cache'),
              HF_HUB_OFFLINE: "1",
              TRANSFORMERS_OFFLINE: "1",
              HF_DATASETS_OFFLINE: "1"
            }
          });
        });
        success = true;
      } catch (execErr) {
        console.warn(`[TTS] OmniVoice error (attempt ${attempts}/${maxAttempts}): ${execErr.message}`);
        if (attempts >= maxAttempts) {
          throw execErr;
        }
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }

    if (!fs.existsSync(wavOutputPath)) {
      throw new Error("omnivoice-infer không thể xuất file âm thanh đầu ra.");
    }

    // Attempt audio postprocessing
    addSilentPadding(wavOutputPath);
    const duration = getAudioDuration(wavOutputPath);

    return { url: `/tts/${wavFileName}`, duration };
  }

  // ─── On-line VBEE Path ───
  const fileName = `tts_${projectId}_${sceneId}_${version}.mp3`;
  const outputPath = path.join(outputDir, fileName);

  const voiceMap = {
    "vbee_ngochuyen": "hn_female_ngochuyen_full_48k-fhg",
    "vbee_manhdung": "hn_male_manhdung_news_48k-fhg",
    "vbee_thutrang": "hn_female_thutrang_news_48k-fhg",
    "vbee_minhhoang": "sg_female_minhhoang_news_48k-fhg",
    "vbee_naman": "sg_male_naman_news_48k-fhg",
    "vbee_minhquan": "hn_male_minhquan_yt_24k-pre"
  };

  const vbeeApiKey = process.env.VBEE_API_KEY;
  const vbeeAppId = process.env.VBEE_APP_ID;

  if (!vbeeApiKey || !vbeeAppId) {
    throw new Error("Thiếu VBEE_API_KEY hoặc VBEE_APP_ID. Vui lòng cấu hình trong Settings.");
  }

  const voiceCode = voiceMap[effectiveVoice.toLowerCase()] || "hn_female_ngochuyen_full_48k-fhg";
  const cleanText = normalizeTextForTTS(text);

  console.log(`[TTS] Calling VBEE API for scene ${sceneId} with voice: ${voiceCode}`);

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
      input_text: cleanText,
      voice_code: voiceCode,
      callback_url: "https://example.com/callback"
    })
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`VBEE API request failed: status ${initRes.status} - ${errText}`);
  }

  const initBody = await initRes.json();
  if (initBody.status !== 1 || !initBody.result || !initBody.result.request_id) {
    throw new Error(`Khởi tạo VBEE job thất bại: ${JSON.stringify(initBody)}`);
  }

  const requestId = initBody.result.request_id;
  const statusUrl = `https://vbee.vn/api/v1/tts/${requestId}`;
  let audioLink = "";
  let pollAttempts = 0;
  const maxPollAttempts = 60;

  while (pollAttempts < maxPollAttempts) {
    pollAttempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const checkRes = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${vbeeApiKey}`,
          "x-app-id": vbeeAppId
        }
      });

      if (!checkRes.ok) continue;

      const checkBody = await checkRes.json();
      const currentStatus = checkBody?.result?.status;

      if (checkBody.status === 1 && checkBody.result) {
        if (currentStatus === "SUCCESS") {
          audioLink = checkBody.result.audio_link;
          break;
        } else if (currentStatus === "FAILED") {
          throw new Error("VBEE render failed.");
        }
      }
    } catch (pollErr) {
      if (pollErr.message.includes("FAILED")) throw pollErr;
    }
  }

  if (!audioLink) {
    throw new Error(`VBEE timeout/error for request_id: ${requestId}`);
  }

  const audioRes = await fetch(audioLink);
  if (!audioRes.ok) {
    throw new Error(`Cannot download VBEE audio: status ${audioRes.status}`);
  }

  const audioBuffer = await audioRes.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(audioBuffer));

  // Postprocess and duration check
  addSilentPadding(outputPath);
  const duration = getAudioDuration(outputPath);

  return { url: `/tts/${fileName}`, duration };
}

module.exports = { generateTTS };
