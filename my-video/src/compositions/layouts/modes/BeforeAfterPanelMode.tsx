import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig, 
  renderNestedCardContent 
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

export const BeforeAfterPanelMode: React.FC<ModeRendererProps> = ({
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
  voiceover,
  activeCardTextColor,
  activeCardBadgeColor,
  inactiveCardTextColor,
  theme,
  highlightWords
}) => {
  const safeComps = otherComps.length > 0 ? otherComps : [
    { id: "fallback_1", type: "card", data: { text: "Phân cảnh so sánh" } },
    { id: "fallback_2", type: "card", data: { text: "Chi tiết phân tích" } }
  ];
  const beforeComp = safeComps[0];
  const afterComp = safeComps[1] || safeComps[0];
  const explanationComp = safeComps[2];
  const explanationText = voiceover || (explanationComp ? explanationComp.data.text : "");

  const topRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: gap !== undefined ? `${Math.min(gap, 20)}px` : "20px",
    width: "100%",
    maxWidth: "1000px",
    alignItems: "center",
    zIndex: 5
  };

  const bottomRowStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "1000px",
    marginTop: gap !== undefined ? `${Math.min(gap, 16)}px` : "16px",
    zIndex: 5
  };

  const renderPanelCard = (compOrText: any, cardIdx: number, isAccent: boolean) => {
    if (!compOrText) return null;
    
    const isString = typeof compOrText === "string";
    const rawText = isString ? compOrText : compOrText.data.text;
    const text = cleanCardText(rawText);
    const comp = isString ? null : compOrText;
    
    const itemStyleSetting = t.items.itemStyles[cardIdx] || { fontSize: "28px", fontWeight: "800" };
    const rotation = t.items.rotations && t.items.rotations[cardIdx] !== undefined ? t.items.rotations[cardIdx] : 0;
    const pos = resolvedPositions[cardIdx];

    const isLeft = cardIdx === 0;
    const isRight = cardIdx === 1;
    const sideLabelIcon = isLeft ? "✕ " : isRight ? "✓ " : "";
    const defaultSideLabel = isLeft ? "TRƯỚC ĐÂY" : isRight ? "SAU NÀY" : null;
    const sideLabel = defaultSideLabel ? `${sideLabelIcon}${defaultSideLabel}` : null;

    // Contrast colors based on whether card background is accent-filled vs default
    const sideLabelColor = isAccent 
      ? "rgba(255, 255, 255, 0.85)" 
      : (isLeft ? "#F87171" : (accentColor || "#34D399"));

    const bodyTextColor = isAccent 
      ? "#FFFFFF" 
      : (inactiveCardTextColor || (isLight ? "#0F172A" : "#FFFFFF"));

    const sideHighlightColor = isAccent 
      ? "#FFFFFF" 
      : (isLeft ? "#FBBF24" : (accentColor || "#F87171"));

    const { body, highlight } = extractBodyAndHighlight(text, highlightWords);

    const defaultBg = styles.cardStyle.background || styles.cardStyle.backgroundColor || (isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.82)");
    const defaultBorder = styles.cardStyle.border || (isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1.5px solid rgba(255, 255, 255, 0.18)");
    const defaultShadow = styles.cardStyle.boxShadow || (isLight ? "0 10px 30px rgba(0, 0, 0, 0.06)" : "0 24px 60px rgba(0, 0, 0, 0.3)");

    const cardStyle: React.CSSProperties = {
      minHeight: cardIdx === 2 ? "auto" : (isVertical ? "300px" : "380px"),
      height: cardIdx === 2 ? "auto" : undefined,
      borderRadius: itemStyleSetting.borderRadius || "28px",
      padding: resolvePadding(itemStyleSetting.padding || "28px", paddingScale),
      transform: `rotate(${rotation}deg)${isRight ? " scale(1.05)" : ""}`,
      zIndex: isRight ? 10 : 5,
      background: isAccent
        ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor || accentColor})`
        : defaultBg,
      border: isAccent 
        ? "none" 
        : (isRight ? `2px solid ${accentColor || "#EF4444"}` : defaultBorder),
      boxShadow: isAccent
        ? `0 20px 50px rgba(0, 0, 0, 0.3), 0 0 25px ${accentColor}44`
        : (isRight ? `0 20px 50px rgba(0, 0, 0, 0.15), 0 0 25px ${accentColor}33` : defaultShadow),
      backdropFilter: "blur(16px) saturate(1.15)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      textAlign: "left",
      boxSizing: "border-box"
    };

    const sideLabelStyle: React.CSSProperties = {
      fontSize: "12px",
      fontWeight: 900,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: sideLabelColor,
      fontFamily: styles.fontFamily,
      marginBottom: "12px"
    };

    const animConfig = getAnimationConfig(comp || { data: { text } }, cardIdx, "scale-in", 0.3, t);
    return (
      <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
        <div style={cardStyle}>
          {!isString && pos && pos.nestedStructure ? (
            renderNestedCardContent({
              ns: pos.nestedStructure,
              comp,
              idx: cardIdx,
              isAccentCard: isAccent,
              parentDelay: animConfig.delay,
              otherComps,
              accentColor,
              rgb,
              isLight,
              darkAccentColor,
              styles,
              fontScale,
              activeCardTextColor,
              activeCardBadgeColor,
              inactiveCardTextColor
            })
          ) : (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", gap: "16px" }}>
              <div>
                {sideLabel && <div style={sideLabelStyle}>{sideLabel}</div>}
                <div style={{ 
                  fontSize: cardIdx === 2 
                    ? `${Math.max(22, 25 * fontScale)}px` 
                    : getDynamicFontSize(body || text, 26, fontScale), 
                  fontWeight: cardIdx === 2 ? 680 : 700, 
                  color: bodyTextColor, 
                  fontFamily: styles.fontFamily,
                  lineHeight: 1.35
                }}>
                  {body || text}
                </div>
              </div>
              {highlight && cardIdx !== 2 && (
                <div style={{
                  fontSize: `${Math.round(40 * fontScale)}px`,
                  fontWeight: 950,
                  color: sideHighlightColor,
                  fontFamily: styles.fontFamily,
                  lineHeight: 1.1,
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em",
                  marginTop: "8px"
                }}>
                  {highlight}
                </div>
              )}
            </div>
          )}
        </div>
      </AnimatedBlock>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", alignItems: "center" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: "1000px" }}>
        <div style={topRowStyle}>
          {renderPanelCard(beforeComp, 0, t.items.itemStyles[0]?.useAccentBg || false)}
          {renderPanelCard(afterComp, 1, t.items.itemStyles[1]?.useAccentBg || false)}
        </div>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #e11d48 0%, #9f1239 100%)",
          boxShadow: "0 4px 12px rgba(225, 29, 72, 0.35)",
          color: "#FFFFFF",
          fontSize: "16px",
          fontWeight: 900,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 15,
          border: "2px solid #FFFFFF"
        }}>
          VS
        </div>
      </div>
      {explanationText && (
        <div style={bottomRowStyle}>
          {renderPanelCard(explanationText, 2, t.items.itemStyles[2]?.useAccentBg || false)}
        </div>
      )}
    </div>
  );
};

