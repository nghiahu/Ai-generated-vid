# Layout Diversity Anti-Repetition Engine v2 — Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Eliminate layout monotony in Studio AI Gen — ensure every scene in a video uses a visually distinct layout by fixing 3 root causes: the safety net fallback, the rotation algorithm, and Gemini pattern compliance.

**Architecture:** All changes are confined to `backend/services/aiGen.js`. Three layers: (A) 6 hardcoded safety net fallback templates dispatched by `visualPattern`; (B) a `assignPatternSlots(N)` function that pre-assigns unique patterns to all scenes before calling Gemini; (C) a pattern compliance validator that rejects AI output that ignores the assigned pattern structure.

**Tech Stack:** Node.js, Gemini API (`@google/generative-ai`), Sucrase TSX compiler

---

## Task 1: Diversify Safety Net Fallback (Component A)

**Files:**
- Modify: `backend/services/aiGen.js` (lines ~412–588 — `generateGlassCardSafetyNetTSX`)

**Step 1: Add TITLE_HOOK safety net template**

Add the following function ABOVE `generateGlassCardSafetyNetTSX`:

```javascript
function safetyNetTitleHook(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const alertStr = (scene.alertText || "").replace(/"/g, '\\"');
  return `import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";
import { Sparkles, Zap } from "lucide-react";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const alertText = "${alertStr}";
  const words = headingText.split(" ");
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.22), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "10%", left: "-10%", width: "600px", height: "600px", borderRadius: "50%",
        background: "rgba(59,130,246,0.12)", filter: "blur(100px)", transform: "translateY(" + (Math.sin(frame / 25) * 20) + "px)" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "-10%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(249,115,22,0.12)", filter: "blur(100px)", transform: "translateY(" + (Math.cos(frame / 28) * 20) + "px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center",
        gap: "24px", textAlign: "center", padding: "0 80px", height: "78%", justifyContent: "center" }}>
        {alertText ? (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 20px", borderRadius: 99,
            background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c",
            fontSize: "18px", fontWeight: 700, opacity: sp(5), transform: "scale(" + sp(5) + ")" }}>
            <Sparkles size={18} color="#fb923c" />
            <span>{alertText}</span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 18px", borderRadius: 99,
            background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)", color: "#93c5fd",
            fontSize: "16px", fontWeight: 600, opacity: sp(5), transform: "scale(" + sp(5) + ")" }}>
            <Zap size={16} color="#93c5fd" />
            <span>Studio AI Gen</span>
          </div>
        )}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
          {words.map((w, i) => {
            const wSp = sp(8 + i * 6);
            return (
              <span key={i} style={{ fontSize: "68px", fontWeight: 800, color: "#ffffff", lineHeight: 1.1,
                letterSpacing: "-0.03em", display: "inline-block",
                opacity: wSp, transform: "translateY(" + interpolate(wSp, [0, 1], [40, 0]) + "px)" }}>
                {w}
              </span>
            );
          })}
        </div>
        <div style={{ width: "120px", height: "3px", background: "linear-gradient(90deg, transparent, #f97316, transparent)",
          opacity: sp(30), borderRadius: "2px" }} />
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}
```

**Step 2: Add HERO_METRIC_GLOW safety net template**

```javascript
function safetyNetHeroMetric(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const metric = scene.metrics && scene.metrics[0];
  const heroValue = metric ? `${metric.prefix || ""}${metric.value}${metric.suffix || ""}` : "100%";
  const label = metric ? metric.label : "Số liệu chính";
  return `import React from "react";
import { useCurrentFrame, spring, interpolate } from "remotion";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 12, stiffness: 50 } });
  const heroValue = "${heroValue}";
  const label = "${label}";
  const headingText = "${safeHeading}";
  const numSp = sp(10);
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 40%, rgba(249,115,22,0.18), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)",
        width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(249,115,22,0.12)", filter: "blur(100px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", gap: "12px" }}>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "18px", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.15em", opacity: sp(5) }}>{label}</div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", width: "280px", height: "280px", borderRadius: "50%",
            background: "radial-gradient(circle, rgba(249,115,22,0.3), transparent 70%)", filter: "blur(50px)" }} />
          <div style={{ fontSize: "130px", fontWeight: 900, color: "#f97316",
            textShadow: "0 0 60px rgba(249,115,22,0.7)", fontVariantNumeric: "tabular-nums", zIndex: 2,
            opacity: numSp, transform: "scale(" + interpolate(numSp, [0, 1], [0.6, 1]) + ")" }}>
            {heroValue}
          </div>
        </div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "22px", textAlign: "center",
          maxWidth: "500px", marginTop: "8px", opacity: sp(25) }}>{headingText}</div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}
```

**Step 3: Add DUAL_METRIC_CARDS safety net template**

```javascript
function safetyNetDualMetric(scene = {}) {
  const safeHeading = (scene.heading || "Phân cảnh Video AI").replace(/"/g, '\\"');
  const m0 = scene.metrics && scene.metrics[0] ? scene.metrics[0] : { prefix: "", value: "50", suffix: "%", label: "Chỉ số 1" };
  const m1 = scene.metrics && scene.metrics[1] ? scene.metrics[1] : { prefix: "", value: "90", suffix: "%", label: "Chỉ số 2" };
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";
import { TrendingUp, Award } from "lucide-react";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const metrics = [
    { prefix: "${m0.prefix || ""}", value: "${m0.value}", suffix: "${m0.suffix || ""}", label: "${(m0.label || "").replace(/"/g, '\\"')}", color: "#f97316", icon: TrendingUp },
    { prefix: "${m1.prefix || ""}", value: "${m1.value}", suffix: "${m1.suffix || ""}", label: "${(m1.label || "").replace(/"/g, '\\"')}", color: "#60a5fa", icon: Award }
  ];
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.18), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "absolute", top: "15%", left: "20%", width: "500px", height: "500px", borderRadius: "50%",
        background: "rgba(59,130,246,0.1)", filter: "blur(90px)" }} />
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 60px", gap: "28px" }}>
        <div style={{ fontSize: "38px", fontWeight: 800, color: "#ffffff", textAlign: "center",
          letterSpacing: "-0.02em", opacity: sp(5), lineHeight: 1.2 }}>{headingText}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "900px" }}>
          {metrics.map((m, i) => {
            const Icon = m.icon;
            const cardSp = sp(15 + i * 10);
            return (
              <div key={i} style={{ background: "rgba(8,17,37,0.75)", border: "1px solid rgba(255,255,255,0.15)",
                backdropFilter: "blur(20px)", borderRadius: "20px", padding: "32px 24px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "14px",
                opacity: cardSp, transform: "scale(" + cardSp + ")" }}>
                <Icon size={32} color={m.color} />
                <div style={{ fontSize: "72px", fontWeight: 900, color: m.color,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                  {m.prefix}{m.value}{m.suffix}
                </div>
                <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px", textAlign: "center" }}>{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}
```

**Step 4: Add COMPARISON_VERSUS safety net template**

```javascript
function safetyNetComparisonVersus(scene = {}) {
  const safeHeading = (scene.heading || "So sánh").replace(/"/g, '\\"');
  const points = scene.points || [];
  const leftPoints = points.filter((_, i) => i % 2 === 0).slice(0, 3);
  const rightPoints = points.filter((_, i) => i % 2 === 1).slice(0, 3);
  const leftJson = JSON.stringify(leftPoints.length > 0 ? leftPoints : ["Phương pháp cũ", "Tốn nhiều thời gian", "Chi phí cao"]);
  const rightJson = JSON.stringify(rightPoints.length > 0 ? rightPoints : ["AI tự động hoá", "Nhanh hơn 10x", "Chi phí thấp"]);
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const leftPoints = ${leftJson};
  const rightPoints = ${rightJson};
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.15), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 50px", gap: "24px" }}>
        <div style={{ fontSize: "40px", fontWeight: 800, color: "#ffffff", textAlign: "center",
          opacity: sp(5), letterSpacing: "-0.02em" }}>{headingText}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 52px 1fr", gap: "12px",
          alignItems: "center", width: "100%", opacity: sp(15) }}>
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.4)",
            borderRadius: "18px", padding: "24px 20px" }}>
            <div style={{ color: "#ef4444", fontWeight: 700, fontSize: "18px", marginBottom: "14px" }}>❌ TRƯỚC ĐÂY</div>
            {leftPoints.map((p, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.8)", marginBottom: "10px", fontSize: "17px" }}>• {p}</div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            width: "52px", height: "52px", borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #3b82f6)", fontWeight: 900, fontSize: "17px", color: "#fff" }}>VS</div>
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.45)",
            borderRadius: "18px", padding: "24px 20px" }}>
            <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: "18px", marginBottom: "14px" }}>✅ VỚI AI</div>
            {rightPoints.map((p, i) => (
              <div key={i} style={{ color: "rgba(255,255,255,0.8)", marginBottom: "10px", fontSize: "17px" }}>• {p}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}
```

**Step 5: Add PROCESS_TIMELINE safety net template**

```javascript
function safetyNetProcessTimeline(scene = {}) {
  const safeHeading = (scene.heading || "Quy trình").replace(/"/g, '\\"');
  const points = Array.isArray(scene.points) && scene.points.length > 0 ? scene.points.slice(0, 3) : ["Bước 1: Phân tích", "Bước 2: Xây dựng", "Bước 3: Ra mắt"];
  const stepsJson = JSON.stringify(points.map((p, i) => ({ num: i + 1, text: String(p) })));
  return `import React from "react";
import { useCurrentFrame, spring } from "remotion";

export const GeneratedScene = ({ fps = 30, scene = {} }) => {
  const frame = useCurrentFrame();
  const sp = (delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 14, stiffness: 55 } });
  const headingText = "${safeHeading}";
  const steps = ${stepsJson};
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden",
      background: "radial-gradient(circle at 50% 30%, rgba(59,130,246,0.18), transparent 65%), #030712",
      fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", height: "78%", padding: "0 60px", gap: "28px" }}>
        <div style={{ fontSize: "40px", fontWeight: 800, color: "#ffffff", textAlign: "center",
          opacity: sp(5), letterSpacing: "-0.02em" }}>{headingText}</div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0, width: "100%" }}>
          {steps.map((step, i) => {
            const stepSp = sp(15 + i * 10);
            return (
              <React.Fragment key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: "18px", opacity: stepSp }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "50%",
                    border: "2px solid #3b82f6", background: "rgba(59,130,246,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 800, fontSize: "22px", color: "#60a5fa", flexShrink: 0 }}>{step.num}</div>
                  <div style={{ background: "rgba(8,17,37,0.75)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "14px", padding: "16px 20px", flex: 1 }}>
                    <div style={{ color: "#f97316", fontWeight: 700, fontSize: "20px" }}>{step.text}</div>
                  </div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: "4px", height: "36px", background: "linear-gradient(to bottom, #3b82f6, transparent)",
                    marginLeft: "24px", opacity: stepSp }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default GeneratedScene;`;
}
```

**Step 6: Create dispatcher function `generateSafetyNetTSX`**

Replace the existing `generateGlassCardSafetyNetTSX` call sites with the new dispatcher:

```javascript
function generateSafetyNetTSX(scene = {}) {
  const pattern = (scene.visualPattern || "BULLET_GLASS").toUpperCase();
  if (pattern === "TITLE_HOOK") return safetyNetTitleHook(scene);
  if (pattern === "HERO_METRIC_GLOW") return safetyNetHeroMetric(scene);
  if (pattern === "DUAL_METRIC_CARDS") return safetyNetDualMetric(scene);
  if (pattern === "COMPARISON_VERSUS") return safetyNetComparisonVersus(scene);
  if (pattern === "PROCESS_TIMELINE") return safetyNetProcessTimeline(scene);
  // BULLET_GLASS and all others
  return generateGlassCardSafetyNetTSX(scene);
}
```

Replace ALL occurrences of `generateGlassCardSafetyNetTSX(scene)` in `generateSingleSceneCode` with `generateSafetyNetTSX(scene)`.

**Step 7: Commit**

```
git add backend/services/aiGen.js
git commit -m "feat: diversify safety net fallback — 6 pattern-specific templates (Component A)"
```

---

## Task 2: Full-Video Pattern Slot Assignment (Component B)

**Files:**
- Modify: `backend/services/aiGen.js` (function `generateAIGenStoryboard`, `generateScenePlanForAIGen`)

**Step 1: Add `assignPatternSlots(sceneCount)` function**

Add ABOVE `generateAIGenStoryboard`:

```javascript
/**
 * Assigns a unique visual pattern to each scene index in a video.
 * No pattern is repeated across the entire video.
 * First scene → TITLE_HOOK, last scene (if count >= 3) → ENDING_CTA.
 * Middle scenes are drawn from a shuffled pool without repetition.
 */
function assignPatternSlots(sceneCount) {
  const ALL_PATTERNS = [
    "TITLE_HOOK", "DUAL_METRIC_CARDS", "HERO_METRIC_GLOW", "COMPARISON_VERSUS",
    "PROCESS_TIMELINE", "DONUT_GAUGE", "STAT_GRID_2X2", "QUOTE_NATURE_CARD",
    "BULLET_GLASS", "ENDING_CTA"
  ];

  if (sceneCount <= 0) return [];
  if (sceneCount === 1) return ["TITLE_HOOK"];

  const slots = new Array(sceneCount).fill(null);

  // Pin first and last
  slots[0] = "TITLE_HOOK";
  if (sceneCount >= 3) {
    slots[sceneCount - 1] = "ENDING_CTA";
  } else {
    slots[sceneCount - 1] = "HERO_METRIC_GLOW";
  }

  // Pool for middle scenes: exclude already pinned
  const pinned = new Set(slots.filter(Boolean));
  const pool = ALL_PATTERNS.filter(p => !pinned.has(p));

  // Deterministic shuffle using scene index seed (stable across reruns)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (i * 7 + sceneCount * 3) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let poolIdx = 0;
  for (let i = 1; i < sceneCount - 1; i++) {
    if (slots[i] === null) {
      slots[i] = pool[poolIdx % pool.length];
      poolIdx++;
    }
  }

  return slots;
}
```

**Step 2: Inject slot assignments into `generateScenePlanForAIGen` userPrompt**

Modify `generateScenePlanForAIGen` to accept an optional `patternSlots` parameter and inject into `userPrompt`:

```javascript
// In generateScenePlanForAIGen signature:
async function generateScenePlanForAIGen(genAI, modelName, scriptText, targetLength = "Short (~60s)", patternSlots = []) {

// Then build the slot directive:
const slotDirective = patternSlots.length > 0
  ? `\n\nMANDATORY PATTERN ASSIGNMENT — DO NOT DEVIATE FROM THESE ASSIGNMENTS:\n` +
    patternSlots.map((p, i) => `Scene ${i}: ${p}`).join("\n") +
    `\nYou MUST assign EXACTLY the visualPattern listed above to each scene. Using any other pattern for these scenes is FORBIDDEN.`
  : "";

// Then in userPrompt:
const userPrompt = `
Script: "${scriptText}"
Target Length: "${targetLength}"
${slotDirective}

Generate a scene plan array following the schema and visualPattern rules.
  `;
```

**Step 3: Call `assignPatternSlots` in `generateAIGenStoryboard` before Phase 1**

```javascript
// In generateAIGenStoryboard, BEFORE calling generateScenePlanForAIGen:

// Count expected scenes from script blocks
const scriptBlocks = parseScriptIntoBlocks(script);
const expectedSceneCount = scriptBlocks.length > 1 ? scriptBlocks.length : 5; // default 5 if no blocks

const patternSlots = assignPatternSlots(expectedSceneCount);
console.log(`[Studio AI Gen] Pre-assigned pattern slots: ${patternSlots.join(", ")}`);

// Then pass to Phase 1:
const scenePlan = await generateScenePlanForAIGen(genAI, modelName, script, targetLength, patternSlots);
```

**Step 4: Downgrade rotation post-processor to validator-only**

In the rotation post-processing loop (lines ~1106–1131), change it from "silently reassign" to "log warning + still reassign as last resort":

```javascript
if (normalized === lastPattern) {
  const recentPatterns = new Set(
    scenePlan.slice(Math.max(0, i - 2), i).map(s => s.visualPattern)
  );
  const isLast = i === scenePlan.length - 1;
  const candidates = VALID_PATTERNS.filter(p => {
    if (recentPatterns.has(p)) return false;
    if (p === "ENDING_CTA" && !isLast) return false;
    return true;
  });
  const alternative = candidates[i % candidates.length] || "PROCESS_TIMELINE";
  console.warn(`[Studio AI Gen] ⚠️ Pattern diversity violation: Scene ${i} Gemini ignored slot assignment '${normalized}'. Override to '${alternative}'.`);
  scene.visualPattern = alternative;
}
```

**Step 5: Commit**

```
git add backend/services/aiGen.js
git commit -m "feat: add full-video pattern slot assignment — no repeats across entire video (Component B)"
```

---

## Task 3: Gemini Pattern Compliance Lock (Component C)

**Files:**
- Modify: `backend/services/aiGen.js` (function `generateTSXCodeForScene`, `generateSingleSceneCode`)

**Step 1: Add `validatePatternCompliance(tsxCode, visualPattern)` function**

Add ABOVE `generateTSXCodeForScene`:

```javascript
/**
 * Heuristic check: does the generated TSX code actually match the expected visual pattern?
 * Returns true if compliant, false if Gemini drifted away from the pattern.
 */
function validatePatternCompliance(tsxCode, visualPattern) {
  if (!tsxCode || !visualPattern) return true; // skip check if data missing
  const code = tsxCode;
  const pattern = visualPattern.toUpperCase();

  try {
    if (pattern === "TITLE_HOOK") {
      // Must NOT have numbered badges (01, 02, 03 circles)
      const hasNumberedBadges = /["'`]0[123]["'`]/.test(code) || /numStr\s*=\s*["'`]0/.test(code);
      if (hasNumberedBadges) {
        console.warn(`[Compliance] TITLE_HOOK violation: found numbered badge pattern in TSX.`);
        return false;
      }
      return true;
    }

    if (pattern === "DUAL_METRIC_CARDS") {
      // Must have 2-column grid
      const hasGrid = /gridTemplateColumns.*1fr.*1fr/.test(code);
      if (!hasGrid) {
        console.warn(`[Compliance] DUAL_METRIC_CARDS violation: missing 2-column gridTemplateColumns.`);
        return false;
      }
      return true;
    }

    if (pattern === "HERO_METRIC_GLOW") {
      // Must have large fontSize (>= 100)
      const hasLargeFont = /fontSize[:\s]+["'`]?1[0-9]{2}/.test(code) || /fontSize[:\s]+["'`]?[2-9][0-9]{2}/.test(code);
      if (!hasLargeFont) {
        console.warn(`[Compliance] HERO_METRIC_GLOW violation: no large hero font size found.`);
        return false;
      }
      return true;
    }

    if (pattern === "COMPARISON_VERSUS") {
      // Must have VS text or 2-column grid
      const hasVS = /\bVS\b/.test(code) || /gridTemplateColumns.*1fr.*auto.*1fr/.test(code);
      if (!hasVS) {
        console.warn(`[Compliance] COMPARISON_VERSUS violation: missing VS badge or 2-column grid.`);
        return false;
      }
      return true;
    }

    if (pattern === "PROCESS_TIMELINE") {
      // Must have step numbering (step.num or step number references)
      const hasSteps = /step\.num/.test(code) || /step[s]?\.map/.test(code) || /steps\.map/.test(code);
      if (!hasSteps) {
        console.warn(`[Compliance] PROCESS_TIMELINE violation: no step chain found.`);
        return false;
      }
      return true;
    }

    // All other patterns: pass by default
    return true;
  } catch (e) {
    return true; // if check itself throws, don't block generation
  }
}
```

**Step 2: Add Pattern Lock Header in `generateTSXCodeForScene` systemInstruction**

Add at the TOP of the systemInstruction string (before `# ROLE`):

```javascript
const patternLockHeader = `
╔══════════════════════════════════════════════════════════════╗
║  ⚠️  LOCKED VISUAL PATTERN: ${scene.visualPattern || "BULLET_GLASS"}
║  You MUST build exactly the DOM structure defined below
║  for this pattern. Using a different structure is WRONG.
║  DO NOT render numbered card lists unless pattern = BULLET_GLASS.
╚══════════════════════════════════════════════════════════════╝

`;

const systemInstruction = patternLockHeader + `
# ROLE
You are an expert React / Remotion TSX component code generator.
...
```

**Step 3: Add compliance validation in `generateSingleSceneCode`**

In `generateSingleSceneCode`, after the current compilation block (around line 1236), add compliance check:

```javascript
if (tsxResult.status === "fulfilled" && tsxResult.value) {
  tsxCode = tsxResult.value;
  compiledJS = compileTSX(tsxCode);

  // Check pattern compliance — if Gemini ignored the pattern structure, use safety net
  if (compiledJS && !validatePatternCompliance(tsxCode, scene.visualPattern)) {
    console.warn(`[Studio AI Gen] ⚠️ Pattern compliance FAIL for scene ${index} (${scene.visualPattern}). Using safety net template.`);
    tsxCode = generateSafetyNetTSX(scene);
    compiledJS = compileTSX(tsxCode);
  }

  if (!compiledJS) {
    console.warn(`[Studio AI Gen] Compile error on scene ${index}. Activating safety net fallback (${safetyNetPattern})...`);
    tsxCode = generateSafetyNetTSX(scene);
    compiledJS = compileTSX(tsxCode);
  }
}
```

**Step 4: Commit**

```
git add backend/services/aiGen.js
git commit -m "feat: add Gemini pattern compliance lock — pattern validator + lock header (Component C)"
```

---

## Task 4: End-to-End Verification

**Step 1: Restart backend**

```
# Stop and restart backend dev server
npm run dev  # in backend/
```

**Step 2: Generate test video via frontend**

Generate a 5-scene video from any sample script in Studio AI Gen. Check backend console output for:
```
[Studio AI Gen] Pre-assigned pattern slots: TITLE_HOOK, DUAL_METRIC_CARDS, HERO_METRIC_GLOW, COMPARISON_VERSUS, ENDING_CTA
```

**Step 3: Visually inspect in Remotion Studio**

Open `http://localhost:3000` — confirm:
- Scene 1: Full-screen heading, NO numbered cards
- Scene 2: 2 side-by-side metric cards
- Scene 3: Giant number with glow
- Scene 4: VS comparison layout
- Scene 5: CTA outro

**Step 4: Test safety net diversity**

Temporarily add `throw new Error("forced failure")` at start of `generateTSXCodeForScene`. Regenerate. Confirm all 5 scenes use different safety net templates. Remove the throw.

**Step 5: Final commit**

```
git add backend/services/aiGen.js
git commit -m "feat: layout diversity anti-repetition engine v2 — A+B+C complete"
```

---

## Rollback Plan

If issues arise:
1. `git revert HEAD~3` to undo all 3 component commits
2. Or restore `generateGlassCardSafetyNetTSX` calls and remove new dispatcher

All changes are backward compatible — existing scenes and TTS pipeline are unaffected.
