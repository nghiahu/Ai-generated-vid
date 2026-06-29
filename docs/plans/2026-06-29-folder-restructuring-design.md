# Tài liệu Thiết kế: Tách biệt cấu trúc Frontend và Backend

Tài liệu này mô tả chi tiết kế hoạch cấu trúc lại mã nguồn, đưa các tệp và thư mục liên quan đến React Frontend vào một thư mục con chuyên biệt mang tên `frontend`, giúp phân tách rõ ràng với thư mục `backend` và `my-video` (Remotion).

---

## 1. Mục tiêu
- Di chuyển toàn bộ mã nguồn và cấu hình Frontend ở thư mục Gốc vào thư mục `frontend/`.
- Sửa đổi các liên kết tương đối (relative import) từ Frontend sang Remotion (`my-video`).
- Cập nhật tài liệu hướng dẫn chạy dự án để người dùng dễ tiếp cận.

---

## 2. Cấu trúc Thư mục Mới
Sau khi cấu trúc lại, dự án sẽ có cấu trúc như sau:
```
ai-video-remotion/
├── frontend/                     # [MỚI] Chứa toàn bộ mã nguồn React + Vite
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── MasterPlayer.jsx  # Cần sửa lại relative import sang my-video
│   │   └── ...
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
├── backend/                      # [GIỮ NGUYÊN] Chứa Express API Server
│   ├── services/
│   │   └── render.js             # Vẫn gọi sang my-video qua ../../my-video
│   └── ...
│
├── my-video/                     # [GIỮ NGUYÊN] Chứa dự án Remotion
│
├── .gitignore                    # Cập nhật để bỏ qua node_modules của frontend
└── README.md                     # Cập nhật hướng dẫn chạy
```

---

## 3. Các thay đổi chi tiết

### 3.1. Di chuyển Tệp tin & Thư mục
Di chuyển các tệp/thư mục sau từ thư mục Gốc vào thư mục `frontend/`:
- Thư mục: `src/`, `public/`
- Tệp tin: `index.html`, `vite.config.js`, `package.json`, `package-lock.json`, `.oxlintrc.json`

### 3.2. Cập nhật mã nguồn
- Trong tệp `frontend/src/components/MasterPlayer.jsx`:
  Sửa relative import của `MainComposition`:
  ```diff
  -import { MainComposition } from "../../my-video/src/compositions/MainComposition";
  +import { MainComposition } from "../../../my-video/src/compositions/MainComposition";
  ```

---

## 4. Kế hoạch Kiểm thử (Verification Plan)
- Chạy cài đặt dependencies trong thư mục `frontend`: `npm install`
- Chạy khởi động frontend dev server: `npm run dev` inside `frontend/`
- Truy cập `http://localhost:5173`, kiểm tra xem giao diện có tải lên thành công và có nhận được danh sách dự án từ backend hay không.
