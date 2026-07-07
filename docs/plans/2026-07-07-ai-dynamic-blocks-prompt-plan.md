# Implementation Plan: AI Prompt JSON Schema Standardization

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the JSON Schema structure example inside the `generateStoryboard` system prompt in `backend/services/ai.js` to ensure the `"type"` field is parsed and returned correctly by Gemini.

---

### Task 1: Standardize JSON Schema points declaration in ai.js

**Files:**
- Modify: `backend/services/ai.js:50-65`

**Step 1: Replace union pipes with valid JSON string representations**
Modify the JSON schema template in `ai.js` so it uses standard JSON syntax with comments rather than TypeScript union type symbols.

```javascript
          "heading": "Scene title/heading in Vietnamese",
          "points": [
            {
              "type": "text", // Required type. Allowed values: "text", "terminal", "metric", "logo_row", "badge_row", "button", "subheader"
              "text": "The main text content, or terminal command, or button label, or subheader label. Keep it simple and descriptive in Vietnamese.",
              "animation": "slide-up", // Required animation. Allowed values: "slide-up", "scale-in", "fade-in", "blur-in", "slide-left", "slide-right"
              "delay": 0.5, // Estimated offset in seconds from the start of this scene (number, e.g. 1.8) indicating when the voice speaks this point. Delays should be spaced out (e.g., 0.5, 2.0, 3.5) and strictly less than the scene duration. Ensure the first point starts around 0.5s.
              "logos": ["claude"], // Optional array of strings (ONLY for "logo_row" type). Allowed: "claude", "remotion", "youtube", "tiktok", "react", "nodejs", "python", "aws", "gemini", "openai"
              "badges": ["Mẹo"], // Optional array of strings (ONLY for "badge_row" type)
              "value": "+85%", // Optional string (ONLY for "metric" type)
              "subtext": "tăng tốc" // Optional string (ONLY for "metric" type)
            }
          ],
```

---

### Task 2: Verification & E2E Testing

**Step 1: Syntax check**
Run `node -c services/ai.js` inside `backend`.

**Step 2: Generate mock storyboard**
Run a test to ensure Gemini outputs the `"type"` field successfully.
Create a test script `scratch/test_ai_storyboard.js` calling `generateStoryboard` and logging the returned points to verify `"type"` is populated.
