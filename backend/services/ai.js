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
          "visualLayout": "Intro Profile" | "Github Status Hook" | "Split Grid",
          "heading": "Scene title/heading in Vietnamese",
          "points": ["Up to 3 bullet points summarizing this scene, in Vietnamese"],
          "voiceover": "The subset of the script text read in this scene, in Vietnamese",
          "duration": estimated duration in seconds (number, e.g. 7.5),
          "placement": "Full" | "Split",
          "keywords": "1-3 English keywords for Unsplash photo search based on visual context, e.g., 'coding laptop'",
          "theme": "japan" | "tech" | "finance" | "nature" | "default",
          "accentColor": "A vibrant HEX color matching the theme, e.g., '#FFB7C5' for japan, '#00E5FF' for tech, '#FFD700' for finance"
        }
      ]
      
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
      visualLayout: scene.visualLayout || "Intro Profile",
      heading: scene.heading || `Phân cảnh ${index + 1}`,
      points: Array.isArray(scene.points) ? scene.points : [],
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
