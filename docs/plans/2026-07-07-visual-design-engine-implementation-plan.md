# Visual Design Engine (VDE) Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Xây dựng hệ thống Visual Design Engine (VDE) hoàn chỉnh hỗ trợ Kế thừa đơn, nạp Traits theo Phân lớp ưu tiên (Layered Merging), bảo vệ quyền thuộc tính (Permissions), và tối ưu hóa Prompt gửi cho Gemini.

**Architecture:** 
1. Cấu hình các Style và Trait dưới dạng file JSON mô-đun trong thư mục `backend/styles/` và `backend/traits/`.
2. Hiện thực `vde.js` thành một Style Compiler đi qua các bước: Inheritance Resolver, Trait Loader, Conflict Resolver, Permission Verifier, Layered Merger, và Style Optimizer.
3. Sử dụng thư viện `assert` tích hợp của Node.js để viết unit test động trong `backend/test_vde.js`.
4. Cập nhật endpoints của Backend và giao diện Web UI để cho phép cấu hình lựa chọn Visual Style và các Traits đi kèm.

**Tech Stack:** Node.js (CommonJS), Express, React.

---

### Task 1: Thiết lập thư mục và các Traits mặc định trên Backend

**Files:**
- Create: `backend/traits/dark_theme/tokens.json`
- Create: `backend/traits/vertical_video/tokens.json`
- Create: `backend/traits/vertical_video/grammar.json`
- Create: `backend/traits/glass_effect/tokens.json`

**Step 1: Tạo file cấu hình cho Trait dark_theme**
Ghi nội dung sau vào `backend/traits/dark_theme/tokens.json`:
```json
{
  "colors": {
    "background": "#08080c",
    "cardBg": "rgba(10, 10, 15, 0.7)",
    "border": "rgba(255, 255, 255, 0.08)",
    "text": "#ffffff",
    "textSecondary": "rgba(255, 255, 255, 0.6)"
  }
}
```

**Step 2: Tạo file cấu hình cho Trait vertical_video (tokens)**
Ghi nội dung sau vào `backend/traits/vertical_video/tokens.json`:
```json
{
  "spacing": {
    "padding": "20px",
    "gap": "16px"
  }
}
```

**Step 3: Tạo file cấu hình cho Trait vertical_video (grammar)**
Ghi nội dung sau vào `backend/traits/vertical_video/grammar.json`:
```json
{
  "constraints": [
    "Maximum of 2 side-by-side elements are allowed due to limited horizontal width."
  ]
}
```

**Step 4: Tạo file cấu hình cho Trait glass_effect**
Ghi nội dung sau vào `backend/traits/glass_effect/tokens.json`:
```json
{
  "colors": {
    "cardBg": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
    "border": "rgba(255, 255, 255, 0.15)"
  },
  "radius": "24px",
  "shadow": "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
}
```

**Step 5: Commit**
```bash
git add backend/traits/
git commit -m "feat: add built-in VDE trait configurations"
```

---

### Task 2: Viết Unit Tests cho Trình biên dịch VDE

**Files:**
- Create: `backend/test_vde.js`

