# Design Document: AI Prompt JSON Schema Standardization
**Date**: 2026-07-07  
**Topic**: Repair and standardize the JSON Schema block types declaration in Gemini system prompt

## 1. Goal Description
The purpose of this update is to resolve an issue where Gemini completely ignores the `"type"` field for generated storyboard scene points. This is caused by invalid JSON formatting (`"type": "text" | "terminal" | ...` Union type syntax) inside the JSON Schema example template. The model drops this field to conform to standard JSON outputs. We will standardize this into valid JSON comments.

---

## 2. Proposed Changes

### A. System Prompt Schema Standardization (`backend/services/ai.js`)
Update the JSON Schema structure example inside the `generateStoryboard` system prompt:
- Replace the invalid union types (`"type": "text" | "terminal" | ...`) with a standard JSON string value and a descriptive comment.
- Do the same for the `"animation"` field union type.
- Ensure all optional properties are properly documented.

---

## 3. Verification Plan
- **Syntax check**: Verify compilation via `node -c services/ai.js`.
- **E2E Test**: Request Gemini to generate a storyboard (e.g. for a mock script) and verify that the generated points array elements contain the correct `"type"` property (e.g., `"subheader"`, `"logo_row"`, `"button"`, `"feature_card"`).
