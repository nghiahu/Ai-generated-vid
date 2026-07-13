const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const vde = require("./vde");
const phoneme = require("./phoneme");

function repairJsonQuotes(jsonStr) {
  let output = "";
  let inString = false;
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (char === '\\') {
      output += char;
      if (i + 1 < jsonStr.length) {
        output += jsonStr[i + 1];
        i++;
      }
      continue;
    }
    
    if (char === '\n' && inString) {
      output += '\\n';
      continue;
    }
    
    if (char === '\r' && inString) {
      continue;
    }
    
    if (char === '"') {
      if (!inString) {
        inString = true;
        output += char;
      } else {
        // Check if this is the closing quote
        let isClosing = false;
        let j = i + 1;
        while (j < jsonStr.length) {
          const nextChar = jsonStr[j];
          if (nextChar === ' ' || nextChar === '\t' || nextChar === '\n' || nextChar === '\r') {
            j++;
            continue;
          }
          if (nextChar === ',' || nextChar === ':' || nextChar === '}' || nextChar === ']' || nextChar === '/') {
            isClosing = true;
          }
          break;
        }
        
        if (j >= jsonStr.length) {
          isClosing = true;
        }
        
        if (isClosing) {
          inString = false;
          output += char;
        } else {
          output += '\\"';
        }
      }
    } else {
      output += char;
    }
  }
  
  return output;
}

function repairTruncatedJson(jsonStr) {
  let inString = false;
  let bracketStack = [];
  
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    
    if (char === '\\') {
      if (i + 1 < jsonStr.length) {
        i++;
      }
      continue;
    }
    
    if (char === '"') {
      if (!inString) {
        inString = true;
      } else {
        // Check if this is the closing quote
        let isClosing = false;
        let j = i + 1;
        while (j < jsonStr.length) {
          const nextChar = jsonStr[j];
          if (nextChar === ' ' || nextChar === '\t' || nextChar === '\n' || nextChar === '\r') {
            j++;
            continue;
          }
          if (nextChar === ',' || nextChar === ':' || nextChar === '}' || nextChar === ']' || nextChar === '/') {
            isClosing = true;
          }
          break;
        }
        if (j >= jsonStr.length) {
          isClosing = true;
        }
        if (isClosing) {
          inString = false;
        }
      }
    } else if (!inString) {
      if (char === '{') {
        bracketStack.push('{');
      } else if (char === '}') {
        if (bracketStack[bracketStack.length - 1] === '{') {
          bracketStack.pop();
        }
      } else if (char === '[') {
        bracketStack.push('[');
      } else if (char === ']') {
        if (bracketStack[bracketStack.length - 1] === '[') {
          bracketStack.pop();
        }
      }
    }
  }
  
  let repaired = jsonStr;
  if (inString) {
    repaired += '"';
  }
  
  // Remove any trailing comma that would cause syntax error before closing braces
  let trimmed = repaired.trim();
  while (trimmed.endsWith(',')) {
    trimmed = trimmed.slice(0, -1).trim();
  }
  repaired = trimmed;
  
  // Close any open braces and brackets
  for (let k = bracketStack.length - 1; k >= 0; k--) {
    const openChar = bracketStack[k];
    if (openChar === '{') {
      repaired += '}';
    } else if (openChar === '[') {
      repaired += ']';
    }
  }
  
  return repaired;
}

const STORYBOARD_SCHEMA = {
  type: SchemaType.ARRAY,
  description: "List of visual scenes parsed from the script",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      sceneIntent: {
        type: SchemaType.OBJECT,
        description: "The visual intent and context descriptors for the scene layout selection",
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
      heading: {
        type: SchemaType.STRING,
        description: "A short, engaging heading for the scene in Vietnamese"
      },
      points: {
        type: SchemaType.ARRAY,
        description: "List of bullet points or interactive items shown on the layout",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              description: "Must be one of: 'card', 'terminal', 'metric', 'logo_row', 'badge_row', 'button', 'subheader'"
            },
            text: {
              type: SchemaType.STRING,
              description: "The text content for this point in Vietnamese (optional for metric if value and subtext are used)"
            },
            animation: {
              type: SchemaType.STRING,
              description: "Must be one of: 'slide-up', 'scale-in', 'fade-in', 'blur-in', 'slide-left', 'slide-right'"
            },
            delay: {
              type: SchemaType.NUMBER,
              description: "Float value representing the second offset at which the point appears (e.g. 0.5, 2.0)"
            },
            logos: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Optional array of logo strings, e.g., ['claude', 'react'] (only for logo_row type)"
            },
            badges: {
              type: SchemaType.ARRAY,
              items: { type: SchemaType.STRING },
              description: "Optional array of badge text strings (only for badge_row type)"
            },
            value: {
              type: SchemaType.STRING,
              description: "Optional metric value (only for metric type)"
            },
            subtext: {
              type: SchemaType.STRING,
              description: "Optional metric subtext (only for metric type)"
            }
          },
          required: ["type"]
        }
      },
      voiceover: {
        type: SchemaType.STRING,
        description: "Vietnamese speech text read aloud. Technical English terms (html, css, react, api) must remain lowercase English."
      },
      duration: {
        type: SchemaType.NUMBER,
        description: "Estimated duration in seconds (float)"
      },
      placement: {
        type: SchemaType.STRING,
        description: "Must be 'Full' or 'Split'"
      },
      keywords: {
        type: SchemaType.STRING,
        description: "1-3 English keywords for Unsplash search based on the visual layout"
      },
      theme: {
        type: SchemaType.STRING,
        description: "Visual overlay theme: 'default', 'tech', 'japan', 'finance', 'rikkei'"
      },
      accentColor: {
        type: SchemaType.STRING,
        description: "Vibrant HEX color (e.g., '#FFB7C5', '#A8232A')"
      }
    },
    required: [
      "sceneIntent", "heading", "points", "voiceover",
      "duration", "placement", "keywords", "theme", "accentColor"
    ]
  }
};

