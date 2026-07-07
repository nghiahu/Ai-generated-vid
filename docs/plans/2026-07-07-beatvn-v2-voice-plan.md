# BeatVN V2 Voice Clone Integration Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Integrate the newly uploaded reference voice `mp3/beatvn_voice2/beatV2.mp3` as an offline clone option named "OmniVoice - Giọng BeatVN V2" under local OmniVoice CLI.

**Architecture:** 
1. Create a documentation transcript text file at `mp3/beatvn_voice2/beatV2.txt`.
2. Register the `omnivoice_beatvn2` key inside `backend/services/tts.js` mapping the file paths and transcription text.
3. Add the selection option inside `frontend/src/components/SidebarConfig.jsx` dropdown.

**Tech Stack:** Node.js, Express, React, OmniVoice zero-shot cloner, FFmpeg.

---

### Task 1: Create transcription file for BeatVN V2 voice sample

**Files:**
- Create: `mp3/beatvn_voice2/beatV2.txt`

**Step 1: Write the transcript text**
Create `mp3/beatvn_voice2/beatV2.txt` containing the Vietnamese transcription text.

```text
Ông em khổ nhất tiktok là đây chỉ muốn làm họa sĩ đem những nét vẽ làm đẹp cho đời nhưng lên video nào mọi người cũng khuyên em đi đóng phim thật lòng thì em vẽ cũng đẹp thật nhưng thế méo nào nhìn đi nhìn lại cũng thấy giống như hai giọt nước
```

**Step 2: Save the file**

**Step 3: Commit**
```bash
git add mp3/beatvn_voice2/beatV2.txt
git commit -m "docs: add transcript file for BeatVN V2 voice sample"
```

---

### Task 2: Register omnivoice_beatvn2 key on backend TTS service

**Files:**
- Modify: `backend/services/tts.js:235-265`

**Step 1: Map refAudioPath and refText**

Add `isBeatvn2` check and map reference text/paths:

```javascript
      const isAnhQuy = voiceKey.toLowerCase() === "omnivoice_anhquy";
      const isDoTrinh = voiceKey.toLowerCase() === "omnivoice_dotrinh";
      const isBeatvn = voiceKey.toLowerCase() === "omnivoice_beatvn";
      const isBeatvn2 = voiceKey.toLowerCase() === "omnivoice_beatvn2";
      const isMale = voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy || isDoTrinh || isBeatvn || isBeatvn2;
      
      const refFileName = isMale ? "ref_vietnamese_male.wav" : "ref_vietnamese_female.wav";
      let refAudioPath = isAnhQuy 
        ? path.join(__dirname, '../../mp3/anhquy/voice_anh_quy.mp3')
        : isDoTrinh
        ? path.join(__dirname, '../../mp3/elevenlab/do_trinh/voice_preview_đô trịnh - giọng hay.mp3')
        : isBeatvn
        ? path.join(__dirname, '../../mp3/beatvn/voice_beatvn.mp3')
        : isBeatvn2
        ? path.join(__dirname, '../../mp3/beatvn_voice2/beatV2.mp3')
        : path.join(refsDir, refFileName);
      let refText = isAnhQuy 
        ? "Rồi chào các bạn nhá nốt tiếp nội dung của bài liên quan đến ứng dụng quản lý quản lý sinh viên bây giờ là chúng ta sẽ cùng nhau đi giải quyết nốt chức năng phân trang cho danh sách sinh viên này"
        : isDoTrinh
        ? "Giọng trầm ấm, rõ chữ, mang phong cách chuyên nghiệp, hiện đại, phù hợp cho các nội dung công nghệ, AI, kinh doanh, giáo dục và phát triển bản thân"
        : isBeatvn
        ? "giáo viên trường trung học phổ thông chuyên Tuyên Quang vừa bị tạm giữ từng đạt giải học sinh giỏi quốc gia môn Toán tuyển thẳng vào đại học và Tốt nghiệp loại giỏi sinh năm 1998 được giảng dạy ở một trường chuyên của tỉnh Tuyên Quang có nghĩa là người thầy giáo này phải thật sự giỏi"
        : isBeatvn2
        ? "Ông em khổ nhất tiktok là đây chỉ muốn làm họa sĩ đem những nét vẽ làm đẹp cho đời nhưng lên video nào mọi người cũng khuyên em đi đóng phim thật lòng thì em vẽ cũng đẹp thật nhưng thế méo nào nhìn đi nhìn lại cũng thấy giống như hai giọt nước"
        : "Hệ thống trí tuệ nhân tạo đang tạo giọng nói mẫu.";
```

And update the reference folder check:
```javascript
      if (!isAnhQuy && !isDoTrinh && !isBeatvn && !isBeatvn2 && !fs.existsSync(refAudioPath)) {
```

**Step 2: Save the file changes**

**Step 3: Check syntax**
Run: `node -c services/tts.js` inside `backend` folder
Expected: Success

**Step 4: Commit**
```bash
git add backend/services/tts.js
git commit -m "feat(backend): map omnivoice_beatvn2 reference voice in TTS service"
```

---

### Task 3: Add selection option to Sidebar config UI

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx:150-160`

**Step 1: Add new option tag**

Under `omnivoice_beatvn`, add:
```html
              <option value="omnivoice_beatvn2">OmniVoice - Giọng BeatVN V2 (Offline Clone)</option>
```

**Step 2: Save the file changes**

**Step 3: Commit**
```bash
git add frontend/src/components/SidebarConfig.jsx
git commit -m "feat(frontend): expose omnivoice_beatvn2 voice option in sidebar config dropdown"
```

---

### Task 4: End-to-end verification

**Step 1: Verify UI Select**
Open the application configuration sidebar and confirm that the "OmniVoice - Giọng BeatVN V2" option is visible.

**Step 2: Generate TTS test**
Select "OmniVoice - Giọng BeatVN V2", edit a scene transcript, play preview, and check that the cloner model synthesizes the voice successfully.
