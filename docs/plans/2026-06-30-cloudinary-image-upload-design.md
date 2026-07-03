# Thiết kế Chức năng Tải ảnh lên Cloudinary

## 1. Mục tiêu (Goals)
*   **Hỗ trợ Tải ảnh lên:** Cho phép người dùng tải các tệp ảnh cục bộ từ máy tính của họ lên máy chủ Cloudinary để sử dụng làm ảnh nền cho phân cảnh.
*   **Không lộ thông tin bảo mật:** Lưu trữ và quản lý Cloudinary API Key, Secret và Cloud Name an toàn ở phía Backend (.env), không truyền tải về phía trình duyệt của người dùng.
*   **Tích hợp mượt mà:** Sau khi tải ảnh lên thành công, ảnh mới sẽ được tự động thêm vào danh sách ảnh nền (`mediaList`) và hiển thị ngay tức thì ở màn hình Preview 9:16 cũng như video Remotion.

## 2. Đặc tả Kiến trúc Chi tiết

### A. Cấu hình Backend (.env)
Bổ sung các khóa môi trường vào `backend/.env`:
*   `CLOUDINARY_CLOUD_NAME=dimxrq8bs`
*   `CLOUDINARY_API_KEY=636233979283876`
*   `CLOUDINARY_API_SECRET=t2Te_smeTLPl5oVvS7Ow95fckRs`

### B. Upload API Endpoint (Backend - `server.js`)
*   **Tuyến đường (Endpoint):** `POST /api/upload`
*   **Dữ liệu nhận vào (Payload):**
    ```json
    { "file": "data:image/png;base64,iVBORw0KG..." }
    ```
*   **Quy trình xử lý:**
    1. Import SDK Cloudinary và gọi hàm config sử dụng các biến từ file `.env`.
    2. Sử dụng `cloudinary.v2.uploader.upload` để đẩy trực tiếp chuỗi Base64 lên thư mục `ai-video-storyboards`.
    3. Trả về địa chỉ URL bảo mật `{ "url": result.secure_url }`.

### C. Giao diện Chọn Tệp & State (Frontend - `StoryboardEditor.jsx`)
*   **State:** Quản lý trạng thái loading `uploadingScenes` dạng dictionary đối chiếu theo ID phân cảnh.
*   **Quy trình xử lý tải ảnh:**
    1. Khi người dùng click nút "📁 Upload", tạo thẻ ẩn `<input type="file" accept="image/*">` và giả lập kích hoạt click.
    2. Đọc file ảnh dưới dạng DataURL (Base64) bằng `FileReader`.
    3. Gửi chuỗi base64 qua API backend `POST /api/upload`.
    4. Nhận URL ảnh trả về từ backend, đẩy URL mới vào `mediaList` của phân cảnh và đặt `selectedMediaIndex` về chỉ số cuối.
    5. Cập nhật phân cảnh lên DB qua API `onUpdateScene`.

## 3. Kế hoạch Kiểm thử & Xác minh
*   **Backend unit test:** Thực hiện tải thử một ảnh base64 nhỏ bằng curl, kiểm tra xem API có trả về URL dạng `https://res.cloudinary.com/` không.
*   **Kiểm thử giao diện:** Thực hiện click nút upload, chọn tệp ảnh thực tế trên máy tính, xác nhận ảnh hiển thị tức thì trên Preview 9:16.
