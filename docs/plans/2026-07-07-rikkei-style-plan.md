# Rikkei Academic Visual Style Integration Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement the new "Rikkei Academic" visual style across backend compiler schemas, frontend VDE tokens, typography imports, and Storyboard selection UI mockups.

**Architecture:** 
1. Register `rikkei` style metadata, design DNA, and tokens in `backend/services/vde.js`.
2. Expand Gemini's prompt schema in `backend/services/ai.js` to support the `rikkei` theme and block generation rules.
3. Import the Google Font **Be Vietnam Pro** in `my-video` and define it as the title and body font family in `vdeTokens.ts` and `fonts.ts`.
4. Register the theme selection and render a custom mockup card for `rikkei` inside the frontend style gallery modal in `StoryboardEditor.jsx`.

**Tech Stack:** React, Remotion, Node.js, Express, Google Generative AI SDK, TailwindCSS-free Vanilla CSS.

---

### Task 1: Register Rikkei visual style on VDE backend compiler

**Files:**
- Modify: `backend/services/vde.js:180-200`

**Step 1: Add rikkei style definition**

Add `rikkei` style description, DNA guidelines, and theme tokens to `BUILTIN_STYLES` in `backend/services/vde.js`:

```javascript
  rikkei: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 0.95, minimalism: 0.8 },
      tone: "professional, educational, academic, clean, corporate, structured",
      description: "Phong cách học viện Rikkei Academy: Nền trắng sạch sẽ, màu đỏ crimson làm chủ đạo, thẻ bo góc lớn màu hồng nhạt siêu dịu."
    },
    tokens: {
      colors: {
        background: "#ffffff",
        cardBg: "#FAF5F5",
        border: "rgba(168, 35, 42, 0.08)",
        accent: "#A8232A",
        text: "#191919",
        textSecondary: "#595959"
      },
      fonts: {
        title: "Be Vietnam Pro",
        body: "Be Vietnam Pro"
      },
      radius: "16px",
      shadow: "0 8px 24px rgba(168, 35, 42, 0.03)"
    },
    motion: {
      energy: "medium",
      style: ["slide-up", "fade"]
    }
  }
```

**Step 2: Save the file changes**

**Step 3: Run syntax check**
Run: `node -c backend/services/vde.js`
Expected: Success

**Step 4: Commit**
```bash
git add backend/services/vde.js
git commit -m "feat(backend): register rikkei style in VDE compiler"
```

---

### Task 2: Update Gemini AI visual prompt rules for Rikkei style

**Files:**
- Modify: `backend/services/ai.js:60-85`

**Step 1: Update prompt schema and rules**

Update Gemini prompt to support `"rikkei"` theme option and block style selection rule.

```javascript
          "theme": "japan" | "tech" | "finance" | "nature" | "default" | "rikkei",
          "accentColor": "A vibrant HEX color matching the theme, e.g., '#FFB7C5' for japan, '#A8232A' for rikkei"
```

And add the block selection rule under `CRITICAL BLOCK STYLE SELECTION RULES FOR phong cách`:
```text
      - If style is "rikkei", prefer using "subheader", "logo_row", and "button" block types to create a premium, clean educational layout. Use crimson red (#A8232A) highlights and rounded buttons.
```

**Step 2: Save the file changes**

**Step 3: Run syntax check**
Run: `node -c backend/services/ai.js`
Expected: Success

**Step 4: Commit**
```bash
git add backend/services/ai.js
git commit -m "feat(backend): update gemini prompt guidelines for rikkei style"
```

---

### Task 3: Setup Be Vietnam Pro font and VDE Tokens in my-video

**Files:**
- Modify: `my-video/src/Root.tsx:1-15`
- Modify: `my-video/src/styles/fonts.ts:1-25`
- Modify: `my-video/src/styles/vdeTokens.ts:50-100`

**Step 1: Load font in Root.tsx**

Add Google Fonts import link inside `<Header>` or `@import` stylesheet to load `Be Vietnam Pro`.
Modify `my-video/src/Root.tsx`:
```typescript
import { fontBeVietnamPro } from "./styles/fonts";
```

In `fonts.ts`:
```typescript
export const fontBeVietnamPro = "Be Vietnam Pro, sans-serif";
```

