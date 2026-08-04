# Batch Studio Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Xây dựng trang "Hàng loạt" cho phép nhập nhiều kịch bản Studio và chạy tuần tự để tạo nhiều dự án video cùng lúc.

**Architecture:** Tạo component `BatchStudioPage.jsx` mới, render thay thế placeholder hiện tại trong `App.jsx`. Component quản lý state danh sách `scriptSlots[]`, xử lý async sequential với `api.createProject` + `api.updateProjectConfig` + `api.generateStoryboard`, và tái sử dụng `SidebarConfig` cho Video Setup dùng chung.

**Tech Stack:** React (hooks), Axios (qua api.js), SidebarConfig component, không cần backend mới.

---

## Task 1: Tạo BatchStudioPage component skeleton

**Files:**
- Create: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Tạo file với state cơ bản và layout 2 cột**

```jsx
import React, { useState, useCallback } from "react";
import { SidebarConfig } from "./SidebarConfig";
import { api } from "../services/api";

const generateId = () => Math.random().toString(36).slice(2, 9);

const createEmptySlot = () => ({
  id: generateId(),
  text: "",
  status: "idle", // "idle" | "pending" | "running" | "done" | "error"
  projectName: null,
  error: null,
});

export const BatchStudioPage = ({ sharedConfig, onConfigChange, onBatchComplete }) => {
  const [slots, setSlots] = useState([createEmptySlot()]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleAddSlot = () => setSlots(prev => [...prev, createEmptySlot()]);

  const handleRemoveSlot = (id) => setSlots(prev => prev.filter(s => s.id !== id));

  const handleSlotTextChange = (id, text) =>
    setSlots(prev => prev.map(s => s.id === id ? { ...s, text } : s));

  const updateSlot = (id, updates) =>
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

  const handleRunBatch = useCallback(async () => {
    const activeSlots = slots.filter(s => s.text.trim());
    if (!activeSlots.length) return;

    setIsRunning(true);
    setProgress({ current: 0, total: activeSlots.length });

    // Mark all active as pending
    setSlots(prev => prev.map(s =>
      activeSlots.find(a => a.id === s.id) ? { ...s, status: "pending" } : s
    ));

    for (let i = 0; i < activeSlots.length; i++) {
      const slot = activeSlots[i];
      setProgress({ current: i + 1, total: activeSlots.length });
      updateSlot(slot.id, { status: "running" });

      try {
        // 1. Create project (title from first line of script)
        const firstLine = slot.text.trim().split("\n")[0];
        const title = firstLine.length > 40 ? firstLine.slice(0, 37) + "..." : firstLine;
        const newProj = await api.createProject(title || `Batch Video #${i + 1}`);

        // 2. Apply shared config
        await api.updateProjectConfig(newProj.id, sharedConfig);

        // 3. Generate storyboard
        const visualStyle = sharedConfig.visualStyle || "minimal";
        const traits = sharedConfig.traits || [];
        await api.generateStoryboard(newProj.id, slot.text, visualStyle, traits, []);

        updateSlot(slot.id, { status: "done", projectName: title });
      } catch (err) {
        updateSlot(slot.id, {
          status: "error",
          error: err?.response?.data?.error || err.message || "Lỗi không xác định"
        });
      }
    }

    setIsRunning(false);
    // Navigate back after 2s
    setTimeout(() => onBatchComplete(), 2000);
  }, [slots, sharedConfig, onBatchComplete]);

  // ---- RENDER ----
  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Left: Script slots */}
      {/* Right: SidebarConfig */}
    </div>
  );
};
```

**Step 2: Verify file tồn tại và không có lỗi cú pháp nghiêm trọng**

Kiểm tra file được tạo ra tại `frontend/src/components/BatchStudioPage.jsx`.

**Step 3: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat(batch): scaffold BatchStudioPage component with state and batch run logic"
```

---

## Task 2: Implement UI render của BatchStudioPage

**Files:**
- Modify: `frontend/src/components/BatchStudioPage.jsx`

**Step 1: Thay phần `{/* ---- RENDER ---- */}` bằng layout đầy đủ**

Thay `return (...)` bằng code sau:

