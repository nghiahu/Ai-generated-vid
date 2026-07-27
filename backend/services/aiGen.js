const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { transform } = require("sucrase");
const path = require("path");
const fs = require("fs");
const phoneme = require("./phoneme");
const tts = require("./tts");
const db = require("./db");
const aligner = require("./aligner");

// Sanitize imports to prevent Sucrase compiler 'from expected' errors
function sanitizeImportStatements(code) {
  if (!code || typeof code !== "string") return "";

  // Split code into lines for header import line inspection
  const lines = code.split("\n");
  const cleanedLines = [];
  let inHeader = true;

  for (let line of lines) {
    const trimmed = line.trim();

    // Check header lines before actual component logic
    if (inHeader) {
      // Remove leaked instruction text that starts with "Import " or "Do NOT import" before component definition
      if (/^Import\s+/i.test(trimmed) && !trimmed.includes("from")) {
        continue;
      }
      if (/^Do\s+NOT\s+import/i.test(trimmed)) {
        continue;
      }

      // Fix alias syntax in lucide-react imports if present e.g. "Terminal as TerminalIcon" -> "Terminal"
      if (line.includes("lucide-react") && line.includes(" as ")) {
        line = line.replace(/(\w+)\s+as\s+\w+/g, "$1");
      }

      // If line starts with "import " but is missing "from ...", attempt auto-repair or skip broken line
      if (trimmed.startsWith("import ") && !trimmed.includes("from ") && !trimmed.includes("from\"") && !trimmed.includes("from'")) {
        // If it looks like Lucide icons import without from clause, append from "lucide-react";
        if (trimmed.includes("{") || trimmed.includes("Zap") || trimmed.includes("Terminal")) {
          line = trimmed.endsWith(";") ? trimmed.slice(0, -1) + ' from "lucide-react";' : trimmed + ' from "lucide-react";';
        } else {
          // Skip invalid import line
          continue;
        }
      }

      // Once component signature or normal code starts, header phase ends
      if (trimmed.startsWith("export ") || trimmed.startsWith("const ") || trimmed.startsWith("function ") || trimmed.startsWith("//")) {
        inHeader = false;
      }
    }

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n");
}

// Helper to extract and clean TSX code robustly from AI response
function cleanAndExtractCode(text) {
  if (!text || typeof text !== "string") return "";

  let extracted = "";
  // 1. Try to extract code between ```tsx/jsx/ts/js and ```
  const codeBlockMatch = text.match(/```(?:tsx?|jsx?)([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    extracted = codeBlockMatch[1].trim();
  } else {
    // 2. Try to extract code between general ``` and ```
    const generalMatch = text.match(/```([\s\S]*?)```/);
    if (generalMatch && generalMatch[1]) {
      extracted = generalMatch[1].trim();
    } else {
      // 3. Try to extract starting from the first "import " line
      const importIdx = text.indexOf("import ");
      if (importIdx !== -1) {
        extracted = text.substring(importIdx).trim();
      } else {
        // 4. Fallback to basic cleaning
        extracted = text
          .replace(/^```tsx/i, "")
          .replace(/^```jsx/i, "")
          .replace(/^```js/i, "")
          .replace(/^```/i, "")
          .replace(/```$/i, "")
          .trim();
      }
    }
  }

  return sanitizeImportStatements(extracted);
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
        description: "Descriptive unique visual concept name for this scene based on semantic intent (e.g., 'CODE_TERMINAL_DIFF', 'HORIZON_3STEP_FLOW', 'HERO_METRIC_GAUGE_RING', 'VS_SPLIT_COMPARISON', 'GRID_MATRIX_4TILES', 'EDITORIAL_QUOTE_CARD', 'OUTRO_CTA_PULSE', 'GLASS_BULLET_LIST'). MUST NOT repeat consecutive patterns."
      },
      visualConcept: {
        type: SchemaType.STRING,
        description: "Alias for visualPattern describing the bespoke visual layout structure"
      },
      heading: {
        type: SchemaType.STRING,
        description: "Short hook heading in Vietnamese (max 60 chars)"
      },
      voiceover: {
        type: SchemaType.STRING,
        description: "Full ORIGINAL script text strictly from 'Lời thoại (Gốc)' for ON-SCREEN SUBTITLE DISPLAY (e.g. '100% các siêu AI... GPT-4, Llama 3... Backpropagation'). DO NOT put phonetic reading words here!"
      },
      voiceoverTts: {
        type: SchemaType.STRING,
        description: "Optional phonetic reading transcript strictly from 'Lời thoại (Phiên âm đọc)' for TTS SPEECH SYNTHESIS (e.g. '100 phần trăm các siêu Ây ai... Gi-pi-ti Bốn... Bắc-bơ-rô-ba-gey-xơn'). Leave empty if not provided."
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

// Helper to download, parse Data URL, or read local image and convert to Gemini base64 inlineData part
async function urlToGenerativePart(imageUrl) {
  if (!imageUrl) return null;
  const axios = require("axios");
  try {
    // 1. Handle base64 Data URLs (e.g. data:image/png;base64,iVBORw0KGgo...)
    if (imageUrl.startsWith("data:image/")) {
      const matches = imageUrl.match(/^data:(image\/[a-zA-Z0-9\+\-\.]+);base64,(.+)$/s);
      if (matches && matches[2]) {
        const mimeType = matches[1];
        const base64Data = matches[2].replace(/[\r\n]+/g, "");
        return {
          inlineData: {
            data: base64Data,
            mimeType
          }
        };
      }
    }

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
    console.error(`[Studio AI Gen] Failed to convert image to generative part: ${imageUrl.substring(0, 60)}...`, err.message);
    return null;
  }
}

// Helper for retrying API calls across active Gemini models with exponential backoff & jitter
async function generateContentWithFallback(genAI, options, promptData, fallbackModels = []) {
  // Pool of active production Gemini models verified via live API test
  const defaultFallbackPool = ["gemini-3.6-flash", "gemini-2.5-flash"];
  const combinedModels = [options.model || "gemini-3.6-flash", ...fallbackModels, ...defaultFallbackPool];
  // Deduplicate model names while preserving order
  const modelsToTry = [...new Set(combinedModels)].filter(Boolean);
  let lastError = new Error("No models tried");

  for (const modelName of modelsToTry) {
    let attempt = 0;
    const maxRetries = 3; // 3 retries per model with exponential backoff

    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: options.generationConfig
    });

    console.log(`[Studio AI Gen] Requesting Gemini API with model: ${modelName}...`);

    while (attempt < maxRetries) {
      try {
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [ ...(promptData.imageParts || []), { text: promptData.userPrompt } ] }],
          systemInstruction: promptData.systemInstruction
        });

        if (result && result.response) {
          console.log(`[Studio AI Gen] ✅ Gemini API success with model: ${modelName}`);
          return result;
        }
        throw new Error("Empty response from API");
      } catch (err) {
        lastError = err;
        attempt++;
        const errMsg = err.message || String(err);
        const is503OrRateLimit = /503|overloaded|unavailable|429|resource_exhausted/i.test(errMsg);

        if (attempt < maxRetries) {
          // Calculate exponential backoff with jitter: 1.5s -> 3.5s -> 6.5s
          const baseDelay = Math.pow(2, attempt) * 1200;
          const jitter = Math.floor(Math.random() * 800);
          const backoffMs = baseDelay + jitter;
          console.warn(`[Studio AI Gen] ⚠️ Gemini API error (${is503OrRateLimit ? '503/429 Load Spike' : 'Error'}) on model ${modelName} (Attempt ${attempt}/${maxRetries}): ${errMsg.substring(0, 80)}. Retrying in ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
        } else {
          console.warn(`[Studio AI Gen] Model ${modelName} exhausted ${maxRetries} attempts. Switching fallback model...`);
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
      // 1. Fix inner double quotes e.g. "voiceover": ""Text"" -> "voiceover": "Text"
      let fixedText = cleaned.replace(/"(voiceover|heading|contextLine|alertText)"\s*:\s*""([^"]*)""/g, '"$1": "$2"');

      // 2. Replace literal newlines within double-quoted JSON strings with "\n"
      fixedText = fixedText.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, p1) => {
        return '"' + p1.replace(/\n/g, '\\n').replace(/\r/g, '\\r') + '"';
      });

      // 3. Strip trailing commas before closing brackets and braces
      fixedText = fixedText
        .replace(/,\s*([\]}])/g, "$1")
        .replace(/[\u200B-\u200D\uFEFF]/g, ""); // strip zero-width spaces

      return JSON.parse(fixedText);
    } catch (_) {
      // 4. Ultimate Fallback: Extract scene objects using regex regex matcher if JSON.parse fails completely
      try {
        const objectMatches = cleaned.match(/\{[^{}]*"voiceover"[^{}]*\}/g) || cleaned.match(/\{[\s\S]*?\}/g);
        if (objectMatches && objectMatches.length > 0) {
          const extractedScenes = [];
          for (let i = 0; i < objectMatches.length; i++) {
            const blockStr = objectMatches[i];
            try {
              extractedScenes.push(JSON.parse(blockStr));
            } catch (singleErr) {
              const voMatch = blockStr.match(/"voiceover"\s*:\s*"([\s\S]*?)"\s*[,}\n]/);
              const hdMatch = blockStr.match(/"heading"\s*:\s*"([\s\S]*?)"\s*[,}\n]/);
              const vpMatch = blockStr.match(/"visualPattern"\s*:\s*"([\s\S]*?)"\s*[,}\n]/);
              if (voMatch || hdMatch) {
                extractedScenes.push({
                  sceneIndex: i,
                  visualPattern: vpMatch ? vpMatch[1] : "TITLE_HOOK",
                  heading: hdMatch ? hdMatch[1] : "Studio AI Gen Scene",
                  voiceover: voMatch ? voMatch[1].replace(/^"+|"+$/g, '').trim() : "Phân cảnh AI Gen"
                });
              }
            }
          }
          if (extractedScenes.length > 0) {
            console.log(`[Studio AI Gen] Solved JSON syntax error via regex extraction: extracted ${extractedScenes.length} scenes.`);
            return extractedScenes;
          }
        }
      } catch (regexErr) {
        console.error("[Studio AI Gen] Ultimate regex extraction failed:", regexErr.message);
      }
      throw err;
    }
  }
}

function normalizeVisualPattern(pattern) {
  if (!pattern) return "DYNAMIC_VISUAL_HOOK";
  const cleaned = pattern.trim().replace(/[^a-zA-Z0-9_]/g, "_").toUpperCase();
  return cleaned || "DYNAMIC_VISUAL_HOOK";
}

// Robust TSX Sanitizer to clean LLM syntax flaws before Sucrase compilation
function sanitizeTSXCode(code) {
  if (!code || typeof code !== "string") return "";

  let cleaned = cleanAndExtractCode(code);

  // 1. Remove TypeScript interface and type blocks
  cleaned = cleaned.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "");
  cleaned = cleaned.replace(/type\s+\w+\s*=\s*\{[\s\S]*?\};?/g, "");
  cleaned = cleaned.replace(/type\s+\w+\s*=\s*[^;]+;/g, "");

  // 2. Remove inline TS type annotations on functions and variables
  cleaned = cleaned.replace(/:\s*React\.FC<[^>]+>/g, "");
  cleaned = cleaned.replace(/:\s*React\.ReactNode/g, "");
  cleaned = cleaned.replace(/\):\s*(?:void|JSX\.Element|React\.ReactElement|any)/g, ")");
  cleaned = cleaned.replace(/(\w+)\s*:\s*(?:any|string|number|boolean|object|any\[\]|string\[\])\b/g, "$1");

  // 3. Fix unescaped nested double quotes in string variable definitions
  cleaned = cleaned.replace(/const\s+(\w+)\s*=\s*"([^"\n]*)"([^"\n]+)"([^"\n]*)";/g, (match, varName, p1, inner, p2) => {
    return `const ${varName} = "${p1}${inner}${p2}";`;
  });

  // 4. Ensure Lucide icon imports exist for commonly used icons
  const iconList = ["Sparkles", "Cpu", "Zap", "Layers", "Terminal", "Flame", "TrendingUp", "Award", "CheckCircle", "ArrowRight"];
  const missingIcons = iconList.filter(icon => cleaned.includes(`<${icon}`) && !cleaned.includes(`import`) && !cleaned.includes(icon));
  if (missingIcons.length > 0) {
    if (cleaned.includes("from \"lucide-react\"") || cleaned.includes("from 'lucide-react'")) {
      cleaned = cleaned.replace(/import\s*\{([^}]+)\}\s*from\s*["']lucide-react["']/, (match, p1) => {
        const existing = p1.split(",").map(s => s.trim()).filter(Boolean);
        const combined = [...new Set([...existing, ...missingIcons])].join(", ");
        return `import { ${combined} } from "lucide-react"`;
      });
    } else {
      cleaned = `import { ${missingIcons.join(", ")} } from "lucide-react";\n` + cleaned;
    }
  }

  // 5. Ensure Remotion imports exist if useCurrentFrame / spring / interpolate are used
  if ((cleaned.includes("useCurrentFrame") || cleaned.includes("spring")) && !cleaned.includes("remotion")) {
    cleaned = `import { useCurrentFrame, spring, interpolate } from "remotion";\n` + cleaned;
  }

  return cleaned;
}

// Compile TSX component string to plain JS via Sucrase
function compileTSX(tsxCode) {
  try {
    let cleanedCode = sanitizeTSXCode(tsxCode);

    const { code } = transform(cleanedCode, {
      transforms: ["typescript", "jsx"],
      jsxRuntime: "classic",
      production: false
    });
    return code;
  } catch (err) {
    console.error("[Studio AI Gen] Sucrase Compile Error:", err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SAFETY NET FALLBACK TEMPLATES — one per visual pattern (zero AI dependency)
// ─────────────────────────────────────────────────────────────────────────────

function safetyNetTitleHook(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const alertStr = (scene.alertText || "").replace(/"/g, '\\"');
  return `import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { Sparkles, Zap } from "lucide-react";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const alertText = "${alertStr}";
  const words = headingText.split(" ");
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.22), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "10%", left: "-10%", width: "600px", height: "600px", borderRadius: "50%",
        background: "rgba(59,130,246,0.12)", filter: "blur(100px)",
        transform: "translateY(" + (Math.sin(frame / 25) * 20) + "px)" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(249,115,22,0.12)", filter: "blur(100px)",
        transform: "translateY(" + (Math.cos(frame / 28) * 20) + "px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center",
        gap: "24px", textAlign: "center", padding: "0 80px", height: "78%", justifyContent: "center" }}>
        {alertText ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: 99,
            background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c",
            fontSize: "18px", fontWeight: 700, opacity: sp(5), transform: "scale(" + sp(5) + ")" }}>
            <Sparkles size={18} color="#fb923c" />
            <span>{alertText}</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 18px", borderRadius: 99,
            background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#93c5fd",
            fontSize: "16px", fontWeight: 600, opacity: sp(5), transform: "scale(" + sp(5) + ")" }}>
            <Zap size={16} color="#93c5fd" />
            <span>Studio AI Gen</span>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
          {words.map((w, i) => {
            const wSp = sp(8 + i * 6);
            return (
              <span key={i} style={{ fontSize: "68px", fontWeight: 800, color: "#ffffff", lineHeight: 1.1,
                letterSpacing: "-0.03em", display: "inline-block",
                opacity: wSp, transform: "translateY(" + interpolate(wSp, [0, 1], [40, 0]) + "px)" }}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ width: "120px", height: "3px", background: "linear-gradient(90deg, transparent, #f97316, transparent)",
          opacity: sp(30), borderRadius: "2px" }} />
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}

function safetyNetHeroMetric(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const metric = scene.metrics && scene.metrics[0];
  const heroValue = metric ? `${metric.prefix || ""}${metric.value}${metric.suffix || ""}` : "100%";
  const heroLabel = metric ? String(metric.label || "Số liệu chính").replace(/"/g, '\\"') : "Số liệu chính";
  return `import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12, stiffness: 50 } });
  const heroValue = "${heroValue}";
  const label = "${heroLabel}";
  const headingText = "${safeHeading}";
  const numSp = sp(10);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 40%, rgba(249,115,22,0.18), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(249,115,22,0.12)", filter: "blur(100px)" }} />
      <div style={{ position: "absolute", bottom: "15%", right: "10%", width: "400px", height: "400px", borderRadius: "50%",
        background: "rgba(59,130,246,0.1)", filter: "blur(90px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", gap: "12px" }}>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "18px", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.15em", opacity: sp(5) }}>{label}</div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.3), transparent 70%)", filter: "blur(50px)" }} />
          <div style={{ fontSize: "130px", fontWeight: 900, color: "#f97316",
            textShadow: "0 0 60px rgba(249,115,22,0.7)", fontVariantNumeric: "tabular-nums", zIndex: 2,
            opacity: numSp, transform: "scale(" + interpolate(numSp, [0, 1], [0.6, 1]) + ")" }}>
            {heroValue}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "22px", textAlign: "center",
          maxWidth: "500px", marginTop: "8px", opacity: sp(25) }}>{headingText}</div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}

function safetyNetDualMetric(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const m0 = (scene.metrics && scene.metrics[0]) || { prefix: "", value: "50", suffix: "%", label: "Chỉ số 1" };
  const m1 = (scene.metrics && scene.metrics[1]) || { prefix: "", value: "90", suffix: "%", label: "Chỉ số 2" };
  const v0 = `${String(m0.prefix||"")}${String(m0.value||"50")}${String(m0.suffix||"%")}`;
  const v1 = `${String(m1.prefix||"")}${String(m1.value||"90")}${String(m1.suffix||"%")}`;
  const l0 = String(m0.label||"Chỉ số 1").replace(/"/g,'\\"');
  const l1 = String(m1.label||"Chỉ số 2").replace(/"/g,'\\"');
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { TrendingUp, Award } from "lucide-react";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const metrics = [
    { value: "${v0}", label: "${l0}", color: "#f97316", Icon: TrendingUp },
    { value: "${v1}", label: "${l1}", color: "#60a5fa", Icon: Award }
  ];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.18), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "absolute", top: "15%", left: "20%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(59,130,246,0.1)", filter: "blur(90px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 60px", gap: "28px" }}>
        <div style={{ fontSize: "38px", fontWeight: 800, color: "#ffffff", textAlign: "center",
          letterSpacing: "-0.02em", opacity: sp(5), lineHeight: 1.2 }}>{headingText}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "900px" }}>
          {metrics.map((m, i) => {
            const Icon = m.Icon;
            const cardSp = sp(15 + i * 10);
            return (
              <div key={i} style={{ background: "rgba(8,17,37,0.75)", border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(20px)", borderRadius: "20px", padding: "32px 24px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "14px",
                opacity: cardSp, transform: "scale(" + cardSp + ")" }}>
                <Icon size={32} color={m.color} />
                <div style={{ fontSize: "72px", fontWeight: 900, color: m.color,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{m.value}</div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", textAlign: "center" }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}

function safetyNetComparisonVersus(scene = {}) {
  const safeHeading = (scene.heading || "So sánh").replace(/"/g, '\\"');
  const points = Array.isArray(scene.points) ? scene.points : [];
  const leftPoints = points.filter((_, i) => i % 2 === 0).slice(0, 3);
  const rightPoints = points.filter((_, i) => i % 2 === 1).slice(0, 3);
  const leftJson = JSON.stringify(leftPoints.length > 0 ? leftPoints : ["Phương pháp cũ", "Tốn nhiều thời gian", "Chi phí cao"]);
  const rightJson = JSON.stringify(rightPoints.length > 0 ? rightPoints : ["AI tự động hoá", "Nhanh hơn 10x", "Chi phí thấp"]);
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const leftPoints = ${leftJson};
  const rightPoints = ${rightJson};
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.15), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "absolute", top: "10%", left: "10%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(239,68,68,0.08)", filter: "blur(90px)" }} />
      <div style={{ position: "absolute", top: "10%", right: "10%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(59,130,246,0.08)", filter: "blur(90px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 50px", gap: "24px" }}>
        <div style={{ fontSize: "40px", fontWeight: 800, color: "#ffffff", textAlign: "center",
          opacity: sp(5), letterSpacing: "-0.02em" }}>{headingText}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 1fr", gap: "12px",
          alignItems: "center", width: "100%", opacity: sp(15) }}>
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "18px", padding: "24px 20px" }}>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "18px", marginBottom: "14px" }}>❌ TRƯỚC ĐÂY</div>
            {leftPoints.map((p, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.8)", marginBottom: "10px", fontSize: "17px" }}>• {p}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            width: "52px", height: "52px", borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #3b82f6)", fontWeight: 900, fontSize: "17px", color: "#fff",
            flexShrink: 0 }}>VS</div>
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.45)",
            borderRadius: "18px", padding: "24px 20px" }}>
            <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: "18px", marginBottom: "14px" }}>✅ VỚI AI</div>
            {rightPoints.map((p, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.8)", marginBottom: "10px", fontSize: "17px" }}>• {p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}

function safetyNetProcessTimeline(scene = {}) {
  const safeHeading = (scene.heading || "Quy trình").replace(/"/g, '\\"');
  const points = Array.isArray(scene.points) && scene.points.length > 0 ? scene.points.slice(0, 3) : ["Phân tích yêu cầu", "Xây dựng giải pháp", "Ra mắt sản phẩm"];
  const stepsJson = JSON.stringify(points.map((p, i) => ({ num: i + 1, text: String(p) })));
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const steps = ${stepsJson};
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.18), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "absolute", top: "15%", right: "10%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(59,130,246,0.1)", filter: "blur(90px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 60px", gap: "28px" }}>
        <div style={{ fontSize: "40px", fontWeight: 800, color: "#ffffff", textAlign: "center",
          opacity: sp(5), letterSpacing: "-0.02em" }}>{headingText}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0, width: "100%" }}>
          {steps.map((step, i) => {
            const stepSp = sp(15 + i * 10);
            return (
              <React.Fragment key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: "18px", opacity: stepSp }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%",
                    border: "2px solid #3b82f6", background: "rgba(59,130,246,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "22px", color: "#60a5fa", flexShrink: 0 }}>{step.num}</div>
                  <div style={{ background: "rgba(8,17,37,0.75)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "14px", padding: "16px 20px", flex: 1 }}>
                    <div style={{ color: "#f97316", fontWeight: 700, fontSize: "20px" }}>{step.text}</div>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: "4px", height: "36px",
                    background: "linear-gradient(to bottom, #3b82f6, transparent)",
                    marginLeft: "24px", opacity: stepSp }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}

function safetyNetCodeTerminal(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Code & AI").replace(/"/g, '\\"');
  const safeVoiceover = (scene.voiceover || "").replace(/"/g, '\\"');
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { Terminal, Code, Cpu } from "lucide-react";

export const GeneratedScene = ({ fps = 30 }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.22), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 60px", gap: "24px" }}>
        <div style={{ fontSize: "38px", fontWeight: 800, color: "#ffffff", textAlign: "center", opacity: sp(5) }}>
          {headingText}
        </div>
        <div style={{ width: "100%", maxWidth: "840px", background: "rgba(10,15,30,0.9)", border: "1px solid rgba(59,130,246,0.4)",
          borderRadius: "16px", padding: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)", opacity: sp(15), transform: "scale(" + sp(15) + ")" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#eab308" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#22c55e" }} />
            <div style={{ flex: 1, textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "monospace" }}>hyperframe_diff.tsx</div>
          </div>
          <div style={{ fontFamily: "monospace", fontSize: "16px", color: "#86efac", textAlign: "left", lineHeight: 1.6 }}>
            <div style={{ color: "rgba(255,255,255,0.4)" }}>{"// Analyzing context & rendering dynamic UI"}</div>
            <div>{"+ const engine = new DynamicVisualEngine();"}</div>
            <div>{"+ engine.renderScene(sceneData);"}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}

/**
 * Dispatcher: picks the right safety net template based on scene.visualPattern / scene.visualConcept.
 * Every pattern gets a visually DISTINCT fallback — no more all-same numbered card list.
 */
function generateSafetyNetTSX(scene = {}) {
  const pattern = ((scene.visualPattern || scene.visualConcept || "BULLET_GLASS") + "").toUpperCase();

  if (pattern.includes("CODE") || pattern.includes("TERMINAL") || pattern.includes("DIFF") || pattern.includes("DEV")) {
    return safetyNetCodeTerminal(scene);
  }
  if (pattern.includes("FLOW") || pattern.includes("STEP") || pattern.includes("TIMELINE") || pattern.includes("PROCESS")) {
    return safetyNetProcessTimeline(scene);
  }
  if (pattern.includes("VS") || pattern.includes("COMPARE") || pattern.includes("VERSUS")) {
    return safetyNetComparisonVersus(scene);
  }
  if (pattern.includes("GAUGE") || pattern.includes("METRIC") || pattern.includes("PERCENT") || pattern.includes("RING") || pattern.includes("HERO")) {
    return safetyNetHeroMetric(scene);
  }
  if (pattern.includes("DUAL")) {
    return safetyNetDualMetric(scene);
  }
  if (pattern.includes("HOOK") || pattern.includes("TITLE")) {
    return safetyNetTitleHook(scene);
  }

  // Universal Glass Card Fallback for general bullet list concepts
  return generateGlassCardSafetyNetTSX(scene);
}

// Generate premium multi-card step safety net fallback TSX
function generateGlassCardSafetyNetTSX(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const safeVoiceover = (scene.voiceover || "").replace(/"/g, '\\"');

  const pointsList = (scene?.points && Array.isArray(scene.points) && scene.points.length > 0)
    ? scene.points
    : (scene?.voiceover || "")
        .split(/(?:[1-9]\.\s*|;\s*|\.\s+|\s+thứ\s+(?:nhất|hai|ba):\s*)/i)
        .map(s => s.trim())
        .filter(s => s.length > 8)
        .slice(0, 3);

  const cardItems = pointsList.length > 0 ? pointsList : [safeVoiceover];
  const itemsJson = JSON.stringify(cardItems);
  const alertStr = (scene?.alertText || "").replace(/"/g, '\\"');

  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { Sparkles, Cpu, Zap, Layers } from "lucide-react";

export const GeneratedScene: React.FC<{ fps?: number; scene?: any; subtitlesJson?: any }> = ({ fps = 30 }) => {
  const frame = useCurrentFrame();
  const titleSpr = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 14, stiffness: 55 } });
  const icons = [Cpu, Zap, Layers, Sparkles];

  const headingText = "${safeHeading}";
  const cardItems = ${itemsJson};
  const alertText = "${alertStr}";

  return (
    <div style={{
      width: "100%",
      height: "100%",
      position: "relative",
      overflow: "hidden",
      background: "radial-gradient(circle at 50% 25%, rgba(59, 130, 246, 0.25), transparent 70%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif"
    }}>
      <div style={{
        position: "absolute",
        top: "15%",
        left: "20%",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "rgba(59, 130, 246, 0.15)",
        filter: "blur(90px)",
        transform: "translateY(" + (Math.sin(frame / 20) * 15) + "px)"
      }} />
      <div style={{
        position: "absolute",
        bottom: "20%",
        right: "15%",
        width: "450px",
        height: "450px",
        borderRadius: "50%",
        background: "rgba(249, 115, 22, 0.15)",
        filter: "blur(90px)",
        transform: "translateY(" + (Math.cos(frame / 20) * 15) + "px)"
      }} />

      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "78%",
        padding: "50px 60px 0 60px",
        boxSizing: "border-box",
        zIndex: 10,
        position: "relative",
        gap: "16px"
      }}>
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
          transform: "scale(" + titleSpr + ")",
          textAlign: "center"
        }}>
          {alertText ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              borderRadius: "30px",
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid rgba(249, 115, 22, 0.4)",
              color: "#fb923c",
              fontSize: "18px",
              fontWeight: 700
            }}>
              <Sparkles size={20} color="#fb923c" />
              <span>{alertText}</span>
            </div>
          ) : null}

          <h2 style={{
            fontSize: "44px",
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: "-0.02em"
          }}>
            {headingText}
          </h2>
        </div>

        <div style={{
          width: "100%",
          maxWidth: "920px",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}>
          {cardItems.map((itemText, idx) => {
            const itemSpr = spring({ frame: Math.max(0, frame - (15 + idx * 8)), fps, config: { damping: 14, stiffness: 60 } });
            const IconComp = icons[idx % icons.length];
            const numStr = "0" + (idx + 1);

            return (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                padding: "20px 24px",
                background: "rgba(15, 23, 42, 0.75)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px)",
                borderRadius: "18px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                transform: "scale(" + itemSpr + ")",
                boxSizing: "border-box"
              }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(249,115,22,0.3), rgba(59,130,246,0.3))",
                  border: "1px solid rgba(249,115,22,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#f97316",
                  fontSize: "18px",
                  fontWeight: 800,
                  flexShrink: 0
                }}>
                  {numStr}
                </div>

                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p style={{
                    fontSize: "20px",
                    color: "#ffffff",
                    margin: 0,
                    fontWeight: 600,
                    lineHeight: 1.45
                  }}>
                    {itemText}
                  </p>
                </div>

                <IconComp size={24} color="#93c5fd" style={{ opacity: 0.8, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
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

// Helper to parse multi-scene scripts with timestamp headers (e.g. 0–8s, 8–30s) into distinct text blocks
function parseScriptIntoBlocks(scriptText) {
  if (!scriptText || typeof scriptText !== "string") return [];
  const lines = scriptText.split("\n").map(l => l.trim()).filter(Boolean);
  const blocks = [];
  let currentBlock = [];

  const isHeader = (l) => /^(\d+[\s–-]+\d+s|scene\s+\d+|phân\s+cảnh\s+\d+|cảnh\s+\d+)/i.test(l);

  for (const l of lines) {
    if (isHeader(l) && currentBlock.length > 0) {
      blocks.push(currentBlock.join("\n"));
      currentBlock = [l];
    } else {
      currentBlock.push(l);
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock.join("\n"));
  return blocks;
}

// Phase 1: Planner
async function generateScenePlanForAIGen(genAI, modelName, scriptText, targetLength = "Short (~60s)", patternSlots = []) {
  // Handle flexible signature when scriptText is passed as first argument
  if (Array.isArray(genAI) || typeof genAI === "string") {
    scriptText = genAI;
    genAI = null;
    modelName = null;
    targetLength = "Short (~60s)";
    patternSlots = [];
  }
  if (!Array.isArray(patternSlots)) {
    patternSlots = [];
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!genAI && apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!modelName) {
    modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }
  const options = {
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: AIGEN_PLANNER_SCHEMA,
      maxOutputTokens: 8192,
      temperature: 0.0
    }
  };

  const detectedBlocks = parseScriptIntoBlocks(scriptText);
  const blockCountDirective = detectedBlocks.length > 1
    ? `\n\nCRITICAL MULTI-SCENE COUNT RULE (MANDATORY):\nThe input script contains EXACTLY ${detectedBlocks.length} timestamped/section blocks:\n${detectedBlocks.map((b, i) => `--- BLOCK ${i + 1} ---\n${b}`).join("\n")}\n\nYou MUST output EXACTLY ${detectedBlocks.length} SCENE OBJECTS in the returned JSON array (one scene per block). DO NOT stop after 1 scene!`
    : "";

  const systemInstruction = `
# ROLE
You are a Scene Planner for Studio AI Gen — an AI-powered video production system.

# MISSION
Convert a raw script into a structured list of chronological scenes.
Each scene will be rendered using AI-generated React/Remotion code components following strict design patterns.

# 100% EXACT VOICEOVER & SUBTITLE SEPARATION (MANDATORY & ABSOLUTE)
1. "voiceover" FIELD (FOR SUBTITLE DISPLAY): MUST ALWAYS contain the ORIGINAL script text ("Lời thoại (Gốc)" or the first quoted text in each block). Subtitles on screen MUST render this original text. DO NOT put phonetic reading words in "voiceover"!
2. "voiceoverTts" FIELD (FOR SPEECH TTS AUDIO): The script may provide phonetic reading text in TWO possible formats — you MUST handle BOTH:

   FORMAT A — Table/column format:
   | Lời thoại (Gốc) | Lời thoại (Phiên âm đọc) |
   | "GPT-4, Llama 3" | "Gi-pi-ti Bốn, La-ma 3" |
   → Extract the "Lời thoại (Phiên âm đọc)" column text into "voiceoverTts".

   FORMAT B — Sequential label format (user's current format):
   "[original voiceover text]"
   Lời thoại (Phiên âm đọc)
   "[phonetic voiceover text]"
   → The text in quotes AFTER the "Lời thoại (Phiên âm đọc)" label is the phonetic transcript. Extract it into "voiceoverTts".

   CRITICAL: If EITHER format is detected, you MUST populate "voiceoverTts" with the full, complete phonetic text. NEVER leave it empty if phonetic text is available.
   If no phonetic text is provided in any format, leave "voiceoverTts" empty or omit it.
3. ABSOLUTE BAN ON SUMMARIZING OR TRUNCATING: You MUST NEVER summarize, shorten, truncate, paraphrase, or rewrite the original script text.
4. STRUCTURED SCRIPT PARSING:
   - If the input script contains timestamps (e.g., "0-8s HOOK", "8-16s"), create one scene per timestamp block.
   - Use the "On-screen text" or "B-roll" content to extract short keywords for "heading", "points", and "alertText".
${blockCountDirective}

# HARD CONSTRAINTS
1. Output MUST be a valid JSON array matching the provided Schema.
2. Do not write markdown formatting or preamble. Just return raw JSON.
3. Every scene's voiceover must consist of complete sentences.
4. Keep technical terms in lowercase (e.g. "html", "css", "react"). Acronyms (AI, BA) in ALL CAPS.
5. Never use mathematical symbols (>, <, =) or long dashes in "voiceover". Write them out in natural words.
6. Strip any quotation marks from the start and end of string values (e.g. "voiceover": "Khi các tiến sĩ..." instead of "voiceover": "\"Khi các...\"") to produce strictly valid JSON without unescaped quotes.

# MANDATORY DYNAMIC VISUAL CONCEPT REASONING & ROTATION (CRITICAL & STRICT)
1. DYNAMIC VISUAL REASONING: Analyze the script content of each scene and invent a bespoke, descriptive 'visualPattern' / 'visualConcept' matching the scene's semantic intent.
   Examples of dynamic visual concepts:
   - "CODE_TERMINAL_DIFF": Developer code/terminal window displaying code syntax or diffs.
   - "HORIZON_3STEP_FLOW": Horizontal pipeline flow with connecting arrows (Step 1 ➔ Step 2 ➔ Step 3).
   - "VS_SPLIT_COMPARISON": Split-screen comparison contrasting two sides (Before vs After, Old vs AI).
   - "HERO_METRIC_GAUGE_RING": Large 3D percentage ring centerpiece with animated stat callout.
   - "STAT_GRID_2X2": 2x2 grid matrix of metric tiles with glowing icons and borders.
   - "EDITORIAL_QUOTE_CARD": High-impact editorial quote card with glowing badge.
   - "GLASS_BULLET_LIST": Vertical glassmorphism cards with numbered badges (01, 02, 03).
   - "OUTRO_CTA_PULSE": Outro call-to-action screen with action button and pulse glow.

2. ABSOLUTE VISUAL NON-REPETITION RULE:
   - You MUST NEVER assign the same visualPattern / visualConcept to two consecutive scenes! ('visualPattern[i]' != 'visualPattern[i-1]').
   - Rotate layout structures across all scenes so every single scene feels fresh, dynamic, and unique.

# METRICS FIELDS
Populate metrics, alertText, contextLine, and subtitleCardText for each scene to make the design rich and complete!
  `;

  const slotDirective = patternSlots.length > 0
    ? `\n\nMANDATORY PATTERN ASSIGNMENT — DO NOT DEVIATE (CRITICAL):\n` +
      patternSlots.map((p, i) => `Scene ${i}: MUST use visualPattern "${p}"`).join("\n") +
      `\nYou MUST assign EXACTLY the visualPattern listed above to each scene index. Using any other pattern is FORBIDDEN.`
    : "";

  const userPrompt = `
Script: "${scriptText}"
Target Length: "${targetLength}"
${slotDirective}

Generate a scene plan array following the schema and visualPattern rules.
  `;

  const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash"].filter(m => m !== modelName);
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

/**
 * Heuristic check: does the generated TSX code actually match the expected visual pattern?
 * Returns true if compliant, false if Gemini drifted away from the pattern structure.
 */
function validatePatternCompliance(tsxCode, visualPattern) {
  if (!tsxCode || !visualPattern) return true;
  const pattern = (visualPattern + "").toUpperCase();
  try {
    if (pattern === "TITLE_HOOK") {
      // Must NOT have numbered badges ("01", "02", "03" circles)
      const hasNumberedBadges = /["'`]0[123]["'`]/.test(tsxCode) || /numStr\s*=\s*["'`]0/.test(tsxCode);
      if (hasNumberedBadges) {
        console.warn(`[Compliance] TITLE_HOOK violation: found numbered badge pattern (numbered card list). Rejecting.`);
        return false;
      }
    }
    if (pattern === "DUAL_METRIC_CARDS") {
      // Must have 2-column CSS grid
      const hasGrid = /gridTemplateColumns.*1fr.*1fr/.test(tsxCode);
      if (!hasGrid) {
        console.warn(`[Compliance] DUAL_METRIC_CARDS violation: missing 2-column gridTemplateColumns. Rejecting.`);
        return false;
      }
    }
    if (pattern === "HERO_METRIC_GLOW") {
      // Must have a large font size >= 100px for the hero number
      const hasLargeFont = /fontSize[:\s]+["'`]?1[0-9]{2}/.test(tsxCode) || /fontSize[:\s]+["'`]?[2-9][0-9]{2}/.test(tsxCode);
      if (!hasLargeFont) {
        console.warn(`[Compliance] HERO_METRIC_GLOW violation: no large hero font size (>=100px) found. Rejecting.`);
        return false;
      }
    }
    if (pattern === "COMPARISON_VERSUS") {
      // Must have VS text or a 3-column grid (1fr auto 1fr)
      const hasVS = /\bVS\b/.test(tsxCode) || /gridTemplateColumns.*1fr.*auto.*1fr/.test(tsxCode);
      if (!hasVS) {
        console.warn(`[Compliance] COMPARISON_VERSUS violation: missing VS badge or 3-column grid. Rejecting.`);
        return false;
      }
    }
    if (pattern === "PROCESS_TIMELINE") {
      // Must reference step numbers or a steps.map pattern
      const hasSteps = /step\.num/.test(tsxCode) || /steps\.map/.test(tsxCode) || /step[s]?\.map/.test(tsxCode);
      if (!hasSteps) {
        console.warn(`[Compliance] PROCESS_TIMELINE violation: no step chain (steps.map / step.num) found. Rejecting.`);
        return false;
      }
    }
    return true;
  } catch (e) {
    return true; // if check itself throws, don't block generation
  }
}

async function generateTSXCodeForScene(genAI, modelName, scene, theme = "ai_hub_grid", bgImage = "", refImages = []) {
  const fs = require("fs");
  const path = require("path");
  const vde = require("./vde");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!genAI && apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!modelName) {
    modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }

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

  const patternLockHeader = `
╔══════════════════════════════════════════════════════════════╗
║  🎨 DYNAMIC VISUAL CONCEPT: ${scene.visualConcept || scene.visualPattern || "DYNAMIC_GENERATIVE_UI"}
║  Perform visual reasoning to design a unique, context-aware visual layout.
║  Use UI System Primitives (<GlassContainer>, <GlowBadge>, <CodeTerminal>, <MetricGauge>, <StatCard>, <FlowArrow>, <ComparisonColumn>, <SafeIcon>)
║  to build a rich, error-free, and non-repetitive TSX component layout.
╚══════════════════════════════════════════════════════════════╝
`;

  const systemInstruction = patternLockHeader + `
# ROLE
You are an expert React / Remotion TSX component code generator.

# MISSION
Generate a complete, self-contained React functional component for a 9:16 vertical video scene.
The component MUST follow Remotion physics animations and high-end glassmorphism aesthetic.

# CRITICAL REAL DATA BINDING RULE (MANDATORY & ABSOLUTE - DO NOT VIOLATE)
1. ABSOLUTE BAN ON EXAMPLE TEXT: You MUST NEVER copy, hardcode, or reuse example text strings found in the design reference documentation (such as "NEXT-GEN INFRASTRUCTURE", "Engineered for Scale", "HIGH PERFORMANCE 99.9%", "AES-256", "GraphQL", "$2.590 TỶ ĐÔ", "900tr", "88%", "Chỉ ~6% tổ chức").
2. MANDATORY REAL DATA INJECTION: 100% of all rendered text, headings, statistics, card items, labels, and subtitles in your output TSX MUST come dynamically from the scene payload passed in the user prompt:
   - Main Headline / Title: Use \`scene.heading\` (e.g. \`const headingText = "${scene.heading || "Tiêu đề phân cảnh"}"\`)
   - Card Items / Bullet Points / Metrics: Use \`scene.points\` array (e.g. \`scene.points[0]\`, \`scene.points[1]\`, \`scene.points[2]\`). Render the exact text, title, and values provided in \`scene.points\`.
   - Voiceover & Karaoke Subtitles: Use \`scene.voiceover\`
3. NEVER output generic English infrastructure labels (like "AES-256", "GraphQL", "99.9% Uptime") unless they explicitly appear inside \`scene.heading\`, \`scene.points\`, or \`scene.voiceover\`.

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
   - NO BLUR ON TEXT (MANDATORY & ABSOLUTE): You MUST NEVER apply filter: "blur(...)" or backdropFilter to any heading text, titles, text containers, or text words. filter: "blur(...)" is strictly restricted to background ambient glowing orbs (zIndex: 1). All text elements must remain 100% sharp, crisp, unblurred, and readable at all times!

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

9. Prevent Overlaps & Layering (CRITICAL - 80% TOP BOUNDARY RULE):
   - Content Height Boundary: All main visual content (headings, badges, cards, split columns, terminal boxes) MUST fit strictly within the TOP 78% of the viewport (y = 0 to 1497px). The bottom 22% (y = 1498px to 1920px) is strictly reserved as the Subtitle Safe Zone.
   - Force Vertical Centering Container: Wrap all core visual components inside a single vertical Flexbox container:
     * Use exactly this style pattern for the main centering wrapper:
       display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "78%", maxHeight: "1497px", padding: "60px 60px 0 60px", boxSizing: "border-box", zIndex: 10
   - Card/Panel Height Limits: All cards, columns, and grid items MUST use maxHeight: "920px" or maxHeight: "50vh" (never unconstrained height: "100%" that bleeds down into the subtitle zone).
   - Prohibit Absolute Component Overlaps: Every content element (headings, sub-labels, cards, gauges, buttons, terminals) must have its own dedicated, non-overlapping layout space. Do not place elements absolute on top of each other.
   - Safe Margin & Clipping Avoidance: Enforce a minimum horizontal padding/margin of at least 80px on the left and right sides of the screen for all text and card containers. No component or text block should extend beyond these boundaries to prevent horizontal clipping.

10. Mandatory Glass Cards & Ambient Glowing Background (NO BLACK SCREENS):
    - Absolute Ban on Plain Black Screens: Every generated TSX component MUST render a rich ambient background (e.g., \`background: "radial-gradient(circle at 50% 25%, rgba(59, 130, 246, 0.2), transparent 70%), #030712"\`) AND 2 floating blurred glowing ambient orbs (\`filter: "blur(80px)"\`, \`opacity: 0.15\`, animated float/pan).
    - Mandatory Glass Cards: For \`BULLET_GLASS\`, \`DUAL_METRIC_CARDS\`, or \`HERO_METRIC_GLOW\`, you MUST render 2 to 3 glassmorphic cards (\`background: THEME.cardBg\`, \`border: THEME.border\`, \`backdropFilter: "blur(16px)"\`, \`borderRadius: THEME.radius\`). Never render a solitary text heading in the center of an empty screen!

# HARD RULES
1. MANDATORY ROOT CONTAINER HEIGHT & FULLSCREEN FIT:
   The outermost root JSX element MUST use <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden", ... }}> (or <AbsoluteFill>).
   NEVER omit width: "100%", height: "100%" on the root container!

2. ALLOWED IMPORTS & NO ALIAS SYNTAX:
   Always start your TSX code with these exact import statements:
   import React from "react";
   import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
   import { Zap, Cpu, Shield, Sparkles, TrendingUp, Award, Layers, Terminal, Database, Activity, CheckCircle, Flame, Star, Rocket, Target, BarChart2 } from "lucide-react";

   Rules for imports:
   - Import icons using their exact exported names (e.g., Terminal, Zap, Shield). Never use import alias or renaming syntax.
   - You ARE ALLOWED and ENCOURAGED to use Lucide React icons! Place them inside glass cards, pills, badges, and metric counters (e.g. <Zap size={28} color={THEME.orange} /> or <Shield size={24} color={THEME.accent} />).
   - Do NOT import any other unlisted external packages or local relative paths.

3. Component Signature MUST be EXACTLY:
   export const GeneratedScene: React.FC<{ fps?: number; scene?: any; subtitlesJson?: any }> = ({ fps = 30, scene = {}, subtitlesJson = [] }) => {
     const frame = useCurrentFrame();
     // ...
     return ( ... );
   };
   export default GeneratedScene;

4. Canvas Size: 1080px width × 1920px height (9:16 vertical).
   All styles MUST be inline React style objects. No CSS class names.

5. Theme Colors (Inject these exact color variables into your generated inline style mapping):
${themeTokensText}

5. Animation Rules (Remotion Physics):
   Always create smooth entrance animations using spring():
   const sp = (delayFrames = 0, damping = 14, stiffness = 55) =>
     spring({ frame: Math.max(0, frame - delayFrames), fps, config: { damping, stiffness, mass: 1.0 } });

6. Pattern Layout Specs — MANDATORY JSX SKELETON (you MUST follow the DOM structure below for the assigned visualPattern):

scene.visualPattern === "TITLE_HOOK":
  STRUCTURE: Single full-screen centered column. TOP: a glowing capsule pill badge (e.g. "[🔥 XU HƯỚNG MỚI]"). MIDDLE: a giant 2-3 line heading split into individual words with staggered spring scale/translateY entrance (fontSize: 64-80px, fontWeight: 800). BOTTOM: a thin horizontal divider line (2px, accent gradient) + a small subtitle context label. NO glass cards. NO numbered lists. NO metrics.
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:24}}>
    <div style={{background:"linear-gradient(...)",borderRadius:99,padding:"6px 18px"}}>[badge text]</div>
    <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:8}}>{words.map(w => <span style={{fontSize:72,fontWeight:800,...springAnimation}}>w</span>)}</div>
    <div style={{width:120,height:2,background:"linear-gradient(90deg,transparent,THEME.accent,transparent)"}}/>
  </div>

scene.visualPattern === "BULLET_GLASS":
  STRUCTURE: Vertical stack of 2-3 glass cards. Each card has a LEFT circular badge ("01","02","03" on orange circle) + RIGHT text content. Cards stack vertically with staggered entrance delay.
  <div style={{display:"flex",flexDirection:"column",gap:16,width:"100%"}}>
    {items.map((item,i) => (
      <div style={{display:"flex",alignItems:"center",gap:16,background:THEME.cardBg,backdropFilter:"blur(16px)",borderRadius:THEME.radius,border:THEME.border,padding:"18px 20px"}}>
        <div style={{width:44,height:44,borderRadius:"50%",background:"#f97316",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800}}>0{i+1}</div>
        <span style={{color:"#fff",fontSize:22,flex:1}}>{item}</span>
      </div>
    ))}
  </div>

scene.visualPattern === "COMPARISON_VERSUS":
  STRUCTURE: TWO side-by-side columns separated by a central "VS" badge. LEFT column: dark red/gray border card labeled "TRƯỚC ĐÂY". RIGHT column: bright cyan/green border card labeled "SAU NÀY / AI". Must be a 2-column grid layout — NOT a vertical stack. Each column has a header label + 2-3 bullet points inside.
  <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:12,alignItems:"center",width:"100%"}}>
    <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.4)",borderRadius:THEME.radius,padding:20}}>
      <div style={{color:"#ef4444",fontWeight:700,marginBottom:12}}>❌ TRƯỚC ĐÂY</div>
      {leftPoints.map(p => <div style={{color:"rgba(255,255,255,0.8)",marginBottom:8}}>• {p}</div>)}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#f97316,#3b82f6)",fontWeight:900,fontSize:18}}>VS</div>
    <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.5)",borderRadius:THEME.radius,padding:20}}>
      <div style={{color:"#60a5fa",fontWeight:700,marginBottom:12}}>✅ SAU NÀY</div>
      {rightPoints.map(p => <div style={{color:"rgba(255,255,255,0.8)",marginBottom:8}}>• {p}</div>)}
    </div>
  </div>

scene.visualPattern === "PROCESS_TIMELINE":
  STRUCTURE: Vertical chain of 2-3 step nodes connected by animated gradient lines. Each step node is a HORIZONTAL row: LEFT circle badge with step number → RIGHT step content box. Between steps: a thin vertical gradient line (4px width, height 40px) to represent the connection arrow.
  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-start",gap:0,width:"100%",paddingLeft:20}}>
    {steps.map((step,i) => (<>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:52,height:52,borderRadius:"50%",border:"2px solid THEME.accent",background:"rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:22,color:THEME.accent,flexShrink:0}}>{i+1}</div>
        <div style={{background:THEME.cardBg,border:THEME.border,borderRadius:12,padding:"14px 18px",flex:1}}>
          <div style={{color:THEME.orange,fontWeight:700,fontSize:20,marginBottom:4}}>{step.title}</div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:16}}>{step.desc}</div>
        </div>
      </div>
      {i < steps.length-1 && <div style={{width:4,height:36,background:"linear-gradient(to bottom,THEME.accent,transparent)",marginLeft:24}}/>}
    </>))}
  </div>

scene.visualPattern === "DONUT_GAUGE":
  STRUCTURE: Center-dominant SVG donut ring with animated stroke. NO glass card list. Just: top label → giant SVG circle (200-220px diameter, 18-22px stroke) → center animated % number → bottom description label.
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
    <div style={{color:THEME.textSec,fontSize:18,textTransform:"uppercase",letterSpacing:"0.1em"}}>{scene.metrics[0]?.label}</div>
    <svg width={220} height={220} style={{transform:"rotate(-90deg)"}}>
      <circle cx={110} cy={110} r={90} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={20}/>
      <circle cx={110} cy={110} r={90} fill="none" stroke={THEME.orange} strokeWidth={20} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={circ*(1-progress*pct/100)}/>
    </svg>
    <div style={{marginTop:-190,fontSize:72,fontWeight:900,color:THEME.orange}}>{Math.round(progress*pct)}%</div>
  </div>

scene.visualPattern === "DUAL_METRIC_CARDS":
  STRUCTURE: Exactly 2 glass cards placed SIDE BY SIDE (2-column grid). Each card: top icon → big animated number (~72px) → bottom label. Must be horizontal layout, NOT vertical stack.
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,width:"100%"}}>
    {scene.metrics.slice(0,2).map((m,i) => (
      <div style={{background:THEME.cardBg,backdropFilter:"blur(16px)",border:THEME.border,borderRadius:THEME.radius,padding:"28px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <LucideIcon size={32} color={i===0?THEME.orange:THEME.accent}/>
        <div style={{fontSize:72,fontWeight:900,color:i===0?"#f97316":"#60a5fa",fontVariantNumeric:"tabular-nums"}}>{animatedValue}</div>
        <div style={{color:THEME.textSec,fontSize:16,textAlign:"center"}}>{m.label}</div>
      </div>
    ))}
  </div>

scene.visualPattern === "HERO_METRIC_GLOW":
  STRUCTURE: Single large glowing number centered on screen. Top: small eyebrow label → Middle: ONE enormous metric number (120-140px) with radial glow behind it → Bottom: context description line. NO cards. NO lists. Pure hero centerpiece.
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,position:"relative"}}>
    <div style={{color:THEME.textSec,fontSize:16,textTransform:"uppercase",letterSpacing:"0.15em"}}>{eyebrow}</div>
    <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{position:"absolute",width:260,height:260,borderRadius:"50%",background:"radial-gradient(circle,rgba(249,115,22,0.25),transparent 70%)",filter:"blur(40px)"}}/>
      <div style={{fontSize:130,fontWeight:900,color:"#f97316",textShadow:"0 0 60px rgba(249,115,22,0.8)",fontVariantNumeric:"tabular-nums",zIndex:2}}>{heroValue}</div>
    </div>
    <div style={{color:"rgba(255,255,255,0.7)",fontSize:20,textAlign:"center",maxWidth:400}}>{contextDesc}</div>
  </div>

scene.visualPattern === "STAT_GRID_2X2":
  STRUCTURE: 2×2 grid of 4 equal metric tiles. Each tile: top Lucide icon + middle animated number + bottom label. ALL 4 tiles must be visible at once inside a 2-column grid.
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gridTemplateRows:"1fr 1fr",gap:12,width:"100%"}}>
    {scene.metrics.slice(0,4).map((m,i) => (
      <div style={{background:THEME.cardBg,border:THEME.border,borderRadius:THEME.radius,padding:"20px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <LucideIcon size={28} color={THEME.accent}/>
        <div style={{fontSize:44,fontWeight:900,color:THEME.orange}}>{m.value}{m.suffix}</div>
        <div style={{color:THEME.textSec,fontSize:13,textAlign:"center"}}>{m.label}</div>
      </div>
    ))}
  </div>

scene.visualPattern === "QUOTE_NATURE_CARD":
  STRUCTURE: Single centered editorial card. Top: a "📄 NATURE / SIGGRAPH 2024" source badge pill. Middle: a large opening quotation mark (") followed by the quote text in italic. Bottom: author attribution line ("— AuthorName, Journal"). No numbered lists. No metrics.
  <div style={{background:THEME.cardBg,border:"1px solid rgba(59,130,246,0.3)",borderRadius:20,padding:"36px 32px",display:"flex",flexDirection:"column",gap:20,width:"100%",backdropFilter:"blur(20px)"}}>
    <div style={{display:"flex",alignSelf:"flex-start",background:"rgba(59,130,246,0.15)",border:"1px solid rgba(59,130,246,0.4)",borderRadius:99,padding:"4px 14px",fontSize:13,color:THEME.accent}}>📄 {sourceBadge}</div>
    <div style={{fontSize:56,fontWeight:900,color:THEME.orange,lineHeight:0.8,marginBottom:-10}}>"</div>
    <div style={{fontSize:22,fontStyle:"italic",color:"rgba(255,255,255,0.9)",lineHeight:1.6}}>{quoteText}</div>
    <div style={{color:THEME.textSec,fontSize:15,borderTop:"1px solid rgba(255,255,255,0.08)",paddingTop:16}}>— {authorAttribution}</div>
  </div>

scene.visualPattern === "ENDING_CTA":
  STRUCTURE: Full-screen centered call-to-action. Top: a short motivational tag line → Middle: a giant animated headline (80-100px) → Bottom: 1-2 large glowing orange action buttons with scale-bounce animations. NO glass cards. NO lists. NO metrics numbers.
  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:28,textAlign:"center"}}>
    <div style={{color:THEME.textSec,fontSize:18,letterSpacing:"0.1em",textTransform:"uppercase"}}>{tagline}</div>
    <div style={{fontSize:90,fontWeight:900,color:"#ffffff",lineHeight:1.05,textShadow:"0 0 40px rgba(249,115,22,0.3)"}}>{headline}</div>
    <div style={{marginTop:16,padding:"18px 44px",background:"linear-gradient(90deg,#f97316,#fb923c)",borderRadius:99,fontSize:22,fontWeight:800,color:"#fff",boxShadow:"0 0 40px rgba(249,115,22,0.6)",transform:\`scale(\${ctaSpring})\`}}>{ctaText}</div>
  </div>

CRITICAL: You MUST use the exact DOM structure skeleton matching scene.visualPattern above. DO NOT substitute a different structure. NEVER render plain glass bullet cards for patterns that are NOT BULLET_GLASS.

   - Top 80% Height Safe Zone & Subtitle Exclusion (CRITICAL & MANDATORY):
      * DO NOT generate subtitle components or subtitle Karaoke code inside your TSX output. Subtitles are rendered externally by the master video framework.
      * Wrap all visual content (headings, badges, cards, donut gauges, statistics, CTA buttons) inside a single main container positioned at the top 80% of screen height:
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "80%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "60px 60px 0 60px", boxSizing: "border-box", zIndex: 10 }}>
      * Leave the bottom 20% area (from bottom: 0 to bottom: 20%) completely clean and empty so external subtitles do not collide with your visual layout elements!

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

  const fallbacks = ["gemini-2.5-flash", "gemini-2.0-flash"].filter(m => m !== modelName);
  const result = await generateContentWithFallback(genAI, options, { systemInstruction, userPrompt, imageParts }, fallbacks);
  let text = result.response.text().trim();
  text = cleanAndExtractCode(text);
  return text;
}

// Orchestrator function
/**
 * Assigns a unique visual pattern to each scene index in a video.
 * No pattern repeats across the entire video.
 * Scene 0 → TITLE_HOOK (opening), last scene (N>=3) → ENDING_CTA.
 * Middle scenes pulled from shuffled pool without repetition.
 */
function assignPatternSlots(sceneCount) {
  const ALL_PATTERNS = [
    "TITLE_HOOK", "DUAL_METRIC_CARDS", "HERO_METRIC_GLOW", "COMPARISON_VERSUS",
    "PROCESS_TIMELINE", "DONUT_GAUGE", "STAT_GRID_2X2", "QUOTE_NATURE_CARD",
    "BULLET_GLASS", "ENDING_CTA"
  ];
  if (sceneCount <= 0) return [];
  if (sceneCount === 1) return ["TITLE_HOOK"];
  if (sceneCount === 2) return ["TITLE_HOOK", "ENDING_CTA"];

  const slots = new Array(sceneCount).fill(null);
  slots[0] = "TITLE_HOOK";
  slots[sceneCount - 1] = "ENDING_CTA";

  // Pool for middle scenes — exclude already pinned
  const pinned = new Set(["TITLE_HOOK", "ENDING_CTA"]);
  const pool = ALL_PATTERNS.filter(p => !pinned.has(p));

  // Deterministic shuffle using scene count as seed (stable across reruns)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (i * 7 + sceneCount * 3) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let poolIdx = 0;
  for (let i = 1; i < sceneCount - 1; i++) {
    slots[i] = pool[poolIdx % pool.length];
    poolIdx++;
  }

  return slots;
}

async function generateAIGenStoryboard({ script, targetLength = "Short (~60s)", theme = "ai_hub_grid", voiceKey = "duythanh", bgImage = "", refImages = [], projectId = null }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong backend .env");
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  if (modelName === "gemini-3.5-flash" || modelName === "gemini-2.0-flash") {
    modelName = "gemini-3.6-flash";
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log(`[Studio AI Gen] Bắt đầu khởi tạo Studio AI Gen với model: ${modelName}`);

  // Step 1: Pre-assign unique pattern slots (Component B — Full-Video Rotation)
  const scriptBlocks = parseScriptIntoBlocks(script);
  const expectedSceneCount = scriptBlocks.length > 1 ? scriptBlocks.length : 5;
  const patternSlots = assignPatternSlots(expectedSceneCount);
  console.log(`[Studio AI Gen] Pre-assigned pattern slots (${expectedSceneCount} scenes): ${patternSlots.join(", ")}`);

  // Step 2: Generate Scene Plan with slot directives injected
  const scenePlan = await generateScenePlanForAIGen(genAI, modelName, script, targetLength, patternSlots);
  console.log(`[Studio AI Gen] Phase 1 hoàn tất: ${scenePlan.length} phân cảnh được tạo.`);


  // Step 3: Post-process — normalize visual concepts and enforce non-consecutive duplicate guard
  for (let i = 0; i < scenePlan.length; i++) {
    const scene = scenePlan[i];
    scene.visualPattern = normalizeVisualPattern(scene.visualPattern || scene.visualConcept);
    scene.visualConcept = scene.visualPattern;

    // Consecutive duplicate guard: if scene[i] matches scene[i-1], differentiate it
    if (i > 0 && scenePlan[i].visualPattern === scenePlan[i - 1].visualPattern) {
      scene.visualPattern = `${scene.visualPattern}_ALT_${i + 1}`;
      scene.visualConcept = scene.visualPattern;
      console.warn(`[Studio AI Gen] ⚠️ Consecutive duplicate guard: Scene ${i} pattern was duplicate of Scene ${i - 1}, updated to '${scene.visualPattern}'`);
    }
  }

  // Step 3: Generate TSX Code & Compile per scene sequentially (to prevent rate limits and 503 errors)
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!genAI && apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  if (!modelName) {
    modelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  }

  // Auto-backfill points if missing or empty for BULLET_GLASS or DUAL_METRIC_CARDS
  if ((!scene.points || scene.points.length === 0) && scene.voiceover) {
    const clauses = scene.voiceover.split(/[,.;?!]+/).map(s => s.trim()).filter(s => s.length > 5);
    if (clauses.length > 1) {
      scene.points = clauses.slice(0, 3);
    } else {
      scene.points = [scene.heading || "Kỷ nguyên AI-Native", "Tự động hóa 70% quy trình mã nguồn"];
    }
  }

  // Calculate duration frames (word count / 2.7 * 30 fps, min 120 frames = 4s)
  const wordCount = (scene.voiceover || "").trim().split(/\s+/).length;
  const durationSec = Math.max(4.0, wordCount / 2.7);
  const durationFrames = Math.round(durationSec * 30);
  scene.durationFrames = durationFrames;

  // Execute TTS generation AND Gemini TSX code generation in PARALLEL
  const ttsTask = (async () => {
    if (!scene.voiceover && !scene.voiceoverTts) return null;
    try {
      let textToRead;
      if (scene.voiceoverTts) {
        // voiceoverTts is ALREADY a phonetic Vietnamese transcript — bypass phoneme optimizer
        // to avoid re-processing hand-written phonemes like "Gi-pi-ti Bốn" → wrong output
        textToRead = scene.voiceoverTts;
        console.log(`[Studio AI Gen] Scene ${index}: using voiceoverTts directly (skipping phoneme optimizer)`);
      } else {
        // voiceover is raw original text with English terms (GPT-4, Llama 3 etc.)
        // → run phoneme optimizer to transliterate English to Vietnamese phonetics
        textToRead = await phoneme.optimizeTextForPhonemes(scene.voiceover, projectId);
        console.log(`[Studio AI Gen] Scene ${index}: optimized voiceover phonemes for TTS`);
      }
      return await tts.generateTTS(textToRead, projectId || "aigen_proj", `scene_${index}_${Date.now()}`, `omnivoice_${voiceKey}`);
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
      scene.durationFrames = Math.round((audioDuration + 0.25) * 30);
      scene.duration = (scene.durationFrames / 30).toFixed(2);
    }
    try {
      const absoluteAudioPath = path.join(__dirname, "../public", audioUrl);
      subtitlesJson = await aligner.getWordTimestamps(absoluteAudioPath, scene.voiceover, audioDuration);
      scene.subtitlesJson = subtitlesJson;
      scene.voiceoverTtsJson = subtitlesJson;
    } catch (alignErr) {
      console.warn(`[Studio AI Gen] Lỗi căn lề phụ đề cho scene ${index}:`, alignErr.message);
    }
  }

  // Process TSX Code result
  let tsxCode = "";
  let compiledJS = "";

  // Safety net patterns rotate by scene index so each fallback looks different
  const SAFETY_NET_PATTERNS = ["BULLET_GLASS", "PROCESS_TIMELINE", "STAT_GRID_2X2", "QUOTE_NATURE_CARD", "DUAL_METRIC_CARDS", "HERO_METRIC_GLOW"];
  const safetyNetPattern = scene.visualPattern || SAFETY_NET_PATTERNS[index % SAFETY_NET_PATTERNS.length];

  if (tsxResult.status === "fulfilled" && tsxResult.value) {
    tsxCode = tsxResult.value;
    compiledJS = compileTSX(tsxCode);

    // Component C: Pattern compliance validation — reject AI output that ignores the locked pattern
    if (compiledJS && !validatePatternCompliance(tsxCode, scene.visualPattern)) {
      console.warn(`[Studio AI Gen] ⚠️ Compliance FAIL for scene ${index} (${scene.visualPattern}). Using pattern safety net template instead.`);
      tsxCode = generateSafetyNetTSX(scene);
      compiledJS = compileTSX(tsxCode);
    }

    if (!compiledJS) {
      console.warn(`[Studio AI Gen] Lỗi biên dịch đầu tiên cho scene ${index}. Kích hoạt Safety Net Fallback (pattern: ${safetyNetPattern})...`);
      tsxCode = generateSafetyNetTSX(scene);
      compiledJS = compileTSX(tsxCode);
    }
  }

  // Safety net fallback if compiledJS is still empty
  if (!compiledJS) {
    console.warn(`[Studio AI Gen] 🛡️ Activating Pattern Safety Net for scene ${index} (pattern: ${scene.visualPattern || 'BULLET_GLASS'}, heading: "${scene.heading || 'Scene'}")`);
    tsxCode = generateSafetyNetTSX(scene);
    compiledJS = compileTSX(tsxCode);
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
    duration: (scene.durationFrames / 30).toFixed(2),
    subtitlesJson
  };
}

function validateCompiledJS(compiledJS) {
  if (!compiledJS || typeof compiledJS !== "string" || compiledJS.trim() === "") {
    return { isValid: false, error: "Compiled JS is empty" };
  }

  const { transform } = require("sucrase");
  try {
    // Transform ES imports/exports to CommonJS for Node VM execution
    const { code: cjsCode } = transform(compiledJS, {
      transforms: ["imports"]
    });

    const vm = require("vm");
    const mockExports = {};
    const context = vm.createContext({
      module: { exports: mockExports },
      exports: mockExports,
      require: (mod) => {
        if (["react", "remotion", "lucide-react"].includes(mod)) return {};
        throw new Error(`Cannot find module '${mod}'`);
      }
    });

    vm.runInContext(cjsCode, context, { timeout: 100 });
    const comp = mockExports.default || mockExports.GeneratedScene;
    if (!comp) {
      return { isValid: false, error: "Compiled JS does not export default or GeneratedScene component" };
    }
    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: `Module Validation Failure: ${err.message}` };
  }
}

module.exports = {
  generateAIGenStoryboard,
  generateScenePlanForAIGen,
  generateSingleSceneCode,
  compileTSX,
  sanitizeTSXCode,
  generateSafetyNetTSX,
  validateGeneratedCode,
  validateCompiledJS
};


