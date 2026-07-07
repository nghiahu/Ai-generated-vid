# Visual VDE Style Previews and Claude & Light Styles Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Loại bỏ "Video Theme" cũ bị trùng lặp, nâng cấp Modal chọn Style bằng code hiển thị giao diện mô phỏng độ nét cao (sử dụng quote mẫu về AI) và tích hợp các phong cách mới (Claude & Light).

**Architecture:** 
1. Xóa bỏ hoàn toàn mục "Video Theme" cũ trên `SidebarConfig.jsx`.
2. Tạo các thành phần render Viewport mô phỏng UI chi tiết trong Modal `showStyleModal` của `StoryboardEditor.jsx` sử dụng đúng tokens màu sắc, kiểu chữ và các nút pill mô phỏng (ví dụ style Claude có các pill viền cam nền kem).
3. Sử dụng văn bản thực tế về kỷ nguyên AI làm nội dung mẫu cho các card preview.

**Tech Stack:** React, CSS, Node.js, Express, Remotion.

---

### Task 1: Bỏ cấu hình "Video Theme" cũ và dọn dẹp SidebarConfig

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx`

**Step 1: Xóa mục Video Theme cũ**
Xóa bỏ đoạn code HTML/CSS hiển thị dropdown "Video Theme" cũ (dòng 204-220). Chỉ giữ lại duy nhất dropdown "Visual Design Style (VDE)" và các checkbox Traits.

---

### Task 2: Cập nhật giao diện Modal chọn Phong cách chi tiết độ nét cao bằng Code

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Định nghĩa cấu trúc vẽ Viewport chi tiết**
Thay thế logic render phần grid trong Modal `showStyleModal` bằng hàm vẽ mô phỏng các thẻ video thực tế áp dụng đúng VDE Tokens của từng phong cách.

- **Minimalist Dark**: Thẻ kính mờ xanh lam, badge "MẸO • AI VIDEO", tiêu đề "AI THAY ĐỔI TOÀN DIỆN", 2 gạch đầu dòng mô tả, dấu chấm xanh.
- **Apple Keynote**: Nền đen, tiêu đề lớn màu trắng "KỶ NGUYÊN AI MỚI", mô tả phụ xám sáng.
- **Claude Editorial**: Nền kem cát, chấm tròn cam gạch trang trí, tiêu đề chữ serif "RA LỆNH LÀ CÓ VIDEO TÓP TÓP", các pill nhỏ "Không tự quay", "Không cầm máy" ở góc dưới.
- **Minimalist Light**: Nền trắng tinh, thẻ xám nhạt, màu nhấn xanh hoàng gia, tiêu đề "AI THAY ĐỔI TOÀN DIỆN".
- **Cyberpunk Grid**: Nền đen grid tím, viền hồng/cyan rực rỡ, dòng code console `$ git commit -m "ai"`.
- **Anime Sketch**: Nền giấy kem, viền thô đen dày, đổ bóng cứng lệch phải, tiêu đề chữ nét tay đậm.