```jsx
  const validCount = slots.filter(s => s.text.trim()).length;

  const getStatusBadge = (slot) => {
    const baseStyle = {
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "4px 12px", borderRadius: "999px", fontSize: "12px",
      fontWeight: "600", fontFamily: "Inter"
    };
    if (slot.status === "idle") return null;
    if (slot.status === "pending") return (
      <span style={{ ...baseStyle, background: "rgba(100,116,139,0.1)", color: "#64748b" }}>⏳ Đang chờ</span>
    );
    if (slot.status === "running") return (
      <span style={{ ...baseStyle, background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>🔄 Đang xử lý...</span>
    );
    if (slot.status === "done") return (
      <span style={{ ...baseStyle, background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>✅ Xong — "{slot.projectName}"</span>
    );
    if (slot.status === "error") return (
      <span style={{ ...baseStyle, background: "rgba(220,38,38,0.1)", color: "#dc2626" }}>❌ Lỗi: {slot.error}</span>
    );
    return null;
  };

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* ── Left: Script list ── */}
      <div className="custom-scrollbar" style={{
        flex: 1, overflowY: "auto", padding: "30px",
        boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "0"
      }}>
        {/* Header */}
        <div style={{ marginBottom: "24px", borderBottom: "2px solid #000", paddingBottom: "15px" }}>
          <h2 style={{
            fontSize: "24px", fontFamily: "Space Grotesk", fontWeight: "bold",
            color: "#000", textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0
          }}>Sản xuất Hàng loạt</h2>
          <p style={{ fontSize: "13px", fontFamily: "Inter", color: "#555", marginTop: "4px", marginBottom: 0 }}>
            Nhập nhiều kịch bản — hệ thống sẽ tự tạo từng video Studio tuần tự
          </p>
        </div>

        {/* Slot list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {slots.map((slot, idx) => (
            <div key={slot.id} style={{
              border: slot.status === "running"
                ? "2px solid #2563eb"
                : slot.status === "done"
                  ? "2px solid #16a34a"
                  : slot.status === "error"
                    ? "2px solid #dc2626"
                    : "2px solid #000",
              borderRadius: "12px", padding: "20px",
              backgroundColor: slot.status === "done" ? "rgba(22,163,74,0.02)" : "#fff",
              transition: "border-color 0.3s ease"
            }}>
              {/* Slot header */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: "12px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{
                    fontSize: "11px", fontFamily: "Space Mono", fontWeight: "bold",
                    letterSpacing: "0.08em", color: "#888", textTransform: "uppercase"
                  }}>#{idx + 1}</span>
                  {getStatusBadge(slot)}
                </div>
                {slots.length > 1 && !isRunning && (
                  <button
                    onClick={() => handleRemoveSlot(slot.id)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontSize: "18px", color: "#aaa", padding: "0 4px", lineHeight: 1
                    }}
                    title="Xóa kịch bản này"
                  >✕</button>
                )}
              </div>

              {/* Textarea */}
              <textarea
                value={slot.text}
                onChange={(e) => handleSlotTextChange(slot.id, e.target.value)}
                disabled={isRunning}
                placeholder={`Kịch bản #${idx + 1}. Ví dụ: Thiền định không chỉ là ngồi yên...`}
                className="form-input-mono"
                style={{
                  width: "100%", minHeight: "140px", padding: "14px",
                  fontSize: "14px", resize: "vertical", lineHeight: "1.6",
                  fontFamily: "Inter", boxSizing: "border-box",
                  opacity: isRunning ? 0.7 : 1
                }}
              />
            </div>
          ))}
        </div>

        {/* Add slot button */}
        {!isRunning && (
          <button
            onClick={handleAddSlot}
            style={{
              marginTop: "16px", padding: "12px 24px", borderRadius: "30px",
              border: "1.5px dashed rgba(15,23,42,0.25)", background: "transparent",
              fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)",
              cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
              transition: "all 0.2s ease", width: "fit-content"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "var(--color-primary)";
              e.currentTarget.style.color = "var(--color-primary)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "rgba(15,23,42,0.25)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            + Thêm kịch bản
          </button>
        )}

        {/* Progress bar */}
        {isRunning && (
          <div style={{
            marginTop: "24px", padding: "16px 20px",
            background: "rgba(37,99,235,0.05)", borderRadius: "10px",
            border: "1px solid rgba(37,99,235,0.15)"
          }}>
            <p style={{
              margin: 0, fontSize: "14px", fontWeight: "600",
              color: "#2563eb", fontFamily: "Inter"
            }}>
              🔄 Đang xử lý {progress.current} / {progress.total} kịch bản...
            </p>
            {/* Simple progress track */}
            <div style={{
              marginTop: "10px", height: "4px", borderRadius: "999px",
              background: "rgba(37,99,235,0.15)", overflow: "hidden"
            }}>
              <div style={{
                height: "100%", borderRadius: "999px", background: "#2563eb",
                width: `${(progress.current / progress.total) * 100}%`,
                transition: "width 0.5s ease"
              }} />
            </div>
          </div>
        )}

        {/* Run button */}
        <div style={{ marginTop: "24px", borderTop: "1px solid rgba(15,23,42,0.08)", paddingTop: "20px" }}>
          <button
            className="btn-mono btn-mono-primary"
            onClick={handleRunBatch}
            disabled={isRunning || validCount === 0}
            style={{
              padding: "14px 36px", borderRadius: "30px",
              fontSize: "15px", fontWeight: "bold",
              letterSpacing: "0.03em", opacity: (isRunning || validCount === 0) ? 0.5 : 1,
              cursor: (isRunning || validCount === 0) ? "not-allowed" : "pointer"
            }}
          >
            {isRunning ? "⏳ Đang chạy..." : `▶ Tạo tất cả ${validCount > 0 ? validCount : ""} kịch bản 🪄`}
          </button>
        </div>
      </div>

      {/* ── Right: Video Setup (SidebarConfig) ── */}
      <div style={{
        flex: "0 0 380px", borderLeft: "1px solid rgba(15,23,42,0.08)",
        overflowY: "auto"
      }}>
        <SidebarConfig config={sharedConfig} onChange={onConfigChange} />
      </div>
    </div>
  );
