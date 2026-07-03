# Dynamic Visual Themes & Effects Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Nâng cấp hệ thống tạo video để sinh video có giao diện Glassmorphism rực rỡ (thay thế đen trắng thô), có hiệu ứng hạt động (cánh hoa anh đào, kỹ thuật số, bụi sáng) và phụ đề đồng bộ.

**Architecture:** Cập nhật prompt Gemini để tự động sinh thuộc tính `theme` và `accentColor` cho mỗi phân cảnh. Cập nhật frontend và Remotion để hỗ trợ nhiều Phong cách video (Video Themes) khác nhau. Xây dựng các lớp hạt động trong Remotion sử dụng `useCurrentFrame` và cơ chế hiển thị phụ đề nổi bật cụm từ tự động.

**Tech Stack:** React, Remotion, Node.js/Express, Tailwind/Vanilla CSS, Gemini API.

---

### Task 1: Cập nhật API Backend sinh Storyboard
**Files:**
- Modify: `backend/services/ai.js`
- Modify: `backend/server.js`

**Step 1: Cập nhật prompt và hàm trong ai.js**
Cập nhật prompt của Gemini để bổ sung `theme` và `accentColor`. Thay thế dòng 17-64 trong [ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js):
```javascript
    const prompt = `
      You are an expert AI video producer. Parse the following raw script text into a structured storyboard (scenes).
      For each scene, determine the layout, theme, accent color, and estimate duration (assume 3 Vietnamese words per second).
      
      Raw Script:
      "${scriptText}"
      
      You must respond with a JSON array of scene objects matching this JSON Schema:
      [
        {
          "layoutFamily": "Opening / Headline" | "Points / List" | "Quote / Text",
          "visualLayout": "Intro Profile" | "Github Status Hook" | "Split Grid",
          "heading": "Scene title/heading in Vietnamese",
          "points": ["Up to 3 bullet points summarizing this scene, in Vietnamese"],
          "voiceover": "The subset of the script text read in this scene, in Vietnamese",
          "duration": estimated duration in seconds (number, e.g. 7.5),
          "placement": "Full" | "Split",
          "keywords": "1-3 English keywords for Unsplash photo search based on visual context, e.g., 'coding laptop'",
          "theme": "japan" | "tech" | "finance" | "nature" | "default",
          "accentColor": "A vibrant HEX color matching the theme, e.g., '#FFB7C5' for japan, '#00E5FF' for tech, '#FFD700' for finance"
        }
      ]
      
      Return ONLY the raw JSON array. Do not include markdown formatting or wrapping.
    `;
```
Và cập nhật hàm map kết quả trả về:
```javascript
    return scenes.map((scene, index) => ({
      id: `scene_${Date.now()}_${index}`,
      sceneIndex: index,
      duration: Number(scene.duration) || 6.0,
      layoutFamily: scene.layoutFamily || "Opening / Headline",
      visualLayout: scene.visualLayout || "Intro Profile",
      heading: scene.heading || `Phân cảnh ${index + 1}`,
      points: Array.isArray(scene.points) ? scene.points : [],
      voiceover: scene.voiceover || "",
      placement: scene.placement || "Full",
      keywords: scene.keywords || "technology",
      theme: scene.theme || "default",
      accentColor: scene.accentColor || "#FFB7C5"
    }));
```

**Step 2: Cập nhật route trong server.js**
Cập nhật `POST /api/projects/:id/generate-storyboard` trong [server.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/server.js) dòng 183-196 để thêm `theme` và `accentColor`:
```javascript
      scenes.push({
        id: sceneId,
        sceneIndex: i,
        duration: scene.duration || 6.0,
        layoutFamily: scene.layoutFamily,
        visualLayout: scene.visualLayout,
        heading: scene.heading,
        points: scene.points,
        voiceover: scene.voiceover,
        voiceoverAudioUrl,
        placement: scene.placement,
        mediaList,
        selectedMediaIndex: 0,
        theme: scene.theme || "default",
        accentColor: scene.accentColor || "#FFB7C5"
      });
```

---

### Task 2: Cập nhật giao diện cài đặt chủ đề trên Frontend Web UI
**Files:**
- Modify: `frontend/src/components/SidebarConfig.jsx`
- Modify: `frontend/src/components/StoryboardEditor.jsx`

