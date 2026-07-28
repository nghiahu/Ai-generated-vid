import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SubtitleWord {
  word: string;
  speechStart: number;
  speechEnd: number;
  displayStart: number;
  displayEnd: number;
  highlightStart: number;
  highlightPeak: number;
  highlightEnd: number;
}

export interface DynamicSubtitleProps {
  voiceover: string;
  durationSeconds: number;
  voiceoverDuration?: number;
  subtitlesJson?: SubtitleWord[] | Array<{word: string, start: number, end: number}>;
  accentColor?: string;
  visualStyle?: string;
  customSubtitle?: {
    bottom?: string;
    fontSize?: string;
    fontWeight?: string;
    useThemeTextShadow?: boolean;
  };
}

// ─── Helpers (pure functions, no state) ───────────────────────────────────────

/** Normalize legacy {start, end} schema → new SubtitleWord schema */
function normalizeWords(words: DynamicSubtitleProps["subtitlesJson"]): SubtitleWord[] {
  if (!words || words.length === 0) return [];

  // Safe helper to convert values to valid numbers
  const safeNum = (v: any, fallback = 0): number => {
    if (v === undefined || v === null || isNaN(Number(v))) return fallback;
    return Number(v);
  };

  const first = words[0] as Record<string, unknown>;
  if ("displayStart" in first) {
    // If it's the new schema, still clean and ensure all values are safe numbers
    return (words as SubtitleWord[]).map(w => ({
      word: w.word || "",
      speechStart: safeNum(w.speechStart),
      speechEnd: safeNum(w.speechEnd),
      displayStart: safeNum(w.displayStart),
      displayEnd: safeNum(w.displayEnd),
      highlightStart: safeNum(w.highlightStart),
      highlightPeak: safeNum(w.highlightPeak),
      highlightEnd: safeNum(w.highlightEnd)
    }));
  }

  // Legacy schema: map safely to new schema
  return (words as Array<{word: string, start: number, end: number}>).map((w, i, arr) => {
    const next = arr[i + 1];
    const startVal = safeNum(w.start);
    const endVal = safeNum(w.end, startVal + 0.2);
    const nextStartVal = next ? safeNum(next.start, endVal) : endVal + 0.35;
    
    return {
      word: w.word || "",
      speechStart: startVal,
      speechEnd: endVal,
      displayStart: startVal,
      displayEnd: nextStartVal,
      highlightStart: startVal,
      highlightPeak: Math.min(startVal + 0.06, endVal),
      highlightEnd: nextStartVal
    };
  });
}

/**
 * O(log n) binary search for active word index.
 * Returns index of word where displayStart <= currentSeconds < displayEnd.
 * If in a gap, returns the last word whose displayStart has passed.
 */
function binarySearchActiveWord(words: SubtitleWord[], currentSeconds: number): number {
  let lo = 0, hi = words.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (currentSeconds < words[mid].displayStart) hi = mid - 1;
    else if (currentSeconds >= words[mid].displayEnd) lo = mid + 1;
    else return mid;
  }
  return Math.max(0, lo - 1);
}

