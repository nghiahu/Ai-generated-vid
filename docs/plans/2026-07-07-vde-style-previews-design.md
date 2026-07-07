# Thiết kế Hệ thống Style Previews Dựng Bằng Code & Các Phong Cách Mới (Claude & Light)

Tài liệu này đặc tả thiết kế kỹ thuật nâng cấp giao diện chọn phong cách của **Visual Design Engine (VDE)**. Loại bỏ ảnh đại diện tĩnh tĩnh từ Unsplash và thay thế bằng các thẻ mockup thu nhỏ (Mini Viewports) vẽ hoàn toàn bằng code sử dụng chính xác `VDE_TOKENS`. Đồng thời, bổ sung hai phong cách thiết kế cao cấp mới: **Claude Editorial** và **Minimalist Light**.

---

## 1. Thiết Kế Các Phong Cách Mới

### A. Phong cách Claude Editorial (`claude`)
*   **Triết lý**: Tái hiện phong cách thương hiệu của Anthropic Claude. Cảm giác ấm cúng, sang trọng, mang phong cách tạp chí tri thức và gọn gàng.
*   **Bảng màu**:
    *   `background`: Kem ấm giấy thô (`#FBF9F4`)
    *   `cardBg`: Cam đất rất nhạt mờ (`rgba(217, 107, 67, 0.03)`)
    *   `border`: Khung mỏng cam đất sét (`1px solid rgba(217, 107, 67, 0.15)`)
    *   `accent`: Cam đất sét đặc trưng (`#d96b43`)
    *   `text`: Đen than tối ấm (`#191919`)
    *   `textSecondary`: Xám đất ấm (`#6b655f`)
*   **Typography**: Tiêu đề sử dụng font có chân (`Playfair Display`), nội dung dùng font không chân (`Inter`).
*   **Chuyển động**: Soft slide (Trượt nhẹ nhàng).

### B. Phong cách Minimalist Light (`light`)
*   **Triết lý**: Hiện đại, tối giản và tươi sáng. Mang lại cảm giác sạch sẽ, tin cậy và tràn đầy năng lượng tích cực cho SaaS hoặc hướng dẫn công nghệ.
*   **Bảng màu**:
    *   `background`: Trắng tinh khiết (`#ffffff`)
    *   `cardBg`: Xám nhạt Slate (`#f8fafc`)
    *   `border`: Khung xám mỏng (`1px solid #e2e8f0`)
    *   `accent`: Xanh hoàng gia (`#2563eb`)
    *   `text`: Đen than (`#0f172a`)
    *   `textSecondary`: Xám Slate (`#475569`)
*   **Typography**: Không chân hiện đại (`Montserrat`/`Inter`).
*   **Chuyển động**: Snappy spring slide.

---

## 2. Thiết Kế Giao Diện Trực Quan (VDE Code Previews Grid)

Chúng ta sẽ nâng cấp Modal chọn Style trong [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx) để thay thế lưới ảnh Unsplash bằng lưới các Viewports thu nhỏ được vẽ bằng React/CSS.

### A. Cấu trúc Component Thẻ Preview thu nhỏ (`VDEViewportPreview.jsx`)
Mỗi thẻ phong cách sẽ chứa một khung vẽ mô phỏng:
*   Kích thước cố định: `width: "150px"`, `height: "240px"`.
*   Áp dụng các thuộc tính màu nền, viền, bo góc, bóng đổ và kiểu chữ của `VDE_TOKENS[styleId]`.
*   Hiển thị một mẫu card mô phỏng phân cảnh thực tế (chứa tiêu đề giả lập và các chấm tròn màu accent kèm gạch ngang mô phỏng text).

```jsx
const VDEViewportPreview = ({ styleId }) => {
  const tokens = VDE_TOKENS[styleId];
  return (
    <div style={{
      width: "150px",
      height: "240px",
      backgroundColor: tokens.colors.background,
      borderRadius: "16px",
      border: "2px solid #000000",
      padding: "15px",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <div style={{
        width: "100%",
        backgroundColor: tokens.colors.cardBg.includes("gradient") ? undefined : tokens.colors.cardBg,
        backgroundImage: tokens.colors.cardBg.includes("gradient") ? tokens.colors.cardBg : undefined,
        border: tokens.colors.border,
        borderRadius: tokens.radius,
        boxShadow: tokens.shadow,
        padding: "10px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "6px"
      }}>
        <div style={{ color: tokens.colors.text, fontFamily: tokens.fonts.title, fontSize: "11px", fontWeight: "bold" }}>
          TITLE HERE
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: tokens.colors.accent }} />
          <div style={{ width: "40px", height: "3px", backgroundColor: tokens.colors.textSecondary }} />
        </div>
      </div>
    </div>
  );
};
```

---

## 3. Các File Cần Thay Đổi

### Backend
1.  **[vde.js](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/vde.js)**:
    *   Bổ sung cấu hình mặc định cho `claude` và `light` vào `BUILTIN_STYLES`.
    *   Đảm bảo `initializeVDESubdirs` tự động tạo thư mục và tệp cấu hình cho 2 style này khi khởi động.
2.  **[ai.js](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js)**:
    *   Mở rộng danh sách nhận diện Visual Styles và nạp prompt tương ứng.

### Submodule Remotion
1.  **[fonts.ts](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/fonts.ts)**:
    *   Import và tải font có chân `Playfair Display` từ `@remotion/google-fonts/PlayfairDisplay` hỗ trợ subset `vietnamese`.
2.  **[vdeTokens.ts](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/vdeTokens.ts)**:
    *   Bổ sung `claude` và `light` vào bộ fallback tĩnh `VDE_TOKENS`.
3.  **[themes.ts](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/styles/themes.ts)**:
    *   Cập nhật font có chân cho style `claude` và font không chân sáng cho `light`.

### Frontend Web UI
1.  **[StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)**:
    *   Nâng cấp Modal chọn phong cách: Tạo giao diện Grid 6 phong cách với khung Preview viewport bằng code.
    *   Cập nhật state và danh sách styles hỗ trợ.
2.  **[SidebarConfig.jsx](file:///c:/Users/nghia/OneDrive/Máy%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/SidebarConfig.jsx)**:
    *   Thêm `Claude` và `Light` vào dropdown chọn Visual Design Style (VDE).

---

## 4. Kế Hoạch Xác Minh (Verification Plan)

### Kiểm thử tự động:
*   Chạy `npm run lint` và `tsc` trong thư mục `my-video` để đảm bảo import font mới thành công và biên dịch không lỗi.
*   Chạy unit tests `node backend/test_vde.js` xác thực nạp style `claude` và `light` đúng đắn.

### Kiểm thử thủ công:
*   Mở Modal chọn Style trên Web UI, kiểm tra trực quan các viewport mini hiển thị chính xác màu sắc, font chữ (ví dụ: Claude có chữ Serif có chân và màu cam đất sét).
*   Chọn style Claude, nhập kịch bản thử nghiệm và kiểm tra kịch bản render Preview khớp chuẩn.
