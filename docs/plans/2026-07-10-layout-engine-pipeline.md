# Layout Engine Pipeline — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Xây dựng 6 phase script Node.js để biến 180 file HTML trong `layoutElement/` thành JSON templates chính xác cho Remotion, sau đó xóa sạch HTML nguồn.

**Architecture:** Mỗi phase là một script độc lập (`run_phase{N}_{name}.js`). Các phase 1-2 dùng Gemini API với p-limit(5) concurrent. Phase 3 validate thuần JS. Phase 4-5 là file I/O. Manifest tracking cho phép resume và retry.

**Tech Stack:** Node.js (ESM), `@google/generative-ai`, `p-limit`, `fs/promises`, `path`

---

## Task 0: Git checkpoint trước khi chạy

**Files:** không thay đổi code

**Step 1: Commit toàn bộ state hiện tại**
```bash
git add -A
git commit -m "chore: checkpoint before layout engine pipeline"
```
Expected: commit thành công, có thể rollback bất cứ lúc nào bằng `git checkout .`

---

## Task 1: Scaffold thư mục và cài dependencies

**Files:**
- Create: `scripts/pipeline/package.json`
- Create: `scripts/pipeline/.env.example`

**Step 1: Tạo thư mục**
```bash
mkdir -p scripts/pipeline/lib
mkdir -p pipeline_output/phase1_metadata
mkdir -p pipeline_output/phase2_templates
```

**Step 2: Tạo `scripts/pipeline/package.json`**
```json
{
  "name": "layout-pipeline",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "phase0": "node run_phase0_scan.js",
    "phase1": "node run_phase1_analyze.js",
    "phase2": "node run_phase2_generate.js",
    "phase3": "node run_phase3_validate.js",
    "phase4": "node run_phase4_install.js",
    "phase5": "node run_phase5_cleanup.js"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.0",
    "p-limit": "^6.1.0"
  }
}
```

**Step 3: Cài dependencies**
```bash
cd scripts/pipeline && npm install
```
Expected: `node_modules/` được tạo, không có error

**Step 4: Tạo `.env.example`**
```
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
```

**Step 5: Commit**
```bash
git add scripts/pipeline/
git commit -m "feat(pipeline): scaffold scripts/pipeline with dependencies"
```

---

## Task 2: `lib/manifest.js` — Manifest tracking helpers

**Files:**
- Create: `scripts/pipeline/lib/manifest.js`

**Step 1: Tạo `lib/manifest.js`**
```javascript
// lib/manifest.js
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const MANIFEST_PATH = join(process.cwd(), '../../pipeline_output/manifest.json');

export async function readManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function writeManifest(manifest) {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
}

export async function updateFileStatus(id, updates) {
  const manifest = await readManifest();
  const file = manifest.files.find(f => f.id === id);
  if (file) Object.assign(file, updates);
  await writeManifest(manifest);
}

export function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function toPascalCase(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (_, c) => c.toUpperCase())
    .replace(/\s+/g, '');
}
```

**Step 2: Commit**
```bash
git add scripts/pipeline/lib/manifest.js
git commit -m "feat(pipeline): add manifest.js tracking helpers"
```

---

## Task 3: `lib/schema.js` — JSON Schema Validator

**Files:**
- Create: `scripts/pipeline/lib/schema.js`

Đây là validator thuần JS cho Phase 3. Không gọi AI.

