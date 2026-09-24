# Thiết kế Chuyển đổi Lưu trữ và Sử dụng Ảnh Trực tiếp trên Máy tính (100% Local Storage)

## 1. Mục tiêu
- Chuyển đổi toàn diện cơ chế lưu trữ và sử dụng hình ảnh/video từ Cloud (Cloudinary) sang lưu trữ trực tiếp trên ổ cứng máy tính cá nhân.
- Đảm bảo 100% khả năng hoạt động offline, tốc độ hiển thị hình ảnh tức thì, không bị độ trễ mạng hay giới hạn dung lượng/băng thông từ bên thứ ba.
- Giữ nguyên trải nghiệm mượt mà khi người dùng nhấn "Upload" để chọn ảnh từ bất kỳ thư mục nào trên máy tính (ổ C, D, Downloads, Desktop...).

## 2. Kiến trúc & Luồng dữ liệu (Architecture & Data Flow)

### 2.1. Lưu trữ Cục bộ (Local Storage Directories)
- **Thư mục tải lên:** `backend/public/uploads`
  - Tiếp nhận các file ảnh/video được upload từ giao diện web thông qua API `POST /api/upload`.
  - Phục vụ tĩnh qua endpoint: `http://localhost:5000/uploads/<filename>`.
- **Thư mục media ngoài (Manual Drops):** `media_local/` (ở thư mục gốc của project)
  - Cho phép người dùng copy/paste trực tiếp các file media từ máy tính vào.
  - Phục vụ tĩnh qua endpoint: `http://localhost:5000/media_local/<filename>`.

### 2.2. Luồng Xử lý Tải ảnh (Upload Flow)
1. Người dùng bấm vào nút/khung **Upload** trong Modal "Chọn Ảnh/Video" hoặc các ô ảnh nền/ảnh content của từng phân cảnh (Scene).
2. Hộp thoại File Picker của hệ thống (Windows) mở ra, người dùng chọn 1 hoặc nhiều ảnh/video từ máy tính (`image/*,video/*` với thuộc tính `multiple`).
3. Frontend đọc file dưới dạng Base64 Data URL và gửi lên Backend qua `POST /api/upload`.
4. Backend:
   - Giải mã Base64 và lưu file nguyên bản vào thư mục `backend/public/uploads/` với tên file an toàn (kèm timestamp để tránh trùng lặp).
   - Lưu URL `http://localhost:5000/uploads/<filename>` vào bảng `uploaded_media` trong database cục bộ (`db.js`).
   - Trả về URL local cho Frontend.
5. Frontend cập nhật:
   - Thêm ngay URL vừa tải vào danh sách đã chọn (`modalSelectedMedia`).
   - Tự động hiển thị URL mới ở đầu danh sách trong tab **YOUR MEDIA**.

### 2.3. Tự động Quét Thư mục (Auto-scanning Media)
- Endpoint `GET /api/media/previous`:
  - Quét toàn bộ file hình ảnh (`.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.svg`) và video (`.mp4`, `.mov`, `.webm`) trong cả 2 thư mục `backend/public/uploads` và `media_local/`.
  - Sắp xếp theo thời gian sửa đổi mới nhất (`mtime`).
  - Hợp nhất với các media đã lưu trong database.
  - Nhờ vậy, bất kỳ file nào người dùng thả trực tiếp vào máy tính đều xuất hiện ngay trong tab **YOUR MEDIA**.

### 2.4. Tính năng Tạo ảnh bằng AI (Gemini Imagen)
- Cập nhật endpoint `POST /api/media/generate-ai-image`:
  - Thay vì đẩy ảnh tạo bởi Gemini lên Cloudinary (`cloudinary.uploader.upload`), Backend sẽ lưu trực tiếp ảnh dạng base64 vào thư mục `backend/public/uploads/`.
  - Lưu URL cục bộ `http://localhost:5000/uploads/...` vào database và trả về cho client.
  - Loại bỏ hoàn toàn sự phụ thuộc Cloudinary khi sinh ảnh AI.

### 2.5. Cập nhật Giao diện (UI/UX)
- Đổi toàn bộ nhãn hiển thị và icon:
  - Thay thế icon đám mây `☁️` bằng biểu tượng máy tính / thư mục `💻` hoặc `📁`.
  - Thay thế `"Đang tải ảnh lên Cloudinary..."` thành `"Đang lưu ảnh vào máy tính..."`.
  - Đổi mô tả hướng dẫn: `"Click to select files from your computer (JPG, PNG, GIF, MP4)"`.
  - Thêm thuộc tính `multiple` vào các thẻ input file để người dùng có thể chọn hàng loạt ảnh từ máy tính.
- Cập nhật cả ở:
  - `frontend/src/components/StoryboardEditor.jsx`
  - `frontend/src/components/BatchStudioPage.jsx`

## 3. Xử lý lỗi & Tương thích
- Kiểm tra và tự động khởi tạo thư mục `backend/public/uploads` và `media_local` nếu chưa có.
- Tăng giới hạn dung lượng tải của Express JSON parser lên 50MB (đã cấu hình) để hỗ trợ các video ngắn/ảnh chất lượng cao từ máy tính.
- Các URL Cloudinary cũ (nếu có từ các project trước) vẫn hiển thị bình thường mà không bị lỗi.

## 4. Kế hoạch Kiểm thử & Xác minh (Verification Plan)
1. Thử nghiệm upload 1 ảnh và nhiều ảnh từ máy tính qua giao diện web: kiểm tra file có xuất hiện trong `backend/public/uploads/` và hiển thị trên tab YOUR MEDIA.
2. Thử nghiệm copy 1 file ảnh trực tiếp vào thư mục `media_local/`: kiểm tra tab YOUR MEDIA có tự động nhận diện file.
3. Kiểm tra Remotion Player: đảm bảo ảnh local hiển thị mượt mà trong trình phát video và render không gặp lỗi CORS.
4. Kiểm tra AI Image Generation (nếu có API Key): đảm bảo ảnh sinh ra được lưu trực tiếp vào ổ cứng máy tính.
