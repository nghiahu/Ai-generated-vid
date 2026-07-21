# Design Document: Clone & Register Quang Anh Voice (`omnivoice_quanganh`)

**Date:** 2026-07-21  
**Status:** Approved  
**Reference Assets:** `mp3/quang_anh/voice_quang_anh.mp3`, `mp3/quang_anh/voice_quang_anh.txt`

---

## 1. Overview
Register a new offline voice clone option **`omnivoice_quanganh`** ("OmniVoice - Giọng Quang Anh") using the provided reference audio file and transcription text.

---

## 2. Technical Architecture

### 2.1 Backend Support (`backend/services/tts.js`)
- Map `omnivoice_quanganh` / `omnivoice_quang_anh` to:
  - Reference audio: `mp3/quang_anh/voice_quang_anh.mp3`
  - Reference text: `"Năm nay thế giới chi khoảng hai nghìn năm trăm chín mươi tỷ đô cho AI con số này lớn hơn GDP của phần lớn quốc gia trên thế giới nhưng phần thú vị nằm ở chỗ số tiền đó đang kẹt vài con số cho thấy AI không còn là chuyện tương lai chat GPT giờ có chín trăm triệu người dùng mỗi tuần"`
- Ensure `ensureWavReferenceAudio` automatically converts `voice_quang_anh.mp3` to `voice_quang_anh.wav` at 16kHz Mono with smooth fade filters.

### 2.2 Frontend Integration
- Add `<option value="omnivoice_quanganh">OmniVoice - Giọng Quang Anh (Offline Clone)</option>` to:
  - `frontend/src/components/SidebarConfig.jsx`
  - `frontend/src/App.jsx` (TTS Regenerate Modal)

---

## 3. Verification Plan
- Verify `tts.js` voice mapping.
- Verify dropdown option in SidebarConfig & Voice Modal.
- Run test TTS generation for `omnivoice_quanganh`.
