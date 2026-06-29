# Đặc tả API Endpoints & Danh sách Backlog Dự án

Tài liệu này chứa thông số chi tiết của các API (API Contract) kết nối giữa Frontend và Backend, cùng danh sách các hạng mục công việc tồn đọng (Product Backlog) phân chia theo các giai đoạn phát triển, sau khi đã tích hợp các dịch vụ AI thật (Gemini, ElevenLabs, Unsplash) và cơ chế tự động Fallback Mock.

---

## 1. Đặc tả Chi tiết API Endpoints (API Specification)

Tất cả các API sử dụng giao thức HTTP, định dạng dữ liệu truyền và nhận là **JSON**. Địa chỉ base URL cục bộ mặc định: `http://localhost:5000/api`.

### 1.1. Lấy danh sách Dự án (`GET /api/projects`)
*   **Mô tả:** Lấy danh sách tất cả các dự án hiện có trên hệ thống để hiển thị tại dashboard.
*   **Response (200 OK):**
    ```json
    [
      {
        "id": "proj_847192",
        "title": "Dự án Video Marketing",
        "status": "DRAFT",
        "createdAt": "2026-06-26T08:58:28Z"
      }
    ]
    ```

### 1.2. Tạo Dự án mới (`POST /api/projects`)
*   **Mô tả:** Khởi tạo một dự án video mới.
*   **Request Body:**
    ```json
    {
      "title": "Dự án Video Marketing"
    }
    ```
*   **Response (201 Created):**
    ```json
    {
      "id": "proj_847192",
      "title": "Dự án Video Marketing",
      "status": "DRAFT",
      "createdAt": "2026-06-26T08:58:28Z",
      "config": {
        "length": "Short (~60s)",
        "language": "Vietnamese",
        "voice": "rachel",
        "watermark": { "enabled": true, "text": "yupclip.com", "position": "top-right", "color": "#000000" },
        "ending": { "enabled": true, "logoText": "YupVid", "website": "yupvid.com" },
        "backgroundMusic": "Chill Lofi Beats"
      },
      "scenes": []
    }
    ```

### 1.3. Lấy chi tiết Dự án (`GET /api/projects/:id`)
*   **Mô tả:** Lấy toàn bộ thông tin cấu hình và danh sách các scenes của dự án cụ thể.
*   **Response (200 OK):** Đối tượng Dự án chứa toàn bộ cấu hình gốc và mảng `scenes` chi tiết.

### 1.4. Cập nhật Cấu hình Dự án (`PUT /api/projects/:id/config`)
*   **Mô tả:** Cập nhật các cài đặt cấu hình chung của video (nhạc nền, watermark, thông tin kết thúc, giọng đọc, v.v.).
*   **Request Body:**
    ```json
    {
      "length": "Short (~60s)",
      "language": "Vietnamese",
      "voice": "antonio",
      "backgroundMusic": "Chill Lofi Beats",
      "watermark": { "enabled": true, "text": "yupclip.com", "position": "top-right", "color": "#000000" },
      "ending": { "enabled": true, "logoText": "YupVid", "website": "yupvid.com" }
    }
    ```
*   **Response (200 OK):** Trả về đối tượng cấu hình dự án đã cập nhật.

### 1.5. Phân tách kịch bản bằng AI (`POST /api/projects/:id/generate-storyboard`)
*   **Mô tả:** Gửi kịch bản thô lên server. Server sẽ gọi Gemini API để bóc tách thành danh sách scene chi tiết, đồng thời tự động gọi ElevenLabs sinh audio voiceover thuyết minh `.mp3` và Unsplash gợi ý hình ảnh nền.
*   **Request Body:**
    ```json
    {
      "scriptText": "Chào mừng bạn đến với Remotion. Đây là nền tảng dựng video bằng React."
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "scenes": [
        {
          "id": "scene_1",
          "sceneIndex": 0,
          "duration": 8.0,
          "layoutFamily": "Opening / Headline",
          "visualLayout": "Intro Profile",
          "heading": "Chào mừng đến với Remotion",
          "points": ["Dựng video bằng React", "Hiệu năng cực cao"],
          "voiceover": "Chào mừng bạn đến với Remotion. Đây là nền tảng dựng video bằng React.",
          "voiceoverAudioUrl": "/tts/proj_847192_scene_1.mp3",
          "placement": "Full",
          "mediaList": [
            "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500"
          ],
          "selectedMediaIndex": 0
        }
      ]
    }
    ```

### 1.6. Cập nhật nội dung một Scene (`PUT /api/projects/:id/scenes/:sceneId`)
*   **Mô tả:** Lưu các thay đổi của người dùng khi biên tập một scene (chữ, ảnh, layout). Nếu trường `voiceover` thay đổi, backend sẽ tự động gọi lại ElevenLabs TTS để sinh tệp thuyết minh `.mp3` mới.
*   **Request Body:**
    ```json
    {
      "heading": "Tiêu đề đã sửa",
      "points": ["Ý chính 1", "Ý chính 2"],
      "voiceover": "Lời thoại thuyết minh đã sửa.",
      "layoutFamily": "Points / List",
      "visualLayout": "Github Status Hook",
      "selectedMediaIndex": 1,
      "placement": "Split",
      "mediaList": [
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500",
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500"
      ]
    }
    ```
