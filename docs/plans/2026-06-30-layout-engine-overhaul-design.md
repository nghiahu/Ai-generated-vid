# Thiết kế Hệ thống Video Layout Engine Hướng Ràng buộc & Cải tiến 8 Layout Mới

## 1. Mục tiêu (Goals)
*   **Đồng bộ 8 Layout Mới:** Hỗ trợ đầy đủ các loại bố cục `Hero`, `Split Screen`, `Dashboard`, `Feature Grid`, `Timeline`, `Comparison`, `Terminal`, `Gallery` ở cả Prompt AI (Backend) và Frontend Editor.
*   **Dựng Bố cục Phức tạp Động:** Hiện thực hóa các thiết kế giao diện cao cấp cho Timeline (tiến trình nối cột dọc), Comparison (hai cột song song), Dashboard (lưới grid chỉ số) một cách tự động, thông minh.

## 2. Đặc tả Chi tiết Kỹ thuật

### A. Cấu trúc Prompt AI (Backend - `ai.js`)
*   Cập nhật `visualLayout` schema:
    ```json
    "visualLayout": "Hero" | "Split Screen" | "Dashboard" | "Feature Grid" | "Timeline" | "Comparison" | "Terminal" | "Gallery"
    ```
*   Thêm luật phân bổ layout cụ thể cho AI tự chọn dựa trên thống kê, số lượng ý chính, dòng lệnh, sự xuất hiện của so sánh hoặc ảnh chụp màn hình.

### B. Mở rộng Trình hiển thị Động (Remotion - `DynamicLayout.tsx`)
*   **`renderTimeline`**: Bố trí các ý dọc theo đường kẻ nét đứt màu nhấn, mỗi ý có một vòng tròn chứa số hiệu bước tương ứng.
*   **`renderComparison`**: Chia đôi danh sách điểm ý chính thành hai cột Trái (Mới/Ưu điểm - viền màu nhấn) và Phải (Cũ/Nhược điểm - viền màu tối).
*   **`renderDashboard`**: Tự động gom các khối `HeroMetric` vào hiển thị lưới 2 cột.
*   **`renderTerminal`**: Dành ưu tiên không gian cho cửa sổ terminal gõ lệnh ở trung tâm.
*   **`Gallery`**: Hiển thị screenshot lớn bọc kính mờ nghệ thuật.

### C. Đồng bộ WYSIWYG trên Editor (Frontend - `StoryboardEditor.jsx`)
*   Cập nhật thẻ `<select>` cho `visualLayout` chứa đủ 8 lựa chọn.
*   Cập nhật hàm `resolveEditorComponents` để đồng bộ hiển thị các phần tử bị ẩn/hiện và dịch chuyển bố cục sang dạng Timeline hoặc Comparison trực quan ngay trên Preview.

## 3. Kế hoạch Kiểm thử (Verification Plan)
*   **Kiểm thử Prompt:** Gửi script test, xác nhận dữ liệu JSON trả về từ backend chứa đúng các kiểu layout mới như `Timeline` hay `Terminal`.
*   **Kiểm thử giao diện:** Mở Web Editor, chọn thay đổi qua lại giữa 8 loại layout, xác nhận Preview 9:16 đổi dạng tương ứng (Timeline vẽ đường nối dọc, Comparison chia đôi cột).
*   **Kiểm thử Remotion:** Chạy `npx tsc --noEmit` để đảm bảo code sạch lỗi TypeScript.
