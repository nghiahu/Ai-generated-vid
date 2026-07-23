# Studio AI Gen Performance & Rate Limit Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Accelerate scene generation by parallelizing TTS and TSX code generation, and prevent Gemini API rate limits (429/503) by optimizing retry logic and adding inter-scene delays.

**Architecture:** Parallelize `tts.generateTTS` and `generateTSXCodeForScene` using `Promise.all` in `generateSingleSceneCode`. Reduce fallback models and retry counts in `generateContentWithFallback`. Insert a 2.5-second inter-scene delay in `StudioAIGen.jsx` sequential generation loop.

**Tech Stack:** Node.js, Express, GoogleGenerativeAI (Gemini API), React (Frontend).

---

### Task 71: Parallelize TTS & TSX Code Gen, Optimize Gemini Retries (`aiGen.js`)

**Files:**
- Modify: `backend/services/aiGen.js:166-205,706-760`

**Step 1: Update `generateContentWithFallback` retry configuration**

Set `maxRetries = 1` and backoff delay to `2000 * attempt` ms to avoid rate limit spamming:
```javascript
async function generateContentWithFallback(genAI, options, promptData, fallbackModels = []) {
  const modelsToTry = [options.model, ...fallbackModels.slice(0, 1)]; // Limit to 1 fallback model max
  let lastError = new Error("No models tried");

  for (const modelName of modelsToTry) {
    let attempt = 0;
    const maxRetries = 1; // 1 retry per model

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: options.generationConfig
    });

    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [ ...(promptData.imageParts || []), { text: promptData.userPrompt } ] }],
          systemInstruction: promptData.systemInstruction
        });

        if (result && result.response) {
          return result;
        }
        throw new Error("Empty response from API");
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt <= maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }
      }
    }
  }

  throw lastError;
}
```

**Step 2: Parallelize TTS & TSX Code Generation in `generateSingleSceneCode`**

```javascript
async function generateSingleSceneCode({ scene, index, theme, bgImage, refImages, voiceKey, projectId, genAI, modelName }) {
  scene.sceneIndex = index;
  scene.visualPattern = normalizeVisualPattern(scene.visualPattern);

  const wordCount = (scene.voiceover || "").trim().split(/\s+/).length;
  const durationSec = Math.max(4.0, wordCount / 2.7);
  const durationFrames = Math.round(durationSec * 30);
  scene.durationFrames = durationFrames;

  // Execute TTS generation AND Gemini TSX code generation in PARALLEL
  const ttsPromise = (async () => {
    if (!scene.voiceover) return null;
    try {
      const optVoiceover = await phoneme.optimizeTextForPhonemes(scene.voiceover, projectId);
      return await tts.generateTTS(optVoiceover, projectId || "aigen_proj", `scene_${index}_${Date.now()}`, `omnivoice_${voiceKey}`);
    } catch (ttsErr) {
      console.warn(`[Studio AI Gen] TTS warning for scene ${index}:`, ttsErr.message);
      return null;
    }
  })();

  const tsxPromise = generateTSXCodeForScene(genAI, modelName, scene, theme, bgImage, refImages);

  const [ttsResult, tsxResult] = await Promise.allSettled([ttsPromise, tsxPromise]);

  // Process TTS & Alignment results
  let audioUrl = "";
  let audioDuration = durationSec;
  let subtitlesJson = null;

  if (ttsResult.status === "fulfilled" && ttsResult.value) {
    const res = ttsResult.value;
    audioUrl = res.url;
    if (res.duration > 0) {
      audioDuration = res.duration;
      scene.durationFrames = Math.max(durationFrames, Math.round((audioDuration + 0.5) * 30));
    }
    try {
      const absoluteAudioPath = path.join(__dirname, "../public", audioUrl);
      subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, audioDuration);
      scene.subtitlesJson = subtitlesJson;
    } catch (alignErr) {
      console.warn(`[Studio AI Gen] Lỗi căn lề phụ đề cho scene ${index}:`, alignErr.message);
    }
  }

  // Process TSX Code result
  let tsxCode = "";
  let compiledJS = "";

  if (tsxResult.status === "fulfilled" && tsxResult.value) {
    tsxCode = tsxResult.value;
    try {
      compiledJS = compileTSX(tsxCode);
    } catch (codeErr) {
      console.warn(`[Studio AI Gen] Lỗi biên dịch đầu tiên cho scene ${index}:`, codeErr.message);
      // Fallback simple component if compile fails
      tsxCode = `import React from "react";
import { useCurrentFrame } from "remotion";
export const GeneratedScene: React.FC<{ fps?: number }> = () => {
  return (
    <div style={{ width: 1080, height: 1920, background: "#030712", color: "#fff", display: "grid", placeItems: "center", fontSize: 40, fontFamily: "sans-serif" }}>
      <div>${scene.heading || "Phân cảnh"}</div>
    </div>
  );
};
export default GeneratedScene;`;
      compiledJS = compileTSX(tsxCode);
    }
  } else {
    const errorMsg = tsxResult.reason?.message || "Unknown error generating TSX code";
    console.error(`[Studio AI Gen] Lỗi gọi API tạo TSX cho scene ${index}:`, errorMsg);
    throw new Error(`Lỗi gọi API Gemini (Scene ${index}): ${errorMsg}`);
  }

  return {
    sceneIndex: index,
    visualPattern: scene.visualPattern,
    heading: scene.heading,
    voiceover: scene.voiceover,
    tsxCode,
    compiledJS,
    audioUrl,
    durationFrames: scene.durationFrames,
    subtitlesJson
  };
}
```

**Step 3: Commit**

```bash
git add backend/services/aiGen.js
git commit -m "perf: parallelize TTS and TSX generation, optimize Gemini retries"
```

---

### Task 72: Add Inter-Scene Pacing Delay (`StudioAIGen.jsx`)

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:480-530`

**Step 1: Add 2.5s delay between sequential scene generation requests**

```javascript
      for (let i = 0; i < currentScenes.length; i++) {
        const scenePlan = currentScenes[i];
        const percent = Math.round((i / currentScenes.length) * 100);
        setStatusText(`✨ AI đang tạo phân cảnh ${i + 1}/${currentScenes.length} (${percent}%)...`);

        const sceneRes = await api.generateStudioAiGenScene(
          activeProjId,
          scenePlan,
          voice,
          theme,
          bgImage,
          refImages
        );

        if (sceneRes && sceneRes.scene) {
          currentScenes[i] = sceneRes.scene;
          setRawScenes([...currentScenes]);
          localStorage.setItem("studio_aigen_raw_scenes", JSON.stringify(currentScenes));
          localStorage.setItem("studio_aigen_script", script);
          localStorage.setItem("studio_aigen_theme", theme);
          localStorage.setItem("studio_aigen_bg", bgImage);
          localStorage.setItem("studio_aigen_ref_images", JSON.stringify(refImages));
        } else {
          throw new Error(`Lỗi nhận dữ liệu tại phân cảnh ${i + 1}.`);
        }

        // Pacing delay between scenes to protect Gemini API rate limits
        if (i < currentScenes.length - 1) {
          await new Promise((r) => setTimeout(r, 2500));
        }
      }
```

**Step 2: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: add 2.5s inter-scene pacing delay in generation loop"
```
