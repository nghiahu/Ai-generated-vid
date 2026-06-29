# Thiết Kế API Thêm Và Xóa Phân Cảnh Động (Dynamic Scenes API)

Tài liệu này định nghĩa chi tiết thiết kế kỹ thuật cho 2 API bổ sung nhằm hỗ trợ thao tác thêm/xóa phân cảnh trực tiếp từ Dashboard Storyboard Editor.

---

## 1. Đặc tả API Endpoints

### 1.1. Thêm Phân cảnh mới (`POST /api/projects/:id/scenes`)
*   **Mô tả:** Khởi tạo và chèn thêm một phân cảnh trắng vào cuối dự án.
*   **Request Body (Optional):**
    ```json
    {
      "duration": 5.0,
      "visualLayout": "Intro Profile",
      "heading": "Cảnh mới",
      "points": [],
      "voiceover": ""
    }
    ```
*   **Response (210 Created):** Đối tượng Scene mới được tạo với `sceneIndex` tương ứng.

### 1.2. Xóa Phân cảnh (`DELETE /api/projects/:id/scenes/:sceneId`)
*   **Mô tả:** Xóa một phân cảnh khỏi dự án và tự động đánh số lại chỉ mục `scene_index` của các phân cảnh còn lại.
*   **Response (204 No Content):** Không có dữ liệu trả về.

---

## 2. Thiết Kế Cơ Sở Dữ Liệu (PostgreSQL)

### 2.1. Thao tác Thêm Scene (`db.createScene`)
1.  Đếm số lượng scene hiện có trong dự án (`SELECT COUNT(*)`).
2.  Tự động gán `scene_index` tiếp theo bằng giá trị đếm được.
3.  Chèn dòng mới vào bảng `scenes`.

### 2.2. Thao tác Xóa Scene (`db.deleteScene`)
1.  Thực hiện transaction.
2.  Xóa dòng có `id = sceneId`.
3.  Truy vấn danh sách ID còn lại sắp xếp theo `scene_index`.
4.  Cập nhật lại `scene_index` theo thứ tự từ `0` đến `N-1`.
5.  Commit transaction.
