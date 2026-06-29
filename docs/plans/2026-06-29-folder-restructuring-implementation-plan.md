# Tách biệt cấu trúc Frontend và Backend Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Di chuyển toàn bộ mã nguồn React Frontend hiện tại từ thư mục Gốc vào thư mục con `frontend/` riêng biệt, sửa lại các relative imports và cập nhật tài liệu hướng dẫn.

**Architecture:** 
1. Sử dụng lệnh Powershell để tạo thư mục `frontend` và di chuyển `src`, `public`, và các file cấu hình liên quan vào đó.
2. Sửa đổi relative import trong `MasterPlayer.jsx` từ `../../my-video` thành `../../../my-video` để khớp với vị trí thư mục mới cấp 1.
3. Cập nhật `README.md` hướng dẫn chạy và `.gitignore` để kiểm soát tốt các thư mục `node_modules` và `dist` của cả frontend và backend.

**Tech Stack:** Git, Powershell

---

### Task 1: Tạo thư mục frontend và di chuyển các file mã nguồn

**Files:**
- Create: `frontend` (Directory)
- Modify: Thư mục Gốc (Di chuyển các tệp/thư mục sang `frontend/`)

**Step 1: Write verification description**
Chúng ta sẽ chạy lệnh PowerShell để kiểm tra xem thư mục `frontend` đã được tạo và chứa đầy đủ các file/thư mục `src`, `public`, `package.json`, `vite.config.js` chưa:
```powershell
Get-ChildItem -Path frontend | Select-Object Name
```
Expected: Danh sách file đã di chuyển hiển thị trong `frontend`.

**Step 2: Verify existing state**
Chạy lệnh kiểm tra xem thư mục `frontend` đã tồn tại chưa:
```powershell
Test-Path -Path frontend
```
Expected: `False` (Thư mục chưa tồn tại trước khi chạy tác vụ).

**Step 3: Write minimal implementation**
Khởi chạy lệnh tạo thư mục và di chuyển files trong PowerShell:
```powershell
New-Item -ItemType Directory -Path frontend
Move-Item -Path src -Destination frontend/
Move-Item -Path public -Destination frontend/
Move-Item -Path index.html -Destination frontend/
Move-Item -Path vite.config.js -Destination frontend/
Move-Item -Path package.json -Destination frontend/
Move-Item -Path package-lock.json -Destination frontend/
Move-Item -Path .oxlintrc.json -Destination frontend/
```

**Step 4: Run test to verify it passes**
Chạy lại lệnh kiểm tra ở Step 1:
```powershell
Get-ChildItem -Path frontend | Select-Object Name
```
Expected:
```
Name
----
public
src
.oxlintrc.json
index.html
package-lock.json
package.json
vite.config.js
```

**Step 5: Commit**
```bash
git add .
git commit -m "refactor: move frontend codebase into frontend subdirectory"
```

---

### Task 2: Cập nhật relative import trong MasterPlayer.jsx

**Files:**
- Modify: `frontend/src/components/MasterPlayer.jsx`

**Step 1: Write verification description**
Kiểm tra dòng code import trong `frontend/src/components/MasterPlayer.jsx` xem có khớp với đường dẫn tương đối mới cấp 3 `../../../my-video/...` hay chưa.

**Step 2: Run test to verify it fails**
Đọc tệp `frontend/src/components/MasterPlayer.jsx` và xác minh rằng import hiện tại vẫn là `../../my-video/...` (đường dẫn lỗi do file đã chuyển thư mục).

**Step 3: Write minimal implementation**
Cập nhật tệp [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/MasterPlayer.jsx):
Thay đổi:
```javascript
import { MainComposition } from "../../../my-video/src/compositions/MainComposition";
```

**Step 4: Run test to verify it passes**
Đọc lại tệp và xác nhận đường dẫn đã được cập nhật chính xác.

**Step 5: Commit**
```bash
git add frontend/src/components/MasterPlayer.jsx
git commit -m "fix: update MasterPlayer relative import path to Remotion"
```

---

### Task 3: Cập nhật README.md & .gitignore và Dọn dẹp

**Files:**
- Modify: `README.md`
- Modify: `.gitignore`

**Step 1: Write verification description**
Kiểm tra xem `README.md` đã cập nhật lệnh `cd frontend` trước khi chạy `npm run dev` chưa và `.gitignore` đã có cấu hình chính xác chưa.

**Step 2: Verify existing state**
Kiểm tra hướng dẫn chạy trong `README.md` hiện tại (vẫn đang hướng dẫn chạy trực tiếp ở root).

**Step 3: Write minimal implementation**
1. Cập nhật [.gitignore](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/.gitignore) để bổ sung loại trừ thư mục `node_modules` và `dist` của `frontend`:
   ```
   frontend/node_modules
   frontend/dist
   ```
2. Cập nhật [README.md](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/README.md) phần hướng dẫn chạy Frontend:
   ```markdown
   ### Bước 2: Khởi động Frontend (React + Vite)
   1. Mở một terminal khác tại thư mục gốc của dự án.
   2. Di chuyển vào thư mục frontend:
      ```bash
      cd frontend
      ```
   3. Chạy cài đặt thư viện (nếu là lần đầu):
      ```bash
      npm install
      ```
   4. Khởi động server phát triển frontend chạy ở cổng `5173`:
      ```bash
      npm run dev
      ```
   ```

**Step 4: Verify it passes**
Đọc lại các tệp để đảm bảo các thay đổi được ghi nhận đầy đủ.

**Step 5: Commit**
```bash
git add README.md .gitignore
git commit -m "docs: update running instructions and gitignore for separated folders"
```
