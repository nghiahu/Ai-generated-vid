# Tài liệu thiết kế: Giao diện AI Hub Grid (VDE Visual Style)
**Ngày**: 13/07/2026  
**Chủ đề**: Tích hợp theme "AI Hub Grid" lấy cảm hứng từ phong cách công nghệ tương lai và lưới tọa độ neon.

---

## 1. Mục tiêu (Goal Description)
Mục tiêu là tích hợp một theme mới có độ trung thực cao mang tên **AI Hub Grid** vào hệ thống Visual Design Engine (VDE). Theme này lấy cảm hứng trực tiếp từ các hình ảnh tham khảo và video mẫu, bao gồm các đặc điểm nổi bật:
* Nền chàm tối sâu thẳm kết hợp lưới tọa độ kỹ thuật số nhạt.
* Các quầng sáng Neon (Ambient Glow) chuyển động chậm tạo chiều sâu.
* Thẻ dạng kính mờ (Glassmorphism) với đường viền mảnh phát sáng màu xanh dương/cyan và dải màu gradient nổi bật ở các thẻ active.
* Watermark `"AI HUB"` phát sáng và thanh tiến trình (scrubber progress bar) chạy mượt mà dưới đáy video.
* Tích hợp đồng bộ vào Web Editor (Storyboard Editor) để người dùng xem trước và lựa chọn.

---

## 2. Kiến trúc Hệ thống & Thay đổi Đề xuất

### A. Định nghĩa Tokens & Master Theme (`vde_themes.json`)
Thêm cấu hình theme `"ai_hub_grid"` kế thừa từ `"minimal"` vào `my-video/src/styles/vde_themes.json`:
* **Colors**:
  * `background`: `"#030712"` (Nền đen chàm tối sâu)
  * `cardBg`: `rgb(8, 17, 37)` với độ mờ mỏng `rgba(8, 17, 37, 0.7)` hoặc dải gradient mờ cho thẻ.
  * `border`: `1px solid rgba(59, 130, 246, 0.35)` (Viền phát sáng xanh dương nhẹ)
  * `accent`: `"#3b82f6"` (Xanh dương Electric)
  * `text`: `"#ffffff"`
  * `textSecondary`: `"rgba(255, 255, 255, 0.65)"`
* **Fonts**:
  * Sử dụng phông chữ hình học tối giản **Be Vietnam Pro** (hoặc **Inter**).

### B. Thành phần nền động mới (`AIHubGridOverlay.tsx`)
Tạo mới file tại `my-video/src/components/overlays/AIHubGridOverlay.tsx`:
* Vẽ lưới ô vuông tọa độ mảnh có độ trong suốt cao (`rgba(59, 130, 246, 0.04)`).
* Vẽ 2-3 khối tròn mờ cực lớn (`filter: blur(120px)`) màu xanh dương/cyan chuyển động lệch pha bằng `Math.sin`/`Math.cos` dựa theo `useCurrentFrame` của Remotion.

### C. Tích hợp Remotion Player (`MainComposition.tsx`)
* Nhúng `AIHubGridOverlay` vào tầng background của Scene.
* Nếu style là `"ai_hub_grid"`:
  * Tự động tính toán khung hình hiện tại và tổng số khung hình của video để render thanh tiến trình (`div` cao 10px, viền phát sáng) ở đáy màn hình.
  * Render watermark `"AI HUB"` lớn phát sáng chữ xanh dương ở tọa độ `bottom: 80px`. Ẩn watermark mặc định.

### D. Đồng bộ Backend & AI Prompt
* Thêm `"ai_hub_grid"` làm theme hợp lệ trong prompt sinh kịch bản của Gemini (`backend/services/ai.js`).
* Hướng dẫn AI ưu tiên xuất màu accent dạng xanh/cyan phù hợp với thiết kế.

### E. Giao diện Web Editor (`StoryboardEditor.jsx`)
* Đăng ký theme `"ai_hub_grid"` vào danh sách giao diện lựa chọn.
* Viết mockup xem trước nhỏ trong Style Gallery Modal để mô phỏng chính xác lưới tọa độ, thẻ phát sáng và watermark `"AI HUB"`.

---

## 3. Kế hoạch Xác minh (Verification Plan)

### Xác minh thủ công
1. Chạy Remotion Preview để kiểm tra trực quan hoạt ảnh lưới tọa độ, độ chuyển động mượt mà của quầng sáng Neon và thanh progress bar chạy dưới đáy.
2. Kiểm tra Style Selection Modal trên Web Editor để đảm bảo card preview của theme `"AI Hub Grid"` hiển thị đúng màu và bố cục.
3. Kiểm tra xem AI sinh kịch bản có trả về theme `"ai_hub_grid"` cùng accentColor chuẩn không.

### Xác minh tự động
1. Chạy render thử một đoạn video mẫu sử dụng theme `"ai_hub_grid"` và đảm bảo không có lỗi biên dịch/render xảy ra.
