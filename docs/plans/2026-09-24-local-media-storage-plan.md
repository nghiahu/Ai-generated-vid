# Local Media Storage & Media Management Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Chuyển đổi toàn bộ việc lưu trữ và sử dụng ảnh/video sang 100% cục bộ trên máy tính (local disk), loại bỏ Cloudinary khỏi luồng upload & AI generation, đồng thời thêm nút X màu đỏ khi hover để xóa ảnh khỏi kho Your Media.

**Architecture:** 
1. Sử dụng thư mục cục bộ `backend/public/uploads` để lưu trữ ảnh upload và AI Imagen; tự động quét `media_local/` để nhận diện file copy thủ công.
2. Thêm endpoint `POST /api/media/delete` trên Backend để xóa ảnh khỏi database và xóa file vật lý trên ổ cứng.
3. Cập nhật frontend `StoryboardEditor.jsx` và `BatchStudioPage.jsx`: hỗ trợ upload nhiều file máy tính (`multiple`), đổi nhãn giao diện sang lưu máy tính, và hiển thị nút X màu đỏ khi hover vào từng ảnh trong Your Media để xóa ngay lập tức.

**Tech Stack:** Node.js, Express, React, Vite, SQLite (`better-sqlite3`), fs.

---

### Task 1: Add Delete Media Endpoint in Backend (`db.js` & `server.js`)
**Files:**
- Modify: `backend/services/db.js`
- Modify: `backend/server.js`

**Step 1:** Add `deleteUploadedMedia(url)` in `backend/services/db.js` executing `DELETE FROM uploaded_media WHERE url = ?`.
**Step 2:** Add `POST /api/media/delete` route in `backend/server.js`.
- Receive `{ url }`.
- Call `db.deleteUploadedMedia(url)`.
- If the url is a local file (`/uploads/` or `/media_local/`), unlink the physical file safely using `fs.unlinkSync`.
- Return `{ success: true, url }`.

---

### Task 2: Switch AI Image Generation to Save Directly to Local Disk
**Files:**
- Modify: `backend/server.js:435-465`

**Step 1:** In `POST /api/media/generate-ai-image`, replace `cloudinary.uploader.upload` with writing the base64 PNG buffer directly to `path.join(UPLOADS_DIR, filename)`.
**Step 2:** Save local URL `http://localhost:5000/uploads/${filename}` into `db.saveUploadedMedia`.

---

### Task 3: Update `StoryboardEditor.jsx` (Local Upload UI + Hover Red X Delete Button)
**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1:** Update Upload UI:
- Add `multiple` to `<input type="file" ... />`.
- Change copy from `"Đang tải ảnh lên Cloudinary..."` to `"Đang lưu ảnh vào máy tính..."`.
- Change placeholder icon from `☁️` to `💻`.
- Change description to `"Chọn ảnh/video trực tiếp từ máy tính (JPG, PNG, GIF, MP4)"`.

**Step 2:** Add Hover Red X Delete Button in `YOUR_MEDIA` grid:
- Wrap each item with hover state or CSS hover effect.
- Render a round red button with `✕` at top-left.
- On click: call `e.stopPropagation()`, filter out `url` from `previousMedia` and `modalSelectedMedia`, and call `axios.post('http://localhost:5000/api/media/delete', { url })`.

---

### Task 4: Update `BatchStudioPage.jsx` (Local Upload UI + Hover Red X Delete Button)
**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1:** Update Upload UI:
- Add `multiple` to file input.
- Update loading text and descriptions from Cloudinary to local storage.

**Step 2:** Add Hover Red X Delete Button in `YOUR_MEDIA` grid matching `StoryboardEditor.jsx`.

---

### Task 5: End-to-End Verification
**Files:**
- Test `backend/server.js` and frontend build.

**Step 1:** Test file upload and verification that file appears in `backend/public/uploads`.
**Step 2:** Test delete media endpoint with curl/Postman to ensure it removes from DB and disk.
**Step 3:** Verify frontend compile/lint to ensure zero regressions.
