# Vbee TTS API Integration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Integrate real Vbee TTS API into `backend/services/tts.js` using `VBEE_API_KEY` and `VBEE_APP_ID` from `.env`.

**Architecture:** Add `vbee_*` voice handler in `generateTTS`. Send POST request to Vbee TTS API, download returned MP3 audio, apply silence padding via ffmpeg, measure duration via ffprobe, and return duration and filename. Fall back to OmniVoice if API call fails.

**Tech Stack:** Node.js, Axios, Express, ffmpeg, ffprobe.

---

### Task 1: Add Vbee API Voice Code Mapping and HTTP Client in `backend/services/tts.js`

**Files:**
- Modify: `backend/services/tts.js`
- Test: `backend/scratch/test_vbee_tts.js`

**Step 1: Write test script for Vbee TTS**

Create `backend/scratch/test_vbee_tts.js`:
```javascript
const tts = require('../services/tts');

async function testVbee() {
  console.log("Testing Vbee TTS integration...");
  try {
    const result = await tts.generateTTS("Xin chào, đây là giọng đọc thử nghiệm Vbee Minh Tiến.", "test_proj", "scene_vbee_1", "vbee_minhtien");
    console.log("Vbee TTS Test Result:", result);
  } catch (err) {
    console.error("Vbee TTS Test Failed:", err);
  }
}

testVbee();
```

**Step 2: Implement Vbee API call in `backend/services/tts.js`**

Update `backend/services/tts.js` to handle `vbee_*` voice keys:
- Retrieve `VBEE_API_KEY` and `VBEE_APP_ID` from `process.env`.
- Map `vbee_minhtien` -> `hn_male_minhtien_news_48k-v2`, `vbee_thuyduyen` -> `hn_female_thuyduyen_news_48k-v2`, `vbee_ngochuyen` -> `hn_female_ngochuyen_full_48k-v2`, `vbee_naman` -> `sg_male_naman_full_48k-v2`, `vbee_maiphuong` -> `sg_female_maiphuong_full_48k-v2`.
- Send HTTP request using `axios` or `https` to Vbee API endpoint `https://api-v2.vbee.vn/api/v1/tts` or `https://api.vbee.ai/v1/convert-text-to-speech`.
- Save MP3 to `outputPath`.
- Apply `addSilentPadding(outputPath)` and return `{ audioUrl, duration }`.

**Step 3: Run test script to verify implementation**

Run: `node scratch/test_vbee_tts.js` (in `backend`)
Expected output: Success log with valid duration and generated mp3 file.

**Step 4: Commit**

```bash
git add backend/services/tts.js backend/scratch/test_vbee_tts.js docs/plans/2026-07-27-vbee-tts-integration-plan.md
git commit -m "feat(backend): integrate Vbee TTS API into tts service"
```
