# Default Background Accent HEX Gradient Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Thêm tùy chọn hình nền mặc định cho mỗi phân cảnh dựa trên hiệu ứng chuyển màu của Màu nhấn (Accent HEX) và khắc phục vấn đề cơ sở dữ liệu không lưu thuộc tính Theme / Accent Color.

**Architecture:** 
1. Cập nhật `db.js` để lưu trữ cột `theme` và `accent_color` cho phân cảnh.
2. Viết component `AccentGlowBackground.tsx` trong Remotion để hiển thị hai quầng sáng màu nhấn có hiệu ứng khuếch tán lớn và chuyển động chậm.
3. Cập nhật các layout video trong Remotion để dùng `AccentGlowBackground` khi `selectedMediaIndex === -1`.
4. Cập nhật `StoryboardEditor.jsx` để thêm ô lựa chọn "Màu nhấn" ở đầu, lưu chỉ số `-1`, và hiển thị giao diện mô phỏng trên màn hình preview.

**Tech Stack:** React, Remotion, PostgreSQL, Express.

---

### Task 1: Cập nhật CSDL Backend (`db.js`)
**Files:**
- Modify: [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js)

**Step 1: Cập nhật hàm tạo bảng và Alter Table trong `initDb`**
Thêm lệnh ALTER TABLE và cột mới vào bảng `scenes` trong [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js) khoảng dòng 48-63 và dòng 68:
```javascript
    // Thêm các cột theme và accent_color vào câu lệnh tạo bảng
    CREATE TABLE IF NOT EXISTS scenes (
      ...
      media_list JSONB DEFAULT '[]'::jsonb,
      selected_media_index INTEGER DEFAULT 0,
      theme VARCHAR(100) DEFAULT 'default',
      accent_color VARCHAR(50) DEFAULT '#FFB7C5'
    );

    // Chạy bổ sung sau khi tạo bảng xong:
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS theme VARCHAR(100) DEFAULT 'default'`);
    await pool.query(`ALTER TABLE scenes ADD COLUMN IF NOT EXISTS accent_color VARCHAR(50) DEFAULT '#FFB7C5'`);
```

**Step 2: Cập nhật ánh xạ trường dữ liệu trong `getProjectById`**
Bổ sung `theme` và `accentColor` vào map kết quả trả về trong [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js) dòng 98-111:
```javascript
      scenes: scenesRes.rows.map(s => ({
        id: s.id,
        sceneIndex: s.scene_index,
        ...
        selectedMediaIndex: s.selected_media_index,
        theme: s.theme || 'default',
        accentColor: s.accent_color || '#FFB7C5'
      }))
```

**Step 3: Cập nhật hàm ghi đè phân cảnh `updateProjectScenes`**
Thêm cột `theme` và `accent_color` vào câu truy vấn INSERT trong [db.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/db.js) dòng 165-188:
```javascript
      const insertSceneQuery = `
        INSERT INTO scenes (
          id, project_id, scene_index, duration, layout_family, visual_layout, 
          heading, points, voiceover, voiceover_audio_url, placement, media_list, selected_media_index,
          theme, accent_color
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `;

      for (const scene of scenes) {
        await client.query(insertSceneQuery, [
          scene.id,
          id,
          scene.sceneIndex,
          scene.duration,
          scene.layoutFamily,
          scene.visualLayout,
          scene.heading,
          JSON.stringify(scene.points),
          scene.voiceover,
          scene.voiceoverAudioUrl,
          scene.placement,
          JSON.stringify(scene.mediaList),
          scene.selectedMediaIndex,
          scene.theme || 'default',
          scene.accentColor || '#FFB7C5'
        ]);
      }
```

**Step 4: Cập nhật hàm chỉnh sửa đơn phân cảnh `updateScene` và `createScene`**
Bổ sung mapping cột vào `updateScene`:
```javascript
    const columnMapping = {
      ...
      selectedMediaIndex: 'selected_media_index',
      theme: 'theme',
      accentColor: 'accent_color'
    };
```
Trả về trường map đầy đủ trong `updateScene` (dòng 256-269):
```javascript
    return {
      ...
      mediaList: s.media_list,
      selectedMediaIndex: s.selected_media_index,
      theme: s.theme || 'default',
      accentColor: s.accent_color || '#FFB7C5'
    };
```
Và trong `createScene` (dòng 280-302):
```javascript
    const insertQuery = `
      INSERT INTO scenes (
        id, project_id, scene_index, duration, layout_family, visual_layout, 
        heading, points, voiceover, voiceover_audio_url, placement, media_list, selected_media_index,
        theme, accent_color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;
    const res = await pool.query(insertQuery, [
      ...
      sceneData.mediaList || [],
      sceneData.selectedMediaIndex || 0,
      sceneData.theme || 'default',
      sceneData.accentColor || '#FFB7C5'
    ]);
```

