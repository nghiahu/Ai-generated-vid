const { GoogleGenerativeAI } = require("@google/generative-ai");

async function generateStoryboard(scriptText) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY chưa được cấu hình trong tệp .env. Vui lòng kiểm tra lại cấu hình Backend.");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert AI video producer. Parse the following raw script text into a structured storyboard (scenes).
      For each scene, determine the layout, theme, accent color, and estimate duration (assume 3 Vietnamese words per second).
      
      Raw Script:
      "${scriptText}"
      
      You must respond with a JSON array of scene objects matching this JSON Schema:
      [
        {
          "layoutFamily": "Opening / Headline" | "Points / List" | "Quote / Text",
          "visualLayout": "Hero" | "Split Screen" | "Dashboard" | "Feature Grid" | "Timeline" | "Comparison" | "Terminal" | "Gallery" | "Laptop Mockup" | "Stats Banner" | "Three Columns" | "Integration Cloud",
          "heading": "Scene title/heading in Vietnamese",
          "points": [
            {
              "text": "Up to 5 bullet points summarizing this scene, in Vietnamese. Keep points simple and descriptive.",
              "animation": "slide-up" | "scale-in" | "fade-in" | "blur-in" | "slide-left" | "slide-right",
              "delay": estimated offset in seconds from the start of this scene (number, e.g. 1.8) indicating when the voice speaks this point. Delays should be spaced out (e.g., 0.5, 2.0, 3.5) and strictly less than the scene duration. Ensure the first point starts around 0.5s."
            }
          ],
          "voiceover": "The subset of the script text read aloud in this scene, in Vietnamese. CRITICAL: Keep ALL technical/English terms (HTML, CSS, JavaScript, React, Node.js, Next.js, API, MP4, MP3, npm, JSON, SQL, etc.) in their ORIGINAL LOWERCASE ENGLISH form (e.g., write 'html', 'css', 'javascript'). NEVER phonetically translate them into Vietnamese pronunciation (e.g., NEVER write 'Hát Tê Em Lờ' for HTML, or 'Xê Ét Ét' for CSS).",
          "duration": estimated duration in seconds (number, e.g. 7.5),
          "placement": "Full" | "Split",
          "keywords": "1-3 English keywords for Unsplash photo search based on visual context, e.g., 'coding laptop'",
          "theme": "japan" | "tech" | "finance" | "nature" | "default",
          "accentColor": "A vibrant HEX color matching the theme, e.g., '#FFB7C5' for japan, '#00E5FF' for tech, '#FFD700' for finance"
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
        const isRateLimit = 
          err.message.includes("429") || 
          err.message.toLowerCase().includes("quota") || 
          err.message.toLowerCase().includes("too many requests");

        if (isRateLimit && attempt < maxRetries) {
          console.warn(`[Gemini API] Bị giới hạn quota (429). Đang thử lại lần ${attempt}/${maxRetries} sau ${retryDelay / 1000}s...`);
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
    return scenes.map((scene, index) => ({
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

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`Lỗi kết nối Gemini API: ${error.message}`);
  }
}

module.exports = {
  generateStoryboard
};
