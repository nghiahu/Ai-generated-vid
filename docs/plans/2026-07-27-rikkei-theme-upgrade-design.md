# Rikkei Theme Visual Brand Upgrade Design

**Date**: 2026-07-27  
**Topic**: Nâng cấp Theme Rikkei theo Chuẩn Brand Identity (Không Hardcode Văn Bản Thương Hiệu)

---

## 1. Overview & Objectives

Hiện tại, theme `rikkei` có màu sắc nền hơi mờ nhạt, tương phản thấp, sử dụng họa tiết vân giấy/núi chưa thực sự ăn nhập và chưa thể hiện được sự chuyên nghiệp, cao cấp của thương hiệu Rikkei Edu (như các hình ảnh thiết kế thực tế).

Mục tiêu thiết kế này là nâng cấp toàn bộ hệ thống hình ảnh, màu sắc, khung viền, thẻ card, icon và bố cục của theme `rikkei` theo đúng nhận diện thương hiệu Rikkei Edu:
- **Tông màu chủ đạo**: Crimson Red (`#A8232A`), gradient đỏ rực rỡ, kết hợp thẻ màu trắng/hồng nhạt có chiều sâu.
- **Typography & Brackets**: Cấu trúc tiêu đề nổi bật với khung ngoặc vuông `[ TIÊU ĐỀ ]`.
- **Thẻ nội dung (Cards)**: Bo góc 16px, viền đỏ mảnh (`1.5px solid rgba(168, 35, 42, 0.18)`), bóng đổ mềm (`0 10px 30px rgba(168,35,42,0.08)`).
- **Checklist & Icons**: Biểu tượng tích xanh/đỏ (`✓` / `✕`) trong vòng tròn cùng các cụm từ highlight đậm.
- **Search Callout & Action Button**: Hỗ trợ UI Search Box `🔍 "Bình luận [KEYWORD]..."` và nút bấm Crimson Red `"Truy cập →"`.
- **An toàn cho Subtitle**: Tự động nâng lề dưới cho subtitle để không bị đè lên bộ điều khiển phát video.
- **Nguyên tắc cốt lõi**: Tái tạo 100% style thiết kế nhưng **không hardcode** chữ thương hiệu "Rikkei", đảm bảo tính linh hoạt cho mọi nội dung video.

---

## 2. Design Specifications

### 2.1 Theme Tokens (`vde_themes.json` & `vdeTokens.ts`)

```json
{
  "rikkei": {
    "extends": "minimal",
    "name": "Rikkei Academic Premium",
    "description": "Phong cách nhận diện Rikkei: Nền trắng hồng hạt siêu sạch, viền đỏ Crimson, thẻ học tập 3D bo góc 16px, khung tiêu đề Brackets.",
    "tokens": {
      "colors": {
        "background": "linear-gradient(135deg, #FFFFFF 0%, #FFF2F4 50%, #FFE6E9 100%)",
        "cardBg": "linear-gradient(135deg, #FFFFFF 0%, #FFF8F8 100%)",
        "border": "1.5px solid rgba(168, 35, 42, 0.18)",
        "accent": "#A8232A",
        "accentGradient": "linear-gradient(135deg, #B8191C 0%, #E62B32 100%)",
        "text": "#191919",
        "textSecondary": "#595959"
      },
      "fonts": {
        "title": "Be Vietnam Pro",
        "body": "Be Vietnam Pro"
      },
      "radius": "16px",
      "shadow": "0 10px 30px rgba(168, 35, 42, 0.08)"
    }
  }
}
```

### 2.2 Title & Framing Component
- **Brackets Frame**: Thêm hỗ trợ render cặp ngoặc vuông `[ Tiêu Đề ]` viền đỏ hoặc chữ màu trắng/đỏ Crimson khi theme là `rikkei`.
- **Category Badge**: Đổi badge danh mục thành dạng viên thuốc (pill) nền nhạt viền đỏ Crimson `padding: 6px 16px`, chữ viết hoa nổi bật.

### 2.3 Cards & List Renderers (`BeforeAfterPanelMode`, `VerticalListMode`)
- **Comparison Card (So sánh `Trắc Đã` vs `Sau Này`)**:
  - Thẻ bên trái (Cũ/Nhược điểm): Nền trắng hồng nhẹ, viền `1.5px solid rgba(168,35,42,0.15)`, icon `✕` màu đỏ.
  - Thẻ bên phải (Mới/Ưu điểm): Nền trắng viền nổi `2px solid #A8232A`, icon `✓` màu xanh lục/đỏ rực, highlight từ khóa quan trọng.
  - Badge VS: Đổi thành hình tròn gradient Crimson Red nổi bật ở giữa.
- **Vertical List Cards**:
  - Số thứ tự (`01`, `02`, `03`): Vòng tròn Crimson Red (`#A8232A`) chữ trắng bold 900.
  - Thẻ danh sách: Nền trắng viền mỏng đỏ hồng, shadow mềm.

### 2.4 Callout Search Bar UI Component
- Hỗ trợ block UI dạng thanh tìm kiếm:
  - Container dạng pill bo tròn 50px, nền trắng tinh, bóng đổ `0 8px 24px rgba(0,0,0,0.06)`.
  - Icon Kính lúp `🔍` màu Crimson Red bên trái, nút đóng `✕` bên phải.
  - Nội dung text linh hoạt: `"Bình luận [KEYWORD] nhận tài liệu"`.

### 2.5 Caption / Subtitle Safe Padding
- Cập nhật style cho subtitle component: Đặt `marginBottom: "80px"` hoặc `bottom: "90px"` để Subtitle hiển thị rõ ràng trên nền mờ pill, tuyệt đối không bị thanh điều khiển video (play/pause/scrubber) che mất.

---

## 3. Proposed File Changes

1. `my-video/src/styles/vde_themes.json`: Cập nhật định nghĩa tokens cho theme `rikkei`.
2. `my-video/src/styles/vdeTokens.ts`: Thêm override CSS sắc nét cho theme `rikkei`.
3. `my-video/src/styles/themes.ts`: Cập nhật cardStyle, titleStyle, badgeStyle tương thích với thiết kế Rikkei.
4. `my-video/src/compositions/layouts/modes/BeforeAfterPanelMode.tsx`: Cải thiện render card so sánh với icon `✓`/`✕`, badge VS đỏ rực và chữ highlight.
5. `my-video/src/compositions/layouts/modes/VerticalListMode.tsx`: Cập nhật số đếm tròn đỏ và card sáng viền Crimson.
6. `my-video/src/compositions/layouts/modes/CenteredTextMode.tsx`: Đưa khung ngoặc `[ tiêu đề ]` vào tiêu đề chính.
7. `my-video/src/components/atoms/VideoAtoms.tsx`: Đảm bảo Subtitles nằm trong vùng an toàn (Safe Area).

---

## 4. Verification Plan

1. Khởi chạy / build Remotion composition với theme `rikkei`.
2. Kiểm tra giao diện các layout: `BeforeAfterPanelMode`, `VerticalListMode`, `CenteredTextMode`.
3. Đảm bảo màu sắc đỏ Crimson rực rỡ, độ tương phản cao, thẻ card trắng bo tròn viền đỏ, không bị che Subtitle.
4. Xác nhận không có chữ hardcode cố định "Rikkei" trong component code.
