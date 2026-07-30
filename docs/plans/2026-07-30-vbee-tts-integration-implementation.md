# Vbee Text-to-Speech (TTS) Integration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Integrate Vbee TTS into the project to enable high-quality Vietnamese AI voiceovers for generated videos.

**Architecture:** Detect `vbee_` prefixed voice keys in `generateTTS`, call Vbee's POST request to `/api/v1/tts`, poll for completion via GET request, download the completed MP3 file, and run normalizations (FFmpeg padding and duration checking). Fix `aiGen.js` to preserve `vbee_` voice keys. Update the frontend UI to display Vbee voices in dropdown selectors.

**Tech Stack:** Node.js, Express, React, HTML5, FFmpeg.

---

## Proposed Changes

### Backend Service

#### [MODIFY] [tts.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/backend/services/tts.js)
Update the `generateTTS` function to detect and process Vbee voice keys.
- If `voiceKey` starts with `vbee_`, perform Vbee cloud generation.
- Map `vbee_ngochuyen`, `vbee_manhdung`, `vbee_thutrang`, `vbee_minhhoang`, and `vbee_naman` to their respective Vbee voice codes.
- Request Vbee endpoint `https://vbee.vn/api/v1/tts` using `Authorization` (Bearer `VBEE_API_KEY`) and `x-app-id` (`VBEE_APP_ID`) headers.
- Poll `https://vbee.vn/api/v1/tts/{requestId}` until status is `SUCCESS`, then download and save the file.
- Perform FFmpeg padding/volume boosting via `addSilentPadding`.

#### [MODIFY] [aiGen.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/backend/services/aiGen.js)
Ensure that if a voiceKey starts with `vbee_`, it is passed directly without prepending `omnivoice_`.

---

### Frontend Components

#### [MODIFY] [StudioAIGen.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StudioAIGen.jsx)
Add the Vbee options to both the main voice selector and the per-scene regenerate voice selector:
- Vbee - Ngọc Huyền (Nữ miền Bắc) (`vbee_ngochuyen`)
- Vbee - Mạnh Dũng (Nam miền Bắc) (`vbee_manhdung`)
- Vbee - Thu Trang (Nữ miền Bắc) (`vbee_thutrang`)
- Vbee - Minh Hoàng (Nữ miền Nam) (`vbee_minhhoang`)
- Vbee - Nam An (Nam miền Nam) (`vbee_naman`)

---

## Tasks

### Task 1: Update tts.js service to support Vbee API

**Files:**
- Modify: `backend/services/tts.js`
- Test: `backend/scratch/test_vbee_integration.js`

**Step 1: Write integration test case**
Create `backend/scratch/test_vbee_integration.js`:
```javascript
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const tts = require("../services/tts");

async function main() {
  console.log("Calling generateTTS with vbee_ngochuyen...");
  try {
    const res = await tts.generateTTS("Chào bạn, đây là kiểm tra tích hợp Vbee.", "test_proj", "test_scene", "vbee_ngochuyen");
    console.log("Success:", res);
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}
main();
```

**Step 2: Run test to verify it fails**
Run: `node scratch/test_vbee_integration.js`
Expected: Fail/fallback to OmniVoice (since `vbee_ngochuyen` does not start with `omnivoice_`).

**Step 3: Modify `tts.js` to implement Vbee cloud generation**
Modify `backend/services/tts.js` to add the Vbee mapping, polling, and download code block inside `generateTTS` before the fallback error check:

