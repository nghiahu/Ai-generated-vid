# Hướng dẫn Chạy Dự án: AI Video Creator (HyperFrames)

Dự án này là hệ thống tạo video dọc tự động từ kịch bản AI, sử dụng React ở Frontend, Express ở Backend và Remotion làm nhân render video.

---

## 1. Cấu trúc thư mục của Dự án
Dự án được cấu trúc như sau:
*   **Thư mục Gốc (Root - `/`)**: Chứa ứng dụng **Frontend (React + Vite)**.
*   **`/backend`**: Chứa ứng dụng **Backend (Node.js/Express API)** kết nối PostgreSQL, Gemini API, ElevenLabs/Edge TTS.
*   **`/my-video`**: Chứa source code các component và Sequence video của **Remotion**. Backend sẽ tự động gọi thư mục này để kết xuất video MP4.

---

## 2. Hướng dẫn khởi chạy dự án

### Bước 1: Khởi động Backend (Express API)
1. Mở một terminal mới.
2. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
3. Đảm bảo bạn đã cấu hình file `.env` trong thư mục `backend/.env` với các khóa:
   - `GEMINI_API_KEY` (Khóa API Gemini 2.5 Flash)
   - `ELEVENLABS_API_KEY` (Nếu sử dụng ElevenLabs)
   - `UNSPLASH_ACCESS_KEY` (Nếu sử dụng Unsplash, nếu không hệ thống tự động fallback sang Lorem Flickr)
   - Cấu hình PostgreSQL (`PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`...)
4. Chạy lệnh cài đặt thư viện (nếu là lần đầu):
   ```bash
   npm install
   ```
5. Khởi động server backend chạy ở cổng `5000`:
   ```bash
   npm run dev
   ```
   *(Hoặc `npm start` nếu chạy chế độ production)*

### Bước 2: Khởi động Frontend (React + Vite)
1. Mở một terminal khác tại thư mục gốc của dự án (không chạy lệnh `cd`).
2. Chạy cài đặt thư viện (nếu là lần đầu):
   ```bash
   npm install
   ```
3. Khởi động server phát triển frontend chạy ở cổng `5173`:
   ```bash
   npm run dev
   ```
4. Truy cập trình duyệt tại địa chỉ: `http://localhost:5173` để sử dụng ứng dụng.

---

## 3. Các lệnh hữu ích khác
*   **Chạy file test kiểm thử bộ lọc logs render:**
    ```bash
    cd backend
    node test_log_parser.js
    ```
