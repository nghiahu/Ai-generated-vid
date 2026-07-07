# Design Document: BeatVN Voice Refinements & Pronunciation Adjustments
**Date**: 2026-07-07  
**Topic**: Change BeatVN cloner gender to female & add acronym normalizations

## 1. Goal Description
The purpose of this update is to fix the zero-shot voice cloner configuration for `omnivoice_beatvn` (V1) and `omnivoice_beatvn2` (V2) to use a female target model, which matches their reference audio gender. In addition, we will introduce text normalization rules in the TTS service to pronounce tech acronyms like "IT" and "CRUD" cleanly in Vietnamese.

---

## 2. Proposed Changes

### A. TTS Service Gender Configuration (`backend/services/tts.js`)
- Exclude `isBeatvn` and `isBeatvn2` keys from the `isMale = true` check.
- Update `instruct` resolution so that `omnivoice_beatvn` and `omnivoice_beatvn2` use the `"female"` cloner model instruction.

### B. Text Normalization Rules (`backend/services/tts.js`)
Update the `normalizeTextForTTS` method to clean up English tech acronyms before passing them to the acoustic tokenizer:
- Map word boundary `\bit\b` to `"ây-ti"`.
- Map word boundary `\bcrud\b` to `"cờ-rút"`.

---

## 3. Verification Plan
- **Syntax check**: Verify compilation via `node -c services/tts.js`.
- **Unit/Scratch Test**: Run the test TTS generation script (`node scratch/test_tts_beatvn2.js`) with sample text containing "IT" and "CRUD", and verify generated speech quality and acoustic fidelity.
