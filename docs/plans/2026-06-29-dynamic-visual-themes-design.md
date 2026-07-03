# Thiết kế Hệ thống Giao diện Video Động (Dynamic Visual Themes & Overlay Effects)

Tài liệu này đặc tả thiết kế kỹ thuật cho việc nâng cấp giao diện video trong dự án tạo video tự động. Thay thế phong cách đơn sắc thô sơ hiện tại bằng các giao diện động, nhiều màu sắc sống động (Vibrant Glassmorphism, Brutalist, v.v.), có thêm hiệu ứng hạt động trên nền ảnh (sakura rơi, bụi sáng tech) và phụ đề đồng bộ.

## 1. Mục tiêu (Goals)
*   **Thẩm mỹ cao (Premium Aesthetics):** Mang lại giao diện hiện đại, chuyên nghiệp, bắt mắt theo phong cách video ngắn giới thiệu sản phẩm công nghệ.
*   **Tránh đơn điệu (Dynamic Backgrounds):** Cho phép kết hợp ảnh nền chủ đề cùng với các hiệu ứng hạt chuyển động (sakura rơi, digital grid, gold stars) để video sinh động hơn.
*   **Loại bỏ Brutalist đơn sắc:** Thay bằng thiết kế dạng kính mờ (Glassmorphism), viền phát sáng, chữ gradient rực rỡ.
*   **Phụ đề tự động đồng bộ (Dynamic Subtitles):** Phân tích kịch bản thành các cụm từ ngắn và làm nổi bật từ khóa đồng bộ theo thời gian voiceover.

---

## 2. Kiến trúc & Các Thay đổi Đề xuất

### A. Backend & Cấu trúc Dữ liệu kịch bản

Chúng ta sẽ cập nhật Prompt của Gemini tại `backend/services/ai.js` để phân tích kịch bản và sinh thêm hai thuộc tính cho mỗi phân cảnh (`scene`):
1.  `theme`: Xác định hiệu ứng hạt động phủ lên hình nền. Các giá trị hợp lệ:
    *   `"japan"`: Hiệu ứng cánh hoa anh đào rơi tự do.
    *   `"tech"`: Hiệu ứng hạt ánh sáng xanh cyan và lưới số nhị phân bay dọc.
    *   `"finance"`: Hiệu ứng lấp lánh (sparkles) và đồng tiền vàng bay lên.
    *   `"nature"`: Hiệu ứng lá rơi nhẹ nhàng.
    *   `"default"`: Các quầng sáng tròn (bokeh) chuyển động chậm.
2.  `accentColor`: Mã màu HEX tương ứng với chủ đề để tô màu cho tiêu đề phụ, viền thẻ kính mờ, và chữ highlight trong phụ đề.

Cập nhật file `backend/services/db.js` và `backend/server.js` để đảm bảo lưu trữ và truyền tải hai thuộc tính này đầy đủ thông qua API.

---

### B. Remotion Frontend - Bộ điều phối Giao diện (Theme Switcher)

Chúng ta sẽ bổ sung cấu hình `theme` vào cấu hình dự án (`ProjectConfig`).
Tại Remotion `MainComposition.tsx` và `Root.tsx`, hệ thống sẽ hỗ trợ 4 phong cách giao diện:
1.  **Vibrant Glassmorphism (Mặc định):**
    *   Nền tối gradient mịn (`slate-950` tới `indigo-950`).
    *   Các hộp nội dung dạng kính mờ (glassmorphism) với `backdrop-filter: blur(16px)`, viền mỏng trong suốt và bóng đổ mềm mại.
2.  **Brutalist Neo-Pop (Năng động):**
    *   Nền màu pastel tươi sáng.
    *   Viền đen đậm (`4px solid #000`), bóng đổ cứng không làm mờ (`box-shadow: 6px 6px 0px #000`).
3.  **Minimalist Clean (Thanh lịch):**
    *   Nền xám/trắng thanh thoát, phông chữ serif có chân sang trọng.
    *   Không lạm dụng các khung viền, tập trung hoàn toàn vào khoảng trống và độ tương phản chữ.
4.  **Cyberpunk (Khoa học viễn tưởng):**
    *   Nền tối sâu thẳm, hiệu ứng scanlines, chữ neon phát sáng hồng/xanh lam chói lọi.

---

### C. Động cơ Hiệu ứng hạt động (Overlay Particles Engine)

Tạo các thành phần React con trong thư mục `my-video/src/components/overlays/` tận dụng hàm `useCurrentFrame` và `interpolate` của Remotion để tính toán chuyển động của hạt qua từng khung hình:
*   `SakuraOverlay`: Tạo 15-20 thẻ SVG cánh hoa đào rơi nghiêng, lắc lư (sử dụng hàm Sin/Cos theo khung hình) và tự động xoay.
*   `TechParticlesOverlay`: Vẽ các đường kẻ lưới mờ và các dòng ký tự `0` và `1` trôi từ dưới lên.
*   `FinanceGoldOverlay`: Các hạt lấp lánh màu vàng và hình tiền tệ trôi lơ lửng.
*   `DefaultBokehOverlay`: 4-6 hình tròn màu nhạt làm mờ sâu (`filter: blur(40px)`) co giãn và di chuyển chậm quanh màn hình.

Ảnh nền gốc từ Unsplash sẽ được làm mờ nhẹ (`filter: blur(4px)`) và giảm độ sáng (`brightness(35%)`) để lớp hạt động và chữ phía trên hiển thị rõ nét nhất.

---

### D. Hệ thống Phụ đề Đồng bộ (Dynamic Captions)

Tại mỗi Scene, chúng ta sẽ thêm khối hiển thị phụ đề lớn ở 1/4 cuối màn hình:
*   Tách văn bản `voiceover` thành một danh sách các cụm từ ngắn (mỗi cụm từ dài từ 3-5 chữ).
*   Tính thời lượng phân bổ cho từng cụm từ dựa trên tổng thời gian của phân cảnh (`scene.duration`).
*   Khi chạy đến khoảng thời gian của cụm từ tương ứng, cụm từ đó sẽ được làm nổi bật (đổi sang màu `accentColor`, tăng cỡ chữ lên 1.1x) trong khi các chữ xung quanh mờ đi.

---

## 3. Kế hoạch Kiểm thử & Xác minh (Verification Plan)
*   **Kiểm thử thủ công:**
    *   Khởi chạy Remotion Preview để kiểm tra trực quan các hiệu ứng hạt chuyển động (sakura rơi) xem có bị giật lag không.
    *   Kiểm tra khả năng hiển thị chữ phụ đề khớp tương đối với file âm thanh TTS.
    *   Kiểm tra tính phản hồi của giao diện Glassmorphism trên khung hình dọc 1080x1920.
*   **Kiểm thử tự động:**
    *   Kiểm tra render thành công video mẫu ra file MP4 bằng lệnh `remotion render` thông qua server backend.
