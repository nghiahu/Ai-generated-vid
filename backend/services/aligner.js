const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const { optimizeTimeline } = require("./subtitleOptimizer");

function getPythonExecutable() {
  // Check the bundled offline python first to support client machines perfectly
  const bundledPython = "C:\\Users\\Public\\ai-video-app-runtime\\Python311\\python.exe";
  if (fs.existsSync(bundledPython)) {
    return bundledPython;
  }

  // Use custom python path if defined in .env or config, otherwise default to typical python.exe
  const pythonPath = process.env.PYTHON_PATH || "C:\\Users\\nghia\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";
  if (fs.existsSync(pythonPath)) {
    return pythonPath;
  }
  return "python";
}

/**
 * Get word-level timestamps by running the local Python forced aligner.
 * Falls back to linear timestamps if aligner fails.
 */
function getWordTimestamps(audioPath, originalText, audioDuration) {
  return new Promise((resolve) => {
    const pythonExe = getPythonExecutable();
    const scriptPath = path.join(__dirname, "align.py");
    
    console.log(`[Forced Alignment] Aligning "${originalText.substring(0, 30)}..." with audio: ${path.basename(audioPath)}`);
    
    const absoluteAudioPath = path.resolve(audioPath);
    
    execFile(
      pythonExe,
      [scriptPath, absoluteAudioPath, originalText],
      {
        timeout: 45000, // 45 seconds timeout
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
      },
      (error, stdout, stderr) => {
        if (error) {
          console.error("[Forced Alignment] Alignment script failed:", error.message);
          if (stderr) console.error("[Forced Alignment] stderr:", stderr);
          return resolve(getUniformTimestampsFallback(originalText, audioPath));
        }
        
        try {
          const result = JSON.parse(stdout.trim());
          if (result.error) {
            console.warn("[Forced Alignment] Aligner returned error:", result.error);
            return resolve(getUniformTimestampsFallback(originalText, audioPath, audioDuration));
          }
          console.log(`[Forced Alignment] Aligned successfully. Extracted ${result.length} word timestamps.`);
          const optimized = optimizeTimeline(result, audioDuration || 6.0);
          return resolve(optimized);
        } catch (parseErr) {
          console.error("[Forced Alignment] Failed to parse aligner stdout:", parseErr.message, "stdout raw:", stdout);
          return resolve(getUniformTimestampsFallback(originalText, audioPath, audioDuration));
        }
      }
    );
  });
}

/**
 * Fallback: distributes word timestamps uniformly across the estimated audio duration
 */
function getUniformTimestampsFallback(text, audioPath, audioDuration) {
  console.log("[Forced Alignment] Falling back to uniform/linear timestamps.");
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  if (words.length === 0) return [];
  
  // Try to estimate duration using ffprobe
  let duration = 6.0;
  try {
    const { execSync } = require("child_process");
    const output = execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`, { encoding: 'utf8' });
    const parsed = parseFloat(output.trim());
    if (!isNaN(parsed) && parsed > 0) {
      duration = parsed;
    }
  } catch (e) {}
  
  const effectiveDuration = audioDuration || duration;
  const startOffset = 0.15;
  const endOffset = 0.15;
  const speakingDuration = Math.max(0.5, effectiveDuration - startOffset - endOffset);
  const timePerWord = speakingDuration / words.length;
  
  const rawWords = words.map((word, index) => ({
    word,
    start: parseFloat((startOffset + index * timePerWord).toFixed(3)),
    end:   parseFloat((startOffset + (index + 1) * timePerWord).toFixed(3))
  }));

  return optimizeTimeline(rawWords, effectiveDuration);
}

module.exports = {
  getWordTimestamps
};
