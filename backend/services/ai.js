const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const vde = require("./vde");
const phoneme = require("./phoneme");

// Define Phase 1 Schema: Scene Planner
const PLANNER_SCHEMA = {
  type: SchemaType.ARRAY,
  description: "List of planned scenes with headings, voiceovers, and intents",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      sceneIndex: {
        type: SchemaType.INTEGER,
        description: "Zero-based index of the scene"
      },
      sceneIntent: {
        type: SchemaType.OBJECT,
        description: "The visual intent and context descriptors",
        properties: {
          type: {
            type: SchemaType.STRING,
            description: "Must be one of: 'opening', 'comparison', 'metric', 'list', 'quote', 'timeline', 'media', 'ending'"
          },
          importance: {
            type: SchemaType.STRING,
            description: "Must be one of: 'high', 'medium', 'low'"
          },
          density: {
            type: SchemaType.STRING,
            description: "Must be one of: 'dense', 'medium', 'sparse'"
          },
          emotion: {
            type: SchemaType.STRING,
            description: "Must be one of: 'exciting', 'serious', 'informative', 'neutral'"
          }
        },
        required: ["type", "importance", "density", "emotion"]
      },
      visualIntent: {
        type: SchemaType.STRING,
        description: "Must be one of: 'opening_hook', 'comparison_table', 'terminal_demo', 'metric_dashboard', 'timeline', 'quote', 'media', 'architecture', 'workflow', 'before_after', 'code_walkthrough', 'list', 'feature_grid', 'process', 'warning', 'cta'"
      },
      heading: {
        type: SchemaType.STRING,
        description: "A short, engaging heading for the scene in Vietnamese"
      },
      voiceover: {
        type: SchemaType.STRING,
        description: "Vietnamese speech text read aloud. Technical English terms (html, css, react, api) must remain lowercase English, EXCEPT for acronyms that conflict with Vietnamese stop-words (like 'AI', 'BA', 'AN') which must be UPPERCASE."
      }
    },
    required: ["sceneIndex", "sceneIntent", "visualIntent", "heading", "voiceover"]
  }
};

// Define Phase 2 Schema: Storyboard UI Renderer
const GENERATOR_SCHEMA = {
  type: SchemaType.ARRAY,
  description: "List of detailed layouts rendering the points and keywords for each scene",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      sceneIndex: {
        type: SchemaType.INTEGER,
        description: "Zero-based index of the scene"
      },
      keywords: {
        type: SchemaType.ARRAY,
        description: "Exactly 3 concrete English visual nouns representing the scene context (e.g. ['react developer', 'server rack'])",
        items: { type: SchemaType.STRING }
      },
      points: {
        type: SchemaType.ARRAY,
        description: "List of visual points rendered on the slide",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              description: "Must be one of: 'card', 'terminal', 'metric', 'logo_row', 'badge_row', 'button', 'subheader'"
            },
            text: {
              type: SchemaType.STRING,
              description: "Short label for this point in Vietnamese. MAXIMUM 80 characters. E.g. 'RAG = 3 bước'."
            },
            logos: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Optional array of logo strings, e.g. ['claude', 'react'] (only for logo_row type)"
            },
            badges: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Optional array of badge text strings (only for badge_row type)"
            },
            value: {
              type: SchemaType.STRING,
              description: "SHORT metric value string (only for metric type). MAXIMUM 20 characters. E.g.: '+85%', '2.5x'."
            },
            subtext: {
              type: SchemaType.STRING,
              description: "SHORT metric subtext (only for metric type). MAXIMUM 40 characters. E.g.: 'tăng tốc'."
            }
          },
          required: ["type"]
        }
      }
    },
    required: ["sceneIndex", "keywords", "points"]
  }
};

// Backward-compatible export
const STORYBOARD_SCHEMA = GENERATOR_SCHEMA;

function countVietnameseWords(text) {
  if (!text) return 0;
  const cleaned = text.trim().replace(/[\s\n\r]+/g, " ");
  return cleaned.split(" ").filter(w => w.length > 0).length;
}

