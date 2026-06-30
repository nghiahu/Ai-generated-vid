# Constraint-based Video Layout Engine Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Đại tu hệ thống bố cục giao diện video thành hệ thống lắp ghép động dựa trên kích thước ràng buộc (Constraints) và độ ưu tiên (Priority), tích hợp đồng bộ WYSIWYG lên màn hình Preview của Frontend Web Editor.

**Architecture:**
1. Tạo tệp tin tiện ích `layoutResolver.ts` chứa giải thuật ánh xạ phân cảnh thành các mô tả thành phần UI và giải quyết xung đột chiều cao.
2. Xây dựng thư viện component UI động (`TitleBlock`, `TerminalBlock`, `HeroMetricBlock`, `FeatureCardBlock`, `BadgeRowBlock`).
3. Tạo tệp `DynamicLayout.tsx` đóng vai trò là bộ hiển thị tổng quát nhận dữ liệu, giải quyết ràng buộc, áp dụng Theme và render.
4. Tích hợp `DynamicLayout` vào `MainComposition.tsx` của Remotion.
5. Cập nhật `StoryboardEditor.jsx` ở Frontend để chạy cùng giải thuật `layoutResolver` nhằm hiển thị chính xác những gì sẽ được render ra video.

**Tech Stack:** React, Remotion, TypeScript.

---

### Task 1: Xây dựng tệp phân tích ràng buộc `layoutResolver.ts`
**Files:**
- Create: [layoutResolver.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/utils/layoutResolver.ts)

**Step 1: Viết mã nguồn cho layoutResolver.ts**
Định nghĩa cấu trúc Component và giải thuật lọc ưu tiên khi tổng chiều cao vượt quá 1600px.
```typescript
export interface UIComponentDescriptor {
  id: string;
  type: "title" | "hero_metric" | "terminal" | "feature_card" | "badge_row" | "media";
  height: number;
  priority: number;
  data: any;
}

// Helper to inspect points and convert to components
export const parseSceneToComponents = (
  heading: string,
  points: string[],
  imageUrl: string,
  layoutType: string
): UIComponentDescriptor[] => {
  const list: UIComponentDescriptor[] = [];

  // 1. Title is always required
  list.push({
    id: "title",
    type: "title",
    height: 180,
    priority: 100,
    data: { text: heading }
  });

  // 2. Parse points into specific UI elements
  if (points && points.length > 0) {
    points.forEach((pt, idx) => {
      const p = pt.trim();
      if (!p) return;

      // A. Terminal Command
      const isCommandLine = p.startsWith("$") || p.includes("curl ") || p.includes("npm install") || p.includes("pip install") || p.includes("git clone");
      if (isCommandLine) {
        list.push({
          id: `term_${idx}`,
          type: "terminal",
          height: 140,
          priority: 85,
          data: { code: p }
        });
        return;
      }

      // B. Badges Row
      const isBadges = p.includes(",") && (p.includes("⭐") || p.includes("🔥") || p.includes("sao") || p.includes("MIT") || p.length < 60);
      if (isBadges) {
        list.push({
          id: `badges_${idx}`,
          type: "badge_row",
          height: 80,
          priority: 50,
          data: { badges: p.split(",").map(b => b.trim()).filter(b => b.length > 0) }
        });
        return;
      }

      // C. Hero Metric
      const isHeroMetric = p.startsWith("-") || p.startsWith("+") || p.match(/^[+-]?\d+%/i);
      if (isHeroMetric) {
        const parenStart = p.indexOf("(");
        const parenEnd = p.indexOf(")");
        let value = p;
        let subtext = "";
        
        if (parenStart !== -1 && parenEnd !== -1) {
          value = p.substring(0, parenStart).trim();
          subtext = p.substring(parenStart + 1, parenEnd).trim();
        } else {
          const dashIdx = p.indexOf("—");
          if (dashIdx !== -1) {
            value = p.substring(0, dashIdx).trim();
            subtext = p.substring(dashIdx + 1).trim();
          }
        }
        list.push({
          id: `metric_${idx}`,
          type: "hero_metric",
          height: 180,
          priority: 90,
          data: { value, subtext }
        });
        return;
      }

      // D. Default Feature Card
      list.push({
        id: `card_${idx}`,
        type: "feature_card",
        height: 100,
        priority: 70,
        data: { text: p }
      });
    });
  }

  // 3. Media block if we are in SplitScreen layout
  if (imageUrl && layoutType === "Split Screen") {
    list.push({
      id: "media",
      type: "media",
      height: 380,
      priority: 60,
      data: { url: imageUrl }
    });
  }

  return list;
};

// Collision resolver algorithm
export const resolveLayoutConstraints = (
  components: UIComponentDescriptor[],
  maxHeight: number = 1550,
  gap: number = 30
): UIComponentDescriptor[] => {
  let active = [...components];

  while (active.length > 0) {
    const totalHeight = active.reduce((sum, item) => sum + item.height, 0) + (active.length - 1) * gap;
    if (totalHeight <= maxHeight) {
      break;
    }

    // Find the active component with the lowest priority to remove
    let lowestIdx = 0;
    for (let i = 1; i < active.length; i++) {
      if (active[i].priority < active[lowestIdx].priority) {
        lowestIdx = i;
      }
    }

    // Remove the lowest priority item
    active.splice(lowestIdx, 1);
  }

  return active;
};
```

