import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig 
} from "./LayoutNestedRenderers";

const cleanCardText = (rawText: string): string => {
  if (!rawText) return "";
  const trimmed = rawText.trim();
  const words = trimmed.split(/\s+/);
  if (words.length >= 4) {
    const len = words.length;
    if (words[len - 1].toLowerCase() === words[len - 2].toLowerCase()) {
      return words.slice(0, len - 1).join(" ");
    }
    if (len >= 4 && words[len - 2].toLowerCase() === words[len - 4].toLowerCase() && words[len - 1].toLowerCase() === words[len - 3].toLowerCase()) {
      return words.slice(0, len - 2).join(" ");
    }
  }
  return trimmed;
};

const extractBodyAndHighlight = (text: string, highlightWords?: string[]): { body: string; highlight: string } => {
  if (!text) return { body: "", highlight: "" };
  const trimmed = text.trim();
  
  if (highlightWords && highlightWords.length > 0) {
    for (const hw of highlightWords) {
      const hwClean = hw.trim();
      if (!hwClean) continue;
      const idx = trimmed.toLowerCase().indexOf(hwClean.toLowerCase());
      if (idx !== -1) {
        const bodyPart = (trimmed.substring(0, idx) + " " + trimmed.substring(idx + hwClean.length)).trim().replace(/\s+/g, " ");
        const matchedHighlight = trimmed.substring(idx, idx + hwClean.length).trim();
        return { body: bodyPart, highlight: matchedHighlight };
      }
    }
  }

  const matchNum = trimmed.match(/^(.*?)\s+(\d+(?:\s+[A-Za-zÀ-ỹ]+)?)$/i);
  if (matchNum && matchNum[1].trim()) {
    return { body: matchNum[1].trim(), highlight: matchNum[2].trim() };
  }

  const words = trimmed.split(/\s+/);
  if (words.length >= 3) {
    const highlight = words[words.length - 1];
    const body = words.slice(0, words.length - 1).join(" ");
    return { body, highlight };
  }

  return { body: trimmed, highlight: "" };
};

