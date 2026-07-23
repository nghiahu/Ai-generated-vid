# Per-Scene Regenerate Button Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add single-click scene regenerate buttons to both the scene card list and the player preview header in `StudioAIGen.jsx`.

**Architecture:** Wire `handleRegenerateSingleScene(idx)` to interactive buttons rendered on left-column scene cards and right-column preview player controls, managing loading and disabled states gracefully.

**Tech Stack:** React, JSX, Inline Styles.

---

### Task 1: Add Regenerate Buttons to StudioAIGen.jsx

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:1175-1215` (Scene cards list)
- Modify: `frontend/src/components/StudioAIGen.jsx:1270-1285` (Preview header bar)

**Step 1: Add `🔄 Sinh lại` button to each scene card header in left column**

```jsx
<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      handleRegenerateSingleScene(idx);
    }}
    disabled={regeneratingIndex !== null || loading}
    style={{
      padding: "3px 10px",
      borderRadius: "14px",
      background: regeneratingIndex === idx ? "#cbd5e1" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      border: "none",
      fontSize: "11px",
      fontWeight: 700,
      cursor: regeneratingIndex !== null || loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: "4px"
    }}
  >
    {regeneratingIndex === idx ? "⏳ Đang sinh lại..." : "🔄 Sinh lại"}
  </button>
  <span style={{
    padding: "4px 12px",
    borderRadius: "999px",
    background: badge.bg,
    border: `1px solid ${badge.border}`,
    color: badge.text,
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.05em"
  }}>
    {sc.visualPattern || "CUSTOM"}
  </span>
</div>
```

**Step 2: Add `🔄 Sinh lại phân cảnh này` button to preview header toolbar in right column**

```jsx
{previewType === "SCENE" && currentScene && (
  <button
    type="button"
    onClick={() => handleRegenerateSingleScene(activeSceneIndex)}
    disabled={regeneratingIndex !== null || loading}
    style={{
      padding: "6px 14px",
      borderRadius: "20px",
      background: regeneratingIndex === activeSceneIndex ? "#cbd5e1" : "linear-gradient(135deg, #2563eb, #1d4ed8)",
      color: "#ffffff",
      border: "none",
      fontSize: "12px",
      fontWeight: 700,
      cursor: regeneratingIndex !== null || loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
    }}
  >
    {regeneratingIndex === activeSceneIndex ? "⏳ Đang sinh lại..." : "🔄 Sinh lại phân cảnh này"}
  </button>
)}
```

**Step 3: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat(studiogen): add per-scene regenerate buttons to scene cards and preview header"
```

### Task 2: Verify Single-Scene Regeneration in Browser

**Step 1: Check StudioAIGen interface in browser**
Verify buttons appear on scene cards and preview header, and clicking triggers single scene regeneration.