**Step 1: Tạo `lib/schema.js`**
```javascript
// lib/schema.js

const VALID_FAMILIES = ['opening', 'list', 'data', 'comparison', 'quote', 'timeline', 'media', 'ending'];
const VALID_LAYOUT_MODES = ['absolute_cards', 'vertical_list', 'horizontal_list', 'split_horizontal', 'centered_text', 'full_image', 'grid'];
const VALID_ANIM_TYPES = ['slide-up', 'slide-down', 'fade-in', 'scale-in', 'slide-left', 'slide-right'];

export function validateTemplate(json) {
  const errors = [];

  // Required top-level fields
  if (!json.id || typeof json.id !== 'string') errors.push('Missing or invalid "id"');
  if (!json.name || typeof json.name !== 'string') errors.push('Missing or invalid "name"');
  if (!json.family || !VALID_FAMILIES.includes(json.family)) {
    errors.push(`"family" must be one of: ${VALID_FAMILIES.join(', ')}. Got: ${json.family}`);
  }
  if (!json.layoutMode || !VALID_LAYOUT_MODES.includes(json.layoutMode)) {
    errors.push(`"layoutMode" must be one of: ${VALID_LAYOUT_MODES.join(', ')}. Got: ${json.layoutMode}`);
  }

  // Container
  if (!json.container || typeof json.container !== 'object') errors.push('Missing "container" object');

  // Items
  if (!json.items || !Array.isArray(json.items.itemStyles) || json.items.itemStyles.length === 0) {
    errors.push('"items.itemStyles" must be a non-empty array');
  }
  if (!json.items || !Array.isArray(json.items.rotations)) {
    errors.push('"items.rotations" must be an array');
  }

  // Each itemStyle must have required fields
  (json.items?.itemStyles || []).forEach((item, i) => {
    const required = ['v2', 'fontSize', 'fontWeight', 'borderRadius', 'padding', 'useAccentBg', 'useAccentBorder', 'useAccentShadow', 'useSubtleThemeBg', 'useThemeBorder'];
    required.forEach(field => {
      if (item[field] === undefined) errors.push(`itemStyles[${i}] missing field: "${field}"`);
    });
  });

  // Positions required for absolute_cards mode
  if (json.layoutMode === 'absolute_cards') {
    if (!Array.isArray(json.positions) || json.positions.length === 0) {
      errors.push('"positions" array required for layoutMode "absolute_cards"');
    }
    (json.positions || []).forEach((pos, i) => {
      ['left', 'top', 'width', 'height', 'zIndex'].forEach(field => {
        if (!pos[field]) errors.push(`positions[${i}] missing field: "${field}"`);
      });
    });
  }

  // Animation stagger (optional but if present, validate)
  if (json.animations?.itemStagger) {
    const s = json.animations.itemStagger;
    if (!VALID_ANIM_TYPES.includes(s.type)) {
      errors.push(`animations.itemStagger.type must be one of: ${VALID_ANIM_TYPES.join(', ')}`);
    }
    if (typeof s.baseDelay !== 'number') errors.push('animations.itemStagger.baseDelay must be a number');
    if (typeof s.staggerDelay !== 'number') errors.push('animations.itemStagger.staggerDelay must be a number');
  }

  return { valid: errors.length === 0, errors };
}
```

**Step 2: Commit**
```bash
git add scripts/pipeline/lib/schema.js
git commit -m "feat(pipeline): add JSON schema validator"
```

---

## Task 4: `lib/gemini.js` — Gemini Client với retry

**Files:**
- Create: `scripts/pipeline/lib/gemini.js`

**Step 1: Tạo `lib/gemini.js`**
```javascript
// lib/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) throw new Error('GEMINI_API_KEY environment variable is required');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Call Gemini with JSON output mode and retry logic
 * @param {string} prompt
 * @param {number} maxRetries
 * @returns {Promise<object>} Parsed JSON object
 */
export async function callGeminiJSON(prompt, maxRetries = 3) {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: { responseMimeType: 'application/json' }
  });

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const json = JSON.parse(text);
      return json;
    } catch (err) {
      lastError = err;
      const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
      const delay = isRateLimit ? 30000 : 2000 * attempt; // 30s for rate limit, 2-6s for others
      console.warn(`  [Attempt ${attempt}/${maxRetries}] Error: ${err.message.slice(0, 80)}. Retrying in ${delay/1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}
```

**Step 2: Commit**
```bash
git add scripts/pipeline/lib/gemini.js
git commit -m "feat(pipeline): add Gemini client with retry and rate limit handling"
```

---

## Task 5: `lib/prompt.js` — Prompt Templates

**Files:**
- Create: `scripts/pipeline/lib/prompt.js`

Đây là bước quan trọng nhất — prompt phải cung cấp đủ schema + 3 ví dụ JSON mẫu thực tế để Gemini sinh template chính xác.

**Step 1: Tạo `lib/prompt.js`**
```javascript
// lib/prompt.js

export const LAYOUT_MODE_MAP = `
layoutMode enum (chọn đúng một trong các giá trị sau):
- "absolute_cards": Thẻ nổi với position tuyệt đối, có thể có rotation (ví dụ: timeline, opening với overlay)
- "vertical_list": Danh sách dọc đều nhau (checklist, step list, bullet points)
- "horizontal_list": Items nằm ngang hàng 2-3 cột
- "split_horizontal": Hai cột so sánh (comparison, versus)
- "centered_text": Text căn giữa đơn độc (quote, manifesto)
- "full_image": Toàn màn hình ảnh nền với overlay text (không cần positions)
- "grid": Lưới metric cards đều nhau
`;

