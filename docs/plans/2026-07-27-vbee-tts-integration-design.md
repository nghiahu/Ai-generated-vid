# Design: Direct Vbee TTS API Integration

**Date:** 2026-07-27  
**Status:** Approved  

## 1. Context & Goal
Integrate Vbee Text-to-Speech API directly into `backend/services/tts.js` using credentials `VBEE_API_KEY` and `VBEE_APP_ID` defined in `backend/.env`.

---

## 2. Voice Code Mapping Table

| Frontend `voiceKey` | Vbee `voice_code` | Tone / Vibe |
|---|---|---|
| `vbee_minhtien` | `hn_male_minhtien_news_48k-v2` | 📰 Tin tức / Kịch tính (Nam Bắc) |
| `vbee_thuyduyen` | `hn_female_thuyduyen_news_48k-v2` | 🎓 Truyền cảm / Sách nói (Nữ Bắc) |
| `vbee_ngochuyen` | `hn_female_ngochuyen_full_48k-v2` | 💡 Quảng cáo / Hào hứng (Nữ Bắc) |
| `vbee_naman` | `sg_male_naman_full_48k-v2` | 🚀 Năng động / Công nghệ (Nam Nam) |
| `vbee_maiphuong` | `sg_female_maiphuong_full_48k-v2` | 🎭 Tâm sự / Trầm ấm (Nữ Nam) |

---

## 3. Architecture & Integration Strategy

### Step 1: Environment Variable Check
Retrieve `VBEE_API_KEY` and `VBEE_APP_ID` from `process.env`. If missing, default gracefully to offline OmniVoice with a clear warning log.

### Step 2: Vbee HTTP Request
- Endpoint: `https://api.vbee.ai/v1/convert-text-to-speech` (or `https://api-v2.vbee.vn/api/v1/tts`)
- Headers:
  - `Authorization: Bearer ${process.env.VBEE_API_KEY}`
  - `Content-Type: application/json`
- Request Payload:
  ```json
  {
    "app_id": process.env.VBEE_APP_ID,
    "input_text": cleanText,
    "voice_code": voiceCode,
    "audio_type": "mp3",
    "rate": 1.0
  }
  ```

### Step 3: Response Download & Audio Post-Processing
- Receive audio binary buffer or download from `audio_link`.
- Write to `public/tts/tts_${projectId}_${sceneId}_${version}.mp3`.
- Execute `addSilentPadding(filePath)` for 150ms start/end padding & volume normalization.
- Measure `getAudioDuration(filePath)` using ffprobe/ffmpeg.

### Step 4: Fallback Net
If Vbee API returns an error or times out, log `[VBEE_ERROR]` and fall back to OmniVoice local inference so video rendering never fails.

---

## 4. Verification Plan
1. Check `backend/services/tts.js` handles `vbee_*` voice keys cleanly.
2. Execute test TTS generation script for a `vbee_*` voice.
3. Confirm audio output file generation and correct duration calculation.