**Step 1: Viết test suite kiểm tra tính năng biên dịch, kế thừa, ghi đè, và phân quyền của VDE**
Ghi mã nguồn kiểm thử vào `backend/test_vde.js`:
```javascript
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vde = require('./services/vde');

console.log('=== RUNNING VDE COMPILER TESTS ===');

function testSingleInheritance() {
  console.log('- Test: Single Inheritance (apple extends minimal)');
  const appleStyle = vde.getStyle('apple', []);
  assert.strictEqual(appleStyle.tokens.colors.background, '#000000', 'Apple background must be #000000');
  assert.strictEqual(appleStyle.tokens.fonts.title, 'SF Pro, Inter', 'Apple must override font');
  assert.strictEqual(appleStyle.dna.philosophy.oneIdeaPerScene, true, 'Apple must inherit philosophy from minimal');
  console.log('  => PASS');
}

function testTraitApplication() {
  console.log('- Test: Trait Application (dark_theme + vertical_video)');
  const compiled = vde.getStyle('minimal', ['dark_theme', 'vertical_video']);
  assert.strictEqual(compiled.tokens.colors.background, '#08080c', 'dark_theme must override background');
  assert.strictEqual(compiled.tokens.spacing.padding, '20px', 'vertical_video must override spacing.padding');
  assert.ok(compiled.grammar.constraints.includes('Maximum of 2 side-by-side elements are allowed due to limited horizontal width.'), 'vertical_video grammar constraints must be merged');
  console.log('  => PASS');
}

function testPermissionsCheck() {
  console.log('- Test: Permissions Check (Locking property from override)');
  // Thêm file cấu hình mock style có _permissions
  const mockStyleDir = path.join(__dirname, 'styles', 'mock_locked');
  if (!fs.existsSync(mockStyleDir)) fs.mkdirSync(mockStyleDir);
  
  fs.writeFileSync(path.join(mockStyleDir, 'extends.txt'), 'minimal');
  fs.writeFileSync(path.join(mockStyleDir, 'tokens.json'), JSON.stringify({
    colors: { background: "#ff0000" },
    _permissions: {
      "tokens.colors.background": { canModify: false }
    }
  }));

  try {
    const compiled = vde.getStyle('mock_locked', ['dark_theme']);
    assert.strictEqual(compiled.tokens.colors.background, '#ff0000', 'Locked background must NOT be modified by trait');
    console.log('  => PASS');
  } finally {
    // Cleanup mock style
    if (fs.existsSync(path.join(mockStyleDir, 'extends.txt'))) fs.unlinkSync(path.join(mockStyleDir, 'extends.txt'));
    if (fs.existsSync(path.join(mockStyleDir, 'tokens.json'))) fs.unlinkSync(path.join(mockStyleDir, 'tokens.json'));
    fs.rmdirSync(mockStyleDir);
  }
}

try {
  testSingleInheritance();
  testTraitApplication();
  testPermissionsCheck();
  console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
} catch (error) {
  console.error('=== TEST FAILURE ===');
  console.error(error);
  process.exit(1);
}
```

**Step 2: Chạy kiểm thử để xác nhận lỗi biên dịch (Đợi test fail)**
Chạy lệnh:
`node backend/test_vde.js`
Expected: Test thất bại ở phần Trait Application và Permissions Check vì file `vde.js` hiện tại chưa hỗ trợ.

---

### Task 3: Cập nhật Trình biên dịch VDE để xử lý Kế thừa, nạp Traits và Phân quyền

**Files:**
- Modify: `backend/services/vde.js`

**Step 1: Nâng cấp hàm getStyle trong vde.js**
Sửa đổi logic của `getStyle` tại `backend/services/vde.js` để hỗ trợ:
1. Đọc danh sách traits từ tham số thứ hai: `getStyle(styleId, traits = [])`.
2. Nạp cấu hình của style cha trước, gộp với style hiện tại.
3. Nạp cấu hình của từng trait.
4. Triển khai phân cấp Layered Merger:
   - Các trường thuộc `_permissions` của style con hoặc cha (được tổng hợp lại) có `canModify: false` sẽ chặn ghi đè từ các tầng trait.
Ghi đè mã nguồn bằng cách thay thế khối `getStyle` và các hàm helper liên quan.

Mã nguồn mới cho `backend/services/vde.js`:
```javascript
// Thay thế hàm loadStyleComponent và getStyle để hỗ trợ nạp cả Traits
function loadTraitComponent(traitId, componentName) {
  const filePath = path.join(__dirname, '../traits', traitId, `${componentName}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      console.error(`[VDE] Error parsing VDE trait file ${filePath}:`, e.message);
    }
  }
  return null;
}

