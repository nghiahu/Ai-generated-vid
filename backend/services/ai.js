const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const vde = require("./vde");
const phoneme = require("./phoneme");
const db = require("./db");
const contractLoader = require("./contractLoader");


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
          },
          highlightWords: {
            type: SchemaType.ARRAY,
            description: "Exactly 1 or 2 key words or phrases (Vietnamese or English) from the heading of this scene that should be highlighted/accented in the visual design. E.g. ['Vendor'] or ['AI Agent', 'khai tử']. If no words should be highlighted, return an empty array.",
            items: { type: SchemaType.STRING }
          }
        },
        required: ["type", "importance", "density", "emotion", "highlightWords"]
      },
      visualIntent: {
        type: SchemaType.STRING,
        description: "Must be one of: 'opening_hook', 'comparison_table', 'terminal_demo', 'metric_dashboard', 'timeline', 'quote', 'media', 'architecture', 'workflow', 'before_after', 'code_walkthrough', 'list', 'feature_grid', 'process', 'warning', 'cta'"
      },
      layoutId: {
        type: SchemaType.STRING,
        description: "The explicit Remotion Layout ID matching scene intent. Examples: 'IntroBriefingCard', 'IntroBubbleImage', 'BeforeAfterPanel', 'RankedImpactBullet', 'SplitProofBullet', 'HeroMetricCards', 'MetricCards', 'VersusArena', 'SplitBandChecklist', 'Pullquote', 'TimelineBeamRail', 'CircularProgress', 'MetricShowcaseHook', 'MetricFocusShowcase', 'WebMockupHero', 'NumberedAgentPanel', 'Ending'."
      },
      heading: {
        type: SchemaType.STRING,
        description: "A short, engaging heading for the scene in Vietnamese"
      },
      voiceover: {
        type: SchemaType.STRING,
        description: "Full ORIGINAL script text strictly from 'Lời thoại (Gốc)' for ON-SCREEN SUBTITLE DISPLAY. DO NOT put phonetic reading words here."
      },
      voiceoverTts: {
        type: SchemaType.STRING,
        description: "Optional phonetic reading transcript strictly from 'Lời thoại (Phiên âm đọc)' for TTS SPEECH READ ALOUD. Leave empty if not provided."
      }
    },
    required: ["sceneIndex", "sceneIntent", "visualIntent", "layoutId", "heading", "voiceover"]
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
              description: "Ultra-short visual headline for this point in Vietnamese. MAXIMUM 6-8 words or 45 characters. E.g. 'RAG = 3 bước', 'Học nhiều vẫn im'."
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
      },
      category: {
        type: SchemaType.STRING,
        description: "A short Vietnamese category/label tag for this scene (max 20 chars), e.g. 'GIỚI THIỆU', 'KỸ SƯ NHÚNG', 'TRÍ TUỆ NHÂN TẠO', matching the scene content topic."
      }
    },
    required: ["sceneIndex", "keywords", "points", "category"]
  }
};

// Backward-compatible export
const STORYBOARD_SCHEMA = GENERATOR_SCHEMA;

function countVietnameseWords(text) {
  if (!text) return 0;
  const cleaned = text.trim().replace(/[\s\n\r]+/g, " ");
  return cleaned.split(" ").filter(w => w.length > 0).length;
}

