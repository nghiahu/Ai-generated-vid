const express = require("express");
const router = express.Router();
const aiGen = require("../services/aiGen");
const db = require("../services/db");

// Store temporary validation responses in memory index keyed by validationId
const pendingValidations = new Map();

// POST /api/studio-ai-gen/generate
router.post("/generate", async (req, res) => {
  try {
    const { script, targetLength = "Short (~60s)", theme = "ai_hub_grid", voiceKey = "duythanh", bgImage = "", refImages = [], projectId } = req.body;

    if (!script || typeof script !== "string" || script.trim().length === 0) {
      return res.status(400).json({ error: "Kịch bản (script) không được để trống." });
    }

    console.log(`[Studio AI Gen Route] Nhận yêu cầu tạo video cho kịch bản length=${targetLength}, theme=${theme}, hasBgImage=${Boolean(bgImage)}, refImagesCount=${refImages.length}, projectId=${projectId}`);

    const scenes = await aiGen.generateAIGenStoryboard({
      script: script.trim(),
      targetLength,
      theme,
      voiceKey,
      bgImage,
      refImages,
      projectId
    });

    // Generate a new project ID if not provided
    const finalProjectId = projectId || `proj_aigen_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare database project configuration object
    const config = {
      script: script.trim(),
      targetLength,
      theme,
      voiceKey,
      bgImage,
      refImages,
      scenes
    };

    // Save project details inside database projects table
    const projectTitle = `AI Gen - ${script.trim().substring(0, 30)}...`;
    await db.saveAIGenProject(finalProjectId, projectTitle, config);

    res.json({
      success: true,
      count: scenes.length,
      projectId: finalProjectId,
      scenes
    });
  } catch (error) {
    console.error("[Studio AI Gen Route Error]:", error);
    res.status(500).json({
      error: `Lỗi sinh video Studio AI Gen: ${error.message}`
    });
  }
});

// POST /api/studio-ai-gen/plan
router.post("/plan", async (req, res) => {
  try {
    const { script, targetLength = "Short (~60s)", theme = "ai_hub_grid", voiceKey = "duythanh", bgImage = "", refImages = [], projectId } = req.body;

    if (!script || typeof script !== "string" || script.trim().length === 0) {
      return res.status(400).json({ error: "Kịch bản (script) không được để trống." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong backend .env");
    }

    let modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    if (modelName === "gemini-3.5-flash" || modelName === "gemini-2.0-flash") {
      modelName = "gemini-3.6-flash";
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log(`[Studio AI Gen Route] Tạo Scene Plan cho kịch bản length=${targetLength}`);
    const scenePlan = await aiGen.generateScenePlanForAIGen(genAI, modelName, script.trim(), targetLength);

    const finalProjectId = projectId || `proj_aigen_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare initial draft project config (with scenes having no TSX code/audio yet)
    const config = {
      script: script.trim(),
      targetLength,
      theme,
      voiceKey,
      bgImage,
      refImages,
      scenes: scenePlan.map((s, idx) => {
        const wordCount = (s.voiceover || "").trim().split(/\s+/).length;
        const estSec = Math.max(3.5, wordCount / 2.7);
        const estFrames = Math.round(estSec * 30);
        return {
          sceneIndex: idx,
          visualPattern: s.visualPattern,
          heading: s.heading,
          voiceover: s.voiceover,
          tsxCode: "",
          compiledJS: "",
          audioUrl: "",
          durationFrames: estFrames,
          duration: estSec.toFixed(2),
          subtitlesJson: null
        };
      })
    };

    const projectTitle = `AI Gen - ${script.trim().substring(0, 30)}...`;
    await db.saveAIGenProject(finalProjectId, projectTitle, config, "PLANNING");

    res.json({
      success: true,
      projectId: finalProjectId,
      scenes: config.scenes
    });
  } catch (error) {
    console.error("[Studio AI Gen Route /plan Error]:", error);
    res.status(500).json({
      error: `Lỗi lập kế hoạch Studio AI Gen: ${error.message}`
    });
  }
});

// POST /api/studio-ai-gen/generate-scene
router.post("/generate-scene", async (req, res) => {
  try {
    const { projectId, scene, script = "", voiceKey = "duythanh", theme = "ai_hub_grid", bgImage = "", refImages = [] } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Missing projectId." });
    }
    if (!scene) {
      return res.status(400).json({ error: "Missing scene data." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY chưa được cấu hình trong backend .env");
    }

    let modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
    if (modelName === "gemini-3.5-flash" || modelName === "gemini-2.0-flash") {
      modelName = "gemini-3.6-flash";
    }

    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log(`[Studio AI Gen Route] Sinh code cho Scene ${scene.sceneIndex} (${scene.visualPattern}) của project ${projectId}`);
    
    const generatedScene = await aiGen.generateSingleSceneCode({
      scene,
      index: scene.sceneIndex,
      script,
      theme,
      bgImage,
      refImages,
      voiceKey,
      projectId,
      genAI,
      modelName
    });

    // Update project scenes array in database
    const project = await db.getProjectById(projectId);
    if (project && project.config) {
      const scenes = project.config.scenes || [];
      const idx = scenes.findIndex(s => s.sceneIndex === scene.sceneIndex);
      if (idx !== -1) {
        scenes[idx] = generatedScene;
      } else {
        scenes.push(generatedScene);
      }
      project.config.scenes = scenes.sort((a, b) => a.sceneIndex - b.sceneIndex);
      await db.saveAIGenProject(projectId, project.title, project.config);
    }

    res.json({
      success: true,
      scene: generatedScene
    });
  } catch (error) {
    console.error(`[Studio AI Gen Route /generate-scene Error]:`, error);
    res.status(500).json({
      error: `Lỗi tạo code phân cảnh: ${error.message}`
    });
  }
});

// POST /api/studio-ai-gen/save-config
router.post("/save-config", async (req, res) => {
  try {
    const { projectId, title, config } = req.body;
    if (!projectId) return res.status(400).json({ error: "Missing projectId" });
    await db.saveAIGenProject(projectId, title || "AI Gen Video", config);
    res.json({ success: true });
  } catch (err) {
    console.error("[Studio AI Gen Route /save-config Error]:", err);
    res.status(500).json({ error: `Lỗi lưu dự án: ${err.message}` });
  }
});

// POST /api/studio-ai-gen/validate-result
router.post("/validate-result", (req, res) => {
  try {
    const { validationId, success, error, stack, visualErrors } = req.body;
    if (!validationId) return res.status(400).json({ error: "Missing validationId" });
    
    pendingValidations.set(validationId, {
      success,
      error,
      stack,
      visualErrors,
      timestamp: Date.now()
    });
    res.json({ success: true });
  } catch (err) {
    console.error("[Studio AI Gen Route /validate-result Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/studio-ai-gen/validate-status/:validationId
router.get("/validate-status/:validationId", (req, res) => {
  try {
    const val = pendingValidations.get(req.params.validationId);
    if (!val) return res.json({ status: "PENDING" });
    res.json({ status: "COMPLETE", result: val });
  } catch (err) {
    console.error("[Studio AI Gen Route /validate-status Error]:", err);
    res.status(500).json({ error: err.message });
  }
});

// Clean up pendingValidations regularly every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingValidations.entries()) {
    if (now - val.timestamp > 120000) { // 2 minutes TTL
      pendingValidations.delete(key);
    }
  }
}, 60000);

module.exports = router;
