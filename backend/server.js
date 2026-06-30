const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./services/db');
const ai = require('./services/ai');
const tts = require('./services/tts');
const media = require('./services/media');
const render = require('./services/render');
const cloudinary = require('cloudinary').v2;

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

// Serve static assets (voiceover audio, downloads, etc.)
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
    const projects = await db.getProjects();
    // Return thin project list for dashboard
    const list = projects.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      createdAt: p.createdAt
    }));
    res.json(list);
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
    res.json(project);
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
    const updatedProject = await db.updateProjectConfig(req.params.id, req.body);
    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
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

    // If voiceover text or voice configuration has changed, regenerate TTS
    if (sceneData.voiceover && sceneData.voiceover !== oldScene.voiceover) {
      const voiceKey = project.config.voice || 'rachel';
      voiceoverAudioUrl = await tts.generateTTS(sceneData.voiceover, projectId, sceneId, voiceKey);
    }

    const updatedScene = await db.updateScene(projectId, sceneId, {
      ...sceneData,
      voiceoverAudioUrl
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

    const { scriptText } = req.body;
    if (!scriptText) {
      return res.status(400).json({ error: 'Script text is required' });
    }

    // Step 1: Call Gemini to parse and split script text
    const rawScenes = await ai.generateStoryboard(scriptText);

    // Step 2: For each scene, fetch images and generate voiceover TTS
    const scenes = [];
    for (let i = 0; i < rawScenes.length; i++) {
      const scene = rawScenes[i];
      const sceneId = `scene_${projectId}_${i}_${Math.random().toString(36).substr(2, 4)}`;
      
      // Get images from Unsplash
      const mediaList = await media.searchImages(scene.keywords);

      // Generate TTS Voiceover audio
      const voiceKey = project.config.voice === 'custom' && project.config.customVoiceId 
        ? project.config.customVoiceId 
        : (project.config.voice || 'rachel');
      const voiceoverAudioUrl = await tts.generateTTS(scene.voiceover, projectId, sceneId, voiceKey);

      scenes.push({
        id: sceneId,
        sceneIndex: i,
        duration: scene.duration || 6.0,
        layoutFamily: scene.layoutFamily,
        visualLayout: scene.visualLayout,
        heading: scene.heading,
        points: scene.points,
        voiceover: scene.voiceover,
        voiceoverAudioUrl,
        placement: scene.placement,
        mediaList,
        selectedMediaIndex: 0,
        theme: scene.theme || "default",
        accentColor: scene.accentColor || "#FFB7C5"
      });
    }

    // Save scenes to project in DB
    await db.updateProjectScenes(projectId, scenes);

    res.json({ scenes });
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
app.listen(PORT, () => {
  console.log(`Express Backend Server is running on port ${PORT}`);
});
