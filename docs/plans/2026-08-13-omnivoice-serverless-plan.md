# OmniVoice Serverless GPU Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Package OmniVoice into a serverless Docker container for RunPod, and update the Electron Node.js backend to query this API for voice generation.

**Architecture:** A Python RunPod handler script is wrapped in a GPU-based Docker container. The Node.js backend is modified to perform HTTP POST requests to the RunPod API, decodes the base64 response into a WAV file, and falls back to local execution if the API credentials are not set.

**Tech Stack:** Docker, Python (RunPod Serverless SDK), Node.js (Fetch API), PyTorch.

---

## Proposed Tasks

### Task 1: Create the Serverless Python Worker (`handler.py`)

**Files:**
*   Create: `serverless-omnivoice/handler.py`

**Step 1: Write implementation**

Create a Python script that boots OmniVoice, registers the RunPod serverless handler, maps voices, and returns base64 audios.

```python
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
```

**Step 2: Commit**

```bash
git add serverless-omnivoice/handler.py
git commit -m "feat(serverless): add runpod python handler for omnivoice"
```

---

### Task 2: Create Dockerfile for Serverless Deployment

**Files:**
*   Create: `serverless-omnivoice/Dockerfile`

**Step 1: Write implementation**

Create a Dockerfile based on PyTorch CUDA runtime, install all required pip packages, pre-download weights, and package the code.

```dockerfile
# Base image with CUDA 12.1 and PyTorch
FROM pytorch/pytorch:2.2.1-cuda12.1-cudnn8-runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV HF_ENDPOINT=https://hf-mirror.com

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python requirements
RUN pip install --no-cache-dir \
    runpod \
    soundfile \
    torchaudio \
    omnivoice

# Pre-download the model weights during Docker build to eliminate cold start downloads
RUN python -c "from omnivoice.models.omnivoice import OmniVoice; OmniVoice.from_pretrained('k2-fsa/OmniVoice')"

# Create directory structure for voice assets
RUN mkdir -p mp3/duy_thanh_nguyen mp3/quang_anh

# Copy reference audio files (Must be placed in context during Docker build, or mapped)
# We will copy them from the project tree when building the Docker image
COPY mp3/duy_thanh_nguyen/voice_duy_thanh.wav mp3/duy_thanh_nguyen/
COPY mp3/quang_anh/voice_quang_anh.wav mp3/quang_anh/

# Copy handler
COPY serverless-omnivoice/handler.py .

CMD [ "python", "-u", "/app/handler.py" ]
```

**Step 2: Commit**

```bash
git add serverless-omnivoice/Dockerfile
git commit -m "feat(serverless): add Dockerfile with CUDA runtime and pre-loaded weights"
```

---

### Task 3: Integrate Node.js Backend with Cloud API

**Files:**
*   Modify: `backend/services/tts.js`

**Step 1: Write implementation**

Update `backend/services/tts.js` at line 195. If cloud API variables are present, redirect request to RunPod serverless.

Target Content (to replace):
```javascript
  // ─── Off-line OmniVoice Path ───
  if (effectiveVoice.toLowerCase().startsWith("omnivoice_")) {
    let omnivoiceExe = process.env.OMNIVOICE_INFER_PATH;
    
    // Auto-detect and prefer the bundled offline runtime if it exists
    const defaultBundledPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'Python311', 'Scripts', 'omnivoice-infer.exe');
    const alternativeBundledPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'Scripts', 'omnivoice-infer.exe');
    
    if (fs.existsSync(defaultBundledPath)) {
      omnivoiceExe = defaultBundledPath;
    } else if (fs.existsSync(alternativeBundledPath)) {
      omnivoiceExe = alternativeBundledPath;
    }

    if (!omnivoiceExe || !fs.existsSync(omnivoiceExe)) {
      throw new Error(`Chưa cài đặt OmniVoice hoặc cấu hình sai đường dẫn OMNIVOICE_INFER_PATH trong Settings. File không tìm thấy: "${omnivoiceExe || 'trống'}"`);
    }
```

