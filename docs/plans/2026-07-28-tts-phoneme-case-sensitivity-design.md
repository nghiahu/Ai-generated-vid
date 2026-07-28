# Design Document: TTS Phoneme Case Sensitivity for Vietnamese Clashing Terms

## Overview
When generating audio using Text-to-Speech (TTS), English technical terms are automatically transliterated into easy-to-read Vietnamese phonetic sounds (e.g., `'ai'` -> `'ây-ai'`, `'remotion'` -> `'ri-mô-sần'`).
However, several tech terms/abbreviations clash with common Vietnamese words (specifically the Vietnamese word "ai" meaning "who" vs. the English acronym "AI" meaning "Artificial Intelligence").

Currently, the replace operation in the text optimizer uses a case-insensitive match for clashing terms, replacing lowercase `"ai"` with `"ây-ai"`. This design introduces strict case-sensitive matching for all clashing Vietnamese stop words.

## Proposed Changes

### Backend: `backend/services/phoneme.js`
Modify the `optimizeTextForPhonemes` function to:
1. Identify if a term is a Vietnamese stop word.
2. If it is a stop word, enforce case-sensitive matching (`"g"` flag) and only match the uppercase version of the term (`term.toUpperCase()`).
3. If it is NOT a stop word, continue using case-insensitive matching (`"gi"` flag) for convenience.

```javascript
const searchPattern = isStopWord ? term.toUpperCase() : term;
const regex = new RegExp(
  `(?<=^|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])(${escaped})(?=$|\\s|[-.,!?;()'"“”\\/\\\\*+={}\\[\\]])`,
  isStopWord ? "g" : "gi"
);
```

## Verification Plan
1. Check that `"AI"` in a script is successfully replaced with `"ây-ai"`.
2. Check that `"ai"` (lowercase) in a script remains `"ai"` and is not replaced.
3. Check that other English terms (e.g., `"React"`, `"react"`) are still replaced case-insensitively.