```javascript
  // Nhánh xử lý Vbee (Cloud TTS)
  if (effectiveVoice.toLowerCase().startsWith("vbee_")) {
    try {
      const vbeeApiKey = process.env.VBEE_API_KEY;
      const vbeeAppId = process.env.VBEE_APP_ID;

      if (!vbeeApiKey || !vbeeAppId) {
        throw new Error("Thiếu VBEE_API_KEY hoặc VBEE_APP_ID trong cấu hình .env");
      }

      // Ánh xạ voiceKey sang voice_code của Vbee
      const voiceMap = {
        "vbee_ngochuyen": "hn_female_ngochuyen_full_48k-fhg",
        "vbee_manhdung": "hn_male_manhdung_news_48k-fhg",
        "vbee_thutrang": "hn_female_thutrang_news_48k-fhg",
        "vbee_minhhoang": "sg_female_minhhoang_news_48k-fhg",
        "vbee_naman": "sg_male_naman_news_48k-fhg"
      };

      const voiceCode = voiceMap[effectiveVoice.toLowerCase()] || "hn_female_ngochuyen_full_48k-fhg";
      
      console.log(`[TTS Engine] Calling Vbee API for text: "${text.substring(0, 30)}..." with voice: ${voiceCode}`);

      // Gửi yêu cầu khởi tạo job đến Vbee
      const ttsUrl = "https://vbee.vn/api/v1/tts";
      const initRes = await fetch(ttsUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${vbeeApiKey}`,
          "x-app-id": vbeeAppId
        },
        body: JSON.stringify({
          app_id: vbeeAppId,
          input_text: text,
          voice_code: voiceCode,
          callback_url: "https://example.com/callback"
        })
      });

      if (!initRes.ok) {
        const errText = await initRes.text();
        throw new Error(`Vbee API request failed: status ${initRes.status} - ${errText}`);
      }

      const initBody = await initRes.json();
      if (initBody.status !== 1 || !initBody.result || !initBody.result.request_id) {
        throw new Error(`Khởi tạo Vbee job thất bại: ${JSON.stringify(initBody)}`);
      }

      const requestId = initBody.result.request_id;
      console.log(`[TTS Engine] Created Vbee job with request_id: ${requestId}. Starting polling...`);

      // Polling Vbee status
      const statusUrl = `https://vbee.vn/api/v1/tts/${requestId}`;
      let audioLink = "";
      let pollAttempts = 0;
      const maxPollAttempts = 30;

      while (pollAttempts < maxPollAttempts) {
        pollAttempts++;
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        try {
          const checkRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${vbeeApiKey}`,
              "x-app-id": vbeeAppId
            }
          });

          if (!checkRes.ok) continue;

          const checkBody = await checkRes.json();
          if (checkBody.status === 1 && checkBody.result) {
            const currentStatus = checkBody.result.status;
            if (currentStatus === "SUCCESS") {
              audioLink = checkBody.result.audio_link;
              break;
            } else if (currentStatus === "FAILED") {
              throw new Error("Tiến trình render giọng Vbee bị lỗi (FAILED).");
            }
          }
        } catch (pollErr) {
          console.warn(`[TTS Engine] Lỗi polling Vbee: ${pollErr.message}`);
        }
      }

      if (!audioLink) {
        throw new Error(`Timeout/Lỗi khi polling giọng Vbee cho request_id: ${requestId}`);
      }

      console.log(`[TTS Engine] Vbee render success. Downloading audio from: ${audioLink}`);

      // Tải file audio về thư mục public/tts
      const audioRes = await fetch(audioLink);
      if (!audioRes.ok) {
        throw new Error(`Không thể tải file âm thanh từ Vbee: status ${audioRes.status}`);
      }

      const audioBuffer = await audioRes.arrayBuffer();
      fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
      console.log(`[TTS Engine] Saved downloaded audio to: ${outputPath}`);

      // Áp dụng khoảng lặng/hậu kỳ
      addSilentPadding(outputPath);
      const duration = getAudioDuration(outputPath);

      return { url: `/tts/${fileName}`, duration };
    } catch (error) {
      console.error(`Vbee TTS failed for scene ${sceneId}: ${error.message}`);
      throw new Error(`Lỗi Vbee TTS: ${error.message}`);
    }
  }
```

Update `tts.js` line 178 to accept `vbee_` prefixes:
```javascript
  let effectiveVoice = voiceKey;
  if (!effectiveVoice || (!effectiveVoice.toLowerCase().startsWith("omnivoice_") && !effectiveVoice.toLowerCase().startsWith("vbee_"))) {
    console.warn(`[generateTTS] Legacy or unsupported voice "${voiceKey}" detected. Auto-fallback to "omnivoice_duythanh".`);
    effectiveVoice = "omnivoice_duythanh";
  }
```

**Step 4: Run test to verify it passes**
Run: `node scratch/test_vbee_integration.js`
Expected: PASS and prints `{ url: '/tts/tts_test_proj_test_scene_xxxx.mp3', duration: x.xx }`

---

### Task 2: Adjust aiGen.js voice wrapper

**Files:**
- Modify: `backend/services/aiGen.js`

**Step 1: Modify aiGen.js line 2003**
Replace:
```javascript
return await tts.generateTTS(textToRead, projectId || "aigen_proj", `scene_${index}_${Date.now()}`, `omnivoice_${voiceKey}`);
```
With:
```javascript
const finalVoiceKey = voiceKey.startsWith("vbee_") ? voiceKey : `omnivoice_${voiceKey}`;
return await tts.generateTTS(textToRead, projectId || "aigen_proj", `scene_${index}_${Date.now()}`, finalVoiceKey);
```

---

### Task 3: Update StudioAIGen.jsx dropdown choices

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Step 1: Update main voice dropdown (lines 1275-1279)**
Replace:
```javascript
              <select
                value={voice}
                onChange={(e) => {
                  const newVoice = e.target.value;
                  setVoice(newVoice);
                  localStorage.setItem("studio_aigen_voice", newVoice);
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <option value="duythanh">OmniVoice - Duy Thanh (Offline Voice)</option>
                <option value="quanganh">OmniVoice - Quang Anh (Offline Voice)</option>
              </select>
```
With:
```javascript
              <select
                value={voice}
                onChange={(e) => {
                  const newVoice = e.target.value;
                  setVoice(newVoice);
                  localStorage.setItem("studio_aigen_voice", newVoice);
                }}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
              >
                <option value="duythanh">OmniVoice - Duy Thanh (Offline Voice)</option>
                <option value="quanganh">OmniVoice - Quang Anh (Offline Voice)</option>
                <option value="vbee_ngochuyen">Vbee - Ngọc Huyền (Nữ miền Bắc)</option>
                <option value="vbee_manhdung">Vbee - Mạnh Dũng (Nam miền Bắc)</option>
                <option value="vbee_thutrang">Vbee - Thu Trang (Nữ miền Bắc)</option>
                <option value="vbee_minhhoang">Vbee - Minh Hoàng (Nữ miền Nam)</option>
                <option value="vbee_naman">Vbee - Nam An (Nam miền Nam)</option>
              </select>
```

**Step 2: Update per-scene regenerate voice dropdown (lines 2340-2348)**
Replace:
```javascript
              <select
                value={regenVoice}
                onChange={(e) => setRegenVoice(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}
              >
                <option value="quanganh">OmniVoice - Quang Anh (Offline Voice)</option>
                <option value="duythanh">OmniVoice - Duy Thanh (Offline Voice)</option>
              </select>
```
With:
```javascript
              <select
                value={regenVoice}
                onChange={(e) => setRegenVoice(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1.5px solid #cbd5e1", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}
              >
                <option value="quanganh">OmniVoice - Quang Anh (Offline Voice)</option>
                <option value="duythanh">OmniVoice - Duy Thanh (Offline Voice)</option>
                <option value="vbee_ngochuyen">Vbee - Ngọc Huyền (Nữ miền Bắc)</option>
                <option value="vbee_manhdung">Vbee - Mạnh Dũng (Nam miền Bắc)</option>
                <option value="vbee_thutrang">Vbee - Thu Trang (Nữ miền Bắc)</option>
                <option value="vbee_minhhoang">Vbee - Minh Hoàng (Nữ miền Nam)</option>
                <option value="vbee_naman">Vbee - Nam An (Nam miền Nam)</option>
              </select>
```

---

## Verification Plan

### Automated Verification
- Run the test script `node scratch/test_vbee_integration.js` to ensure the backend integration correctly outputs the local file and checks duration.

### Manual Verification
- Deploy/start backend and frontend:
  1. Boot the backend server: `npm run start` or `npm run dev` in `backend`.
  2. Boot the React dev server in `frontend`.
  3. Generate a video with a selected Vbee voice (e.g. Ngọc Huyền) and confirm it compiles and plays successfully in the Remotion Player with the correct TTS duration.
