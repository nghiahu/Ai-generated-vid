# Task List: Tối ưu hóa phát âm thuật ngữ công nghệ và giảm ngắt quãng trong TTS

| Task ID | Description | Status |
|---|---|---|
| TASK-01 | Dọn dẹp `TECH_TERMS_TRANSLITERATION` trong `phoneme.js` (loại bỏ các từ tiếng Anh thông dụng để đọc trực tiếp) | `[x]` |
| TASK-02 | Sửa đổi phiên âm tĩnh các từ còn lại trong `TECH_TERMS_TRANSLITERATION` (`open` -> `'âu-pơn'`, `'paper'` -> `'pây-pơ'`) | `[x]` |
| TASK-03 | Đồng bộ và cập nhật `TECH_TERMS_WHITELIST` trong `phoneme.js` | `[x]` |
| TASK-04 | Chạy thử nghiệm script kiểm thử và nghe file âm thanh để xác minh kết quả | `[x]` |
| TASK-05 | Cập nhật hàm `getPhonemesForTerms` trong `phoneme.js` để bỏ qua tra cứu cache DB đối với các từ trong whitelist | `[x]` |
| TASK-06 | Viết script và dọn dẹp các bản ghi cache cũ trong `phoneme_cache` database | `[x]` |
| TASK-07 | Chạy kiểm thử tự động và thủ công lại để xác nhận | `[x]` |
| TASK-08 | Định nghĩa hàm `normalizeVisualPattern` trong `aiGen.js` và thực hiện chuẩn hóa visualPattern đầu vào | `[x]` |
| TASK-09 | Loại bỏ `'prompt': 'bờ-rom'` khỏi `phoneme.js` để đồng bộ lại file code | `[x]` |
| TASK-10 | Chạy script kiểm thử để kiểm tra tính đúng đắn và cập nhật cơ sở dữ liệu cho dự án hiện tại | `[x]` |
| TASK-11 | Cập nhật `bgImageRule` và System Instruction trong `aiGen.js` cho độ nét phông nền 100% | `[x]` |
| TASK-12 | Cập nhật tất cả các Safety Net Fallback Templates để bỏ hiệu ứng mờ phông nền | `[x]` |
| TASK-13 | Chạy script tái sinh code cho dự án hiện tại và kiểm tra kết quả hiển thị | `[x]` |
| TASK-14 | Xử lý cờ `bypassCache: true` khi người dùng chủ động bấm "Sinh lại" phân cảnh | `[x]` |
| TASK-15 | Chẩn đoán lỗi mất nền khi xuất video: `resolvedAssets` không được lưu vào DB | `[x]` |
| TASK-16 | Sửa `aiGen.js`: return `resolvedAssets` từ `generateSingleSceneCode`, cập nhật `bgImageRule` dùng `scene.resolvedAssets.bgImage` động, thêm bgImage layer vào tất cả 7 Safety Net templates | `[x]` |
| TASK-17 | Chạy script validate và tái sinh toàn bộ scene để áp dụng fix bgImage mới | `[x]` |
| TASK-18 | Cập nhật `aiGen.js` & `studioAiGenRoute.js` để tiếp nhận `userNote` và inject vào Gemini Prompt | `[x]` |
| TASK-19 | Cập nhật `api.js` truyền `userNote` lên backend | `[x]` |
| TASK-20 | Nâng cấp giao diện modal "Sinh Lại Phân Cảnh" trong `StudioAIGen.jsx` với 2 ô textarea cho Voiceover & Lưu ý riêng | `[x]` |
| TASK-22 | Brainstorm database configuration and temporary db options | `[x]` |
| TASK-23 | Fix background overlay and hexToRgb parser in DynamicLayout.tsx | `[x]` |
| TASK-24 | Support Light Mode (Rikkei Theme) for TimelineShiftMode layout | `[x]` |
| TASK-25 | Support Light Mode (Rikkei Theme) for OpsMonitorMode layout | `[x]` |
| TASK-26 | Brainstorming: Phân biệt từ "ai" tiếng Việt và "AI" tiếng Anh trong TTS (Explore & Q&A) | `[x]` |
| TASK-27 | Thiết kế & Viết tài liệu thiết kế phân biệt "ai" vs "AI" | `[x]` |
| TASK-28 | Lập kế hoạch triển khai (Implementation Plan) cho sửa lỗi phát âm "ai" vs "AI" | `[x]` |
| TASK-29 | Thực thi sửa lỗi phát âm "ai" vs "AI" | `[x]` |
| TASK-30 | Kiểm thử và xác minh lỗi phát âm "ai" vs "AI" | `[x]` |
