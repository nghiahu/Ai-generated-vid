# Design Document: Phoneme Agent for Vietnamese TTS

## Goal

Build a **Phoneme Injection Engine** to automatically translate technical English terms, proper nouns, acronyms, and versions into CMU phoneme brackets (e.g. `[R IY1 AE1 K T]`, `[D AA1 K ER0]`) inside Vietnamese TTS scripts. This ensures 100% correct English pronunciation by OmniVoice while keeping display subtitles completely clean and unaltered.

## Architecture

```
Script Text (Vietnamese + English)
      │
      ▼
1. Term Extraction (Gemini API) -> List of English terms (e.g., ["React", "Docker"])
      │
      ▼
2. Phoneme Mapping for each term:
   ├── a. Check Project Cache DB (phoneme_cache + phoneme_alias)
   ├── b. Check Local CMU Dictionary (cmudict.dict loaded in memory)
   └── c. Fallback: Gemini G2P API (saves new phonemes to DB with confidence scores)
      │
      ▼
3. Deterministic Token Injection (Node.js/JS Regex replacement)
      │
      ▼
Phoneme-Injected TTS Script (e.g., "Học [R IY1 AE1 K T] và [D AA1 K ER0]")
      │
      ▼
Edge TTS / OmniVoice / ElevenLabs
```

---

## Database Schema

We will clean up the old `pronunciation_cache` table and deploy the following schema:

```sql
DROP TABLE IF EXISTS pronunciation_cache;

CREATE TABLE phoneme_cache (
    id BIGSERIAL PRIMARY KEY,
    term VARCHAR(150) NOT NULL UNIQUE,          -- normalized lookup key (lowercase)
    display_term VARCHAR(150),                  -- original formatted word (e.g. "Node.js")
    phoneme TEXT NOT NULL,                      -- CMU phoneme sequence (e.g. "N OW1 D JH EY1 EH1 S")
    phoneme_format VARCHAR(20) NOT NULL DEFAULT 'CMU',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    source VARCHAR(30) NOT NULL DEFAULT 'cmudict', -- 'cmudict', 'g2p' (Gemini), 'manual'
    confidence NUMERIC(4,3) DEFAULT 1.000,
    manual_override BOOLEAN DEFAULT FALSE,
    review_required BOOLEAN DEFAULT FALSE,      -- set true if confidence < 0.8
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE phoneme_alias (
    id BIGSERIAL PRIMARY KEY,
    phoneme_id BIGINT REFERENCES phoneme_cache(id) ON DELETE CASCADE,
    alias VARCHAR(150) NOT NULL,
    UNIQUE(alias)
);
```

---

## Component Design

### 1. Database Helpers (`backend/services/db.js`)
*   `getPhonemeFromCache(term)`: Queries `phoneme_cache` and `phoneme_alias` to find existing phoneme translations (case-insensitive).
*   `savePhonemeToCache(term, displayTerm, phoneme, source, confidence, aliases)`: Saves a new translation and registers its aliases in the DB.

### 2. Phoneme Service (`backend/services/phoneme.js`)
*   Loads `resources/cmudict.dict` (3.6MB) in-memory into a `Map` when loaded.
*   `extractTerms(text)`: Calls Gemini model `gemini-2.5-flash` to extract a list of English words/acronyms/technical terms from the script.
*   `getPhonemesForTerms(terms)`:
    *   Iterates through terms.
    *   Checks cache database -> checks local `cmuDict` Map.
    *   For remaining unknown terms, calls Gemini G2P fallback in a single batch to generate CMU phonemes.
    *   Saves newly generated phonemes to database cache.
*   `optimizeTextForPhonemes(text)`:
    *   Calls `extractTerms(text)`.
    *   Obtains phonemes mapping using `getPhonemesForTerms()`.
    *   Performs deterministic regex-based injection in JavaScript to replace English terms with `[PHONEMES]` in the script.

### 3. Integration & Normalization Cleanup
*   **`backend/services/tts.js`**:
    *   Accepts `voiceover_tts` containing phoneme brackets.
    *   Passes it directly to OmniVoice / Edge TTS / ElevenLabs.
*   **`backend/services/ai.js`**:
    *   Calls `phoneme.optimizeTextForPhonemes()` to populate `voiceover_tts` for each storyboard scene.
*   **`backend/server.js`**:
    *   Integrates `phoneme.optimizeTextForPhonemes()` inside PUT `/api/projects/:id/scenes/:sceneId` to update `voiceover_tts` whenever the subtitle `voiceover` changes.

---

## Verification Plan

### Automated Verification
*   Write `backend/test_phoneme.js` which:
    1.  Runs migrations to create new tables.
    2.  Invokes `optimizeTextForPhonemes()` on a sample text: `"Hôm nay chúng ta sẽ học React và Docker để xây dựng API. Sau đó triển khai lên Vercel."`.
    3.  Asserts that:
        - `React` is mapped to `[R IY1 AE1 K T]` (from CMU dict/cache).
        - `Docker` is mapped to `[D AA1 K ER0]` (from CMU dict/cache).
        - `Vercel` is mapped to generated CMU phonemes (from Gemini fallback).
        - The new term `Vercel` is successfully cached in the `phoneme_cache` table.
        - The Vietnamese words and punctuation are 100% unaltered.

### Manual Verification
*   Verify that OmniVoice synthesizes the CMU phoneme brackets correctly without errors.
