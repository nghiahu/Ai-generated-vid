# Thiết kế: Import trực tiếp File Markdown làm Kịch bản Video

Tài liệu này mô tả thiết kế kỹ thuật cho tính năng import trực tiếp tệp tin Markdown (`.md`) hoặc văn bản (`.txt`) từ thiết bị cục bộ của người dùng để đưa trực tiếp vào ô nhập kịch bản (Voiceover Script) trong ứng dụng, áp dụng cho cả dự án đơn lẻ và quy trình sản xuất hàng loạt.

## 1. Mục tiêu & Trải nghiệm Người dùng
- **Tiết kiệm thao tác**: Người dùng không cần mở file kịch bản trên máy tính, bôi đen, copy và paste vào trình duyệt. Chỉ cần click nút tải file và chọn file `.md` hoặc `.txt`.
- **Giữ nguyên cấu trúc**: Giữ lại toàn bộ cấu trúc file MD bao gồm metadata, bảng kịch bản phân cảnh (để Backend AI phân tích tốt nhất).
- **Phản hồi trực quan**: Có thông báo (Toast) hiển thị trạng thái và thông số file đã import (ví dụ: tên file, số ký tự).

---

## 2. Thiết kế Giao diện (UI/UX)
Chúng ta sẽ bổ sung nút tải file ở 2 màn hình chính:

### A. Giao diện Thiết lập dự án đơn lẻ (`StoryboardEditor.jsx`)
- Vị trí: Đặt bên cạnh nhãn "Kịch bản chi tiết" ở chế độ `setup`.
- Kiểu dáng: Nút bấm tối giản nhưng cao cấp, bo góc lớn, icon tệp tin 📝 hoặc 📥, có hiệu ứng hover mượt mà với nền và viền.

### B. Giao diện Chạy hàng loạt (`BatchStudioPage.jsx`)
- Vị trí: Đặt ở góc phải phía trên của mỗi ô kịch bản (slot), ngay cạnh tiêu đề `#1`, `#2`.
- Kiểu dáng: Nút nhỏ gọn, tinh tế để không làm chật bố cục cột kịch bản hàng loạt.

---

## 3. Giải pháp Kỹ thuật (Frontend)
Sử dụng API `FileReader` có sẵn trong trình duyệt để xử lý đọc file hoàn toàn ở client-side:
- Hỗ trợ định dạng mở rộng: `.md` và `.txt`.
- Hàm đọc file sẽ tải toàn bộ văn bản UTF-8 và cập nhật state quản lý kịch bản:
  - Dự án đơn lẻ: Cập nhật state `scriptText` trong `StoryboardEditor.jsx`.
  - Dự án hàng loạt: Cập nhật trường `text` của slot cụ thể trong mảng `slots` của `BatchStudioPage.jsx`.
- Hiển thị thông báo Toast thành công hoặc lỗi (nếu file không hợp lệ hoặc rỗng).

---

## 4. Kế hoạch Xác minh (Verification Plan)
- **Kiểm thử thủ công**:
  1. Tạo dự án mới, tại bước nhập kịch bản, nhấn nút "Tải kịch bản (.md/.txt)". Chọn một tệp kịch bản mẫu chứa bảng phân cảnh. Xác nhận nội dung tệp hiển thị đầy đủ trong ô nhập và không bị lỗi font tiếng Việt (UTF-8).
  2. Truy cập màn hình Batch Studio, nhấn nút "Import" ở slot #1, chọn tệp kịch bản. Xác nhận nội dung slot #1 thay đổi theo tệp, các slot khác không bị ảnh hưởng.
  3. Kiểm tra thông báo Toast hiển thị đúng tên file và số lượng từ/ký tự vừa import.
