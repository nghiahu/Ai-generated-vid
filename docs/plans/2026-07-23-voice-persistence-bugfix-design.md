# Design Document: Voice Selection Persistence Bugfix in Studio AI Gen

**Date**: 2026-07-23  
**Status**: Proposed / Approved  

---

## 1. Overview & Root Cause

When a user selects **Quang Anh** (`voice = "quanganh"`) and generates a video in `StudioAIGen.jsx`, the selected voice parameter was missing from `localStorage` caching and session restoration logic.

As a result:
1. On page reloads or when navigating preview mode, `voice` state silently reverted to the default state `"duythanh"`.
2. When the user clicked **"Sinh lại phân cảnh"**, `handleRegenerateSingleScene` passed the reset `voice` state (`"duythanh"`), causing the backend to regenerate Scene 1 using **Duy Thanh**'s voice instead of **Quang Anh**.

---

## 2. Proposed Solution

### Component: `StudioAIGen.jsx`

1. **Persist `voice` in `localStorage`**:
   - Save `localStorage.setItem("studio_aigen_voice", voice)` whenever `voice` is changed or when a video storyboard is generated.
2. **Restore `voice` from `localStorage` / DB**:
   - On component mount, restore `cachedVoice = localStorage.getItem("studio_aigen_voice")` if available.
   - When loading an existing project from the database, ensure `setVoice(proj.config.voiceKey || "duythanh")` is applied.
3. **Session Reset Cleanup**:
   - Clean up `localStorage.removeItem("studio_aigen_voice")` when resetting a session.

---

## 3. Verification Plan

### Manual Verification
1. Select "OmniVoice - Quang Anh" in the settings.
2. Generate a video storyboard.
3. Refresh the page or click **"Sinh lại phân cảnh 1"**.
4. Confirm that the voice remains **Quang Anh** (`voiceKey = "quanganh"`) without reverting to Duy Thanh.