async function generateStoryboard(scriptText, visualStyle = "minimal", traits = [], targetLength = "Short (~60s)") {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong tệp .env. Vui lòng kiểm tra lại cấu hình Backend.");
  }

  let modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  
  // Safe fallback: Gemini 3.5 doesn't exist on Google AI Studio API yet.
  // Fallback to gemini-2.5-flash which is free, fast, and has higher rate limits.
  if (modelName.includes("3.5")) {
    console.warn(`[Gemini API] Model "${modelName}" không tồn tại. Tự động chuyển về "gemini-2.5-flash" để chạy ổn định.`);
    modelName = "gemini-2.5-flash";
  }

  // Retrieve Design DNA and guidelines for the selected visual style
  const stylePrompt = vde.getStylePrompt(visualStyle, traits);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log(`[Gemini API] Khởi tạo model: ${modelName} cho phong cách thiết kế VDE: ${visualStyle} với thời lượng mục tiêu: ${targetLength}`);
    let model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: STORYBOARD_SCHEMA,
        maxOutputTokens: 8192
      }
    });

    const prompt = `
      You are an expert AI video producer. Parse the following raw script text into a structured storyboard (scenes).
      
      CRITICAL TARGET LENGTH: The user has requested a video of length: "${targetLength}".
      - "Short (~60s)": Keep the storyboard concise. Total speech across all scenes should be around 50-60 seconds. Average voiceover speed is 2.5 - 3 words per second, so total words should be around 130-150 words.
      - "Medium (~120s)": Allow more elaboration. Total speech across all scenes should be around 110-120 seconds. Total words should be around 280-320 words.
      - "Long (~180s)": Provide detailed explanation. Total speech across all scenes should be around 170-180 seconds. Total words should be around 420-480 words.
      
      If the raw script is too long for the chosen length, you MUST summarize and condense the voiceover text in each scene to fit within the word budget corresponding to the requested "${targetLength}" length. Do NOT exceed the word limit.
      
      CRITICAL: You must follow the visual design rules of the chosen style "${visualStyle}" described in the Visual Design Engine rulebook below:

      =========================================
      [VISUAL DESIGN ENGINE RULEBOOK - ${visualStyle.toUpperCase()}]
      ${stylePrompt}
      =========================================

      For each scene, determine the visual intent (sceneIntent), theme, accent color, and estimate duration (assume 2.7 Vietnamese words per second).
      
      Raw Script:
      "${scriptText}"
      
      You must respond with a JSON array of scene objects matching this JSON Schema:
      [
        {
          "sceneIntent": {
            "type": "opening" | "comparison" | "metric" | "list" | "quote" | "timeline" | "media" | "ending",
            "importance": "high" | "medium" | "low",
            "density": "dense" | "medium" | "sparse",
            "emotion": "exciting" | "serious" | "informative" | "neutral"
          },
          "heading": "Scene title/heading in Vietnamese",
          "points": [
            {
              "type": "card", // Required type. Allowed values: "card", "terminal", "metric", "logo_row", "badge_row", "button", "subheader"
              "text": "The main text content, or terminal command, or button label, or subheader label. Keep it simple and descriptive in Vietnamese.",
              "animation": "slide-up", // Required animation. Allowed values: "slide-up", "scale-in", "fade-in", "blur-in", "slide-left", "slide-right"
              "delay": 0.5, // Estimated offset in seconds from the start of this scene (number, e.g. 1.8) indicating when the voice speaks this point. Delays should be spaced out (e.g., 0.5, 2.0, 3.5) and strictly less than the scene duration. Ensure the first point starts around 0.5s.
              "logos": ["claude"], // Optional array of strings (ONLY for "logo_row" type). Allowed: "claude", "remotion", "youtube", "tiktok", "react", "nodejs", "python", "aws", "gemini", "openai"
              "badges": ["Mẹo"], // Optional array of strings (ONLY for "badge_row" type)
              "value": "+85%", // Optional string (ONLY for "metric" type)
              "subtext": "tăng tốc" // Optional string (ONLY for "metric" type)
            }
          ],
          "voiceover": "The subset of the script text read aloud in this scene, in Vietnamese. CRITICAL: Keep ALL technical/English terms (HTML, CSS, JavaScript, React, Node.js, Next.js, API, MP4, MP3, npm, JSON, SQL, etc.) in their ORIGINAL LOWERCASE ENGLISH form (e.g., write 'html', 'css', 'javascript'). NEVER phonetically translate them into Vietnamese pronunciation (e.g., NEVER write 'Hát Tê Em Lờ' for HTML, or 'Xê Ét Ét' for CSS).",
          "duration": 7.5, // Estimated duration in seconds (number, e.g. 7.5)
          "placement": "Full", // Allowed values: "Full", "Split"
          "keywords": "1-3 English keywords for Unsplash photo search based on visual context, e.g., 'coding laptop'",
          "theme": "japan", // Allowed values: "japan", "tech", "finance", "nature", "default", "rikkei"
          "accentColor": "A vibrant HEX color matching the theme, e.g., '#FFB7C5' for japan, '#A8232A' for rikkei"
        }
      ]
      
      CRITICAL BLOCK STYLE SELECTION RULES FOR THE THEME:
      ${vde.getStylePrompt(visualStyle)}
      
      GLOBAL CRITICAL RULE FOR VOICEOVER TEXT:
      Technical and English terms in the "voiceover" field MUST remain as lowercase English words.
      Examples of CORRECT voiceover text: "html, css, và javascript là nền tảng của web."
      Examples of WRONG voiceover text: "Hát Tê Em Lờ, Xê Ét Ét, và Gia va sờ cờ ríp là nền tảng của web."
      Apply this rule to: html, css, javascript, react, node.js, next.js, api, mp4, mp3, npm, json, sql, typescript, python, github, docker, aws, gpt.
      
      CRITICAL SENTENCE BOUNDARY RULE:
      Each scene's "voiceover" text MUST consist of complete sentences. Never split a single sentence or a clause across multiple scenes. If the script has a long sentence, keep it entirely within one scene. The boundaries between scenes must always align with natural sentence endings (periods '.', question marks '?', exclamation marks '!').
      
      CRITICAL JSON SYNTAX RULE:
      Any double quotes inside string values (such as "heading" or "voiceover") MUST be escaped as \\" (e.g., \\"tin vui\\") or replaced with single quotes to keep the JSON syntax valid.
      
      Return ONLY the raw JSON array. Do not include markdown formatting or wrapping.
    `;


    let result;
    const maxRetries = 4;
    let retryDelay = 3000; // Start with 3 seconds delay

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await model.generateContent(prompt);
        break; // Success, exit retry loop
      } catch (err) {
        const isModelError = 
          err.message.toLowerCase().includes("not found") || 
          err.message.toLowerCase().includes("not_found") ||
          err.message.includes("404") ||
          err.message.toLowerCase().includes("invalid model");

        const isServerError =
          err.message.includes("503") ||
          err.message.includes("500") ||
          err.message.toLowerCase().includes("experiencing high demand") ||
          err.message.toLowerCase().includes("service unavailable") ||
          err.message.toLowerCase().includes("overloaded") ||
          err.message.toLowerCase().includes("temporary");

        if (isModelError || (isServerError && attempt > 1)) {
          // Cascading fallback: custom -> 2.5-flash -> 1.5-flash-latest -> gemini-pro
          let nextFallback = "gemini-2.5-flash";
          if (modelName === "gemini-2.5-flash") nextFallback = "gemini-1.5-flash-latest";
          else if (modelName === "gemini-1.5-flash-latest") nextFallback = "gemini-pro";

          console.warn(`[Gemini API] Lỗi model "${modelName}" (${err.message}). Tự động chuyển đổi sang model dự phòng "${nextFallback}" để tiếp tục.`);
          modelName = nextFallback;
          model = genAI.getGenerativeModel({ 
            model: modelName,
            generationConfig: { 
              responseMimeType: "application/json",
              responseSchema: STORYBOARD_SCHEMA,
              maxOutputTokens: 8192
            }
          });
          attempt--; // Reset attempt index to retry with the fallback model
          continue;
        }

        const isRateLimit = 
          err.message.includes("429") || 
          err.message.toLowerCase().includes("quota") || 
          err.message.toLowerCase().includes("too many requests");

        if ((isRateLimit || isServerError) && attempt < maxRetries) {
          const errType = isRateLimit ? "Rate Limit (429)" : "Server Overloaded (503/500)";
          console.warn(`[Gemini API] Gặp lỗi ${errType}. Đang thử lại lần ${attempt}/${maxRetries} sau ${retryDelay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          retryDelay *= 2; // Double the wait time
        } else {
          // If it's another error, or we ran out of retries, throw detailed message
          if (isRateLimit) {
            throw new Error(
              "Tài khoản Gemini API của bạn đã hết Quota (Rate Limit 429). \n\n" +
              "👉 Hướng dẫn khắc phục:\n" +
              "1. Đợi khoảng 1 phút rồi nhấn nút tạo lại.\n" +
              "2. Hoặc truy cập Google AI Studio, vào mục Billing, nhấn 'Upgrade to Pay-as-you-go' (vẫn được miễn phí hạn mức cơ bản nhưng tăng giới hạn request từ 15 RPM lên 2000 RPM)."
            );
          }
          if (isServerError) {
            throw new Error(
              `Gemini API Server gặp sự cố quá tải liên tục (503/500).\n` +
              `Chi tiết lỗi: ${err.message}\n` +
              `👉 Vui lòng thử lại sau vài giây hoặc kiểm tra trạng thái dịch vụ của Google.`
            );
          }
          throw err;
        }
      }
    }

    const response = await result.response;
    const text = response.text().trim();

    console.log("Gemini raw response:", text);

    let scenes;
    let cleanedText = text;
    try {
      // 0. Fix truncated/incomplete JSON if cut off mid-stream
      cleanedText = repairTruncatedJson(cleanedText.trim());
      
      // 1. Fix unterminated fractional numbers like "duration": 4. which break JSON parsing
      cleanedText = cleanedText.replace(/(:\s*\d+)\.(?=\s*[,\}\]])/g, "$1.0");
      // 2. Fix missing leading zero like "duration": .5 -> "duration": 0.5
      cleanedText = cleanedText.replace(/(:\s*)\.(\d+)(?=\s*[,\}\]])/g, "$10.$2");
      
      // 3. Fix unescaped double quotes and literal newlines in strings using the state-machine quote repairer
      cleanedText = repairJsonQuotes(cleanedText);

      scenes = JSON.parse(cleanedText);
    } catch (e) {
      console.warn("[Gemini API] JSON.parse attempt failed. Trying fallback cleanup...", e.message);
      try {
        const repaired = cleanedText.replace(/:\s*"([\s\S]*?)"\s*(,|\n|\})/g, (match, p1, p2) => {
          const escapedVal = p1
            .replace(/(?<!\\)"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r');
          return `: "${escapedVal}"${p2}`;
        });
        scenes = JSON.parse(repaired);
      } catch (repairErr) {
        throw new Error(`Expected valid JSON from Gemini but got parse error: ${e.message}`);
      }
    }

    if (!Array.isArray(scenes)) {
      throw new Error("Dữ liệu Gemini trả về không phải là một mảng JSON.");
    }

    // Format and sanitize scenes
    const mappedScenes = scenes.map((scene, index) => ({
      id: `scene_${Date.now()}_${index}`,
      sceneIndex: index,
      duration: Number(scene.duration) || 6.0,
      sceneIntent: scene.sceneIntent || {
        type: "opening",
        importance: "medium",
        density: "medium",
        emotion: "neutral"
      },
      heading: scene.heading || `Phân cảnh ${index + 1}`,
      points: Array.isArray(scene.points) ? scene.points.map((pt, idx) => {
        if (typeof pt === 'string') {
          return { type: 'card', text: pt, animation: 'slide-up', delay: Number((idx * 1.5).toFixed(1)) };
        }
        return {
          ...pt,
          type: pt.type || 'card',
          text: pt.text || '',
          animation: pt.animation || 'slide-up',
          delay: typeof pt.delay === 'number' ? pt.delay : Number((idx * 1.5).toFixed(1))
        };
      }) : [],
      voiceover: scene.voiceover || "",
      placement: scene.placement || "Full",
      keywords: scene.keywords || "technology",
      theme: scene.theme || "default",
      accentColor: scene.accentColor || "#FFB7C5"
    }));

    // Process phoneme optimization for all scenes
    for (const scene of mappedScenes) {
      if (scene.voiceover) {
        scene.voiceoverTts = await phoneme.optimizeTextForPhonemes(scene.voiceover);
      } else {
        scene.voiceoverTts = "";
      }
    }

    return mappedScenes;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Lỗi kết nối Gemini API: ${error.message}`);
  }
}

module.exports = {
  generateStoryboard
};