export const SCHEMA_SPEC = `
JSON Schema của một Layout Template (PHẢI tuân thủ chính xác):

{
  "id": "PascalCaseId",           // REQUIRED: PascalCase, không dấu, không space
  "name": "Human Readable Name",  // REQUIRED: Tên đầy đủ
  "family": "opening",            // REQUIRED: opening|list|data|comparison|quote|timeline|media|ending
  "layoutMode": "absolute_cards", // REQUIRED: Xem enum ở trên
  "container": {
    "paddingTop": "230px",        // Khoảng cách từ trên xuống nội dung chính
    "maxWidth": "1000px",         // Độ rộng tối đa của content area
    "gap": "24px",                // Gap giữa các items
    "borderRadius": "28px",       // Border radius của container (chỉ cần nếu có background)
    "padding": "22px",            // Padding bên trong (chỉ cho vertical_list)
    "useSubtleThemeBg": true,     // Container có background mờ theo theme
    "useAccentBg": false,         // Container có background accent color
    "align": "bottom"             // CHỈ DÙNG cho full_image: "bottom"
  },
  "categoryPill": null,           // null HOẶC { "text": "LABEL", "bgRgba": "...", "borderRgba": "...", "textRgba": "..." }
  "accentDivider": null,          // null HOẶC { "width": "60px" }
  "title": {
    "fontSize": "88px",           // Font size của tiêu đề (thường 80-100px)
    "fontWeight": "800",
    "letterSpacing": "-0.04em",
    "marginBottom": "100px",      // Khoảng cách giữa title và content
    "useAccentTextShadow": true,
    "useThemeTextShadow": false
  },
  "subtitle": {                   // OPTIONAL
    "bottom": "300px",
    "fontSize": "46px",
    "fontWeight": "950",
    "useThemeTextShadow": true
  },
  "positions": [                  // REQUIRED nếu layoutMode = "absolute_cards"
    {
      "left": "115px",            // "0px", "50%", hoặc pixel value
      "top": "132px",
      "width": "660px",           // "100%" hoặc pixel value
      "height": "300px",          // "auto" hoặc pixel value
      "zIndex": "4"               // String số nguyên
    }
  ],
  "items": {
    "rotations": [0.0, 5.0, -5.0], // Rotation tương ứng với mỗi item (độ)
    "itemStyles": [               // REQUIRED: ít nhất 1 phần tử
      {
        "v2": true,               // LUÔN true
        "fontSize": "28px",
        "fontWeight": "800",
        "borderRadius": "36px",
        "padding": "36px 38px",
        "scale": 1.0,             // 1.0 cho normal, 1.012 cho slightly larger
        "bgRgba": "rgba(239, 68, 68, 0.19)",     // Background của card này
        "borderRgba": "rgba(239, 68, 68, 0.44)", // Border
        "badgeRgba": null,        // null HOẶC "rgb(239, 68, 68)" cho badge/dot
        "shadowGlowRgba": "rgba(239, 68, 68, 0.14)", // null nếu không có glow
        "backdropBlur": "14px",
        "useAccentBg": true,      // true nếu item này là item "active/featured"
        "useAccentBorder": true,
        "useAccentShadow": true,
        "useSubtleThemeBg": false,
        "useThemeBorder": false
      }
    ]
  },
  "animations": {                 // OPTIONAL
    "itemStagger": {
      "type": "slide-up",         // slide-up|slide-down|fade-in|scale-in|slide-left|slide-right
      "baseDelay": 0.3,
      "staggerDelay": 0.15
    }
  }
}
`;

export const EXAMPLE_1_ABSOLUTE = `
EXAMPLE 1 — layoutMode: "absolute_cards" (Timeline Chapters):
{
  "id": "TimelineChapters",
  "name": "Timeline Chapters",
  "family": "timeline",
  "layoutMode": "absolute_cards",
  "container": { "paddingTop": "230px", "maxWidth": "1000px", "gap": "24px" },
  "categoryPill": null,
  "accentDivider": null,
  "title": { "fontSize": "80px", "fontWeight": "800", "letterSpacing": "-0.04em", "marginBottom": "100px", "useAccentTextShadow": true },
  "positions": [
    { "left": "115px", "top": "132px", "width": "660px", "height": "300px", "zIndex": "4" },
    { "left": "438px", "top": "346px", "width": "398px", "height": "172px", "zIndex": "3" },
    { "left": "52px", "top": "66px", "width": "410px", "height": "178px", "zIndex": "2" }
  ],
  "items": {
    "rotations": [0.0, 5.0, -5.0],
    "itemStyles": [
      { "v2": true, "fontSize": "28px", "fontWeight": "800", "borderRadius": "36px", "padding": "36px 38px", "scale": 1.0, "bgRgba": "rgba(239, 68, 68, 0.19)", "borderRgba": "rgba(239, 68, 68, 0.44)", "badgeRgba": null, "shadowGlowRgba": "rgba(239, 68, 68, 0.14)", "backdropBlur": "14px", "useAccentBg": true, "useAccentBorder": true, "useAccentShadow": true, "useSubtleThemeBg": false, "useThemeBorder": false },
      { "v2": true, "fontSize": "28px", "fontWeight": "800", "borderRadius": "30px", "padding": "24px 26px", "scale": 1.0, "bgRgba": "rgba(2, 6, 23, 0.72)", "borderRgba": "rgba(255, 255, 255, 0.18)", "badgeRgba": null, "shadowGlowRgba": null, "backdropBlur": "14px", "useAccentBg": false, "useAccentBorder": false, "useAccentShadow": false, "useSubtleThemeBg": true, "useThemeBorder": true }
    ]
  }
}
`;