**Step 5: Khởi động lại backend để xác minh không lỗi DB**
Chạy verify backend để chạy lệnh alter table.

---

### Task 2: Tạo component quầng sáng `AccentGlowBackground.tsx` trong Remotion
**Files:**
- Create: [AccentGlowBackground.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/components/overlays/AccentGlowBackground.tsx)

**Step 1: Viết mã nguồn cho AccentGlowBackground.tsx**
Component chuyển Hex sang RGB, render 2 quầng sáng chuyển động mượt bằng `useCurrentFrame` và `interpolate`.
```tsx
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export interface AccentGlowBackgroundProps {
  accentColor: string;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AccentGlowBackground: React.FC<AccentGlowBackgroundProps> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const glowColor = hexToRgba(accentColor || "#FFB7C5", 0.18);

  // Slow movement and pulse for the glow bubbles
  const bubble1SwayX = interpolate(Math.sin(frame * 0.015), [-1, 1], [-120, 120]);
  const bubble1SwayY = interpolate(Math.cos(frame * 0.012), [-1, 1], [-80, 80]);
  const bubble1Scale = interpolate(Math.sin(frame * 0.01), [-1, 1], [0.9, 1.25]);

  const bubble2SwayX = interpolate(Math.cos(frame * 0.018), [-1, 1], [100, -100]);
  const bubble2SwayY = interpolate(Math.sin(frame * 0.014), [-1, 1], [80, -80]);
  const bubble2Scale = interpolate(Math.cos(frame * 0.008), [-1, 1], [0.85, 1.15]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060813", overflow: "hidden", zIndex: 0 }}>
      {/* Background radial gradient mesh */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, #0c0f24 0%, #03040a 100%)"
        }} 
      />

      {/* Bubble 1 (Center Right Glow) */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "5%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          backgroundColor: glowColor,
          filter: "blur(140px)",
          transform: `translate(${bubble1SwayX}px, ${bubble1SwayY}px) scale(${bubble1Scale}) translateZ(0)`,
          opacity: 0.9,
          pointerEvents: "none"
        }}
      />

      {/* Bubble 2 (Bottom Left Glow) */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-10%",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          backgroundColor: glowColor,
          filter: "blur(150px)",
          transform: `translate(${bubble2SwayX}px, ${bubble2SwayY}px) scale(${bubble2Scale}) translateZ(0)`,
          opacity: 0.85,
          pointerEvents: "none"
        }}
      />
    </AbsoluteFill>
  );
};
```

---

### Task 3: Tích hợp vào các Scene layouts trong Remotion
**Files:**
- Modify: [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx)
- Modify: [IntroProfile.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/IntroProfile.tsx)
- Modify: [SplitGrid.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/SplitGrid.tsx)
- Modify: [GithubStatusHook.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/GithubStatusHook.tsx)

**Step 1: Cập nhật hàm phân tích `imageUrl` trong `MainComposition.tsx`**
Cập nhật dòng 128-132 trong [MainComposition.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/MainComposition.tsx):
```typescript
        const imageUrl =
          scene.mediaList && scene.mediaList.length > 0 && scene.selectedMediaIndex !== -1
            ? scene.mediaList[scene.selectedMediaIndex || 0]
            : "";
```
Và truyền thêm `accentColor` vào `SplitGrid` và `GithubStatusHook`:
```typescript
            ) : scene.visualLayout === "Split Grid" ? (
              <SplitGrid
                heading={scene.heading}
                points={scene.points}
                imageUrl={imageUrl}
                placement={scene.placement}
                accentColor={scene.accentColor} // Thêm prop accentColor
              />
            ) : (
              <GithubStatusHook
                heading={scene.heading}
                points={scene.points}
                imageUrl={imageUrl}
                placement={scene.placement}
                accentColor={scene.accentColor} // Thêm prop accentColor
              />
```

**Step 2: Cập nhật prop và nền cho `IntroProfile.tsx`**
Tích hợp `AccentGlowBackground` khi không có `imageUrl`:
```tsx
import { AccentGlowBackground } from "../overlays/AccentGlowBackground";

// Trong hàm render IntroProfile, thay thế phần bọc Img:
      {imageUrl ? (
        <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden", zIndex: 0 }}>
          <Img
            src={imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(110%) brightness(20%) blur(8px)",
              transform: `scale(${scale})`,
            }}
            alt="background"
          />
        </div>
      ) : (
        <AccentGlowBackground accentColor={accentColor} />
      )}
```

