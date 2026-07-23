# Design Document: Studio AI Gen Performance & Gemini Rate Limit Fix

**Date:** 2026-07-23
**Status:** Approved

## Problem Statement
1. **High Latency per Scene (45s–170s per scene):** TTS generation, forced alignment (Python `execFile`), Gemini TSX code generation, and compilation were running strictly sequentially. A 6-scene video could take up to 10–15 minutes.
2. **Gemini API Rate Limit / 429 Errors:** Sequential requests without inter-scene delays, combined with multiple fallback models (3 models × 3 attempts = 9 retries), often hit Gemini rate limits or causes 503 service overload during scene code generation.

## Proposed Changes

### 1. Parallelize TTS & Gemini TSX Code Generation (`backend/services/aiGen.js`)
- In `generateSingleSceneCode`:
  - Execute `tts.generateTTS` and `generateTSXCodeForScene` concurrently via `Promise.all`.
  - Once TTS resolves, run `aligner.getWordTimestamps`.
  - Compile the generated TSX code.
- **Impact:** Cuts 15–30 seconds off per-scene generation time.

### 2. Rate Limit Protection & Fallback Optimization (`backend/services/aiGen.js`)
- Limit fallback models in `generateSingleSceneCode` to a single fallback (`gemini-1.5-flash`) instead of trying 3 different models repeatedly.
- Set retry count in `generateContentWithFallback` to 1 retry with exponential backoff (e.g. 2s) to prevent hammering the API when throttled.

### 3. Inter-Scene Delay in Frontend Loop (`frontend/src/components/StudioAIGen.jsx`)
- In `handleGenerate`, insert a 2.5-second delay (`await new Promise(r => setTimeout(r, 2500))`) between scene generation loop iterations.
- Provides breathing room for Gemini API rate limits between consecutive calls.

## Affected Files
- `backend/services/aiGen.js`
- `frontend/src/components/StudioAIGen.jsx`
- `docs/plans/2026-07-23-aigen-performance-and-rate-limit-fix-design.md`
