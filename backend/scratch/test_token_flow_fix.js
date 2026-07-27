require('dotenv').config();
const db = require('../services/db');

async function testFullTokenFlow() {
  const projId = `proj_test_flow_${Date.now()}`;
  console.log("Testing full token accumulation & config merge for:", projId);
  
  // 1. Initial save (IN_PROGRESS)
  await db.saveAIGenProject(projId, "Test Title", { script: "hello" }, 'IN_PROGRESS');
  
  // 2. Accumulate tokens
  await db.accumulateTokens(projId, 1200, 800);
  
  // 3. Final save (COMPLETED)
  await db.saveAIGenProject(projId, "Test Title", { script: "hello", scenes: [] }, 'COMPLETED');
  
  // 4. Verify config.tokenUsage
  const proj = await db.getProjectById(projId);
  console.log("Resulting Project Config Token Usage:", proj.config.tokenUsage);
  
  if (proj.config.tokenUsage && proj.config.tokenUsage.totalTokens === 2000) {
    console.log("✅ Full Token Flow Fix Test PASSED!");
  } else {
    console.error("❌ Full Token Flow Fix Test FAILED!");
  }
}

testFullTokenFlow();