export const TimelineShiftMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  isVertical,
  styles,
  fontScale,
  paddingScale,
  gap,
  activeCardTextColor,
  inactiveCardTextColor,
  highlightWords
}) => {
  const safeComps = otherComps.length > 0 ? otherComps : [
    { id: "fallback_1", type: "card", data: { text: "Kỹ năng hot nhất 2026" } },
    { id: "fallback_2", type: "card", data: { text: "Chỉ có ba bước 3 bước" } }
  ];
  const compLeft = safeComps[0];
  const compRight = safeComps[1] || safeComps[0];

  const outerContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: "1000px",
    borderRadius: "36px",
    backgroundColor: isLight ? "rgba(255, 255, 255, 0.45)" : "rgba(10, 16, 30, 0.65)",
    border: isLight ? "1.5px solid rgba(0, 0, 0, 0.08)" : "1.5px solid rgba(255, 255, 255, 0.12)",
    boxShadow: isLight
      ? "0 25px 60px rgba(0, 0, 0, 0.08), inset 0 0 35px rgba(255, 255, 255, 0.8)"
      : "0 25px 60px rgba(0, 0, 0, 0.55), inset 0 0 35px rgba(255, 255, 255, 0.02)",
    backdropFilter: "blur(20px)",
    padding: isVertical ? "40px 24px" : "52px 36px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxSizing: "border-box",
    perspective: "1200px",
    zIndex: 5
  };

  const renderShiftCard = (comp: any, cardIdx: number) => {
    if (!comp) return null;
    const isLeft = cardIdx === 0;
    const rawText = comp.data?.text || "";
    const text = cleanCardText(rawText);
    const { body, highlight } = extractBodyAndHighlight(text, highlightWords);

    const sideColor = isLeft ? (accentColor || "#EF4444") : "#EAB308";
    const sidePillText = isLeft ? "PAST PHASE" : "UPGRADED FUTURE";
    const sideLabelText = isLeft ? (body || "KỸ NĂNG HOT NHẤT") : (body || "CHỈ CÓ BA BƯỚC");

    const itemStyleSetting = t.items.itemStyles[cardIdx] || { fontSize: "26px", fontWeight: "800" };

    const defaultThemeBg = styles.cardStyle.background || styles.cardStyle.backgroundColor || "rgba(255, 255, 255, 0.95)";

    const cardStyle: React.CSSProperties = {
      width: isVertical ? "72%" : "68%",
      alignSelf: isLeft ? "flex-start" : "flex-end",
      borderRadius: itemStyleSetting.borderRadius || "24px",
      padding: resolvePadding(itemStyleSetting.padding || "22px", paddingScale),
      backgroundColor: isLeft 
        ? (isLight ? "rgba(245, 245, 247, 0.82)" : "rgba(8, 14, 28, 0.88)") 
        : (isLight ? undefined : "rgba(12, 20, 36, 0.95)"),
      background: !isLeft && isLight ? defaultThemeBg : undefined,
      border: isLeft 
        ? (isLight ? "1px solid rgba(0, 0, 0, 0.08)" : `1.5px solid ${sideColor}55`)
        : `2px solid ${sideColor}`,
      boxShadow: isLeft 
        ? (isLight ? "0 10px 30px rgba(0, 0, 0, 0.04)" : `0 12px 36px rgba(0, 0, 0, 0.45), 0 0 20px ${sideColor}15`)
        : (isLight ? `0 20px 40px rgba(0, 0, 0, 0.06), 0 0 25px ${sideColor}18` : `0 30px 60px rgba(0, 0, 0, 0.7), 0 0 40px ${sideColor}44`),
      backdropFilter: "blur(16px)",
      transform: isLeft 
        ? "perspective(1000px) rotateY(10deg) rotateX(-6deg) scale(0.92)"
        : "perspective(1000px) rotateY(-10deg) rotateX(6deg) scale(1.08)",
      opacity: isLeft ? 0.88 : 1.0,
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      boxSizing: "border-box",
      position: "relative",
      zIndex: isLeft ? 5 : 10
    };

    const topHeaderStyle: React.CSSProperties = {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px"
    };

    const labelStyle: React.CSSProperties = {
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      color: sideColor,
      fontFamily: styles.fontFamily
    };

    const pillStyle: React.CSSProperties = {
      fontSize: "10px",
      fontWeight: 900,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      padding: "4px 10px",
      borderRadius: "12px",
      color: sideColor,
      backgroundColor: isLeft 
        ? (isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(148, 163, 184, 0.12)") 
        : "rgba(234, 179, 8, 0.15)",
      border: isLeft 
        ? (isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.15)") 
        : `1.5px solid ${sideColor}`
    };

    const animConfig = getAnimationConfig(comp, cardIdx, "scale-in", 0.3, t);

    return (
      <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
        <div style={cardStyle}>
          <div style={topHeaderStyle}>
            <span style={labelStyle}>{sideLabelText}</span>
            <span style={pillStyle}>{sidePillText}</span>
          </div>
          <div style={{
            fontSize: getDynamicFontSize(body || text, 26, fontScale),
            fontWeight: 700,
            color: isLight ? (inactiveCardTextColor || "#191919") : (activeCardTextColor || "#ffffff"),
            fontFamily: styles.fontFamily,
            lineHeight: 1.35
          }}>
            {body || text}
          </div>
          {highlight && (
            <div style={{
              fontSize: `${Math.round(40 * fontScale)}px`,
              fontWeight: 950,
              color: sideColor,
              fontFamily: styles.fontFamily,
              lineHeight: 1.1,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              marginTop: "4px"
            }}>
              {highlight}
            </div>
          )}
        </div>
      </AnimatedBlock>
    );
  };

  return (
    <div style={outerContainerStyle}>
      {/* Decorative vertical red indicator line on top left */}
      <div style={{
        position: "absolute",
        left: "12px",
        top: "60px",
        width: "3px",
        height: "60px",
        backgroundColor: accentColor || "#EF4444",
        borderRadius: "999px",
        opacity: 0.6
      }} />

      {/* Decorative vertical gold indicator line on bottom right */}
      <div style={{
        position: "absolute",
        right: "12px",
        bottom: "60px",
        width: "3px",
        height: "60px",
        backgroundColor: "#EAB308",
        borderRadius: "999px",
        opacity: 0.6
      }} />

      {/* SVG Connecting Dashed Shift Line */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 6 }}>
        <line
          x1="38%"
          y1="40%"
          x2="62%"
          y2="60%"
          stroke="#EAB308"
          strokeWidth="2"
          strokeDasharray="6 6"
          strokeOpacity="0.75"
        />
      </svg>

      {renderShiftCard(compLeft, 0)}
      {renderShiftCard(compRight, 1)}
    </div>
  );
};
