# PowerPoint-Style Block Animations & AI-Driven Transitions Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement customizable, PowerPoint-style entrance animations (Slide Up, Scale In, Fade In, Blur In, Slide Left/Right) for UI blocks in Remotion, with automatic AI timing suggestions and frontend editing options.

**Architecture:** We will update the backend Gemini prompt to return point objects containing text, animation type, and delay offset. We will build an `AnimatedBlock` wrapper component in Remotion using spring/interpolation animations. Finally, we will refactor the frontend `StoryboardEditor` points textarea into a list of block elements with dropdown and delay slider controls.

**Tech Stack:** React, Remotion, FastAPI/Node.js backend, Gemini API, CSS.

---

### Task 1: Backend Storyboard AI Prompt & Normalization
Update the backend script generator to output object-based points instead of plain strings and normalize old projects' data.

**Files:**
- Modify: [backend/services/ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js:17-80)

**Step 1: Write mock input and expected schema validation code**
We will add standard validation logic in `ai.js` mapping points array items to ensure they contain `text`, `animation`, and `delay` fields. If they are plain strings, normalize them.

**Step 2: Run verification command**
Run a command to inspect if backend file is free of syntax errors:
Run: `node -c backend/services/ai.js`
Expected: Success with no output

**Step 3: Implement prompt modifications and normalization**
Replace the prompt and formatting mapping in [backend/services/ai.js](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/backend/services/ai.js) to:
- Prompt Gemini to output `"points": [{"text": "...", "animation": "slide-up" | "scale-in" | "fade-in" | "blur-in" | "slide-left" | "slide-right", "delay": 1.5}]`.
- Normalize the returned points array in mapping:
```javascript
points: Array.isArray(scene.points) ? scene.points.map((pt, idx) => {
  if (typeof pt === 'string') {
    return { text: pt, animation: 'slide-up', delay: Number((idx * 1.5).toFixed(1)) };
  }
  return {
    text: pt.text || '',
    animation: pt.animation || 'slide-up',
    delay: typeof pt.delay === 'number' ? pt.delay : Number((idx * 1.5).toFixed(1))
  };
}) : []
```

**Step 4: Verify syntax and schema fallback**
Run: `node -c backend/services/ai.js`
Expected: Success with no output

**Step 5: Commit changes**
```bash
git add backend/services/ai.js
git commit -m "feat(backend): update Gemini AI prompt and points normalization"
```

---

### Task 2: Create AnimatedBlock in Remotion
Create the React component in the Remotion project to handle entrance spring/interpolation animations.

**Files:**
- Create: [my-video/src/components/layout/AnimatedBlock.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/components/layout/AnimatedBlock.tsx)

**Step 1: Write component definition**
Write code for `AnimatedBlock` using Remotion's `spring`, `interpolate`, `useCurrentFrame`, and `useVideoConfig` APIs.
```tsx
import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const AnimatedBlock: React.FC<{
  animation: string;
  delaySeconds: number;
  durationSeconds: number;
  children: React.ReactNode;
}> = ({ animation, delaySeconds, durationSeconds, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = Math.round(delaySeconds * fps);
  const relativeFrame = frame - startFrame;

  if (relativeFrame < 0) {
    return <div style={{ opacity: 0 }} />;
  }

  const spr = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 15, mass: 0.8, stiffness: 100 },
  });

  const linearProgress = Math.min(relativeFrame / 15, 1);

  let style: React.CSSProperties = {};

  switch (animation) {
    case "slide-up":
      const translateY = interpolate(spr, [0, 1], [80, 0]);
      style = { opacity: spr, transform: `translateY(${translateY}px)` };
      break;

    case "scale-in":
      const scale = interpolate(spr, [0, 1], [0.5, 1]);
      style = { opacity: spr, transform: `scale(${scale})` };
      break;

    case "blur-in":
      const blurVal = interpolate(linearProgress, [0, 1], [25, 0]);
      style = { opacity: linearProgress, filter: `blur(${blurVal}px)` };
      break;

    case "slide-left":
      const translateXLeft = interpolate(spr, [0, 1], [150, 0]);
      style = { opacity: spr, transform: `translateX(${translateXLeft}px)` };
      break;

    case "slide-right":
      const translateXRight = interpolate(spr, [0, 1], [-150, 0]);
      style = { opacity: spr, transform: `translateX(${translateXRight}px)` };
      break;

    case "fade-in":
    default:
      style = { opacity: linearProgress };
      break;
  }

  return (
    <div style={{ ...style, width: "100%", willChange: "transform, opacity" }}>
      {children}
    </div>
  );
};
```

