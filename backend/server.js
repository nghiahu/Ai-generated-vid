const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const express = require('express');
const cors = require('cors');
const db = require('./services/db');
const ai = require('./services/ai');
const tts = require('./services/tts');
const media = require('./services/media');
const render = require('./services/render');
const vde = require('./services/vde');
const phoneme = require('./services/phoneme');
const aligner = require('./services/aligner');
const cloudinary = require('cloudinary').v2;
const configService = require('./services/config');

// Load local config (overrides .env values - used by Electron app)
configService.loadConfigOnStartup();

// Initialize VDE directory structure and templates
vde.initializeVDESubdirs();

function reconfigureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}
reconfigureCloudinary();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON request bodies with increased limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve downloads directory with optional forced download parameter (?download=1)
app.get('/downloads/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public/downloads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  if (req.query.download === '1') {
    const downloadName = req.query.filename || req.params.filename;
    return res.download(filePath, downloadName);
  }
  res.sendFile(filePath);
});

// Serve other static assets (voiceover audio, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Temporary in-memory renders store
const activeRenders = {};

// Initialize database connection
db.initDb()
  .then(() => console.log('Database initialization completed.'))
  .catch(err => console.error('Database initialization failed:', err));

// 1. GET /api/projects: List all projects
app.get('/api/projects', async (req, res) => {
  try {
    const thinProjects = await db.getProjects();
    const projectsWithFirstScene = thinProjects.map(p => {
      const firstScene = p.first_scene;
      delete p.first_scene;
      return {
        ...p,
        scenes: firstScene ? [firstScene] : []
      };
    });
    res.json(projectsWithFirstScene);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5. GET /api/vde-themes: Get all VDE themes dynamically from master JSON (includes fintech_edu with bright white card text)
app.get('/api/vde-themes', (req, res) => {
  try {
    const stylesList = Object.keys(vde.BUILTIN_STYLES).map(id => {
      const compiledStyle = vde.getStyle(id);
      const tokens = compiledStyle.tokens;
      return {
        id,
        name: compiledStyle.name || id,
        description: compiledStyle.description || "",
        tokens: {
          background: tokens?.colors?.background || "#000000",
          cardBg: tokens?.colors?.cardBg || "rgba(255, 255, 255, 0.05)",
          border: tokens?.colors?.border || "1px solid rgba(255, 255, 255, 0.1)",
          text: tokens?.colors?.text || "#ffffff",
          textSecondary: tokens?.colors?.textSecondary || "rgba(255, 255, 255, 0.6)",
          accent: tokens?.colors?.accent || "#3b82f6",
          radius: tokens?.radius || "12px",
          shadow: tokens?.shadow || "none",
          fontFamily: tokens?.fonts?.title || "Inter, sans-serif"
        }
      };
    });
    res.json(stylesList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST /api/projects: Create new project
app.post('/api/projects', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const project = await db.createProject(title);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/projects/:id: Get full project detail
app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Inject fully compiled VDE tokens into config
    if (project.config) {
      const visualStyle = project.config.visualStyle || 'minimal';
      const traits = project.config.traits || [];
      const activeTraits = [...traits];
      if (project.config.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
        activeTraits.push('vertical_video');
      }
      project.config.vdeTokens = vde.getStyle(visualStyle, activeTraits);
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3a. GET /api/projects/:id/vde-style: Get fully compiled VDE visual style
app.get('/api/projects/:id/vde-style', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const visualStyle = project.config?.visualStyle || 'minimal';
    const traits = project.config?.traits || [];
    
    // Automatically apply vertical_video trait contextually if ratio is 9:16
    const activeTraits = [...traits];
    if (project.config?.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
      activeTraits.push('vertical_video');
    }
    
    const compiledStyle = vde.getStyle(visualStyle, activeTraits);
    res.json(compiledStyle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3b. DELETE /api/projects/:id: Delete a project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const project = await db.deleteProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT /api/projects/:id/config: Update project configuration
app.put('/api/projects/:id/config', async (req, res) => {
  try {
    const projectId = req.params.id;
    const oldProject = await db.getProjectById(projectId);
    if (!oldProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await db.updateProjectConfig(projectId, req.body);
    
    // Check if voice config has changed
    const oldVoice = oldProject.config?.voice || 'omnivoice_duythanh';
    const oldCustomId = oldProject.config?.customVoiceId || '';
    const newVoice = updatedProject.config?.voice || 'omnivoice_duythanh';
    const newCustomId = updatedProject.config?.customVoiceId || '';

    const voiceChanged = oldVoice !== newVoice || oldCustomId !== newCustomId;

    if (voiceChanged) {
      console.log(`Voice configuration changed from "${oldVoice}" to "${newVoice}". Regenerating TTS for all scenes...`);
      
      const voiceKey = newVoice === 'custom' && newCustomId ? newCustomId : newVoice;
      
      // Regenerate TTS for all scenes in background to prevent blocking response
      (async () => {
        try {
          const project = await db.getProjectById(projectId);
          if (project && project.scenes) {
            const updatedScenes = [];
            for (const scene of project.scenes) {
              if (scene.voiceover) {
                console.log(`Regenerating TTS for project ${projectId} scene ${scene.id} with new voice ${voiceKey}...`);
                const voiceoverText = scene.voiceoverTts || scene.voiceover;
                const ttsResult = await tts.generateTTS(voiceoverText, projectId, scene.id, voiceKey);
                
                const absoluteAudioPath = path.join(__dirname, 'public', ttsResult.url);
                const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);

                updatedScenes.push({
                  ...scene,
                  duration: ttsResult.duration,
                  voiceoverAudioUrl: ttsResult.url,
                  voiceoverDuration: ttsResult.duration,
                  subtitlesJson
                });
              } else {
                updatedScenes.push(scene);
              }
            }
            await db.updateProjectScenes(projectId, updatedScenes);
            console.log(`TTS regeneration completed successfully for project ${projectId}`);
          }
        } catch (bgError) {
          console.error(`Background TTS regeneration failed: ${bgError.message}`);
        }
      })();
    }

    if (updatedProject.config) {
      const visualStyle = updatedProject.config.visualStyle || 'minimal';
      const traits = updatedProject.config.traits || [];
      const activeTraits = [...traits];
      if (updatedProject.config.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
        activeTraits.push('vertical_video');
      }
      updatedProject.config.vdeTokens = vde.getStyle(visualStyle, activeTraits);
    }

    res.json(updatedProject.config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. GET /api/media/search: Disabled searching Unsplash images
app.get('/api/media/search', async (req, res) => {
  res.json([]);
});

// 5b. POST /api/upload: Upload base64 image to Cloudinary
app.post('/api/upload', async (req, res) => {
  try {
    const { file, isLogo } = req.body;
    if (!file) {
      return res.status(400).json({ error: 'Data URL image string is required' });
    }

    // Retry helper with exponential backoff for transient network errors (ECONNRESET, etc.)
    const uploadWithRetry = async (maxAttempts = 3) => {
      let lastError;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await cloudinary.uploader.upload(file, {
            folder: 'ai-video-storyboards',
            resource_type: 'auto',
            timeout: 120000 // 2 min timeout
          });
          return result;
        } catch (err) {
          lastError = err;
          const isRetryable = err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.message?.includes('socket hang up');
          if (!isRetryable || attempt === maxAttempts) throw err;
          const delay = attempt * 1500; // 1.5s, 3s
          console.warn(`[Cloudinary] Attempt ${attempt} failed (${err.code}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      throw lastError;
    };

    const result = await uploadWithRetry(3);
    const secureUrl = result.secure_url;
    
    // Only persist uploaded image in database as general media if it is NOT a watermark logo
    if (!isLogo) {
      await db.saveUploadedMedia(secureUrl);
    }

    res.json({ url: secureUrl });
  } catch (error) {
    console.error('Cloudinary upload failure:', error);
    res.status(500).json({ error: `Cloudinary upload failed: ${error.message}` });
  }
});

// 5c. GET /api/media/previous: Retrieve all user-uploaded media
app.get('/api/media/previous', async (req, res) => {
  try {
    const uploadedMedia = await db.getUploadedMedia();
    const urls = uploadedMedia
      .filter(url => url && typeof url === 'string')
      .map(url => url.trim());
    res.json(Array.from(new Set(urls)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5d. POST /api/media/generate-ai-image: Generate images using Gemini gemini-2.5-flash-image
app.post('/api/media/generate-ai-image', async (req, res) => {
  try {
    const { prompt, count } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);

    const imageCount = Math.min(parseInt(count) || 2, 4); // default 2, max 4
    console.log(`[AI Image] Generating ${imageCount} image(s) with prompt: "${prompt}"`);

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        responseModalities: ['IMAGE', 'TEXT'],
      }
    });

    const generateOne = async () => {
      const result = await model.generateContent(prompt.trim());
      const parts = result.response?.candidates?.[0]?.content?.parts || [];
      const imagePart = parts.find(p => p.inlineData);
      if (!imagePart) throw new Error('No image data in response');
      return imagePart.inlineData;
    };

    // Generate sequentially to avoid quota burst
    const uploadedUrls = [];
    for (let i = 0; i < imageCount; i++) {
      try {
        const inlineData = await generateOne();
        const { data: b64, mimeType } = inlineData;
        const dataUrl = `data:${mimeType || 'image/png'};base64,${b64}`;
        const uploadResult = await cloudinary.uploader.upload(dataUrl, {
          folder: 'ai-generated-images',
          resource_type: 'image'
        });
        await db.saveUploadedMedia(uploadResult.secure_url);
        uploadedUrls.push(uploadResult.secure_url);
        console.log(`[AI Image] Generated image ${i + 1}/${imageCount}`);
      } catch (err) {
        console.warn(`[AI Image] Image ${i + 1} failed:`, err.message);
        // Stop if quota exceeded
        if (err.message?.includes('429') || err.message?.includes('quota')) {
          console.warn('[AI Image] Quota limit hit, stopping early');
          break;
        }
      }
    }

    if (uploadedUrls.length === 0) {
      throw new Error('Không thể tạo ảnh. Có thể hết quota API hoặc prompt bị từ chối. Thử lại sau ít phút.');
    }

    console.log(`[AI Image] Done: ${uploadedUrls.length}/${imageCount} images generated`);
    res.json({ urls: uploadedUrls });

  } catch (error) {
    console.error('[AI Image] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});


// 6. PUT /api/projects/:id/scenes/:sceneId: Update scene details
app.put('/api/projects/:id/scenes/:sceneId', async (req, res) => {
  try {
    const projectId = req.params.id;
    const sceneId = req.params.sceneId;
    const project = await db.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const oldScene = project.scenes.find(s => s.id === sceneId);
    if (!oldScene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    const sceneData = req.body;
    let voiceoverAudioUrl = oldScene.voiceoverAudioUrl;
    let voiceoverDuration = oldScene.voiceoverDuration || 0;

    const updatedScene = await db.updateScene(projectId, sceneId, {
      ...sceneData,
      voiceoverAudioUrl,
      voiceoverDuration
    });

    res.json(updatedScene);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// In-memory real-time progress map for Storyboard generation
const storyboardProgressMap = new Map();

// 7a. GET /api/projects/:id/generate-storyboard/status: Get real-time storyboard generation status
app.get('/api/projects/:id/generate-storyboard/status', (req, res) => {
  const status = storyboardProgressMap.get(req.params.id) || { percent: 0, stage: "Đang khởi tạo AI..." };
  res.json(status);
});

// 7. POST /api/projects/:id/generate-storyboard: Process script text with AI
app.post('/api/projects/:id/generate-storyboard', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await db.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { scriptText, visualStyle, traits, selectedMedia, selectedBgMedia, selectedCtaMedia } = req.body;
    if (!scriptText) {
      return res.status(400).json({ error: 'Script text is required' });
    }

    storyboardProgressMap.set(projectId, { percent: 15, stage: "Đang dùng AI phân tích kịch bản & trích xuất phân cảnh..." });

    // Persist the selected visual style and traits in the project configuration database
    if (visualStyle || traits) {
      const updateData = {};
      if (visualStyle) {
        project.config.visualStyle = visualStyle;
        updateData.visualStyle = visualStyle;
      }
      if (traits) {
        project.config.traits = traits;
        updateData.traits = traits;
      }
      await db.updateProjectConfig(projectId, updateData);
    }

    // Determine active traits (including contextual ones like ratio-based)
    const currentStyle = visualStyle || project.config.visualStyle || "minimal";
    const currentTraits = traits || project.config.traits || [];
    const activeTraits = [...currentTraits];
    if (project.config.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
      activeTraits.push('vertical_video');
    }

    // Step 1: Call Gemini to parse and split script text using VDE rules
    const rawScenes = await ai.generateStoryboard(projectId, scriptText, currentStyle, activeTraits, project.config.length);

    storyboardProgressMap.set(projectId, { 
      percent: 35, 
      stage: `Đã phân tích ${rawScenes.length} phân cảnh. Đang xử lý âm thanh & hình ảnh...` 
    });

    // Step 2: For each scene, fetch images and generate voiceover TTS
    const scenes = [];
    
    // Find the Ending/CTA scene index (usually the last scene)
    let ctaSceneIndex = rawScenes.length - 1;
    for (let i = rawScenes.length - 1; i >= 0; i--) {
      const scene = rawScenes[i];
      if (scene.sceneIntent?.type === 'ending' || scene.layoutId?.toLowerCase().includes('ending')) {
        ctaSceneIndex = i;
        break;
      }
    }

    for (let i = 0; i < rawScenes.length; i++) {
      const scenePct = Math.round(35 + ((i + 1) / rawScenes.length) * 55);
      storyboardProgressMap.set(projectId, { 
        percent: scenePct, 
        stage: `Đang tạo giọng đọc TTS & trích xuất hình ảnh cho phân cảnh ${i + 1}/${rawScenes.length}...` 
      });
      const scene = rawScenes[i];
      const sceneId = `scene_${projectId}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      
      let isCtaApplied = false;
      let ctaUrl = "";
      let isVideoCta = false;
      if (i === ctaSceneIndex && Array.isArray(selectedCtaMedia) && selectedCtaMedia.length > 0 && selectedCtaMedia[0]) {
        ctaUrl = selectedCtaMedia[0].trim();
        isVideoCta = ctaUrl.toLowerCase().includes("/video/upload/") || 
                     /\.(mp4|webm|ogg|mov|avi|flv|mkv)$/i.test(ctaUrl.toLowerCase());
        isCtaApplied = true;
      }

      // Get images: use user selected media sequentially if available, otherwise leave empty
      let mediaList = [];
      if (isCtaApplied) {
        mediaList = [ctaUrl];
      } else if (Array.isArray(selectedMedia) && selectedMedia.length > 0) {
        const userImg = selectedMedia[i % selectedMedia.length];
        mediaList = [userImg];
      }

      // Get background images: use user selected bg media sequentially if available
      let bgMediaList = [];
      let selectedBgMediaIndex = -1;
      if (isCtaApplied) {
        if (!isVideoCta) {
          bgMediaList = [ctaUrl];
          selectedBgMediaIndex = 0;
        }
      } else if (Array.isArray(selectedBgMedia) && selectedBgMedia.length > 0) {
        const userBgImg = selectedBgMedia[i % selectedBgMedia.length];
        bgMediaList = [userBgImg];
        selectedBgMediaIndex = 0;
      }

      // Generate TTS Voiceover audio
      const voiceKey = project.config.voice === 'custom' && project.config.customVoiceId 
        ? project.config.customVoiceId 
        : (project.config.voice || 'omnivoice_duythanh');
      const voiceoverText = scene.voiceoverTts || scene.voiceover;
      const ttsResult = await tts.generateTTS(voiceoverText, projectId, sceneId, voiceKey);

      const absoluteAudioPath = path.join(__dirname, 'public', ttsResult.url);
      const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);

      scenes.push({
        id: sceneId,
        sceneIndex: i,
        duration: ttsResult.duration || scene.duration || 6.0,
        layoutFamily: (isCtaApplied && !isVideoCta) ? "blank" : (scene.layoutFamily || null),
        visualLayout: (isCtaApplied && !isVideoCta) ? "Blank" : (scene.visualLayout || null),
        sceneIntent: scene.sceneIntent || null,
        heading: scene.heading,
        category: scene.category || "",
        points: scene.points,
        voiceover: scene.voiceover,
        voiceoverTts: scene.voiceoverTts || "",
        voiceoverAudioUrl: ttsResult.url,
        voiceoverDuration: ttsResult.duration,
        subtitlesJson,
        placement: scene.placement,
        mediaList,
        selectedMediaIndex: mediaList.length > 0 ? 0 : -1,
        bgMediaList,
        selectedBgMediaIndex,
        theme: scene.theme || "default",
        accentColor: scene.accentColor || "#FFB7C5"
      });
    }

    // Save scenes to project in DB and fetch updated project config
    const updatedProject = await db.updateProjectScenes(projectId, scenes);

    if (updatedProject.config) {
      const activeStyle = updatedProject.config.visualStyle || 'minimal';
      const activeTraits = [...(updatedProject.config.traits || [])];
      if (updatedProject.config.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
        activeTraits.push('vertical_video');
      }
      updatedProject.config.vdeTokens = vde.getStyle(activeStyle, activeTraits);
    }

    storyboardProgressMap.set(projectId, { percent: 100, stage: "Hoàn tất kịch bản Storyboard!" });

    res.json({ 
      scenes: updatedProject.scenes, 
      config: updatedProject.config 
    });
  } catch (error) {
    console.error("Storyboard generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7b. POST /api/projects/:id/scenes: Create a new dynamic scene
app.post('/api/projects/:id/scenes', async (req, res) => {
  try {
    const scene = await db.createScene(req.params.id, req.body);
    res.status(201).json(scene);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7c. DELETE /api/projects/:id/scenes/:sceneId: Delete a scene and re-index the rest
app.delete('/api/projects/:id/scenes/:sceneId', async (req, res) => {
  try {
    await db.deleteScene(req.params.id, req.params.sceneId);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7d. POST /api/projects/:id/scenes/:sceneId/regenerate-tts: Regenerate TTS for a single scene
app.post('/api/projects/:id/scenes/:sceneId/regenerate-tts', async (req, res) => {
  try {
    const projectId = req.params.id;
    const sceneId = req.params.sceneId;
    const project = await db.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const scene = project.scenes.find(s => s.id === sceneId);
    if (!scene) {
      return res.status(404).json({ error: 'Scene not found' });
    }

    if (!scene.voiceover) {
      return res.status(400).json({ error: 'Scene has no voiceover text to generate' });
    }

    console.log(`[Regenerate Scene TTS] Optimizing text phonemes for scene ${sceneId}...`);
    // 1. Regenerate optimized TTS phonetic script (CMU phonemes)
    const voiceoverTts = await phoneme.optimizeTextForPhonemes(scene.voiceover, projectId);

    // 2. Get active voice configuration
    const voiceKey = project.config.voice === 'custom' && project.config.customVoiceId 
      ? project.config.customVoiceId 
      : (project.config.voice || 'omnivoice_duythanh');

    console.log(`[Regenerate Scene TTS] Generating TTS for scene ${sceneId} using voice ${voiceKey}...`);
    const voiceoverText = voiceoverTts || scene.voiceover;
    const ttsResult = await tts.generateTTS(voiceoverText, projectId, sceneId, voiceKey);

    // 3. Compute subtitles word timestamps
    const absoluteAudioPath = path.join(__dirname, 'public', ttsResult.url);
    const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);

    // 4. Save updated scene to DB
    const updatedScene = await db.updateScene(projectId, sceneId, {
      voiceoverTts,
      voiceoverAudioUrl: ttsResult.url,
      voiceoverDuration: ttsResult.duration,
      duration: ttsResult.duration, // Sync scene duration with voiceover duration
      subtitlesJson
    });

    res.json(updatedScene);
  } catch (error) {
    console.error("Scene TTS regeneration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 7e. POST /api/projects/:id/regenerate-tts: Regenerate TTS for all scenes and ending card
app.post('/api/projects/:id/regenerate-tts', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await db.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const voiceKey = project.config?.voice === 'custom' && project.config.customVoiceId 
      ? project.config.customVoiceId 
      : (project.config?.voice || 'omnivoice_duythanh');

    const updatedScenes = [];
    
    // Regenerate TTS for each scene
    for (const scene of project.scenes) {
      if (scene.voiceover) {
        console.log(`[Regenerate TTS] Generating TTS for scene ${scene.id} using previous voiceover text...`);
        const voiceoverText = scene.voiceoverTts || scene.voiceover;
        const ttsResult = await tts.generateTTS(voiceoverText, projectId, scene.id, voiceKey);
        
        const absoluteAudioPath = path.join(__dirname, 'public', ttsResult.url);
        const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);

        updatedScenes.push({
          ...scene,
          duration: ttsResult.duration,
          voiceoverAudioUrl: ttsResult.url,
          voiceoverDuration: ttsResult.duration,
          subtitlesJson
        });
      } else {
        updatedScenes.push(scene);
      }
    }

    // Save updated scenes to DB
    await db.updateProjectScenes(projectId, updatedScenes);

    // Get final project with updated config and scenes
    const finalProject = await db.getProjectById(projectId);
    res.json({ message: 'TTS regenerated successfully', project: finalProject });
  } catch (error) {
    console.error("TTS regeneration error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 8. POST /api/projects/:id/render: Trigger video render
app.post('/api/projects/:id/render', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await db.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Inject fully compiled VDE tokens into config for rendering
    if (project.config) {
      const visualStyle = project.config.visualStyle || 'minimal';
      const traits = project.config.traits || [];
      const activeTraits = [...traits];
      if (project.config.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
        activeTraits.push('vertical_video');
      }
      project.config.vdeTokens = vde.getStyle(visualStyle, activeTraits);
    }

    // Trigger actual child process video rendering
    const renderId = await render.renderVideo(projectId, project);

    res.status(202).json({
      renderId,
      status: 'rendering'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. GET /api/projects/:id/render/status/:renderId: Polling render progress
app.get('/api/projects/:id/render/status/:renderId', (req, res) => {
  try {
    const { renderId } = req.params;
    const renderInfo = render.getRenderStatus(renderId);
    if (!renderInfo) {
      return res.status(404).json({ error: 'Render process not found' });
    }
    res.json({
      status: renderInfo.status,
      progress: renderInfo.progress,
      renderedFrames: renderInfo.renderedFrames || 0,
      totalFrames: renderInfo.totalFrames || 0,
      videoUrl: renderInfo.videoUrl
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9b. POST /api/projects/:id/render/cancel/:renderId: Cancel video render
app.post('/api/projects/:id/render/cancel/:renderId', (req, res) => {
  try {
    const { renderId } = req.params;
    render.cancelRender(renderId);
    res.json({ success: true, message: 'Render cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Config API — read/write API keys (used by Electron Settings)
app.get('/api/config', (req, res) => {
  try {
    const config = configService.readConfig();
    // Mask secret values for security
    const masked = {};
    for (const [k, v] of Object.entries(config)) {
      masked[k] = v ? '••••••••' : '';
    }
    res.json({ configured: configService.isConfigured(), keys: masked });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const existing = configService.readConfig();
    const updates = req.body || {};
    // Merge: only update non-empty values sent from client
    const merged = { ...existing };
    for (const [k, v] of Object.entries(updates)) {
      if (v && v !== '••••••••') {
        merged[k] = v;
      }
    }
    configService.writeConfig(merged);
    configService.applyConfigToEnv(merged);
    reconfigureCloudinary();
    res.json({ success: true, message: 'Config saved and applied.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/config/status', (req, res) => {
  const fs = require('fs');
  res.json({
    configured: configService.isConfigured(),
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasVbee: !!(process.env.VBEE_API_KEY && process.env.VBEE_APP_ID),
    hasCloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY),
    hasOmnivoice: !!(process.env.OMNIVOICE_INFER_PATH && fs.existsSync(process.env.OMNIVOICE_INFER_PATH))
  });
});

// ─────────────────────────────────────────────
// Pronunciation Dictionary (Phoneme Overrides)
// ─────────────────────────────────────────────
app.get('/api/phonemes', async (req, res) => {
  try {
    const list = await db.getAllCustomPhonemes();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phonemes', async (req, res) => {
  try {
    const { term, phoneme: pronunciation } = req.body || {};
    if (!term || !pronunciation) {
      return res.status(400).json({ error: "Thiếu từ khóa hoặc cách phát âm" });
    }
    const cleanTerm = term.toLowerCase().trim();
    await db.savePhonemeToCache({
      term: cleanTerm,
      display_term: term.trim(),
      phoneme: pronunciation.trim(),
      manual_override: 1,
      source: 'manual'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/phonemes/:term', async (req, res) => {
  try {
    const { term } = req.params;
    if (!term) {
      return res.status(400).json({ error: "Thiếu từ khóa cần xóa" });
    }
    await db.deleteCustomPhoneme(term);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Boot server
const server = app.listen(PORT, async () => {
  console.log(`Express Backend Server is running on port ${PORT}`);
  try {
    await db.initDb();
  } catch (err) {
    console.error('Failed to initialize SQLite database at startup:', err);
  }
});
server.timeout = 600000; // 10 phút timeout để hỗ trợ các tác vụ AI và render video nặng

// Auto-shutdown backend if parent process (Electron) exits
if (process.env.ELECTRON_RUN_AS_NODE === '1') {
  setInterval(() => {
    try {
      process.kill(process.ppid, 0);
    } catch (e) {
      console.log('[Backend] Parent process (Electron) has exited. Shutting down gracefully...');
      try {
        db.closeDb();
      } catch (err) {}
      process.exit(0);
    }
  }, 2000);
}

// Graceful shutdown handling to prevent database locking issues
function gracefulShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  try {
    db.closeDb();
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 2 seconds if server.close hangs
  setTimeout(() => {
    console.warn('Forcefully shutting down after timeout');
    process.exit(1);
  }, 2000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => {
  console.log('Received SIGUSR2 (nodemon restart).');
  try {
    db.closeDb();
  } catch (err) {
    console.error('Error closing database on nodemon restart:', err.message);
  }
  process.kill(process.pid, 'SIGUSR2');
});
