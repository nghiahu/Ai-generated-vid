# Individual Scene Preview Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enable previewing individual storyboard scenes inline with a single play-once-and-reset flow.

**Architecture:** Pass the project config to the StoryboardEditor component. Import Remotion Player and MainComposition into StoryboardEditor. Create a state-driven InlineScenePlayer component inside StoryboardEditor.jsx that plays the single scene and resets on ended.

**Tech Stack:** React, Remotion Player

---

### Task 1: Pass Project Config to StoryboardEditor in App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Edit code in App.jsx**
Pass `config={currentProject?.config || {}}` in both occurrences of the `<StoryboardEditor>` component:
1. Under `WORKSPACE_SETUP` (line 286)
2. Under `WORKSPACE_EDITOR` (line 354)

**Step 2: Verify compile**
Run: `npm run build` in `frontend` folder to ensure it compiles correctly.

**Step 3: Commit**
```bash
git add frontend/src/App.jsx
git commit -m "feat: pass config to StoryboardEditor"
```

---

### Task 2: Create InlineScenePlayer and Play Overlay in StoryboardEditor

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Edit code in StoryboardEditor.jsx**
1. Add imports at the top of the file:
```javascript
import { Player } from "@remotion/player";
import { MainComposition } from "../../../my-video/src/compositions/MainComposition";
import { useRef, useEffect } from "react";
```
2. Create `InlineScenePlayer` component inside/at the top of the file.
3. Add `config` to destructured props of `StoryboardEditor`.
4. Add `playingSceneId` state: `const [playingSceneId, setPlayingSceneId] = useState(null);`
5. Update 9:16 Preview Card container to conditionally render `InlineScenePlayer` if `playingSceneId === scene.id`.
6. Add the Play overlay button at the bottom-left of the static preview mockup.

**Step 2: Verify build and lint**
Run: `npm run lint` and `npm run build` in `frontend` folder.

**Step 3: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: implement InlineScenePlayer and Play button overlay"
```

---

### Task 3: Verify and complete
Confirm that the build succeeds and prompt the user to test the scene preview in the browser.
