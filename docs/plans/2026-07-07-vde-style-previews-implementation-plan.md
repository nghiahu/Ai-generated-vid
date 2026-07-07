# Visual VDE Style Previews and Claude & Light Styles Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Bổ sung hai phong cách thiết kế mới (Claude và Light) và dựng lại Modal chọn Style trên Web UI bằng code thực tế lấy trực tiếp từ tokens thay thế cho ảnh tĩnh tượng trưng.

**Architecture:** 
1. Thêm cấu hình mặc định cho `claude` và `light` vào `vde.js` trên Backend và tự động khởi tạo thư mục.
2. Tải và cấu hình font có chân `Playfair Display` cho style `claude` trong Remotion.
3. Thay thế lưới ảnh Unsplash trong Modal `showStyleModal` của `StoryboardEditor.jsx` bằng các khung điện thoại thu nhỏ (Mini Viewports) hiển thị thiết kế thật bằng React/CSS.
4. Tích hợp tùy chọn 2 style mới này vào dropdown cấu hình trên Sidebar.

**Tech Stack:** React, CSS, Node.js, Express, Remotion.

---

### Task 1: Bổ sung cấu hình Style mới trên Backend và chạy Unit Tests

**Files:**
- Modify: `backend/services/vde.js`
- Modify: `backend/test_vde.js`

**Step 1: Cập nhật BUILTIN_STYLES trong vde.js**
Thêm hai phong cách `claude` và `light` vào hằng số `BUILTIN_STYLES` trong [vde.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/services/vde.js):
```javascript
  claude: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 0.95, minimalism: 0.9 },
      tone: "warm editorial, premium publishing, claude beige, cozy scholarly",
      description: "Phong cách biên tập báo chí cổ điển của Anthropic Claude: nền cát ấm, tiêu đề có chân chữ lớn, màu nhấn cam đất sét ấm áp."
    },
    tokens: {
      colors: {
        background: "#FBF9F4",
        cardBg: "rgba(217, 107, 67, 0.03)",
        border: "rgba(217, 107, 67, 0.15)",
        accent: "#d96b43",
        text: "#191919",
        textSecondary: "#6b655f"
      },
      fonts: {
        title: "Playfair Display, Georgia, serif",
        body: "Inter"
      },
      radius: "20px"
    },
    motion: {
      energy: "low",
      style: ["fade", "opacity"]
    }
  },
  light: {
    extends: "minimal",
    dna: {
      philosophy: { oneIdeaPerScene: true, clarity: 1.0, minimalism: 0.95 },
      tone: "clean minimalist light, bright corporate, positive startup",
      description: "Thiết kế phẳng sáng sủa và tối giản: nền trắng tinh khiết, thẻ xám nhạt, màu nhấn xanh hoàng gia tươi tắn."
    },
    tokens: {
      colors: {
        background: "#ffffff",
        cardBg: "#f8fafc",
        border: "#e2e8f0",
        accent: "#2563eb",
        text: "#0f172a",
        textSecondary: "#475569"
      },
      fonts: {
        title: "Montserrat, Inter",
        body: "Inter"
      },
      radius: "16px",
      shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
    }
  }
```

**Step 2: Cập nhật Unit Tests trong test_vde.js**
Thêm trường hợp test kiểm tra nạp đúng style mới vào [test_vde.js](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/backend/test_vde.js):
```javascript
function testNewBuiltinStyles() {
  console.log('- Test: New VDE Styles (claude & light)');
  const claudeStyle = vde.getStyle('claude', []);
  assert.strictEqual(claudeStyle.tokens.colors.background, '#FBF9F4', 'Claude background must be #FBF9F4');
  assert.strictEqual(claudeStyle.tokens.colors.accent, '#d96b43', 'Claude accent must be clay orange');
  
  const lightStyle = vde.getStyle('light', []);
  assert.strictEqual(lightStyle.tokens.colors.background, '#ffffff', 'Light background must be #ffffff');
  assert.strictEqual(lightStyle.tokens.colors.accent, '#2563eb', 'Light accent must be royal blue');
  console.log('  => PASS');
}
```
Và gọi `testNewBuiltinStyles();` trong khối `try`.

**Step 3: Chạy test trên terminal**
Chạy: `node backend/test_vde.js`
Expected: Tất cả bài test đều PASS.

**Step 4: Commit**
```bash
git add backend/services/vde.js backend/test_vde.js
git commit -m "feat: add builtin VDE styles for Claude and Light with unit tests"
```

---

### Task 2: Cập nhật Font và Tokens trong dự án Remotion

**Files:**
- Modify: `my-video/src/styles/fonts.ts`
- Modify: `my-video/src/styles/vdeTokens.ts`
- Modify: `my-video/src/styles/themes.ts`

