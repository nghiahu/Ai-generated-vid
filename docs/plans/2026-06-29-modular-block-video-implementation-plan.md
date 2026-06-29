# Modular Block Video Layouts Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Nâng cấp và chuyển đổi giao diện video trong Remotion sang bố cục dạng mô-đun phân mảnh hiện đại (giống ảnh mẫu), sử dụng nền tối quầng sáng chuyển động và tàn lửa cam, đồng thời cài đặt bộ tự động phân tích cú pháp chữ ở frontend để tự định dạng các khối nội dung.

**Architecture:** Tạo hai component nền nghệ thuật là `EmberSparksOverlay.tsx` và `LightLeaksOverlay.tsx`. Viết bộ lọc/phân tích cú pháp chữ tự động trong `IntroProfile.tsx` để nhận diện các dạng điểm (Tag Badges, Hero Metric với chữ gạch ngang, Highlight Box viền neon, Terminal Command Box) và hiển thị tương ứng.

**Tech Stack:** React, Remotion, Vanilla CSS, TypeScript.

---

### Task 1: Xây dựng các component nền nghệ thuật mới trong Remotion
**Files:**
- Create: `my-video/src/components/overlays/EmberSparksOverlay.tsx`
- Create: `my-video/src/components/overlays/LightLeaksOverlay.tsx`

**Step 1: Viết mã nguồn cho EmberSparksOverlay.tsx**
Component tạo tàn lửa màu vàng cam trôi từ dưới lên:
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const EmberSparksOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const sparkCount = 28;

  const sparks = Array.from({ length: sparkCount }).map((_, i) => {
    const seed = i * 654.32;
    const startX = (seed * 83) % width;
    const ySpeed = 1.8 + (Math.sin(seed) + 1) * 1.5;
    const scale = 0.5 + (Math.cos(seed * 2) + 1) * 0.6;
    const currentY = height - ((frame * ySpeed) % (height + 100));
    const sway = Math.sin(frame * 0.03 + seed) * (10 + (i % 5) * 5);
    const currentX = (startX + sway) % width;
    
    // Fade out as it rises
    const progress = (height - currentY) / height;
    const opacity = Math.max(0, 0.7 - progress * 0.7);

    return { x: currentX, y: currentY, scale, opacity, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 3, overflow: "hidden", pointerEvents: "none" }}>
      {sparks.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}px`,
            top: `${s.y}px`,
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: "#ff7b00",
            boxShadow: "0 0 10px #ff6600, 0 0 4px #ffaa00",
            opacity: s.opacity,
            transform: `scale(${s.scale})`,
          }}
        />
      ))}
    </div>
  );
};
```

**Step 2: Viết mã nguồn cho LightLeaksOverlay.tsx**
Component tạo quầng sáng len lỏi chuyển động chậm ở góc:
```typescript
import React from "react";
import { useCurrentFrame } from "remotion";

export const LightLeaksOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Pulse opacity and position slowly
  const orangeOpacity = 0.16 + Math.sin(frame * 0.015) * 0.05;
  const cyanOpacity = 0.12 + Math.cos(frame * 0.018) * 0.04;

  const orangeSwayX = Math.sin(frame * 0.01) * 40;
  const cyanSwayY = Math.cos(frame * 0.012) * 40;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 2, overflow: "hidden", pointerEvents: "none" }}>
      {/* Top Right Orange Light Leak */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: `${-200 + orangeSwayX}px`,
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          backgroundColor: "rgba(249, 115, 22, 0.9)",
          filter: "blur(120px)",
          opacity: orangeOpacity,
          transform: "translateZ(0)"
        }}
      />
      {/* Bottom Left Cyan Light Leak */}
      <div
        style={{
          position: "absolute",
          bottom: `${-250 + cyanSwayY}px`,
          left: "-250px",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 229, 255, 0.8)",
          filter: "blur(130px)",
          opacity: cyanOpacity,
          transform: "translateZ(0)"
        }}
      />
    </div>
  );
};
```

---

### Task 2: Tích hợp nền nghệ thuật mới vào MainComposition.tsx
**Files:**
- Modify: `my-video/src/compositions/MainComposition.tsx`

**Step 1: Import các component mới**
```typescript
import { EmberSparksOverlay } from "../components/overlays/EmberSparksOverlay";
import { LightLeaksOverlay } from "../components/overlays/LightLeaksOverlay";
```

**Step 2: Cập nhật MainComposition.tsx**
Cập nhật render loop của `MainComposition.tsx` (dòng 115-135) để luôn chèn `LightLeaksOverlay` và `EmberSparksOverlay` ở tất cả các cảnh, làm nền cơ bản thay thế bokeh cũ:
```typescript
            {/* Lớp nền nghệ thuật chuẩn */}
            <LightLeaksOverlay />
            <EmberSparksOverlay />
            
            {/* Overlay hạt bổ trợ theo chủ đề */}
            {scene.theme === "japan" && <SakuraOverlay />}
            {scene.theme === "tech" && <TechParticlesOverlay />}
```

---

### Task 3: Cải tạo IntroProfile.tsx thành Bộ Phân Tích Bố Cục Mô-đun (Modular Blocks Parser)
**Files:**
- Modify: `my-video/src/compositions/IntroProfile.tsx`

**Step 1: Định nghĩa kiểu dữ liệu và bộ phân tích cú pháp các dòng điểm**
Cập nhật `IntroProfile.tsx` để thêm hàm phân tích cú pháp của mỗi dòng `point` và hiển thị khối giao diện HTML/CSS đặc trưng:
*   Nếu dòng chứa dấu phẩy `,` và từ khóa `⭐` / `sao` / `MIT` -> split thành danh sách nhãn nằm ngang.
*   Nếu dòng bắt đầu bằng dấu cộng/trừ và số (ví dụ: `-99% token (hơn nhồi cả repo · RAG embeddings)`) -> render khối Hero Metric cực lớn. Giải thích trong ngoặc đơn sẽ bị gạch ngang.
*   Nếu dòng chứa `<` hoặc `ms` -> render khối kính mờ viền xanh neon.
*   Nếu dòng bắt đầu bằng `$` hoặc chứa `curl`/`npm install` -> render khối terminal màu đen viền cam, chữ monospace.

**Step 2: Viết lại mã nguồn JSX trong IntroProfile.tsx**
Cập nhật chi tiết hàm render để vẽ tiêu đề chính cỡ lớn (`72px`, phông `Outfit` nét siêu đậm xếp chồng chữ) và vẽ lần lượt các khối mô-đun sau khi phân tích.

---

### Task 4: Chạy xác minh và kiểm thử
**Files:**
- Test: Chạy Remotion lint & typecheck.
- Test: Preview giao diện mới trên trình duyệt.

**Step 1: Chạy linter**
Run: `npm run lint` ở thư mục `my-video`.
Expected: PASS không lỗi typescript.
