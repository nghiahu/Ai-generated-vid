const { generateSingleSceneCode } = require("../services/aiGen");
const dotenv = require("dotenv");
dotenv.config();

async function testQuoteCardGen() {
  console.log("Testing QUOTE_NATURE_CARD single scene generation...");
  const testScene = {
    sceneIndex: 0,
    visualPattern: "QUOTE_NATURE_CARD",
    heading: "BLOOMBERGGPT: BƯỚC NGOẶT AI",
    voiceover: "Bloomberg ra mắt mô hình GPT chuyên biệt cho ngành tài chính, nâng cao hiệu suất vượt bậc."
  };

  try {
    const res = await generateSingleSceneCode({
      scene: testScene,
      index: 0,
      theme: "ai_hub_grid",
      projectId: "test_proj_quote_fix",
      bypassCache: true,
      userNote: "Make quote text clear and high contrast"
    });

    console.log("Generation Success!");
    console.log("Enriched quoteText:", res.quoteText);
    console.log("Enriched sourceBadge:", res.sourceBadge);
    console.log("Enriched authorAttribution:", res.authorAttribution);
    console.log("\n--- Generated TSX Code Snippet ---");
    console.log(res.tsxCode ? res.tsxCode.substring(0, 400) : "NO TSX CODE");
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testQuoteCardGen();
