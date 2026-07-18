# Dynamic Watermark AI Lab Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Modify the AI Hub Grid visual style in Remotion to render the watermark text dynamically from the editor config, defaulting to "AI LAB" if unchanged.

**Architecture:** Update MainComposition.tsx to read config.watermark.enabled and config.watermark.text, conditionally rendering "AI LAB" as a default fallback instead of the hardcoded "AI HUB" when the visual theme is "ai_hub_grid".

**Tech Stack:** React, Remotion, TypeScript

---

### Task 26: Update Remotion Watermark rendering in MainComposition.tsx

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx:419-438`

**Step 1: Write minimal implementation**
We will replace the hardcoded "AI HUB" text overlay inside `my-video/src/compositions/MainComposition.tsx` with dynamic checks for `config?.watermark?.enabled` and fallback logic.

```tsx
      {/* Watermark Overlay layer (Tĩnh xuyên suốt video) */}
      {config?.visualStyle === "ai_hub_grid" ? (
        config?.watermark?.enabled && (
          <div
            style={{
              position: "absolute",
              bottom: "80px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 100,
              color: "#3b82f6",
              fontFamily: "Be Vietnam Pro, sans-serif",
              fontWeight: 900,
              fontSize: "28px",
              letterSpacing: "4px",
              textShadow: "0 0 12px rgba(59, 130, 246, 0.8)",
              opacity: 0.85
            }}
          >
            {(!config?.watermark?.text || config.watermark.text === "yupclip.com") 
              ? "AI LAB" 
              : config.watermark.text}
          </div>
        )
      ) : (
```

**Step 2: Run build and lint verification**
Run: `npm run lint` in `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: PASS with no TypeScript/ESLint errors.

Run: `npm run build` in `c:\Users\nghia\OneDrive\Máy tính\AI-grenerated vid-hyperframe\my-video`
Expected: PASS with a successfully bundled Remotion index file.

**Step 3: Commit**
```bash
git add my-video/src/compositions/MainComposition.tsx
git commit -m "feat: make AI Hub Grid watermark dynamic and default to AI LAB"
```

---

### Task 27: Verify end-to-end integration in the Editor UI

**Files:**
- Test: `frontend/src/components/SidebarConfig.jsx` (verify configuration updates sync correctly to Remotion player preview)

**Step 1: Verify default preview text**
1. Ensure both the backend and frontend dev servers are running.
2. Open the web interface in the browser.
3. Switch the video visual style to "AI Hub Grid".
4. Verify that the bottom center watermark displays **`AI LAB`** by default.

**Step 2: Verify dynamic watermark text and toggles**
1. Go to the "Watermark" configuration in the sidebar.
2. Toggle the "Watermark" checkbox to unchecked. Verify that the bottom watermark disappears in the player.
3. Toggle it back to checked. Verify that the watermark reappears.
4. Modify the watermark input text from "yupclip.com" to "Ai lab". Verify that the player renders the glow watermark as "Ai lab" in real-time.

**Step 3: Commit tracker progress**
Update `docs/plans/task.md` with:
`| task_26 | Update Remotion Watermark rendering in MainComposition.tsx to be dynamic | completed | verified |`
`| task_27 | Verify end-to-end integration in the Editor UI | completed | verified |`

```bash
git add docs/plans/task.md
git commit -m "chore: complete dynamic watermark tasks"
```