---

### Task 2: Xây dựng các UI Block Components động theo Theme
**Files:**
- Create: [UIBlocks.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/components/layout/UIBlocks.tsx)

**Step 1: Viết tệp chứa tất cả các React component UI động**
Viết mã nguồn nhận các style theme và render ra giao diện tương ứng cho `TitleBlock`, `TerminalBlock`, `HeroMetricBlock`, `FeatureCardBlock`, `BadgeRowBlock`.
```tsx
import React from "react";
import { Img } from "remotion";

export const getThemeStyles = (themeName: string, accentColor: string) => {
  const isBrutalist = themeName === "brutalist";
  const isMinimal = themeName === "minimalist";
  const isCyber = themeName === "cyberpunk";

  return {
    fontFamily: isBrutalist ? "Space Grotesk, sans-serif" : isCyber ? "JetBrains Mono, monospace" : isMinimal ? "Inter, sans-serif" : "Outfit, sans-serif",
    cardStyle: {
      padding: "20px 24px",
      width: "100%",
      boxSizing: "border-box" as const,
      transition: "all 0.2s ease-in-out",
      ...(isBrutalist ? {
        backgroundColor: "#ffffff",
        border: "3px solid #000000",
        boxShadow: "6px 6px 0px 0px #000000",
        borderRadius: "0px",
        color: "#000000"
      } : isCyber ? {
        backgroundColor: "rgba(2, 2, 6, 0.85)",
        border: `1.5px solid ${accentColor}`,
        boxShadow: `0 0 12px ${accentColor}25`,
        borderRadius: "4px",
        color: "#ffffff"
      } : isMinimal ? {
        backgroundColor: "#fafafa",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        color: "#0f172a"
      } : {
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: "12px",
        color: "#ffffff"
      })
    }
  };
};

export const TitleBlock: React.FC<{ text: string; theme: string; accentColor: string }> = ({ text, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  
  return (
    <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Small Badge Category */}
      <div>
        <span style={{
          fontSize: "12px",
          fontFamily: "Space Grotesk, monospace",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "3px",
          padding: "5px 12px",
          borderRadius: isBrutalist ? "0px" : "20px",
          border: isBrutalist ? "2px solid #000000" : `1.5px solid ${accentColor}`,
          color: isBrutalist ? "#000000" : accentColor,
          backgroundColor: isBrutalist ? "#ffffff" : `${accentColor}15`,
        }}>
          • FEATURE INFO •
        </span>
      </div>

      <h1 style={{
        fontSize: text.length > 25 ? "52px" : "68px",
        lineHeight: 0.95,
        margin: 0,
        color: isBrutalist ? "#000000" : "#ffffff",
        fontWeight: 900,
        fontFamily: styles.fontFamily,
        textTransform: "uppercase",
        letterSpacing: "-0.01em",
        textShadow: isBrutalist ? "none" : `0 4px 15px rgba(0,0,0,0.5), 0 0 10px ${accentColor}15`
      }}>
        {text}
      </h1>
    </div>
  );
};

export const TerminalBlock: React.FC<{ code: string; theme: string; accentColor: string }> = ({ code, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  const cleanCode = code.startsWith("$") ? code.substring(1).trim() : code;

  return (
    <div style={{
      ...styles.cardStyle,
      backgroundColor: isBrutalist ? "#ffffff" : "#020308",
      border: isBrutalist ? "3px solid #000000" : `1.5px solid ${accentColor}`,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px"
    }}>
      {/* Top Header */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", borderBottom: `1.5px solid ${isBrutalist ? "#000" : "rgba(255,255,255,0.08)"}`, paddingBottom: "8px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isBrutalist ? "#000" : "#ff5f56" }} />
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isBrutalist ? "#000" : "#ffbd2e" }} />
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isBrutalist ? "#000" : "#27c93f" }} />
        <span style={{ fontSize: "10px", color: isBrutalist ? "#000" : "rgba(255,255,255,0.3)", marginLeft: "8px", fontFamily: "JetBrains Mono, monospace" }}>bash</span>
      </div>
      {/* Code Area */}
      <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "16px", color: isBrutalist ? "#000000" : "#00FF66", textAlign: "left", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
        <span style={{ color: isBrutalist ? "#555" : "rgba(255,255,255,0.35)", marginRight: "10px" }}>$</span>
        {cleanCode}
        <span style={{ display: "inline-block", width: "8px", height: "15px", backgroundColor: isBrutalist ? "#000000" : "#00FF66", marginLeft: "4px" }} />
      </div>
    </div>
  );
};

export const HeroMetricBlock: React.FC<{ value: string; subtext: string; theme: string; accentColor: string }> = ({ value, subtext, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";
  
  return (
    <div style={{
      ...styles.cardStyle,
      display: "flex",
      alignItems: "center",
      gap: "24px",
    }}>
      <div style={{
        fontSize: "64px",
        fontWeight: 900,
        color: isBrutalist ? "#000000" : accentColor,
        fontFamily: "Space Grotesk, Impact, sans-serif",
        lineHeight: 1
      }}>
        {value}
      </div>
      {subtext && (
        <div style={{
          fontSize: "18px",
          fontWeight: 600,
          color: isBrutalist ? "#333333" : "rgba(255,255,255,0.6)",
          textAlign: "left",
          lineHeight: 1.2,
          fontFamily: styles.fontFamily
        }}>
          {subtext.includes(" · ") ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span>hơn</span>
              <s style={{ textDecorationColor: "#ff3333", textDecorationThickness: "2px" }}>
                {subtext.replace(/^hơn\s+/i, "")}
              </s>
            </div>
          ) : subtext}
        </div>
      )}
    </div>
  );
};

export const FeatureCardBlock: React.FC<{ text: string; theme: string; accentColor: string }> = ({ text, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";

  return (
    <div style={{
      ...styles.cardStyle,
      display: "flex",
      alignItems: "center",
      gap: "14px",
      fontSize: "18px",
      fontWeight: 700,
      textAlign: "left",
      lineHeight: 1.3
    }}>
      <span style={{
        width: "6px",
        height: "6px",
        backgroundColor: isBrutalist ? "#000000" : accentColor,
        flexShrink: 0
      }} />
      <span style={{ fontFamily: styles.fontFamily }}>{text}</span>
    </div>
  );
};

export const BadgeRowBlock: React.FC<{ badges: string[]; theme: string; accentColor: string }> = ({ badges, theme, accentColor }) => {
  const styles = getThemeStyles(theme, accentColor);
  const isBrutalist = theme === "brutalist";

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", width: "100%", justifyContent: "flex-start" }}>
      {badges.map((bg, idx) => (
        <span
          key={idx}
          style={{
            fontSize: "13px",
            fontWeight: "bold",
            padding: "6px 14px",
            borderRadius: isBrutalist ? "0px" : "6px",
            border: isBrutalist ? "2px solid #000000" : "1px solid rgba(255,255,255,0.08)",
            backgroundColor: isBrutalist ? "#ffffff" : "rgba(255,255,255,0.03)",
            boxShadow: isBrutalist ? "2px 2px 0px 0px #000000" : "none",
            color: isBrutalist ? "#000" : "#ffffff",
            fontFamily: styles.fontFamily
          }}
        >
          {bg}
        </span>
      ))}
    </div>
  );
};
```

