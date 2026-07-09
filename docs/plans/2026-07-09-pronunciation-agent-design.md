# Design Document: Pronunciation Agent for Vietnamese TTS

## Goal

Optimize the pronunciation of Vietnamese Text-to-Speech (specifically OmniVoice local cloner) when reading technical scripts containing English terms, acronyms, and product names, while keeping the displayed video subtitles 100% clean and professional.

## Overview

The Pronunciation Agent uses the Gemini API (`gemini-2.5-flash`) under the hood to perform context-aware phonetic rewriting. It maintains a PostgreSQL caching table (`pronunciation_cache`) to avoid redundant API calls and dynamically learn new pronunciations.

The UI remains fully automated (Option 1). Users will only see and edit the standard "Voiceover" subtitle field in the Storyboard Editor. The backend handles the generation, caching, and usage of the phonetic TTS script (`voiceover_tts`) entirely in the background.

## Database Changes

### 1. New Table `pronunciation_cache`
A PostgreSQL database table to store recognized terms and their phonetic Viet-English pronunciations:

```sql
CREATE TABLE IF NOT EXISTS pronunciation_cache (
  term VARCHAR(100) PRIMARY KEY,
  pronunciation VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  language VARCHAR(50) DEFAULT 'en',
  confidence DOUBLE PRECISION DEFAULT 1.0,
  source VARCHAR(100) DEFAULT 'community',
  aliases JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Scene Table Update
Add a new column `voiceover_tts` to the `scenes` table:
*   `voiceover` (existing): Used for subtitles and displayed on screen (e.g., "Cursor AI vừa ra mắt Background Agent").
*   `voiceover_tts` (new): Used for TTS audio generation (e.g., "Cơ-sờ Ây Ai vừa ra mắt Bách-grao Đây-gần").

---

## Proposed Changes

### Component: Backend Service

#### [NEW] [pronunciation.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/pronunciation.js)
Contains the core logic for the Pronunciation Agent:
*   Loads existing pronunciations from database.
*   Calls Gemini API to process input text with strict phonetic guidelines.
*   Extracts `new_pronunciations` returned by Gemini and saves them back to `pronunciation_cache`.
*   Provides `optimizeTextForTTS(text)` helper function.

#### [MODIFY] [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js)
*   Update `initDb()` to create the `pronunciation_cache` table and add `voiceover_tts` column to `scenes` table.
*   Update project loading and saving helpers to include the `voiceover_tts` field.

#### [MODIFY] [server.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/server.js)
*   Update the PUT `/api/projects/:id/scenes/:sceneId` route:
    *   Compare old `voiceover` with new `voiceover`.
    *   If updated, call `pronunciation.optimizeTextForTTS()` to regenerate `voiceover_tts`.
    *   Pass `voiceover_tts` to `tts.generateTTS()`.

#### [MODIFY] [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js)
*   After generating the storyboard from raw script text, iterate through each scene and run `optimizeTextForTTS()` to populate the `voiceover_tts` field before returning.

#### [MODIFY] [tts.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/tts.js)
*   Accept `voiceover_tts` instead of parsing `voiceover` inside the generation function.
*   Simplify `normalizeTextForTTS()` as the input will already be phonetically optimized by the LLM Agent.

---

## Verification Plan

### Automated Verification
*   Create a test script `backend/test_pronunciation.js` to run sample texts containing typical IT/acronym terms (e.g., "SQL", "SDK", "React", "Node.js 22", "https://openai.com") through the Pronunciation Agent.
*   Assert that:
    1.  The database successfully caches new terms.
    2.  `tts_script` output contains correct Vietnamese phonetic spellings.
    3.  `display_script` is 100% identical to the input.

### Manual Verification
*   Edit a scene text in the frontend editor.
*   Verify that the generated audio reflects the optimized pronunciation while the subtitle on the Remotion player/preview remains correctly spelled.
