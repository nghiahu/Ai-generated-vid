# Design: AI Gen Layout, Asset, Motion Validation & Caching (Layers 4-7)

## Overview
Following the successful implementation of L1-L3 validation (AST checking, Node VM compile checking, and Hidden Iframe Sandboxing), this design extends the verification pipeline to handle aesthetic layouts, real asset resolution, motion parameter clamping, and metadata-driven caching (Layers 4-7).

These enhancements protect the video rendering output from styling regressions (overlapping texts, truncated titles), missing assets, frozen animations, and redundant expensive LLM API calls.

```
                    Scene Planning (Gemini)
                              │
                              ▼
            [L5] Asset Planner (Extract requirements)
                              │
                              ▼
                   Search & Cache Assets
                              │
                              ▼
                        Generate TSX
                              │
                              ▼
                    [L1] AST Validation
                              │
             [L6] AST Clamping (Damping/Stiffness)
                              │
                    [L2] Compile (Sucrase)
                              │
            [L3] Browser Sandbox (Hidden Iframe)
                              │
            [L4] DOM-based Design Layout Validation
                 - Overlaps, Safe Area, Clipping
                              │
                              ▼
            [L7] Rich Metadata & Caching Check
```

---

## Design Details

### 1. Layer 4: Design Layout Validation (DOM-based inside Sandbox)
Once the scene component renders inside the hidden iframe, a test script queries the DOM nodes to verify design sanity:
- **Aesthetic Overlap Collision Detection**:
  - Run a pairwise coordinates collision check on all visible structural DOM elements (`h1`, `h2`, `p`, `img`, `.card`, `.tile`).
  - Calculate the intersection area between bounding rects:
    $$\text{Intersection} = \max(0, \min(R_1.right, R_2.right) - \max(R_1.left, R_2.left)) \times \max(0, \min(R_1.bottom, R_2.bottom) - \max(R_1.top, R_2.top))$$
  - If the intersection area exceeds 20% of either element's area, flag a validation collision.
- **Grid Bố cục Verification**:
  - If the visual pattern is `DUAL_METRIC_CARDS` or `STAT_GRID_2X2`, verify that:
    1. The parent container element contains exactly 2 (for dual) or 4 (for grid) sibling cards.
    2. The computed CSS displays them inline or in a grid (e.g. checking `getComputedStyle(parent).display` matches `grid` or `flex` with horizontal layouts).
- **Text Truncation Check**:
  - For text elements, check if `el.scrollHeight > el.clientHeight` or `el.scrollWidth > el.clientWidth`. If so, the title or caption is clipped.
- **Safe Area Overflow**:
  - Verify no visible elements bleed below $y = 1498px$ (bottom 22% of a $1080 \times 1920px$ viewport).

---

### 2. Layer 5: Asset Pipeline & Pre-Planner
To prevent broken images or placeholder failures:
- **Phase A (Planning)**:
  During `generateScenePlanForAIGen`, Gemini identifies the visual resources needed for each scene (e.g., logo, illustration topic, BGM mood).
- **Phase B (Asset Resolution)**:
  The backend processes the requirements:
  - Resolves keywords (like "speed icon") to real, local, or cached URLs (`/assets/icons/speed.svg`).
  - Downloads external illustrations to the local public cache directory `/public/aigen-assets/`.
- **Phase C (Prompt Injector)**:
  The real URLs are appended directly to the code generator prompt as a locked asset list:
  ```json
  "assets": {
    "speedIconUrl": "/aigen-assets/speed.svg",
    "datacenterBgUrl": "/aigen-assets/datacenter.jpg"
  }
  ```
  Gemini is strictly commanded to use only these verified URL strings.

---

### 3. Layer 6: Motion & Animation Validation (AST static clamping)
To prevent infinite bounce, erratic jitter, or completely frozen layouts:
- The backend static AST validator walks the parse tree during **Layer 1** looking for `CallExpression` nodes named `spring`.
- It inspects the `config` argument properties:
  - **Damping**: Must lie within `[5, 80]`. If it is outside (e.g., `damping: 500` which freezes animations), the AST validator clamps it to a default safe value (e.g. `14`).
  - **Stiffness**: Must lie within `[10, 300]`. If outside, clamp to `55`.
- Write the modifications back to the AST before compiling, automatically repairing bad parameters without needing an LLM call.

---

### 4. Layer 7: Rich Metadata & Caching
To speed up project loading and prevent redundant LLM pricing costs:
- **Metadata Storage**:
  Save detailed design intent properties inside the `projects.config.scenes` JSONB columns:
  ```json
  {
    "visualIntent": "DUAL_METRIC_CARDS",
    "motionStyle": "staggered_fade",
    "compileHash": "sha256_of_generated_code",
    "promptHash": "sha256_of_system_instruction",
    "assetsUsed": ["/aigen-assets/speed.svg"]
  }
  ```
- **Caching Mechanism**:
  Before calling Gemini to generate code for a scene:
  1. Calculate the hash of the scene's script text, visual pattern, and prompt template.
  2. Search the database `projects` table JSONB configurations for matching hashes.
  3. If a match is found and validation is clean, load the cached TSX code and JS directly, bypassing Gemini.

---

## Verification Plan

### Automated Tests
1. **DOM Overlap Test**: Create `backend/public/test-overlap.html` passing two overlapping divs and verify the validation sandbox detects and flags it.
2. **AST Motion Clamping Test**: Write a unit test `backend/tests/motionClamping.test.js` passing TSX with `spring({ damping: 600 })` and verify that the AST validator output clamps it to `14`.
3. **Cache Hit Test**: Generate a scene twice and verify the second call hits the cache instantly (execution time < 50ms).

### Manual Verification
1. Run Studio AI Gen with identical script inputs.
2. Verify that generation resolves images instantly.
3. Check the database JSONB structure to ensure `validationReport` and cache metadata are fully recorded.