---

### Task 3: Xây dựng Bộ bố cục động `DynamicLayout.tsx`
**Files:**
- Create: [DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/DynamicLayout.tsx)

**Step 1: Viết mã nguồn cho DynamicLayout.tsx**
Lồng ghép giải thuật lọc và sắp xếp các Component UI theo visualLayout (Hero, Split Screen, FeatureGrid, v.v.).
```tsx
import React from "react";
import { AbsoluteFill, Img } from "remotion";
import { parseSceneToComponents, resolveLayoutConstraints } from "../utils/layoutResolver";
import { 
  TitleBlock, 
  TerminalBlock, 
  HeroMetricBlock, 
  FeatureCardBlock, 
  BadgeRowBlock,
  getThemeStyles 
} from "../components/layout/UIBlocks";
import { AccentGlowBackground } from "../components/overlays/AccentGlowBackground";

export interface DynamicLayoutProps {
  layoutType: string;
  heading: string;
  points: string[];
  imageUrl: string;
  accentColor?: string;
  theme?: string;
}

export const DynamicLayout: React.FC<DynamicLayoutProps> = ({
  layoutType,
  heading,
  points,
  imageUrl,
  accentColor = "#FFB7C5",
  theme = "glassmorphism"
}) => {
  // 1. Generate & resolve components constraints
  const rawComponents = parseSceneToComponents(heading, points, imageUrl, layoutType);
  const resolvedComponents = resolveLayoutConstraints(rawComponents, 1600, 30);

  // Helper to render active components
  const renderComponent = (comp: any) => {
    switch (comp.type) {
      case "title":
        return <TitleBlock key={comp.id} text={comp.data.text} theme={theme} accentColor={accentColor} />;
      case "terminal":
        return <TerminalBlock key={comp.id} code={comp.data.code} theme={theme} accentColor={accentColor} />;
      case "hero_metric":
        return <HeroMetricBlock key={comp.id} value={comp.data.value} subtext={comp.data.subtext} theme={theme} accentColor={accentColor} />;
      case "feature_card":
        return <FeatureCardBlock key={comp.id} text={comp.data.text} theme={theme} accentColor={accentColor} />;
      case "badge_row":
        return <BadgeRowBlock key={comp.id} badges={comp.data.badges} theme={theme} accentColor={accentColor} />;
      default:
        return null;
    }
  };

  // 2. Render structures based on layoutType
  if (layoutType === "Split Screen") {
    // 50-50 Split layout
    return (
      <AbsoluteFill style={{ display: "flex", flexDirection: "row", width: "100%", height: "100%" }}>
        {/* Left Column (Illustration / Glow) */}
        <div style={{ width: "50%", height: "100%", position: "relative", overflow: "hidden", borderRight: "4px solid rgba(255,255,255,0.05)" }}>
          {imageUrl ? (
            <Img src={imageUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <AccentGlowBackground accentColor={accentColor} />
          )}
        </div>
        {/* Right Column (Contents) */}
        <div style={{ 
          width: "50%", 
          height: "100%", 
          padding: "50px 30px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          gap: "24px",
          boxSizing: "border-box"
        }}>
          {resolvedComponents.filter(c => c.type !== "media").map(renderComponent)}
        </div>
      </AbsoluteFill>
    );
  }

  if (layoutType === "FeatureGrid") {
    // Bento/Grid display for feature cards
    const titleComp = resolvedComponents.find(c => c.type === "title");
    const gridCards = resolvedComponents.filter(c => c.type === "feature_card");
    const otherComps = resolvedComponents.filter(c => c.type !== "title" && c.type !== "feature_card");

    return (
      <AbsoluteFill style={{ padding: "60px 40px", display: "flex", flexDirection: "column", gap: "30px", boxSizing: "border-box", justifyContent: "center" }}>
        {/* Render Title */}
        {titleComp && renderComponent(titleComp)}
        
        {/* Grid Container */}
        {gridCards.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", width: "100%" }}>
            {gridCards.map(renderComponent)}
          </div>
        )}

        {/* Other remaining comps (badges, metrics...) */}
        {otherComps.map(renderComponent)}
      </AbsoluteFill>
    );
  }

  // Default "Hero" or full screen vertical layout
  return (
    <AbsoluteFill style={{ padding: "60px 40px", display: "flex", flexDirection: "column", gap: "30px", boxSizing: "border-box", justifyContent: "center" }}>
      {resolvedComponents.map(renderComponent)}
    </AbsoluteFill>
  );
};
```

