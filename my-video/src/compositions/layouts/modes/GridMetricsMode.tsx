import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig 
} from "./LayoutNestedRenderers";

export const GridMetricsMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  gap,
  activeCardTextColor,
  inactiveCardTextColor
}) => {
  const visibleComps = otherComps.slice(0, 4); // Limit dashboard to max 4 cards

  const gridContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: gap !== undefined ? `${gap}px` : (t.container.gap || "20px"),
    width: "100%",
    maxWidth: t.container.maxWidth || "860px",
    zIndex: 5
  };

  const activeCardDescColor = isLight ? "rgba(0, 0, 0, 0.72)" : "rgba(255, 255, 255, 0.85)";

  return (
    <div style={gridContainerStyle}>
      {visibleComps.map((comp, idx) => {
        const itemStyleSetting = t.items.itemStyles[idx % t.items.itemStyles.length] || { fontSize: "28px", fontWeight: "700" };
        const isAccentMetric = itemStyleSetting.useAccentBg;

        const cardStyle: React.CSSProperties = {
          borderRadius: itemStyleSetting.borderRadius || "28px",
          padding: resolvePadding(itemStyleSetting.padding || "28px", paddingScale),
          background: isAccentMetric
            ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
            : isLight
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(255, 255, 255, 0.05)",
          border: isAccentMetric ? "none" : `1px solid rgba(${rgb}, 0.26)`,
          boxShadow: `0 18px 44px rgba(0, 0, 0, 0.2)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          minHeight: "180px",
          boxSizing: "border-box"
        };

        const valueStyle: React.CSSProperties = {
          fontSize: `${Math.round(48 * fontScale)}px`,
          fontWeight: 900,
          color: isAccentMetric ? activeCardTextColor : accentColor,
          fontFamily: styles.fontFamily,
          lineHeight: 1.0
        };

        const labelStyle: React.CSSProperties = {
          fontSize: getDynamicFontSize(comp.data.text, 22, fontScale),
          fontWeight: itemStyleSetting.fontWeight || "800",
          color: isAccentMetric ? activeCardDescColor : inactiveCardTextColor,
          fontFamily: styles.fontFamily,
          textTransform: "uppercase",
          lineHeight: 1.1
        };

        const animConfig = getAnimationConfig(comp, idx, "scale-in", 0.2 * idx, t);
        return (
          <AnimatedBlock key={comp.id || idx} animation={animConfig.animation} delaySeconds={animConfig.delay}>
            <div style={cardStyle}>
              <div style={valueStyle}>
                {comp.data.value || `0${idx + 1}`}
              </div>
              <div style={labelStyle}>
                {comp.data.text}
              </div>
            </div>
          </AnimatedBlock>
        );
      })}
    </div>
  );
};
