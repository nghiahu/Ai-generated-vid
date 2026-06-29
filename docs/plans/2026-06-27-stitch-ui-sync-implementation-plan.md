# Stitch UI Sync Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Đồng bộ hoàn toàn giao diện React ở local khớp 100% với các bản vẽ thiết kế Brutalist Monochrome (Trắng/Đen) trên Stitch AI.

**Architecture:** Chia Workspace làm 2 chế độ hiển thị (Tab 1: Setup & Script, Tab 2: Storyboard Editor & Player) trong App.jsx, cập nhật phong cách CSS Brutalist (viền solid 2px đen, bo góc 4px, bóng đổ cứng) cho toàn bộ các component.

**Tech Stack:** React, CSS Vanilla, @remotion/player.

---

### Task 1: Cập nhật CSS & Thiết lập Hệ thống Màu (Brutalist Theme)

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/index.css`

**Step 1: Cập nhật các biến CSS trong theme.css**
Sửa đổi các biến màu sắc và nút bấm trong `src/styles/theme.css` để đồng bộ đúng font chữ, màu nền trắng (#ffffff), và viền đen dày đặc trưng của Stitch.

**Step 2: Thực hiện kiểm tra**
Chạy ứng dụng bằng lệnh: `npm run dev` (nếu chưa chạy) và kiểm tra giao diện bằng cách mở trình duyệt ở port 5173.
Expected: Toàn bộ body chuyển sang màu nền trắng, các nút bấm có bóng đổ đen cứng 2px.

**Step 3: Commit**
```bash
git add src/styles/theme.css src/index.css
git commit -m "style: update brutalist theme CSS variables and button shadows"
```

---

### Task 2: Tích hợp TopNavBar & Cơ chế chuyển Tab trong App.jsx

**Files:**
- Modify: `src/App.jsx`

**Step 1: Định nghĩa các view state và render Top điều hướng**
Thay đổi hàm render trong `src/App.jsx` để thêm TopNavBar. Logo thương hiệu là "Hyperframes", các liên kết điều hướng "Projects", "Assets", "Team", "Settings".
Khi chọn một dự án, hiển thị thêm 2 nút tab điều hướng ở Header: "Thiết lập & Kịch bản" và "Biên tập Storyboard".

**Step 2: Thực hiện kiểm tra**
Mở giao diện local, chọn một dự án bất kỳ.
Expected: Phía đầu trang hiển thị TopNavBar màu trắng có viền đen dày ở dưới, click qua lại 2 tab làm thay đổi state hiển thị.

**Step 3: Commit**
```bash
git add src/App.jsx
git commit -m "feat: add TopNavBar and 2-tab view routing to App.jsx"
```

---

### Task 3: Tái cấu trúc Dashboard (Project Grid)

**Files:**
- Modify: `src/components/Dashboard.jsx`

**Step 1: Sửa đổi giao diện Grid**
Thay đổi `src/components/Dashboard.jsx` để hiển thị lưới thẻ dự án với viền đen solid 2px, bóng đổ đen cứng 4px, hover chuyển động tịnh tiến và nút CTA có bóng đổ 4px. Thêm nhãn trạng thái ("DRAFT" / "COMPLETED") viền đen, bo góc tròn.

**Step 2: Thực hiện kiểm tra**
Mở trang Dashboard của ứng dụng.
Expected: Danh sách dự án hiển thị dạng lưới thẻ khớp với thiết kế Project Grid trên Stitch.

**Step 3: Commit**
```bash
git add src/components/Dashboard.jsx
git commit -m "feat: redesign Dashboard project listing grid to match Stitch"
```

---

### Task 4: Tái cấu trúc Video Setup & Script Editor (Tab 1)

**Files:**
- Modify: `src/components/SidebarConfig.jsx`
- Modify: `src/components/StoryboardEditor.jsx` (Phần form nhập kịch bản ban đầu)

**Step 1: Tạo giao diện 2 cột của Tab 1**
*   Cột trái: Trình soạn thảo kịch bản gồm tabs "Kịch bản AI", "Bài viết thành video", "Kịch bản thủ công", ô nhập "Chủ đề video", ô nhập kịch bản "Kịch bản chi tiết" và nút "TẠO STORYBOARD" có icon đũa thần.
*   Cột phải: "Video Setup" gồm Video Length selector (nút liền khối), Language & AI Voice dropdown, bảng Watermark (có toggle, ô logo upload) và Ending Scene (có toggle, website input).

**Step 2: Thực hiện kiểm tra**
Vào Tab 1 của workspace dự án.
Expected: Giao diện hiển thị đúng 2 cột, các input/select hoạt động trơn tru.

**Step 3: Commit**
```bash
git add src/components/SidebarConfig.jsx src/components/StoryboardEditor.jsx
git commit -m "feat: align Tab 1 (Video Setup & Script) layout with Stitch"
```

---

### Task 5: Tái cấu trúc Storyboard Editor Cards (Tab 2)

**Files:**
- Modify: `src/components/StoryboardEditor.jsx`

**Step 1: Sửa đổi cấu trúc thẻ Scene**
Cập nhật danh sách Scene Cards. Mỗi card chia làm 2 phần:
*   Bên trái: Khung xem trước portrait 9:16 chứa mô phỏng văn bản hiển thị (Heading in đậm hoa, gạch đầu dòng, voiceover ở đáy).
*   Bên phải: Form cấu hình (Layout Family, Visual Layout, Placement, Heading, Points, Voiceover, Unsplash media selector với 6 hình ảnh gợi ý).

**Step 2: Thực hiện kiểm tra**
Vào Tab 2 của workspace.
Expected: Các Scene cards hiển thị đúng định dạng brutalist, khung xem trước 9:16 hiển thị trực quan thông tin scene.

**Step 3: Commit**
```bash
git add src/components/StoryboardEditor.jsx
git commit -m "feat: update StoryboardEditor scene cards styling"
```

---

### Task 6: Tái cấu trúc Master Player & Render Progress (Tab 2)

**Files:**
- Modify: `src/components/MasterPlayer.jsx`

**Step 1: Sửa đổi Master Preview cột phải**
Cập nhật `src/components/MasterPlayer.jsx`:
*   Khung xem trước di động 9:16 có bóng đổ cứng 8px chứa Remotion Player.
*   Hệ thống Scrubber, thời lượng thời gian, và các phím điều khiển Play/Pause/Skip tối giản ở đáy.
*   Thanh hiển thị tiến trình kết xuất video dạng thanh tiến trình đặc (nền trắng viền đen dày, phần hoàn thành tô đen) và nút "Tải Video MP4".

**Step 2: Thực hiện kiểm tra**
Kiểm thử tính năng xem trước và nhấn xuất video ở cột phải.
Expected: Master Player hiển thị và hoạt động đúng, thanh tiến trình render chạy và hiển thị nút tải video khi hoàn thành.

**Step 3: Commit**
```bash
git add src/components/MasterPlayer.jsx
git commit -m "feat: overhaul MasterPlayer layout and render progress bar"
```
