# AI Gen Project Restore & Dashboard Navigation — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Restore all saved Watermark settings (text, position, toggle) and BGM/voice config when opening an AI Gen project from the Projects page, and improve Dashboard card click navigation to open Studio AI Gen directly.

**Architecture:** Update `useEffect([projectId])` in `StudioAIGen.jsx` to restore `watermark` & audio config properties from database JSON into React state. Update `Dashboard.jsx` card click & button labels to provide intuitive navigation to Studio AI Gen.

**Tech Stack:** React, Tailwind / Inline CSS, Express, PostgreSQL / `db.js`.

---

## Task 1: Restore Watermark & BGM State in `StudioAIGen.jsx`

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Step 1: Update project loading effect in `StudioAIGen.jsx`**

In `useEffect` when `projectId` is set:
```javascript
if (proj && proj.config) {
  setScript(proj.config.script || "");
  setTheme(proj.config.theme || "ai_hub_grid");
  setTargetLength(proj.config.targetLength || "Short (~60s)");
  setVoice(proj.config.voiceKey || proj.config.voice || "duythanh");
  setBgImage(proj.config.bgImage || "");
  setRefImages(proj.config.refImages || []);
  setRawScenes(proj.config.scenes || []);

  // Restore Watermark & BGM settings
  if (proj.config.watermark) {
    setWatermarkEnabled(proj.config.watermark.enabled ?? true);
    setWatermarkText(proj.config.watermark.text || "yupclip.com");
    setWatermarkPosition(proj.config.watermark.position || "top-right");
  }
  if (proj.config.backgroundMusic) {
    setBgm(proj.config.backgroundMusic);
  }
  if (proj.config.backgroundMusicVolume !== undefined) {
    setBgmVolume(proj.config.backgroundMusicVolume);
  }

  setEditorMode("preview");
  setStatusText("📋 Dự án đã được tải thành công từ cơ sở dữ liệu.");
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: restore saved watermark and bgm config when loading project (Task 1)"
```

---

## Task 2: Enhance Dashboard Card Click & Navigation (`Dashboard.jsx`)

**Files:**
- Modify: `frontend/src/components/Dashboard.jsx`

**Step 1: Update project card action button in `Dashboard.jsx`**

Replace `"Open in Studio"` button with a prominent **"🎬 Mở & Chỉnh sửa Video"** button. Make clicking the card header/title navigate directly to the project workspace (`onSelectProject(project.id)`).

**Step 2: Commit**

```bash
git add frontend/src/components/Dashboard.jsx
git commit -m "feat: enhance dashboard project card click and open button navigation (Task 2)"
```

---

## Task 3: End-to-End Verification

1. Open Projects page (`Dashboard`).
2. Click "🎬 Mở & Chỉnh sửa Video" on an AI Gen project.
3. Verify video opens directly in `StudioAIGen` preview mode.
4. Change Watermark text to `@testbrand`, position to `bottom-left`. Render or save.
5. Return to Projects page ➔ Re-open project ➔ Confirm Watermark text `@testbrand` and position `bottom-left` are restored.
