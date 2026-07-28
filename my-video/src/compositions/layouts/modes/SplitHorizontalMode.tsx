import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig, 
  renderNestedCardContent 
} from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

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

export const SplitHorizontalMode: React.FC<ModeRendererProps> = ({
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
  activeCardBadgeColor,
  inactiveCardTextColor,
  theme,
  highlightWords
}) => {
  const safeComps = otherComps.length > 0 ? otherComps : [
    { id: "fallback_1", type: "card", data: { text: "Phân cảnh so sánh" } },
    { id: "fallback_2", type: "card", data: { text: "Chi tiết phân tích" } }
  ];
  const leftComp = safeComps[0];
  const rightComp = safeComps[1] || safeComps[0];

  const itemStyleSettingLeft = t.items.itemStyles[0] || { fontSize: "30px", fontWeight: "900" };
  const itemStyleSettingRight = t.items.itemStyles[1] || { fontSize: "30px", fontWeight: "900" };

  const splitContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: gap !== undefined ? `${Math.min(gap, 16)}px` : "16px",
    width: "100%",
    maxWidth: "1000px",
    position: "relative",
    alignItems: "stretch",
    zIndex: 5
  };

  const vsBadgeStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 15,
    width: isVertical ? "56px" : "64px",
    height: isVertical ? "56px" : "64px",
    borderRadius: "999px",
    backgroundColor: "#020617",
    border: "1.5px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 0 30px rgba(0, 0, 0, 0.7), 0 0 12px rgba(255, 255, 255, 0.08)",
    display: "grid",
    placeItems: "center",
    fontSize: isVertical ? "18px" : "20px",
    fontWeight: 900,
    color: "#ffffff",
    fontFamily: styles.fontFamily
  };

  const renderSideCard = (comp: any, side: "left" | "right", itemStyleSetting: any, cardIdx: number) => {
    if (!comp) return null;
    const isLeft = side === "left";
    const isAccent = itemStyleSetting.useAccentBg;
    const sideAccentColor = isLeft ? (accentColor || "#EF4444") : "#EAB308";
    const rotation = t.items.rotations && t.items.rotations[cardIdx % t.items.rotations.length] !== undefined
      ? t.items.rotations[cardIdx % t.items.rotations.length]
      : (isLeft ? -2.2 : 2.2);
    const pos = resolvedPositions[cardIdx % resolvedPositions.length];

    const cardStyle: React.CSSProperties = {
      minHeight: isVertical ? "340px" : "400px",
      borderRadius: itemStyleSetting.borderRadius || "34px",
      padding: resolvePadding(itemStyleSetting.padding || "34px", paddingScale),
      transform: `rotate(${rotation}deg)`,
      background: isAccent
        ? `linear-gradient(135deg, ${sideAccentColor}, ${darkAccentColor})`
        : styles.cardStyle.background || styles.cardStyle.backgroundColor || "rgba(15, 23, 42, 0.75)",
      border: isAccent ? "none" : `1.5px solid ${sideAccentColor}77`,
      boxShadow: isAccent 
        ? "none" 
        : `0 16px 48px rgba(0, 0, 0, 0.4), 0 0 25px ${sideAccentColor}22`,
      backdropFilter: "blur(16px) saturate(1.15)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      textAlign: "left",
      boxSizing: "border-box"
    };

    const sideLabelStyle: React.CSSProperties = {
      fontSize: "14px",
      fontWeight: 900,
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: isAccent ? activeCardBadgeColor : sideAccentColor,
      fontFamily: styles.fontFamily
    };

    const rawText = comp.data?.text || "";
    const cleanText = cleanCardText(rawText);

    const animConfig = getAnimationConfig(comp, cardIdx, "scale-in", 0.4, t);
    return (
      <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
        <div style={cardStyle}>
          {pos && pos.nestedStructure ? (
            renderNestedCardContent({
              ns: pos.nestedStructure,
              comp,
              idx: cardIdx,
              isAccentCard: isAccent,
              parentDelay: animConfig.delay,
              otherComps,
              accentColor: sideAccentColor,
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
            <>
              <div style={sideLabelStyle}>
                {isLeft ? "SIDE 01" : "SIDE 02"}
              </div>
              <div style={{ display: "grid", gap: "16px", textTransform: "uppercase" }}>
                <div style={{
                  fontSize: getDynamicFontSize(cleanText, 36, fontScale),
                  fontWeight: 900,
                  color: isAccent ? activeCardTextColor : inactiveCardTextColor,
                  fontFamily: styles.fontFamily,
                  lineHeight: 1.2
                }}>
                  {highlightHeadingText(cleanText, sideAccentColor, theme, highlightWords)}
                </div>
              </div>
            </>
          )}
        </div>
      </AnimatedBlock>
    );
  };

  return (
    <div style={splitContainerStyle}>
      <div style={vsBadgeStyle}>VS</div>
      {renderSideCard(leftComp, "left", itemStyleSettingLeft, 0)}
      {renderSideCard(rightComp, "right", itemStyleSettingRight, 1)}
    </div>
  );
};

