# Dynamic Scenes API Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Bổ sung tính năng thêm và xóa phân cảnh động hoàn chỉnh từ cả phía Backend (API & PostgreSQL DB) và Frontend (nút xóa cảnh trên Card).

**Architecture:** 
- Thêm các hàm `createScene` và `deleteScene` vào dịch vụ `db.js`.
- Khai báo 2 endpoints `/api/projects/:id/scenes` (POST) và `/api/projects/:id/scenes/:sceneId` (DELETE) trong `server.js`.
- Tích hợp nút "Xóa Cảnh" tối giản lên thẻ phân cảnh trong `StoryboardEditor.jsx` và kích hoạt hàm gọi API.

**Tech Stack:** Express, PostgreSQL, React, Axios.

---

### Task 1: Bổ sung các hàm xử lý DB trong db.js

**Files:**
- Modify: `backend/services/db.js`

**Step 1: Viết hàm createScene và deleteScene**
Thêm code triển khai hàm `createScene` (tự động đếm chỉ mục scene và insert) và `deleteScene` (sử dụng transaction để delete và re-index lại thứ tự) vào `module.exports` trong file [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js).

**Step 2: Thực hiện kiểm tra**
Chạy node console và gọi thử các hàm DB để kiểm tra.
Expected: Hàm chạy thành công, phân cảnh được thêm hoặc xóa và các index sắp xếp chính xác trong Postgres.

**Step 3: Commit**
```bash
git add backend/services/db.js
git commit -m "feat: add createScene and deleteScene helper functions in db.js"
```

---

### Task 2: Triển khai các Endpoint API trong server.js

**Files:**
- Modify: `backend/server.js`

**Step 1: Tạo các route POST và DELETE**
Khai báo 2 route `POST /api/projects/:id/scenes` và `DELETE /api/projects/:id/scenes/:sceneId` gọi qua các hàm DB tương ứng.

**Step 2: Thực hiện kiểm tra**
Sử dụng curl hoặc chạy thử trên server để gọi các endpoint này.
Expected: Trả về mã lỗi 201 khi tạo scene thành công và 204 khi xóa thành công.

**Step 3: Commit**
```bash
git add backend/server.js
git commit -m "feat: implement create and delete scenes API endpoints in server.js"
```

---

### Task 3: Tích hợp nút Xóa Cảnh trên Frontend

**Files:**
- Modify: `src/components/StoryboardEditor.jsx`

**Step 1: Thêm nút xóa cảnh dạng Brutalist**
Bổ sung một nút "Xóa Cảnh" nhỏ viền đen ở góc phải của Scene Badge. Khi click vào nút này, thực hiện gọi API `DELETE` và reload lại danh sách.

**Step 2: Thực hiện kiểm tra**
Vào trình duyệt ở trang Storyboard Editor, chọn phân cảnh và click thử nút "Xóa Cảnh".
Expected: Phân cảnh biến mất lập tức khỏi danh sách, thứ tự cảnh tự động cập nhật lại từ đầu.

**Step 3: Commit**
```bash
git add src/components/StoryboardEditor.jsx
git commit -m "feat: add delete scene button and connect API in StoryboardEditor.jsx"
```
