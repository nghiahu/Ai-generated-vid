const axios = require("axios");

async function main() {
  try {
    const projectId = "proj_cn0ghd4kw";
    console.log(`Sending POST request to regenerate TTS for project ${projectId}...`);
    const res = await axios.post(`http://localhost:5000/api/projects/${projectId}/regenerate-tts`);
    console.log("Status:", res.status);
    console.log("Response:", res.data);
  } catch (err) {
    console.error("Error regenerating TTS:", err.response?.data || err.message);
  }
}

main();
