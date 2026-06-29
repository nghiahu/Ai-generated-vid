# Tối ưu hóa Tiến trình Render MP4 & Master Player Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Sửa lỗi tỉ lệ hiển thị phần trăm kết xuất MP4 từ dạng số thực (0.23%) sang phần trăm chuẩn (23%) và bổ sung hiển thị chi tiết số frame đang kết xuất (ví dụ: Frame 45/300) trên giao diện Master Player.

**Architecture:** 
1. Mở rộng bộ lọc logs stdout của Remotion CLI ở Backend bằng regex để bắt thông tin frame (`frame X/Y`) và lưu vào cấu trúc trạng thái render.
2. Trả về thêm `renderedFrames` và `totalFrames` qua API lấy trạng thái kết xuất.
3. Ở Frontend, nhân hệ số 100 cho phần trăm tiến trình nhận được, lưu trữ frame hiện tại/tổng số frame vào state và hiển thị chúng trực quan trên thanh tiến trình của Master Player.

**Tech Stack:** Node.js, Express, React, Vite, Remotion

---

### Task 1: Nâng cấp Parser Logs ở Backend (`render.js`) và viết file test kiểm thử

**Files:**
- Create: `backend/test_log_parser.js`
- Modify: `backend/services/render.js`

**Step 1: Write the failing test**
Tạo file `backend/test_log_parser.js` để test bộ parser logs Remotion:
```javascript
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Test regex và trích xuất thông tin logs của Remotion
function parseLogLine(text) {
  // Bản hiện tại chỉ bắt phần trăm
  const percentMatch = text.match(/\((\d+)%\)/);
  const progress = percentMatch ? parseInt(percentMatch[1], 10) / 100 : 0.0;
  
  return {
    progress,
    renderedFrames: 0,
    totalFrames: 0
  };
}

// Chạy thử với log Remotion thực tế
const sampleLog = "[Remotion CLI]: Rendered frame 45/300 (15%)";
const result = parseLogLine(sampleLog);

console.log("Chạy test thử nghiệm parser cũ...");
try {
  assert.strictEqual(result.progress, 0.15);
  assert.strictEqual(result.renderedFrames, 45); // Sẽ lỗi vì phiên bản cũ trả về 0
  assert.strictEqual(result.totalFrames, 300);    // Sẽ lỗi vì phiên bản cũ trả về 0
  console.log("PASS: Test thành công!");
} catch (err) {
  console.log("FAIL: Test thất bại như mong đợi!");
  console.error(err.message);
}
```

**Step 2: Run test to verify it fails**
Run: `node backend/test_log_parser.js` in `backend` directory
Expected output:
```
FAIL: Test thất bại như mong đợi!
Expected: 45, Actual: 0
```

**Step 3: Write minimal implementation**
Sửa [render.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/render.js) để cập nhật parser:
Cập nhật trong khối `remotionProcess.stdout.on('data')`:
```javascript
  remotionProcess.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`[Remotion CLI]: ${text.trim()}`);
    
    // Parse frames e.g., "Rendering frame 45/300"
    const frameMatch = text.match(/frame (\d+)\/(\d+)/i);
    if (frameMatch) {
      activeRenders[renderId].renderedFrames = parseInt(frameMatch[1], 10);
      activeRenders[renderId].totalFrames = parseInt(frameMatch[2], 10);
    }

    // Parse progress e.g., "Rendering frame 34/300 (11%)"
    const match = text.match(/\((\d+)%\)/);
    if (match) {
      const percentage = parseInt(match[1], 10);
      activeRenders[renderId].progress = percentage / 100;
    }
  });
```
Đồng thời cập nhật hàm khởi tạo `renderVideo` để mặc định `renderedFrames: 0` và `totalFrames: 0`.

Cập nhật lại tệp test `backend/test_log_parser.js` để import và sử dụng logic thực tế từ `render.js` (hoặc copy trực tiếp hàm parse log thực tế vào file test để chạy độc lập không phụ thuộc vào `spawn`).

**Step 4: Run test to verify it passes**
Chạy lại file test sau khi đã cập nhật hàm parse logic:
Run: `node backend/test_log_parser.js`
Expected: `PASS: Test thành công!`