*   **Response (200 OK):** Trả về đối tượng Scene đã cập nhật thành công (bao gồm cả `voiceoverAudioUrl` mới nếu có).

### 1.7. Tìm kiếm hình ảnh (`GET /api/media/search`)
*   **Mô tả:** Tìm kiếm hình ảnh gợi ý từ Unsplash dựa trên từ khóa tìm kiếm.
*   **Query Parameters:**
    *   `query`: Từ khóa cần tìm kiếm (ví dụ: `technology`, `office`).
*   **Response (200 OK):**
    ```json
    [
      "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500"
    ]
    ```

### 1.8. Kết xuất Video MP4 (`POST /api/projects/:id/render`)
*   **Mô tả:** Kích hoạt trình biên dịch Remotion CLI trên server để render video vật lý.
*   **Response (202 Accepted):**
    ```json
    {
      "renderId": "render_991823",
      "status": "rendering"
    }
    ```

### 1.9. Kiểm tra trạng thái Render (`GET /api/projects/:id/render/status/:renderId`)
*   **Mô tả:** Client thăm dò (polling) tiến độ render của server.
*   **Response (200 OK):**
    ```json
    {
      "status": "completed", // "rendering", "failed", "completed"
      "progress": 1.0,       // Tiến trình từ 0.0 đến 1.0
      "videoUrl": "/downloads/output_proj_847192.mp4" // Trả về khi status là completed
    }
    ```

---

## 2. Danh sách Backlog Dự án (Product Backlog)

### GIAI ĐOẠN 1: THIẾT LẬP HẠ TẦNG & GIAO DIỆN PREVIEW EDITOR (FRONTEND)
- [ ] **Task 1.1:** Tái cấu trúc cấu trúc thư mục dự án (tạo `frontend/` từ `my-video/` và khởi tạo `backend/`).
- [ ] **Task 1.2:** Cài đặt thư viện `@remotion/player` vào `frontend/`.
- [ ] **Task 1.3:** Thiết lập hệ thống CSS biến Trắng/Đen tối giản tại `frontend/src/styles/theme.css`.
- [ ] **Task 1.4:** Thiết kế các Component giao diện Remotion Layouts (`IntroProfile`, `GithubStatusHook`, `SplitGrid`) sử dụng frame hooks (`useCurrentFrame`).
- [ ] **Task 1.5:** Xây dựng Sidebar Form cấu hình gốc (liên kết với API config) và Form chỉnh sửa Scene Card trên React.
- [ ] **Task 1.6:** Nhúng `@remotion/player` làm Master Player xem trước video trực tiếp.
- [ ] **Task 1.7:** Phát triển màn hình Trang chủ (Dashboard) hiển thị danh sách dự án cũ (`GET /api/projects`).

### GIAI ĐOẠN 2: XÂY DỰNG API SERVER & DATABASE (BACKEND)
- [ ] **Task 2.1:** Khởi tạo Express server chạy trên cổng 5000 (`backend/server.js`).
- [ ] **Task 2.2:** Thiết lập cơ sở dữ liệu giả lập lưu trữ file JSON (`backend/services/db.js`).
- [ ] **Task 2.3:** Lập trình các API CRUD cho Projects, Configs (`PUT /api/projects/:id/config`), và Scenes (`PUT /api/projects/:id/scenes/:sceneId`).
- [ ] **Task 2.4:** Kết nối Frontend gửi gọi API tới Local Backend để lưu trữ thay vì lưu `localStorage`.

### GIAI ĐOẠN 3: TÍCH HỢP GEMINI, ELEVENLABS & UNSPLASH (BE)
- [ ] **Task 3.1:** Viết dịch vụ gọi Gemini API bóc tách kịch bản thô thành kịch bản phân cảnh JSON. Tích hợp cơ chế Fallback Mock nếu thiếu API Key.
- [ ] **Task 3.2:** Viết dịch vụ ElevenLabs TTS tự động chuyển đổi text kịch bản sang tệp âm thanh `.mp3` và lưu trữ trên server. Tích hợp cơ chế Fallback Mock bằng tệp âm thanh tĩnh nếu thiếu key.
- [ ] **Task 3.3:** Viết dịch vụ tìm kiếm Unsplash gợi ý hình ảnh (`GET /api/media/search`). Tích hợp cơ chế Fallback Mock trả về mảng ảnh công nghệ/văn phòng tĩnh chất lượng cao từ Unsplash nếu thiếu key.

### GIAI ĐOẠN 4: KẾT XUẤT VIDEO (REMOTION RENDER CLI)
- [ ] **Task 4.1:** Xây dựng API `/render` kích hoạt tiến trình chạy CLI `npx remotion render` ngầm bằng child process.
- [ ] **Task 4.2:** Expose thư mục tải tĩnh `/downloads` chứa file video MP4 hoàn thiện.
- [ ] **Task 4.3:** Hiển thị nút "Tải Video" trên giao diện Frontend sau khi hoàn thành kết xuất.
