# Mandatory Glass Cards & Glowing Background Guarantee Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Ensure all single-scene regenerations (especially `BULLET_GLASS` / `DUAL_METRIC_CARDS`) render rich glassmorphic cards and animated ambient glowing backgrounds instead of plain black screens.

**Architecture:** Update pre-processing in `generateSingleSceneCode` to auto-backfill `scene.points` from `voiceover`, and update Gemini TSX system prompt rules in `aiGen.js`.

**Tech Stack:** Node.js, Express, Gemini Prompt Engineering, Remotion/React.

---

### Task 1: Auto-Backfill Points and Update Prompt Rules in aiGen.js

**Files:**
- Modify: `backend/services/aiGen.js:710-725` (Pre-processing in `generateSingleSceneCode`)
- Modify: `backend/services/aiGen.js:470-520` (System prompt rules)

**Step 1: Add auto-backfill for `scene.points` in `generateSingleSceneCode`**

```javascript
// Auto-backfill points if missing or empty
if ((!scene.points || scene.points.length === 0) && scene.voiceover) {
  const parts = scene.voiceover.split(/[,.;?!]+/).map(s => s.trim()).filter(s => s.length > 5);
  if (parts.length > 0) {
    scene.points = parts.slice(0, 3);
  } else {
    scene.points = [scene.heading || "Điểm cốt lõi 1", "Tối ưu hiệu suất & tốc độ"];
  }
}
```

**Step 2: Update System Prompt Rules in `aiGen.js`**

Add strict rules:
```javascript
MANDATORY CARD & AMBIENT GLOW GUARANTEE:
- Never output a plain text string on a black background!
- If visualPattern is BULLET_GLASS or DUAL_METRIC_CARDS, you MUST render 2 to 3 glassmorphic cards with THEME.cardBg, THEME.border, and glass shadow.
- Ambient Background: Every scene MUST render a radial gradient background and 2 floating blurred glowing ambient orbs (zIndex: 1, filter: "blur(80px)", opacity: 0.15).
```

**Step 3: Commit**

```bash
git add backend/services/aiGen.js
git commit -m "fix(aigen): auto-backfill scene points and enforce mandatory glass cards and ambient glow"
```

### Task 2: Verify Single Scene Regeneration in Browser

**Step 1: Regenerate Scene 2 in Studio AI Gen**
Click "🔄 Sinh lại phân cảnh 2", confirm that the regenerated scene displays glassmorphic cards and ambient glowing background smoothly.
