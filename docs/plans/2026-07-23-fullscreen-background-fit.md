# Fullscreen Background Height Fix Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Fix background image and mode container height truncation so scene backgrounds expand to full 100% height (1080x1920) without white bottom gaps.

**Architecture:** Update `DynamicLayout.tsx` background image rendering from `objectFit: "contain"` to `objectFit: "cover"`, and adjust mode containers like `HustXRikkeiMode.tsx` and contrast overlay divs in `TemplateLayout.tsx` to expand full-bleed across 100% viewport height (`inset: 0`).

**Tech Stack:** React, Remotion, CSS Flexbox/Absolute Positioning.

---

### Task 1: Update Background Image Scaling in DynamicLayout.tsx

**Files:**
- Modify: `my-video/src/compositions/layouts/DynamicLayout.tsx:138-153`

**Step 1: Update background image CSS objectFit**

Change `objectFit: "contain"` to `objectFit: "cover"` in `DynamicLayout.tsx`:

```tsx
        {/* Sharp foreground image centered and fit perfectly */}
        <img 
          src={bgImgUrl} 
          style={{ 
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%", 
            height: "100%", 
            objectFit: "cover", 
            opacity: imageOpacity, 
            filter: imageFilter,
            transform: isRikkei ? "none" : `scale(${imageScale})` 
          }} 
          alt="Scene Background"
        />
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/DynamicLayout.tsx
git commit -m "fix(layout): change background image objectFit from contain to cover for full height fill"
```

### Task 2: Remove Hardcoded Container Heights in Mode Renderers

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/HustXRikkeiMode.tsx:75-91`

**Step 1: Update HustXRikkeiMode background container style**

Change `height: "1621px"` to `height: "100%"`:

```tsx
      {/* 1. Blank background template aligned to fill 100% width and height */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0
      }}>
        <img
          src={staticFile("hust_x_rikkei_bg.jpg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt="HUST X RIKKEI Background"
        />
      </div>
```

**Step 2: Commit**

```bash
git add my-video/src/compositions/layouts/modes/HustXRikkeiMode.tsx
git commit -m "fix(mode): expand HustXRikkeiMode background wrapper height to 100%"
```

### Task 3: Verify Canvas Coverage in Master Preview

**Files:**
- Verify: Preview Scene 1 in MasterPlayer

**Step 1: Run dev server or check running Remotion Master Player**
Verify background covers 100% height (1080x1920) without white gaps.
