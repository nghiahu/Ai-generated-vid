const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const tts = require("../services/tts");

// We will copy generateTTS logic but modify it to output both raw and trimmed
async function debugVoice() {
  const text = "Ai bảo C và xi-plus-plus là ngôn ngữ lỗi thời. sắp bị đào thải? Lầm to!";
  const voiceKey = "omnivoice_duythanh";
  const projectId = "debug_proj";
  const sceneId = "debug_scene";
  
  const outputDir = path.join(__dirname, '../public/tts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const { execFile } = require("child_process");
  const { promisify } = require("util");
  const execFileAsync = promisify(execFile);

  const omnivoiceExe = process.env.OMNIVOICE_INFER_PATH ||
    "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\omnivoice-infer.exe";

  let refAudioPath = path.join(__dirname, '../../mp3/duy_thanh_nguyen/voice_duy_thanh.mp3');
  const refText = "Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt. Bỗng dưng từ đâu xuất hiện rất nhiều chuyên gia, am hiểu tường tận mọi lĩnh vực, cái gì cũng phân tích được. Rồi nhiều khóa học xuất hiện hơn, nhiều video xuất hiện hơn, dạy về cách sử dụng, cách tối ưu hóa AI, mà mình thấy tần xuất nó ngày càng dày đặc hơn.";

  const { ensureWavReferenceAudio } = require("../services/tts.js");
  if (fs.existsSync(refAudioPath)) {
    refAudioPath = tts.ensureWavReferenceAudio ? tts.ensureWavReferenceAudio(refAudioPath) : refAudioPath;
  }

  const rawWavPath = path.join(outputDir, `debug_raw.wav`);
  const paddedWavPath = path.join(outputDir, `debug_padded.wav`);

  // Remove existing
  if (fs.existsSync(rawWavPath)) fs.unlinkSync(rawWavPath);
  if (fs.existsSync(paddedWavPath)) fs.unlinkSync(paddedWavPath);

  // Normalize text exactly like in tts.js
  const cleanText = tts.normalizeTextForTTS ? tts.normalizeTextForTTS(text) : text;
  console.log("Normalized Text:", cleanText);

  const speed = parseFloat(process.env.OMNIVOICE_SPEED) || 0.95;
  const args = [
    "--text", cleanText,
    "--output", path.relative(process.cwd(), rawWavPath),
    "--language", "Vietnamese",
    "--speed", speed.toString()
  ];

  if (fs.existsSync(refAudioPath)) {
    args.push("--ref_audio", path.relative(process.cwd(), refAudioPath));
    args.push("--ref_text", refText);
  }

  console.log("Running OmniVoice CLI...");
  await execFileAsync(omnivoiceExe, args, {
    env: {
      ...process.env,
      PYTHONUTF8: "1",
      PYTHONIOENCODING: "utf-8"
    }
  });

  if (!fs.existsSync(rawWavPath)) {
    console.error("Failed to generate raw WAV!");
    return;
  }

  console.log("Raw WAV generated. Copying to padded WAV...");
  fs.copyFileSync(rawWavPath, paddedWavPath);

  console.log("Applying silent padding to padded WAV...");
  // Let's run addSilentPadding
  if (tts.addSilentPadding) {
    tts.addSilentPadding(paddedWavPath);
  } else {
    // Run manually if not exported
    const filter = "silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,adelay=150|150,apad=pad_dur=0.15,volume=1.6,highpass=f=80";
    const tempPath = paddedWavPath + '.temp.wav';
    fs.renameSync(paddedWavPath, tempPath);
    execSync(`ffmpeg -y -i "${tempPath}" -af "${filter}" "${paddedWavPath}"`, { stdio: 'ignore' });
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }

  // Probe durations
  const getDur = (p) => {
    return parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`, { encoding: 'utf8' }).trim());
  };

  const rawDur = getDur(rawWavPath);
  const paddedDur = getDur(paddedWavPath);

  console.log(`Raw duration: ${rawDur}s`);
  console.log(`Padded duration: ${paddedDur}s`);

  // Now, transcribe both using Whisper to see what words are heard!
  const pythonExe = process.env.PYTHON_PATH || "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
  const scriptPath = path.join(__dirname, "../services/align.py");

  const runAlign = (audio) => {
    try {
      const output = execSync(`"${pythonExe}" "${scriptPath}" "${audio}" "${text}"`, { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: "1" } });
      const res = JSON.parse(output.trim());
      return res;
    } catch (e) {
      return { error: e.message };
    }
  };

  console.log("Transcribing Raw WAV...");
  const rawAlign = runAlign(rawWavPath);
  console.log("Raw Alignment count:", rawAlign.length || 0);
  console.log("Raw Alignment sample:", JSON.stringify(rawAlign.slice(-5), null, 2));

  console.log("Transcribing Padded WAV...");
  const paddedAlign = runAlign(paddedWavPath);
  console.log("Padded Alignment count:", paddedAlign.length || 0);
  console.log("Padded Alignment sample:", JSON.stringify(paddedAlign.slice(-5), null, 2));

  process.exit(0);
}

debugVoice().catch(console.error);
