# Thiết Kế: Cải Thiện Nhịp Điệu Giọng Đọc (TTS Voice Rhythm Improvement)

## 1. Vấn Đề Hiện Tại
*   Giọng nhân bản cục bộ (**OmniVoice**) nói liên tục không ngừng nghỉ ("cứ thế nói thôi"), thiếu nhịp điệu tự nhiên (pauses/cadence). Nguyên nhân là dữ liệu văn bản mẫu (`refText`) trong mã nguồn thiếu toàn bộ dấu câu làm mô hình học sai nhịp.
*   Thẻ âm vị CMU (`voiceoverTts` dạng `[R IY0 AE1 K T]`) đang bị truyền nhầm sang cả các bộ đọc đám mây (**ElevenLabs** và **Microsoft Edge TTS**), khiến chúng cố đọc dấu ngoặc/ký tự âm vị dẫn đến câu thoại bị sượng.

## 2. Giải Pháp Chi Tiết

### A. Chuẩn hóa dấu câu kịch bản mẫu & cấu hình tốc độ OmniVoice
**Tệp:** `backend/services/tts.js`
*   Thêm đầy đủ dấu phẩy `,`, chấm `.`, chấm than `!` vào các chuỗi kịch bản mẫu (`refText`) của các giọng clone (Anh Quý, Beatvn, Beatvn2, Duy Thanh) để khớp hoàn toàn với các điểm dừng tự nhiên trong file âm thanh.
*   Bổ sung tham số `--speed` (mặc định là `0.95` hoặc đọc từ biến môi trường `OMNIVOICE_SPEED`) khi gọi CLI `omnivoice-infer.exe` để làm chậm tốc độ đọc của OmniVoice lại một chút giúp nhịp nói thong thả hơn.

### B. Phân tách kịch bản gửi tới các bộ đọc TTS
**Tệp:** `backend/server.js`
*   Phân loại giọng đọc trước khi gọi `tts.generateTTS`:
    *   **OmniVoice clone:** Dùng `voiceoverTts` (có chứa âm vị tiếng Anh để máy đọc tiếng Anh đúng giọng clone).
    *   **ElevenLabs / Edge TTS:** Dùng `voiceover` kịch bản gốc tiếng Việt (chứa chữ tiếng Anh nguyên bản để Cloud Engine tự xử lý phát âm chuẩn nhất).

## 3. Kịch Bản Kiểm Tra (Verification Plan)
1.  **Kiểm tra build & chạy test backend:** Chạy `node backend/test_vde.js` và `npm run build` ở thư mục Remotion để đảm bảo không có lỗi biên dịch.
2.  **Thử nghiệm tạo tiếng nói:** Mở Storyboard Editor, chọn giọng đọc khác nhau và nhấn tạo lại kịch bản âm thanh, lắng nghe âm thanh đầu ra để xác nhận nhịp nghỉ tự nhiên.