// -------------------------------------------------------------
// Phase 1: Scene Planner
// -------------------------------------------------------------
async function generateScenePlan(genAI, modelName, scriptText, targetLength) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PLANNER_SCHEMA,
      maxOutputTokens: 4096,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const systemInstruction = `
# ROLE
You are a Scene Planner for video production.

# MISSION
Convert a raw script into a structured list of chronological scenes (scene plan).

# HARD CONSTRAINTS
1. Output MUST be a valid JSON array matching the provided Schema.
2. Do not write markdown formatting, code blocks, or preamble. Just return raw JSON.
3. Every scene's voiceover must consist of complete sentences. Do not split a single sentence across scenes.
4. Keep all technical and English terms in "voiceover" in their original lowercase English form (e.g. "html", "css", "react", "node.js"). EXCEPT for acronyms and terms that conflict with common Vietnamese words (like "AI", "BA", "AN"), which MUST be written in ALL CAPS (uppercase) to distinguish them from Vietnamese words.
5. Never use mathematical symbols (like ">", "<", "=") or long dashes ("—", "--") in the "voiceover" field. Instead, write them out in natural words (e.g., "lớn hơn", "nhỏ hơn", "bằng") or use standard punctuation (like commas ",", colons ":", or periods ".") to ensure the TTS reads it smoothly without dropping words.

# SCENE FLOW STRUCTURE (Decision Tree)
Structure the sequence of scenes logically to build a story:
- Scene 1: Opening (Hook the viewer)
- Scene 2..N-1: Problem -> Explanation -> Example -> Takeaway (Core value)
- Scene N: Ending (Call to action / Outro)

# VISUAL INTENT TYPES
For each scene, choose the most appropriate \`visualIntent\` based on the semantic content:
- \`opening_hook\`: Introduce the topic with a clean visual.
- \`comparison_table\`: Compare two technologies, methods, or pros/cons.
- \`terminal_demo\`: Display code command executions or shell usage.
- \`metric_dashboard\`: Display key statistics or metrics.
- \`timeline\`: Show step-by-step progress, timeline milestones, or sequential steps.
- \`quote\`: Highlight a testimonial, warning, or expert quote.
- \`media\`: Display an image/video showcase.
- \`architecture\`: Display code structure, backend architecture, or API flows.
- \`workflow\`: Display step-by-step connection flow diagrams.
- \`before_after\`: Contrast a problem status with its resolved solution.
- \`code_walkthrough\`: Showcase a block of source code or instructions.
- \`list\`: Show a bullet-point list of details.
- \`feature_grid\`: Show a grid of core features.
- \`process\`: Display execution logs or procedural steps.
- \`warning\`: Show error logs, pitfalls, or warnings.
- \`cta\`: Call to action / outro.
  `;

  const userPrompt = `
Script: "${scriptText}"
Target Length: "${targetLength}"

CRITICAL TARGET LENGTH GUIDELINES:
- "Short (~60s)": Keep the storyboard concise. Limit to 4-6 scenes. Total voiceover words should be around 130-150 words.
- "Medium (~120s)": Allow more elaboration. Limit to 9-11 scenes. Total voiceover words should be around 280-320 words.
- "Long (~180s)": Provide detailed explanation. Limit to 14-16 scenes. Total voiceover words should be around 420-480 words.

If the script is too long, condense and summarize the voiceover text in each scene. Do not exceed the word limit.
  `;

  console.log(`[Gemini API] Phase 1 Scene Planner starting with model: ${modelName}`);
  
  let result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemInstruction
  });

  const text = result.response.text().trim();
  console.log("Phase 1 Raw Response:", text);
  return JSON.parse(repairTruncatedJson(text));
}

