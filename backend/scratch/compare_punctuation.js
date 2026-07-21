const path = require("path");
const fs = require("fs");
const { execSync, execFile } = require("child_process");
const { promisify } = require("util");
const execFileAsync = promisify(execFile);
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const tts = require("../services/tts");

async function runOmniVoice(text, outName) {
  const outputDir = path.join(__dirname, '../public/tts');
  const wavPath = path.join(outputDir, outName);
  if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);

  const omnivoiceExe = process.env.OMNIVOICE_INFER_PATH ||
    "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\Scripts\\omnivoice-infer.exe";

  let refAudioPath = path.join(__dirname, '../../mp3/duy_thanh_nguyen/voice_duy_thanh.mp3');
  const refText = "Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt. Bỗng dưng từ đâu xuất hiện rất nhiều chuyên gia, am hiểu tường tận mọi lĩnh vực, cái gì cũng phân tích được. Rồi nhiều khóa học xuất hiện hơn, nhiều video xuất hiện hơn, dạy về cách sử dụng, cách tối ưu hóa AI, mà mình thấy tần xuất nó ngày càng dày đặc hơn.";

  const { ensureWavReferenceAudio } = require("../services/tts.js");
  if (fs.existsSync(refAudioPath)) {
    refAudioPath = tts.ensureWavReferenceAudio ? tts.ensureWavReferenceAudio(refAudioPath) : refAudioPath;
  }

  const cleanText = tts.normalizeTextForTTS ? tts.normalizeTextForTTS(text) : text;
  console.log(`\nText: "${text}"`);
  console.log(`Normalized: "${cleanText}"`);

  const speed = parseFloat(process.env.OMNIVOICE_SPEED) || 0.95;
  const args = [
    "--text", cleanText,
    "--output", path.relative(process.cwd(), wavPath),
    "--language", "Vietnamese",
    "--speed", speed.toString()
  ];

  if (fs.existsSync(refAudioPath)) {
    args.push("--ref_audio", path.relative(process.cwd(), refAudioPath));
    args.push("--ref_text", refText);
  }

  await execFileAsync(omnivoiceExe, args, {
    env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" }
  });

  const getDur = (p) => parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${p}"`, { encoding: 'utf8' }).trim());
  
  const rawDur = getDur(wavPath);
  console.log(`-> Raw duration: ${rawDur}s`);

  // Apply padding to a copy
  const paddedWavPath = wavPath.replace('.wav', '_padded.wav');
  if (fs.existsSync(paddedWavPath)) fs.unlinkSync(paddedWavPath);
  fs.copyFileSync(wavPath, paddedWavPath);

  const filter = "silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,silenceremove=start_periods=1:start_threshold=-50dB:detection=peak,areverse,adelay=150|150,apad=pad_dur=0.15,volume=1.6,highpass=f=80";
  const tempPath = paddedWavPath + '.temp.wav';
  fs.renameSync(paddedWavPath, tempPath);
  execSync(`ffmpeg -y -i "${tempPath}" -af "${filter}" "${paddedWavPath}"`, { stdio: 'ignore' });
  if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);

  const paddedDur = getDur(paddedWavPath);
  console.log(`-> Padded duration: ${paddedDur}s`);

  // Run Whisper to see transcribed text
  const pythonExe = process.env.PYTHON_PATH || "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
  const scriptPath = path.join(__dirname, "../services/align.py");

  const runAlign = (audio) => {
    try {
      const output = execSync(`"${pythonExe}" "${scriptPath}" "${audio}" "${text}"`, { encoding: 'utf8', env: { ...process.env, PYTHONUTF8: "1" } });
      return JSON.parse(output.trim());
    } catch (e) {
      return { error: e.message };
    }
  };

  const alignRes = runAlign(paddedWavPath);
  console.log("Aligned words:");
  console.log(alignRes.map(w => `${w.word} (${w.start}s - ${w.end}s)`).join(', '));
}

async function main() {
  // Test Case 1: with period "."
  console.log("=== RUNNING TEST CASE 1 (WITH PERIOD) ===");
  await runOmniVoice("Ai bảo C và xi-plus-plus là ngôn ngữ lỗi thời. sắp bị đào thái? Lầm to!", "test_period.wav");

  // Test Case 2: with comma ","
  console.log("=== RUNNING TEST CASE 2 (WITH COMMA) ===");
  await runOmniVoice("Ai bảo C và xi-plus-plus là ngôn ngữ lỗi thời, sắp bị đào thải? Lầm to!", "test_comma.wav");

  process.exit(0);
}

main().catch(console.error);
