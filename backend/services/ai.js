const { GoogleGenerativeAI } = require("@google/generative-ai");
const vde = require("./vde");
const phoneme = require("./phoneme");

async function generateStoryboard(scriptText, visualStyle = "minimal", traits = []) {
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
    console.log(`[Gemini API] Khởi tạo model: ${modelName} cho phong cách thiết kế VDE: ${visualStyle}`);
    let model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert AI video producer. Parse the following raw script text into a structured storyboard (scenes).
      CRITICAL: You must follow the visual design rules of the chosen style "${visualStyle}" described in the Visual Design Engine rulebook below:

      =========================================
      [VISUAL DESIGN ENGINE RULEBOOK - ${visualStyle.toUpperCase()}]
      ${stylePrompt}
      =========================================

      For each scene, determine the layout, theme, accent color, and estimate duration (assume 3 Vietnamese words per second).
      
      Raw Script:
      "${scriptText}"
      
      You must respond with a JSON array of scene objects matching this JSON Schema:
      [
        {
          "layoutFamily": "Opening / Headline" | "Points / List" | "Quote / Text",
          "visualLayout": "Hero" | "Split Screen" | "Dashboard" | "Feature Grid" | "Timeline" | "Comparison" | "Terminal" | "Gallery" | "Laptop Mockup" | "Stats Banner" | "Three Columns" | "Integration Cloud" | "IntroChapterStack",
          "heading": "Scene title/heading in Vietnamese",
          "points": [
            {
              "type": "text", // Required type. Allowed values: "text", "terminal", "metric", "logo_row", "badge_row", "button", "subheader"
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
      
      Layout selection guide for "visualLayout":
      - Use "Hero" for introduction scenes with big title.
      - Use "Split Screen" if there is an image illustration and description side-by-side.
      - Use "Dashboard" if there are 2 or more statistics / key metric lines (e.g., lines containing "+85% speed", "95K stars").
      - Use "Feature Grid" if there are 4 or more clean bullet points listing features.
      - Use "Timeline" if the scene shows step-by-step instructions or sequential events (e.g., "Bước 1", "Bước 2", "Tiến trình").
      - Use "Comparison" if the scene contrasts two systems or has Pros vs Cons.
      - Use "Terminal" if there are terminal installation commands (e.g. starting with "$" or "npm install").
      - Use "Gallery" for multiple screenshots.
      - Use "Laptop Mockup" for responsive showcase, cross-platform apps, or product features.
      - Use "Stats Banner" for detailed analytics dashboard panels with line charts and live metric widgets.
      - Use "Three Columns" for subscription plans, pricing tiers, or 3-step feature lists.
      - Use "Integration Cloud" for API connections, integrations, or automated workflow diagrams.
      - Use "IntroChapterStack" for opening scenes or chapter announcements with a 3D overlapping stack of cards (like previous, active, and next chapters stacked together).
      
      CRITICAL BLOCK STYLE SELECTION RULES FOR phong cách "${visualStyle}":
      - If style is "claude", prefer using "subheader", "logo_row", and "button" block types to create a premium editorial magazine aesthetic. Avoid using "terminal" unless it's a code-only command scene.
      - If style is "cyberpunk", prefer using "terminal", "metric" and "badge_row" block types with vibrant text/metrics.
      - If style is "apple" or "light", prefer using "subheader", "badge_row" and clean "button" CTA blocks.
      - If style is "rikkei", prefer using "subheader", "logo_row", and "button" block types to create a premium, clean educational layout. Use crimson red (#A8232A) highlights and rounded buttons.
      
      GLOBAL CRITICAL RULE FOR VOICEOVER TEXT:
      Technical and English terms in the "voiceover" field MUST remain as lowercase English words.
      Examples of CORRECT voiceover text: "html, css, và javascript là nền tảng của web."
      Examples of WRONG voiceover text: "Hát Tê Em Lờ, Xê Ét Ét, và Gia va sờ cờ ríp là nền tảng của web."
      Apply this rule to: html, css, javascript, react, node.js, next.js, api, mp4, mp3, npm, json, sql, typescript, python, github, docker, aws, gpt.
      
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
            generationConfig: { responseMimeType: "application/json" }
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

    let scenes = JSON.parse(text);
    if (!Array.isArray(scenes)) {
      throw new Error("Dữ liệu Gemini trả về không phải là một mảng JSON.");
    }

    // Format and sanitize scenes
    const mappedScenes = scenes.map((scene, index) => ({
      id: `scene_${Date.now()}_${index}`,
      sceneIndex: index,
      duration: Number(scene.duration) || 6.0,
      layoutFamily: scene.layoutFamily || "Opening / Headline",
      visualLayout: scene.visualLayout || "Hero",
      heading: scene.heading || `Phân cảnh ${index + 1}`,
      points: Array.isArray(scene.points) ? scene.points.map((pt, idx) => {
        if (typeof pt === 'string') {
          return { text: pt, animation: 'slide-up', delay: Number((idx * 1.5).toFixed(1)) };
        }
        return {
          ...pt,
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
