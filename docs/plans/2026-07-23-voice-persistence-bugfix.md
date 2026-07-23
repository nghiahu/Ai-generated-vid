# Voice Selection Persistence Bugfix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix voice parameter reset bug in `StudioAIGen.jsx` so selected voice (e.g. Quang Anh) persists across single-scene regenerations and session reloads.

**Architecture:** Update state initialization, `localStorage` caching, database restoration, and handler functions in `StudioAIGen.jsx` to preserve `voice` selection.

**Tech Stack:** React, LocalStorage, Axios API.

---

### Task 1: Fix Voice State Caching and Restoration in StudioAIGen.jsx

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:290-305` (Session restore)
- Modify: `frontend/src/components/StudioAIGen.jsx:450-460` (Session reset)
- Modify: `frontend/src/components/StudioAIGen.jsx:545-555` (Generation cache)
- Modify: `frontend/src/components/StudioAIGen.jsx:1010-1018` (Voice dropdown change)

**Step 1: Save `voice` in `localStorage` on dropdown change & generation**

In voice `<select>`:
```jsx
onChange={(e) => {
  const newVoice = e.target.value;
  setVoice(newVoice);
  localStorage.setItem("studio_aigen_voice", newVoice);
}}
```

In `handleGenerate`:
```jsx
localStorage.setItem("studio_aigen_voice", voice);
```

**Step 2: Restore `voice` from `localStorage` on mount**

In `useEffect` mount check:
```javascript
const cachedVoice = localStorage.getItem("studio_aigen_voice");
if (cachedVoice) setVoice(cachedVoice);
```

**Step 3: Clear `voice` in `handleResetSession`**

```javascript
localStorage.removeItem("studio_aigen_voice");
```

**Step 4: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "fix(studiogen): persist voice selection in localStorage to prevent reverting to duythanh on regeneration"
```

### Task 2: Verify Voice Retention in Studio AI Gen

**Step 1: Verify voice retains Quang Anh across single-scene regenerations**
Open browser, select Quang Anh, trigger single scene regeneration, and confirm audio plays with Quang Anh voice.
