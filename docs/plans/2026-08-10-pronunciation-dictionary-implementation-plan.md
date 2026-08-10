# Pronunciation Dictionary (Cách đọc) Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Create a "Pronunciation Dictionary" (Cách đọc) feature, allowing users to define custom Vietnamese transliterations for foreign words or acronyms via a React modal, storing them in SQLite and applying them with top priority in the cloner script normalizer.

**Architecture:** We use the existing SQLite `phoneme_cache` database table, marking user entries with `manual_override = 1`. The backend exposes REST APIs (`GET`, `POST`, `DELETE`). The phoneme transliteration service queries these custom entries and overrides both built-in maps and Gemini defaults. The UI triggers a beautiful modal from the AI Voice config section.

**Tech Stack:** React, Express, SQLite.

---

### Task 1: Implement database methods in `db.js`
**Files:**
- Modify: [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js)

**Step 1: Write database helper methods**
Add `getAllCustomPhonemes` and `deleteCustomPhoneme` in `db.js`.
```javascript
  getAllCustomPhonemes: async () => {
    await initDb();
    const database = getDb();
    return database.prepare(`
      SELECT id, term, display_term, phoneme 
      FROM phoneme_cache 
      WHERE manual_override = 1 
      ORDER BY term ASC
    `).all();
  },

  deleteCustomPhoneme: async (term) => {
    await initDb();
    const database = getDb();
    const cleanTerm = term.toLowerCase().trim();
    database.prepare('DELETE FROM phoneme_cache WHERE term = ? AND manual_override = 1').run([cleanTerm]);
  },
```

**Step 2: Commit**
```bash
git add backend/services/db.js
git commit -m "db: implement getAllCustomPhonemes and deleteCustomPhoneme methods"
```

---

### Task 2: Update transliteration logic in `phoneme.js`
**Files:**
- Modify: [phoneme.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/phoneme.js)

**Step 1: Update `getPhonemesForTerms` priority check**
Change the loop in `getPhonemesForTerms` to check the DB cache first, and if `manual_override = 1`, use it immediately.
```javascript
    // 1. Kiểm tra database cache có manual_override = 1 (Ưu tiên tuyệt đối từ người dùng)
    try {
      const cached = await db.getPhonemeFromCache(cleanTerm);
      if (cached && cached.phoneme && cached.manual_override === 1) {
        mapping[term] = cached.phoneme;
        console.log(`[Phoneme Engine] Tra cứu thành công Custom Dict từ DB: "${term}" -> "${cached.phoneme}"`);
        continue;
      }
    } catch (dbErr) { }

    // 2. Kiểm tra từ điển dịch tĩnh TECH_TERMS_TRANSLITERATION (Mặc định)
    if (TECH_TERMS_TRANSLITERATION[cleanTerm]) {
      const transliterated = TECH_TERMS_TRANSLITERATION[cleanTerm];
      mapping[term] = transliterated;
      ...
```

**Step 2: Scan custom terms in `optimizeTextForPhonemes`**
Fetch custom terms and scan for them:
```javascript
    // 1.1. Quét từ khóa tự cấu hình trong database
    const customPhrases = await db.getAllCustomPhonemes();
    const customTerms = customPhrases.map(p => p.term).filter(term => {
      const isStopWordTerm = VIETNAMESE_STOP_WORDS.has(term.toLowerCase());
      const searchPattern = isStopWordTerm ? term.toUpperCase() : term;
      const escaped = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(?<=^|\\s|[-.,!?;()'"""\\/\\\\*+={}\\[\\]])${escaped}(?=$|\\s|[-.,!?;()'"""\\/\\\\*+={}\\[\\]])`, isStopWordTerm ? "g" : "i");
      return regex.test(text);
    });
```
Merge: `const terms = [...aiTerms, ...staticTerms, ...customTerms].filter(...)`.

**Step 3: Commit**
```bash
git add backend/services/phoneme.js
git commit -m "feat: prioritize manual overrides and dynamically scan database custom terms"
```

---

### Task 3: Add API routes in `server.js`
**Files:**
- Modify: [server.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/server.js)

**Step 1: Add GET, POST, DELETE endpoints**
Add the REST routes to manage the custom dictionary entries.
```javascript
// Pronunciation Dictionary API
app.get('/api/phonemes', async (req, res) => {
  try {
    const list = await db.getAllCustomPhonemes();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/phonemes', async (req, res) => {
  try {
    const { term, phoneme } = req.body || {};
    if (!term || !phoneme) {
      return res.status(400).json({ error: "Thiếu từ khóa hoặc cách phát âm" });
    }
    const cleanTerm = term.toLowerCase().trim();
    await db.savePhonemeToCache({
      term: cleanTerm,
      display_term: term.trim(),
      phoneme: phoneme.trim(),
      manual_override: 1,
      source: 'manual'
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/phonemes/:term', async (req, res) => {
  try {
    const { term } = req.params;
    await db.deleteCustomPhoneme(term);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 2: Commit**
```bash
git add backend/server.js
git commit -m "feat: add CRUD API endpoints for custom phonemes"
```

---

### Task 4: Create the UI modal `PronunciationModal.jsx`
**Files:**
- Create: [PronunciationModal.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/PronunciationModal.jsx)

**Step 1: Implement modal component**
Create the component matching the light mode theme, containing inputs for Abbreviation & Transliteration, char counters, a list of existing words, and API integration.

**Step 2: Commit**
```bash
git add frontend/src/components/PronunciationModal.jsx
git commit -m "feat: implement PronunciationModal React component"
```

---

### Task 5: Mount trigger and modal in Frontend
**Files:**
- Modify: [SidebarConfig.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/SidebarConfig.jsx)
- Modify: [App.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/App.jsx)

**Step 1: Add open button in SidebarConfig**
Add the trigger link below the AI Voice selection dropdown:
```jsx
<button 
  type="button" 
  onClick={onOpenPronunciationModal}
  style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "12px", cursor: "pointer", fontWeight: "600", padding: "4px 0" }}
>
  🗣️ Cách đọc từ viết tắt/tiếng Anh
</button>
```

**Step 2: Import and mount PronunciationModal in App.jsx**
Expose a state `showPronunciationModal` in `App.jsx`, pass down the toggle functions, and render `<PronunciationModal onClose={() => setShowPronunciationModal(false)} />` when visible.

**Step 3: Commit**
```bash
git add frontend/src/components/SidebarConfig.jsx frontend/src/App.jsx
git commit -m "feat: integrate pronunciation modal trigger and overlay in frontend layout"
```

---

### Task 6: End-to-End Verification
**Step 1: Test transliteration override**
Run the backend tests or execute a custom REST post to check that custom terms override built-in settings.

**Step 2: Verify UI behaviour**
Add a term through the modal, write it in a storyboard script, generate TTS, and verify that the Vietnamese voice speaks the custom pronunciation correctly.

**Step 3: Commit**
```bash
git commit --allow-empty -m "test: verify pronunciation dictionary end-to-end tests pass"
```
