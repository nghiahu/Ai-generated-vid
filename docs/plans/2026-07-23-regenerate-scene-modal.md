# Regenerate Scene Voice Selection Modal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement an interactive Modal dialog when clicking "Sinh lại phân cảnh" in `StudioAIGen.jsx` to let users choose and confirm the AI voiceover voice before regenerating.

**Architecture:** Create modal state variables (`showRegenModal`, `regenSceneIndex`, `regenVoice`), update `handleRegenerateSingleScene` to accept an explicit `customVoice` parameter, and render a modal component in `StudioAIGen.jsx`.

**Tech Stack:** React, JSX, Inline Styles.

---

### Task 1: Add Regenerate Scene Modal to StudioAIGen.jsx

**Files:**
- Modify: `frontend/src/components/StudioAIGen.jsx:250-260` (State definitions)
- Modify: `frontend/src/components/StudioAIGen.jsx:462-498` (`handleRegenerateSingleScene` signature)
- Modify: `frontend/src/components/StudioAIGen.jsx:1360-1375` (Modal JSX element)

**Step 1: Update `handleRegenerateSingleScene` to accept `selectedVoice`**

```javascript
const handleRegenerateSingleScene = async (index, selectedVoice = null) => {
  if (regeneratingIndex !== null || loading) return;
  const targetScene = rawScenes[index];
  if (!targetScene) return;

  const targetVoice = selectedVoice || voice;
  setRegeneratingIndex(index);
  setStatusText(`🔄 AI đang sinh lại code & giọng đọc cho phân cảnh ${index + 1}...`);
  setErrorMsg("");

  try {
    const activeProjId = projectId || localStorage.getItem("studio_aigen_project_id") || "proj_aigen_draft";
    const res = await api.generateStudioAiGenScene(
      activeProjId,
      targetScene,
      targetVoice,
      theme,
      bgImage,
      refImages
    );
    ...
```

**Step 2: Add Modal trigger handler & Render Modal JSX**

Add modal state:
```javascript
const [showRegenModal, setShowRegenModal] = useState(false);
const [regenSceneIndex, setRegenSceneIndex] = useState(null);
const [regenVoice, setRegenVoice] = useState("quanganh");
```

Add Modal JSX overlay before closing `</div>`:
```jsx
{showRegenModal && regenSceneIndex !== null && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100 }}>
    <div style={{ background: "#ffffff", width: "90%", maxWidth: "480px", borderRadius: "20px", padding: "24px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", border: "1px solid #e2e8f0" }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>
        🔄 Sinh Lại Phân Cảnh {regenSceneIndex + 1}
      </h3>
      <p style={{ fontSize: "13px", color: "#475569", marginBottom: "16px" }}>
        🗣️ "{rawScenes[regenSceneIndex]?.voiceover}"
      </p>
      <label style={{ fontSize: "13px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
        🎙️ Chọn giọng đọc AI cho phân cảnh này:
      </label>
      <select
        value={regenVoice}
        onChange={(e) => setRegenVoice(e.target.value)}
        style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13px", marginBottom: "20px" }}
      >
        <option value="quanganh">OmniVoice - Quang Anh (Offline Voice)</option>
        <option value="duythanh">OmniVoice - Duy Thanh (Offline Voice)</option>
      </select>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button
          onClick={() => setShowRegenModal(false)}
          style={{ padding: "9px 18px", borderRadius: "10px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
        >
          Hủy
        </button>
        <button
          onClick={() => {
            const idx = regenSceneIndex;
            const v = regenVoice;
            setShowRegenModal(false);
            handleRegenerateSingleScene(idx, v);
          }}
          style={{ padding: "9px 20px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff", fontWeight: 700, fontSize: "13px", cursor: "pointer", boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)" }}
        >
          🚀 Xác Nhận Sinh Lại
        </button>
      </div>
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add frontend/src/components/StudioAIGen.jsx
git commit -m "feat(studiogen): add per-scene voice selection modal on single scene regeneration"
```

### Task 2: Verify Regenerate Modal in Browser

**Step 1: Open Studio AI Gen in browser**
Click "🔄 Sinh lại" on Scene 1, select Quang Anh in the Modal, click "Xác Nhận Sinh Lại", and confirm single scene regeneration uses the selected voice.
