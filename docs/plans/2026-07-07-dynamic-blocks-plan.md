# VDE Rich Semantic Blocks Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Upgrade the storyboard layout system to support AI-driven structured block components (subheader, logo_row, button, badge_row) dynamically styled by VDE theme tokens.

**Architecture:** 
1. Expand Gemini's prompt schema in `backend/services/ai.js` to output structured semantic block types in `points`.
2. Update the frontend `layoutResolver.ts` to parse the new structured block types while maintaining backward compatibility with legacy string-based arrays.
3. Write `SubheaderBlock`, `LogoRowBlock`, and `CTAButtonBlock` in `UIBlocks.tsx` using inline SVGs for logos and styling them dynamically using the active `vdeTokens` theme context.
4. Mount the new blocks in `DynamicLayout.tsx` for dynamic rendering.

**Tech Stack:** React, Remotion, Node.js, Express, Google Generative AI SDK, TailwindCSS-free Vanilla CSS.

---

### Task 1: Update Gemini AI Storyboard Generator prompt

**Files:**
- Modify: `backend/services/ai.js:45-88`

**Step 1: Write the updated schema and prompt constraints**

Update the schema for `points` in `backend/services/ai.js` to allow structured block objects.

```javascript
// Target replace:
          "points": [
            {
              "type": "text" | "terminal" | "metric" | "logo_row" | "badge_row" | "button" | "subheader",
              "text": "The main text content, or terminal command, or button label, or subheader label",
              "animation": "slide-up" | "scale-in" | "fade-in" | "blur-in" | "slide-left" | "slide-right",
              "delay": number,
              "logos": ["claude", "remotion", "youtube", "tiktok", "react", "nodejs", "python", "aws", "gemini", "openai"] (optional, for logo_row type),
              "badges": ["Mẹo", "AI Video"] (optional, for badge_row type),
              "value": "+85%" (optional, for metric type),
              "subtext": "tăng tốc" (optional, for metric type)
            }
          ]
```

**Step 2: Save the file changes**

**Step 3: Run syntax check**
Run: `node -c backend/services/ai.js`
Expected: Success (no syntax error)

**Step 4: Commit**
```bash
git add backend/services/ai.js
git commit -m "feat(backend): update gemini storyboard prompt to support rich semantic block schema"
```

---

### Task 2: Update Layout Parser in frontend (layoutResolver)

**Files:**
- Modify: `my-video/src/utils/layoutResolver.ts:27-116`

**Step 1: Update parsing logic**

Modify `parseSceneToComponents` in `my-video/src/utils/layoutResolver.ts` to inspect if the `pt` item has a `type` parameter. If yes, map it directly to the corresponding `UIComponentDescriptor`. If it's a legacy string or standard object without a `type` field, use the existing regex inference to preserve backward compatibility.

```typescript
      let type: "title" | "hero_metric" | "terminal" | "feature_card" | "badge_row" | "media" | "subheader" | "logo_row" | "button" = "feature_card";
      let data: any = {};

      if (pt && typeof pt === "object") {
        if (pt.type) {
          // Direct AI-driven mapping
          if (pt.type === "text") type = "feature_card";
          else type = pt.type;
          
          data = {
            text: pt.text || "",
            code: pt.text || "",
            value: pt.value || "",
            subtext: pt.subtext || "",
            badges: pt.badges || [],
            logos: pt.logos || [],
            animation,
            delay
          };
        } else {
          // Legacy object: use regex fallback
          ...
        }
      }
```

**Step 2: Save the file changes**

**Step 3: Commit**
```bash
git add my-video/src/utils/layoutResolver.ts
git commit -m "feat(frontend): update layoutResolver to support structured dynamic block objects"
```

---

### Task 3: Implement new UI Blocks in UIBlocks

**Files:**
- Modify: `my-video/src/components/layout/UIBlocks.tsx`
- Modify: `my-video/src/components/layout/AnimatedBlock.tsx`

**Step 1: Write inline SVG icons and new Block Components**

Add the following components to `my-video/src/components/layout/UIBlocks.tsx`:
1. `SubheaderBlock`: Render clean, spaced uppercase subtitle styled via VDE tokens.
2. `LogoRowBlock`: Render logo boxes (Claude, Remotion, React, etc.) side-by-side with an elegant `×` separator.
3. `CTAButtonBlock`: Render fully styled call-to-action buttons.

Add these type exports as well.

**Step 2: Save the file changes**

**Step 3: Commit**
```bash
git add my-video/src/components/layout/UIBlocks.tsx
git commit -m "feat(frontend): implement SubheaderBlock, LogoRowBlock, and CTAButtonBlock components"
```

---

### Task 4: Mount blocks in DynamicLayout

**Files:**
- Modify: `my-video/src/compositions/layouts/DynamicLayout.tsx:100-130`

**Step 1: Mount the new blocks**

Update the `switch (comp.type)` statement in `my-video/src/compositions/layouts/DynamicLayout.tsx` to handle the new block types:

```typescript
      case "subheader":
        content = <SubheaderBlock text={comp.data.text} theme={theme} accentColor={accentColor} />;
        break;
      case "logo_row":
        content = <LogoRowBlock logos={comp.data.logos} theme={theme} accentColor={accentColor} />;
        break;
      case "button":
        content = <CTAButtonBlock text={comp.data.text} theme={theme} accentColor={accentColor} />;
        break;
```

**Step 2: Save the file changes**

**Step 3: Commit**
```bash
git add my-video/src/compositions/layouts/DynamicLayout.tsx
git commit -m "feat(frontend): mount new block types in DynamicLayout renderer"
```

---

### Task 5: Mock testing and verification

**Step 1: Write a mock data config**
Modify `defaultProps` in `my-video/src/Root.tsx` to test the new blocks locally:
- Add a `subheader` block.
- Add a `logo_row` block with `["claude", "remotion"]`.
- Add a `button` block.

**Step 2: Verify in editor browser preview**
Verify that all 3 new blocks render correctly under different style selections (Claude beige style, Cyberpunk, Apple, etc.).

**Step 3: Revert mock configuration**
Restore `defaultProps` in `my-video/src/Root.tsx`.

**Step 4: Commit**
```bash
git add my-video/src/Root.tsx
git commit -m "test: verify rich semantic blocks rendering in multiple styles"
```