**Step 1: Nạp font có chân Playfair Display trong fonts.ts**
Sửa đổi [fonts.ts](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/my-video/src/styles/fonts.ts) để import thêm font:
```typescript
import { loadFont as loadPlayfairDisplay } from "@remotion/google-fonts/PlayfairDisplay";

// Playfair Display – font có chân dùng cho phong cách Claude Editorial
export const { fontFamily: fontPlayfairDisplay } = loadPlayfairDisplay("normal", {
  weights: ["600", "700", "800", "900"],
  subsets: ["latin", "vietnamese"],
});
```

**Step 2: Cập nhật fallback VDE_TOKENS trong vdeTokens.ts**
Thêm `claude` và `light` vào `VDE_TOKENS` tĩnh trong [vdeTokens.ts](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/my-video/src/styles/vdeTokens.ts):
```typescript
  claude: {
    colors: {
      background: "#FBF9F4",
      cardBg: "rgba(217, 107, 67, 0.03)",
      border: "1px solid rgba(217, 107, 67, 0.15)",
      accent: "#d96b43",
      text: "#191919",
      textSecondary: "#6b655f"
    },
    fonts: { title: "Playfair Display, Georgia, serif", body: "Inter" },
    radius: "20px",
    shadow: "none"
  },
  light: {
    colors: {
      background: "#ffffff",
      cardBg: "#f8fafc",
      border: "1px solid #e2e8f0",
      accent: "#2563eb",
      text: "#0f172a",
      textSecondary: "#475569"
    },
    fonts: { title: "Montserrat, Inter", body: "Inter" },
    radius: "16px",
    shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
  }
```

**Step 3: Cập nhật ánh xạ font có chân trong themes.ts**
Chỉnh sửa [themes.ts](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/my-video/src/styles/themes.ts) để gán font `Playfair Display` khi tiêu đề dùng font đó:
```typescript
import { fontOutfit, fontMontserrat, fontPlayfairDisplay } from "./fonts";
```
Và trong `getThemeStyles`:
```typescript
  const fontFamily = tokens.fonts?.title.includes("Playfair") 
    ? fontPlayfairDisplay 
    : tokens.fonts?.title || fontOutfit;
```

**Step 4: Chạy kiểm tra lỗi tsc & lints trong my-video**
Chạy: `npm run lint` inside `my-video`
Expected: Biên dịch thành công không lỗi.

**Step 5: Commit**
```bash
git -C my-video add src/styles/fonts.ts src/styles/vdeTokens.ts src/styles/themes.ts
git -C my-video commit -m "feat: add Playfair Display font and style tokens for Claude and Light themes"
```

---

### Task 3: Dựng lại giao diện Modal chọn Style bằng Code Previews thực tế

**Files:**
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Khai báo danh sách các VDE Styles cần chọn và render mockup**
Thay thế `IMAGE_STYLES` hoặc tạo một hằng số `VDE_PRESET_STYLES` trong [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx):
```javascript
const VDE_PRESET_STYLES = [
  {
    id: "minimal",
    name: "Minimalist Dark",
    description: "Nền tối chàm, các thẻ kính mờ phát sáng nhẹ, thanh lịch và tập trung.",
    tokens: {
      background: "#080b11",
      cardBg: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
      border: "1px solid rgba(255,255,255,0.12)",
      text: "#ffffff",
      textSecondary: "rgba(255,255,255,0.6)",
      accent: "#3b82f6",
      radius: "16px",
      shadow: "0 10px 30px rgba(0,0,0,0.5)",
      fontFamily: "sans-serif"
    }
  },
  {
    id: "apple",
    name: "Apple Keynote",
    description: "Nền đen tuyền, chữ trắng cực lớn, tối giản và cao cấp tuyệt đối.",
    tokens: {
      background: "#000000",
      cardBg: "rgba(255, 255, 255, 0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      text: "#ffffff",
      textSecondary: "#86868b",
      accent: "#ffffff",
      radius: "24px",
      shadow: "none",
      fontFamily: "sans-serif"
    }
  },
  {
    id: "claude",
    name: "Claude Editorial",
    description: "Nền cát ấm, chữ có chân sang trọng, cam đất sét gạch ấm áp.",
    tokens: {
      background: "#FBF9F4",
      cardBg: "rgba(217, 107, 67, 0.03)",
      border: "1px solid rgba(217, 107, 67, 0.15)",
      text: "#191919",
      textSecondary: "#6b655f",
      accent: "#d96b43",
      radius: "16px",
      shadow: "none",
      fontFamily: "Georgia, serif"
    }
  },
  {
    id: "light",
    name: "Minimalist Light",
    description: "Nền trắng tinh, xám sáng hiện đại, màu xanh nhấn đầy năng lượng.",
    tokens: {
      background: "#ffffff",
      cardBg: "#f8fafc",
      border: "1px solid #e2e8f0",
      text: "#0f172a",
      textSecondary: "#475569",
      accent: "#2563eb",
      radius: "12px",
      shadow: "0 10px 20px rgba(0,0,0,0.03)",
      fontFamily: "sans-serif"
    }
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Grid",
    description: "Giao diện kỹ thuật số tương lai, neon hồng/xanh lam rực rỡ.",
    tokens: {
      background: "#030008",
      cardBg: "linear-gradient(135deg, rgba(255,0,128,0.08) 0%, rgba(0,229,255,0.03) 100%)",
      border: "1px solid rgba(0,229,255,0.25)",
      text: "#ffffff",
      textSecondary: "rgba(255,255,255,0.7)",
      accent: "#ff007f",
      radius: "6px",
      shadow: "0 0 15px rgba(0,229,255,0.2)",
      fontFamily: "monospace"
    }
  },
  {
    id: "anime",
    name: "Anime Sketch",
    description: "Phong cách comic thô nét viền đen đậm đầy sáng tạo.",
    tokens: {
      background: "#fdf8f5",
      cardBg: "#ffffff",
      border: "3px solid #000000",
      text: "#1e1e24",
      textSecondary: "#5a5a66",
      accent: "#ff6b6b",
      radius: "14px",
      shadow: "5px 5px 0px #000000",
      fontFamily: "sans-serif"
    }
  }
];
```

