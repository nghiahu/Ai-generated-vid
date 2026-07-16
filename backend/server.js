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

// Initialize VDE directory structure and templates
vde.initializeVDESubdirs();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Parse JSON request bodies with increased limit for base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve downloads directory with attachment header to force browser download
app.use('/downloads', express.static(path.join(__dirname, 'public/downloads'), {
  setHeaders: function (res, filePath) {
    if (filePath.endsWith('.mp4')) {
      res.set('Content-Disposition', 'attachment');
    }
  }
}));

// Serve other static assets (voiceover audio, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/tts', express.static(path.join(__dirname, 'public/tts')));

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
    const fullProjects = await Promise.all(
      thinProjects.map(async p => {
        const project = await db.getProjectById(p.id);
        if (project && project.config) {
          const visualStyle = project.config.visualStyle || 'minimal';
          const traits = project.config.traits || [];
          const activeTraits = [...traits];
          if (project.config.ratio === '9:16' && !activeTraits.includes('vertical_video')) {
            activeTraits.push('vertical_video');
          }
          project.config.vdeTokens = vde.getStyle(visualStyle, activeTraits);
        }
        return project;
      })
    );
    res.json(fullProjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1.5. GET /api/vde-themes: Get all VDE themes dynamically from master JSON
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
    
    // Check if voice config has changed or ending voiceover has changed
    const oldVoice = oldProject.config?.voice || 'rachel';
    const oldCustomId = oldProject.config?.customVoiceId || '';
    const newVoice = updatedProject.config?.voice || 'rachel';
    const newCustomId = updatedProject.config?.customVoiceId || '';

    const oldEndingVoiceover = oldProject.config?.ending?.voiceover || '';
    const newEndingVoiceover = updatedProject.config?.ending?.voiceover || '';

    const voiceChanged = oldVoice !== newVoice || oldCustomId !== newCustomId;
    const endingVoiceoverChanged = oldEndingVoiceover !== newEndingVoiceover;

    if (newEndingVoiceover && (endingVoiceoverChanged || voiceChanged)) {
      console.log(`Generating ending voiceover TTS for project ${projectId}...`);
      const voiceKey = newVoice === 'custom' && newCustomId ? newCustomId : newVoice;
      try {
        const ttsResult = await tts.generateTTS(newEndingVoiceover, projectId, 'ending', voiceKey);
        
        // Merge into ending config
        const endingConfig = {
          ...updatedProject.config.ending,
          voiceoverAudioUrl: ttsResult.url,
          voiceoverDuration: ttsResult.duration
        };
        const finalProject = await db.updateProjectConfig(projectId, { ending: endingConfig });
        updatedProject.config = finalProject.config;
      } catch (ttsErr) {
        console.error(`Failed to generate ending voiceover TTS:`, ttsErr.message);
      }
    } else if (!newEndingVoiceover && oldEndingVoiceover) {
      // Clear audio fields if voiceover was cleared
      const endingConfig = {
        ...updatedProject.config.ending,
        voiceoverAudioUrl: "",
        voiceoverDuration: 0
      };
      const finalProject = await db.updateProjectConfig(projectId, { ending: endingConfig });
      updatedProject.config = finalProject.config;
    }

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

// 5. GET /api/media/search: Search Unsplash images
app.get('/api/media/search', async (req, res) => {
  try {
    const { query } = req.query;
    const images = await media.searchImages(query);
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5b. POST /api/upload: Upload base64 image to Cloudinary
app.post('/api/upload', async (req, res) => {
  try {
    const { file } = req.body;
    if (!file) {
      return res.status(400).json({ error: 'Data URL image string is required' });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: 'ai-video-storyboards',
      resource_type: 'auto'
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload failure:', error);
    res.status(500).json({ error: `Cloudinary upload failed: ${error.message}` });
  }
});

// 5c. GET /api/media/previous: Retrieve all previously used images from scenes
app.get('/api/media/previous', async (req, res) => {
  try {
    const thinProjects = await db.getProjects();
    const fullProjects = await Promise.all(
      thinProjects.map(p => db.getProjectById(p.id))
    );

    const allUrls = new Set();
    for (const project of fullProjects) {
      if (project && project.scenes) {
        for (const scene of project.scenes) {
          if (Array.isArray(scene.mediaList)) {
            for (const url of scene.mediaList) {
              if (url && typeof url === 'string') {
                allUrls.add(url);
              }
            }
          }
        }
      }
    }

    res.json(Array.from(allUrls));
  } catch (error) {
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

    // If voiceover text has changed, regenerate TTS using currently configured voice
    if (sceneData.voiceover !== undefined && sceneData.voiceover !== oldScene.voiceover) {
      // Regenerate optimized TTS phonetic script (CMU phonemes)
      const voiceoverTts = await phoneme.optimizeTextForPhonemes(sceneData.voiceover);
      sceneData.voiceoverTts = voiceoverTts;

      const voiceKey = project.config.voice === 'custom' && project.config.customVoiceId 
        ? project.config.customVoiceId 
        : (project.config.voice || 'rachel');
      const voiceoverText = voiceoverTts || sceneData.voiceover;
      const ttsResult = await tts.generateTTS(voiceoverText, projectId, sceneId, voiceKey);
      voiceoverAudioUrl = ttsResult.url;
      voiceoverDuration = ttsResult.duration;
      sceneData.duration = ttsResult.duration;

      const absoluteAudioPath = path.join(__dirname, 'public', ttsResult.url);
      const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, sceneData.voiceover, ttsResult.duration);
      sceneData.subtitlesJson = subtitlesJson;
    }

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

// 7. POST /api/projects/:id/generate-storyboard: Process script text with AI
app.post('/api/projects/:id/generate-storyboard', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await db.getProjectById(projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const { scriptText, visualStyle, traits, selectedMedia } = req.body;
    if (!scriptText) {
      return res.status(400).json({ error: 'Script text is required' });
    }

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
    const rawScenes = await ai.generateStoryboard(scriptText, currentStyle, activeTraits, project.config.length);

    // Step 2: For each scene, fetch images and generate voiceover TTS
    const scenes = [];
    for (let i = 0; i < rawScenes.length; i++) {
      const scene = rawScenes[i];
      const sceneId = `scene_${projectId}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      
      // Get images: use user selected media sequentially if available, otherwise search Unsplash
      let mediaList = [];
      if (Array.isArray(selectedMedia) && selectedMedia.length > 0) {
        const userImg = selectedMedia[i % selectedMedia.length];
        mediaList = [userImg];
      } else {
        if (Array.isArray(scene.keywords)) {
          for (const kw of scene.keywords) {
            try {
              const searchQuery = visualStyle ? `${kw} ${visualStyle}` : kw;
              mediaList = await media.searchImages(searchQuery);
              if (mediaList && mediaList.length > 0) {
                break;
              }
            } catch (err) {
              console.warn(`[Unsplash] Search failed for keyword "${kw}":`, err.message);
            }
          }
          if (mediaList.length === 0) {
            try {
              mediaList = await media.searchImages(visualStyle || "technology");
            } catch (err) {
              console.error("[Unsplash] Safe fallback search failed:", err.message);
            }
          }
        } else {
          const kw = scene.keywords || "technology";
          const searchQuery = visualStyle ? `${kw} ${visualStyle}` : kw;
          mediaList = await media.searchImages(searchQuery);
        }
      }

      // Generate TTS Voiceover audio
      const voiceKey = project.config.voice === 'custom' && project.config.customVoiceId 
        ? project.config.customVoiceId 
        : (project.config.voice || 'rachel');
      const voiceoverText = scene.voiceoverTts || scene.voiceover;
      const ttsResult = await tts.generateTTS(voiceoverText, projectId, sceneId, voiceKey);

      const absoluteAudioPath = path.join(__dirname, 'public', ttsResult.url);
      const subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, ttsResult.duration);

      scenes.push({
        id: sceneId,
        sceneIndex: i,
        duration: ttsResult.duration || scene.duration || 6.0,
        layoutFamily: scene.layoutFamily || null,
        visualLayout: scene.visualLayout || null,
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
        selectedMediaIndex: 0,
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

// Boot server
const server = app.listen(PORT, () => {
  console.log(`Express Backend Server is running on port ${PORT}`);
});
server.timeout = 600000; // 10 phút timeout để hỗ trợ các tác vụ AI và render video nặng