**Step 3: Cập nhật prop và nền cho `SplitGrid.tsx`**
Bổ sung `accentColor` vào props và chèn `AccentGlowBackground` vào khung bên trái khi `imageUrl` trống:
```tsx
import { AccentGlowBackground } from "../overlays/AccentGlowBackground";

// Sửa cấu trúc Props và Component:
export interface SplitGridProps {
  heading: string;
  points: string[];
  imageUrl: string;
  placement: string;
  accentColor?: string;
}

// Trong hàm render SplitGrid (Left Pane):
      <div
        style={{
          width: `${leftWidth}%`,
          height: "100%",
          overflow: "hidden",
          borderRight: leftWidth > 0 ? "6px solid #000000" : "none",
          position: "relative",
          backgroundColor: "#000000"
        }}
      >
        {imageUrl ? (
          <Img
            src={imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(105%)",
            }}
            alt="split panel illustration"
          />
        ) : (
          <AccentGlowBackground accentColor={accentColor || "#FFB7C5"} />
        )}
      </div>
```

**Step 4: Cập nhật prop và nền cho `GithubStatusHook.tsx`**
Bổ sung `accentColor` và lồng `AccentGlowBackground` vào khung ảnh 250x250:
```tsx
import { AccentGlowBackground } from "../overlays/AccentGlowBackground";

export interface GithubStatusHookProps {
  heading: string;
  points: string[];
  imageUrl: string;
  placement: string;
  accentColor?: string;
}

// Trong phần render image section:
            {imageUrl ? (
              <div
                style={{
                  width: "250px",
                  height: "250px",
                  border: "3px solid #000000",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <Img
                  src={imageUrl}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                  alt="contribution illustration"
                />
              </div>
            ) : (
              <div
                style={{
                  width: "250px",
                  height: "250px",
                  border: "3px solid #000000",
                  borderRadius: "4px",
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                <AccentGlowBackground accentColor={accentColor || "#FFB7C5"} />
              </div>
            )}
```

---

### Task 4: Cập nhật giao diện `StoryboardEditor.jsx` ở Frontend
**Files:**
- Modify: [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx)

**Step 1: Cập nhật danh sách hiển thị lựa chọn media và nút Mặc định**
Trong [StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx) dòng 438-456:
Chèn thêm ô đặc biệt **"Màu nhấn (HEX)"** ở đầu danh sách map:
```jsx
                    {/* Image Suggestions Grid */}
                    <div className="custom-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "5px" }}>
                      {/* Default Accent Color Option Tile */}
                      <div
                        onClick={() => handleFieldChange(scene.id, "selectedMediaIndex", -1)}
                        style={{
                          width: "48px",
                          height: "48px",
                          flexShrink: 0,
                          borderRadius: "4px",
                          border: scene.selectedMediaIndex === -1 ? "3px solid #000000" : "1px solid #cccccc",
                          background: `linear-gradient(135deg, ${scene.accentColor || "#FFB7C5"}88 0%, #000000 100%)`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "8px",
                          fontWeight: "bold",
                          color: "#ffffff",
                          textAlign: "center",
                          padding: "2px",
                          fontFamily: "Space Grotesk",
                          textTransform: "uppercase"
                        }}
                      >
                        Nền màu nhấn
                      </div>

                      {scene.mediaList && scene.mediaList.map((imgUrl, imgIdx) => (
                        ...
```

**Step 2: Cập nhật ảnh đại diện preview trong editor**
Khoảng dòng 181-183:
```javascript
            const currentImg = scene.mediaList && scene.mediaList.length > 0 && scene.selectedMediaIndex !== -1
              ? scene.mediaList[scene.selectedMediaIndex || 0] 
              : "";
```
Khoảng dòng 260-268 (phần render preview):
```jsx
                    {/* Background media if selected */}
                    {currentImg ? (
                      <img 
                        src={currentImg} 
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0, filter: "grayscale(100%) opacity(40%)" }} 
                        alt="bg preview" 
                      />
                    ) : (
                      /* Render Accent HEX Gradient mockup preview */
                      <div 
                        style={{ 
                          position: "absolute", 
                          inset: 0, 
                          zIndex: 0,
                          background: `radial-gradient(circle at center, ${scene.accentColor || "#FFB7C5"}33 0%, #090d1a 100%)`
                        }} 
                      />
                    )}
```

---

### Kế hoạch Kiểm thử & Xác minh (Verification Plan)
1. Mở giao diện Frontend Web UI.
2. Tại phân cảnh đầu tiên, chọn mã màu Accent khác nhau (ví dụ: xanh lá `#00FF00` hoặc xanh dương `#00E5FF`).
3. Click chọn ô **"Nền màu nhấn"** đầu tiên. Quan sát xem phần Preview 9:16 có thay đổi sang nền tối tích hợp quầng sáng màu xanh tương ứng hay không.
4. Lưu và tải lại trang, xác nhận tùy chọn `selectedMediaIndex = -1` và mã màu vẫn được lưu ổn định nhờ cập nhật DB.
5. Kiểm tra trình duyệt xem video Remotion chạy trơn tru, quầng sáng di chuyển nhịp nhàng không có lỗi biên dịch.