// Generic helper to generate content with exponential backoff retries and model fallbacks
async function generateContentWithRetryAndFallback(genAI, options, promptData, fallbackModels = [], projectId = null) {
  const modelsToTry = [options.model, ...fallbackModels];
  let lastError = new Error("No models tried");

  for (const modelName of modelsToTry) {
    let attempt = 0;
    const maxRetries = 3;
    const initialDelay = 1500;

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: options.generationConfig
    });

    console.log(`[Gemini API] Đang thử sử dụng model: ${modelName}`);

    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: promptData.userPrompt }] }],
          systemInstruction: promptData.systemInstruction
        });
        
        if (result && result.response) {
          console.log(`[Gemini API] Thành công với model: ${modelName}`);
          if (projectId && result.response.usageMetadata) {
            const usage = result.response.usageMetadata;
            const promptTokens = usage.promptTokenCount || 0;
            const completionTokens = usage.candidatesTokenCount || 0;
            await db.accumulateTokens(projectId, promptTokens, completionTokens);
          }
          return result;
        }
        throw new Error("Phản hồi rỗng từ API");
      } catch (err) {
        lastError = err;
        attempt++;
        const status = err.status || (err.response ? err.response.status : null);
        const isTransient = status === 503 || status === 429 || 
                            err.message?.includes("503") || err.message?.includes("429") ||
                            err.message?.includes("high demand") || err.message?.includes("Service Unavailable") ||
                            err.message?.includes("overloaded") || err.message?.includes("ResourceExhausted") ||
                            err.message?.includes("fetch failed");

        const isApiKeyError = err.message?.includes("API_KEY") || status === 400;

        if (isTransient && !isApiKeyError && attempt <= maxRetries) {
          const backoff = initialDelay * Math.pow(2, attempt - 1);
          console.warn(`[Gemini API] Gặp lỗi tạm thời (${status || 'unknown'}) với model ${modelName}: ${err.message}. Thử lại lần ${attempt}/${maxRetries} sau ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
        } else {
          console.error(`[Gemini API] Thất bại với model ${modelName} (không thử lại model này): ${err.message}`);
          break; // Thử model tiếp theo
        }
      }
    }
  }

  throw lastError;
}

// -------------------------------------------------------------
// Phase 1: Scene Planner
// -------------------------------------------------------------
async function generateScenePlan(genAI, modelName, scriptText, targetLength, projectId = null) {
  const options = {
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PLANNER_SCHEMA,
      maxOutputTokens: 4096,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 0 }
    }
  };

  const systemInstruction = `
# ROLE
You are a Scene Planner for video production.

# MISSION
Convert a raw script into a structured list of chronological scenes (scene plan).

# HARD CONSTRAINTS
1. Output MUST be a valid JSON array matching the provided Schema.
2. Do not write markdown formatting, code blocks, or preamble. Just return raw JSON.
3. "voiceover" vs "voiceoverTts" SEPARATION — TWO FORMATS SUPPORTED:
   - "voiceover" MUST ALWAYS contain the original script text (first quoted text / "Lời thoại (Gốc)") for subtitle display.
   - "voiceoverTts" MUST contain the phonetic reading transcript for TTS speech, if provided. The script may use TWO formats:
     FORMAT A (table): columns "Lời thoại (Gốc)" | "Lời thoại (Phiên âm đọc)" → extract the phonetic column into "voiceoverTts".
     FORMAT B (sequential): each scene block has original text in quotes, then a "Lời thoại (Phiên âm đọc)" label, then phonetic text in quotes → extract the quoted text AFTER that label into "voiceoverTts".
   - CRITICAL: If phonetic text is present in EITHER format, you MUST populate "voiceoverTts". NEVER leave it empty when phonetic text is available.

4. Every scene's voiceover must consist of complete sentences. Do not split a single sentence across scenes.
4. Keep all technical and English terms in "voiceover" in their original lowercase English form (e.g. "html", "css", "react", "node.js"). EXCEPT for acronyms and terms that conflict with common Vietnamese words (like "AI", "BA", "AN"), which MUST be written in ALL CAPS (uppercase) to distinguish them from Vietnamese words.
5. Never use mathematical symbols (like ">", "<", "=") or long dashes ("—", "--") in the "voiceover" field. Instead, write them out in natural words (e.g., "lớn hơn", "nhỏ hơn", "bằng") or use standard punctuation (like commas ",", colons ":", or periods ".") to ensure the TTS reads it smoothly without dropping words.

# SCENE FLOW STRUCTURE (Decision Tree)
Structure the sequence of scenes logically to build a story:
- Scene 1: Opening (Hook the viewer)
- Scene 2..N-1: Problem -> Explanation -> Example -> Takeaway (Core value)
- Scene N: Ending (Call to action / Outro)

# LAYOUT DIVERSITY & SELECTION RULES (CRITICAL)
1. MANDATORY VARIETY: You MUST NEVER use the exact same layoutId for consecutive scenes. Vary visual layouts across scenes to keep the video dynamic.
2. Choose layoutId strictly according to scene content semantics:
- **Comparison / Versus / Distinguish** (heading/voiceover contains "không phải là", "so sánh", "khác biệt", "vs", "versus", "so với"): MUST select BeforeAfterPanel, SplitProofBullet, VersusArena, or SplitBandChecklist.
- **Metrics / Statistics / Numbers** (heading/voiceover contains "%", "tỷ đô", "con số", "tăng", "giảm", "doanh thu", "triệu"): MUST select HeroMetricCards, MetricCards, GridMetrics, CircularProgress, MetricShowcaseHook, MetricFocusShowcase, or OpsMonitorHook.
- **Timeline / Milestones / Steps** (heading/voiceover contains "bước 1", "quy trình", "thời gian", "lộ trình"): MUST select TimelineBeamRail, IntroSignalStepsImages, or FlowchartTitle.
- **Lists / Bullet Points / Items**: MUST select RankedImpactBullet, AIHubGrid1, SelectorWheelRadio, or SignalRailBullet.
- **Radar / Monitoring / Scanning**: MUST select IntroRadarSignalImage or IntroMapPinsImage.
- **Intro Hooks / Headlines (Scene 1)**: You MUST dynamically select and distribute your layout choices across different generations. Do not default to 'IntroBriefingCard' for every project. Choose based on the script's specific hook content:
  - 'MetricShowcaseHook': Use when the hook begins with key metrics, statistics, salary ranges (e.g. "lương 15 đến 20 triệu"), repository stars, or numbers, and showcases them in a dashboard metric counter.
  - 'MetricFocusShowcase': Use when showcasing a specific technical/security metric (like "42 lăng kính ngôn ngữ", CVE mappings, code metrics) with side-by-side details, list of tools, and progress cards.
  - 'WebMockupHero': Use when presenting a website, github repository, SaaS platform, online tool, or visual software preview in a macOS browser mockup.
  - 'IntroBriefingCard': Use for general introductory statements or textual context briefings.
  - 'IntroBubbleImage': Use when the hook refers to a key focal object, icon, or person.
  - 'IntroCutoutHeadlineImage': Use for a punchy, headline-driven opening with an offset cutout image.
  - 'AppCardConcept': Use when introducing software, tech tools, mobile/desktop mockups, or platforms.
  - 'IntroFullImage': Use for high-impact visual hooks requiring a full-screen background image.
- **Ending / CTA**: Select Ending, NextStepEnding, BrandOutro, or ContactCardEnding.
- **Numbered Steps / Agent Panels**: Use 'NumberedAgentPanel' when listing 2-4 sequential steps, AI agents, roles, or phases that each perform a specific named action (e.g. listing reviewers, pipeline stages, sequential checklist steps).
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

  const promptData = { systemInstruction, userPrompt };
  const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash"].filter(m => m !== modelName);

  console.log(`[Gemini API] Phase 1 Scene Planner starting with model: ${modelName}`);
  
  const result = await generateContentWithRetryAndFallback(genAI, options, promptData, fallbacks, projectId);
  const text = result.response.text().trim();
  console.log("Phase 1 Raw Response:", text);
  return JSON.parse(repairTruncatedJson(text));
}

// -------------------------------------------------------------
// Phase 2: Storyboard UI Renderer
// -------------------------------------------------------------
async function generateDetailedStoryboard(genAI, modelName, scenePlan, stylePack, projectId = null) {
  const options = {
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: GENERATOR_SCHEMA,
      maxOutputTokens: 8192,
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 0 }
    }
  };

  const sceneContracts = scenePlan.map(scene => {
    const contract = contractLoader.getContractForLayout(scene.layoutId, scene.sceneIntent?.type);
    return {
      sceneIndex: scene.sceneIndex,
      layoutId: scene.layoutId || contract.layoutId,
      contractConstraints: {
        headingMaxChars: contract.headingMaxChars,
        pointsCount: contract.pointsCount,
        pointMaxChars: contract.pointMaxChars,
        allowedPointTypes: contract.allowedPointTypes,
        aiHint: contract.aiHint
      }
    };
  });

  const systemInstruction = `
# ROLE
You are a Storyboard UI Renderer.

# MISSION
Convert planned scenes into a detailed UI Storyboard by rendering point components and keywords matching the requested style tokens and explicit Layout Contracts.

# HARD CONSTRAINTS
1. Output MUST be a valid JSON array matching the provided Schema.
2. Focus ONLY on generating points (their types, texts, values, badges, and logos), unsplash search keywords, and a dynamic category tag.
3. Every point "text" MUST be a non-empty, ultra-concise visual headline (MAXIMUM 6-8 words / 45 characters). Never write full long sentences, narrative paragraphs, or wordy explanations.
   - ❌ BAD: "Học nhiều nhưng trong quá trình làm việc thực tế vẫn giữ thái độ im lặng không chịu giao tiếp"
   - ✅ GOOD: "Học nhiều vẫn im"
4. The number of items in the "points" array MUST be strictly between contractConstraints.pointsCount.min and contractConstraints.pointsCount.max. If default is specified, aim for that exact count.
5. Do not generate layout placement, theme, accentColor, delays, or durations (these are injected by the backend).
6. Every scene must have a short, relevant Vietnamese category/label tag in the "category" field representing the context (max 20 chars), e.g. "LẬP TRÌNH NHÚNG" for programming, "SO SÁNH" for comparison, "KẾT LUẬN" for ending, or "GIỚI THIỆU" for hooks. Match the scene context topic. Never use placeholders.

# UNSPLASH KEYWORDS RULE
For Unsplash search keywords, choose 3 concrete visual nouns instead of generic concepts:
- Good nouns: ["react developer", "server rack", "financial chart", "startup office"]
- Bad concepts: ["technology", "coding", "software", "computer"]

# SELF CHECK
Before returning the JSON, silently verify:
✓ Point text is ultra-concise (max 6-8 words / 45 chars) and acts as a visual headline.
✓ No empty point text ("") or placeholder texts.
✓ points array count strictly obeys the min/max range in contractConstraints.pointsCount.
✓ point text lengths strictly <= contractConstraints.pointMaxChars.
✓ keywords contains exactly 3 concrete English nouns.
✓ category field contains a short, dynamic Vietnamese label tag representing the scene's topic.
  `;

  const userPrompt = `
Scene Plan:
${JSON.stringify(scenePlan, null, 2)}

Style Pack:
${JSON.stringify(stylePack, null, 2)}

Scene Layout Contracts & Constraints:
${JSON.stringify(sceneContracts, null, 2)}

CRITICAL: You MUST strictly generate points with non-empty text that comply with pointsCount (min, max, default) and pointMaxChars in each scene's Layout Contract!
  `;

  const promptData = { systemInstruction, userPrompt };
  const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash"].filter(m => m !== modelName);

  console.log(`[Gemini API] Phase 2 Storyboard Generator starting with model: ${modelName}`);

  const result = await generateContentWithRetryAndFallback(genAI, options, promptData, fallbacks, projectId);
  const text = result.response.text().trim();
  console.log("Phase 2 Raw Response:", text);
  return JSON.parse(repairTruncatedJson(text));
}

