# Thiết kế: Đồng bộ động Logo/Watermark cho giao diện AI Hub Grid

**Chủ đề**: Chuyển đổi logo/watermark dưới đáy video của theme "AI Hub Grid" từ tĩnh thành động theo cấu hình Watermark của Editor, với giá trị mặc định mới là "AI LAB".
**Ngày khởi tạo**: 2026-07-18

---

## 1. Mục tiêu
Hiện tại, khi sử dụng visual style `ai_hub_grid`, hệ thống hiển thị một logo chữ tĩnh `"AI HUB"` ở dưới đáy video (vị trí bottom: 80px). Thiết lập này đang bị ghi đè cứng (hardcoded) trong mã nguồn Remotion và không phản hồi lại các cấu hình bật/tắt hay thay đổi chữ watermark từ giao diện Editor.
Mục tiêu là:
1. Đổi logo mặc định từ `"AI HUB"` thành `"AI LAB"`.
2. Đồng bộ hóa logo này với cài đặt Watermark trong Editor (cho phép bật/tắt qua checkbox `enabled` và thay đổi chữ qua input `text`).

---

## 2. Thiết kế chi tiết

### Thay đổi trong Remotion Composition
Chúng ta sẽ điều chỉnh file [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx).

Cụ thể, tại khối render Watermark cho theme `ai_hub_grid` (dòng 419-438):
- Kiểm tra xem watermark có được bật không: `config?.watermark?.enabled`.
- Thay đổi logic hiển thị text:
  - Nếu `config.watermark.text` trống, hoặc bằng giá trị mặc định của hệ thống (`"yupclip.com"`), ta hiển thị giá trị mặc định mới của theme này là **`"AI LAB"`**.
  - Nếu người dùng nhập giá trị bất kỳ khác (ví dụ: `"Ai lab"`, `"Brand X"`), ta hiển thị chính xác chuỗi chữ người dùng đã cấu hình.

Mã nguồn điều chỉnh dự kiến:
```tsx
      {/* Watermark Overlay layer (Tĩnh xuyên suốt video) */}
      {config?.visualStyle === "ai_hub_grid" ? (
        config?.watermark?.enabled && (
          <div
            style={{
              position: "absolute",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
              color: "#3b82f6",
              fontFamily: "Be Vietnam Pro, sans-serif",
              fontWeight: 900,
              fontSize: "28px",
              letterSpacing: "4px",
              textShadow: "0 0 12px rgba(59, 130, 246, 0.8)",
              opacity: 0.85
            }}
          >
            {(!config?.watermark?.text || config.watermark.text === "yupclip.com") 
              ? "AI LAB" 
              : config.watermark.text}
          </div>
        )
      ) : (
        config?.watermark?.enabled && (
          // ... Standard watermark rendering ...
        )
      )}
```

---

## 3. Kế hoạch kiểm thử (Verification Plan)

### Kiểm thử thủ công (Manual Verification)
1. Khởi chạy ứng dụng và truy cập trang Editor.
2. Chọn Visual Style là **AI Hub Grid**.
3. Xác nhận rằng logo dưới đáy video mặc định hiển thị là **`"AI LAB"`** (do giá trị mặc định của watermark lúc đầu là `"yupclip.com"`).
4. Tại vùng cấu hình Watermark của Editor trên Sidebar bên trái:
   - Thử tắt checkbox Watermark: Logo dưới đáy video biến mất.
   - Bật lại checkbox Watermark: Logo dưới đáy video xuất hiện lại.
   - Nhập chữ `"Ai lab"` vào ô cấu hình chữ: Xác nhận logo dưới đáy video đổi sang chữ hoa-thường `"Ai lab"` phát sáng tương ứng theo thời gian thực.
5. Biên dịch video (Render test) để xác nhận không có lỗi build/compiler từ Remotion.
