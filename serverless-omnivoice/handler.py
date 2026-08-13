import os
import runpod
import torch
import soundfile as sf
import base64
import logging
from omnivoice.models.omnivoice import OmniVoice

# Initialize logging
logging.basicConfig(level=logging.INFO)

# Global variables for caching model
model = None

# Local paths for baked-in voices
VOICE_MAP = {
    "duythanh": {
        "audio": "mp3/duy_thanh_nguyen/voice_duy_thanh.wav",
        "text": "Khoảng một hai năm trở lại đây, một ngày mình thức dậy là hàng tá những nội dung về AI đập vào mắt. Bỗng dưng từ đâu xuất hiện rất nhiều chuyên gia, am hiểu tường tận mọi lĩnh vực, cái gì cũng phân tích được. Rồi nhiều khóa học xuất hiện hơn, nhiều video xuất hiện hơn, dạy về cách sử dụng, cách tối ưu hóa AI, mà mình thấy tần xuất nó ngày càng dày đặc hơn."
    },
    "quanganh": {
        "audio": "mp3/quang_anh/voice_quang_anh.wav",
        "text": "Năm nay thế giới chi khoảng hai nghìn năm trăm chín mươi tỷ đô cho AI con số này lớn hơn GDP của phần lớn quốc gia trên thế giới nhưng phần thú vị nằm ở chỗ số tiền đó đang kẹt vài con số cho thấy AI không còn là chuyện tương lai chat GPT giờ có chín trăm triệu người dùng mỗi tuần"
    }
}

def load_model():
    global model
    if model is None:
        logging.info("Loading OmniVoice model onto CUDA...")
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model_dtype = torch.float32 if device == "cpu" else torch.float16
        model = OmniVoice.from_pretrained(
            "k2-fsa/OmniVoice", device_map=device, dtype=model_dtype
        )
    return model

def handler(event):
    try:
        # Extract inputs
        job_input = event.get("input", {})
        text = job_input.get("text", "")
        voice = job_input.get("voice", "duythanh").lower()
        speed = float(job_input.get("speed", 0.95))
        
        if not text:
            return {"error": "Missing required field 'text'"}

        model = load_model()
        
        # Determine voice settings
        voice_info = VOICE_MAP.get(voice, VOICE_MAP["duythanh"])
        ref_audio = voice_info["audio"]
        ref_text = voice_info["text"]
        
        logging.info(f"Generating audio for: {text[:50]}... using voice: {voice}")
        
        # Generate audios
        audios = model.generate(
            text=text,
            language="Vietnamese",
            ref_audio=ref_audio,
            ref_text=ref_text,
            speed=speed,
            num_step=32,
            guidance_scale=2.0
        )
        
        # Save output to a temp file
        temp_output = "/tmp/output.wav"
        sf.write(temp_output, audios[0], model.sampling_rate)
        
        # Encode file to Base64
        with open(temp_output, "rb") as f:
            audio_base64 = base64.b64encode(f.read()).decode("utf-8")
            
        # Clean up temp file
        if os.path.exists(temp_output):
            os.remove(temp_output)
            
        return {"audio_base64": audio_base64}
        
    except Exception as e:
        logging.error(f"Error during generation: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    load_model() # Pre-load during runtime startup
    runpod.serverless.start({"handler": handler})
