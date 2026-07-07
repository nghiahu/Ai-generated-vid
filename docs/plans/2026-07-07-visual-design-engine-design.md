# Thiết kế Kiến trúc Hệ thống Visual Design Engine (VDE)

Tài liệu này đặc tả thiết kế kỹ thuật chi tiết cho **Visual Design Engine (VDE)**. VDE đóng vai trò như một **Trình biên dịch thiết kế (Style Compiler)** giúp chuyển đổi các phong cách thiết kế rời rạc (Visual Styles) và các đặc tính động (Traits) thành một cấu hình chạy thống nhất (**Runtime Style JSON**).

Hệ thống này giúp tách biệt hoàn toàn tư duy thẩm mỹ/lập luận của AI (Creative Reasoning) khỏi hạ tầng dựng video thực tế (Remotion Renderer).

---

## 1. Tổng quan Kiến trúc (Architecture Overview)

```
Story & Base Style ID
          ↓
  Style Compiler (Inheritance Resolver → Trait Loader → Dependency/Conflict Resolvers → Layered Merger)
          ↓
  Schema Validator
          ↓
  Style Optimizer (Contextual Pruning)
          ├─────────────────────────────┐
          ▼                             ▼
Prompt Guidelines (AI Prompt)    Runtime Style JSON (IR)
          ▼                             ▼
Visual Reasoning Engine (VRE)    Composition Engine (Dynamic Grid / Constraints)
          └─────────────────────────────┬──────────────────────────────┘
                                        ▼
                                  Remotion Renderer
```

---

## 2. Đặc tả Cấu trúc Dữ liệu & Thư mục (Section 1)

Các Style và Trait được lưu trữ dưới dạng các thư mục và tập tin JSON/TXT mô-đun hóa trên Backend.

### A. Cấu trúc thư mục của Styles
Mỗi Visual Style đại diện cho một bản sắc thiết kế độc lập (Identity) hỗ trợ đơn kế thừa (Single Inheritance).

```
backend/styles/
├── minimal/
│   ├── dna.json           # Triết lý thiết kế & Tone giọng
│   ├── grammar.json       # Các ràng buộc layout & Các node được phép dùng
│   ├── tokens.json        # Mã màu, fonts, spacing mặc định
│   ├── motion.json        # Định nghĩa chuyển động & Các chuyển động cấm kị
│   ├── storytelling.json  # Nhịp độ & Phân cảnh mẫu
│   └── assets.json        # Loại tài nguyên được phép & bị cấm dùng
├── apple/
│   ├── extends.txt        # Chứa chuỗi đơn: "minimal"
│   ├── dna.json           # Ghi đè triết lý thiết kế của minimal
│   └── tokens.json        # Ghi đè mã màu & font của minimal
└── cyberpunk/
    ...
```

### B. Cấu trúc thư mục của Traits
Traits đóng vai trò như các bộ sửa đổi (Modifiers/Capabilities) có thể lắp ghép động dựa theo ngữ cảnh hoặc lựa chọn của người dùng.

```
backend/traits/
├── dark_theme/
│   ├── tokens.json        # Ghi đè màu sắc sang tông tối
│   └── _rules.json        # Ràng buộc điều kiện áp dụng
├── vertical_video/
│   ├── tokens.json        # Điều chỉnh padding, gaps nhỏ hơn cho tỉ lệ 9:16
│   └── grammar.json       # Khóa bớt một số layout 3 cột do không gian hẹp
└── glass_effect/
    └── tokens.json        # Ghi đè cardBg và border thành mờ kính
```

---

## 3. Luồng hoạt động của Trình biên dịch - StyleCompiler (Section 2)

StyleCompiler xử lý qua 6 bước để tạo ra Runtime Style JSON:

1.  **Inheritance Resolver**:
    *   Đọc `extends.txt` hoặc thuộc tính `extends` trong `dna.json`.
    *   Lần ngược chuỗi kế thừa từ gốc lên ngọn (ví dụ: `[base, minimal, apple]`).
    *   Kiểm tra vòng lặp vô hạn (Circular Dependency Detection).
2.  **Trait Loader**:
    *   Tải cấu hình của các Traits được kích hoạt (do người dùng chọn, AI chọn hoặc kích hoạt tự động theo khung hình).
3.  **Dependency & Conflict Resolver**:
    *   **Dependency**: Kích hoạt tự động các trait đi kèm (ví dụ: `glass_effect` kích hoạt thêm `dark_theme`).
    *   **Conflict**: Giải quyết các trait xung đột (ví dụ: `dark_theme` và `light_theme`).
4.  **Permission Verifier**:
    *   Kiểm tra xem Trait hoặc User có cố ý ghi đè các trường bị khóa không cho phép sửa đổi hay không.
5.  **Layered Merger**:
    *   Trộn chồng các cấu hình dựa theo 6 lớp ưu tiên (sẽ mô tả chi tiết ở phần sau).