// Hàm gộp có hỗ trợ kiểm tra quyền ghi đè
function mergeWithPermissions(target, source, permissions = {}, pathPrefix = '') {
  const output = { ...target };
  if (target && source && typeof target === 'object' && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      // Kiểm tra quyền ghi đè
      if (permissions[currentPath] && permissions[currentPath].canModify === false) {
        // Bị khóa, giữ nguyên giá trị cũ của target
        return;
      }
      
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeWithPermissions(target[key], source[key], permissions, currentPath);
        }
      } else if (Array.isArray(source[key]) && Array.isArray(target[key])) {
        // Gộp mảng tránh trùng lặp
        output[key] = Array.from(new Set([...target[key], ...source[key]]));
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

// Trích xuất danh sách permissions tích lũy từ chuỗi kế thừa
function extractPermissions(styleId, accumulated = {}) {
  const baseStyleId = getStyleExtends(styleId);
  if (baseStyleId && styleExists(baseStyleId)) {
    extractPermissions(baseStyleId, accumulated);
  }
  
  const tokensData = loadStyleComponent(styleId, 'tokens');
  if (tokensData && tokensData._permissions) {
    Object.assign(accumulated, tokensData._permissions);
  }
  
  // Kiểm tra ở các component khác nếu có _permissions
  const components = ['dna', 'grammar', 'motion', 'storytelling', 'assets', 'validator'];
  components.forEach(comp => {
    const compData = loadStyleComponent(styleId, comp);
    if (compData && compData._permissions) {
      Object.assign(accumulated, compData._permissions);
    }
  });
  
  return accumulated;
}

function getStyle(styleId, traits = []) {
  let resolvedStyle = {};
  
  let targetStyleId = styleId.toLowerCase();
  if (targetStyleId.includes("cyberpunk") || targetStyleId.includes("neon")) targetStyleId = "cyberpunk";
  else if (targetStyleId.includes("anime") || targetStyleId.includes("manga")) targetStyleId = "anime";
  else if (targetStyleId.includes("apple") || targetStyleId.includes("keynote")) targetStyleId = "apple";
  else if (!styleExists(targetStyleId)) targetStyleId = "minimal";

  // 1. Inheritance Resolver: nạp cha
  const baseStyleId = getStyleExtends(targetStyleId);
  if (baseStyleId && styleExists(baseStyleId)) {
    resolvedStyle = getStyle(baseStyleId, []);
  }

  // 2. Nạp style con hiện tại
  const components = ['dna', 'grammar', 'tokens', 'motion', 'storytelling', 'assets', 'validator'];
  const localStyle = {};
  components.forEach(comp => {
    const compData = loadStyleComponent(targetStyleId, comp);
    if (compData) {
      localStyle[comp] = compData;
    }
  });

  // Gộp style con vào style cha
  let compiledStyle = deepMerge(resolvedStyle, localStyle);

  // Thu thập quyền ghi đè
  const permissions = extractPermissions(targetStyleId);

  // 3. Layered Merger: Nạp các Traits và gộp theo phân lớp (kiểm tra permissions)
  traits.forEach(traitId => {
    components.forEach(comp => {
      const traitCompData = loadTraitComponent(traitId, comp);
      if (traitCompData) {
        if (!compiledStyle[comp]) compiledStyle[comp] = {};
        compiledStyle[comp] = mergeWithPermissions(
          compiledStyle[comp], 
          traitCompData, 
          permissions, 
          comp
        );
      }
    });
  });

  // Bổ sung meta
  compiledStyle.styleId = targetStyleId;
  compiledStyle.meta = {
    compiledAt: new Date().toISOString(),
    inheritanceChain: baseStyleId ? [baseStyleId, targetStyleId] : [targetStyleId],
    appliedTraits: traits
  };

  return compiledStyle;
}
```

**Step 2: Chạy kiểm thử để xác nhận pass**
Chạy: `node backend/test_vde.js`
Expected: Tất cả 3 test cases (Kế thừa đơn, Trait Application, Permissions Check) đều in ra `=> PASS`.

**Step 3: Commit**
```bash
git add backend/services/vde.js backend/test_vde.js
git commit -m "feat: implement layered merging with trait composition and permissions in vde compiler"
```

---

### Task 4: Cập nhật StyleOptimizer để rút gọn Prompt cho LLM

**Files:**
- Modify: `backend/services/vde.js:285-313`

**Step 1: Nâng cấp hàm getStylePrompt để tự động lọc bỏ các chi tiết CSS**
Chỉnh sửa hàm `getStylePrompt` tại `backend/services/vde.js` để nạp cả Traits và rút gọn nội dung:
```javascript
function getStylePrompt(styleId, traits = []) {
  const style = getStyle(styleId, traits);
  
  // Lọc lấy các chỉ thị cao cấp định hướng, loại bỏ các trị số CSS thô
  const optimizedDNA = {
    tone: style.dna?.tone,
    description: style.dna?.description,
    philosophy: style.dna?.philosophy
  };
  
  const optimizedGrammar = {
    constraints: style.grammar?.constraints || []
  };

  const optimizedMotion = {
    energy: style.motion?.energy || "low",
    style: style.motion?.style || [],
    avoid: style.motion?.avoid || []
  };

  return `
- STYLE IDENTITY: "${style.styleId}" (Inheritance: ${style.meta?.inheritanceChain.join(' -> ')}, Active Traits: ${traits.join(', ') || 'none'})
- VISUAL PHILOSOPHY & TONE:
  * Tone: ${optimizedDNA.tone || "clean, minimal"}
  * Description: ${optimizedDNA.description || ""}
  * One idea per scene: ${optimizedDNA.philosophy?.oneIdeaPerScene ? "YES (Strict)" : "NO (Flexible)"}
  * Minimalism level: ${(optimizedDNA.philosophy?.minimalism || 1.0) * 100}%
  * Clarity priority: ${(optimizedDNA.philosophy?.clarity || 1.0) * 100}%

- LAYOUT GRAMMAR CONSTRAINTS (Crucial for UI placement):
  ${optimizedGrammar.constraints.map(c => `* ${c}`).join('\n  ')}

- MOTION LANGUAGE:
  * Energy: ${optimizedMotion.energy}
  * Preferred transitions: ${JSON.stringify(optimizedMotion.style)}
  * Strictly avoid: ${JSON.stringify(optimizedMotion.avoid)}

- STORYTELLING & ASSET SELECTION:
  * Pacing: ${style.storytelling?.pacing || "steady"}
  * Average Scene Duration: ${style.storytelling?.averageSceneDuration || 6}s
  * Preferred assets: ${JSON.stringify(style.assets?.preferred || [])}
  * Avoid assets: ${JSON.stringify(style.assets?.avoid || [])}
`;
}
```

**Step 2: Viết test kiểm thử hàm getStylePrompt**
Thêm trường hợp test vào `backend/test_vde.js`:
```javascript
function testStylePromptOptimization() {
  console.log('- Test: Prompt Optimization (Strips CSS details)');
  const prompt = vde.getStylePrompt('apple', ['vertical_video']);
  assert.ok(prompt.includes('STYLE IDENTITY: "apple"'), 'Should show compiled style identity');
  assert.ok(prompt.includes('Active Traits: vertical_video'), 'Should show active traits');
  assert.ok(!prompt.includes('spacing'), 'Should NOT include CSS spacing details in prompt guidelines');
  assert.ok(!prompt.includes('cardBg'), 'Should NOT include CSS color parameters in prompt guidelines');
  console.log('  => PASS');
}
```
Và gọi `testStylePromptOptimization();` trong khối `try`.

**Step 3: Chạy unit test**
Chạy: `node backend/test_vde.js`
Expected: Toàn bộ kiểm thử đều Pass.

**Step 4: Commit**
```bash
git add backend/services/vde.js backend/test_vde.js
git commit -m "feat: implement prompt optimization pruning CSS tokens in VDE"
```

---

### Task 5: Tích hợp VDE Compiler vào Gemini Prompt và Express Endpoint

**Files:**
- Modify: `backend/services/ai.js`
- Modify: `backend/server.js`

**Step 1: Cập nhật AI Service (ai.js) để nạp traits theo ngữ cảnh**
Tự động thêm trait `vertical_video` nếu video có tỉ lệ dọc (ví dụ: `aspectRatio === "9:16"`).
Sửa `backend/services/ai.js` tại hàm gọi sinh kịch bản để nạp cấu hình VDE động:
```javascript
// Đọc cấu hình style và trait
const vde = require('./vde');
const activeTraits = [];
if (aspectRatio === '9:16') {
  activeTraits.push('vertical_video');
}
// Nếu trong yêu cầu có truyền thêm traits đặc thù từ UI
if (requestTraits && Array.isArray(requestTraits)) {
  requestTraits.forEach(t => {
    if (!activeTraits.includes(t)) activeTraits.push(t);
  });
}
const stylePrompt = vde.getStylePrompt(visualStyle, activeTraits);
```
Sau đó thay thế chuỗi prompt nạp vào Gemini bằng `stylePrompt` này.

**Step 2: Cập nhật Express Endpoint (server.js)**
Sửa API `POST /api/storyboard` nhận thêm `traits` từ `req.body`:
```javascript
const { topic, voiceId, visualStyle, duration, ratio, traits } = req.body;
```
Lưu trữ `traits` vào cơ sở dữ liệu `db.json` trong bản ghi storyboard để khi Frontend nạp lại, hoặc render video, có thể biên dịch chính xác Runtime Style IR.

**Step 3: Commit**
```bash
git add backend/services/ai.js backend/server.js
git commit -m "feat: integrate VDE compiler and contextual traits into Gemini Prompt and server routes"
```

---

### Task 6: Tích hợp chọn Traits vào Frontend Config UI

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx`

**Step 1: Bổ sung các checkbox/multiselect cho Traits trên SidebarConfig**
Thêm giao diện cho phép bật/tắt các Trait bổ trợ:
- `dark_theme` (Chủ đề tối)
- `glass_effect` (Hiệu ứng kính mờ)

Gửi kèm mảng `traits` trong body request khi nhấn "Tạo Storyboard".

**Step 2: Commit**
```bash
git add frontend/src/components/SidebarConfig.jsx
git commit -m "feat: add style traits options to sidebar configuration UI"
```
