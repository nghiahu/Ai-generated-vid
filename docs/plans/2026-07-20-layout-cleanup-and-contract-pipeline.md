# Layout Cleanup & Layout Contract Pipeline Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Clean up 37 specified low-quality layout options from the codebase and introduce a structured Layout Contract system to ensure AI-generated scene content respects target layout visual constraints.

**Architecture:** 
1. Delete 37 redundant layout JSON templates from `my-video/src/compositions/layouts/templates/` and update `LAYOUTS_BY_FAMILY` in `StoryboardEditor.jsx`.
2. Create Layout Contract definitions (`backend/contracts/`) specifying char limits, point counts, and allowed types per layout.
3. Update Gemini Phase 1 Scene Planner to pick explicit `layoutId` and Phase 2 Renderer to enforce contract constraints.
4. Add backend validation layer to auto-trim/enforce bounds before saving scenes to DB.

**Tech Stack:** React, Node.js/Express, Remotion (TypeScript), Gemini API (Google AI SDK).

---

### Task 1: Clean up 37 unused layouts from Frontend (`StoryboardEditor.jsx`)

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx:192-256`

**Step 1: Update `LAYOUTS_BY_FAMILY` in `StoryboardEditor.jsx`**
Remove the 37 specified values from the `Opening / Headline` array:
- `IntroFullImageSplitHeadline`
- `IntroKineticCountdownImage`
- `IntroMediaHero`
- `IntroMediaPoster`
- `IntroMetricConstellationImage`
- `IntroMetricGyroscopeImage`
- `IntroMetricKpiBoardImage`
- `IntroMetricOrbitImage`
- `IntroNumberLede`
- `IntroProfile`
- `IntroStampStackImage`
- `KineticType`
- `LowerThirdNews`
- `ManifestoConcept`
- `MediaCardHook`
- `MediaHeadlineHook`
- `NeonStackTitle`
- `NotificationHook`
- `OrbitMetricsHook`
- `PosterTitle`
- `PriceAlertHook`
- `ProcessStrip`
- `Quote`
- `RedditPostHook`
- `SplitEditorial`
- `SporlightOutcome`
- `SpotlightConcept`
- `StatusGridHook`
- `SwissGrid`
- `SysteamAlertHook`
- `TerminalCommandHook`
- `Terminal`
- `TickerTapeHook`
- `VignelliTitle`
- `WalkthroughPhoneExample`
- `WarmGrainHook`
- `XPostHook`

**Step 2: Build frontend to verify no broken layout references**
Run: `cd frontend && npm run build`
Expected: Success with 0 errors.

---

### Task 2: Delete 37 JSON template files from `my-video/src/compositions/layouts/templates/`

**Files:**
- Delete specified 37 JSON files across template subdirectories in `my-video/src/compositions/layouts/templates/`.

**Step 1: Delete template JSON files**
Remove files matching deleted layout keys.

**Step 2: Build video bundle to verify Remotion build**
Run: `cd my-video && npx remotion render src/index.ts Main --props="{}" --out /dev/null` or `npm run build` if available.

---

### Task 3: Create Layout Contract Loader & Contracts (`backend/services/contractLoader.js`)

**Files:**
- Create: `backend/contracts/` directory
- Create: `backend/services/contractLoader.js`
- Create: default contract definitions for active layouts.

**Step 1: Define default contract structure and loader function**
Loader reads contract by `layoutId`, falls back to generic family contract if missing.

---

### Task 4: Upgrade Phase 1 (Scene Planner) & Phase 2 (UI Renderer) in `backend/services/ai.js`

**Files:**
- Modify: `backend/services/ai.js:8-122`, `backend/services/ai.js:198-354`, `backend/services/ai.js:359-470`

**Step 1: Add `layoutId` to `PLANNER_SCHEMA`**
Update Phase 1 prompt to instruct AI to pick valid `layoutId` from active whitelist.

**Step 2: Inject contract into Phase 2 prompt**
Load contract for selected `layoutId` and pass exact char limits and point count constraints into systemInstruction.

**Step 3: Validate and populate `visualLayout` in backend orchestrator**
Ensure `scene.visualLayout = scene.layoutId` before saving to DB.

---

### Task 5: End-to-end Build Verification

**Step 1: Run frontend build**
Run: `cd frontend && npm run build`

**Step 2: Test backend syntax**
Run: `node -c backend/services/ai.js && node -c backend/services/contractLoader.js`
