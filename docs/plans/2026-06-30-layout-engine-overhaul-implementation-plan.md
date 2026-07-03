# Constraint-based Layout Engine Overhaul Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Đồng bộ đầy đủ 8 loại bố cục mới (Hero, Split Screen, Dashboard, Feature Grid, Timeline, Comparison, Terminal, Gallery) ở cả Prompt AI, Frontend dropdown và bổ sung các hàm render đặc thù (Timeline nối dọc, Comparison song song, Dashboard grid) vào Remotion & Web Preview.

**Architecture:**
1. Cập nhật Prompt Gemini trong `ai.js` để tự động gán đúng 8 layout mới.
2. Thêm các option tương ứng cho thẻ `<select>` Visual Layout trong `StoryboardEditor.jsx`.
3. Sửa đổi `DynamicLayout.tsx` để bổ sung các hàm: `renderTimeline`, `renderComparison`, `renderDashboard`.
4. Cập nhật `resolveEditorComponents` và phần render Preview của `StoryboardEditor.jsx` để mô phỏng chính xác giao diện Timeline và Comparison.

**Tech Stack:** React, Remotion, Express, Gemini API.

---

### Task 1: Cập nhật Prompt AI ở Backend
**Files:**
- Modify: [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js)

**Step 1: Cập nhật prompt và schema trong ai.js**
Sửa đổi prompt tại dòng 28 và 39 trong [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js) để cung cấp 8 layout:
```javascript
          "visualLayout": "Hero" | "Split Screen" | "Dashboard" | "Feature Grid" | "Timeline" | "Comparison" | "Terminal" | "Gallery",
```
Và cung cấp quy tắc lựa chọn cụ thể cho AI.

---

### Task 2: Cập nhật Dropdown chọn Layout ở Frontend
**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Sửa đổi select Visual Layout trong StoryboardEditor.jsx**
Thay thế danh sách tùy chọn cứng cũ ở khoảng dòng 430-436 bằng 8 tùy chọn mới:
```jsx
                      <select 
                        className="form-input-mono"
                        value={scene.visualLayout} 
                        onChange={(e) => handleFieldChange(scene.id, "visualLayout", e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        <option value="Hero">Hero (Intro / Headline)</option>
                        <option value="Split Screen">Split Screen (Media + Info)</option>
                        <option value="Dashboard">Dashboard (Statistics)</option>
                        <option value="Feature Grid">Feature Grid (Bento Box)</option>
                        <option value="Timeline">Timeline (Steps)</option>
                        <option value="Comparison">Comparison (VS / Pros-Cons)</option>
                        <option value="Terminal">Terminal (Code Console)</option>
                        <option value="Gallery">Gallery (Screenshots)</option>
                      </select>
```

---

### Task 3: Hiện thực các Layout Renderers đặc thù trong Remotion
**Files:**
- Modify: [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/DynamicLayout.tsx)

**Step 1: Viết các hàm `renderTimeline`, `renderComparison` trong DynamicLayout.tsx**
Sửa đổi [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/DynamicLayout.tsx) để bổ sung các cấu trúc render cụ thể:
*   `renderTimeline`: Vẽ trục nét đứt và các hình tròn số ở bên trái.
*   `renderComparison`: Phân chia mảng thành hai cột đối xứng Ưu/Nhược điểm.
*   `renderDashboard`: Dựng grid lưới cho các stats.
Cập nhật nhánh điều kiện render chính ở đáy file.

---

### Task 4: Đồng bộ hóa hiển thị Preview trên Editor
**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Cập nhật hàm `resolveEditorComponents` và phần render Preview**
*   Điều chỉnh giải thuật chia đôi danh sách trong `resolveEditorComponents` hoặc khi vẽ các phần tử Preview.
*   Nếu `scene.visualLayout === "Timeline"`, vẽ đường nối dọc và vòng tròn số.
*   Nếu `scene.visualLayout === "Comparison"`, render hai cột đối lập màu sắc.

---

### Kế hoạch Kiểm thử & Xác minh (Verification Plan)
1.  Chạy typecheck trong `my-video`: `npx tsc --noEmit`.
2.  Mở Web Editor, thêm phân cảnh mới, đổi sang layout `Timeline` và `Comparison`, kiểm tra hiển thị Preview 9:16 có vẽ chuẩn xác các bước nối dọc hay hai cột song song.
3.  Tạo phân cảnh bằng AI từ script, xác nhận trên giao diện xuất hiện các cảnh có bố cục `Timeline` hoặc `Terminal`.
