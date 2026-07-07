# Design Document: BeatVN V2 Offline Voice Clone Integration
**Date**: 2026-07-07  
**Topic**: Add "OmniVoice - Giọng BeatVN V2" voice option

## 1. Goal Description
The purpose of this feature is to integrate a newly uploaded reference voice sample (`mp3/beatvn_voice2/beatV2.mp3`) into the local zero-shot offline cloner (OmniVoice). The voice will be exposed in the UI configuration sidebar as "OmniVoice - Giọng BeatVN V2".

---

## 2. Proposed System Architecture

### A. Reference Assets & Transcription
1. Create a reference transcript text file `mp3/beatvn_voice2/beatV2.txt` to preserve the source transcription.
2. The transcript is: `"Ông em khổ nhất tiktok là đây chỉ muốn làm họa sĩ đem những nét vẽ làm đẹp cho đời nhưng lên video nào mọi người cũng khuyên em đi đóng phim thật lòng thì em vẽ cũng đẹp thật nhưng thế méo nào nhìn đi nhìn lại cũng thấy giống như hai giọt nước"`.

### B. Backend Mapping (TTS Service)
Configure the `omnivoice_beatvn2` key inside `backend/services/tts.js`:
- Map `refAudioPath` to `path.join(__dirname, '../../mp3/beatvn_voice2/beatV2.mp3')`.
- Map `refText` to the transcript string.
- Automatically flag `isMale` as true to instruct the cloner model.
- Convert reference audio to 16kHz Mono WAV automatically using existing `ensureWavReferenceAudio` method during first-run pipeline.

### C. Frontend Selection (Sidebar UI)
Add `<option value="omnivoice_beatvn2">OmniVoice - Giọng BeatVN V2 (Offline Clone)</option>` in the AI Voice selection dropdown within `frontend/src/components/SidebarConfig.jsx`.

---

## 3. Verification Plan
- **Backend check**: Run compilation check `node -c services/tts.js`.
- **UI check**: Verify that the new option appears in the "AI Voice" select input in the editor's sidebar configuration.
- **End-to-End Test**: Generate a small scene using the "Giọng BeatVN V2" voice and inspect generated audio output files under `public/tts/` to confirm that the offline voice inference compiles successfully.
