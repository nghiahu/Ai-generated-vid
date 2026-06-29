# Light Glassmorphism UI Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Cập nhật toàn diện giao diện người dùng (UI/UX) của ứng dụng Hyperframes cục bộ sang phong cách sáng sủa Luminous Light Glassmorphism đón sáng hiện đại.

**Architecture:** Điều chỉnh các biến CSS và tiện ích lớp phủ (utility classes) trong file `frontend/src/styles/theme.css`. Cập nhật các nút bấm, viền và khung preview trong `App.jsx`, `Dashboard.jsx`, và `MasterPlayer.jsx` để ăn khớp với giao diện kính mờ và gradient pastel động.

**Tech Stack:** React, Vanilla CSS, Vite.

---

### Task 1: Cập nhật CSS theme.css với các token kính mờ sáng
**Files:**
- Modify: `frontend/src/styles/theme.css`

**Step 1: Định nghĩa lại các biến CSS**
Thay đổi nền, màu chữ xám slate đậm, viền kính trắng mờ và đổ bóng nhẹ diện rộng.
**Step 2: Cấu trúc lại các utility classes**
Cập nhật `.btn-mono` thành dạng nút tròn trơn láng, `.btn-mono-primary` thành gradient tím-xanh rực rỡ, `.form-input-mono` và `.border-strict` sang dạng kính mờ mượt mà góc bo rộng 12px.

---

### Task 2: Cập nhật Dashboard.jsx sang giao diện thẻ kính mờ sáng
**Files:**
- Modify: `frontend/src/components/Dashboard.jsx`

**Step 1: Bổ sung background gradient pastel**
Thêm các div tạo đốm sáng mờ nhẹ ở góc nền của Dashboard.
**Step 2: Cập nhật style cho thẻ dự án và nút tạo mới**
*   Chuyển đổi nút "New Project" thành dạng gradient viên thuốc.
*   Cập nhật các thẻ dự án sử dụng chất liệu kính mờ viền trắng mảnh và đổ bóng mịn.

---

### Task 3: Cập nhật MasterPlayer.jsx và chỉnh sửa nhỏ App.jsx
**Files:**
- Modify: `frontend/src/components/MasterPlayer.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Cải tiến MasterPlayer.jsx**
Đổi khung điện thoại giả lập từ viền đen dày brutalist sang dạng màu bạc/trắng sang trọng, có viền bóng tỏa nhẹ xung quanh.
**Step 2: Cập nhật cấu trúc App.jsx**
Đảm bảo thanh TopNavBar điều hướng phía trên có phong cách kính mờ trắng, viền dưới mờ mảnh thay vì viền đen gắt gao.

---

### Task 4: Chạy xác minh và kiểm thử
**Files:**
- Test: Chạy linter cho frontend.
- Test: Preview trực quan giao diện localhost.

**Step 1: Chạy linter**
Run: `npm run lint` ở thư mục frontend hoặc verify build.
Expected: Build thành công không có lỗi CSS hoặc React.
