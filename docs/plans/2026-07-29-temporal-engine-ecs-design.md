# Sprint 4 Design — Temporal Engine Foundation & ECS Behaviors

**Date:** 2026-07-29  
**Status:** PROPOSED — awaiting developer review  
**Author:** Antigravity & Lead Architect

---

## 1. Problem Statement & Scope

Sprint 3 proved the end-to-end pipeline using hardcoded / linear timing models. However, to achieve professional, premium video content, we need two fundamental improvements:
1. **Temporal Alignment**: Visual elements must reveal and animate exactly when their corresponding words are spoken in the audio.
2. **Behavior Modularity**: Functional behaviors (`BehaviorFn`) lead to monolithic code, rendering bugs, and style collisions when composing multiple movements.

**Sprint 4 Scope:**
- **Audio Pipeline**: Integrate TTS voiceover generation and Forced Alignment (Whisper-based) directly into the REST backend generation flow.
- **Unified Timeline (TemporalTree)**: Extract a hierarchy of speech segments (Scene → Beat → Phrase → Word) and align beats to actual word timestamps using a new frontend `TextAligner` utility.
- **ECS Behavior Model v1**: Migrate standard behaviors (`Transform`, `Opacity`, `Scale`, `Counter`, `TextReveal`) to class-based modular behaviors, using a pure numerical `VisualState` schema and an Aggregation layer to compose properties.

---

## 2. Architecture & Data Flow

```
Script
  │
  ▼
[2-Pass Semantic Planner] ──► Intent & Content Manifest
  │
  ▼
[Audio Pipeline] ───────────► 1. generateTTS() -> audio.mp3
  │                           2. forced-alignment (aligner.js) -> subtitlesJson
  │
  ▼
[DirectorManifest] ─────────► Enriched with audioUrl, audioDuration, subtitlesJson
  │
  ▼
[TextAligner] ──────────────► Normalizes strings and matches scene text to WordTimeline
  │
  ▼
[BeatPlanner] ──────────────► Resolves TemporalTree beats based on word timestamps
  │
  ▼
[Motion Runtime] ───────────► Evaluates Behavior class update() loops
  │
  ▼
[VisualStateComposer] ──────► Composes/Aggregates individual behavior states
  │
  ▼
[MotionNode] ───────────────► Maps final VisualState to React styles & renders DOM
```

---

## 3. Detailed Specifications

### 3.1 Extended DirectorManifest Schema

The `DirectorScene` block in `my-video/src/schemas/DirectorManifest.ts` will be extended:

```typescript
export interface WordTimestamp {
  word: string;
  speechStart: number;  // in seconds
  speechEnd: number;
  displayStart: number;
  displayEnd: number;
  highlightStart: number;
  highlightPeak: number;
  highlightEnd: number;
}

export interface DirectorScene {
  sceneIndex: number;
  intent: SceneIntent;
  content: SceneContent;
  // Extended fields in Sprint 4:
  audioUrl?: string;
  audioDuration?: number;
  subtitlesJson?: WordTimestamp[];
}
```

### 3.2 The TemporalTree

Rather than flat beat timing, the system resolves a hierarchical `TemporalTree` where layout elements can subscribe to different resolutions:

```typescript
export interface TemporalNode {
  id: string; // e.g. "beat_1", "title_word_0"
  label: string;
  startSec: number;
  endSec: number;
  children?: TemporalNode[];
}

export interface TemporalTree {
  sceneDuration: number;
  beats: TemporalNode[];
}
```

- **Camera** subscribes to Scene-level duration.
- **Transitions** subscribe to Outro/Intro beat nodes.
- **Node animations** (reveal, idle) subscribe to component-level Beats (Title, Metric, Caption).
- **Subtitles/Text Reveal** (kinetic typography) subscribe to word-level timestamps.

### 3.3 TextAligner & Beat Boundary Rules

To match raw audio word timestamps to visual slots (`heading`, `primary`, `supporting`), the frontend `TextAligner` utility will:
1. Normalize Viet/Eng text strings (lowercase, strip punctuation, numbers to text representation).
2. Match substrings of `heading`, `primary`, and `supporting` to chunks of `subtitlesJson`.
3. Resolve the boundary start/end time of each block.

*Fallback Rule:* If alignment fails (e.g. word mismatches), the system automatically defaults to ratio-based linear spacing (Approach B) to ensure render safety.

---

## 4. Behavior ECS v1

### 4.1 VisualState Contract

VisualState represents pure abstract movement variables, completely decoupled from CSS:

```typescript
export interface VisualState {
  transform?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  opacity?: number;
  effects?: {
    glow?: number;  // 0.0 -> 1.0
    blur?: number;  // 0.0 -> 1.0
  };
  data?: {
    counterValue?: number;
    textProgress?: number; // 0.0 -> 1.0 (for word reveal/stagger)
  };
}
```

### 4.2 MotionBehavior Base Class

Behaviors are instantiated once and maintain isolated states (e.g. progress, phase, velocity):

```typescript
export abstract class MotionBehavior {
  abstract update(ctx: MotionContext): VisualState;
}
```

### 4.3 VisualStateComposer

To prevent behavior styles from overriding each other (e.g. a Shake behavior overwriting a Slide Y transform), the composer aggregates contributions:

- **Transforms (x, y, rotation)**: Additive sum of X, Y, and rotation.
- **Scale**: Multiplicative (`scale = scale_1 * scale_2`).
- **Opacity**: Multiplicative (`opacity = opacity_1 * opacity_2`).
- **Effects (glow, blur)**: Blended using `Math.max` or normalized weighted sum.

---

## 5. Proposed Changes & Implementation Plan

### Phase 1: Backend Audio Pipeline
- [ ] Modify `backend/routes/directorRoute.js`:
  - After LLM Pass 2 finishes, trigger `generateTTS` for the voiceover.
  - Call `aligner.getWordTimestamps` on the output audio to generate word timestamps.
  - Save `audioUrl`, `audioDuration`, and `subtitlesJson` inside the database project manifest.
- [ ] Verify using a local integration script `backend/scratch/test_sprint4_backend.js`.

### Phase 2: Frontend TemporalTree & Aligners
- [ ] Create `my-video/src/compositions/director/motion/TextAligner.ts` for semantic token matching.
- [ ] Modify `my-video/src/compositions/director/motion/BeatPlanner.ts` to build `TemporalTree` beats from aligner output, with linear ratio fallback.
- [ ] Modify `my-video/src/compositions/director/DirectorRoot.tsx` to mount audio playback matching `audioUrl`.
- [ ] Write unit tests verifying correct alignment boundaries.

### Phase 3: Behavior ECS v1 Refactor
- [ ] Create `my-video/src/runtime/MotionBehavior.ts` containing class types and VisualState schema.
- [ ] Create `my-video/src/runtime/VisualStateComposer.ts` implementing aggregation math.
- [ ] Create primitive behavior classes:
  - `FadeUpBehavior` (Transform + Opacity)
  - `PulseGlowBehavior` (Scale + Glow)
  - `CountUpBehavior` (Counter)
  - `CascadeBehavior` (TextReveal / Stagger)
- [ ] Update `MotionNode.tsx` to evaluate behavior classes and convert `VisualState` to CSS styles.

---

## 6. Verification Plan

### Automated Tests
- Run `npx tsx scratch_run_test.ts` to assert that the pipeline parses `TemporalTree` and computes visual states correctly.
- Add test assertions for `TextAligner.ts` against mismatched speech transcripts.

### Manual Verification
- Render a fully aligned video from a new script and confirm visual elements animate in sync with spoken voiceover syllables.
