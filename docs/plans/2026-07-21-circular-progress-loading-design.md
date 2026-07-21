# Design Document: Circular Progress Ring & Phase Steps Loading UI

**Date:** 2026-07-21  
**Status:** Approved  
**Target File:** `frontend/src/components/StoryboardEditor.jsx`

---

## 1. Overview & Problem Statement
Currently, when a user clicks "Tạo Storyboard", a simple black spinning circle with generic text loading is displayed. This feels plain and doesn't provide visual feedback on the multi-step AI generation process (script analysis, layout assignment, voiceover synthesis).

---

## 2. Technical Solution

### 2.1 SVG Circular Progress Ring Component
- Render an SVG circular ring (120px x 120px) with:
  - Background track (`rgba(15, 23, 42, 0.08)`).
  - Gradient progress arc (`strokeDasharray` / `strokeDashoffset`) animated dynamically from 0% to 100%.
  - Central percentage text (e.g. `45%`) with bold modern typography.

### 2.2 Dynamic Progressive Phase Increments
- Simulate realistic step progression during generation:
  - **0% - 30%**: `Phân tích kịch bản & trích xuất ý chính...`
  - **30% - 70%**: `Lựa chọn Layout & áp dụng phong cách thiết kế...`
  - **70% - 95%**: `Tải quy chuẩn phân cảnh & phối hợp giọng đọc...`
  - **95% - 100%**: `Hoàn tất không gian biên tập Storyboard...`

---

## 3. Verification Plan
- Click "Tạo Storyboard" in Setup mode.
- Verify smooth circular progress ring with gradient arc and centered percentage text.
- Verify dynamic step phase label transitions.