export const EXAMPLE_2_VERTICAL = `
EXAMPLE 2 — layoutMode: "vertical_list" (Checklist):
{
  "id": "SignalRailBullet",
  "name": "Signal Rail Bullet",
  "family": "list",
  "layoutMode": "vertical_list",
  "container": { "paddingTop": "230px", "maxWidth": "860px", "gap": "14px", "borderRadius": "28px", "padding": "22px", "useSubtleThemeBg": true, "useAccentBg": false },
  "categoryPill": null,
  "accentDivider": { "width": "60px" },
  "title": { "fontSize": "80px", "fontWeight": "800", "letterSpacing": "-0.04em", "marginBottom": "60px", "useAccentTextShadow": true },
  "positions": [
    { "left": "0px", "top": "0px", "width": "100%", "height": "120px", "zIndex": "1" }
  ],
  "items": {
    "rotations": [0.0, 0.0, 0.0],
    "itemStyles": [
      { "v2": true, "fontSize": "28px", "fontWeight": "700", "borderRadius": "16px", "padding": "16px 20px", "scale": 1.0, "bgRgba": "rgba(239, 68, 68, 0.08)", "borderRgba": "rgba(239, 68, 68, 0.22)", "badgeRgba": "rgb(239, 68, 68)", "shadowGlowRgba": null, "backdropBlur": "12px", "useAccentBg": true, "useAccentBorder": true, "useAccentShadow": false, "useSubtleThemeBg": false, "useThemeBorder": false }
    ]
  },
  "animations": { "itemStagger": { "type": "slide-up", "baseDelay": 0.3, "staggerDelay": 0.12 } }
}
`;

export const EXAMPLE_3_SPLIT = `
EXAMPLE 3 — layoutMode: "split_horizontal" (Versus):
{
  "id": "VersusArena",
  "name": "Versus Arena",
  "family": "comparison",
  "layoutMode": "absolute_cards",
  "container": { "paddingTop": "230px", "maxWidth": "1000px", "gap": "24px" },
  "categoryPill": { "text": "VS", "bgRgba": "rgba(2, 6, 23, 0.88)", "borderRgba": "rgba(255, 255, 255, 0.18)", "textRgba": "rgb(249, 247, 255)" },
  "accentDivider": null,
  "title": { "fontSize": "80px", "fontWeight": "800", "letterSpacing": "-0.04em", "marginBottom": "100px", "useAccentTextShadow": true },
  "positions": [
    { "left": "50%", "top": "50%", "width": "118px", "height": "118px", "zIndex": "3" },
    { "left": "0px", "top": "0px", "width": "100%", "height": "430px", "zIndex": "1" }
  ],
  "items": {
    "rotations": [0.0, 2.2, -2.2],
    "itemStyles": [
      { "v2": true, "fontSize": "34px", "fontWeight": "900", "borderRadius": "999px", "padding": "24px", "scale": 1.0, "bgRgba": "rgba(2, 6, 23, 0.88)", "borderRgba": "rgba(255, 255, 255, 0.18)", "badgeRgba": null, "shadowGlowRgba": null, "backdropBlur": "12px", "useAccentBg": false, "useAccentBorder": false, "useAccentShadow": false, "useSubtleThemeBg": true, "useThemeBorder": true },
      { "v2": true, "fontSize": "28px", "fontWeight": "800", "borderRadius": "34px", "padding": "34px 30px", "scale": 1.0, "bgRgba": "rgba(2, 6, 23, 0.72)", "borderRgba": "rgba(239, 68, 68, 0.4)", "badgeRgba": "rgb(239, 68, 68)", "shadowGlowRgba": "rgba(239, 68, 68, 0.125)", "backdropBlur": "14px", "useAccentBg": true, "useAccentBorder": true, "useAccentShadow": true, "useSubtleThemeBg": false, "useThemeBorder": false }
    ]
  }
}
`;

export function buildAnalysisPrompt(htmlContent, fileName, category) {
  return `
You are a UI layout analyst. Analyze this HTML file and extract layout metadata.
Do NOT write any code. Only return the JSON metadata object.

File: ${fileName}
Category: ${category}

HTML:
\`\`\`html
${htmlContent.slice(0, 8000)}
\`\`\`

${LAYOUT_MODE_MAP}

Return ONLY this JSON object (no explanation):
{
  "id": "slug_id",
  "name": "Human Readable Name",
  "category": "${category}",
  "family": "opening|list|data|comparison|quote|timeline|media|ending",
  "suggestedLayoutMode": "one of the enum values above",
  "backgroundType": "dark_gradient|light_gradient|image_full|transparent",
  "hasImage": false,
  "hasCategoryPill": false,
  "pillText": null,
  "itemCount": 2,
  "hasRotation": false,
  "animationType": "slide-up",
  "notes": "Brief description of the layout structure..."
}
  `.trim();
}

