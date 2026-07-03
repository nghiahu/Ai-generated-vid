# Cloudinary Image Upload Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Hiện thực hóa chức năng upload ảnh nền cho phân cảnh từ máy tính cá nhân lên Cloudinary thông qua API Backend an toàn, đồng bộ lên giao diện và Remotion.

**Architecture:**
1. Thêm credentials vào `.env` của Backend.
2. Cài đặt thư viện `cloudinary` vào Backend dependencies.
3. Tạo endpoint `POST /api/upload` tiếp nhận base64 và đẩy lên Cloudinary.
4. Viết hàm `handleImageUploadClick` trong `StoryboardEditor.jsx` để kích hoạt file chooser, đọc FileReader, gọi API và cập nhật phân cảnh.

**Tech Stack:** React, Node.js, Express, Axios, Cloudinary SDK.

---

### Task 1: Cấu hình biến môi trường Backend
**Files:**
- Modify: [.env](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/.env)

**Step 1: Thêm keys vào backend/.env**
Thêm 3 dòng cấu hình ở cuối tệp:
```env
CLOUDINARY_CLOUD_NAME=dimxrq8bs
CLOUDINARY_API_KEY=636233979283876
CLOUDINARY_API_SECRET=t2Te_smeTLPl5oVvS7Ow95fckRs
```

---

### Task 2: Cài đặt thư viện `cloudinary` ở Backend
**Step 1: Chạy lệnh cài đặt**
Chạy `npm install cloudinary` tại thư mục `backend`.

---

### Task 3: Xây dựng Endpoint API `POST /api/upload`
**Files:**
- Modify: [server.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/server.js)

**Step 1: Import, cấu hình Cloudinary SDK và viết route POST /api/upload**
Thêm thư viện cloudinary v2 và viết code cấu hình. Viết route express tiếp nhận payload `{ file: "base64String" }` và gọi upload.

---

### Task 4: Hiện thực chọn tệp và Upload ở Frontend
**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Thêm state uploadingScenes và hàm handleImageUploadClick**
*   Thêm hook `useState` cho `uploadingScenes`.
*   Tạo hàm `handleImageUploadClick` để tạo động file input, đọc Base64 và post lên backend.
*   Gắn sự kiện click vào nút Upload hiện có của giao diện.

---

### Kế hoạch Kiểm thử & Xác minh (Verification Plan)
1.  Khởi chạy Backend và Frontend.
2.  Mở Web UI, click nút Upload, chọn một ảnh nhỏ từ máy.
3.  Xác nhận nút chuyển sang "⏳ Uploading..." và sau đó hiển thị ảnh thành công ở Preview 9:16 và ô danh sách media.
4.  Kiểm tra xem file build của frontend và backend có biên dịch lỗi không.
