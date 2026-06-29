const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

  // Create temporary props file to bypass windows command escaping issues
  const tempPropsFile = path.join(__dirname, `../public/temp_${projectId}.json`);
  fs.writeFileSync(tempPropsFile, JSON.stringify(projectData, null, 2));

  // Output paths relative to my-video/ (the working directory)
  const relativeProps = `../backend/public/temp_${projectId}.json`;
  const relativeOutput = `../backend/public/downloads/output_${projectId}.mp4`;

  console.log(`Starting npx remotion render for project ${projectId}...`);
  console.log(`Temp props location: ${tempPropsFile}`);

  // Spawn remotion render process
  const remotionProcess = spawn('npx', [
    'remotion', 'render', 'src/index.ts', 'MainComposition',
    relativeOutput,
    `--input-props=${relativeProps}`,
    '--overwrite'
  ], {
    cwd: path.join(__dirname, '../../my-video'),
    shell: true
  });

  remotionProcess.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`[Remotion CLI]: ${text.trim()}`);
    
    // Parse frames e.g., "Rendering frame 45/300"
    const frameMatch = text.match(/frame (\d+)\/(\d+)/i);
    if (frameMatch) {
      activeRenders[renderId].renderedFrames = parseInt(frameMatch[1], 10);
      activeRenders[renderId].totalFrames = parseInt(frameMatch[2], 10);
    }

    // Parse progress e.g., "Rendering frame 34/300 (11%)"
    const match = text.match(/\((\d+)%\)/);
    if (match) {
      const percentage = parseInt(match[1], 10);
      activeRenders[renderId].progress = percentage / 100;
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
      activeRenders[renderId].status = 'completed';
      activeRenders[renderId].progress = 1.0;
      activeRenders[renderId].videoUrl = `/downloads/output_${projectId}.mp4`;
      console.log(`Render complete! Video output: /downloads/output_${projectId}.mp4`);
    } else {
      activeRenders[renderId].status = 'failed';
      console.error(`Render failed with code ${code}`);
    }
  });

  return renderId;
}

module.exports = {
  renderVideo,
  getRenderStatus
};
