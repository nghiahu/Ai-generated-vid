# Thiết Kế Nâng Cấp Giao Diện Người Dùng Sáng Sủa Hơn (Luminous Light Glassmorphism Design)

Tài liệu này đặc tả thiết kế kỹ thuật cho việc nâng cấp giao diện UI/UX của toàn bộ ứng dụng **Hyperframes** (bao gồm Dashboard, Storyboard Editor, Settings, và Render Progress) từ phong cách Brutalist Monochrome (Trắng/Đen phẳng viền đen) cũ sang phong cách **Luminous Light Glassmorphism** (Chất liệu kính mờ đón sáng cao cấp).

---

## 1. Hệ thống Màu sắc & Token mới (CSS Theme Tokens)

Chúng ta sẽ chỉnh sửa file `frontend/src/styles/theme.css` để định nghĩa lại các CSS variables hệ thống:

```css
:root {
  --font-heading: 'Montserrat', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;

  /* Nền và chất liệu kính mờ */
  --bg-primary: rgba(255, 255, 255, 0.75);       /* Thẻ kính mờ */
  --bg-secondary: #f4f6f9;                        /* Nền Cool Gray-Blue */
  --bg-tertiary: rgba(255, 255, 255, 0.45);       /* Kính siêu mỏng */
  
  /* Chữ Slate sâu */
  --text-primary: #1e293b;                        /* Slate 800 */
  --text-secondary: #475569;                      /* Slate 600 */
  --text-inverse: #ffffff;                        /* Chữ trắng */

  /* Viền kính mảnh */
  --border-thick: 1px solid rgba(255, 255, 255, 0.6);
  --border-thin: 1px solid rgba(0, 0, 0, 0.08);
  --border-gray: 1px solid rgba(0, 0, 0, 0.05);
  
  /* Bo góc mượt mà */
  --radius: 12px;                                 /* Nút bấm, input */
  --radius-lg: 16px;                              /* Thẻ chính, Sidebar */
  
  /* Đổ bóng mịn */
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.03);
  --shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.015);
  --shadow-hover: 0 16px 40px rgba(0, 0, 0, 0.06);
  
  /* Màu nhấn chuyển động */
  --color-primary: #2563eb;                       /* Electric Blue */
  --color-secondary: #f97316;                     /* Coral Orange */
  
  --transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 2. Các Thay đổi về Giao diện & Component Local

### A. Dashboard (`Dashboard.jsx`)
*   **Gradient Nền:** Bổ sung lớp nền chứa các đốm màu (lavender và light blue blobs) chuyển động mờ ảo phía sau các thẻ.
*   **Thẻ Dự án:** Chuyển đổi viền đen dày sang viền kính trắng mờ và đổ bóng nhẹ. Khi hover, thẻ sẽ có hiệu ứng trồi lên và viền ngoài phát sáng xanh lam nhạt.
*   **Nút "Tạo Dự Án mới":** Thiết kế dạng viên thuốc bo tròn mềm mại, nền gradient từ màu `#2563eb` sang `#a855f7`, có đổ bóng rực rỡ.

### B. Storyboard Editor & Settings (`StoryboardEditor.jsx`, `SidebarConfig.jsx`)
*   **Cấu trúc 2 cột:** Sử dụng nền xám trắng nhạt, các ô chọn hoặc khối cấu hình được bọc trong thẻ kính mờ trắng (`rgba(255,255,255,0.75)`).
*   **Sidebar bên trái:** Chuyển thành một thanh kính mờ trắng chạy dọc với góc bo `16px`, tạo khoảng cách 24px so với các cạnh màn hình để tạo cảm giác bay bổng (floating sidebar).
*   **Input Fields:** Bỏ viền đen dày, đổi sang viền xám nhạt tinh tế, bo góc `8px`. Khi focus, viền chuyển sang màu xanh dương chủ đạo kèm hiệu ứng glow nhẹ.

### C. Master Player (`MasterPlayer.jsx`)
*   Khung điện thoại mô phỏng trình phát 9:16 được đổi sang màu bạc/trắng kim loại tinh xảo.
*   Bổ sung hiệu ứng bóng chiếu tỏa sáng nhẹ ở cạnh viền điện thoại để tạo cảm giác rạp chiếu phim mini.

---

## 3. Kế hoạch Kiểm thử (Verification Plan)
*   **Kiểm thử Visual:** Mở giao diện localhost trên Chrome thông qua subagent để kiểm duyệt trực quan toàn bộ các màn hình, đảm bảo tính đồng bộ hoàn toàn với bản vẽ đã cập nhật trên Stitch.
*   **Kiểm thử Linting:** Chạy `npm run lint` để xác thực không có lỗi cú pháp.
