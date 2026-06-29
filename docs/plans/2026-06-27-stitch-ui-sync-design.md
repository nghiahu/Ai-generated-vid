# Thiết Kế Đồng Bộ Giao Diện Local Với Bản Vẽ Stitch AI (Brutalist Monochrome)

Tài liệu này xác định thiết kế giao diện người dùng mới cho ứng dụng **Hyperframes** để khớp 100% với phong cách **Minimalist Monochrome (Trắng/Đen Brutalist)** và cấu hình luồng làm việc 2 chế độ xem đã được thống nhất với người dùng.

---

## 1. Mục Tiêu Thiết Kế
*   **Chuyển đổi hoàn toàn giao diện**: Loại bỏ hoàn toàn các dải màu gradient, hiệu ứng kính mờ (glassmorphism) hay màu neon của bản thử nghiệm cũ.
*   **Phong cách Brutalist Monochrome**: Nền trắng tinh khiết (#ffffff) hoặc xám cực nhạt (#fafafa), văn bản màu đen, viền đen dày (1px đến 3px) với góc bo tròn tối giản (4px), bóng đổ dạng khối đen cứng (`box-shadow: 4px 4px 0px 0px #000000`).
*   **Tách biệt 2 không gian làm việc**:
    *   **Tab 1: Thiết lập & Kịch bản (Video Setup & Script)**.
    *   **Tab 2: Biên tập Storyboard & Trình phát (Storyboard Editor & Master Preview)**.

---

## 2. Kiến Trúc Điều Hướng & Trạng Thế (Navigation & State)
Thêm biến `view` quản lý cấu trúc hiển thị trong `App.jsx`:
*   `VIEW_DASHBOARD`: Màn hình quản lý dự án chính.
*   `VIEW_WORKSPACE_SETUP`: Chế độ cấu hình ban đầu cho dự án đã chọn.
*   `VIEW_WORKSPACE_EDITOR`: Chế độ chỉnh sửa phân cảnh chi tiết và xem trước trình phát.

### Thanh Tiêu Đề Điều Hướng (`TopNavBar`)
Nằm cố định ở đầu màn hình khi vào dự án, chứa:
*   Logo/Thương hiệu **Hyperframes** ở góc trái.
*   Nút "Quay lại" (trở về Dashboard) và hai nút chuyển chế độ xem: "Thiết lập & Kịch bản" và "Biên tập Storyboard".
*   Nút xuất video ở góc phải.

---

## 3. Cấu Trúc Các Màn Hình Chi Tiết

### 3.1. Dashboard (Project Grid)
*   **Lưới thẻ dự án**: Các thẻ dự án sử dụng CSS `border: 2px solid #000000`, `box-shadow: 4px 4px 0px 0px #000000`, có nhãn trạng thái ("DRAFT" / "RENDERED") dạng viên thuốc viền đen và mũi tên chuyển tiếp.
*   **Modal tạo dự án**: Nổi ở giữa màn hình, viền đen dày 4px, có bóng đổ cứng 8px.

### 3.2. Không Gian Thiết Lập & Kịch bản (Tab 1: Workspace Setup)
*   **Cột soạn thảo kịch bản (7/12)**:
    *   Các tab phụ: "Kịch bản AI", "Bài viết thành video", "Kịch bản thủ công" có gạch chân đen khi Active.
    *   Nút "Tạo Storyboard" nằm ở đáy cột, thiết kế to, in hoa đậm nét, kèm biểu tượng AI wand.
*   **Cột cấu hình video (5/12)**:
    *   **Độ dài video**: Nhóm 3 nút bấm liền kề (Short/Medium/Long). Nút đang chọn có nền đen chữ trắng, các nút khác nền trắng chữ đen.
    *   **Giọng đọc & Ngôn ngữ**: Dropdown select sử dụng viền đen dày 2px và biểu tượng mũi tên chỉ xuống tuyệt đối.
    *   **Watermark & Ending Card**: Các block cấu hình được đóng khung viền đen nét mảnh, sử dụng công tắc Toggle Trắng/Đen.

### 3.3. Không Gian Biên Tập Phân cảnh (Tab 2: Workspace Editor)
*   **Thanh điều hướng bên (SideNavBar - 256px)**: Nằm bên trái, hiển thị thông tin dự án hiện tại, liên kết Timeline, Effects, Audio... sử dụng biểu tượng Material Symbols tối giản.
*   **Cột Storyboard Editor (ở giữa)**:
    *   Thẻ phân cảnh: Mỗi thẻ chứa khung xem trước portrait (9:16) mô phỏng Remotion bên trái và các form cấu hình (Layout Family, Heading, Points, Audio, Background Unsplash) bên phải.
    *   Thanh trượt Unsplash gợi ý: Hiển thị 6 ảnh nhỏ tìm kiếm theo từ khóa để click đổi ảnh nhanh.
*   **Cột Master Preview (400px bên phải)**:
    *   Trình phát Remotion đặt trong khung điện thoại 9:16 có bóng đổ cứng 8px.
    *   Scrubber thời gian và cụm nút Play/Pause tối giản dưới trình phát.

---

## 4. Kế Hoạch Đánh Giá & Kiểm Thử (Verification Plan)
*   **Kiểm tra Trực quan**: Đối chiếu chi tiết giao diện local sau khi sửa với ảnh screenshot từ Stitch để đảm bảo tính đồng dạng 100%.
*   **Kiểm tra Luồng làm việc**: Thử nghiệm luồng đi từ Dashboard -> Tạo dự án -> Nhập kịch bản tại Tab 1 -> Nhấn nút tạo storyboard để chuyển sang Tab 2 -> Biên tập, xem thử và xuất video.