**Step 1: Thêm bộ chọn Video Theme vào SidebarConfig.jsx**
Thêm phần chọn phong cách giao diện video trong [SidebarConfig.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/SidebarConfig.jsx) ngay dưới BGM select (khoảng dòng 195):
```javascript
        {/* Video Theme select */}
        <div>
          <label className="form-label-mono">Video Theme</label>
          <div style={{ position: "relative" }}>
            <select
              className="form-input-mono"
              value={config.videoTheme || "glassmorphism"}
              onChange={(e) => handleConfigChange("videoTheme", e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="glassmorphism">Vibrant Glassmorphism (Premium)</option>
              <option value="brutalist">Brutalist Neo-Pop (Dynamic)</option>
              <option value="minimalist">Minimalist Clean (Elegant)</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
            </select>
          </div>
        </div>
```

**Step 2: Thêm thuộc tính Theme và Accent Color vào StoryboardEditor.jsx**
Bổ sung các trường chỉnh sửa `theme` và `accentColor` cho mỗi phân cảnh trong thẻ Scene Card của [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx) (khoảng dòng 334):
```javascript
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Hiệu ứng hạt (Theme)</label>
                      <select 
                        className="form-input-mono"
                        value={scene.theme || "default"} 
                        onChange={(e) => handleFieldChange(scene.id, "theme", e.target.value)}
                        style={{ padding: "8px", fontSize: "12px" }}
                      >
                        <option value="default">Mặc định (Bokeh)</option>
                        <option value="japan">Nhật Bản (Sakura)</option>
                        <option value="tech">Công nghệ (Digital)</option>
                        <option value="finance">Tài chính (Gold)</option>
                        <option value="nature">Thiên nhiên (Lá rụng)</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label-mono" style={{ fontSize: "11px" }}>Màu nhấn (Accent HEX)</label>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <input 
                          className="form-input-mono"
                          type="color" 
                          value={scene.accentColor || "#FFB7C5"} 
                          onChange={(e) => handleFieldChange(scene.id, "accentColor", e.target.value)}
                          style={{ width: "35px", height: "35px", padding: 0, cursor: "pointer", border: "2px solid #000" }}
                        />
                        <input 
                          className="form-input-mono"
                          type="text" 
                          value={scene.accentColor || "#FFB7C5"} 
                          onChange={(e) => handleFieldChange(scene.id, "accentColor", e.target.value)}
                          style={{ padding: "8px", fontSize: "12px", flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>
```

---

### Task 3: Xây dựng các component hiệu ứng hạt trong Remotion
**Files:**
- Create: `my-video/src/components/overlays/SakuraOverlay.tsx`
- Create: `my-video/src/components/overlays/TechParticlesOverlay.tsx`
- Create: `my-video/src/components/overlays/DefaultBokehOverlay.tsx`

**Step 1: Viết mã nguồn cho SakuraOverlay.tsx**
Vẽ các cánh hoa anh đào đung đưa và rơi bằng SVG. Sử dụng hàm của Remotion để chuyển động liên tục:
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const SakuraOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const petalCount = 18;

  // Khởi tạo vị trí ngẫu nhiên giả lập (seed-based)
  const petals = Array.from({ length: petalCount }).map((_, i) => {
    const seed = i * 456.78;
    const xSpeed = 1.5 + (Math.sin(seed) + 1) * 1.5;
    const ySpeed = 2.5 + (Math.cos(seed) + 1) * 2;
    const scale = 0.5 + (Math.sin(seed * 2) + 1) * 0.4;
    const startX = (seed * 123) % width;
    const swayAmp = 15 + (Math.cos(seed * 3) + 1) * 15;
    
    // Tính toán tọa độ rơi hiện tại
    const currentY = (ySpeed * frame) % (height + 100) - 50;
    const sway = Math.sin(frame * 0.04 + seed) * swayAmp;
    const currentX = (startX + frame * xSpeed + sway) % width;
    const rotation = (frame * (ySpeed * 0.3) + seed) % 360;

    return { x: currentX, y: currentY, scale, rotation, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 5, overflow: "hidden", pointerEvents: "none" }}>
      {petals.map((p) => (
        <svg
          key={p.id}
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            width: "35px",
            height: "35px",
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
            transformOrigin: "center",
            opacity: 0.85
          }}
        >
          {/* Cánh hoa anh đào vẽ bằng SVG path */}
          <path
            d="M 50,5 C 40,30 20,40 25,65 C 30,85 50,95 50,95 C 50,95 70,85 75,65 C 80,40 60,30 50,5 Z"
            fill="#FFB7C5"
          />
        </svg>
      ))}
    </div>
  );
};
```

**Step 2: Viết mã nguồn cho TechParticlesOverlay.tsx**
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const TechParticlesOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const digitCount = 12;

  const digits = Array.from({ length: digitCount }).map((_, i) => {
    const seed = i * 987.65;
    const startX = (seed * 87) % width;
    const ySpeed = 3 + (Math.sin(seed) + 1) * 2;
    const scale = 0.8 + (Math.cos(seed * 3) + 1) * 0.4;
    const currentY = height - ((frame * ySpeed) % (height + 100));
    const digit = Math.sin(seed + frame * 0.05) > 0 ? "1" : "0";
    const opacity = 0.15 + (Math.sin(frame * 0.08 + seed) + 1) * 0.2;

    return { x: startX, y: currentY, val: digit, scale, opacity, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 5, overflow: "hidden", pointerEvents: "none" }}>
      {/* Kẻ lưới điện tử mờ */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />
      {digits.map((d) => (
        <span
          key={d.id}
          style={{
            position: "absolute",
            left: `${d.x}px`,
            top: `${d.y}px`,
            fontSize: "28px",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "#00E5FF",
            opacity: d.opacity,
            transform: `scale(${d.scale})`,
            textShadow: "0 0 8px rgba(0, 229, 255, 0.5)"
          }}
        >
          {d.val}
        </span>
      ))}
    </div>
  );
};
```

