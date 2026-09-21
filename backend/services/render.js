const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const db = require('./db');
const videoOptimizer = require('./videoOptimizer');

const activeRenders = {};

function getRenderStatus(renderId) {
  return activeRenders[renderId];
}

async function renderVideo(projectId, projectData) {
  const renderId = `render_${projectId}_${Date.now()}`;
  activeRenders[renderId] = {
    id: renderId,
    projectId,
    status: 'rendering',
    progress: 0.0,
    renderedFrames: 0,
    totalFrames: 0,
    videoUrl: null
  };

  // Ensure downloads folder exists
  const downloadsDir = path.join(__dirname, '../public/downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Pre-optimize any video media files in scenes with All-Intra GOP=1 for 100% smooth frame seeking in Remotion
  console.log(`[Render] Optimizing video assets for project ${projectId}...`);
  const optimizedProjectData = await videoOptimizer.optimizeProjectVideos(projectData);

  // Create temporary props file to bypass windows command escaping issues
  const tempPropsFile = path.join(__dirname, `../public/temp_${projectId}.json`);
  fs.writeFileSync(tempPropsFile, JSON.stringify(optimizedProjectData, null, 2));

  // Output paths - use absolute paths to prevent Windows shell resolution issues
  const absoluteProps = tempPropsFile;
  const absoluteOutput = path.join(downloadsDir, `output_${projectId}.mp4`);

  console.log(`Starting npx remotion render for project ${projectId}...`);
  console.log(`Temp props location: ${tempPropsFile}`);
  console.log(`Output video location: ${absoluteOutput}`);

  // Spawn remotion render process
  const remotionProcess = spawn('npx', [
    'remotion', 'render', 'src/index.ts', 'MainComposition',
    `"${absoluteOutput}"`,
    `--props="${absoluteProps}"`,
    '--overwrite'
  ], {
    cwd: path.join(__dirname, '../../my-video'),
    shell: true
  });

  activeRenders[renderId].process = remotionProcess;

  remotionProcess.stdout.on('data', (data) => {
    const rawText = data.toString();
    const cleanText = rawText.replace(/\u001b\[[0-9;]*m/g, "");
    console.log(`[Remotion CLI]: ${cleanText.trim()}`);

    // Parse frames e.g., "Rendering frame 45/300" or "Rendered 45/300"
    const frameMatch = cleanText.match(/(?:frame|rendered|\b)(\d+)\/(\d+)/i);
    if (frameMatch) {
      const rendered = parseInt(frameMatch[1], 10);
      const total = parseInt(frameMatch[2], 10);
      if (total > 0 && rendered <= total) {
        activeRenders[renderId].renderedFrames = rendered;
        activeRenders[renderId].totalFrames = total;
        activeRenders[renderId].progress = Math.min(1.0, rendered / total);
      }
    }

    // Parse progress percentage e.g., "(11%)"
    const match = cleanText.match(/\((\d+)%\)/);
    if (match) {
      const percentage = parseInt(match[1], 10);
      activeRenders[renderId].progress = Math.min(1.0, percentage / 100);
    }
  });

  remotionProcess.stderr.on('data', (data) => {
    const text = data.toString();
    console.error(`[Remotion CLI Error]: ${text.trim()}`);
  });

  remotionProcess.on('close', (code) => {
    console.log(`Remotion render process exited with code ${code}`);

    // Clean up temp file
    try {
      if (fs.existsSync(tempPropsFile)) {
        fs.unlinkSync(tempPropsFile);
      }
    } catch (e) {
      console.error("Cleanup error:", e);
    }

    if (code === 0) {
      // Post-process: Swap Frame 0 with Frame at 1.0s (frame 30) so the exported MP4 video's
      // very first frame is the complete visual from 1s, preventing a blank thumbnail on TikTok/FB/YouTube!
      try {
        const { execSync } = require('child_process');
        const rawVideoPath = path.join(downloadsDir, `raw_output_${projectId}.mp4`);
        if (fs.existsSync(absoluteOutput)) {
          fs.renameSync(absoluteOutput, rawVideoPath);
          console.log(`[Thumbnail Injection] Injecting 1.0s frame into Frame 0 of ${absoluteOutput}...`);
          const swapCmd = `ffmpeg -y -i "${rawVideoPath}" -filter_complex "[0:v]trim=start_frame=30:end_frame=31,setpts=PTS-STARTPTS[f0];[0:v]trim=start_frame=1,setpts=PTS-STARTPTS[rest];[f0][rest]concat=n=2:v=1:a=0[outv]" -map "[outv]" -map 0:a? -c:v libx264 -preset veryfast -crf 18 -c:a copy "${absoluteOutput}"`;
          execSync(swapCmd);
          console.log(`[Thumbnail Injection] Successfully injected 1.0s frame into Frame 0!`);

          if (fs.existsSync(rawVideoPath)) {
            fs.unlinkSync(rawVideoPath);
          }
        }
      } catch (injectErr) {
        console.warn(`[Thumbnail Injection] Failed to inject frame 0:`, injectErr.message);
        // Fallback: restore rawVideoPath if output was moved
        const rawVideoPath = path.join(downloadsDir, `raw_output_${projectId}.mp4`);
        if (!fs.existsSync(absoluteOutput) && fs.existsSync(rawVideoPath)) {
          fs.renameSync(rawVideoPath, absoluteOutput);
        }
      }

      activeRenders[renderId].status = 'completed';
      activeRenders[renderId].progress = 1.0;
      activeRenders[renderId].videoUrl = `/downloads/output_${projectId}.mp4`;
      console.log(`Render complete! Video output: /downloads/output_${projectId}.mp4`);

      // Log token usage to video_token_usage.log at workspace root
      (async () => {
        try {
          const project = await db.getProjectById(projectId);
          if (project) {
            const usage = project.config?.tokenUsage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

            const logLine = `[${timestamp}] Video: "${project.title}" | Token prompt: ${usage.promptTokens} | Token completion: ${usage.completionTokens} | Tổng: ${usage.totalTokens}\n`;

            // Path to project root video_token_usage.log
            const logFilePath = path.join(__dirname, '../../video_token_usage.log');
            fs.appendFileSync(logFilePath, logLine);
            console.log(`[Token Log] Ghi log token thành công vào ${logFilePath}`);
          }
        } catch (logErr) {
          console.error("[Token Log] Lỗi khi ghi log token:", logErr.message);
        }
      })();
    } else {
      activeRenders[renderId].status = 'failed';
      console.error(`Render failed with code ${code}`);
    }
  });

  return renderId;
}

function cancelRender(renderId) {
  const renderInfo = activeRenders[renderId];
  if (renderInfo) {
    if (renderInfo.status === 'rendering' && renderInfo.process) {
      try {
        if (process.platform === 'win32') {
          const { execSync } = require('child_process');
          execSync(`taskkill /pid ${renderInfo.process.pid} /T /F`);
        } else {
          renderInfo.process.kill('SIGKILL');
        }
        console.log(`[Render] Successfully cancelled render process for ${renderId}`);
      } catch (e) {
        console.error(`[Render] Failed to kill render process:`, e.message);
      }
    }
    renderInfo.status = 'failed';
  }
}

module.exports = {
  renderVideo,
  getRenderStatus,
  cancelRender
};