---

### Task 4: Tích hợp `DynamicLayout` vào `MainComposition.tsx`
**Files:**
- Modify: [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx)

**Step 1: Thay thế các nhánh layout PowerPoint cũ**
Import `DynamicLayout` và sử dụng nó làm bộ render duy nhất cho tất cả các phân cảnh trong [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx) khoảng dòng 152-175:
```tsx
import { DynamicLayout } from "./DynamicLayout";

// Thay dòng 152-174 bằng:
            <DynamicLayout
              layoutType={scene.visualLayout}
              heading={scene.heading}
              points={scene.points}
              imageUrl={imageUrl}
              accentColor={scene.accentColor}
              theme={config?.videoTheme || "glassmorphism"}
            />
```

---

### Task 5: Đồng bộ WYSIWYG lên Frontend Web UI (`StoryboardEditor.jsx`)
**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Định nghĩa hàm giải ràng buộc tối giản trực tiếp ở Editor**
Đầu file [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx) (hoặc trực tiếp bên trong component), định nghĩa giải thuật giống Remotion để đồng bộ hiển thị các phần tử bị ẩn/hiện.
```javascript
// Thêm hàm resolver bên ngoài component:
const resolveEditorComponents = (scene, currentImg, layoutType) => {
  const list = [
    { type: 'title', height: 180, priority: 100, data: { text: scene.heading || "Untitled" } }
  ];

  if (scene.points) {
    scene.points.forEach((pt, idx) => {
      const p = pt.trim();
      if (!p) return;

      const isCommandLine = p.startsWith("$") || p.includes("curl ") || p.includes("npm install");
      if (isCommandLine) {
        list.push({ type: 'terminal', height: 140, priority: 85, data: { code: p } });
        return;
      }

      const isBadges = p.includes(",") && (p.includes("⭐") || p.includes("🔥") || p.length < 60);
      if (isBadges) {
        list.push({ type: 'badge_row', height: 80, priority: 50, data: { badges: p.split(",") } });
        return;
      }

      const isHeroMetric = p.startsWith("-") || p.startsWith("+") || p.match(/^[+-]?\d+%/i);
      if (isHeroMetric) {
        list.push({ type: 'hero_metric', height: 180, priority: 90, data: { text: p } });
        return;
      }

      list.push({ type: 'feature_card', height: 100, priority: 70, data: { text: p } });
    });
  }

  // Filter based on 1600px budget (scaled down on editor layout but logically same)
  let active = [...list];
  while (active.length > 0) {
    const totalHeight = active.reduce((sum, item) => sum + item.height, 0) + (active.length - 1) * 30;
    if (totalHeight <= 1550) break;
    
    let lowestIdx = 0;
    for (let i = 1; i < active.length; i++) {
      if (active[i].priority < active[lowestIdx].priority) lowestIdx = i;
    }
    active.splice(lowestIdx, 1);
  }

  return active;
};
```

