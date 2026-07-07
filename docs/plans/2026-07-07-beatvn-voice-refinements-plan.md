# Implementation Plan: BeatVN Voice Refinements & Pronunciation Adjustments

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the zero-shot cloner configuration in backend TTS service to use female cloner target mode for BeatVN voices (V1 and V2), and clean up English acronyms "IT" and "CRUD" to pronounce correctly.

---

### Task 1: Update voice key definitions & cloner instruction gender

**Files:**
- Modify: `backend/services/tts.js:235-255`
- Modify: `backend/services/tts.js:275-290`

**Step 1: Update isMale check**
In `backend/services/tts.js`, change `isMale` to exclude BeatVN V1 (`isBeatvn`) and V2 (`isBeatvn2`):
```javascript
      const isMale = voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy || isDoTrinh;
```

**Step 2: Update instruct checks**
Update the fallback cloner prompt:
```javascript
      let instruct = "female"; // Mặc định
      if (voiceKey.toLowerCase() === "omnivoice_male" || isAnhQuy || isDoTrinh) {
        instruct = "male";
      }
```

---

### Task 2: Add acronym normalization rules for "IT" and "CRUD"

**Files:**
- Modify: `backend/services/tts.js:90-110`

**Step 1: Inject translation regexes**
In `normalizeTextForTTS` inside `backend/services/tts.js`, add:
```javascript
  tempText = tempText
    .replace(/\bai\b/gi, "ây-ai")
    .replace(/\bapi\b/gi, "ây-pi-ai")
    .replace(/\bui\b/gi, "iu-ai")
    .replace(/\bux\b/gi, "iu-ích")
    .replace(/\burl\b/gi, "u-rờ-lờ")
    .replace(/\bit\b/gi, "ây-ti")
    .replace(/\bcrud\b/gi, "cờ-rút");
```

---

### Task 3: Verification & End-to-End Testing

**Step 1: Check syntax**
Run `node -c services/tts.js` inside `backend`.

**Step 2: Test synthesis**
Update `scratch/test_tts_beatvn2.js` to speak:
`"Xin chào các bạn nhé, chúng ta đang chạy thử nghiệm hệ thống IT và CRUD."`
Run `node scratch/test_tts_beatvn2.js` and verify output audio resemblance and pronunciation correctness.
