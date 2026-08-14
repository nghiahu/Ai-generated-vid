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
    soundfile

# Uninstall torchvision to prevent transformers import check crash (we don't need vision models)
# Install compatible torchaudio with CUDA 12.1 support
RUN pip uninstall -y torchvision \
    && pip install --no-cache-dir \
    torchaudio==2.2.1+cu121 \
    --extra-index-url https://download.pytorch.org/whl/cu121

# Install omnivoice and other dependencies
RUN pip install --no-cache-dir \
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
