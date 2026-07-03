# OmniVoice Phonetics Crash Fix — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix OmniVoice crashes caused by Gemini generating phonetically-translated Vietnamese for technical terms (e.g., "HTML" → "Hát Tê Em Lờ") in voiceover text.

**Architecture:** Two-layer fix — (1) update Gemini prompt to forbid phonetic translation of technical terms, (2) add a safety-net reverse-map in `normalizeTextForTTS()` to catch any slippage before reaching OmniVoice.

**Tech Stack:** Node.js/Express backend, Gemini 2.5 Flash API, OmniVoice local CLI.

---

## Task 1: Update Gemini Prompt in `backend/services/ai.js`

**Files:**
- Modify: `backend/services/ai.js`

**Step 1: Locate the voiceover instruction in the prompt**

In [`backend/services/ai.js`](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated%20vid-hyperframe/backend/services/ai.js), find the line:
```
"voiceover": "The subset of the script text read in this scene, in Vietnamese",
```

**Step 2: Add a hard rule to keep technical terms in English**

Replace the `voiceover` description with:
```
"voiceover": "The subset of the script text read aloud in this scene, in Vietnamese. CRITICAL RULE: Keep ALL technical terms (HTML, CSS, JavaScript, React, Node.js, Next.js, API, MP4, npm, etc.) in their ORIGINAL ENGLISH LOWERCASE form (e.g., 'html', 'css', 'javascript'). NEVER phonetically translate them into Vietnamese pronunciation (e.g., NEVER write 'Hát Tê Em Lờ' for HTML).",
```

Also add a global instruction before the layout guide section:
```
IMPORTANT VOICEOVER RULE: Technical/English terms in voiceover MUST stay as lowercase English (e.g., "html", "css", "javascript", "react", "api", "mp4"). Never spell them out phonetically in Vietnamese.
```

**Step 3: Verify prompt looks correct**

Review the full prompt string to ensure the rule is clearly placed and won't be ignored.

**Step 4: Commit**

```bash
git add backend/services/ai.js
git commit -m "fix: instruct Gemini to preserve English tech terms in voiceover"
```

---

## Task 2: Add Safety-Net Reverse-Map to `normalizeTextForTTS()`

**Files:**
- Modify: `backend/services/tts.js`

**Step 1: Identify insertion point**

In [`backend/services/tts.js`](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated%20vid-hyperframe/backend/services/tts.js), locate the `normalizeTextForTTS()` function. After the existing `.replace()` chain for abbreviations (AI, API, UI, UX, URL), add a new block labeled "Phonetic reverse-map safety net".

**Step 2: Add reverse-map replacements**

After the existing replacement chain and BEFORE the final `.toLowerCase()` call, add:

```javascript
// Safety net: reverse-map common phonetic Vietnamese back to lowercase English
// These are patterns that Gemini sometimes generates despite prompt instructions
.replace(/hát tê em lờ/gi, "html")
.replace(/xê ét ét/gi, "css")
.replace(/gia va sờ cờ ríp/gi, "javascript")
.replace(/gia va xờ cờ ríp/gi, "javascript")
.replace(/ri ắc/gi, "react")
.replace(/nốt đề ếch es/gi, "node.js")
.replace(/nốt đề ếch ét/gi, "node.js")
.replace(/nếch t chấm gi ét/gi, "next.js")
.replace(/em pê bốn/gi, "mp4")
.replace(/em pê 4/gi, "mp4")
.replace(/em pê ba/gi, "mp3")
.replace(/em pê 3/gi, "mp3")
.replace(/đây ti vi/gi, "tv")
.replace(/ét qu i/gi, "sql")
```

**Step 3: Verify the function structure is intact**

The final function should look like:
```javascript
function normalizeTextForTTS(text) {
  if (!text) return text;
  
  let normalized = text
    // Original abbreviation replacements
    .replace(/\bAI\b/g, "A I")
    .replace(/\bai\b/g, "a i")
    // ... other existing replacements ...
    
    // Safety net: reverse-map phonetic Vietnamese → English
    .replace(/hát tê em lờ/gi, "html")
    .replace(/xê ét ét/gi, "css")
    .replace(/gia va sờ cờ ríp/gi, "javascript")
    .replace(/gia va xờ cờ ríp/gi, "javascript")
    .replace(/ri ắc/gi, "react")
    .replace(/nốt đề ếch es/gi, "node.js")
    .replace(/nốt đề ếch ét/gi, "node.js")
    .replace(/nếch t chấm gi ét/gi, "next.js")
    .replace(/em pê bốn/gi, "mp4")
    .replace(/em pê 4/gi, "mp4")
    .replace(/em pê ba/gi, "mp3")
    .replace(/em pê 3/gi, "mp3")
    .replace(/ét qu i/gi, "sql");
  
  return normalized.toLowerCase();
}
```

**Step 4: Commit**

```bash
git add backend/services/tts.js
git commit -m "fix: add phonetic Vietnamese reverse-map safety net in normalizeTextForTTS"
```

---

## Task 3: Verify Fix Works End-to-End

**Step 1: Restart backend server**

```bash
# Stop the current running backend (Ctrl+C in its terminal), then:
cd backend
npm run dev
```

**Step 2: Test with OmniVoice Giọng Anh Quý**

In the frontend UI:
1. Select voice "OmniVoice - Giọng Anh Quý (Offline Clone)"
2. Enter a script containing technical terms like: "HTML, CSS, và JavaScript là nền tảng của web"
3. Click "Tạo Storyboard bằng AI"
4. Verify no crash, no 429 error

**Step 3: Check error.log for new entries**

```bash
# In backend directory
Get-Content error.log -Tail 30
```

Expected: No new OmniVoice crash entries after the test.

**Step 4: Commit task.md update**

```bash
git add docs/plans/task.md
git commit -m "chore: mark OmniVoice phonetics fix tasks complete"
```
