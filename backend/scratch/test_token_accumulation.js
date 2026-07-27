require('dotenv').config();
const db = require('../services/db');

async function testAccumulate() {
  const testProjId = `test_proj_${Date.now()}`;
  console.log("Testing token accumulation for project:", testProjId);
  try {
    await db.saveAIGenProject(testProjId, "Test Token Project", { voice: "duythanh" });
    await db.accumulateTokens(testProjId, 500, 250);
    const updated = await db.getProjectById(testProjId);
    console.log("Updated Project Config:", updated.config.tokenUsage);
    if (updated.config.tokenUsage && updated.config.tokenUsage.totalTokens === 750) {
      console.log("✅ Token accumulation test PASSED!");
    } else {
      console.error("❌ Token accumulation test FAILED!");
    }
  } catch (err) {
    console.error("Error in token accumulation test:", err.message);
  }
}

testAccumulate();
