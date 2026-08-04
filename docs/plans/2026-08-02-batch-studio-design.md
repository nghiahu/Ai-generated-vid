# Design Document: Batch Studio — Sản xuất video Hàng loạt

## Mô tả

Tính năng "Hàng loạt" cho phép người dùng nhập **nhiều kịch bản** cùng lúc và hệ thống sẽ **tự động tạo từng video Studio** tuần tự, dùng chung một bộ cài đặt (Video Setup).

---

## Layout & UX

### Trang Batch (view === "BATCH")

Chia 2 cột:
- **Cột trái (flex 1)**: Danh sách các ô kịch bản
- **Cột phải (~380px)**: SidebarConfig dùng chung (Video Setup: voice, theme, BGM, watermark...)

### Ô kịch bản

Mỗi ô hiển thị:
- Label `#1`, `#2`, ... (đánh số thứ tự)
- `<textarea>` nhập kịch bản chi tiết (giống textarea trong StoryboardEditor mode="setup")
- Nút `[✕ Xóa]` ở góc phải (không hiển thị nếu chỉ còn 1 ô)
- Badge trạng thái (hiển thị khi đang/đã chạy): `⏳ Đang chờ` / `🔄 Đang xử lý...` / `✅ Xong — "Tên dự án"` / `❌ Lỗi: message`

Dưới danh sách:
- Nút `[+ Thêm kịch bản]`

Footer (dưới cùng cột trái):
- Thanh progress tổng: `"Đang xử lý 2 / 5 kịch bản..."` (chỉ hiện khi đang chạy)
- Nút `[▶ Tạo tất cả X kịch bản]` (disabled khi đang chạy)

---

## Trạng thái từng ô kịch bản

```
type ScriptSlotStatus = "idle" | "pending" | "running" | "done" | "error"

interface ScriptSlot {
  id: string          // uuid ngắn
  text: string        // nội dung kịch bản
  status: ScriptSlotStatus
  projectName?: string  // tên dự án sau khi tạo xong
  error?: string        // thông báo lỗi nếu có
}
```

---

## Luồng xử lý (Frontend-only, tuần tự)

1. User nhấn **"Tạo tất cả"**
2. Validate: lọc bỏ các slot có `text` trống
3. Set tất cả slot status = `"pending"`
4. Lần lượt xử lý từng slot:
   a. Set slot.status = `"running"`
   b. Gọi `api.createProject(title)` → lấy projectId
   c. Gọi `api.updateProjectConfig(projectId, sharedConfig)`
   d. Gọi `api.generateStoryboard(projectId, scriptText, visualStyle, traits, [])`
   e. Nếu thành công: set slot.status = `"done"`, slot.projectName = tên dự án
   f. Nếu lỗi: set slot.status = `"error"`, slot.error = message; **tiếp tục** slot tiếp theo
5. Sau khi hết tất cả → gọi `fetchProjects()` (refresh danh sách dự án)
6. Sau 2 giây → tự điều hướng về view `"PROJECTS"`

---

## Kỹ thuật Implementation

### Files thay đổi

#### [MODIFY] `frontend/src/App.jsx`
- Thêm component `BatchStudioPage` inline hoặc tách file riêng
- Thay phần `view === "BATCH"` placeholder bằng `<BatchStudioPage ... />`
- Truyền props: `draftConfig`, `setDraftConfig`, `fetchProjects`, `setView`, `showToast`

#### [NEW] `frontend/src/components/BatchStudioPage.jsx`
- Quản lý state `scriptSlots[]`
- Xử lý batch run logic (async sequential)
- Render UI 2 cột với SidebarConfig

### Dependencies
- Tái sử dụng `SidebarConfig` nguyên si
- Tái sử dụng `api.createProject`, `api.updateProjectConfig`, `api.generateStoryboard` từ `services/api`
- Không cần backend mới

---

## Verification

- Thêm ≥2 kịch bản, nhấn Tạo tất cả → từng ô chuyển trạng thái đúng
- Nếu 1 ô lỗi → ô tiếp theo vẫn chạy
- Sau khi xong → danh sách Dự án có đúng số project mới
- Trên mobile layout (nếu có): cột sidebar collapse xuống dưới
