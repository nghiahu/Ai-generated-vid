# Voice Audio Loss Prevention Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Prevent browser audio tag exhaustion and AudioContext suspension in the storyboard editor by muting inactive players and reducing the number of shared audio tags.

**Architecture:**
1. Update `StoryboardEditor.jsx` to set `muted={!isPlaying}` and `numberOfSharedAudioTags={5}` on `InlineScenePlayer`.
2. Update `MasterPlayer.jsx` and `Dashboard.jsx` to set `numberOfSharedAudioTags={5}`.

**Tech Stack:** React, Web Audio API, Remotion Player

---

### Task 1: Update StoryboardEditor.jsx with dynamic muting and reduced audio tags

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Inspect code**
Check lines 150-170 in `frontend/src/components/StoryboardEditor.jsx`.

**Step 2: Modify code**
Add `muted={!isPlaying}` and change `numberOfSharedAudioTags={100}` to `numberOfSharedAudioTags={5}`:
```javascript
        controls={false}
        autoPlay={false}
        acknowledgeRemotionLicense
        numberOfSharedAudioTags={5}
        muted={!isPlaying}
```

**Step 3: Run verify compilation**
Check files compiled and build/lint results.

---

### Task 2: Reduce audio tag limits in MasterPlayer.jsx and Dashboard.jsx

**Files:**
- Modify: `frontend/src/components/MasterPlayer.jsx`
- Modify: `frontend/src/components/Dashboard.jsx`

**Step 1: Modify MasterPlayer.jsx**
Change `numberOfSharedAudioTags={100}` to `numberOfSharedAudioTags={5}`:
```javascript
              controls
              acknowledgeRemotionLicense
              numberOfSharedAudioTags={5}
```

**Step 2: Modify Dashboard.jsx**
Change `numberOfSharedAudioTags={100}` to `numberOfSharedAudioTags={5}`:
```javascript
      controls={true}
      loop={false}
      numberOfSharedAudioTags={5}
```

**Step 3: Run verify compilation**
Ensure both frontend files compile cleanly.
