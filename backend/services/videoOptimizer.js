const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

const CACHE_DIR = path.join(__dirname, '../public/video_cache');

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function isVideoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('/video/upload/') ||
    /\.(mp4|webm|ogg|mov|avi|flv|mkv)(\?.*)?$/i.test(lower)
  );
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      // Handle HTTP redirects (301, 302, 307, 308)
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Download failed with status: ${response.statusCode}`));
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function runFfmpegConvert(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Convert to All-Intra H.264 (GOP=1, 30fps CFR, yuv420p) for 100% accurate frame seeking in Remotion
    const args = [
      '-y',
      '-i', `"${inputPath}"`,
      '-c:v', 'libx264',
      '-g', '1',
      '-keyint_min', '1',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-crf', '17',
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '192k',
      `"${outputPath}"`
    ];

    const proc = spawn('ffmpeg', args, { shell: true });

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Optimizes a video URL for frame-accurate Remotion seeking (GOP=1, 30fps).
 * Returns the optimized local URL or fallback to original URL.
 */
async function getOptimizedVideoUrl(rawUrl) {
  if (!isVideoUrl(rawUrl)) return rawUrl;

  try {
    ensureCacheDir();

    const hash = crypto.createHash('md5').update(rawUrl).digest('hex');
    const optimizedFilename = `opt_${hash}.mp4`;
    const optimizedPath = path.join(CACHE_DIR, optimizedFilename);
    const publicUrl = `/video_cache/${optimizedFilename}`;

    // If already converted and valid (> 1000 bytes), return cached URL immediately
    if (fs.existsSync(optimizedPath) && fs.statSync(optimizedPath).size > 1000) {
      console.log(`[Video Optimizer] Using cached All-Intra video: ${optimizedFilename}`);
      return publicUrl;
    }

    console.log(`[Video Optimizer] Optimizing video for frame-accurate Remotion render: ${rawUrl}`);

    let sourceFileToConvert = rawUrl;
    let tempRawFile = null;

    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      tempRawFile = path.join(CACHE_DIR, `temp_${hash}_raw.mp4`);
      await downloadFile(rawUrl, tempRawFile);
      sourceFileToConvert = tempRawFile;
    } else if (rawUrl.startsWith('/')) {
      sourceFileToConvert = path.join(__dirname, '../public', rawUrl);
    }

    const tempConverted = path.join(CACHE_DIR, `temp_${hash}_conv.mp4`);
    await runFfmpegConvert(sourceFileToConvert, tempConverted);

    // Atomic move to final cached destination
    fs.renameSync(tempConverted, optimizedPath);

    // Clean up temporary downloaded file
    if (tempRawFile && fs.existsSync(tempRawFile)) {
      try { fs.unlinkSync(tempRawFile); } catch (e) {}
    }

    console.log(`[Video Optimizer] Successfully converted video to All-Intra 30fps: ${optimizedFilename}`);
    return publicUrl;
  } catch (err) {
    console.warn(`[Video Optimizer] Failed to optimize video (${rawUrl}), falling back to original:`, err.message);
    return rawUrl;
  }
}

/**
 * Traverses projectData scenes and optimizes all video media references before Remotion render.
 */
async function optimizeProjectVideos(projectData) {
  if (!projectData || !Array.isArray(projectData.scenes)) return projectData;

  const cloned = JSON.parse(JSON.stringify(projectData));

  for (const scene of cloned.scenes) {
    // 1. Optimize mediaList items
    if (Array.isArray(scene.mediaList)) {
      for (let i = 0; i < scene.mediaList.length; i++) {
        const item = scene.mediaList[i];
        if (isVideoUrl(item)) {
          scene.mediaList[i] = await getOptimizedVideoUrl(item);
        }
      }
    }

    // 2. Optimize bgMediaList items
    if (Array.isArray(scene.bgMediaList)) {
      for (let i = 0; i < scene.bgMediaList.length; i++) {
        const item = scene.bgMediaList[i];
        if (isVideoUrl(item)) {
          scene.bgMediaList[i] = await getOptimizedVideoUrl(item);
        }
      }
    }
  }

  return cloned;
}

module.exports = {
  isVideoUrl,
  getOptimizedVideoUrl,
  optimizeProjectVideos
};
