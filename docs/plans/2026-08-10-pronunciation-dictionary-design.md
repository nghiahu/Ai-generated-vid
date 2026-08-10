# Design: Pronunciation Dictionary (Cách đọc)

## Background
Acronyms, technical terms, and foreign proper nouns are often pronounced incorrectly or inconsistently by offline TTS engines. Currently, standard abbreviations are mapped in a static `TECH_TERMS_TRANSLITERATION` dictionary in `phoneme.js`.
To give users full control, we will implement a "Pronunciation Dictionary" (Cách đọc) feature, allowing users to define custom Vietnamese transliterations for any terms. These rules will persist in the SQLite database and will be applied with the highest priority when processing video scripts.

## Database Design (`backend/services/db.js`)
We will reuse the existing `phoneme_cache` SQLite table. User-defined custom pronunciations will be inserted with `manual_override = 1` and `source = 'manual'`.

We will implement two new helper methods in `db.js`:
- `getAllCustomPhonemes()`:
  ```sql
  SELECT id, term, display_term, phoneme 
  FROM phoneme_cache 
  WHERE manual_override = 1 
  ORDER BY term ASC
  ```
- `deleteCustomPhoneme(term)`:
  ```sql
  DELETE FROM phoneme_cache 
  WHERE term = ? AND manual_override = 1
  ```

## Transliteration Logic (`backend/services/phoneme.js`)
1. **Dynamic Term Scanning**: 
   In `optimizeTextForPhonemes(text, projectId)`, we will load all custom terms from the database:
   ```javascript
   const customPhrases = await db.getAllCustomPhonemes();
   const customTerms = customPhrases.map(p => p.term).filter(term => {
     // Regex scanning similar to static terms
   });
   ```
   We will merge `customTerms` with `aiTerms` and `staticTerms` to ensure they are scanned and replaced.

2. **Resolution Priority**:
   In `getPhonemesForTerms(terms, projectId)`:
   - Check the SQLite database cache first: `db.getPhonemeFromCache(cleanTerm)`.
   - If a cached record is found and has `manual_override = 1`, use it immediately.
   - If not found, fall back to `TECH_TERMS_TRANSLITERATION[cleanTerm]`.
   - If not found, fall back to default database cache (`manual_override = 0`).
   - If not found, run G2P Gemini fallback.

## API Endpoints (`backend/server.js`)
We will add three REST endpoints:
- `GET /api/phonemes`: Returns all custom pronunciations (`manual_override = 1`).
- `POST /api/phonemes`: Receives `{ term: string, phoneme: string }`. Saves it to the database with `manual_override = 1` and `source = 'manual'`.
- `DELETE /api/phonemes/:term`: Deletes the custom pronunciation record matching `:term`.

## Frontend UI Design
1. **Trigger Button**:
   In `frontend/src/components/SidebarConfig.jsx`, add a link or small button `🗣️ Cách đọc` directly below the **AI Voice** select dropdown.

2. **Pronunciation Modal (`PronunciationModal.jsx`)**:
   - GFM-based clean Light Mode theme.
   - Form fields:
     - "Từ viết tắt/từ nước ngoài" (max 50 chars).
     - "Cách đọc" (max 100 chars).
     - "Thêm từ" button.
   - A list displaying all custom pronunciations fetched from `GET /api/phonemes` with a trash icon next to each to call `DELETE /api/phonemes/:term`.
   - Re-fetch data on add/delete to keep list updated.

## Verification Plan
1. **Unit Tests**:
   - Write a unit test verifying that adding a custom pronunciation overrides the static dictionary (e.g. override `AI` with `trí tuệ nhân tạo`).
2. **Manual Integration Test**:
   - Open the "Cách đọc" modal from the sidebar.
   - Add a term (e.g. `QL4H` -> `Quốc lộ bốn hát`).
   - Write a script containing `QL4H` and generate the storyboard.
   - Verify that the resulting TTS text displays the transliteration `quốc lộ bốn hát`.
   - Delete the term and verify it falls back.
