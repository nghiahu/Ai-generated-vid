const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { transform } = require("sucrase");
const path = require("path");
const fs = require("fs");
const phoneme = require("./phoneme");
const tts = require("./tts");
const db = require("./db");
const aligner = require("./aligner");

// Helper to extract and clean TSX code robustly from AI response
function cleanAndExtractCode(text) {
  if (!text || typeof text !== "string") return "";

  // 1. Try to extract code between ```tsx/jsx/ts/js and ```
  const codeBlockMatch = text.match(/```(?:tsx?|jsx?)([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // 2. Try to extract code between general ``` and ```
  const generalMatch = text.match(/```([\s\S]*?)```/);
  if (generalMatch && generalMatch[1]) {
    return generalMatch[1].trim();
  }

  // 3. Try to extract starting from the first "import " line
  const importIdx = text.indexOf("import ");
  if (importIdx !== -1) {
    return text.substring(importIdx).trim();
  }

  // 4. Fallback to basic cleaning
  return text
    .replace(/^```tsx/i, "")
    .replace(/^```jsx/i, "")
    .replace(/^```js/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
}

// Schema for Phase 1: Scene Planner in Studio AI Gen
const AIGEN_PLANNER_SCHEMA = {
  type: SchemaType.ARRAY,
  description: "List of planned scenes with visual patterns and metric descriptors for Studio AI Gen",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      sceneIndex: {
        type: SchemaType.INTEGER,
        description: "Zero-based index of the scene"
      },
      visualPattern: {
        type: SchemaType.STRING,
        description: "Must be strictly one of: 'DONUT_GAUGE', 'DUAL_METRIC_CARDS', 'HERO_METRIC_GLOW', 'TITLE_HOOK', 'BULLET_GLASS', 'ENDING_CTA'"
      },
      heading: {
        type: SchemaType.STRING,
        description: "Short hook heading in Vietnamese (max 60 chars)"
      },
      voiceover: {
        type: SchemaType.STRING,
        description: "Full voiceover narrative sentence(s) for TTS reading"
      },
      highlightWords: {
        type: SchemaType.ARRAY,
        description: "1-2 key words to highlight in heading",
        items: { type: SchemaType.STRING }
      },
      metrics: {
        type: SchemaType.ARRAY,
        description: "Metrics for DONUT_GAUGE, DUAL_METRIC_CARDS, or HERO_METRIC_GLOW",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            prefix: { type: SchemaType.STRING, description: "Prefix like '$'" },
            value: { type: SchemaType.NUMBER, description: "Numeric value to animate e.g. 6, 900, 88, 2590" },
            suffix: { type: SchemaType.STRING, description: "Suffix string e.g. '%', 'tr', ' TỶ ĐÔ'" },
            label: { type: SchemaType.STRING, description: "Label description below number" },
            useDotSeparator: { type: SchemaType.BOOLEAN, description: "True if formatting number like 2.590 (Vietnamese style)" }
          }
        }
      },
      contextLine: {
        type: SchemaType.STRING,
        description: "Supporting context sentence below the main visual element"
      },
      contextHighlight: {
        type: SchemaType.ARRAY,
        description: "Words in contextLine to accent in orange/accent color",
        items: { type: SchemaType.STRING }
      },
      alertText: {
        type: SchemaType.STRING,
        description: "Optional alert pill text e.g. 'Khoảng trống đó = VIỆC LÀM' or 'Nhưng số tiền đó đang KẸT'"
      },
      alertHighlight: {
        type: SchemaType.ARRAY,
        description: "Words inside alertText to highlight",
        items: { type: SchemaType.STRING }
      },
      subtitleCardText: {
        type: SchemaType.STRING,
        description: "Short summary sentence for the bottom glass card"
      }
    },
    required: ["sceneIndex", "visualPattern", "heading", "voiceover", "subtitleCardText"]
  }
};

// Schema for Phase 2: TSX Code Generator
const AIGEN_CODE_SCHEMA = {
  type: SchemaType.OBJECT,
  description: "Generated TSX React component code for Remotion scene",
  properties: {
    componentCode: {
      type: SchemaType.STRING,
      description: "Full TypeScript React component code string starting with imports and ending with export default GeneratedScene;"
    }
  },
  required: ["componentCode"]
};

