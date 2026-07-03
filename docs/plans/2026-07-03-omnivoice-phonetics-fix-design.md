# Design: Fix OmniVoice Crash — Phonetic Vietnamese in Voiceover Text

## Background

When generating storyboards with the "Giọng Anh Quý" (omnivoice_anhquy) voice, OmniVoice crashes
immediately after loading the ASR model. The root cause is that Gemini generates phonetically-translated
Vietnamese in the `voiceover` field (e.g., "HTML" → "Hát Tê Em Lờ"), which breaks OmniVoice's tokenizer.

## Root Cause (Confirmed from error.log)

The Gemini AI prompt does NOT instruct the model to preserve technical English terms in the voiceover text.
As a result, Gemini phonetically translates terms like:
- HTML → "Hát Tê Em Lờ"  
- CSS → "Xê Ét Ét"
- JavaScript → "Gia va sờ cờ ríp"
- MP4 → "Em Pê Bốn"

OmniVoice's tokenizer cannot process this kind of input and crashes after loading its ASR model, leaving
no output file. The backend throws an error, and since this happens inside the `generate-storyboard`
endpoint (which also called Gemini already), repeated attempts exhaust the Gemini free-tier quota → 429.

## Proposed Fix

### Change 1: `backend/services/ai.js` — Update Gemini Prompt

Add an explicit instruction to the Gemini prompt:
> In the `voiceover` field: keep ALL technical terms (HTML, CSS, JavaScript, React, API, npm, MP4, etc.)
> in their ORIGINAL English form. NEVER phonetically translate them into Vietnamese pronunciation.

### Change 2: `backend/services/tts.js` — Update `normalizeTextForTTS()`

Add a reverse-mapping safety net to catch and correct any phonetic translations that might still appear:
- "hát tê em lờ" → "html"
- "xê ét ét" → "css"
- "gia va sờ cờ ríp" → "javascript"
- "em pê bốn" / "em pê 4" → "mp4"
- "ri ắc" → "react"
- "nốt đề ếch es" → "node.js"
- "nếch t chấm gi ét" → "next.js"

This is a defensive layer — if Gemini slips through the prompt fix, the normalizer catches it before
sending to OmniVoice.

## Success Criteria

1. No OmniVoice crashes when generating storyboards with voiceover text containing technical terms.
2. Technical terms are spoken naturally (e.g., OmniVoice reads "html" fluently in lowercase, as originally designed).
3. No more Gemini 429 errors caused by repeated failed storyboard generation attempts.

## Files Changed

- `backend/services/ai.js` — Update Gemini prompt
- `backend/services/tts.js` — Update `normalizeTextForTTS()`
