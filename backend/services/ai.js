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
          "visualLayout": "Hero" | "Split Screen" | "Dashboard" | "Feature Grid" | "Timeline" | "Comparison" | "Terminal" | "Gallery",
          "heading": "Scene title/heading in Vietnamese",
          "points": [
            {
              "text": "Up to 5 bullet points summarizing this scene, in Vietnamese. Keep points simple and descriptive.",
              "animation": "slide-up" | "scale-in" | "fade-in" | "blur-in" | "slide-left" | "slide-right",
              "delay": estimated offset in seconds from the start of this scene (number, e.g. 1.8) indicating when the voice speaks this point. Delays should be spaced out (e.g., 0.5, 2.0, 3.5) and strictly less than the scene duration. Ensure the first point starts around 0.5s."
            }
          ],
          "voiceover": "The subset of the script text read in this scene, in Vietnamese",
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
      
      Return ONLY the raw JSON array. Do not include markdown formatting or wrapping.
    `;

    const result = await model.generateContent(prompt);
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
