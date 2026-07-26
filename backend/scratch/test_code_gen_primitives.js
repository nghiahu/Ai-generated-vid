require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { generateSingleSceneCode, compileTSX } = require("../services/aiGen");

async function testCodeGen() {
  const sampleScene = {
    sceneIndex: 0,
    visualPattern: "CODE_TERMINAL_DIFF",
    visualConcept: "CODE_TERMINAL_DIFF",
    heading: "AI Hyperframe Reasoning Engine",
    voiceover: "Hệ thống tự động phân tích kịch bản và sinh giao diện động theo ngữ cảnh.",
    subtitleCardText: "Sinh UI linh hoạt theo thời gian thực"
  };

  console.log("Testing Phase 2 Generative TSX Code Generator...");
  const sceneData = await generateSingleSceneCode({
    scene: sampleScene,
    index: 0,
    theme: "ai_hub_grid",
    bgImage: "",
    refImages: [],
    voiceKey: "duythanh",
    projectId: null
  });

  console.log("Generated Scene Data Overview:", {
    sceneIndex: sceneData.sceneIndex,
    visualPattern: sceneData.visualPattern,
    hasCompiledJS: Boolean(sceneData.compiledJS),
    compiledLength: (sceneData.compiledJS || "").length,
    hasRawTsx: Boolean(sceneData.tsxCode),
    tsxLength: (sceneData.tsxCode || "").length
  });

  if (!sceneData.compiledJS || sceneData.compiledJS.length < 100) {
    throw new Error("Invalid compiled code returned from Phase 2");
  }

  console.log("✅ Phase 2 Generative TSX Code Generator Test Passed!");
}

testCodeGen().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
