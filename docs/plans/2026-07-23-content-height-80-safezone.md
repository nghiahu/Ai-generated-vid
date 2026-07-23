# Content 80% Height Constraint Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Enforce strict 78%-80% top height boundary on all scene content cards and TSX components, guaranteeing a clean 20%-22% bottom safe zone for subtitles.

**Architecture:** Apply a `maxHeight: "78%"` structural CSS wrapper in `AICodeLayout.tsx` and update LLM prompt rules in `aiGen.js` to clamp card heights (`maxHeight: "950px"`).

**Tech Stack:** React, Remotion, CSS Flexbox/Grid, Gemini Prompt Engineering.

---

### Task 1: Update AICodeLayout.tsx with 78% Height Structural Wrapper Clamp

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/AICodeLayout.tsx:30-46`

**Step 1: Wrap dangerouslySetInnerHTML container in a 78% height clamp wrapper**

```tsx
  return (
    <AbsoluteFill style={{ width: "100%", height: "100%", overflow: "hidden" }}>
      {renderBackground()}
      {/* Structural 78% Height Clamp Container to protect bottom 22% Subtitle Safe Zone */}
      <div 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "78%",
          maxHeight: "1497px",
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 10
        }}
      >
        <div 
          style={themeVariables}
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      </div>
    </AbsoluteFill>
  );
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/modes/AICodeLayout.tsx
git commit -m "fix(layout): clamp AICodeLayout content container to top 78% height to preserve bottom subtitle safe zone"
```

### Task 2: Update AI System Prompt Rules in aiGen.js

**Files:**
- Modify: `backend/services/aiGen.js:510-530`

**Step 1: Update prompt rules in `aiGen.js`**

Enforce `maxHeight: "76%"` / `paddingBottom: "22%"` container rules and card height limits (`maxHeight: "950px"`):

```javascript
9. Prevent Overlaps & Layering (CRITICAL - 80% TOP BOUNDARY RULE):
   - Content Height Constraint: All main visual content (headings, badges, cards, split columns, terminal boxes) MUST fit within the TOP 78% of the viewport (y = 0 to 1497px). The bottom 22% (y = 1498px to 1920px) is strictly reserved for subtitles.
   - Force Vertical Centering Container: Wrap all core visual components inside a single vertical Flexbox wrapper:
     * Style pattern: `display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "78%", maxHeight: "1497px", padding: "60px 60px 0 60px", boxSizing: "border-box", zIndex: 10`
   - Card/Panel Limits: All cards, columns, and grid items MUST use `maxHeight: "920px"` (never unconstrained `height: "100%"` that bleeds past y = 1497px).
```

**Step 2: Commit**

```bash
git add backend/services/aiGen.js
git commit -m "fix(aigen): enforce strict 78% top height boundary and 920px card limit in LLM prompt rules"
```

### Task 3: Verify Layout Clamping in Browser

**Step 1: Check generated scenes in browser**
Verify that all generated content stays strictly inside the top 78% height area and subtitles display cleanly in the bottom 22% safe space.