export function buildTemplatePrompt(htmlContent, metadata, fileName) {
  return `
You are a React layout template generator for a video production system.
Read the HTML source and the metadata, then generate a JSON template that matches this layout.

IMPORTANT RULES:
1. Colors in bgRgba/borderRgba/shadowGlowRgba should use "rgba(..." format with ACTUAL colors from the HTML
2. The id must be PascalCase matching the file name: "${metadata.name}"
3. positions array must match the actual number and position of card elements in the HTML
4. itemStyles must reflect the actual visual style of each card/item
5. Do NOT use placeholder values - extract actual values from the HTML
6. Return ONLY valid JSON, no explanation, no markdown code blocks

FILE: ${fileName}
METADATA: ${JSON.stringify(metadata, null, 2)}

${SCHEMA_SPEC}

${LAYOUT_MODE_MAP}

EXAMPLES:
${EXAMPLE_1_ABSOLUTE}

${EXAMPLE_2_VERTICAL}

${EXAMPLE_3_SPLIT}

HTML SOURCE (use this to extract actual colors, sizes, positions):
\`\`\`html
${htmlContent.slice(0, 10000)}
\`\`\`

Generate the JSON template now:
  `.trim();
}
```

**Step 2: Commit**
```bash
git add scripts/pipeline/lib/prompt.js
git commit -m "feat(pipeline): add Gemini prompt templates with 3 JSON examples"
```

---

## Task 6: `run_phase0_scan.js` — Scan và sinh manifest

**Files:**
- Create: `scripts/pipeline/run_phase0_scan.js`

**Step 1: Tạo script**
```javascript
// run_phase0_scan.js
import { readdir, stat, mkdir, writeFile } from 'fs/promises';
import { join, resolve, basename, extname } from 'path';
import { slugify, toPascalCase } from './lib/manifest.js';

const PROJECT_ROOT = resolve('../../');
const LAYOUT_DIR = join(PROJECT_ROOT, 'layoutElement');
const OUTPUT_DIR = join(PROJECT_ROOT, 'pipeline_output');
const MANIFEST_PATH = join(OUTPUT_DIR, 'manifest.json');