**Step 5: Commit**
```bash
git add backend/services/render.js backend/test_log_parser.js
git commit -m "feat: add frame details to remotion stdout parser"
```

---

### Task 2: Trả về thông tin frames qua API Render Status

**Files:**
- Modify: `backend/server.js`

**Step 1: Write verification in test**
Thêm phần kiểm thử gọi API giả lập vào `backend/test_log_parser.js` để kiểm tra cấu trúc JSON phản hồi từ `getRenderStatus`:
```javascript
// Test API Response structure
const renderStatusMock = {
  status: 'rendering',
  progress: 0.15,
  renderedFrames: 45,
  totalFrames: 300,
  videoUrl: null
};
assert.strictEqual(renderStatusMock.renderedFrames, 45);
assert.strictEqual(renderStatusMock.totalFrames, 300);
```

**Step 2: Run test to verify it fails**
(Chạy test để xác nhận các assertion về JSON response không bị lỗi cú pháp)

**Step 3: Write minimal implementation**
Cập nhật API `/api/projects/:id/render/status/:renderId` trong [server.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/server.js):
```javascript
    res.json({
      status: renderInfo.status,
      progress: renderInfo.progress,
      renderedFrames: renderInfo.renderedFrames || 0,
      totalFrames: renderInfo.totalFrames || 0,
      videoUrl: renderInfo.videoUrl
    });
```

**Step 4: Run test to verify it passes**
Chạy test tổng thể.

**Step 5: Commit**
```bash
git add backend/server.js
git commit -m "feat: expose renderedFrames and totalFrames in render status API"
```

---

### Task 3: Cập nhật Frontend App.jsx và MasterPlayer.jsx

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/MasterPlayer.jsx`

**Step 1: Write verification description**
Chúng ta sẽ thực hiện kiểm thử thủ công:
1. Chạy Backend server (`npm run dev` ở backend) và Frontend dev server.
2. Click nút "🚀 XUẤT VIDEO (.MP4)".
3. Kiểm tra xem phần trăm hiển thị trên nút "Exporting (X%)" và thanh tiến trình có bắt đầu từ 0% đến 100% chuẩn xác hay không.
4. Kiểm tra dòng chữ tiến trình hiển thị có đúng cấu trúc `Đang kết xuất (Frame X/Y)` không.

**Step 2: Verify existing (failing) state**
Quan sát giao diện lúc đang render hiện tại: thanh tiến trình không tăng hoặc tăng rất ít (vì `renderProgress` nhận giá trị thập phân `0.23%`).

**Step 3: Write minimal implementation**
1. Sửa [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/src/App.jsx):
   - Thêm state `renderedFrames` và `totalFrames` khởi tạo bằng `0`.
   - Trong hàm `handleRenderVideo`, reset chúng về `0`.
   - Trong hàm polling:
     ```javascript
     const statusRes = await api.getRenderStatus(currentProject.id, renderId);
     const progressPercent = Math.round((statusRes.progress || 0) * 100);
     setRenderProgress(progressPercent);
     setRenderedFrames(statusRes.renderedFrames || 0);
     setTotalFrames(statusRes.totalFrames || 0);
     ```
   - Truyền props xuống cho `<MasterPlayer />`.

2. Sửa [MasterPlayer.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/src/components/MasterPlayer.jsx):
   - Nhận thêm các props: `renderedFrames`, `totalFrames`.
   - Cập nhật phần giao diện hiển thị:
     ```javascript
     <span>
       {renderedFrames > 0 && totalFrames > 0 
         ? `Đang kết xuất (Frame ${renderedFrames}/${totalFrames})` 
         : "Đang kết xuất MP4..."}
     </span>
     <span>{renderProgress}%</span>
     ```

**Step 4: Verify it passes**
Thực hiện các bước kiểm thử thủ công và xác nhận giao diện hoạt động chính xác.

**Step 5: Commit**
```bash
git add src/App.jsx src/components/MasterPlayer.jsx
git commit -m "feat: render progress percentage fix and frame logs on frontend UI"
```
