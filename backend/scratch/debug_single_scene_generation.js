const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { generateSingleSceneCode } = require('../services/aiGen');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY configured');
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  const scene = {
    heading: "MCP Server & Client: Plug & Play",
    voiceover: "Hãy tưởng tượng trước khi có cổng USB-C, mỗi thiết bị phải dùng một loại dây sạc riêng. Tiêu chuẩn đó mang tên MCP - Model Context Protocol.",
    points: [
      "Tiêu chuẩn đó mang tên MCP - Model Context Protocol",
      "Hãy tưởng tượng trước khi có cổng USB-C",
      "mỗi thiết bị phải dùng một loại dây sạc riêng"
    ],
    visualPattern: "ARCH_NETWORK_NODES"
  };

  console.log('Generating single scene...');
  try {
    const result = await generateSingleSceneCode({
      scene,
      index: 1,
      theme: 'rikkei',
      bgImage: '',
      refImages: [],
      voiceKey: 'duythanh',
      projectId: 'debug_test',
      genAI,
      modelName: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
      errorFeedback: null
    });
    console.log('Generation completed!');
    console.log('Is Safety Net fallback triggered?', result.tsxCode.includes('icons = [Cpu, Zap, Layers, Sparkles]'));
    console.log('tsxCode excerpt:', result.tsxCode.substring(0, 500));
  } catch (err) {
    console.error('Error during generation:', err);
  }
}

main();
