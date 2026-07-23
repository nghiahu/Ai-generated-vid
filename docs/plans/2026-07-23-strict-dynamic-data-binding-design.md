# Design Document: Strict Dynamic Data Binding & Hardcode Elimination

## Overview
Eliminates hardcoded example texts (such as "NEXT-GEN INFRASTRUCTURE", "Engineered for Scale", "AES-256", "GraphQL", etc.) from Gemini-generated scene TSX code, enforcing 100% dynamic data binding from the user's actual script and scene payload.

## Problem Statement
The system instruction included `design-reference.md` containing literal example text ("NEXT-GEN INFRASTRUCTURE", "Engineered for Scale", "900tr", "88%", etc.). Gemini copied these literal string examples into generated TSX code instead of reading dynamic values from `scene.heading`, `scene.points`, and `scene.voiceover`.

## Solution Architecture
1. **Strict Data Binding Rule (`backend/services/aiGen.js`)**:
   - Add a high-priority prompt directive prohibiting the use of any literal strings from reference examples.
   - Mandate reading all rendered titles, bullet cards, statistics, labels, and subtitles strictly from `scene.heading`, `scene.points`, and `scene.voiceover`.
2. **Standardize Design Reference Snippets (`docs/studio-ai-gen/design-reference.md`)**:
   - Replace literal example text in TSX code blocks with placeholder variables (e.g. `{scene.heading}`, `{point.title}`, `{point.value}`, `{scene.voiceover}`).
3. **Backend Auto-Backfill (`backend/services/aiGen.js`)**:
   - Verify `scene.points` before calling Gemini. If empty or missing, extract key clauses from `scene.voiceover` so `scene.points` always contains valid dynamic text.

## Verification Strategy
- Verify prompt construction in `aiGen.js`.
- Test TSX code generation to ensure 100% of rendered text matches input scene script.