**Step 3: Viết mã nguồn cho DefaultBokehOverlay.tsx**
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const DefaultBokehOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const orbCount = 5;

  const orbs = Array.from({ length: orbCount }).map((_, i) => {
    const seed = i * 234.56;
    const startX = (seed * 43) % width;
    const startY = (seed * 89) % height;
    
    // Tạo quỹ đạo bay chậm lơ lửng quanh màn hình
    const currentX = startX + Math.sin(frame * 0.01 + seed) * 100;
    const currentY = startY + Math.cos(frame * 0.008 + seed) * 100;
    const size = 150 + (Math.sin(frame * 0.005 + seed) + 1) * 100;
    const opacity = 0.1 + (Math.cos(frame * 0.015 + seed) + 1) * 0.1;
    const color = i % 2 === 0 ? "rgba(99, 102, 241, 0.4)" : "rgba(236, 72, 153, 0.3)"; // Indigo and Pink bokeh

    return { x: currentX, y: currentY, size, opacity, color, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 4, overflow: "hidden", pointerEvents: "none" }}>
      {orbs.map((orb) => (
        <div
          key={orb.id}
          style={{
            position: "absolute",
            left: `${orb.x - orb.size / 2}px`,
            top: `${orb.y - orb.size / 2}px`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            borderRadius: "50%",
            backgroundColor: orb.color,
            opacity: orb.opacity,
            filter: "blur(50px)",
            transform: "translateZ(0)"
          }}
        />
      ))}
    </div>
  );
};
```

---

### Task 4: Xây dựng Component Phụ đề động đồng bộ (DynamicSubtitle.tsx)
**Files:**
- Create: `my-video/src/components/DynamicSubtitle.tsx`

**Step 1: Viết mã nguồn cho DynamicSubtitle.tsx**
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export interface DynamicSubtitleProps {
  voiceover: string;
  durationSeconds: number;
  accentColor?: string;
}

export const DynamicSubtitle: React.FC<DynamicSubtitleProps> = ({
  voiceover,
  durationSeconds,
  accentColor = "#FFB7C5"
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  if (!voiceover) return null;

  const totalFrames = durationSeconds * fps;
  const words = voiceover.split(/\s+/).filter(w => w.trim().length > 0);
  
  if (words.length === 0) return null;

  // Chia kịch bản thành các nhóm nhỏ từ 3 đến 4 từ để hiển thị đẹp mắt
  const groups: string[][] = [];
  const groupSize = 4;
  for (let i = 0; i < words.length; i += groupSize) {
    groups.push(words.slice(i, i + groupSize));
  }

  // Chia đều tổng thời gian của cảnh cho từng nhóm từ
  const framesPerGroup = totalFrames / groups.length;
  const activeGroupIndex = Math.floor(frame / framesPerGroup);
  
  const currentGroup = groups[activeGroupIndex] || groups[groups.length - 1] || [];

  return (
    <div
      style={{
        position: "absolute",
        bottom: "160px",
        left: "5%",
        width: "90%",
        display: "flex",
        justifyContent: "center",
        zIndex: 20,
        pointerEvents: "none"
      }}
    >
      <p
        style={{
          fontFamily: "Outfit, Inter, sans-serif",
          fontSize: "48px",
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.4,
          textShadow: "0 4px 12px rgba(0,0,0,0.8)",
          margin: 0,
          padding: "10px 20px",
          borderRadius: "16px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "12px",
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)"
        }}
      >
        {currentGroup.map((word, wIdx) => {
          // Tạo nhịp nháy nhỏ cho từ cụ thể đang phát âm
          const currentWordDuration = framesPerGroup / currentGroup.length;
          const localFrame = frame % framesPerGroup;
          const activeWordLocalIdx = Math.floor(localFrame / currentWordDuration);
          const isActive = wIdx === activeWordLocalIdx;

          return (
            <span
              key={wIdx}
              style={{
                color: isActive ? accentColor : "rgba(255, 255, 255, 0.85)",
                transform: isActive ? "scale(1.12)" : "scale(1.0)",
                transition: "all 0.08s ease-out",
                textShadow: isActive ? `0 0 15px ${accentColor}` : "none"
              }}
            >
              {word}
            </span>
          );
        })}
      </p>
    </div>
  );
};
```

