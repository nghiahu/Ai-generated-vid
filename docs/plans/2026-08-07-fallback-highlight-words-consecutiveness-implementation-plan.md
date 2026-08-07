# Fallback Highlight Words Consecutiveness Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix the fallback highlight words extraction logic in the backend so that generated highlight words are always consecutive substrings of the heading text, preventing broken highlighting like "TÍNH NHÂN".

**Architecture:**
- Modify `backend/services/ai.js` to change the fallback highlight extraction logic.
- Split the heading by space, but choose consecutive pairs of words rather than filtering out words first.
- Ensure the chosen pair contains strong words and is consecutive in the original string.

**Tech Stack:** Node.js, JavaScript

---

### Task 1: Update Fallback Highlight Extraction Logic in Backend

**Files:**
- Modify: [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js)

**Step 1: Write implementation**
Replace lines 500-508 in `backend/services/ai.js` with consecutive bigram check logic:
```javascript
        if (validHighlightWords.length === 0) {
          const allWords = headingStr.split(/\s+/).filter(w => w.trim().length > 0);
          let found = false;
          const isStrong = (w) => w && w.length >= 3 && !["cho", "với", "như", "này", "được", "của", "tại", "vào", "lên", "cho", "qua", "theo"].includes(w.toLowerCase());
          
          // 1. Try to find consecutive 2 words ending near the end of the sentence where both are strong
          for (let i = allWords.length - 1; i >= 1; i--) {
            const w1 = allWords[i - 1];
            const w2 = allWords[i];
            if (isStrong(w2) && isStrong(w1)) {
              validHighlightWords = [`${w1} ${w2}`];
              found = true;
              break;
            }
          }
          
          // 2. Fallback: Try to find consecutive 2 words where at least one is strong
          if (!found) {
            for (let i = allWords.length - 1; i >= 1; i--) {
              const w1 = allWords[i - 1];
              const w2 = allWords[i];
              if (isStrong(w2) || isStrong(w1)) {
                validHighlightWords = [`${w1} ${w2}`];
                found = true;
                break;
              }
            }
          }
          
          // 3. Fallback: Try to find a single strong word near the end
          if (!found) {
            for (let i = allWords.length - 1; i >= 0; i--) {
              if (isStrong(allWords[i])) {
                validHighlightWords = [allWords[i]];
                found = true;
                break;
              }
            }
          }
          
          // 4. Ultimate fallback: Last word of the sentence
          if (!found && allWords.length > 0) {
            validHighlightWords = [allWords[allWords.length - 1]];
          }
        }
```

**Step 2: Run verification**
Start the backend or run a check to verify no syntax errors.
Run: `node -c backend/services/ai.js`
Expected: Success with no syntax errors.

**Step 3: Commit**
```bash
git add backend/services/ai.js
git commit -m "fix(backend): extract consecutive words for fallback highlightWords to prevent broken highlights"
```
