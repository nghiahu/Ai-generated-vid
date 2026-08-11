# Import Markdown Script Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Allow users to import `.md` and `.txt` files directly into the voiceover script editor textareas in both `StoryboardEditor` and `BatchStudioPage` without manual copy-pasting.

**Architecture:** Use the HTML5 `FileReader` API on the client-side to read locally selected text/markdown files and populate the corresponding React state hooks. Add a styled, accessible trigger button next to the script input labels with smooth CSS hover transformations and local Toast success/error feedback notifications.

**Tech Stack:** React (useRef, useState, useEffect), HTML5 FileReader API, Inline CSS styling.

---

### Task 1: [StoryboardEditor] Add File Import Logic and UI

**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Declare ref and toast state at the top of the component**
Insert `fileInputRef` and `importToast` state inside `StoryboardEditor`.
```javascript
const fileInputRef = useRef(null);
const [importToast, setImportToast] = useState(null);

useEffect(() => {
  if (importToast) {
    const timer = setTimeout(() => setImportToast(null), 3000);
    return () => clearTimeout(timer);
  }
}, [importToast]);
```

**Step 2: Add handleImportScript file reader function**
```javascript
const handleImportScript = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result || "";
    setScriptText(text);
    setImportToast({
      message: `Đã tải kịch bản: ${file.name} (${text.length} ký tự)`,
      type: "success"
    });
  };
  reader.onerror = (err) => {
    console.error("Failed to read file:", err);
    setImportToast({
      message: "Không thể đọc tệp kịch bản này.",
      type: "error"
    });
  };
  reader.readAsText(file);
  // Reset target value so the same file can be re-uploaded if modified
  e.target.value = "";
};
```

**Step 3: Render the trigger button, hidden file input, and Toast overlay in StoryboardEditor**
Modify the layout around line 1632 in the setup stage of `StoryboardEditor.jsx`.
Add input:
```jsx
<input
  type="file"
  ref={fileInputRef}
  accept=".md,.txt"
  style={{ display: "none" }}
  onChange={handleImportScript}
/>
```
Add button inside the label container:
```jsx
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  style={{
    background: "rgba(37, 99, 235, 0.08)",
    border: "1px solid rgba(37, 99, 235, 0.2)",
    borderRadius: "12px",
    padding: "4px 10px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#2563eb",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s ease"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "rgba(37, 99, 235, 0.15)";
    e.currentTarget.style.borderColor = "#2563eb";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "rgba(37, 99, 235, 0.08)";
    e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.2)";
  }}
>
  📥 Tải file kịch bản (.md/.txt)
</button>
```
Add Toast overlay at the bottom of setup mode:
```jsx
{importToast && (
  <div style={{
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: importToast.type === "success" ? "rgba(15, 23, 42, 0.95)" : "rgba(220, 38, 38, 0.95)",
    backdropFilter: "blur(8px)",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    zIndex: 99999,
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    animation: "fadeInUp 0.3s ease"
  }}>
    <span>{importToast.type === "success" ? "✅" : "❌"}</span>
    <span>{importToast.message}</span>
  </div>
)}
```

**Step 4: Verify StoryboardEditor import manual testing**
- Build/refresh UI.
- Create a new project.
- Click "Tải file kịch bản" and choose a `.md` file.
- Verify text fills the textarea correctly and Toast alerts successfully.

**Step 5: Commit changes**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: add local markdown script import to StoryboardEditor"
```

---

### Task 2: [BatchStudioPage] Add File Import Logic and UI for Slots

**Files:**
- Modify: [BatchStudioPage.jsx](file:///c:/Users/nghia/OneDrive/Máy tính/AI-grenerated vid-hyperframe/frontend/src/components/BatchStudioPage.jsx)

**Step 1: Add importToast state at the top of BatchStudioPage component**
Add state to `BatchStudioPage`:
```javascript
const [importToast, setImportToast] = useState(null);

useEffect(() => {
  if (importToast) {
    const timer = setTimeout(() => setImportToast(null), 3000);
    return () => clearTimeout(timer);
  }
}, [importToast]);
```

**Step 2: Add handleImportScriptForSlot file reader function**
```javascript
const handleImportScriptForSlot = (slotId, e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const text = event.target.result || "";
    handleSlotTextChange(slotId, text);
    setImportToast({
      message: `Đã tải kịch bản slot #${slots.findIndex(s => s.id === slotId) + 1}: ${file.name}`,
      type: "success"
    });
  };
  reader.onerror = (err) => {
    console.error("Failed to read file:", err);
    setImportToast({
      message: "Không thể đọc tệp kịch bản này.",
      type: "error"
    });
  };
  reader.readAsText(file);
  e.target.value = "";
};
```

**Step 3: Render trigger button and hidden file input in BatchStudioPage slot header**
Modify slot rendering in `BatchStudioPage.jsx` around line 512.
Add input and button in the slot header next to the index label:
```jsx
<input
  type="file"
  id={`file-input-${slot.id}`}
  accept=".md,.txt"
  style={{ display: "none" }}
  onChange={(e) => handleImportScriptForSlot(slot.id, e)}
/>
<button
  type="button"
  disabled={isRunning}
  onClick={() => document.getElementById(`file-input-${slot.id}`)?.click()}
  style={{
    background: "rgba(37, 99, 235, 0.08)",
    border: "1px solid rgba(37, 99, 235, 0.2)",
    borderRadius: "12px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "600",
    color: "#2563eb",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    marginLeft: "10px",
    transition: "all 0.2s ease",
    opacity: isRunning ? 0.5 : 1
  }}
  onMouseEnter={(e) => {
    if (!isRunning) {
      e.currentTarget.style.background = "rgba(37, 99, 235, 0.15)";
      e.currentTarget.style.borderColor = "#2563eb";
    }
  }}
  onMouseLeave={(e) => {
    if (!isRunning) {
      e.currentTarget.style.background = "rgba(37, 99, 235, 0.08)";
      e.currentTarget.style.borderColor = "rgba(37, 99, 235, 0.2)";
    }
  }}
>
  📝 Tải file MD/TXT
</button>
```
Add Toast overlay at the bottom of `BatchStudioPage`:
```jsx
{importToast && (
  <div style={{
    position: "fixed",
    bottom: "24px",
    right: "24px",
    background: importToast.type === "success" ? "rgba(15, 23, 42, 0.95)" : "rgba(220, 38, 38, 0.95)",
    backdropFilter: "blur(8px)",
    color: "#ffffff",
    padding: "12px 20px",
    borderRadius: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    zIndex: 99999,
    fontSize: "13px",
    fontFamily: "Inter, sans-serif",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    animation: "fadeInUp 0.3s ease"
  }}>
    <span>{importToast.type === "success" ? "✅" : "❌"}</span>
    <span>{importToast.message}</span>
  </div>
)}
```

**Step 4: Verify BatchStudioPage import manual testing**
- Navigate to Batch Studio.
- Click "Tải file MD/TXT" on Slot #1.
- Choose a file and verify it fills the text fields of Slot #1 only.

**Step 5: Commit changes**
```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat: add local markdown script import to BatchStudioPage slots"
```
