const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  console.log("Using API Key:", apiKey ? "FOUND" : "NOT FOUND");
  console.log("Testing Model:", modelName);
  if (!apiKey) return;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, write a short sentence.");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Gemini failed:", err.message);
  }
}
main();