// -------------------------------------------------------------
// Phase 2: Storyboard UI Renderer
// -------------------------------------------------------------
async function generateDetailedStoryboard(genAI, modelName, scenePlan, stylePack) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: GENERATOR_SCHEMA,
      maxOutputTokens: 8192,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  });

  const systemInstruction = `
# ROLE
You are a Storyboard UI Renderer.

# MISSION
Convert planned scenes into a detailed UI Storyboard by rendering point components and keywords matching the requested style tokens.

# HARD CONSTRAINTS
1. Output MUST be a valid JSON array matching the provided Schema.
2. Focus ONLY on generating points (their types, texts, values, badges, and logos) and unsplash search keywords.
3. Every point "text" must be a short, unique label (max 80 chars). No paragraph text in point values.
4. Do not generate layout placement, theme, accentColor, delays, or durations (these are injected by the backend).

# VISUAL INTENT TO COMPONENTS DECISION TREE
IF visualIntent == "terminal_demo"
    points = [{"type": "terminal", "text": "terminal command line (e.g. npm run dev)"}]
ELSE IF visualIntent == "comparison_table"
    points = [{"type": "card", "text": "option A detail"}, {"type": "card", "text": "option B detail"}]
ELSE IF visualIntent == "metric_dashboard"
    points = [{"type": "metric", "value": "+85%", "subtext": "tăng tốc"}]
ELSE IF visualIntent == "opening_hook" OR "quote"
    points = [{"type": "card", "text": "key hook phrase or quote"}]
ELSE IF visualIntent == "list" OR "feature_grid" OR "workflow" OR "architecture"
    points = [2-4 card objects with type "card"]
ELSE IF visualIntent == "code_walkthrough"
    points = [{"type": "terminal", "text": "code snippet"}, {"type": "subheader", "text": "explanation title"}]
ELSE IF visualIntent == "warning"
    points = [{"type": "badge_row", "badges": ["Cảnh báo"]}, {"type": "card", "text": "warning description"}]
ELSE IF visualIntent == "cta"
    points = [{"type": "button", "text": "CTA Button Label"}]
ELSE
    points = [{"type": "card", "text": "default text content"}]

# UNSPLASH KEYWORDS RULE
For Unsplash search keywords, choose 3 concrete visual nouns instead of generic concepts:
- Good nouns: ["react developer", "server rack", "financial chart", "startup office"]
- Bad concepts: ["technology", "coding", "software", "computer"]

# SELF CHECK
Before returning the JSON, silently verify:
✓ No placeholder texts.
✓ points array contains valid components for the specified visualIntent.
✓ keywords contains exactly 3 concrete English nouns.
  `;

  const userPrompt = `
Scene Plan:
${JSON.stringify(scenePlan, null, 2)}

Style Pack:
${JSON.stringify(stylePack, null, 2)}
  `;

  console.log(`[Gemini API] Phase 2 Storyboard Generator starting with model: ${modelName}`);

  let result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: systemInstruction
  });

  const text = result.response.text().trim();
  console.log("Phase 2 Raw Response:", text);
  return JSON.parse(repairTruncatedJson(text));
}