async function scanDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await scanDir(fullPath);
      files.push(...sub);
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') {
      files.push(fullPath);
    }
  }
  return files;
}

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(join(OUTPUT_DIR, 'phase1_metadata'), { recursive: true });
  await mkdir(join(OUTPUT_DIR, 'phase2_templates'), { recursive: true });

  const htmlFiles = await scanDir(LAYOUT_DIR);
  console.log(`Found ${htmlFiles.length} HTML files`);

  const files = htmlFiles.map(htmlPath => {
    const rel = htmlPath.replace(LAYOUT_DIR + '\\', '').replace(LAYOUT_DIR + '/', '');
    const parts = rel.split(/[/\\]/);
    const category = parts[0];
    const name = basename(parts[parts.length - 1], '.html');
    const id = slugify(name);

    return {
      id,
      name,
      category,
      htmlPath: htmlPath.replace(PROJECT_ROOT + '\\', '').replace(PROJECT_ROOT + '/', ''),
      phase1Path: `pipeline_output/phase1_metadata/${category}/${id}.json`,
      phase2Path: `pipeline_output/phase2_templates/${category}/${id}.json`,
      installPath: `my-video/src/compositions/layouts/templates/${category}/${id}.json`,
      status: 'pending',
      retries: 0,
      error: null
    };
  });

  const manifest = {
    total: files.length,
    generated_at: new Date().toISOString(),
    files
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ Manifest written: ${MANIFEST_PATH}`);
  console.log(`   ${files.length} files across categories:`);

  const byCategory = {};
  files.forEach(f => { byCategory[f.category] = (byCategory[f.category] || 0) + 1; });
  Object.entries(byCategory).forEach(([cat, count]) => console.log(`   - ${cat}: ${count}`));
}

run().catch(err => { console.error(err); process.exit(1); });
```

**Step 2: Chạy thử**
```bash
cd scripts/pipeline && node run_phase0_scan.js
```
Expected output:
```
Found 180 HTML files
✅ Manifest written: .../pipeline_output/manifest.json
   180 files across categories:
   - Opening-Headline: 71
   - Comparision-Table: 21
   ...
```

**Step 3: Commit**
```bash
git add scripts/pipeline/run_phase0_scan.js
git commit -m "feat(pipeline): add phase0 scan script"
```

---

## Task 7: `run_phase1_analyze.js` — Gemini HTML Analysis

**Files:**
- Create: `scripts/pipeline/run_phase1_analyze.js`

**Step 1: Tạo script**
```javascript
// run_phase1_analyze.js
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import pLimit from 'p-limit';
import { callGeminiJSON } from './lib/gemini.js';
import { readManifest, writeManifest } from './lib/manifest.js';
import { buildAnalysisPrompt } from './lib/prompt.js';

const PROJECT_ROOT = resolve('../../');
const DOTENV = join(PROJECT_ROOT, 'backend/.env');

// Load env from backend/.env
const envContent = await readFile(DOTENV, 'utf-8').catch(() => '');
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const limit = pLimit(5);

async function processFile(file, index, total) {
  const phase1Path = join(PROJECT_ROOT, file.phase1Path);

  // Resume: skip if already done
  try {
    await readFile(phase1Path, 'utf-8');
    console.log(`[${String(index+1).padStart(3,'0')}/${total}] SKIP (already done): ${file.name}`);
    return;
  } catch {}

  console.log(`[${String(index+1).padStart(3,'0')}/${total}] Analyzing: ${file.name}...`);

  try {
    const htmlContent = await readFile(join(PROJECT_ROOT, file.htmlPath), 'utf-8');
    const prompt = buildAnalysisPrompt(htmlContent, file.name, file.category);
    const metadata = await callGeminiJSON(prompt);

    await mkdir(dirname(phase1Path), { recursive: true });
    await writeFile(phase1Path, JSON.stringify(metadata, null, 2), 'utf-8');
    console.log(`  ✅ ${file.name} → ${metadata.suggestedLayoutMode}`);
  } catch (err) {
    console.error(`  ❌ FAILED: ${file.name} — ${err.message}`);
    throw err;
  }
}

async function run() {
  const manifest = await readManifest();
  if (!manifest) throw new Error('Run phase0 first: node run_phase0_scan.js');

  const tasks = manifest.files.map((file, i) =>
    limit(() => processFile(file, i, manifest.total))
  );

  const results = await Promise.allSettled(tasks);
  const failed = results.filter(r => r.status === 'rejected');
  console.log(`\n📊 Phase 1 complete: ${manifest.total - failed.length} success, ${failed.length} failed`);
}

run().catch(err => { console.error(err); process.exit(1); });
```

**Step 2: Test với 3 file đầu (trước khi chạy toàn bộ)**

Sửa tạm `pLimit(1)` và thêm `manifest.files = manifest.files.slice(0, 3)` để test trước.
Chạy:
```bash
cd scripts/pipeline && node run_phase1_analyze.js
```
Expected: 3 file JSON xuất hiện trong `pipeline_output/phase1_metadata/`

**Step 3: Commit**
```bash
git add scripts/pipeline/run_phase1_analyze.js
git commit -m "feat(pipeline): add phase1 HTML analysis script"
```

---

## Task 8: `run_phase2_generate.js` — Gemini Template Generation

**Files:**
- Create: `scripts/pipeline/run_phase2_generate.js`

**Step 1: Tạo script**
```javascript
// run_phase2_generate.js
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import pLimit from 'p-limit';
import { callGeminiJSON } from './lib/gemini.js';
import { readManifest } from './lib/manifest.js';
import { buildTemplatePrompt } from './lib/prompt.js';

const PROJECT_ROOT = resolve('../../');
const DOTENV = join(PROJECT_ROOT, 'backend/.env');

const envContent = await readFile(DOTENV, 'utf-8').catch(() => '');
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const limit = pLimit(5);

async function processFile(file, index, total) {
  const phase2Path = join(PROJECT_ROOT, file.phase2Path);

  // Resume: skip if already generated
  try {
    await readFile(phase2Path, 'utf-8');
    console.log(`[${String(index+1).padStart(3,'0')}/${total}] SKIP: ${file.name}`);
    return { success: true };
  } catch {}

  // Load phase1 metadata
  let metadata;
  try {
    const raw = await readFile(join(PROJECT_ROOT, file.phase1Path), 'utf-8');
    metadata = JSON.parse(raw);
  } catch {
    console.warn(`  ⚠️  Phase1 metadata missing for ${file.name}, skipping`);
    return { success: false };
  }

  console.log(`[${String(index+1).padStart(3,'0')}/${total}] Generating template: ${file.name}...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const htmlContent = await readFile(join(PROJECT_ROOT, file.htmlPath), 'utf-8');
      const prompt = buildTemplatePrompt(htmlContent, metadata, file.name);
      const template = await callGeminiJSON(prompt);

      await mkdir(dirname(phase2Path), { recursive: true });
      await writeFile(phase2Path, JSON.stringify(template, null, 2), 'utf-8');
      console.log(`  ✅ ${file.name} → ${template.layoutMode}`);
      return { success: true };
    } catch (err) {
      console.warn(`  [Attempt ${attempt}/3] ${file.name}: ${err.message.slice(0, 60)}`);
      if (attempt === 3) {
        console.error(`  ❌ FAILED after 3 attempts: ${file.name}`);
        return { success: false, error: err.message };
      }
      await new Promise(r => setTimeout(r, 3000 * attempt));
    }
  }
}