---

### Task 5: Tích hợp hiệu ứng hạt và phụ đề động vào MainComposition.tsx
**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Import các component mới**
```typescript
import { SakuraOverlay } from "../components/overlays/SakuraOverlay";
import { TechParticlesOverlay } from "../components/overlays/TechParticlesOverlay";
import { DefaultBokehOverlay } from "../components/overlays/DefaultBokehOverlay";
import { DynamicSubtitle } from "../components/DynamicSubtitle";
```

**Step 2: Đọc cấu hình `videoTheme` và render lớp nền / hiệu ứng hạt**
Tại phần lặp các scenes trong `MainComposition.tsx` dòng 111-148, bọc nội dung layout bằng bộ lọc nền và hiệu ứng hạt động dựa vào `scene.theme`:
```typescript
        // Lấy hiệu ứng hạt tương ứng
        const renderParticlesOverlay = (themeType: string) => {
          switch (themeType) {
            case "japan":
              return <SakuraOverlay />;
            case "tech":
              return <TechParticlesOverlay />;
            case "default":
            default:
              return <DefaultBokehOverlay />;
          }
        };

        // Render cấu trúc phân cảnh mới
```
Thay thế giao diện nền ảnh trong `MainComposition.tsx` để làm mờ ảnh nền và hiển thị hiệu ứng hạt phủ lên.

---

### Task 6: Cải tạo giao diện cảnh IntroProfile.tsx thành Glassmorphic
**Files:**
- Modify: `my-video/src/compositions/IntroProfile.tsx`

**Step 1: Viết lại cấu trúc JSX và style trong IntroProfile.tsx**
Thiết kế lại toàn bộ giao diện của [IntroProfile.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/IntroProfile.tsx) sang dạng Kính mờ (Glassmorphism), viền mỏng sáng và các thẻ tính năng xếp đều.
*   **Top Badge:** Thêm viên thuốc tiêu đề phụ hiển thị ở đỉnh.
*   **Hộp kính mờ:** Bọc nội dung text bằng thẻ `div` thiết kế Glassmorphism bo góc `24px` mờ mịn.
*   **Gạch đầu dòng:** Biến thành các thẻ con trong suốt, có icon SVG lấp lánh hoặc dấu tích thanh mảnh.

---

### Task 7: Xác minh và hoàn tất
**Files:**
- Test: Chạy xem thử video bằng Remotion Preview.
- Test: Render video và xác nhận không lỗi.

**Step 1: Khởi động Remotion Preview để kiểm thử**
Run: `npm run dev` tại thư mục `frontend` và `npm run dev` tại thư mục `backend` để khởi chạy máy chủ.
Kiểm tra hiệu năng render các cánh hoa anh đào rơi và hoạt ảnh chữ trên trình duyệt.

**Step 2: Render video thử nghiệm**
Thực hiện tạo một dự án mới, viết kịch bản về Nhật Bản và nhấn nút render để xem kết quả.
