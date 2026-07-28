# Rikkei Theme Visual Brand Upgrade Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Recreate the full high-end Rikkei Edu visual brand identity (Crimson Red palette, clean gradient backgrounds, bracket titles, high-contrast checkmark bullet cards, solid crimson buttons, search callouts, safe-zone subtitles) in the Remotion video composition without hardcoding brand text.

**Architecture:** Update central VDE style tokens and override rules, enhance layout renderers (`BeforeAfterPanelMode`, `VerticalListMode`, `CenteredTextMode`), and set subtitle safe margins.

**Tech Stack:** React, Remotion, TypeScript, CSS-in-JS.

---

### Task 1: Update Theme Tokens & Base Theme Styles

**Files:**
- Modify: `my-video/src/styles/vde_themes.json`
- Modify: `my-video/src/styles/vdeTokens.ts`
- Modify: `my-video/src/styles/themes.ts`

**Step 1: Update `vde_themes.json` for Rikkei Academic Premium**
Update `rikkei` entry with Crimson Red accent `#A8232A`, gradient background `linear-gradient(135deg, #FFFFFF 0%, #FFF2F4 50%, #FFE6E9 100%)`, card background `linear-gradient(135deg, #FFFFFF 0%, #FFF8F8 100%)`, border `1.5px solid rgba(168, 35, 42, 0.18)`, and soft crimson shadow `0 10px 30px rgba(168, 35, 42, 0.08)`.

**Step 2: Add static overrides in `vdeTokens.ts`**
In `getVDETokens`, handle `name.includes("rikkei")` to enforce high contrast Crimson Red tokens and crisp borders.

**Step 3: Update `themes.ts` title and card styling**
Ensure `getThemeStyles` applies Crimson Red styling, Be Vietnam Pro font, uppercase letter spacing, and card border rules for Rikkei theme.

**Step 4: Verify token loading**
Run a test or check bundle to confirm `getVDETokens("rikkei")` returns the updated tokens.

**Step 5: Commit Task 1**
Commit changes to git.

---

### Task 2: Enhance Comparison Layout (`BeforeAfterPanelMode.tsx`)

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/BeforeAfterPanelMode.tsx`

**Step 1: Implement high-contrast checkmark (`✓`) and cross (`✕`) icons**
Add bullet icon rendering for comparison cards: left card (Trướс đây / cũ) gets soft red cross `✕`, right card (Sau này / mới) gets solid Crimson Red checkmark `✓`.

**Step 2: Upgrade VS Badge**
Change the middle VS badge from plain flat circle to Crimson Red gradient circle `linear-gradient(135deg, #B8191C 0%, #E62B32 100%)` with white bold text and soft red glow shadow.

**Step 3: Enhance Card Background & Border**
Set right card to feature a prominent Crimson Red border (`2px solid #A8232A`) and subtle light pink background glow.

**Step 4: Verify rendering**
Confirm layout compiles cleanly without TypeScript errors.

**Step 5: Commit Task 2**
Commit changes to git.

---

### Task 3: Enhance Vertical List Layout & Title Brackets

**Files:**
- Modify: `my-video/src/compositions/layouts/modes/VerticalListMode.tsx`
- Modify: `my-video/src/compositions/layouts/modes/CenteredTextMode.tsx`

**Step 1: Update Vertical List Number Badges**
In `VerticalListMode.tsx`, style number badges (`01`, `02`, `03`) as solid Crimson Red circles with white bold text (`font-weight: 900`).

**Step 2: Add Bracket Header option in `CenteredTextMode.tsx`**
When `theme === "rikkei"`, render visual brackets `[ ` ... ` ]` framing the main title text in Crimson Red.

**Step 3: Commit Task 3**
Commit changes to git.

---

### Task 4: Fix Subtitle Safe Area Margin

**Files:**
- Modify: `my-video/src/components/atoms/VideoAtoms.tsx`

**Step 1: Update Subtitle positioning**
Adjust bottom offset of subtitle container to `bottom: 90px` or `marginBottom: 75px` so subtitle text never overlaps with player controls.

**Step 2: Add translucent pill backdrop**
Add `backgroundColor: "rgba(0, 0, 0, 0.7)"`, `borderRadius: "12px"`, `padding: "6px 16px"` to ensure crisp readability against light backgrounds.

**Step 3: Commit Task 4**
Commit changes to git.

---

### Task 5: Final Build & Verification

**Files:**
- Verify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Test build Remotion project**
Execute build command to ensure no syntax or typing errors in Remotion code.

**Step 2: Summary & Handoff**
Summarize the visual improvements for the user.
