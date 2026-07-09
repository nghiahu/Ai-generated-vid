# TTS Voice Rhythm Improvement Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Improve pronunciation and pause rhythms of custom cloned voices (OmniVoice) and prevent CMU phonetic scripts from corrupting cloud-based voices (ElevenLabs and Microsoft Edge TTS).

**Architecture:** 
1. Add natural punctuation to cloned reference texts in `tts.js` to prompt pauses.
2. Enable speech rate speed control parameter `--speed` in `tts.js` for the local OmniVoice CLI.
3. Clean up input strings passed to ElevenLabs/Edge TTS in `server.js` to exclude phoneme brackets.

**Tech Stack:** Node.js, Express, Microsoft Edge TTS, ElevenLabs API, OmniVoice CLI

---

### Task 1: Update Custom Voice Reference Texts in `tts.js`

**Files:**
- Modify: `backend/services/tts.js:187-208`

**Step 1: Write natural punctuation to refTexts**
Change `refText` for custom voices in `tts.js` to:
*   `isAnhQuy` -> `"Rồi, chào các bạn nhá! Nốt tiếp nội dung của bài liên quan đến ứng dụng quản lý, quản lý sinh viên. Bây giờ là chúng ta sẽ cùng nhau đi giải quyết nốt chức năng phân trang, cho danh sách sinh viên này."`
*   `isDoTrinh` -> `"Giọng trầm ấm, rõ chữ, mang phong cách chuyên nghiệp, hiện đại. Phù hợp cho các nội dung công nghệ, AI, kinh doanh, giáo dục, và phát triển bản thân."`
*   `isBeatvn` -> `"Giáo viên trường trung học phổ thông chuyên Tuyên Quang vừa bị tạm giữ. Từng đạt giải học sinh giỏi quốc gia môn Toán, tuyển thẳng vào đại học, và tốt nghiệp loại giỏi. Sinh năm 1998, được giảng dạy ở một trường chuyên của tỉnh Tuyên Quang, có nghĩa là người thầy giáo này phải thật sự giỏi."`
*   `isBeatvn2` -> `"Ông em khổ nhất TikTok là đây. Chỉ muốn làm họa sĩ, đem những nét vẽ làm đẹp cho đời. Nhưng lên video nào, mọi người cũng khuyên em đi đóng phim. Thật lòng thì em vẽ cũng đẹp thật, nhưng thế méo nào nhìn đi nhìn lại, cũng thấy giống như hai giọt nước."`
*   `isDuyThanh` -> `"Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt. Bỗng dưng từ đâu xuất hiện rất nhiều chuyên gia, am hiểu tường tận mọi lĩnh vực, cái gì cũng phân tích được. Rồi nhiều khóa học xuất hiện hơn, nhiều video xuất hiện hơn, dạy về cách sử dụng, cách tối ưu hóa AI, mà mình thấy tần xuất nó ngày càng dày đặc hơn."`

**Step 2: Add speed control argument to OmniVoice CLI call**
Add `--speed` to arguments inside `backend/services/tts.js`:
```javascript
      const speed = parseFloat(process.env.OMNIVOICE_SPEED) || 0.95;
      const args = [
        "--text", cleanText,
        "--output", relativeWavOutputPath,
        "--language", "Vietnamese",
        "--speed", speed.toString()
      ];
```

**Step 3: Verify syntax and compile check**
Run: `node backend/test_vde.js`
Expected: PASS

**Step 4: Commit**
```bash
git add backend/services/tts.js
git commit -m "feat: add reference text punctuation and speed parameter in tts.js"
```

---

### Task 2: Distinguish TTS Inputs (CMU Phonemes vs Original Text) in `server.js`

**Files:**
- Modify: `backend/server.js:195-200, 290-305, 370-380`

**Step 1: Check voiceKey type and assign appropriate voiceover text**
In `backend/server.js`, locate the three places where `tts.generateTTS` is called. Replace them with:
```javascript
const isOmniVoice = voiceKey.toLowerCase().startsWith("omnivoice_");
const voiceoverText = isOmniVoice ? (scene.voiceoverTts || scene.voiceover) : scene.voiceover;
const ttsResult = await tts.generateTTS(voiceoverText, projectId, scene.id, voiceKey);
```

**Step 2: Verify compilation and run tests**
Run: `node backend/test_vde.js`
Expected: PASS

**Step 3: Commit**
```bash
git add backend/server.js
git commit -m "feat: distinguish phoneme vs original text input based on tts engine in server.js"
```

---

### Task 3: Overall System Verification

**Files:**
- Test: `backend/test_vde.js`
- Verify: Storyboard Editor TTS Generation

**Step 1: Run comprehensive tests**
Run: `node backend/test_vde.js` and `npm run build --prefix my-video`
Expected: PASS

**Step 2: Update checklist progress**
Mark all tasks as completed in `docs/plans/task.md`.
