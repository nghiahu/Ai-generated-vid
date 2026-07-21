# Clone & Add Quang Anh Voice Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Register `omnivoice_quanganh` in `backend/services/tts.js` and add it to voice selection dropdowns in `frontend/src/components/SidebarConfig.jsx` and `frontend/src/App.jsx`.

**Tech Stack:** Node.js, OmniVoice CLI, React.

---

### Task 1: Map `omnivoice_quanganh` in `backend/services/tts.js`

**Files:**
- Modify: `backend/services/tts.js`

**Step 1: Add voice mapping**
Map `omnivoice_quanganh` / `omnivoice_quang_anh` to `mp3/quang_anh/voice_quang_anh.mp3` and its text transcript in `generateTTS`.

**Step 2: Commit changes**

```bash
git add backend/services/tts.js
git commit -m "feat(backend): register omnivoice_quanganh voice mapping in TTS service"
```

---

### Task 2: Add `omnivoice_quanganh` Option to Frontend Components

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Add dropdown option**
Add `<option value="omnivoice_quanganh">OmniVoice - Giọng Quang Anh (Offline Clone)</option>` in both dropdowns.

**Step 2: Commit changes**

```bash
git add frontend/src/components/SidebarConfig.jsx frontend/src/App.jsx
git commit -m "feat(frontend): expose omnivoice_quanganh option in voice selector dropdowns"
```

---

### Task 3: Verification & Test Check

**Step 1: Verify backend syntax**
Run backend syntax check.

**Step 2: Commit final status**

```bash
git commit --allow-empty -m "fix(tts): verify Quang Anh voice clone implementation"
```