Replacement Content:
```javascript
  // ─── Off-line/Online Cloud OmniVoice Path ───
  if (effectiveVoice.toLowerCase().startsWith("omnivoice_")) {
    const cloudApiUrl = process.env.OMNIVOICE_CLOUD_API_URL;
    const cloudApiKey = process.env.OMNIVOICE_CLOUD_API_KEY;
    const cleanText = normalizeTextForTTS(text);
    const wavFileName = `tts_${projectId}_${sceneId}_${version}.wav`;
    const wavOutputPath = path.join(outputDir, wavFileName);
    const speed = parseFloat(process.env.OMNIVOICE_SPEED) || 0.95;

    // --- CASE A: Cloud Serverless Path ---
    if (cloudApiUrl && cloudApiKey) {
      console.log(`[TTS] Routing OmniVoice request to RunPod Cloud API for scene ${sceneId}...`);
      let voiceId = "duythanh";
      if (effectiveVoice.toLowerCase() === "omnivoice_quanganh" || effectiveVoice.toLowerCase() === "omnivoice_quang_anh") {
        voiceId = "quanganh";
      }

      try {
        const response = await fetch(cloudApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cloudApiKey}`
          },
          body: JSON.stringify({
            input: {
              text: cleanText,
              voice: voiceId,
              speed: speed
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`RunPod API request failed: status ${response.status} - ${errText}`);
        }

        const body = await response.json();
        if (body.status === "FAILED") {
          throw new Error(`RunPod generation job failed: ${body.error || JSON.stringify(body)}`);
        }

        const audioBase64 = body.output?.audio_base64;
        if (!audioBase64) {
          throw new Error(`RunPod did not return audio_base64. Response: ${JSON.stringify(body)}`);
        }

        // Decode and write to output path
        fs.writeFileSync(wavOutputPath, Buffer.from(audioBase64, 'base64'));
        
        // Postprocessing
        addSilentPadding(wavOutputPath);
        const duration = getAudioDuration(wavOutputPath);
        return { url: `/tts/${wavFileName}`, duration };

      } catch (err) {
        console.error(`[TTS] Cloud OmniVoice failed: ${err.message}. Falling back to local execution checks...`);
        // Fall through to local implementation if cloud fails
      }
    }

    // --- CASE B: Local Fallback Path ---
    let omnivoiceExe = process.env.OMNIVOICE_INFER_PATH;
    
    // Auto-detect and prefer the bundled offline runtime if it exists
    const defaultBundledPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'Python311', 'Scripts', 'omnivoice-infer.exe');
    const alternativeBundledPath = path.join(process.env.SystemDrive || 'C:', 'Users', 'Public', 'ai-video-app-runtime', 'Scripts', 'omnivoice-infer.exe');
    
    if (fs.existsSync(defaultBundledPath)) {
      omnivoiceExe = defaultBundledPath;
    } else if (fs.existsSync(alternativeBundledPath)) {
      omnivoiceExe = alternativeBundledPath;
    }

    if (!omnivoiceExe || !fs.existsSync(omnivoiceExe)) {
      throw new Error(`Chưa cài đặt OmniVoice hoặc cấu hình sai đường dẫn OMNIVOICE_INFER_PATH trong Settings. File không tìm thấy: "${omnivoiceExe || 'trống'}"`);
    }
```

**Step 2: Commit**

```bash
git add backend/services/tts.js
git commit -m "feat(tts): integrate RunPod Cloud API for OmniVoice generation with local fallback"
```

---

### Task 4: Add Unit Tests for Cloud TTS Integration

**Files:**
*   Create: `backend/tests/cloudTts.test.js`

**Step 1: Write failing test / mock response test**

Create a test using Node.js built-in runner `node:test` that intercepts `fetch` or mocks the configuration, ensuring that the cloud routing and decoding are functional.

```javascript
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { generateTTS } = require('../services/tts');

test('Cloud OmniVoice TTS generation mock-test', async (t) => {
  // Save current env variables
  const originalUrl = process.env.OMNIVOICE_CLOUD_API_URL;
  const originalKey = process.env.OMNIVOICE_CLOUD_API_KEY;

  // Setup mock server variables
  process.env.OMNIVOICE_CLOUD_API_URL = 'http://localhost:9999/runsync';
  process.env.OMNIVOICE_CLOUD_API_KEY = 'mock_key';

  // Mock global fetch
  const mockAudioBase64 = Buffer.from('RIFF....mock_audio_data....').toString('base64');
  
  global.fetch = async (url, options) => {
    assert.strictEqual(url, 'http://localhost:9999/runsync');
    assert.strictEqual(options.headers['Authorization'], 'Bearer mock_key');
    
    return {
      ok: true,
      json: async () => ({
        status: "COMPLETED",
        output: {
          audio_base64: mockAudioBase64
        }
      })
    };
  };

  try {
    // Generate mock TTS
    const result = await generateTTS('Test cloud tts', 'proj_test', 'scene_test', 'omnivoice_quanganh');
    
    assert.ok(result.url.startsWith('/tts/'));
    const absoluteWavPath = path.join(__dirname, '../public', result.url);
    
    assert.ok(fs.existsSync(absoluteWavPath), 'WAV file should be successfully created');
    
    // Clean up created mock file
    if (fs.existsSync(absoluteWavPath)) {
      fs.unlinkSync(absoluteWavPath);
    }
  } finally {
    // Restore env variables
    process.env.OMNIVOICE_CLOUD_API_URL = originalUrl;
    process.env.OMNIVOICE_CLOUD_API_KEY = originalKey;
    delete global.fetch;
  }
});
```

**Step 2: Run tests to verify it passes**

Run: `node --test backend/tests/cloudTts.test.js`
Expected output:
```
✔ Cloud OmniVoice TTS generation mock-test
tests 1
pass 1
fail 0
```

**Step 3: Commit**

```bash
git add backend/tests/cloudTts.test.js
git commit -m "test(tts): add unit test for cloud omnivoice integration"
```

---

### Task 5: Document and update .env configuration template

**Files:**
*   Modify: `backend/.env`

**Step 1: Write configuration keys**
Add comments and commented configurations for RunPod serverless in the `.env` file of the backend.

```bash
# =========================================================================
# OMNIVOICE CLOUD CONFIGURATION (RunPod Serverless)
# =========================================================================
# OMNIVOICE_CLOUD_API_URL=https://api.runpod.ai/v1/YOUR_ENDPOINT_ID/runsync
# OMNIVOICE_CLOUD_API_KEY=rpa_YOUR_RUNPOD_API_KEY...
```

**Step 2: Commit**

```bash
git add backend/.env
git commit -m "docs: add cloud omnivoice configuration variables to .env template"
```
