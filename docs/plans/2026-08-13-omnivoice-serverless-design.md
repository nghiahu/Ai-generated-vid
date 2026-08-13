# Thiết kế Kiến trúc: Di chuyển OmniVoice lên Cloud Serverless GPU

Tài liệu này mô tả thiết kế kiến trúc để di chuyển mô hình tạo giọng nói OmniVoice (offline local) lên dịch vụ **RunPod Serverless GPU**. Mục tiêu là giúp ứng dụng hoạt động mượt mà trên tất cả các máy khách cấu hình thấp bằng cách loại bỏ việc chạy cục bộ các thư viện AI nặng như PyTorch.

---

## 1. Tổng quan Kiến trúc

Hệ thống sẽ chuyển từ việc gọi file thực thi hoặc tiến trình Python chạy cục bộ (`omnivoice-infer.exe` / `infer.py`) sang việc thực hiện gọi API Online thông qua giao thức HTTPS.

```
+------------------+                   +--------------------+
|  Electron App    |                   | RunPod Serverless  |
|  (Máy khách yếu)  |                   | (RTX 4090 GPU)     |
|                  |                   |                    |
|  +------------+  |  HTTPS Request    |  +--------------+  |
|  |  Node.js   |==|==================>|  |  handler.py  |  |
|  |  Backend   |  |                   |  +--------------+  |
|  +------------+  |  HTTPS Response   |         ||         |
|        ||        |<==================|==[OmniVoice AI]    |
|  [Lưu file .wav] |                   |  +--------------+  |
+------------------+                   +--------------------+
```

---

## 2. Thiết kế Phía Server (Docker & RunPod Worker)

Chúng ta sẽ tạo một dự án độc lập để build Docker Image và triển khai trên RunPod Serverless.

### 2.1. File Xử lý Chính (`handler.py`)
Mã nguồn Python sử dụng SDK của RunPod để đăng ký worker và thực hiện sinh giọng nói từ mô hình OmniVoice được nạp sẵn trên GPU.

*   **Giọng mẫu được lưu cứng (Baked-in Reference Voices)**:
    *   `duythanh`: Lưu file `voice_duy_thanh.wav` kèm đoạn văn bản text mẫu.
    *   `quanganh`: Lưu file `voice_quang_anh.wav` kèm đoạn văn bản text mẫu.
*   **Hàm handler chính**:
    1. Trích xuất các tham số `text`, `voice` (giá trị: `"quanganh"` hoặc `"duythanh"`), và `speed` từ request.
    2. Ánh xạ tham số `voice` để lấy đúng file giọng mẫu và kịch bản tương ứng.
    3. Thực thi hàm sinh giọng `model.generate(...)` ghi ra file tạm `/tmp/output.wav`.
    4. Đọc file âm thanh `/tmp/output.wav`, chuyển hóa thành chuỗi Base64.
    5. Trả về cấu trúc JSON chứa `audio_base64`.

### 2.2. File Cấu hình Đóng Gói (`Dockerfile`)
Dockerfile thiết lập môi trường chạy GPU tối ưu, cài đặt các thư viện liên quan và tải sẵn (bake-in) model weights về container từ bước build để giảm thời gian Cold Start.

*   **Base Image**: `pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime` (đảm bảo đầy đủ CUDA cho GPU).
*   **Dependencies**: `pip install runpod omnivoice soundfile torchaudio`.
*   **Model Weights Pre-download**: Chạy script tải mô hình `k2-fsa/OmniVoice` trong bước build Docker.
*   **CMD**: `python -u handler.py`

---

## 3. Thiết kế Phía Máy khách (Electron Node.js Backend)

Chúng ta sẽ sửa đổi luồng xử lý giọng offline trong file [tts.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/tts.js).

### 3.1. Cấu hình biến môi trường (`backend/.env`)
Bổ sung cấu hình để Node.js Backend nhận diện Endpoint:
```bash
OMNIVOICE_CLOUD_API_URL=https://api.runpod.ai/v1/YOUR_ENDPOINT_ID/runsync
OMNIVOICE_CLOUD_API_KEY=rpa_YOUR_RUNPOD_API_KEY...
```

### 3.2. Cập nhật Logic trong [generateTTS](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/tts.js#L173)
*   **Kiểm tra điều kiện**: Nếu `voiceKey` bắt đầu bằng `omnivoice_` và có cấu hình `OMNIVOICE_CLOUD_API_URL` trong `.env`.
*   **Chuẩn hóa giọng đọc**:
    *   `omnivoice_quanganh` hoặc `omnivoice_quang_anh` $\rightarrow$ `"quanganh"`
    *   Các giọng omnivoice khác $\rightarrow$ `"duythanh"`
*   **Gọi HTTP POST**:
    *   **Endpoint**: `OMNIVOICE_CLOUD_API_URL`
    *   **Headers**: 
        *   `Content-Type: application/json`
        *   `Authorization: Bearer OMNIVOICE_CLOUD_API_KEY`
    *   **Body**:
        ```json
        {
          "input": {
            "text": "<văn bản cần đọc>",
            "voice": "quanganh" | "duythanh",
            "speed": 0.95
          }
        }
        ```
*   **Xử lý phản hồi (Response)**:
    *   Nhận kết quả JSON, kiểm tra trạng thái `COMPLETED`.
    *   Lấy `response.output.audio_base64` decode thành Buffer: `Buffer.from(audio_base64, 'base64')`.
    *   Ghi Buffer này đè vào file `wavOutputPath`.
*   **Fallback logic**: Nếu không có cấu hình `OMNIVOICE_CLOUD_API_URL`, hệ thống sẽ tự động chạy offline qua file thực thi cục bộ như trước.

---

## 4. Kế hoạch Kiểm thử & Xác minh

### 4.1. Kiểm thử Phía Server (Docker Local)
1. Build Docker Image ở local và chạy thử nghiệm bằng CPU để kiểm tra logic của `handler.py` hoạt động đúng.
2. Gửi request HTTP bằng `curl` hoặc Postman để kiểm tra xem server có nhận đúng tham số và trả về chuỗi Base64 hợp lệ hay không.

### 4.2. Kiểm thử Phía Client (Electron Integration)
1. Cấu hình Endpoint mock hoặc Endpoint thực tế từ RunPod vào file `.env`.
2. Chạy thử Backend ở local và nhấn nút "Tạo giọng nói" trên UI của Client.
3. Xác minh:
    *   File âm thanh WAV được tải về đầy đủ trong thư mục `backend/public/tts/`.
    *   Tiến trình xử lý hậu kỳ (cắt khoảng lặng, tăng âm) chạy thành công.
    *   Trình phát audio trên giao diện phát được âm thanh vừa tạo.
