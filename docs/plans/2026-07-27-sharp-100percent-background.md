# 100% Sharp Background Image Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Cập nhật toàn bộ hệ thống sinh code AI và Safety Net Fallback để hiển thị phông nền 100% độ nét nguyên bản (`opacity: 1.0`), loại bỏ hoàn toàn dải mờ nhòe và bóng ambient mờ đè lên phông nền.

**Architecture:** Điều chỉnh quy tắc `bgImageRule`, systemInstruction của Gemini và các mẫu JSX Safety Net Fallback trong `backend/services/aiGen.js`. 

**Tech Stack:** Node.js, Express, React/Remotion TSX generator, PostgreSQL.

---

### Task 1: Update bgImageRule and System Instructions in aiGen.js

**Files:**
- Modify: `backend/services/aiGen.js:1405-1415`
- Modify: `backend/services/aiGen.js:1445-1455`

**Step 1: Write implementation changes**
* Cập nhật `bgImageRule` để ép `opacity: 1.0` và chỉ thị rõ ràng cho Gemini không dùng bất kỳ hiệu ứng blur nào đè lên phông nền.
* Cập nhật `systemInstruction` cấm tuyệt đối `backdropFilter: blur(...)` và ambient orbs `filter: blur(...)` đè lên phông nền.

**Step 2: Commit**
```bash
git add backend/services/aiGen.js
git commit -m "feat(aigen): update bgImageRule and system instructions for 100% sharp background"
```

---

### Task 2: Update Safety Net Fallback Templates in aiGen.js

**Files:**
- Modify: `backend/services/aiGen.js:680-880`

**Step 1: Write implementation changes**
* Cập nhật `safetyNetProcessTimeline`, `safetyNetComparisonVersus`, `safetyNetTitleHook`, `safetyNetCodeTerminal`, và `generateGlassCardSafetyNetTSX` để đặt `opacity: 1.0` cho `bgImage`.
* Bỏ tất cả các thẻ `<div>` bóng cầu mờ `filter: "blur(80px)"` / `filter: "blur(90px)"`.

**Step 2: Commit**
```bash
git add backend/services/aiGen.js
git commit -m "feat(aigen): update safety net templates for sharp 100% background image"
```

---

### Task 3: Verify and Batch Regenerate Project Scenes

**Files:**
- Create: `backend/scratch/test_sharp_bg_generation.js`

**Step 1: Run batch generator script**
* Chạy script tái tạo lại mã nguồn các phân cảnh với quy tắc ảnh nền nét 100%.

**Step 2: Verify zero background blur in DB code**
* Kiểm tra trong DB các phân cảnh đã sinh ra để xác nhận không còn chứa `filter: "blur(80px/90px)"` đè phông nền và `opacity: 1.0`.

**Step 3: Commit**
```bash
git add backend/scratch/test_sharp_bg_generation.js
git commit -m "test(aigen): add verification script for 100% sharp background"
```