**Step 2: Run verification lint command**
Run: `npm run lint` inside the `my-video` directory.
Expected: Resolves without typescript or eslint errors for the new file.

**Step 3: Commit**
```bash
git add my-video/src/components/layout/AnimatedBlock.tsx
git commit -m "feat(remotion): create AnimatedBlock component for block transitions"
```

---

### Task 3: Integrate AnimatedBlock in DynamicLayout Rendering
Wrap point UI blocks inside the `AnimatedBlock` component in Remotion layout mapping.

**Files:**
- Modify: [my-video/src/compositions/DynamicLayout.tsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/compositions/DynamicLayout.tsx)

**Step 1: Check existing DynamicLayout content**
Understand imports and rendering sections (SplitScreen, FeatureGrid, Timeline, etc.).

**Step 2: Implement AnimatedBlock wraps**
- Import `AnimatedBlock` in `DynamicLayout.tsx`.
- Parse the points in `parseSceneToComponents` inside [my-video/src/utils/layoutResolver.ts](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/my-video/src/utils/layoutResolver.ts) to accept points containing objects.
- In `DynamicLayout.tsx`, wrap the output of `renderComponent(comp)` with `<AnimatedBlock animation={comp.data.animation || 'slide-up'} delaySeconds={comp.data.delay || 0} durationSeconds={sceneDuration}>` for each active layout.
- Ensure that the Scene Title block can also be wrapped or has its own default transition animation (e.g. `slide-up` with `0` delay).

**Step 3: Run typescript check & eslint validation**
Run: `npm run lint` inside the `my-video` directory.
Expected: Build passes with no errors.

**Step 4: Commit**
```bash
git add my-video/src/compositions/DynamicLayout.tsx my-video/src/utils/layoutResolver.ts
git commit -m "feat(remotion): wrap layout UI components with AnimatedBlock"
```

---

### Task 4: Upgrade Frontend StoryboardEditor UI
Refactor the points field in the StoryboardEditor to support detailed object-based lists with animation select menus and delay sliders.

**Files:**
- Modify: [frontend/src/components/StoryboardEditor.jsx](file:///c:/Users/nghia/OneDrive/M%C3%A1y%20t%C3%ADnh/AI-grenerated%20vid-hyperframe/frontend/src/components/StoryboardEditor.jsx:630-645)

**Step 1: Create fallback normalization helper**
In `StoryboardEditor.jsx`, ensure `points` is mapped to objects in rendering. If it's a string, format it.
```javascript
const normalizedPoints = (scene.points || []).map((pt, idx) => {
  if (typeof pt === 'string') {
    return { text: pt, animation: 'slide-up', delay: Number((idx * 1.5).toFixed(1)) };
  }
  return {
    text: pt.text || '',
    animation: pt.animation || 'slide-up',
    delay: typeof pt.delay === 'number' ? pt.delay : Number((idx * 1.5).toFixed(1))
  };
});
```

**Step 2: Replace textarea with list items**
Create a form list in `StoryboardEditor.jsx` rendering:
- Input text for each point text.
- Dropdown select for animations: `slide-up`, `scale-in`, `fade-in`, `blur-in`, `slide-left`, `slide-right`.
- Input range slider for `delay` (range `0` to `scene.duration` seconds, step `0.1`s), with a text display showing the seconds (e.g., `1.2s`).
- Buttons to "Add Point" at bottom, and a "🗑️" delete icon next to each point.
- Re-trigger state changes to parent `onChange` / `updateScene` API callbacks to persist the point objects to database.

**Step 3: Run frontend lint verification**
Run: `npm run lint` in the `frontend` directory.
Expected: Passes with no syntax errors.

**Step 4: Verify manual styling**
Check that styling fits the dark glassmorphic, premium developer aesthetics of the project.

**Step 5: Commit**
```bash
git add frontend/src/components/StoryboardEditor.jsx
git commit -m "feat(frontend): replace points textarea with interactive block animation controls"
```
