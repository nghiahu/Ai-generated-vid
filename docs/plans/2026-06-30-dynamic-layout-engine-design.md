# Thiết kế Hệ thống Video Layout Engine Hướng Ràng buộc (Constraint-based Layout Engine)

## 1. Mục tiêu (Goals)
*   **Đại tu hệ thống giao diện video (Visual Layout Overhaul):** Chuyển từ các mẫu slide tĩnh, cứng nhắc sang hệ thống tự động lắp ghép Component dựa trên ràng buộc kích thước (Constraints) và độ ưu tiên (Priority).
*   **Chống tràn nội dung (No Overlap/Overflow):** Đảm bảo văn bản hoặc các khối giao diện không bao giờ đè lên nhau trên màn hình dọc 9:16 (1080x1920px), tự động ẩn các thành phần phụ nếu hết không gian hiển thị.
*   **Đồng bộ thiết kế và hiển thị (WYSIWYG):** Hiển thị mô phỏng giống nhau 100% giữa trình biên tập Web và video xuất ra từ Remotion.

## 2. Đặc tả Chi tiết Kiến trúc

### A. Phân tích Dữ liệu Đầu vào (Data Parsing Engine)
Hệ thống sẽ lấy dữ liệu phân cảnh (heading, points, imageUrl) và chuyển đổi thành danh sách các mô tả Component:
1.  `AnimatedTitle`: Lấy từ `heading` (Cỡ chữ tự động co giãn từ 60px đến 76px). Độ ưu tiên = 100 (Bắt buộc). Chiều cao = 180px.
2.  `HeroMetric`: Lấy từ dòng points chứa dữ liệu dạng số, tỉ lệ phần trăm, hoặc so sánh. Độ ưu tiên = 90. Chiều cao = 200px.
3.  `CommandLine`: Lấy từ dòng points bắt đầu bằng dấu `$` hoặc chứa code. Độ ưu tiên = 85. Chiều cao = 160px.
4.  `FeatureCard`: Lấy từ văn bản thường. Độ ưu tiên = 70. Chiều cao = 100px.
5.  `BadgeRow`: Lấy từ dòng points phân tách bằng dấu phẩy hoặc chứa emoji đặc trưng. Độ ưu tiên = 50. Chiều cao = 80px.

### B. Giải quyết va chạm chiều cao (Constraint-based Layout Resolver)
Bộ giải thuật sẽ chạy trước khi render:
*   **Ngân sách tối đa (Max Height Budget):** 1600px (để dư 320px cho viền an toàn, thanh tiến trình và phụ đề).
*   **Giải thuật:**
    *   Tính tổng chiều cao của tất cả các Component được đề xuất + khoảng cách `gap` (30px).
    *   Nếu tổng vượt quá 1600px, sắp xếp danh sách theo độ ưu tiên tăng dần và loại bỏ component có độ ưu tiên thấp nhất.
    *   Lặp lại cho đến khi tổng chiều cao vừa vặn trong ngân sách 1600px.

### C. Giao diện Động (DynamicLayout.tsx)
Tùy thuộc vào `visualLayout` được chọn, các Component sống sót sau bộ lọc sẽ được sắp đặt trong:
*   `Hero`: Trục dọc đơn Flex-column căn giữa.
*   `SplitScreen`: Cột trái hiển thị Screenshot hoặc nền màu nhấn động `AccentGlowBackground`. Cột phải chứa các khối nội dung xếp dọc.
*   `Terminal`: Ô chứa dòng lệnh lớn làm trọng tâm ở giữa, tiêu đề đẩy lên đỉnh.
*   `FeatureGrid`: Xếp các khối tính năng thành lưới 2 cột.

### D. Hệ thống Theme (Theme Engine)
Cung cấp styles thích hợp cho Component theo theme của dự án:
*   `glassmorphism`: Kính mờ mỏng trong suốt, viền mỏng trắng, font Outfit.
*   `brutalist`: Viền đen 4px dày, bóng đổ thô cứng lệch góc, font Space Grotesk.
*   `cyberpunk`: Nền tối, viền neon màu nhấn phát sáng, font JetBrains Mono.
*   `minimalist`: Nền sáng sạch sẽ, viền xám mờ mỏng, font Inter.

## 3. Quy trình Triển khai
1.  Xây dựng tệp tin giải thuật phân tích dùng chung `layoutResolver.ts`.
2.  Tạo component trung tâm `DynamicLayout.tsx` trong Remotion.
3.  Cập nhật và tích hợp `layoutResolver` vào trình xem thử `StoryboardEditor.jsx` của Frontend để đồng bộ giao diện WYSIWYG.
