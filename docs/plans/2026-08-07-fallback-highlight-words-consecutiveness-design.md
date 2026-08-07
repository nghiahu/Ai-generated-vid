# Design Doc: Fallback Highlight Words Consecutiveness Fix

**Date:** 2026-08-07
**Author:** Antigravity

## Context & Requirements
When the AI generates headings without successfully populating the `highlightWords` or if the generated words are filtered out, the backend uses a fallback mechanism. 
The previous fallback logic filtered words by length and stop words *first*, then took the last two remaining words to construct the highlight phrase:
```javascript
const headingWords = headingStr.split(/\s+/).filter(w => w.length >= 3 && !["cho", "với", "như", "này", "được"].includes(w.toLowerCase()));
validHighlightWords = [headingWords.slice(-2).join(" ")];
```
For the heading `"KỶ NGUYÊN LOCAL AI TRÊN MÁY TÍNH CÁ NHÂN"`, the filtered words list was `["NGUYÊN", "LOCAL", "TRÊN", "MÁY", "TÍNH", "NHÂN"]` (filtering out `"CÁ"`, `"AI"`, `"KỶ"`). Taking the last two words resulted in `"TÍNH NHÂN"`. 
Since `"TÍNH NHÂN"` is not a consecutive substring of the original heading, the frontend regex match failed, and no words were highlighted.

---

## Proposed Solution
Instead of filtering the word list *before* slicing (which breaks consecutiveness), we will keep the original split array order, scan for consecutive pairs (bigrams) from the end of the sentence, and select a pair that contains strong (non-stop, length >= 3) words. 
This guarantees that:
1. The highlighted keywords are always consecutive substrings of the original heading text (so they will always highlight correctly).
2. We avoid picking meaningless stop words.

---

## Verification Plan

### Automated Verification
1. Run syntax check command: `node -c backend/services/ai.js` to ensure the file has no syntax errors.

### Manual Verification
1. Generate or preview the scene with the heading `"KỶ NGUYÊN LOCAL AI TRÊN MÁY TÍNH CÁ NHÂN"`.
2. Verify that the highlighted word resolves to `"MÁY TÍNH"` (or another consecutive strong pair) instead of `"TÍNH NHÂN"`, and is correctly colored in the frontend preview.
