# Design Document: 100% Sharp Original Background Image Rendering

**Date:** 2026-07-27  
**Status:** Approved  

## Objective
Hiển thị ảnh nền (Background Image) nguyên bản 100% độ nét (opacity 1.0), loại bỏ hoàn toàn các dải màu làm mờ (ambient blur/glass backdrop filter) đè lên phông nền, đảm bảo hình ảnh hiển thị rõ ràng từng chi tiết trong toàn bộ video AI.

---

## Key Design Principles

1. **Background Layer (`bgImage`):**
   * Absolute 100% opacity (`opacity: 1.0`).
   * Bỏ hoàn toàn dải màu phủ tối và bỏ các khối cầu màu phát sáng bị làm mờ đục (`filter: "blur(80px/90px)"`).
   * Layout JSX mẫu cho phông nền:
     ```jsx
     <img 
       src={scene.resolvedAssets?.bgImage} 
       style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 1.0, zIndex: 0 }} 
     />
     ```

2. **Card & Overlay Styling:**
   * Thay thế `backdropFilter: "blur(20px)"` bằng nền sẫm mờ đục sắc nét `background: "rgba(15, 23, 42, 0.88)"`.
   * Giữ nguyên viền mảnh tinh tế (`border: "1px solid rgba(255, 255, 255, 0.15)"`) và phông chữ tương phản cao (`#ffffff`, `#f97316`, `#3b82f6`).

3. **Backend System Prompt Updates (`backend/services/aiGen.js`):**
   * Cập nhật `bgImageRule` bắt buộc Gemini sinh mã nguồn với `opacity: 1.0` và nghiêm cấm hiệu ứng `blur`.
   * Cập nhật tất cả các template Safety Net Fallback (`safetyNetProcessTimeline`, `safetyNetComparisonVersus`, `safetyNetTitleHook`, `safetyNetCodeTerminal`, `generateGlassCardSafetyNetTSX`).

---

## Verification Criteria

1. Khi sinh video mới hoặc tạo phân cảnh mới có `bgImage`, ảnh nền hiển thị 100% rõ nét, không bị nhòe hay mờ đục.
2. Các thẻ chữ giữ độ tương phản cao, dễ đọc trên mobile.
3. Mã nguồn TSX sinh ra không chứa bất kỳ thuộc tính `filter: "blur(...)"` hay `backdropFilter: "blur(...)"` nào ở phông nền.