async function run() {
  const manifest = await readManifest();
  if (!manifest) throw new Error('Run phase0 first');

  const tasks = manifest.files.map((file, i) =>
    limit(() => processFile(file, i, manifest.total))
  );

  const results = await Promise.all(tasks);
  const failed = results.filter(r => !r?.success);
  console.log(`\n📊 Phase 2 complete: ${results.length - failed.length} success, ${failed.length} failed`);
  if (failed.length > 0) {
    console.log('Re-run this script to retry failed files (resume supported)');
  }
}

run().catch(err => { console.error(err); process.exit(1); });
```

**Step 2: Test với 3 file đầu trước**
```bash
cd scripts/pipeline && node run_phase2_generate.js
```
Kiểm tra output trong `pipeline_output/phase2_templates/`

**Step 3: Commit**
```bash
git add scripts/pipeline/run_phase2_generate.js
git commit -m "feat(pipeline): add phase2 template generation script"
```

---

## Task 9: `run_phase3_validate.js` — Schema Validation

**Files:**
- Create: `scripts/pipeline/run_phase3_validate.js`

**Step 1: Tạo script**
```javascript
// run_phase3_validate.js
import { readFile, writeFile } from 'fs/promises';
import { join, resolve } from 'path';
import { readManifest } from './lib/manifest.js';
import { validateTemplate } from './lib/schema.js';

const PROJECT_ROOT = resolve('../../');

async function run() {
  const manifest = await readManifest();
  if (!manifest) throw new Error('Run phase0 first');

  const report = { total: manifest.total, passed: 0, failed: 0, results: [] };

  for (const file of manifest.files) {
    const phase2Path = join(PROJECT_ROOT, file.phase2Path);

    let template;
    try {
      const raw = await readFile(phase2Path, 'utf-8');
      template = JSON.parse(raw);
    } catch (err) {
      report.failed++;
      report.results.push({ id: file.id, name: file.name, valid: false, errors: [`Could not read/parse: ${err.message}`] });
      continue;
    }

    const { valid, errors } = validateTemplate(template);
    if (valid) {
      report.passed++;
      report.results.push({ id: file.id, name: file.name, valid: true, errors: [] });
      console.log(`  ✅ ${file.name}`);
    } else {
      report.failed++;
      report.results.push({ id: file.id, name: file.name, valid: false, errors });
      console.error(`  ❌ ${file.name}: ${errors.join('; ')}`);
    }
  }

  await writeFile(
    join(PROJECT_ROOT, 'pipeline_output/phase3_report.json'),
    JSON.stringify(report, null, 2), 'utf-8'
  );

  console.log(`\n📊 Phase 3 Validation: ${report.passed} passed, ${report.failed} failed`);
  if (report.failed > 0) {
    console.log('Fix failed templates then re-run phase2 + phase3');
    process.exit(1);
  }
}

run().catch(err => { console.error(err); process.exit(1); });
```

**Step 2: Chạy validate**
```bash
cd scripts/pipeline && node run_phase3_validate.js
```
Expected: Tất cả pass hoặc list rõ file nào fail + lý do

**Step 3: Commit**
```bash
git add scripts/pipeline/run_phase3_validate.js
git commit -m "feat(pipeline): add phase3 schema validation script"
```

---

## Task 10: `run_phase4_install.js` — Install Templates

**Files:**
- Create: `scripts/pipeline/run_phase4_install.js`

**Step 1: Tạo script**
```javascript
// run_phase4_install.js
import { readFile, writeFile, mkdir, copyFile } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { readManifest } from './lib/manifest.js';
import { validateTemplate } from './lib/schema.js';

const PROJECT_ROOT = resolve('../../');

async function run() {
  const manifest = await readManifest();
  if (!manifest) throw new Error('Run phase0 first');

  // Check phase3 report exists
  let report;
  try {
    report = JSON.parse(await readFile(join(PROJECT_ROOT, 'pipeline_output/phase3_report.json'), 'utf-8'));
  } catch {
    throw new Error('Run phase3 first: node run_phase3_validate.js');
  }

  if (report.failed > 0) {
    throw new Error(`Phase3 has ${report.failed} failed templates. Fix them before installing.`);
  }

  let installed = 0;
  let skipped = 0;

  for (const file of manifest.files) {
    const validResult = report.results.find(r => r.id === file.id);
    if (!validResult?.valid) { skipped++; continue; }

    const src = join(PROJECT_ROOT, file.phase2Path);
    const dest = join(PROJECT_ROOT, file.installPath);

    await mkdir(dirname(dest), { recursive: true });
    await copyFile(src, dest);
    installed++;
    console.log(`  ✅ Installed: ${file.installPath}`);
  }

  console.log(`\n📦 Phase 4 Install: ${installed} installed, ${skipped} skipped`);
}