/** Parse a hex color into {r, g, b} components */
function parseRGB(hex: string | null | undefined): {r: number, g: number, b: number} {
  if (!hex || typeof hex !== "string") {
    return {r: 255, g: 183, b: 197};
  }
  const clean = hex.replace("#", "").trim();
  if (clean.length === 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return { r, g, b };
    }
  }
  return {r: 255, g: 183, b: 197};
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DynamicSubtitle: React.FC<DynamicSubtitleProps> = ({
  voiceover,
  durationSeconds,
  voiceoverDuration,
  subtitlesJson,
  accentColor = "#FFB7C5",
  visualStyle,
  customSubtitle
}) => {
  // ⚠️ ALL hooks must be called unconditionally before any early return
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Normalize subtitle words once (pure memo, no side effects)
  const words = useMemo(() => {
    if (!Array.isArray(subtitlesJson) || subtitlesJson.length === 0) return [];
    return normalizeWords(subtitlesJson);
  }, [subtitlesJson]);

  const hasTimestamps = words.length > 0;
  const currentSeconds = frame / fps;

  const activeDurationSeconds = typeof voiceoverDuration === "number" && voiceoverDuration > 0
    ? voiceoverDuration
    : durationSeconds;

  // Fallback linear groups (always computed to avoid conditional hook issues)
  const rawWords = useMemo(
    () => (voiceover ?? "").split(/\s+/).filter(w => w.trim().length > 0),
    [voiceover]
  );

  const groups = useMemo<string[][]>(() => {
    if (rawWords.length === 0) return [];
    const result: string[][] = [];
    let currentLine: string[] = [];
    
    rawWords.forEach((word) => {
      currentLine.push(word);
      const hasPunctuation = /[.?!,:]$/.test(word.trim());
      if (hasPunctuation || currentLine.length >= 7) {
        result.push(currentLine);
        currentLine = [];
      }
    });
    
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
    return result;
  }, [rawWords]);

  const timestampedGroups = useMemo<SubtitleWord[][]>(() => {
    if (words.length === 0) return [];
    const result: SubtitleWord[][] = [];
    let currentLine: SubtitleWord[] = [];
    
    words.forEach((w) => {
      currentLine.push(w);
      const hasPunctuation = /[.?!,:]$/.test((w.word || "").trim());
      if (hasPunctuation || currentLine.length >= 7) {
        result.push(currentLine);
        currentLine = [];
      }
    });
    
    if (currentLine.length > 0) {
      result.push(currentLine);
    }
    return result;
  }, [words]);

  const wordToGroupMap = useMemo(() => {
    const map: number[] = [];
    timestampedGroups.forEach((group, gIdx) => {
      group.forEach(() => {
        map.push(gIdx);
      });
    });
    return map;
  }, [timestampedGroups]);

  const totalFrames = activeDurationSeconds * fps;
  const startOffsetFrames = Math.min(10, Math.floor(fps * 0.15));
  const speakingFrames = Math.max(30, totalFrames - startOffsetFrames);
  const adjustedFrame = Math.max(0, Math.min(speakingFrames - 1, frame - startOffsetFrames));
  const framesPerGroup = groups.length > 0 ? speakingFrames / groups.length : speakingFrames;

  // Active word/group — pure derivation from frame (no mutable state)
  const activeWordIdx = useMemo(() => {
    if (!hasTimestamps) return 0;
    return binarySearchActiveWord(words, currentSeconds);
  }, [hasTimestamps, words, currentSeconds]);

  const activeGroupIdx = hasTimestamps
    ? (wordToGroupMap[activeWordIdx] ?? 0)
    : Math.min(groups.length - 1, Math.floor(adjustedFrame / framesPerGroup));

  // ── Now safe to early return ─────────────────────────────────────────────────
  if (customSubtitle && (customSubtitle as any).enabled === false) return null;
  if (!voiceover || rawWords.length === 0) return null;

  if (hasTimestamps && words.length > 0) {
    const lastWord = words[words.length - 1];
    if (currentSeconds > lastWord.displayEnd + 0.05) return null;

    const curWord = words[activeWordIdx];
    const nextWord = words[activeWordIdx + 1] ?? null;
    if (currentSeconds > curWord.displayEnd && nextWord && currentSeconds < nextWord.displayStart) {
      return null; // hide during long pause
    }
  } else {
    if (frame >= totalFrames + startOffsetFrames) return null;
  }

  const currentGroup = hasTimestamps
    ? (timestampedGroups[activeGroupIdx] || []).map(w => w.word)
    : groups[activeGroupIdx] || [];

  if (currentGroup.length === 0) return null;

  const safeGroupStartWordIdx = (() => {
    if (hasTimestamps) {
      let sum = 0;
      for (let i = 0; i < activeGroupIdx; i++) {
        sum += timestampedGroups[i]?.length || 0;
      }
      return sum;
    } else {
      let sum = 0;
      for (let i = 0; i < activeGroupIdx; i++) {
        sum += groups[i]?.length || 0;
      }
      return sum;
    }
  })();

  // ── Styling ──────────────────────────────────────────────────────────────────
  const styleName = (visualStyle || "").toLowerCase();
  const isRikkei = styleName.includes("rikkei") || styleName.includes("academic");
  const isLightBg = isRikkei || styleName.includes("claude") || styleName.includes("light") || styleName.includes("anime");

  const inactiveColor = isLightBg ? "rgba(25, 25, 25, 0.65)" : "rgba(255, 255, 255, 0.70)";
  const textColor = isLightBg ? "#191919" : "#ffffff";
  const effectiveAccentColor = isRikkei 
    ? "#A8232A" 
    : (styleName.includes("fintech") ? "#00e5ff" : accentColor);
  const accent = parseRGB(effectiveAccentColor);

  const rawBottom = customSubtitle?.bottom || "120px";
  const bottomPx = parseInt(rawBottom);
  const bottom = isNaN(bottomPx) || bottomPx < 100 ? "115px" : `${bottomPx}px`;
  const fontSize = customSubtitle?.fontSize || "46px";
  const fontWeight = customSubtitle?.fontWeight ? parseInt(customSubtitle.fontWeight) : 800;
  const textShadow = isLightBg 
    ? "0px 1px 2px rgba(255, 255, 255, 0.9), 0px 0px 4px rgba(255, 255, 255, 0.5)" 
    : "0px 2px 8px rgba(0, 0, 0, 0.95), 0px 4px 16px rgba(0, 0, 0, 0.8), 0px 0px 4px rgba(0, 0, 0, 0.9)";

  // ── Group fade-in (Remotion-native interpolate) ──────────────────────────────
  let groupOpacity: number;
  if (hasTimestamps && words.length > 0) {
    const groupFirstWord = words[Math.min(safeGroupStartWordIdx, words.length - 1)];
    const groupEnterFrame = Math.floor((groupFirstWord?.displayStart || 0) * fps);
    groupOpacity = interpolate(frame, [groupEnterFrame, groupEnterFrame + 6], [0.15, 1.0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
  } else {
    const groupStartFrame = activeGroupIdx * framesPerGroup;
    groupOpacity = interpolate(
      adjustedFrame,
      [groupStartFrame, groupStartFrame + 8],
      [0.15, 1.0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: "5%",
        width: "90%",
        display: "flex",
        justifyContent: "center",
        zIndex: 20,
        pointerEvents: "none",
        opacity: groupOpacity
      }}
    >
      <p
        style={{
          fontFamily: isRikkei ? "Be Vietnam Pro, sans-serif" : (isLightBg ? "Inter, sans-serif" : "Outfit, Inter, sans-serif"),
          fontSize,
          fontWeight,
          color: textColor,
          textAlign: "center",
          lineHeight: 1.45,
          textShadow,
          margin: 0,
          padding: 0,
          background: "none",
          boxShadow: "none",
          border: "none",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: "14px",
          rowGap: "14px"
        }}
      >
        {currentGroup.map((rawWord, wIdx) => {
          const absoluteWordIdx = safeGroupStartWordIdx + wIdx;
          const isActive = absoluteWordIdx === activeWordIdx;

          let wordScale = 1.0;
          let wordColor = inactiveColor;
          let glowFilter = "none";

          if (hasTimestamps && words[absoluteWordIdx]) {
            const w = words[absoluteWordIdx];
            const enterFrame = Math.floor(w.highlightStart * fps);
            const peakFrame  = enterFrame + 1;
            const peakEndFrame = peakFrame + 1;
            const leaveFrame = Math.max(peakEndFrame + 1, Math.floor(w.highlightEnd * fps));

            // Scale bump: 1.0 → 1.08 → 1.0 (Remotion-native, no CSS transition)
            wordScale = interpolate(
              frame,
              [enterFrame, peakFrame, peakEndFrame, leaveFrame],
              [1.0, 1.08, 1.08, 1.0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            if (isActive) {
              // Color lerp from inactive → accent
              const colorProg = interpolate(frame, [enterFrame, peakFrame], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
              });
              const inRGB = isLightBg ? {r: 0, g: 0, b: 0} : {r: 255, g: 255, b: 255};
              const r = Math.round(inRGB.r + (accent.r - inRGB.r) * colorProg);
              const g = Math.round(inRGB.g + (accent.g - inRGB.g) * colorProg);
              const b = Math.round(inRGB.b + (accent.b - inRGB.b) * colorProg);
              wordColor = `rgb(${r}, ${g}, ${b})`;

              // Glow: 0 → 1 → 0
              const glowProg = interpolate(frame, [enterFrame, peakFrame, leaveFrame], [0, 1, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
              });
              if (glowProg > 0.05) {
                const glowPx = Math.round(glowProg * 8);
                glowFilter = `drop-shadow(0 0 ${glowPx}px ${accentColor}99)`;
              }
            }
          } else if (!hasTimestamps) {
            const wordDuration = framesPerGroup / currentGroup.length;
            const localFrame = adjustedFrame % framesPerGroup;
            const localActiveIdx = Math.floor(localFrame / wordDuration);
            if (wIdx === localActiveIdx) {
              wordColor = accentColor;
              wordScale = 1.06;
            }
          }

          return (
            <span
              key={wIdx}
              style={{
                color: wordColor,
                display: "inline-block",
                transform: `scale(${wordScale.toFixed(4)})`,
                transformOrigin: "bottom center",
                filter: glowFilter
              }}
            >
              {rawWord}
            </span>
          );
        })}
      </p>
    </div>
  );
};
