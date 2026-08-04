# Exact UI Remediation Plan for Batch Studio

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Chỉnh sửa giao diện trang Hàng loạt (Batch Studio) để giữ nguyên kiểu dáng, nút bấm, và Modals (Chọn style VDE, Chọn ảnh Project Images) giống hệt với giao diện gốc của Studio.

**Architecture:** 
- Xoá bỏ các phần điều khiển Theme và Media tùy biến ở cột phải của `BatchStudioPage.jsx`.
- Đưa hàng nút bấm `🖼️ MEDIA (X)` và `TẠO STORYBOARD 🪄` xuống cuối khu vực kịch bản cột trái, căn chỉnh trái/phải chính xác theo screenshot.
- Tái tạo Modal Chọn Style VDE chuẩn mẫu card 9:16 có hiệu ứng hover & lựa chọn.
- Tái tạo Modal Project Images chuẩn tab & thanh preview phía dưới.

---

## Task 1: Thiết lập VDE_PRESET_STYLES và UI modals chuẩn trong BatchStudioPage.jsx

**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Khai báo VDE_PRESET_STYLES và state phụ trợ**

Đảm bảo đầu file `BatchStudioPage.jsx` định nghĩa sẵn `VDE_PRESET_STYLES` giống `StoryboardEditor.jsx` và thêm state `showStyleModal`.

**Step 2: Sửa luồng chạy handleRunBatch**

Sửa `handleConfirmStyle` để đóng style modal và bắt đầu chạy batch:
```javascript
  const handleConfirmStyle = () => {
    setShowStyleModal(false);
    handleRunBatch();
  };
```

**Step 3: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat(batch): align batch page modals config and logic with Studio"
```

---

## Task 2: Cập nhật giao diện cột trái (Script list footer) và cột phải (Sidebar)

**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Đưa nút MEDIA (X) và TẠO STORYBOARD 🪄 vào footer cột trái**

Thay thế khu vực chân trang cũ bằng dòng chứa nút:
- Trái: Nút `🖼️ MEDIA (X)` dạng pill trắng viền slate mảnh.
- Phải: Nút `TẠO STORYBOARD 🪄` dạng button gradient class `primary`.

**Step 2: Sửa cột phải thành SidebarConfig nguyên bản**

Xóa bỏ hoàn toàn section Theme & Media tự tạo ở trên cùng cột phải. Chỉ render `<SidebarConfig config={sharedConfig} onChange={onConfigChange} />` chiếm trọn cột phải.

**Step 3: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "style(batch): update layout footer buttons and sidebar configuration"
```

---

## Task 3: Tái tạo chi tiết 2 Modals (Style & Images) chuẩn thiết kế gốc

**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Code `renderStyleModal` và `renderMediaModal` chuẩn**

Nhúng trực tiếp phần render JSX của 2 modal này giống hệt trong `StoryboardEditor.jsx` vào `BatchStudioPage.jsx`.

**Step 2: Check compiler và build test**

Chạy `npm run build` để kiểm tra biên dịch frontend.

**Step 3: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat(batch): implement identical Style and Media modals for Batch Studio"
```