**Step 2: Add rikkei token set in vdeTokens.ts**

```typescript
  rikkei: {
    colors: {
      background: "#ffffff",
      cardBg: "#FAF5F5",
      border: "2px solid #F1E2E3",
      accent: "#A8232A",
      text: "#191919",
      textSecondary: "#595959"
    },
    fonts: { title: fontBeVietnamPro, body: fontBeVietnamPro },
    radius: "16px",
    shadow: "0 8px 24px rgba(168, 35, 42, 0.03)"
  }
```

**Step 3: Save the file changes**

**Step 4: Verify typecheck**
Run: `npx tsc --noEmit` inside `my-video`
Expected: PASS with no errors.

**Step 5: Commit inside submodule**
```bash
git add src/Root.tsx src/styles/fonts.ts src/styles/vdeTokens.ts
git commit -m "feat(frontend): add Be Vietnam Pro font and rikkei tokens to my-video"
```

---

### Task 4: Integrate Rikkei style select card and mockup preview

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx:260-320`
- Modify: `frontend/src/components/StoryboardEditor.jsx:680-840`

**Step 1: Register rikkei in StoryboardEditor BUILTIN_STYLES**

Add metadata block:
```javascript
  {
    id: "rikkei",
    name: "Rikkei Academic",
    description: "Phong cách Rikkei Education: Nền trắng sạch, viền hồng đỏ, màu Crimson chủ đạo, thẻ học tập phẳng bo góc lớn cực dịu.",
    tokens: {
      background: "#ffffff",
      cardBg: "#FAF5F5",
      border: "1.5px solid #F1E2E3",
      text: "#191919",
      textSecondary: "#595959",
      accent: "#A8232A",
      radius: "16px",
      shadow: "0 8px 24px rgba(168, 35, 42, 0.03)",
      fontFamily: "Be Vietnam Pro, sans-serif"
    }
  }
```

**Step 2: Write custom high-fidelity mockup render code**

Inside the style gallery mapper:
- Header decoration:
```javascript
                          {style.id === "rikkei" && (
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                              <span style={{ fontSize: "8px", fontWeight: "bold", color: "#A8232A" }}>Hệ thống học tập</span>
                              <span style={{ fontSize: "8px", color: "#555555" }}>Rikkei Edu</span>
                            </div>
                          )}
```

- Content Card mockup:
```javascript
                          ) : style.id === "rikkei" ? (
                            <div style={{
                              backgroundColor: "#FAF5F5",
                              border: "1px solid #F1E2E3",
                              borderRadius: "14px",
                              padding: "10px",
                              boxSizing: "border-box",
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              width: "100%"
                            }}>
                              <h4 style={{ margin: 0, fontSize: "10px", fontWeight: "bold", color: "#191919" }}>
                                Quản lý dự án
                              </h4>
                              <p style={{ margin: 0, fontSize: "7px", color: "#595959", lineHeight: "1.3" }}>
                                Nền kịch bản đăng ký, theo dõi các dự án của sinh viên.
                              </p>
                              <div style={{
                                width: "fit-content",
                                backgroundColor: "#A8232A",
                                color: "#ffffff",
                                fontSize: "7px",
                                fontWeight: "bold",
                                padding: "3px 8px",
                                borderRadius: "8px",
                                marginTop: "3px"
                              }}>
                                Truy cập →
                              </div>
                            </div>
```

- Footer decoration:
```javascript
                          ) : style.id === "rikkei" ? (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", color: "#A8232A", fontWeight: "bold", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "4px", width: "100%" }}>
                              <span>Rikkei Education</span>
                              <span style={{ color: "#595959" }}>@rikkeiedu</span>
                            </div>
```

**Step 3: Save the file changes and verify frontend compile**

**Step 4: Commit parent repository changes**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat(frontend): render high-fidelity rikkei style card in selection modal"
```

---

### Task 5: End-to-end verification

**Step 1: Test selector UI**
Launch frontend and check if the new "Rikkei Academic" preview card displays beautifully in the visual style modal.

**Step 2: Generate a project**
Create a new project using the "Rikkei Academic" visual style and verify that:
- AI generates correct layout themes with crimson color accent.
- Video renders perfectly using Be Vietnam Pro typography and custom rounded cards.
