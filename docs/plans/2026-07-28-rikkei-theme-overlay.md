# Rikkei Theme Overlay Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Remove the dark muddy background overlay from the Rikkei theme video preview and robustify the `hexToRgb` helper function.

**Architecture:** Skip rendering the background overlay `AbsoluteFill` element in `DynamicLayout.tsx` for the Rikkei theme, and update `hexToRgb` to extract the first hex color from CSS gradient strings.

**Tech Stack:** React, Remotion, TypeScript

---

### Task 1: Fix background overlay and hexToRgb parser in DynamicLayout.tsx

**Files:**
- Modify: [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/layouts/DynamicLayout.tsx)

**Step 1: Check existing behavior**
Verify the location of the `hexToRgb` helper and the overlay `<AbsoluteFill>` inside the `renderBackground` method of `my-video/src/compositions/layouts/DynamicLayout.tsx`.

**Step 2: Update hexToRgb to support gradient strings**
Modify the `hexToRgb` helper at the top of the file:
```typescript
const hexToRgb = (hex: string): string => {
  let cleaned = hex.trim();
  if (cleaned.includes("gradient")) {
    const match = cleaned.match(/#[0-9A-Fa-f]{3,6}/);
    if (match) {
      cleaned = match[0];
    }
  }
  const c = cleaned.replace("#", "");
  if (c.length === 3) {
    const r = parseInt(c[0] + c[0], 16);
    const g = parseInt(c[1] + c[1], 16);
    const b = parseInt(c[2] + c[2], 16);
    return `${r}, ${g}, ${b}`;
  }
  if (c.length === 6) {
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  }
  return "6, 8, 19";
};
```

**Step 3: Modify overlay render condition**
In `renderBackground`, add `!isRikkei` to the overlay rendering condition:
```tsx
        {layoutType.toLowerCase() !== "blank" && !isRikkei && (
          <AbsoluteFill style={{ 
            background: overlayGradient, 
            zIndex: 1,
            mixBlendMode: isFullImageBg ? undefined : (isLight ? "multiply" : "normal")
          }} />
        )}
```

**Step 4: Commit changes**
Run:
```powershell
git add my-video/src/compositions/layouts/DynamicLayout.tsx
git commit -m "fix(rikkei-theme): remove dark overlay on background and support gradient background colors in hexToRgb"
```
