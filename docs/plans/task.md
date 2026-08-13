| Task | Status | Description |
| --- | --- | --- |
| Task 1: Create the Serverless Python Worker (`handler.py`) | [x] | Create python code for RunPod native handler that runs OmniVoice inference |
| Task 2: Create Dockerfile for Serverless Deployment | [x] | Create Dockerfile with PyTorch CUDA runtime, pip packages, pre-loaded weights, and handler copy |
| Task 3: Integrate Node.js Backend with Cloud API | [x] | Update backend/services/tts.js to perform HTTP fetch requests to RunPod and decode base64 audio |
| Task 4: Add Unit Tests for Cloud TTS Integration | [x] | Write backend/tests/cloudTts.test.js and run verification tests using node:test |
| Task 5: Document and update .env configuration template | [x] | Update backend/.env with OMNIVOICE_CLOUD_* variables template |
