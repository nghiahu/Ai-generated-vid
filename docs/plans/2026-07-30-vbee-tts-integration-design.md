# Design Document: Vbee Text-to-Speech (TTS) Integration

This document outlines the architecture and implementation details for integrating Vbee TTS into the video generation platform, utilizing the `VBEE_API_KEY` and `VBEE_APP_ID` stored in the environment configuration.

## Overview
Vbee is a premium Vietnamese Text-to-Speech provider. The current voice synthesis engine is configured only for local OmniVoice offline TTS. This design integrates the Vbee API as a cloud-based TTS engine fallback/option, allowing the user to select high-quality Vietnamese voices (Ngọc Huyền, Mạnh Dũng, Thu Trang, Minh Hoàng, Nam An) in Northern and Southern accents.

## Proposed Changes

### 1. Backend Service (`backend/services/tts.js`)
We will modify the `generateTTS` function to detect the `vbee_` prefix in `voiceKey` and direct the synthesis process to Vbee API:
- **API Endpoint:** `https://vbee.vn/api/v1/tts`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
  - `Authorization: Bearer <VBEE_API_KEY>`
  - `x-app-id: <VBEE_APP_ID>`
- **Request Body:**
  ```json
  {
    "app_id": "VBEE_APP_ID",
    "input_text": "text content",
    "voice_code": "voice_code_mapping",
    "callback_url": "https://example.com/callback"
  }
  ```
- **Job Status Polling:**
  - Endpoint: `GET https://vbee.vn/api/v1/tts/{requestId}`
  - Interval: 1.5 seconds (max 30 attempts).
  - Success criteria: `status === "SUCCESS"`.
  - Action: Fetch/download the audio file from `result.audio_link` and save it to the local public directory.

### 2. Backend Adapter (`backend/services/aiGen.js`)
- Update scene code generator helper: do not prepend `omnivoice_` prefix if `voiceKey` already starts with `vbee_`.

### 3. Frontend Component (`frontend/src/components/StudioAIGen.jsx`)
- Map options inside setup voice dropdown and regenerate scene voice dropdown to support Vbee voices:
  - `vbee_ngochuyen` -> Ngọc Huyền (Nữ Bắc)
  - `vbee_manhdung` -> Mạnh Dũng (Nam Bắc)
  - `vbee_thutrang` -> Thu Trang (Nữ Bắc)
  - `vbee_minhhoang` -> Minh Hoàng (Nữ Nam)
  - `vbee_naman` -> Nam An (Nam Nam)

## Verification Plan
- Expose a simple scratch script to verify the end-to-end generation process.
- Perform visual/auditory validation on the React frontend to confirm that Vbee voice can be selected, processed, and plays correctly inside the video scenes.
