# Rikkei Light Theme Default Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix theme rendering so that video storyboards default to the bright Rikkei Academic (`rikkei`) theme without dark particle overlay artifacts.

**Architecture:** Update Remotion composition overlay exclusions in `MainComposition.tsx`, update token fallbacks in `vdeTokens.ts`, and set frontend project defaults in `App.jsx`.

**Tech Stack:** React, Remotion, TypeScript, JavaScript (Vite frontend).

---

### Task 1: Exclude `rikkei` theme from dark overlay effects in `MainComposition.tsx`

**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx:197-202`

**Step 1: Inspect `MainComposition.tsx`**

Verify line 199 where `hasOverlayEffects` is calculated:
```tsx
const hasOverlayEffects = vdeStyle !== "claude" && vdeStyle !== "light" && vdeStyle !== "apple";
```

**Step 2: Update `hasOverlayEffects` to include `"rikkei"`**

Change line 199 to:
```tsx
const hasOverlayEffects = vdeStyle !== "claude" && vdeStyle !== "light" && vdeStyle !== "apple" && vdeStyle !== "rikkei";
```

**Step 3: Save and verify build**

Run build or check TypeScript compilation in `my-video`:
`cd my-video && npm run build` (or verify Remotion bundle).

---

### Task 2: Update `getVDETokens` fallback to prefer `rikkei` in `vdeTokens.ts`

**Files:**
- Modify: `my-video/src/styles/vdeTokens.ts:44-56`

**Step 1: Inspect `vdeTokens.ts`**

Check lines 44-56 where default fallback tokens are resolved.

**Step 2: Update token fallback**

Change line 48 and 55 so that when `styleName` is undefined or unrecognized, it falls back to `VDE_TOKENS.rikkei || VDE_TOKENS.minimal` instead of dark `VDE_TOKENS.minimal`.

```ts
export function getVDETokens(styleName?: string): VDETokens {
  let tokens = activeCompiledTokens;
  
  if (!tokens) {
    if (!styleName) return VDE_TOKENS.rikkei || VDE_TOKENS.minimal;
    const name = styleName.toLowerCase();
    
    if (name.includes("cyberpunk") || name.includes("neon")) tokens = VDE_TOKENS.cyberpunk;
    else if (name.includes("anime") || name.includes("manga")) tokens = VDE_TOKENS.anime;
    else if (name.includes("apple") || name.includes("keynote")) tokens = VDE_TOKENS.apple;
    else if (name.includes("flat") || name.includes("vector")) tokens = VDE_TOKENS.anime;
    else tokens = VDE_TOKENS[name] || VDE_TOKENS.rikkei || VDE_TOKENS.minimal;
  }
```

---

### Task 3: Ensure Frontend project config defaults to `rikkei` in `App.jsx`

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Check project config initializers in `App.jsx`**

Ensure `currentProject.config.visualStyle` defaults to `"rikkei"` if not set.

**Step 2: Verification**

Reload frontend app, check player preview to confirm clean white background `#ffffff` and Rikkei Academic cards with `#A8232A` crimson accents.
