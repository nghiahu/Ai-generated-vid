# Design Document: Regenerate Scene Voice Selection Modal in Studio AI Gen

**Date**: 2026-07-23  
**Status**: Proposed / Approved  

---

## 1. Overview & User Goal

When users click the **"🔄 Sinh lại"** button on any scene card or player preview header in `StudioAIGen.jsx`, instead of immediately starting regeneration with default parameters, open an interactive **Regenerate Scene Modal**.

This allows the user to explicitly select or change the target voiceover voice (e.g., Duy Thanh or Quang Anh) and confirm parameters before AI regenerates the scene.

---

## 2. Proposed UI/UX Architecture

### Component: `StudioAIGen.jsx`

#### 1. Modal State Management
- Add state variables:
  - `showRegenModal` (boolean): Controls modal visibility.
  - `regenSceneIndex` (number | null): The index of the scene to regenerate.
  - `regenVoice` (string): Selected voice for this single-scene regeneration (`"quanganh"` or `"duythanh"`).

#### 2. Trigger Action
- Clicking **"🔄 Sinh lại"** on scene card or player header opens the modal:
  ```javascript
  setRegenSceneIndex(index);
  setRegenVoice(voice); // defaults to current project voice
  setShowRegenModal(true);
  ```

#### 3. Modal Dialog Interface
- Header: `🔄 Sinh Lại Phân Cảnh [N]`
- Body:
  - **Phân cảnh**: Heading & Voiceover preview text.
  - **Giọng đọc AI (Voiceover)**: Dropdown / Selectable Radio Cards:
    - 🎙️ OmniVoice - Quang Anh (Offline Voice)
    - 🎙️ OmniVoice - Duy Thanh (Offline Voice)
- Footer Buttons:
  - `Hủy` (Closes modal without action)
  - `🚀 Xác Nhận Sinh Lại` (Calls `handleRegenerateSingleScene(regenSceneIndex, regenVoice)` and closes modal)

---

## 3. Verification Plan

### Manual Verification
1. Click **"🔄 Sinh lại"** on Scene 1.
2. Confirm the Modal popup opens.
3. Switch voice selection to **Quang Anh**.
4. Click **"🚀 Xác Nhận Sinh Lại"**.
5. Verify backend receives `voiceKey = "quanganh"` and scene audio is generated using Quang Anh's voice.