```

**Step 2: Verify toàn bộ component đóng mở đúng (không sót dấu ngoặc)**

Chạy `npx --yes acorn --ecma2020 --module frontend/src/components/BatchStudioPage.jsx` hoặc chỉ cần xem lại file.

**Step 3: Commit**

```bash
git add frontend/src/components/BatchStudioPage.jsx
git commit -m "feat(batch): implement BatchStudioPage full UI — slot list, status badges, run button"
```

---

## Task 3: Kết nối BatchStudioPage vào App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Thêm import BatchStudioPage vào đầu file (sau các import hiện có)**

Tại dòng 7 (sau `import { StudioAIGen }...`), thêm:
```jsx
import { BatchStudioPage } from "./components/BatchStudioPage";
```

**Step 2: Thay placeholder BATCH bằng component thực**

Tìm đoạn (khoảng dòng 614–618):
```jsx
) : view === "BATCH" ? (
  <div style={{ padding: "50px 40px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%" }}>
    <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>Sản xuất video Hàng loạt</h2>
    <p style={{ color: "var(--text-secondary)", fontSize: "16px" }}>Chức năng sản xuất hàng loạt video cùng lúc đang được phát triển.</p>
  </div>
```

Thay bằng:
```jsx
) : view === "BATCH" ? (
  <BatchStudioPage
    sharedConfig={draftConfig}
    onConfigChange={setDraftConfig}
    onBatchComplete={async () => {
      await fetchProjects();
      setView("PROJECTS");
    }}
  />
```

**Step 3: Reload browser và kiểm tra trang Hàng loạt hiển thị đúng**

- Nhấn vào "Hàng loạt" trong sidebar
- Kiểm tra hiện ra layout 2 cột: danh sách kịch bản (trái) + Video Setup (phải)
- Nút "+ Thêm kịch bản" hoạt động
- Nút "✕ Xóa" ẩn khi chỉ có 1 ô

**Step 4: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat(batch): wire BatchStudioPage into App.jsx BATCH view"
```

---

## Task 4: Test end-to-end batch run

**Step 1: Manual test luồng chạy**

1. Mở trang "Hàng loạt"
2. Nhập kịch bản vào ô #1 (bất kỳ đoạn văn > 20 từ)
3. Nhấn "+ Thêm kịch bản", nhập kịch bản #2
4. Nhấn "▶ Tạo tất cả 2 kịch bản"
5. Quan sát: ô #1 → 🔄 Đang xử lý → ✅ Xong, rồi ô #2 → 🔄 → ✅
6. Sau 2 giây → tự chuyển về trang Dự án
7. Kiểm tra trang Dự án có 2 dự án mới vừa tạo

**Step 2: Test error handling**

1. Nhập kịch bản hợp lệ vào ô #1
2. Ô #2 để trống → nút chỉ hiển thị "1 kịch bản" (slot trống bị lọc bỏ)

**Step 3: Commit final**

```bash
git add .
git commit -m "feat(batch): complete Batch Studio production feature"
```

---

## Verification Checklist

- [ ] Trang "Hàng loạt" không còn là placeholder
- [ ] Có thể thêm/xóa ô kịch bản
- [ ] Nút Run disabled khi không có slot hợp lệ
- [ ] Trạng thái từng slot cập nhật đúng khi chạy
- [ ] Progress bar hiển thị X/Y đúng
- [ ] Sau khi xong → về trang Dự án, có đủ project mới
- [ ] SidebarConfig bên phải hoạt động đúng (thay đổi config)
- [ ] Nếu 1 slot lỗi → slot tiếp theo vẫn chạy tiếp
