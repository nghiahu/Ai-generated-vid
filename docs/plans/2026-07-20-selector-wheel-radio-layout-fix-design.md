# Tài liệu Thiết kế: Sửa đổi Layout Selector Wheel Radio

Tài liệu này đặc tả thiết kế kỹ thuật để sửa đổi layout dạng bánh xe lựa chọn (`SelectorWheelRadio`) chạy sai định dạng trong ứng dụng video Remotion.

## 1. Vấn đề Hiện tại
* **Lỗi xếp dọc:** Hàm `resolvePositions` tự động ghi đè và xếp dọc toàn bộ thẻ absolute trên màn hình dọc (9:16), khiến layout bánh xe biến thành danh sách dọc.
* **Lỗi tọa độ JSON:** Trong file template JSON, Option B và Option C cùng nằm ở tọa độ `left: 0px`, dẫn đến đè khít lên nhau. Nút SELECT ở giữa sử dụng `left: "50%"` bị lệch tâm phải.
* **Sai lệch ánh xạ phần tử:** Vòng lặp vẽ thẻ mặc định đưa nội dung động thứ nhất vào vòng tròn SELECT (khiến nó bị giãn to), đẩy các đáp án tiếp theo xuống dưới sai vị trí.
* **Thiếu biểu tượng nút Radio:** Giao diện thẻ mặc định hiện tại chưa hỗ trợ vẽ biểu tượng hình tròn tích chọn (radio buttons) và vòng tròn đồng tâm phát sáng phía sau nút SELECT.

---

## 2. Giải pháp Đề xuất

### A. Vượt qua cơ chế tự động xếp dọc (`areaResolver.ts`)
Thêm `layoutId === "SelectorWheelRadio"` vào điều kiện ngoại lệ của hàm [resolvePositions](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/utils/areaResolver.ts):
```typescript
if (
  !isVertical || 
  layoutId === "IntroMapPinsImage" || 
  layoutId === "MapPinsHook" || 
  layoutId === "AIHubGrid2" || 
  layoutId === "WindingRoadmap" ||
  layoutId === "SelectorWheelRadio" // Cấm xếp dọc
) {
  return positions;
}
```

### B. Cập nhật Tọa độ chuẩn hóa (`selector_wheel_radio.json`)
Sửa đổi file [selector_wheel_radio.json](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/templates/List-Step/selector_wheel_radio.json) để xác lập vị trí các thẻ cân đối trên màn hình dọc (chiều rộng vùng chứa khả dụng sau khi trừ padding là `908px`):
* **Vị trí 0 (SELECT ở giữa):** `left: "375px"`, `top: "206px"`, `width: "158px"`, `height: "158px"`
* **Vị trí 1 (Option A - Trên):** `left: "289px"`, `top: "0px"`, `width: "330px"`, `height: "130px"`
* **Vị trí 2 (Option B - Trái):** `left: "0px"`, `top: "220px"`, `width: "360px"`, `height: "148px"`
* **Vị trí 3 (Option C - Phải):** `left: "548px"`, `top: "220px"`, `width: "360px"`, `height: "130px"`

### C. Logic vẽ giao diện tùy biến (`AbsoluteCardsMode.tsx`)
Khi `t.id === "SelectorWheelRadio"`:
1. **SVG Vòng tròn đồng tâm phát sáng phía sau:**
   * Vẽ một SVG chứa các vòng tròn mảnh, mờ nằm ẩn phía sau vòng tròn SELECT (Tâm tại X=454, Y=285).
   * Tạo hiệu ứng lan tỏa (pulse/ripple scale) dựa trên frame hiện tại của Remotion:
     ```typescript
     const ringScale1 = interpolate(frame, [0, 90], [1.0, 1.45], { extrapolateRight: "clamp" });
     const ringOpacity1 = interpolate(frame, [0, 90], [0.35, 0], { extrapolateRight: "clamp" });
     ```
2. **Hình tròn SELECT ở giữa:**
   * Render cố định text `"SELECT"` với kiểu dáng hình tròn hoàn hảo, nền mờ phát sáng nhẹ. Không tiêu thụ phần tử nội dung nào của dữ liệu đầu vào.
3. **Phân tích thẻ tùy chọn & Nút Radio:**
   * Tách dữ liệu đầu vào: `const optionComps = otherComps.slice(0, 3);`
   * Với mỗi thẻ tùy chọn:
     * Kiểm tra lựa chọn: `const isSelected = text.startsWith("*")`
     * Nội dung sạch: `const cleanText = isSelected ? text.slice(1).trim() : text`
     * Vẽ biểu tượng Radio hình tròn bên trái:
       * Chưa chọn: Viền tròn rỗng `rgba(255, 255, 255, 0.45)`.
       * Được chọn: Có thêm một hình tròn đặc phát sáng màu nhấn (`accentColor`) đồng tâm bên trong.
     * Áp dụng style thẻ được chọn: viền sáng, đổ bóng màu nhấn `rgba(${rgb}, 0.25)`.
     * Tận dụng animation `scale-in` hoặc `slide-up` với độ trễ (delay) tăng dần để tạo hiệu ứng cuốn hút.

---

## 3. Kế hoạch Kiểm thử (Verification Plan)
1. **Kiểm tra Remotion Dev Server:** 
   * Mở preview scene có sử dụng layout `SelectorWheelRadio`.
   * Đảm bảo giao diện hiển thị đúng cấu trúc bánh xe 3 hướng, không bị xếp dọc đè nhau.
2. **Kiểm tra trạng thái Chọn (Selected state):**
   * Đặt dấu `*` ở đầu nội dung của một option ngẫu nhiên (ví dụ: thẻ Option B).
   * Kiểm tra nút radio tương ứng có chấm đỏ ở giữa, viền thẻ phát sáng đỏ, và dấu `*` đã bị ẩn đi sạch sẽ.
3. **Kiểm tra vòng tròn SELECT:**
   * Đảm bảo vòng tròn chính giữa hiển thị cố định từ "SELECT" và vòng phát sáng SVG hoạt động mượt mà.
