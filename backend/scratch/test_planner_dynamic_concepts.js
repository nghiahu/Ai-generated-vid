require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { generateScenePlanForAIGen } = require("../services/aiGen");

async function testPlanner() {
  const sampleScript = [
    { voiceover: "Hôm nay chúng ta sẽ tìm hiểu về AI Hyperframe và lý do tại sao nó lại khác biệt." },
    { voiceover: "Vấn đề của các hệ thống cũ là giao diện bị lặp đi lặp lại rất đơn điệu." },
    { voiceover: "Hyperframe tự động phân tích ngữ cảnh kịch bản qua 3 bước xử lý thông minh." },
    { voiceover: "Tốc độ xử lý tăng gấp 10 lần và tiết kiệm 90% chi phí tài nguyên." },
    { voiceover: "Dưới đây là so sánh giữa phương pháp truyền thống và công nghệ AI Generative UI mới." },
    { voiceover: "Được tích hợp trực tiếp vào hệ thống render Remotion với chất lượng 60 FPS." }
  ];

  console.log("Testing Phase 1 Dynamic Visual Planner...");
  const plan = await generateScenePlanForAIGen(sampleScript);
  console.log("Planner Result:", JSON.stringify(plan, null, 2));

  // Verify visualConcept or visualPattern exist and no consecutive duplicates
  for (let i = 1; i < plan.length; i++) {
    const prev = plan[i - 1].visualConcept || plan[i - 1].visualPattern;
    const curr = plan[i].visualConcept || plan[i].visualPattern;
    if (!curr) {
      throw new Error(`Missing visual concept/pattern at scene ${i}`);
    }
    if (prev === curr) {
      throw new Error(`Duplicate visual concept detected at scene ${i}: ${curr}`);
    }
  }
  console.log("✅ Phase 1 Visual Planner Test Passed!");
}

testPlanner().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
