# Design Document: Tối ưu hóa phát âm thuật ngữ công nghệ và giảm ngắt quãng trong TTS

* **Ngày tạo:** 2026-07-27
* **Trạng thái:** Đã được người dùng phê duyệt
* **Chủ đề:** Tối ưu hóa phát âm tiếng Anh và chất lượng đọc (TTS) của giọng đọc Duy Thanh (OmniVoice).

---

## 1. Vấn đề hiện tại
1. **Từ "prompt" bị phát âm thành "bờ róm":**
   * Định nghĩa `'prompt': "bờ-rom"` trong `TECH_TERMS_TRANSLITERATION` bị sai âm đầu ("b" thay vì "p").
   * Quá trình chuẩn hóa chuỗi thay thế dấu gạch ngang bằng khoảng trắng khiến `"bờ-rom"` thành `"bờ rom"`. Do từ `"rom"` không phải là âm tiết tiếng Việt chuẩn, mô hình OmniVoice tự động thêm dấu sắc thành `"róm"`.
2. **Giọng đọc ngập ngừng ngắt quãng (Stuttering):**
   * Các thuật ngữ dài được phiên âm thành quá nhiều âm tiết đơn lẻ (ví dụ: `javascript` -> `gia-va-sờ-cờ-ríp` -> `gia va sờ cờ ríp`).
   * Việc tách nhỏ các chữ cái thành các từ đơn khiến mô hình TTS cố gắng nhấn trọng âm và tạo nhịp nghỉ (micro-pauses) giữa các từ đơn này, gây ra cảm giác ngắc ngớ, không tự nhiên.

---

## 2. Giải pháp kỹ thuật (Hybrid Approach)

### Hướng đi chính:
* **Đọc tiếng Anh trực tiếp (Whitelisting):** OmniVoice là mô hình TTS hiện đại, hỗ trợ đọc các từ tiếng Anh thông dụng (như *prompt*, *react*, *javascript*, *api*, *vite*, *github*...) cực kỳ tốt dưới dạng 1 từ duy nhất. Ta sẽ loại bỏ các từ này khỏi bộ từ điển phiên âm tĩnh để máy tự xử lý trực tiếp.
* **Sửa đổi bộ từ điển tĩnh (Static Dict Clean-up):** Sửa các từ phiên âm sai phụ âm đầu (B -> P) đối với các thuật ngữ bắt buộc phải phiên âm (như *open* -> *âu-pơn*, *paper* -> *pây-pơ*).
* **Đơn giản hóa âm tiết:** Loại bỏ các tổ hợp âm tiết cồng kềnh (như `sờ cờ`) để tránh gây giật cục.

---

## 3. Thay đổi chi tiết trong Codebase

### 3.1. Dọn dẹp từ điển tĩnh trong [phoneme.js](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated%20vid-hyperframe/backend/services/phoneme.js)

Chúng ta sẽ loại bỏ các từ khóa sau khỏi `TECH_TERMS_TRANSLITERATION` để hệ thống giữ nguyên tiếng Anh cho OmniVoice tự phát âm:
* `'prompt'`
* `'react'`
* `'javascript'`
* `'typescript'`
* `'api'`
* `'vite'`
* `'nextjs'`, `'next.js'`
* `'nodejs'`, `'node.js'`
* `'css'`, `'html'`
* `'npm'`, `'json'`, `'sql'`, `'cli'`
* `'git'`, `'github'`
* `'vercel'`
* `'brand'`
* `'client'`, `'server'`
* `'app'`, `'dev'`, `'build'`, `'deploy'`
* `'code'`, `'database'`
* `'ai'`, `'AI'`, `'Ai'`
* `'gpt'`, `'chatgpt'`, `'gpt-4'`, `'gpt-3'`, `'gpt4'`, `'gpt3'`
* `'ui'`, `'ux'`

Chúng ta cũng sẽ cập nhật phiên âm cho các từ còn lại để chuẩn hóa phụ âm đầu "P":
* `'open'`: `'âu-bần'` -> `'âu-pơn'`
* `'paper'`: `'bây-bờ'` -> `'pây-pơ'`

### 3.2. Cập nhật `TECH_TERMS_WHITELIST`
Đồng bộ các từ khóa trên vào danh sách `TECH_TERMS_WHITELIST` trong `phoneme.js` để đảm bảo chúng không bị bộ dịch G2P động bằng Gemini can thiệp chuyển thành phiên âm tiếng Việt.

### 3.3. Bỏ qua tra cứu Cache DB cho Whitelist
* Trong hàm `getPhonemesForTerms` của `phoneme.js`, thêm bước kiểm tra Whitelist đầu tiên để nếu từ nằm trong `TECH_TERMS_WHITELIST`, hệ thống sẽ lập tức bỏ qua tra cứu Cache DB và từ điển. Điều này đảm bảo Whitelist luôn thắng.

### 3.4. Dọn dẹp Cache DB
* Viết và chạy một script dọn dẹp cơ sở dữ liệu để xóa toàn bộ bản ghi của các từ nằm trong Whitelist khỏi bảng `phoneme_cache`.

---

## 4. Kế hoạch xác minh (Verification Plan)
Sau khi thực hiện thay đổi, chúng ta sẽ chạy kịch bản thử nghiệm TTS để xác minh:
1. Từ `"prompt"` phải được đọc trực tiếp và phát âm chuẩn tiếng Anh (không có âm "bờ róm" ngay cả khi chạy thực tế trên ứng dụng có kết nối database).
2. Từ `"javascript"` và `"typescript"` phải được đọc nhanh, liền mạch không bị ngắt quãng đánh vần từng chữ.
3. Chạy script kiểm thử kết nối DB thực tế để xác nhận các bản ghi cũ của whitelist đã được dọn sạch.
4. Không có lỗi biên dịch hay lỗi chạy runtime nào xảy ra trên server backend.