run().catch(err => { console.error(err); process.exit(1); });
```

**Step 2: Chạy install**
```bash
cd scripts/pipeline && node run_phase4_install.js
```
Expected: Templates copy vào `my-video/src/compositions/layouts/templates/`

**Step 3: Verify Remotion vẫn hoạt động**
```bash
cd ../../my-video && npm run build
```
Expected: Build không có error

**Step 4: Commit**
```bash
git add scripts/pipeline/run_phase4_install.js my-video/src/compositions/layouts/templates/
git commit -m "feat(pipeline): add phase4 install script + updated templates"
```

---

## Task 11: `run_phase5_cleanup.js` — Cleanup

**Files:**
- Create: `scripts/pipeline/run_phase5_cleanup.js`

**Step 1: Tạo script với guard chắc chắn**
```javascript
// run_phase5_cleanup.js
import { readFile, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { readManifest } from './lib/manifest.js';

const PROJECT_ROOT = resolve('../../');

async function run() {
  const manifest = await readManifest();
  if (!manifest) throw new Error('Manifest not found');

  // GUARD: Read phase4 report — only cleanup if 100% installed
  let report;
  try {
    report = JSON.parse(await readFile(join(PROJECT_ROOT, 'pipeline_output/phase3_report.json'), 'utf-8'));
  } catch {
    throw new Error('phase3_report.json not found. Run phase3 + phase4 first.');
  }

  if (report.failed > 0) {
    console.error(`❌ CLEANUP ABORTED: ${report.failed} templates still failed validation.`);
    console.error('Fix all failures before cleanup.');
    process.exit(1);
  }

  // Confirm prompt
  console.log(`\n⚠️  CLEANUP will DELETE:`);
  console.log(`  - layoutElement/ (${manifest.total} HTML files)`);
  console.log(`  - pipeline_output/ (all intermediate files)`);
  console.log(`\nAll ${report.passed} templates have been installed successfully.`);
  console.log('\nPress ENTER to confirm, Ctrl+C to cancel...');
  await new Promise(r => process.stdin.once('data', r));

  const layoutDir = join(PROJECT_ROOT, 'layoutElement');
  const pipelineDir = join(PROJECT_ROOT, 'pipeline_output');

  await rm(layoutDir, { recursive: true, force: true });
  console.log(`✅ Deleted: layoutElement/`);

  await rm(pipelineDir, { recursive: true, force: true });
  console.log(`✅ Deleted: pipeline_output/`);

  console.log(`\n🎉 Cleanup complete. ${report.passed} templates installed.`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
```

**Step 2: Commit**
```bash
git add scripts/pipeline/run_phase5_cleanup.js
git commit -m "feat(pipeline): add phase5 cleanup script with safety guard"
```

---

## Task 12: End-to-End test — Chạy toàn bộ pipeline

**Step 1: Git commit toàn bộ scripts**
```bash
git add scripts/pipeline/
git commit -m "feat(pipeline): complete layout engine pipeline scripts"
```

**Step 2: Chạy pipeline đầy đủ**
```bash
cd scripts/pipeline

# Phase 0: Scan
node run_phase0_scan.js

# Phase 1: Analyze all (có thể mất 10-20 phút)
node run_phase1_analyze.js

# Phase 2: Generate templates (có thể mất 20-40 phút)
node run_phase2_generate.js

# Phase 3: Validate
node run_phase3_validate.js

# Phase 4: Install
node run_phase4_install.js

# Verify Remotion compiles
cd ../../my-video && npm run build
```

**Step 3: Kiểm tra templates được đăng ký**

Mở `http://localhost:3000` (frontend dev), vào Storyboard Editor, kiểm tra dropdown Layout có đủ 180 options.

**Step 4: Chỉ cleanup KHI đã hài lòng với kết quả**
```bash
cd scripts/pipeline && node run_phase5_cleanup.js
```

**Step 5: Commit cuối**
```bash
git add -A
git commit -m "chore: cleanup layoutElement + pipeline after successful migration"
```

---

## Tóm tắt lệnh chạy

```bash
# Mỗi lần chạy từ scripts/pipeline/
cd scripts/pipeline

node run_phase0_scan.js     # ~5s
node run_phase1_analyze.js  # ~15-25 phút (180 Gemini calls)
node run_phase2_generate.js # ~25-40 phút (180 Gemini calls)
node run_phase3_validate.js # ~10s
node run_phase4_install.js  # ~5s
# Verify, test, rồi mới:
node run_phase5_cleanup.js  # Xóa HTML vĩnh viễn
```

**Nếu bị rate limit giữa chừng:** Chỉ cần chạy lại — script resume tự động nhờ file-based checkpoint.
