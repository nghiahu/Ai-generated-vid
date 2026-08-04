const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testVbee() {
  const apiKey = process.env.VBEE_API_KEY;
  const appId = process.env.VBEE_APP_ID;

  const text = "Xin chào, đây là thử nghiệm giọng đọc Vbee để xem trạng thái hoàn thành.";
  const voice = "hn_female_ngochuyen_full_48k-fhg"; 
  
  const url = "https://vbee.vn/api/v1/tts";

  console.log("--> Step 1: Creating TTS request");
  let requestId = "";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "x-app-id": appId
      },
      body: JSON.stringify({
        app_id: appId,
        input_text: text,
        voice_code: voice,
        callback_url: "https://example.com/callback"
      })
    });
    
    const body = await res.json();
    console.log("POST Response:", JSON.stringify(body));
    if (body.status === 1 && body.result) {
      requestId = body.result.request_id;
    }
  } catch (e) {
    console.error("POST failed:", e.message);
    return;
  }

  if (!requestId) {
    console.error("Could not obtain request_id");
    return;
  }

  console.log(`\n--> Step 2: Polling status for request_id: ${requestId}`);
  
  const statusUrl = `https://vbee.vn/api/v1/tts/${requestId}`;
  let attempts = 0;
  const maxAttempts = 30;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\nPoll attempt ${attempts}...`);
    try {
      const res = await fetch(statusUrl, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "x-app-id": appId
        }
      });
      const body = await res.json();
      console.log("Status Response:", JSON.stringify(body));
      
      const status = body.result?.status;
      if (status !== "IN_PROGRESS") {
        console.log(`\nFinal status achieved: ${status}`);
        console.log("Full final body:", JSON.stringify(body, null, 2));
        break;
      }
    } catch (e) {
      console.error("Poll failed:", e.message);
    }
    
    // Wait 2 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testVbee();
