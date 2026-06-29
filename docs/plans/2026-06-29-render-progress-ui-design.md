# Tài liệu Thiết kế: Tối ưu hóa Tiến trình Render MP4 & Master Player

Tài liệu này mô tả chi tiết thiết kế kỹ thuật cho việc sửa lỗi tỉ lệ phần trăm và hiển thị chi tiết số frame (khung hình) đang kết xuất trong tiến trình xuất video MP4.

---

## 1. Mục tiêu
- Sửa lỗi hiển thị tỉ lệ phần trăm kết xuất trên giao diện người dùng (hiện tại đang hiển thị dạng float như `0.23%` thay vì `23%`).
- Nâng cấp Master Player để hiển thị chi tiết số frame đang kết xuất (ví dụ: `Frame 45/300`) thời gian thực dựa trên logs của Remotion CLI.

---

## 2. Chi tiết Thay đổi

### 2.1. Backend (Dịch vụ Render)

#### Tệp tin: [render.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/render.js)
- Thêm `renderedFrames` và `totalFrames` vào đối tượng quản lý tiến trình render `activeRenders[renderId]`.
- Cập nhật hàm parse logs stdout từ Remotion CLI bằng Regex mạnh mẽ hơn để trích xuất cả thông tin frame và phần trăm:
  ```javascript
  // Trích xuất số frame
  const frameMatch = text.match(/frame (\d+)\/(\d+)/i);
  if (frameMatch) {
    activeRenders[renderId].renderedFrames = parseInt(frameMatch[1], 10);
    activeRenders[renderId].totalFrames = parseInt(frameMatch[2], 10);
  }

  // Trích xuất phần trăm
  const percentMatch = text.match(/\((\d+)%\)/);
  if (percentMatch) {
    const percentage = parseInt(percentMatch[1], 10);
    activeRenders[renderId].progress = percentage / 100;
  }
  ```

#### Tệp tin: [server.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/server.js)
- Trả về thêm `renderedFrames` và `totalFrames` trong API lấy trạng thái kết xuất:
  ```javascript
  app.get('/api/projects/:id/render/status/:renderId', (req, res) => {
    // ...
    res.json({
      status: renderInfo.status,
      progress: renderInfo.progress,
      renderedFrames: renderInfo.renderedFrames || 0,
      totalFrames: renderInfo.totalFrames || 0,
      videoUrl: renderInfo.videoUrl
    });
  });
  ```

---

### 2.2. Frontend (Giao diện Người dùng)

#### Tệp tin: [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/src/App.jsx)
- Khai báo thêm state để quản lý số lượng frame:
  ```javascript
  const [renderedFrames, setRenderedFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  ```
- Cập nhật hàm polling để nhân 100 tiến trình nhận được từ backend (giá trị float `0.0 -> 1.0` thành phần trăm `0 -> 100`) và cập nhật số lượng frame:
  ```javascript
  const statusRes = await api.getRenderStatus(currentProject.id, renderId);
  const progressPercent = Math.round((statusRes.progress || 0) * 100);
  setRenderProgress(progressPercent);
  setRenderedFrames(statusRes.renderedFrames || 0);
  setTotalFrames(statusRes.totalFrames || 0);
  ```
- Truyền các giá trị này xuống cho `<MasterPlayer />`.

#### Tệp tin: [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/src/components/MasterPlayer.jsx)
- Nhận thêm các props `renderedFrames` và `totalFrames`.
- Cập nhật UI hiển thị tiến trình:
  ```javascript
  <span>
    {renderedFrames > 0 && totalFrames > 0 
      ? `Đang kết xuất (Frame ${renderedFrames}/${totalFrames})` 
      : 'Đang kết xuất MP4...'}
  </span>
  <span>{renderProgress}%</span>
  ```

---

## 3. Kế hoạch Kiểm thử (Verification Plan)
- Chạy thử tiến trình xuất video MP4 trên một dự án mẫu.
- Kiểm tra log in ra ở Backend để đảm bảo Regex hoạt động đúng trên các hệ máy Windows.
- Xác nhận thanh tiến trình tăng dần chính xác từ `0%` đến `100%` và hiển thị chi tiết số frame `Frame X/Y`.