// -------------------------------------------------------------
// Orchestration & Fallback handling
// -------------------------------------------------------------
async function generateStoryboard(projectId, scriptText, visualStyle = "rikkei", traits = [], targetLength = "Short (~60s)") {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong tệp .env. Vui lòng kiểm tra lại cấu hình Backend.");
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    // --- Step 1: Run Phase 1 (Scene Planner) ---
    const scenePlan = await generateScenePlan(genAI, modelName, scriptText, targetLength, projectId);

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
    const uiResults = await generateDetailedStoryboard(genAI, modelName, scenePlan, stylePack, projectId);

    if (!Array.isArray(uiResults)) {
      throw new Error("Dữ liệu UI Storyboard không phải là một mảng JSON.");
    }

    // Map UI results into a lookup for fast merging
    const uiLookup = {};
    uiResults.forEach(res => {
      uiLookup[res.sceneIndex] = res;
    });

    // --- Step 5: Backend Auto-Fix & Enricher ---
    let lastUsedLayoutId = null;
    const finalScenes = scenePlan.map((scene, index) => {
      const uiData = uiLookup[index] || { points: [], keywords: ["technology"] };
      const points = Array.isArray(uiData.points) ? uiData.points : [];

      // 1. Calculate Delays dynamically (all elements appear within first 50% of scene duration)
      const sceneDuration = parseFloat(scene.duration) || 5.0;
      const maxLastDelay = sceneDuration * 0.5;
      const effectiveUsable = Math.max(0.4, maxLastDelay - 0.4);
      const step = points.length > 1 ? effectiveUsable / (points.length - 1) : 0;
      const enrichedPoints = points.map((pt, idx) => {
        const computedDelay = Number((0.4 + idx * step).toFixed(1));
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

      // 4. Contract resolution & Validation
      let targetLayoutId = scene.layoutId || "IntroBriefingCard";
      
      // Prevent consecutive identical layout repetition across adjacent scenes
      if (index > 0 && targetLayoutId === lastUsedLayoutId) {
        const layoutRotation = [
          "RankedImpactBullet", "IntroBubbleImage", "BeforeAfterPanel", 
          "AIHubGrid1", "HeroMetricCards", "TimelineBeamRail", "IntroCutoutHeadlineImage",
          "IntroChapterStack", "SplitProofBullet", "AppCardConcept"
        ];
        const altLayout = layoutRotation.find(lay => lay !== lastUsedLayoutId && lay !== targetLayoutId) || "RankedImpactBullet";
        console.log(`[Layout Diversity] Rotating duplicate layout for Scene ${index + 1}: ${targetLayoutId} -> ${altLayout}`);
        targetLayoutId = altLayout;
      }
      lastUsedLayoutId = targetLayoutId;

      const contract = contractLoader.getContractForLayout(targetLayoutId, scene.sceneIntent?.type);

      // Validate & Auto-extract highlightWords (must exist in heading)
      const headingStr = scene.heading || `Phân cảnh ${index + 1}`;
      const rawHighlightWords = Array.isArray(scene.sceneIntent?.highlightWords)
        ? scene.sceneIntent.highlightWords
        : [];
      let validHighlightWords = rawHighlightWords.filter(w => typeof w === "string" && w.trim() && headingStr.toLowerCase().includes(w.trim().toLowerCase()));

      if (validHighlightWords.length === 0 && headingStr) {
        if (headingStr.includes(":")) {
          const partAfter = headingStr.split(":")[1]?.trim();
          if (partAfter) {
            const wordCandidates = partAfter.split(/\s+/).filter(w => w.length >= 2);
            if (wordCandidates.length > 0) {
              validHighlightWords = [wordCandidates.join(" ")];
            }
          }
        }
        
        if (validHighlightWords.length === 0) {
          const allWords = headingStr.split(/\s+/).filter(w => w.trim().length > 0);
          let found = false;
          const isStrong = (w) => w && w.length >= 3 && !["cho", "với", "như", "này", "được", "của", "tại", "vào", "lên", "cho", "qua", "theo"].includes(w.toLowerCase());
          
          // 1. Try to find consecutive 2 words ending near the end of the sentence where both are strong
          for (let i = allWords.length - 1; i >= 1; i--) {
            const w1 = allWords[i - 1];
            const w2 = allWords[i];
            if (isStrong(w2) && isStrong(w1)) {
              validHighlightWords = [`${w1} ${w2}`];
              found = true;
              break;
            }
          }
          
          // 2. Fallback: Try to find consecutive 2 words where at least one is strong
          if (!found) {
            for (let i = allWords.length - 1; i >= 1; i--) {
              const w1 = allWords[i - 1];
              const w2 = allWords[i];
              if (isStrong(w2) || isStrong(w1)) {
                validHighlightWords = [`${w1} ${w2}`];
                found = true;
                break;
              }
            }
          }
          
          // 3. Fallback: Try to find a single strong word near the end
          if (!found) {
            for (let i = allWords.length - 1; i >= 0; i--) {
              if (isStrong(allWords[i])) {
                validHighlightWords = [allWords[i]];
                found = true;
                break;
              }
            }
          }
          
          // 4. Ultimate fallback: Last word of the sentence
          if (!found && allWords.length > 0) {
            validHighlightWords = [allWords[allWords.length - 1]];
          }
        }
      }

      const sceneIntentObj = scene.sceneIntent ? { ...scene.sceneIntent, highlightWords: validHighlightWords } : {
        type: "opening",
        importance: "medium",
        density: "medium",
        emotion: "neutral",
        highlightWords: validHighlightWords
      };

      const rawScene = {
        id: `scene_${Date.now()}_${index}`,
        sceneIndex: index,
        duration: scene.duration,
        layoutId: targetLayoutId,
        visualLayout: targetLayoutId,
        layoutFamily: contract.family || "opening",
        sceneIntent: sceneIntentObj,
        heading: headingStr,
        points: enrichedPoints,
        voiceover: scene.voiceover || "",
        placement: placement,
        keywords: cleanKeywords,
        theme: stylePack.theme,
        accentColor: stylePack.accentColor,
        category: uiData.category || ""
      };

      const { scene: validatedScene } = contractLoader.validateAndFormatSceneContent(rawScene, contract);
      return validatedScene;
    });

    // Process phoneme optimization for all scenes (same as current backend requirement)
    for (const scene of finalScenes) {
      if (scene.voiceover) {
        scene.voiceoverTts = await phoneme.optimizeTextForPhonemes(scene.voiceover, projectId);
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