// Helper to download or read local image and convert to Gemini base64 inlineData part
async function urlToGenerativePart(imageUrl) {
  if (!imageUrl) return null;
  const axios = require("axios");
  try {
    let imageBuffer;
    let mimeType = "image/png";

    // Detect mime type
    if (imageUrl.toLowerCase().endsWith(".jpg") || imageUrl.toLowerCase().endsWith(".jpeg")) {
      mimeType = "image/jpeg";
    } else if (imageUrl.toLowerCase().endsWith(".webp")) {
      mimeType = "image/webp";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      imageBuffer = Buffer.from(response.data, "binary");
    } else {
      // Local file path (e.g. /uploads/image.png)
      const cleanPath = imageUrl.replace(/^\//, "");
      const localPath = path.join(__dirname, "../public", cleanPath);
      if (fs.existsSync(localPath)) {
        imageBuffer = fs.readFileSync(localPath);
      } else {
        console.warn(`[Studio AI Gen] Local image not found: ${localPath}`);
        return null;
      }
    }

    return {
      inlineData: {
        data: imageBuffer.toString("base64"),
        mimeType
      }
    };
  } catch (err) {
    console.error(`[Studio AI Gen] Failed to convert image to generative part: ${imageUrl}`, err.message);
    return null;
  }
}

// Helper for retrying API calls across Gemini models
async function generateContentWithFallback(genAI, options, promptData, fallbackModels = []) {
  const modelsToTry = [options.model, ...fallbackModels.slice(0, 1)]; // Limit to 1 fallback model max to avoid rate-limit loops
  let lastError = new Error("No models tried");

  for (const modelName of modelsToTry) {
    let attempt = 0;
    const maxRetries = 1; // 1 retry per model

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: options.generationConfig
    });

    console.log(`[Studio AI Gen] Trying model: ${modelName}`);

    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [ ...(promptData.imageParts || []), { text: promptData.userPrompt } ] }],
          systemInstruction: promptData.systemInstruction
        });

        if (result && result.response) {
          console.log(`[Studio AI Gen] Success with model: ${modelName}`);
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

function cleanJSONResponse(text) {
  if (!text) return "";
  let cleaned = text.trim();
  // Remove markdown code block wraps
  cleaned = cleaned.replace(/^```json/i, "");
  cleaned = cleaned.replace(/^```/i, "");
  cleaned = cleaned.replace(/```$/i, "");
  cleaned = cleaned.trim();
  return cleaned;
}

function robustJSONParse(text) {
  const cleaned = cleanJSONResponse(text);
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    try {
      // 1. Replace literal newlines within double-quoted JSON strings with "\n"
      let fixedText = cleaned.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, p1) => {
        return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
      });
      // 2. Strip trailing commas before closing brackets and braces
      fixedText = fixedText
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/[\u200B-\u200D\uFEFF]/g, ""); // strip zero-width spaces
      return JSON.parse(fixedText);
    } catch (_) {
      throw err;
    }
  }
}

function normalizeVisualPattern(pattern) {
  if (!pattern) return "TITLE_HOOK";
  const upper = pattern.toUpperCase();
  if (upper.includes("DONUT") || upper.includes("GAUGE") || upper.includes("PERCENT") || upper.includes("STATCALLOUT") || upper.includes("STAT_CALLOUT")) {
    return "DONUT_GAUGE";
  }
  if (upper.includes("DUAL") || upper.includes("CARDS") || upper.includes("METRICHIGHLIGHT") || upper.includes("METRIC_HIGHLIGHT") || upper.includes("GRID")) {
    return "DUAL_METRIC_CARDS";
  }
  if (upper.includes("HERO") || upper.includes("GLOW") || upper.includes("LARGE") || upper.includes("METRIC")) {
    return "HERO_METRIC_GLOW";
  }
  if (upper.includes("BULLET") || upper.includes("GLASS") || upper.includes("LIST") || upper.includes("POINTS")) {
    return "BULLET_GLASS";
  }
  if (upper.includes("ENDING") || upper.includes("CTA") || upper.includes("OUTRO")) {
    return "ENDING_CTA";
  }
  return "TITLE_HOOK";
}

// Compile TSX component string to plain JS via Sucrase
function compileTSX(tsxCode) {
  try {
    // Sanitize imports if model adds unsupported imports
    let cleanedCode = tsxCode
      .replace(/import\s+React\s*,\s*\{[^}]*\}\s*from\s*['"]react['"];?/g, "import React from 'react';")
      .replace(/```tsx?/g, "")
      .replace(/```/g, "")
      .trim();

    const { code } = transform(cleanedCode, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "classic",
      production: false
    });
    return code;
  } catch (err) {
    console.error("[Sucrase Compile Error]:", err.message);
    throw new Error(`Lỗi biên dịch TSX Component: ${err.message}`);
  }
}

// Validate code string meets basic Remotion component requirements
function validateGeneratedCode(code) {
  if (!code || typeof code !== "string") return false;
  return (
    code.includes("GeneratedScene") &&
    code.includes("useCurrentFrame") &&
    code.includes("spring(")
  );
}

// Phase 1: Planner
async function generateScenePlanForAIGen(genAI, modelName, scriptText, targetLength = "Short (~60s)") {
  const options = {
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: AIGEN_PLANNER_SCHEMA,
      maxOutputTokens: 4096,
      temperature: 0.2
    }
  };

  const systemInstruction = `
# ROLE
You are a Scene Planner for Studio AI Gen — an AI-powered video production system.

# MISSION
Convert a raw script into a structured list of chronological scenes.
Each scene will be rendered using AI-generated React/Remotion code components following strict design patterns.

# HARD CONSTRAINTS
1. Output MUST be a valid JSON array matching the provided Schema.
2. Do not write markdown formatting or preamble. Just return raw JSON.
3. Every scene's voiceover must consist of complete sentences.
4. Keep technical terms in lowercase (e.g. "html", "css", "react"). Acronyms (AI, BA) in ALL CAPS.
5. Never use mathematical symbols (>, <, =) or long dashes in "voiceover". Write them out in natural words.

# VISUAL PATTERN SELECTION RULES (CRITICAL)
Choose visualPattern strictly according to content semantics:

- DONUT_GAUGE:
  → Use when scene contains a SINGLE percentage stat (e.g., "6%", "3%", "94%") as the shocking centerpiece.
  → Example: "Chỉ 6% tổ chức khai thác được giá trị lớn từ AI"

- DUAL_METRIC_CARDS:
  → Use when scene contains TWO distinct numeric stats to compare side-by-side.
  → Example: "900 triệu người dùng ChatGPT" vs "88% doanh nghiệp đã dùng AI"

- HERO_METRIC_GLOW:
  → Use when scene contains ONE very large number (billions, trillions, millions).
  → Example: "$2.590 TỶ ĐÔ đổ vào AI năm 2026"

- TITLE_HOOK:
  → Use for opening hook or rhetorical statement without numbers.

- BULLET_GLASS:
  → Use for 2-4 structured bullet points or list items.

- ENDING_CTA:
  → Use for final scene call to action.

# METRICS FIELDS
Populate metrics, alertText, contextLine, and subtitleCardText for each scene to make the design rich and complete!
  `;

  const userPrompt = `
Script: "${scriptText}"
Target Length: "${targetLength}"

Generate a scene plan array following the schema and visualPattern rules.
  `;

  const fallbacks = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro"].filter(m => m !== modelName);
  const result = await generateContentWithFallback(genAI, options, { systemInstruction, userPrompt }, fallbacks);
  const text = result.response.text().trim();
  
  try {
    return robustJSONParse(text);
  } catch (parseErr) {
    console.warn("[Studio AI Gen] Phase 1 JSON parsing failed. Attempting self-correction retry...", parseErr.message);
    const correctionPrompt = `
Your previous output was invalid JSON. It failed to parse with error: "${parseErr.message}".
Here was the invalid output you generated:
---
${text}
---

Please generate the CORRECTED JSON array that adheres strictly to the schema, ensuring all string values are closed properly and double quotes inside strings are correctly escaped as \\".
Do not output any introductory or conversational text, output only the JSON array.
`;

    try {
      const correctionResult = await generateContentWithFallback(
        genAI,
        options,
        { systemInstruction, userPrompt: correctionPrompt },
        fallbacks
      );
      const correctedText = correctionResult.response.text().trim();
      return robustJSONParse(correctedText);
    } catch (retryErr) {
      console.error("[Studio AI Gen] Self-correction failed as well:", retryErr.message);
      throw parseErr;
    }
  }
}

// Phase 2: TSX Code Generator for 1 Scene
async function generateTSXCodeForScene(genAI, modelName, scene, theme = "ai_hub_grid", bgImage = "", refImages = []) {
  const fs = require("fs");
  const path = require("path");
  const vde = require("./vde");

  const options = {
    model: modelName,
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.2
    }
  };

  // Convert reference images to Gemini inlineData parts
  const imageParts = [];
  if (Array.isArray(refImages) && refImages.length > 0) {
    console.log(`[Studio AI Gen] Processing ${refImages.length} design reference images for scene ${scene.sceneIndex}...`);
    for (const url of refImages) {
      const part = await urlToGenerativePart(url);
      if (part) imageParts.push(part);
    }
  }

  // Load design-reference.md dynamically
  let designReferenceText = "";
  try {
    const refPath = path.join(__dirname, "../../docs/studio-ai-gen/design-reference.md");
    if (fs.existsSync(refPath)) {
      designReferenceText = fs.readFileSync(refPath, "utf8");
    }
  } catch (err) {
    console.error("[Studio AI Gen] Failed to read design-reference.md:", err.message);
  }

  // Load theme tokens dynamically
  const styleData = vde.getStyle(theme) || {};
  const colors = styleData.tokens?.colors || {};
  const radius = styleData.tokens?.radius || "16px";
  const shadow = styleData.tokens?.shadow || "none";
  const border = styleData.tokens?.border || "1px solid rgba(255, 255, 255, 0.1)";
  const fontTitle = styleData.tokens?.fonts?.title || '"Be Vietnam Pro", sans-serif';

  const themeTokensText = `
  const THEME = {
    bg: "${colors.background || "#030712"}",
    cardBg: "${colors.cardBg || "rgba(8, 17, 37, 0.75)"}",
    border: "${colors.border || border}",
    accent: "${colors.accent || "#3b82f6"}",
    orange: "#f97316",
    cyan: "#93c5fd",
    text: "${colors.text || "#ffffff"}",
    textSec: "${colors.textSecondary || "rgba(255, 255, 255, 0.65)"}",
    radius: "${radius}",
    shadow: "${shadow}",
    font: "${fontTitle}"
  };
  `;

  const bgImageRule = bgImage
    ? `8. Background Image: Include a background image layer as the bottom-most layer (zIndex: 0):
       <img src="${bgImage}" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3, zIndex: 0 }} />`
    : "";

  const systemInstruction = `
# ROLE
You are an expert React / Remotion TSX component code generator.

# MISSION
Generate a complete, self-contained React functional component for a 9:16 vertical video scene.
The component MUST follow Remotion physics animations and high-end glassmorphism aesthetic.

# DESIGN REFERENCE FRAME SPECIFICATIONS (MANDATORY TO READ AND ADHERE TO)
${designReferenceText}

# PREMIUM DESIGN AESTHETICS & LAYOUT TASTE
1. Typography, Badges & Flow Layout (CRITICAL FOR COLLISION PREVENTION):
   - Headings & Badges Layout Flow: You MUST NEVER position floating badges/capsules absolute next to or overlapping the main heading text. This causes them to collide with multi-line headings or clip at the screen edges. Instead, group the heading and its supporting badges in a single vertical Flexbox container (\`display: "flex", flexDirection: "column", alignItems: "center"\`). Render badges in a single horizontal row (\`display: "flex", flexDirection: "row", gap: "8px", justifyContent: "center"\`) positioned directly ABOVE or BELOW the main heading text.
   - Headings: Use a heavy weight (700 or 800), tight letterSpacing (e.g., "-0.03em" or "-0.04em"), and textWrap: "balance" / textWrap: "pretty" so lines wrap cleanly.
   - Staggered Text Animations: Instead of rendering the whole heading at once, split the text into words (using heading.split(" ")) or character arrays. Map through them and stagger their entrance:
     * Calculate delayed spring for each word: const wordSpring = spring({ frame: Math.max(0, frame - (wordIndex * 6)), fps, config: { damping: 12, stiffness: 60 } });
     * Interpolate: transform: translateY(interpolate(wordSpring, [0, 1], [30, 0])) rotate(interpolate(wordSpring, [0, 1], [4, 0])deg), opacity: interpolate(wordSpring, [0, 1], [0, 1]).
     * Render them as inline-blocks with small margins.
   - Numbers: Always use tabular numbers (fontVariantNumeric: "tabular-nums") or monospace fonts for animated statistic counters to prevent text flickering/shifting during count-up animations.

2. Premium Glassmorphism & Glossy Shimmer (Hiệu ứng ánh sáng lướt qua):
   - Apply a high-end glass refraction style to all cards (DUAL_METRIC_CARDS, BULLET_GLASS, and bottom Subtitle card):
     * background: THEME.cardBg
     * backdropFilter: "blur(16px) saturate(180%)" (Apple-style premium glass refraction)
     * border: THEME.border
     * borderRadius: THEME.radius
     * boxShadow: THEME.shadow
   - Add a glossy light sweep overlay (shimmer) that sweeps across the card:
     * Calculate sweep progress: const shimmerProgress = spring({ frame: Math.max(0, frame - 15), fps, config: { damping: 22, stiffness: 30 } });
     * Interpolate background position: const shimmerPos = interpolate(shimmerProgress, [0, 1], [-150, 150]);
     * Apply to the card style:
       backgroundImage: "linear-gradient(120deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.18) 60%, rgba(255,255,255,0) 70%)",
       backgroundSize: "250% 100%",
       backgroundPosition: shimmerPos + "% 0"

3. Extra Supporting Elements & Badges:
   - Add small floating capsule labels/pills (e.g. "[★ 25K sao]", "[MIT]", "[Anti-Slop #1]", "[AIDEV REPO]") above or below the main titles to make the interface rich.
   - Give these badges independent delayed entrance animations (scale: 0 -> 1, opacity: 0 -> 1) with slight random offsets to simulate physical bouncing.

4. Mock Code Terminal / Console Box:
   - CẤM LẠM DỤNG (DO NOT ABUSE): Chỉ vẽ khung Terminal khi kịch bản đề cập trực tiếp đến code thực tế, lệnh CLI, hoặc kho lưu trữ. Tuyệt đối không tự ý vẽ khung code cho các câu nói mang tính ẩn dụ, ví von (ví dụ: "chạy hệ thống", "sửa máy", "vận hành", "bấm nút").
   - Điều kiện kích hoạt: Chỉ render Mock Terminal nếu kịch bản hoặc lời thoại (voiceover) chứa các từ khóa kỹ thuật rõ ràng: \`npm\`, \`npx\`, \`git\`, \`docker\`, \`github\`, \`repository\`, \`code\`, \`terminal\`, \`command line\`, \`api\`, \`database\`, \`developer\`, \`programming\`, \`cli\`.
   - Nếu đủ điều kiện, render một Mock Terminal Box tuyệt đẹp:
     * background: "rgba(10, 15, 30, 0.85)", border: "1px solid rgba(59, 130, 246, 0.4)", padding: "16px 20px", borderRadius: "12px", fontFamily: "monospace", textAlign: "left".
     * Add 3 window dots at top-left: Red, Yellow, Green circles (each width/height 12px, margin-right 6px, display inline-block).
     * Render the command (e.g., "$ npx skills add taste-skill") with a blinking cursor at the end or stagger typing character by character.

5. Cinematic Frame Motion & Camera Drifts (Tránh khung hình đứng yên):
   - Never let the scene look static! Add a continuous camera zoom/drift effect to the background image or the main container:
     * const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.08], { extrapolateRight: "clamp" });
     * const driftRotate = interpolate(frame, [0, durationInFrames], [0, 0.6], { extrapolateRight: "clamp" });
     * Apply transform: scale(zoom) rotate(driftRotate + "deg") to background elements.
   - Render 2-3 slow-moving, large blurred ambient glowing orbs in the background (zIndex: 1, filter: "blur(80px)", opacity: 0.15) that slowly pan or float during the scene.

6. Staggered Entrance Animations:
   - Cascade element entrances sequentially:
     * Title: starts at frame 0.
     * Core Stats/Gauges/Terminal: starts at frame 15.
     * Inner lists/bullets/badges: staggered dynamically by index * 8 frames.
     * Bottom subtitle line: starts at frame 40.

9. Prevent Overlaps & Layering (CRITICAL):
   - The bottom subtitle line is absolute positioned at bottom: 8% with zIndex: 5.
   - Force Vertical Centering Container: To prevent all content from crowding at the top and leaving the bottom half empty, you MUST wrap all core visual components (badges row, main heading, and cards/gauge/terminal) inside a single vertical Flexbox container that centers the entire block vertically on the screen.
     * Use exactly this style pattern for the main centering wrapper:
       \`display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", padding: "0 80px", paddingBottom: "18%", boxSizing: "border-box", zIndex: 10\`
     * The \`paddingBottom: "18%"\` (roughly 350px) is critical to leave a clean bottom safe space for the subtitles, preventing overlay.
     * Inside this container, enforce a vertical spacing \`gap\` between \`40px\` and \`60px\` to spread the elements elegantly across the vertical axis.
   - Prohibit Absolute Component Overlaps: Every content element (headings, sub-labels, cards, gauges, buttons, terminals) must have its own dedicated, non-overlapping layout space. Do not place elements absolute on top of each other.
   - Safe Margin & Clipping Avoidance: Enforce a minimum horizontal padding/margin of at least 80px on the left and right sides of the screen for all text and card containers. No component or text block should extend beyond these boundaries to prevent horizontal clipping.

# HARD RULES
1. ONLY import from "remotion":
   import React from "react";
   import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
   Do NOT import any other external packages or local relative paths.

2. Component Signature MUST be EXACTLY:
   export const GeneratedScene: React.FC<{ fps?: number }> = ({ fps = 30 }) => {
     const frame = useCurrentFrame();
     // ...
     return ( ... );
   };
   export default GeneratedScene;

3. Canvas Size: 1080px width × 1920px height (9:16 vertical).
   All styles MUST be inline React style objects. No CSS class names.

4. Theme Colors (Inject these exact color variables into your generated inline style mapping):
${themeTokensText}

5. Animation Rules (Remotion Physics):
   Always create smooth entrance animations using spring():
   const sp = (delayFrames = 0, damping = 14, stiffness = 55) =>
     spring({ frame: Math.max(0, frame - delayFrames), fps, config: { damping, stiffness, mass: 1.0 } });

6. Pattern Specs:
   - DONUT_GAUGE: render SVG circle with strokeDashoffset = circ * (1 - progress * pct). Center display counter and label.
   - DUAL_METRIC_CARDS: 2 glass cards side by side (gap 16px). Big animated numbers (72px, cyan color).
   - HERO_METRIC_GLOW: Eyebrow label top, giant hero number center (~120px) with drop-shadow glow.
   - TITLE_HOOK: Render a giant, high-impact heading centered vertically. Add a glowing capsule pill/badge at the top (e.g. "[XU HƯỚNG MỚI]" or "[HOT REPORT]") with a spring scale entrance animation. Stagger the words of the heading to pop up sequentially.
   - BULLET_GLASS: Render 2-3 bullet items. Each bullet MUST be a premium glass card (THEME.cardBg, backdropFilter: "blur(16px) saturate(180%)", border: THEME.border, borderRadius: THEME.radius, boxShadow: THEME.shadow). Inside each card, display a circular number badge on the left (e.g. "01", "02", "03" inside a circle with orange background or border) and the bullet point text on the right. Stagger card entrances by index (e.g., delay = 20 + i * 12).
   - ENDING_CTA: High-impact final screen. A giant animated headline (e.g., "BẮT ĐẦU NGAY", "HÀNH ĐỘNG NGAY"). Below it, render a large glowing Action Button (e.g. "Đăng ký tư vấn", "Tham gia ngay") styled as a premium orange-to-yellow gradient pill (background: "linear-gradient(90deg, #f97316, #fb923c)") with a scale-up bounce animation (using spring) and a heavy drop-shadow (boxShadow: "0 0 35px rgba(249,115,22,0.65)").
   - Subtitle at bottom (CRITICAL - NO BOX/BLOCK BACKGROUND, DISPLAY 1 LINE AT A TIME):
      * Position: absolute, bottom: 8% (roughly 150px from bottom to respect video Safe Zone constraints and avoid overlapping main content), left: 5%, right: 5%, text-align: center, padding: 10px, zIndex: 5.
      * Background style: MUST BE TRANSPARENT. Do NOT render a background card, background box, border, or backdrop-filter. No block shapes. The subtitles must sit directly on the video background.
      * Visibility: To make the text highly visible on any background, apply a strong, elegant black text-shadow to the text container: textShadow: "0 2px 8px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.95)".
      * Sentence-by-Sentence Karaoke Highlight (CRITICAL - DO NOT render the whole voiceover at once; group words into short lines/sentences of max 7 words or split by punctuation):
        - Implement this exact logic inside the component body:
          \`\`\`tsx
          // 1. Group words into lines/sentences (split by punctuation . ? ! , : OR max 7 words)
          const lines = React.useMemo(() => {
            const words = subtitlesJson || [];
            if (words.length === 0) {
              // Fallback: split raw voiceover text linearly
              const rawWords = (scene.voiceover || "").split(" ").filter(Boolean);
              const res = [];
              let currentLine = [];
              rawWords.forEach((word) => {
                currentLine.push({ word });
                if (/[.?!,:]$/.test(word.trim()) || currentLine.length >= 7) {
                  res.push(currentLine);
                  currentLine = [];
                }
              });
              if (currentLine.length > 0) res.push(currentLine);
              return res;
            }
            const res = [];
            let currentLine = [];
            words.forEach((w) => {
              currentLine.push(w);
              if (/[.?!,:]$/.test((w.word || "").trim()) || currentLine.length >= 7) {
                res.push(currentLine);
                currentLine = [];
              }
            });
            if (currentLine.length > 0) res.push(currentLine);
            return res;
          }, [subtitlesJson]);

          // 2. Find active line index based on frame/time
          const currentSeconds = frame / fps;
          const activeLineIdx = React.useMemo(() => {
            if (lines.length === 0) return 0;
            // If timestamps exist
            if (subtitlesJson && subtitlesJson.length > 0) {
              const idx = lines.findIndex((line) => {
                const start = line[0].start || 0;
                const end = line[line.length - 1].end || 0;
                return currentSeconds >= start && currentSeconds < end;
              });
              if (idx !== -1) return idx;
              for (let i = lines.length - 1; i >= 0; i--) {
                const start = lines[i][0].start || 0;
                if (currentSeconds >= start) return i;
              }
              return 0;
            }
            // Linear timing fallback (no timestamps)
            const durationInFrames = useVideoConfig().durationInFrames;
            const speakingFrames = Math.max(30, durationInFrames - 30);
            const framesPerLine = speakingFrames / lines.length;
            return Math.min(lines.length - 1, Math.floor(Math.max(0, frame - 15) / framesPerLine));
          }, [lines, currentSeconds, frame, fps]);

          const activeLine = lines[activeLineIdx] || [];
          \`\`\`
        - Render ONLY the activeLine words:
          * Map through activeLine.
          * If timestamps are present: a word is active when currentSeconds >= w.start && currentSeconds <= w.end.
          * If timestamps are NOT present: calculate active word index linearly within the active line's duration:
            const activeWordIdx = Math.floor((Math.max(0, frame - 15) % framesPerLine) / (framesPerLine / activeLine.length)).
          * Style active words: color: THEME.orange (or #ffffff), scale(1.08), fontWeight: 800, transition: "all 0.08s ease-out", display: "inline-block", marginRight: "10px", textShadow: "0 2px 8px rgba(0,0,0,0.95)".
          * Style inactive words: color: "rgba(255, 255, 255, 0.45)", scale(1.0), fontWeight: 600, display: "inline-block", marginRight: "10px", textShadow: "0 2px 8px rgba(0,0,0,0.95)".

 7. Strict Contrast and Readability Rules (CRITICAL FOR READABILITY):
    - The background of the video is dark (THEME.bg is typically #030712).
    - You MUST NEVER use dark colors (such as dark blue, slate, charcoal, grey, or black) for any visible text, numbers, list items, or subtitles. For example, never style text with color: "#0f172a", "#1e293b", "#334155", or "#475569".
    - All text, titles, numbers, bullet items, and badges must be highly readable and use bright, high-contrast colors. Use pure white (#ffffff), bright orange (#f97316 / #fb923c), bright cyan/blue (#60a5fa / #93c5fd), or bright yellow (#fbbf24).
    - Active subtitle words must be bright orange (#f97316) or white (#ffffff), never dark grey or blue. Inactive subtitle words should be semi-transparent white (rgba(255,255,255,0.4)), not dark.
    - Check every color inside your TSX code. If there is a color code resembling a dark/slate color on text, replace it immediately with a bright high-contrast color.

 8. Return ONLY the raw TSX code. Do NOT wrap in JSON. Do NOT include markdown code block syntax (like \`\`\`tsx). Start directly with the imports and end with the default export.

 9. Reference Image Layout Adaptation & Theme Color Preservation (CRITICAL):
    - If design reference images are attached, you MUST analyze them strictly to mimic their layout structures, container placements, alignment, spacing gaps, border-radii, shadows, padding, and typography hierarchy.
    - WARNING (PRESERVE COLORS): Do NOT copy the colors, background gradients, or text colors from the reference images. All colors, text highlighting, and background styles MUST be driven strictly by the pre-defined \`THEME\` variables (e.g. \`THEME.bg\`, \`THEME.accent\`, \`THEME.orange\`, \`THEME.cyan\`) to maintain the selected brand theme.
${bgImageRule}
  `;

  const referenceInstruction = imageParts.length > 0
    ? `\nWe have attached ${imageParts.length} design reference image(s). You MUST analyze these images strictly to mimic their layout structures, container placements, alignment, spacing gaps, border-radii, shadows, padding, and typography hierarchy.
       WARNING: DO NOT use the colors, color gradients, background graphics, or text colors from the reference images. The color styling, highlighting, and backgrounds MUST come strictly from the selected workspace THEME tokens (e.g. THEME.bg, THEME.accent, THEME.orange, THEME.cyan) to protect the theme branding.`
    : "";

  const userPrompt = `
Generate raw TSX code for this scene data:
${JSON.stringify(scene, null, 2)}
Theme: "${theme}"
Background Image: "${bgImage ? 'YES' : 'NO'}"${referenceInstruction}
  `;

  const fallbacks = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro"].filter(m => m !== modelName);
  const result = await generateContentWithFallback(genAI, options, { systemInstruction, userPrompt, imageParts }, fallbacks);
  let text = result.response.text().trim();
  text = cleanAndExtractCode(text);
  return text;
}

// Orchestrator function
async function generateAIGenStoryboard({ script, targetLength = "Short (~60s)", theme = "ai_hub_grid", voiceKey = "duythanh", bgImage = "", refImages = [], projectId = null }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong backend .env");
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  if (modelName.includes("2.0") && !modelName.includes("exp")) {
    modelName = "gemini-3.5-flash";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log(`[Studio AI Gen] Bắt đầu khởi tạo Studio AI Gen với model: ${modelName}`);

  // Step 1: Generate Scene Plan
  const scenePlan = await generateScenePlanForAIGen(genAI, modelName, script, targetLength);
  console.log(`[Studio AI Gen] Phase 1 hoàn tất: ${scenePlan.length} phân cảnh được tạo.`);

  // Step 2: Generate TSX Code & Compile per scene sequentially (to prevent rate limits and 503 errors)
  const scenesWithCode = [];
  for (let index = 0; index < scenePlan.length; index++) {
    const scene = scenePlan[index];
    const generated = await generateSingleSceneCode({
      scene,
      index,
      theme,
      bgImage,
      refImages,
      voiceKey,
      projectId,
      genAI,
      modelName
    });
    scenesWithCode.push(generated);
  }

  console.log(`[Studio AI Gen] Toàn bộ ${scenesWithCode.length} phân cảnh đã biên dịch JS thành công.`);
  return scenesWithCode;
}

// Generates code, tts audio, and alignments for a single scene
async function generateSingleSceneCode({ scene, index, theme, bgImage, refImages, voiceKey, projectId, genAI, modelName }) {
  scene.sceneIndex = index;
  scene.visualPattern = normalizeVisualPattern(scene.visualPattern);

  // Calculate duration frames (word count / 2.7 * 30 fps, min 120 frames = 4s)
  const wordCount = (scene.voiceover || "").trim().split(/\s+/).length;
  const durationSec = Math.max(4.0, wordCount / 2.7);
  const durationFrames = Math.round(durationSec * 30);
  scene.durationFrames = durationFrames;

  // Execute TTS generation AND Gemini TSX code generation in PARALLEL
  const ttsTask = (async () => {
    if (!scene.voiceover) return null;
    try {
      const optVoiceover = await phoneme.optimizeTextForPhonemes(scene.voiceover, projectId);
      return await tts.generateTTS(optVoiceover, projectId || "aigen_proj", `scene_${index}_${Date.now()}`, `omnivoice_${voiceKey}`);
    } catch (ttsErr) {
      console.warn(`[Studio AI Gen] TTS warning for scene ${index}:`, ttsErr.message);
      return null;
    }
  })();

  const tsxTask = generateTSXCodeForScene(genAI, modelName, scene, theme, bgImage, refImages);

  const [ttsResult, tsxResult] = await Promise.allSettled([ttsTask, tsxTask]);

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
      console.warn(`[Studio AI Gen] Tiến hành tự động sửa lỗi qua Gemini...`);

      try {
        const correctionPrompt = `
Your previous generated TSX code for the scene failed to compile with error: "${codeErr.message}".

Here is the invalid code you generated:
---
${tsxCode}
---

Please identify the compilation error and generate the CORRECTED React/Remotion TSX component.
Ensure all functions, variables, and hooks (like React.useMemo, React.useState, etc.) are properly defined or imported.
Do not output any introductory or conversational text, output only the corrected TSX code.
`;

        const options = {
          model: modelName,
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.1
          }
        };

        const fallbacks = ["gemini-1.5-flash"];
        const correctionResult = await generateContentWithFallback(
          genAI,
          options,
          { systemInstruction: "You are an expert React / Remotion TSX component code generator. Fix compiler errors and output only valid raw TSX code.", userPrompt: correctionPrompt },
          fallbacks
        );

        let correctedText = correctionResult.response.text().trim();
        tsxCode = cleanAndExtractCode(correctedText);

        compiledJS = compileTSX(tsxCode);
        console.log(`[Studio AI Gen] Tự sửa lỗi thành công cho scene ${index}!`);
      } catch (retryErr) {
        console.error(`[Studio AI Gen] Tự sửa lỗi thất bại cho scene ${index}:`, retryErr.message);
        console.error(`[Studio AI Gen] Raw TSX Code that failed compilation:\n`, tsxCode);
        // Fallback component code
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

module.exports = {
  generateAIGenStoryboard,
  generateScenePlanForAIGen,
  generateSingleSceneCode,
  compileTSX,
  validateGeneratedCode
};