6.  **Schema Validator**:
    *   Kiểm tra tính hợp lệ của tệp JSON đầu ra để đảm bảo không bị lỗi cấu trúc dữ liệu trước khi chuyển giao.

---

## 4. Logic Trộn Phân Lớp & Kiểm soát Quyền (Section 3)

### A. 6 Tầng Ưu Tiên Trộn (Precedence Layers)
Khi gộp các cấu hình, Compiler áp dụng quy tắc CSS Cascade Specificity từ thấp đến cao:

1.  **Core Identity** (Thấp nhất): Giá trị mặc định từ phong cách gốc (e.g. `minimal`).
2.  **Style Defaults**: Các thuộc tính ghi đè trong Style đích hiện tại (e.g. `apple`).
3.  **Capability Traits**: Các chỉnh sửa kỹ thuật đặc trưng được bật (e.g. `glass_effect`).
4.  **Context Traits**: Tự động tinh chỉnh theo môi trường (e.g. `vertical_video` khi tỉ lệ 9:16).
5.  **User Overrides**: Tùy chỉnh trực tiếp từ người dùng thông qua Editor UI.
6.  **Scene Adaptive** (Cao nhất): AI hoặc Renderer tự động điều chỉnh động cho từng phân cảnh để đảm bảo tính dễ đọc (e.g. Đảo màu chữ khi ảnh nền quá sáng).

### B. Kiểm soát quyền ghi đè (Permissions Check)
Style có quyền khóa các thuộc tính cốt lõi không cho phép các tầng trên thay đổi:

```json
{
  "tokens": {
    "colors": {
      "background": "#000000"
    }
  },
  "_permissions": {
    "tokens.colors.background": {
      "canModify": false,
      "reason": "Phong cách Apple bắt buộc phải sử dụng nền đen tuyền."
    }
  }
}
```

---

## 5. Style Optimizer & Cấu trúc Runtime JSON (Section 4)

### A. Rút gọn Prompt cho LLM
`StyleOptimizer` loại bỏ hoàn toàn các thông số kỹ thuật CSS (px, timings, radius, shadows, grid layouts cụ thể) để tạo ra bản tóm tắt chỉ thị ngắn gọn, trực quan nhất cho AI. Việc này giúp tiết kiệm token và tăng độ chính xác trong lập luận bố cục của AI.

### B. Cấu trúc Runtime Style JSON (IR)
Tệp JSON sau biên dịch hoàn chỉnh sẽ chứa toàn bộ các biến số thiết kế để truyền tải cho Dynamic Layout Engine và Remotion:

```json
{
  "styleId": "apple",
  "meta": {
    "compiledAt": "2026-07-07T08:18:00Z",
    "inheritanceChain": ["minimal", "apple"],
    "appliedTraits": ["dark_theme", "vertical_video"]
  },
  "dna": {
    "philosophy": { "oneIdeaPerScene": true, "clarity": 1.0, "minimalism": 0.98 },
    "tone": "premium, sleek, presentation keynote, luxury"
  },
  "grammar": {
    "nodes": ["primary_focus", "supporting_text", "background_element"],
    "constraints": [
      "Only one dominant visual focus is allowed per scene.",
      "Whitespace must occupy at least 45% of the viewport."
    ]
  },
  "tokens": {
    "colors": {
      "background": "#000000",
      "cardBg": "rgba(255, 255, 255, 0.03)",
      "border": "rgba(255, 255, 255, 0.08)",
      "accent": "#ffffff",
      "text": "#ffffff",
      "textSecondary": "#86868b"
    },
    "fonts": {
      "title": "SF Pro, Inter",
      "body": "SF Pro, Inter"
    },
    "spacing": { "padding": "20px", "gap": "20px" },
    "radius": "28px",
    "shadow": "none"
  },
  "motion": {
    "energy": "very_low",
    "style": ["fade", "opacity", "mask_reveal"]
  }
}
```

---

## 6. Kế hoạch Xác minh (Verification Plan)

### A. Kiểm thử Tự động (Automated Tests)
*   **Unit Tests cho Compiler**:
    *   Kiểm tra tính năng kế thừa đơn (Single Inheritance) xem các thuộc tính có được merge chính xác không.
    *   Kiểm tra tính năng phát hiện vòng lặp vô hạn (Circular inheritance check).
    *   Kiểm tra việc áp dụng đúng các Trait xếp chồng theo thứ tự ưu tiên.
    *   Kiểm tra tính năng khóa ghi đè (Permissions check) hoạt động đúng như mong đợi.

### B. Kiểm thử Thủ công (Manual Verification)
*   **Kiểm tra Editor UI**: Trực quan hóa việc thay đổi Style/Trait trên giao diện web và xem Preview của cảnh có được cập nhật đồng bộ các token (màu sắc, font, viền, hiệu ứng kính mờ) hay không.
*   **Kết xuất Video**: Thực hiện render thử nghiệm dự án video bằng CLI của Remotion để xác thực Runtime Style IR được nạp chính xác và vẽ giao diện không bị lỗi CSS.