// -------------------------------------------------------------
// Orchestration & Fallback handling
// -------------------------------------------------------------
async function generateStoryboard(scriptText, visualStyle = "minimal", traits = [], targetLength = "Short (~60s)") {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong tệp .env. Vui lòng kiểm tra lại cấu hình Backend.");
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  // Fallback deprecated 2.5 models to gemini-3.5-flash
  if (modelName.includes("2.5") || modelName.includes("2.0") || modelName.includes("1.5")) {
    console.warn(`[Gemini API] Model "${modelName}" đã bị Google khai tử hoặc không hỗ trợ. Tự động chuyển về "gemini-3.5-flash" để chạy ổn định.`);
    modelName = "gemini-3.5-flash";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // --- Step 1: Run Phase 1 (Scene Planner) ---
    let scenePlan;
    try {
      scenePlan = await generateScenePlan(genAI, modelName, scriptText, targetLength);
    } catch (err) {
      console.error("[Gemini API] Phase 1 failed, attempting fallback to gemini-3.5-flash:", err.message);
      modelName = "gemini-3.5-flash";
      scenePlan = await generateScenePlan(genAI, modelName, scriptText, targetLength);
    }

    if (!Array.isArray(scenePlan)) {
      throw new Error("Dữ liệu Scene Plan không phải là một mảng JSON.");
    }

    // --- Step 2: Backend Normalizer (Calculate Durations) ---
    scenePlan.forEach((scene, index) => {
      // Ensure index matches sequential positions
      scene.sceneIndex = index;
      
      // Calculate duration: words / 2.7, with min 4.0s
      const wordCount = countVietnameseWords(scene.voiceover);
      const calculatedDuration = wordCount / 2.7;
      scene.duration = Number(Math.max(4.0, calculatedDuration).toFixed(1));
    });

    // --- Step 3: Load Design Tokens & Build Style Pack ---
    const styleData = vde.getStyle(visualStyle, traits);
    const stylePack = {
      styleId: styleData.styleId || visualStyle,
      theme: styleData.tokens?.colors?.background ? visualStyle : "default",
      accentColor: styleData.tokens?.colors?.accent || "#3b82f6",
      motion: styleData.motion || { energy: "low", style: ["fade-in", "slide-up"] }
    };

    // --- Step 4: Run Phase 2 (Storyboard UI Renderer) ---
    let uiResults;
    try {
      uiResults = await generateDetailedStoryboard(genAI, modelName, scenePlan, stylePack);
    } catch (err) {
      console.error("[Gemini API] Phase 2 failed, attempting fallback to gemini-3.5-flash:", err.message);
      modelName = "gemini-3.5-flash";
      uiResults = await generateDetailedStoryboard(genAI, modelName, scenePlan, stylePack);
    }

    if (!Array.isArray(uiResults)) {
      throw new Error("Dữ liệu UI Storyboard không phải là một mảng JSON.");
    }

    // Map UI results into a lookup for fast merging
    const uiLookup = {};
    uiResults.forEach(res => {
      uiLookup[res.sceneIndex] = res;
    });

    // --- Step 5: Backend Auto-Fix & Enricher ---
    const finalScenes = scenePlan.map((scene, index) => {
      const uiData = uiLookup[index] || { points: [], keywords: ["technology"] };
      const points = Array.isArray(uiData.points) ? uiData.points : [];

      // 1. Calculate Delays dynamically
      const usable = scene.duration - 1.0;
      const step = points.length > 0 ? usable / points.length : 0;
      const enrichedPoints = points.map((pt, idx) => {
        const computedDelay = Number((0.5 + idx * step).toFixed(1));
        return {
          type: pt.type || "card",
          text: pt.text || "",
          animation: pt.animation || (stylePack.motion.style[0] || "slide-up"),
          delay: computedDelay,
          logos: Array.isArray(pt.logos) ? pt.logos : [],
          badges: Array.isArray(pt.badges) ? pt.badges : [],
          value: pt.value || "",
          subtext: pt.subtext || ""
        };
      });

      // 2. Determine Placement logically
      const splitIntents = ["comparison", "timeline", "list", "media"];
      const placement = splitIntents.includes(scene.sceneIntent?.type) ? "Split" : "Full";

      // 3. Normalize keywords (use first string, fallback if empty)
      const keywordArr = Array.isArray(uiData.keywords) ? uiData.keywords : [uiData.keywords || "technology"];
      const cleanKeywords = keywordArr.filter(k => typeof k === "string" && k.trim().length > 0);

      return {
        id: `scene_${Date.now()}_${index}`,
        sceneIndex: index,
        duration: scene.duration,
        sceneIntent: scene.sceneIntent || {
          type: "opening",
          importance: "medium",
          density: "medium",
          emotion: "neutral"
        },
        heading: scene.heading || `Phân cảnh ${index + 1}`,
        points: enrichedPoints,
        voiceover: scene.voiceover || "",
        placement: placement,
        keywords: cleanKeywords, // Store as array for server.js
        theme: stylePack.theme,
        accentColor: stylePack.accentColor
      };
    });

    // Process phoneme optimization for all scenes (same as current backend requirement)
    for (const scene of finalScenes) {
      if (scene.voiceover) {
        scene.voiceoverTts = await phoneme.optimizeTextForPhonemes(scene.voiceover);
      } else {
        scene.voiceoverTts = "";
      }
    }

    return finalScenes;

  } catch (error) {
    console.error("Error in 2-phase storyboard pipeline:", error);
    throw new Error(`Lỗi kết nối Gemini API: ${error.message}`);
  }
}

function repairTruncatedJson(jsonStr) {
  const trimmed = jsonStr.trim();
  if (trimmed.endsWith(']')) {
    return trimmed;
  }

  console.warn("[Gemini API] Phát hiện chuỗi JSON bị cắt cụt (truncated). Tiến hành sửa chữa...");

  const lastBraceIndex = Math.max(
    trimmed.lastIndexOf('\n  }'),
    trimmed.lastIndexOf('\r\n  }')
  );

  if (lastBraceIndex !== -1) {
    const hasCarriageReturn = trimmed.charAt(lastBraceIndex) === '\r';
    const offset = hasCarriageReturn ? 5 : 4;
    return trimmed.substring(0, lastBraceIndex + offset) + (hasCarriageReturn ? '\r\n]' : '\n]');
  }

  return trimmed;
}

module.exports = {
  generateStoryboard,
  STORYBOARD_SCHEMA
};