**Step 2: Thay đổi Modal render trong StoryboardEditor.jsx**
Cập nhật nội dung render Modal `showStyleModal` ở `StoryboardEditor.jsx` (trong khu vực từ dòng 480 đến 630):
- Duyệt qua `VDE_PRESET_STYLES` thay vì `IMAGE_STYLES`.
- Vẽ viewport thu nhỏ của từng style áp dụng đúng đắn các tokens tương ứng.
- Khi click chọn, lưu `selectedStyle` là ID của style đó (ví dụ: `minimal`, `apple`, `claude`, `light`).

Giao diện viewport vẽ mẫu trong code React:
```jsx
<div style={{
  width: "100%",
  aspectRatio: "9/16",
  backgroundColor: style.tokens.background,
  border: isSelected ? "3px solid #000" : "1.5px solid #e2e8f0",
  borderRadius: "16px",
  padding: "12px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  backgroundImage: style.id === "cyberpunk" ? "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)" : "none",
  backgroundSize: "15px 15px",
  boxShadow: isSelected ? "5px 5px 0px #000000" : "none",
  transition: "transform 0.15s, box-shadow 0.15s",
  transform: isSelected ? "scale(1.02)" : "scale(1)"
}}>
  <div style={{
    width: "100%",
    backgroundColor: style.tokens.cardBg.includes("gradient") ? undefined : style.tokens.cardBg,
    backgroundImage: style.tokens.cardBg.includes("gradient") ? style.tokens.cardBg : undefined,
    border: style.tokens.border,
    borderRadius: style.tokens.radius,
    boxShadow: style.tokens.shadow,
    padding: "10px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "5px"
  }}>
    <div style={{
      color: style.tokens.text,
      fontFamily: style.tokens.fontFamily,
      fontSize: "9px",
      fontWeight: "bold",
      textTransform: "uppercase",
      lineHeight: "1.2"
    }}>
      {style.id === "apple" ? "SIMPLE KEYNOTE" : "Title Scene"}
    </div>
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      <div style={{ width: "3.5px", height: "3.5px", borderRadius: "50%", backgroundColor: style.tokens.accent }} />
      <div style={{ width: "35px", height: "2.5px", backgroundColor: style.tokens.textSecondary, borderRadius: "1px" }} />
    </div>
  </div>
</div>
```

**Step 3: Cập nhật hàm handleConfirmStyle**
Đảm bảo khi click "Chọn", nó gọi:
```javascript
  const handleConfirmStyle = () => {
    setShowStyleModal(false);
    onGenerateStoryboard(scriptText, selectedStyle);
  };
```
Và khởi tạo `selectedStyle` mặc định là `"minimal"` thay vì `"photography"` ở `StoryboardEditor.jsx` dòng 256.

**Step 4: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat: redesign visual style selection modal with code-rendered Viewport previews"
```

---

### Task 4: Cập nhật dropdown chọn Style trên SidebarConfig

**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx`

**Step 1: Thêm tùy chọn Claude và Light vào dropdown**
Tìm phần render dropdown Visual Design Style (VDE) trong [SidebarConfig.jsx](file:///c:/Users/nghia/OneDrive/Máy%20tính/AI-grenerated%20vid-hyperframe/frontend/src/components/SidebarConfig.jsx) và sửa thành:
```jsx
            <select
              className="form-input-mono"
              value={config.visualStyle || "minimal"}
              onChange={(e) => handleConfigChange("visualStyle", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="minimal">Minimalist Clean (Default)</option>
              <option value="apple">Apple Keynote (Pure Black/White)</option>
              <option value="claude">Claude Editorial (Warm Beige)</option>
              <option value="light">Minimalist Light (Bright White)</option>
              <option value="cyberpunk">Cyberpunk Neon Grid</option>
              <option value="anime">Anime Comic Hand-drawn</option>
            </select>
```

**Step 2: Commit**
```bash
git add frontend/src/components/SidebarConfig.jsx
git commit -m "feat: add Claude and Light options to VDE style configuration dropdown"
```
