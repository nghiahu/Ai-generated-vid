require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { generateSafetyNetTSX } = require("../services/aiGen");

function testConceptFallback() {
  console.log("Testing Concept-Aware Fallback Router...");

  const concepts = [
    { visualConcept: "CODE_TERMINAL_DIFF", heading: "Terminal Code" },
    { visualConcept: "HORIZON_3STEP_FLOW", heading: "3 Step Flow" },
    { visualConcept: "VS_SPLIT_COMPARISON", heading: "Split Versus" },
    { visualConcept: "HERO_GAUGE_RING", heading: "Gauge Metric" },
    { visualConcept: "OUTRO_CTA_PULSE", heading: "Outro Action" }
  ];

  const generatedFallbacks = new Set();

  for (const c of concepts) {
    const tsx = generateSafetyNetTSX(c);
    if (!tsx || tsx.length < 100) {
      throw new Error(`Failed to generate fallback for concept ${c.visualConcept}`);
    }
    // Check key signature elements
    if (c.visualConcept.includes("CODE") && !tsx.includes("hyperframe_diff")) {
      throw new Error("CODE_TERMINAL_DIFF fallback missing terminal window");
    }
    // Store unique component body snippet (skip generic header imports)
    const bodySnippet = tsx.substring(250, 700);
    generatedFallbacks.add(bodySnippet);
  }

  console.log("Unique fallback component bodies generated:", generatedFallbacks.size);

  if (generatedFallbacks.size < concepts.length) {
    throw new Error("Fallback engine returned duplicate templates across distinct concepts!");
  }

  console.log(`✅ Concept Fallback Router Test Passed! Generated ${generatedFallbacks.size} distinct templates.`);
}

testConceptFallback();
