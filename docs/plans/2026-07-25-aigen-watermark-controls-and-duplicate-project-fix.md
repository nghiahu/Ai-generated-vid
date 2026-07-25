# Watermark Controls UI & Duplicate Project Fix — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Provide full UI controls in Studio AI Gen for watermark customization (toggle, custom text, position selector) and eliminate duplicate 6-second ghost draft projects when creating AI videos.

**Architecture:** Add a Watermark Settings section in `StudioAIGen.jsx` sidebar/toolbar, bind its config to the Remotion player props and saved project config, and unify project ID creation between `App.jsx` and `studioAiGenRoute.js` so only 1 project row is created in DB.

**Tech Stack:** React, Tailwind / Inline CSS, Express, PostgreSQL / `db.js`.

---

## Task 1: Add Watermark Control Panel UI (`StudioAIGen.jsx`)

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx`

**Step 1: Add watermark state and handlers in `StudioAIGen.jsx`**

Add `watermarkConfig` state:
```javascript
const [watermarkConfig, setWatermarkConfig] = useState({
  enabled: true,
  text: "yupclip.com",
  position: "top-right",
  color: "#ffffff"
});
```

**Step 2: Render Watermark Control Panel in Studio AI Gen Sidebar / Settings Bar**

Add a collapsible or inline UI panel for Watermark under the Video Theme / Config section:
```jsx
<div className="watermark-settings-box" style={{ background: "rgba(15, 23, 42, 0.6)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.1)", marginBottom: "16px" }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
    <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
      🛡️ Logo / Text Watermark
    </span>
    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#93c5fd", fontSize: "13px" }}>
      <input
        type="checkbox"
        checked={watermarkConfig.enabled}
        onChange={(e) => setWatermarkConfig(prev => ({ ...prev, enabled: e.target.checked }))}
      />
      <span>Hiển thị</span>
    </label>
  </div>

  {watermarkConfig.enabled && (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div>
        <label style={{ display: "block", color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", marginBottom: "4px" }}>Chữ Watermark</label>
        <input
          type="text"
          value={watermarkConfig.text}
          onChange={(e) => setWatermarkConfig(prev => ({ ...prev, text: e.target.value }))}
          placeholder="yupclip.com hoặc @tên_kênh"
          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#fff", fontSize: "13px" }}
        />
      </div>
      <div>
        <label style={{ display: "block", color: "rgba(255, 255, 255, 0.7)", fontSize: "12px", marginBottom: "4px" }}>Vị trí hiển thị</label>
        <select
          value={watermarkConfig.position}
          onChange={(e) => setWatermarkConfig(prev => ({ ...prev, position: e.target.value }))}
          style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", background: "rgba(0, 0, 0, 0.4)", border: "1px solid rgba(255, 255, 255, 0.15)", color: "#fff", fontSize: "13px" }}
        >
          <option value="top-right">Góc Trên - Phải</option>
          <option value="top-left">Góc Trên - Trái</option>
          <option value="bottom-right">Góc Dưới - Phải</option>
          <option value="bottom-left">Góc Dưới - Trái</option>
          <option value="bottom-center">Góc Dưới - Giữa</option>
        </select>
      </div>
    </div>
  )}
</div>
```

**Step 3: Pass `watermarkConfig` into Remotion Player inputProps and project config save payload**

In Player `inputProps`:
```javascript
inputProps={{
  scenes: rawScenes,
  config: {
    voice,
    backgroundMusic: "Chill Lofi Beats",
    watermark: watermarkConfig,
    visualStyle: theme
  }
}}
```

In `handleRenderVideo` and `handleSaveConfig`:
Include `watermarkConfig` inside `config.watermark`.

**Step 4: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat: add watermark control panel UI in Studio AI Gen (Task 1)"
```

---

## Task 2: Eliminate Duplicate Ghost Project Creation (`App.jsx` & `studioAiGenRoute.js`)

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `backend/routes/studioAiGenRoute.js`

**Step 1: Stop `App.jsx` from calling `api.createProject` when launching Studio AI Gen**

In `App.jsx`, locate where `api.createProject` is triggered on navigation to Studio AI Gen or Auto-Create, and skip project creation for Studio AI Gen until the user actually generates scenes.

**Step 2: Unify project ID in `studioAiGenRoute.js`**

In `studioAiGenRoute.js`, ensure `/plan` and `/generate` reuse `projectId` passed in body or generate a single consistent ID, saving directly to `projects` table without spawning duplicate draft rows.

**Step 3: Commit**

```bash
git add frontend/src/App.jsx backend/routes/studioAiGenRoute.js
git commit -m "fix: eliminate duplicate ghost 6-second project creation (Task 2)"
```

---

## Task 3: End-to-End Verification

1. Verify Watermark UI appears in Studio AI Gen sidebar.
2. Edit watermark text to `@mychannel`, set position to `bottom-left`. Confirm Remotion player preview updates live.
3. Click Generate Video ➔ Go to Projects page ➔ Confirm ONLY 1 project is listed (zero 6s draft ghost projects).
