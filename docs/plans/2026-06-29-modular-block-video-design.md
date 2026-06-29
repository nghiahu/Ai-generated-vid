# Thiết kế Hệ thống Video Phân cảnh Mô-đun Động (Dynamic Modular Blocks Video Layout)

Tài liệu này đặc tả thiết kế kỹ thuật cho việc nâng cấp giao diện video trong dự án tạo video tự động. Thay đổi từ bố cục đơn điệu dạng PowerPoint sang bố cục dạng các khối kính mờ phân mảnh (Modular Blocks Layout) xếp dọc màn hình 9:16, kết hợp hiệu ứng nền quầng sáng chuyển động (light leaks) và tàn lửa bay (ember sparks).

## 1. Mục tiêu (Goals)
*   **Thiết kế cao cấp mô-đun (Premium Modular UI):** Trình bày các điểm ý chính (`points`) thành các khối hộp chuyên biệt tự động nhận diện bố cục (badges, hero metrics, highlight boxes, terminal commands).
*   **Tránh dùng ảnh stock bừa bãi:** Chuyển sang sử dụng nền nghệ thuật tối màu với hiệu ứng quầng sáng chuyển động chậm (teal & orange light leaks) và tàn lửa cam lấp lánh trôi ngược lên.
*   **Tối ưu hóa phông chữ:** Sử dụng phông chữ `Outfit` đậm chất công nghệ để căn lề tiêu đề.

---

## 2. Đặc tả Chi tiết Kỹ thuật

### A. Tự động Phân tích Bố cục (Auto-Layout Parser) ở Frontend
Lớp giao diện nội dung sẽ phân tích mảng `points` và tự động phân luồng hiển thị:
1.  **Tag Badges Row:** Nhận diện dòng chứa dấu phẩy `,` hoặc chứa các emoji đặc trưng (`⭐`, `🔥`, `MIT`). Chia thành các tag nhỏ hiển thị nằm ngang.
2.  **Hero Metric Card:** Nhận diện dòng chứa số/phép toán và đơn vị ở đầu dòng (ví dụ: `-99% token`).
    *   Tô lớn chữ chỉ số màu cam rực.
    *   Nếu có văn bản giải thích sau dấu gạch ngang hoặc trong dấu ngoặc đơn, tự động hiển thị phía dưới và áp dụng gạch ngang chữ (`<s>`).
3.  **Highlight Neon Card:** Nhận diện dòng chứa ký so sánh `<`/`>` hoặc các đơn vị tốc độ `ms`.
    *   Hiển thị chỉ số dạng chữ xanh ngọc lớn.
    *   Bọc trong hộp kính mờ viền xanh neon nổi bật.
4.  **Terminal Command Box:** Nhận diện dòng bắt đầu bằng dấu `$` hoặc chứa lệnh code (`curl`, `npm install`, v.v.).
    *   Hiển thị hộp đen viền cam, chữ monospace, giả lập dấu nháy lệnh nhấp nháy.

---

### B. Nền quầng sáng chuyển động & Tàn lửa (Ember Background & Light Leaks)
Xây dựng component nền nghệ thuật trong Remotion:
1.  **Base:** Nền tối màu `radial-gradient` chạy từ `#030e1a` ra `#000000`, kèm lưới chấm mờ.
2.  **Light Leaks:** Hai quầng sáng khổng lồ mờ sâu (`blur(80px)`) ở góc trên bên phải (màu cam) và dưới bên trái (màu cyan), chuyển động dao động chậm rãi bằng hàm `Math.sin(frame * 0.02)`.
3.  **Ember Overlay:** 25-30 tàn lửa cam SVG/CSS bay ngược từ dưới đáy màn hình lên trên, lắc lư và mờ dần rồi tự động lặp lại.

---

## 3. Kế hoạch Kiểm thử (Verification Plan)
*   **Kiểm thử trực quan (Visual Verification):** Chạy Remotion Studio để kiểm tra tính mượt mà của hiệu ứng tàn lửa rơi và sự tự động chuyển màu nhấn neon.
*   **Kiểm thử biên dịch (Build Verification):** Chạy lệnh `npm run lint` để đảm bảo code sạch lỗi TypeScript.
