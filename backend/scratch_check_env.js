require("dotenv").config();
console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);
console.log("PGDATABASE:", process.env.PGDATABASE || 'ai_video_remotion');
process.exit(0);
