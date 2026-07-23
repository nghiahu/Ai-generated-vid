const axios = require("axios");

async function main() {
  const payload = {
    script: "AI viết code hộ bạn được rồi. Nhưng đây mới là điều ít ai chịu nói ra.",
    targetLength: "Short (~60s)",
    theme: "ai_hub_grid",
    voiceKey: "duythanh",
    bgImage: "",
    refImages: []
  };

  console.log("Sending POST request to backend /api/studio-ai-gen/generate...");
  try {
    const res = await axios.post("http://localhost:5000/api/studio-ai-gen/generate", payload, {
      timeout: 120000 // 2 minutes timeout
    });
    console.log("Response status:", res.status);
    console.log("Response data:", JSON.stringify(res.data, null, 2).substring(0, 500) + "...");
  } catch (err) {
    console.error("Request failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error("Error Message:", err.message);
      console.error("Code:", err.code);
    }
  }
}

main();