**Step 2: Cập nhật hàm Render cho Preview Card 9:16 ở Editor**
Khoảng dòng 270-291, thay đổi cấu trúc render của các thành phần con để chạy qua bộ lọc ràng buộc `resolveEditorComponents`:
```jsx
                    {/* Bọc toàn bộ các thành phần hiển thị bên trong khung Preview */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      zIndex: 1,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "10px",
                      boxSizing: "border-box",
                      ...(scene.visualLayout === "Split Screen" ? { paddingLeft: "55%" } : {}) // Dịch nội dung sang bên phải nếu dùng Split
                    }}>
                      {resolveEditorComponents(scene, currentImg, scene.visualLayout).map((comp, idx) => {
                        if (comp.type === "title") {
                          return (
                            <div key={idx} style={{ borderWidth: "1px", backgroundColor: "#ffffff", border: "2px solid #000", padding: "4px", width: "100%", boxShadow: "2px 2px 0px 0px #000" }}>
                              <h3 style={{ fontSize: "11px", fontFamily: "Space Grotesk", fontWeight: "900", lineHeight: "1.1", textTransform: "uppercase", margin: 0 }}>
                                {comp.data.text}
                              </h3>
                            </div>
                          );
                        }
                        if (comp.type === "terminal") {
                          return (
                            <div key={idx} style={{ backgroundColor: "#000", color: "#00FF66", fontFamily: "monospace", padding: "6px", fontSize: "9px", borderRadius: "2px", textAlign: "left" }}>
                              $ {comp.data.code}
                            </div>
                          );
                        }
                        if (comp.type === "hero_metric" || comp.type === "feature_card") {
                          return (
                            <div key={idx} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: "700", textAlign: "left", textTransform: "uppercase" }}>
                              <span style={{ width: "4px", height: "4px", backgroundColor: "#000", flexShrink: 0 }}></span>
                              {comp.data.text}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
```

---

### Kế hoạch Kiểm thử & Xác minh (Verification Plan)
1. Chạy xác minh typecheck trong `my-video`: `npx tsc --noEmit`.
2. Mở trình duyệt Web Editor, thêm 7-8 gạch đầu dòng vào phân cảnh, xác nhận các ý thấp hơn (như Badge/Thẻ tính năng cuối cùng) sẽ tự động biến mất trên Preview 9:16 của Editor.
3. Xuất thử video Remotion hoặc chạy `remotion studio` để xác minh quấn sáng, thẻ kính mờ hoạt động chính xác theo Theme.
