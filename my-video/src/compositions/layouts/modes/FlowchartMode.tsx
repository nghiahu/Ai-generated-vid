import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig, getDynamicFontSize } from "./LayoutNestedRenderers";

export const FlowchartMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  gap
}) => {
  // Use first 3 otherComps for the flowchart
  const items = otherComps.slice(0, 3);
  
  const containerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${Math.max(1, items.length)}, minmax(0, 1fr))`,
    gap: gap !== undefined ? `${gap}px` : "14px",
    width: "100%",
    maxWidth: t.container?.maxWidth || "960px",
    zIndex: 5,
    boxSizing: "border-box"
  };

  return (
    <div style={containerStyle}>
      {items.map((comp, idx) => {
        const itemStyleSetting = t.items?.itemStyles?.[idx] || t.items?.itemStyles?.[0] || {};
        const rotation = t.items?.rotations?.[idx] || 0;
        
        const isAccent = itemStyleSetting.useAccentBg;
        
        // Define card style matching the HTML template's look
        const cardStyle: React.CSSProperties = {
          minHeight: "170px",
          borderRadius: itemStyleSetting.borderRadius || "24px",
          padding: resolvePadding(itemStyleSetting.padding || "20px 18px", paddingScale),
          transform: `rotate(${rotation}deg) scale(${itemStyleSetting.scale || 1.0})`,
          transformOrigin: "center center",
          background: isAccent
            ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
            : (isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.03)"),
          border: isAccent
            ? `1px solid ${accentColor}`
            : `1px solid rgba(${rgb}, 0.2)`,
          boxShadow: isAccent
            ? `rgba(${rgb}, 0.15) 0px 0px 24px`
            : `rgba(${rgb}, 0.07) 0px 0px 0px 1px inset`,
          backdropFilter: `blur(${itemStyleSetting.backdropBlur || "6px"}) saturate(1.06)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: "12px",
          textAlign: "left",
          boxSizing: "border-box",
          position: "relative",
          transition: "transform 0.2s ease"
        };

        const animConfig = getAnimationConfig(comp, idx, "scale-in", 0.2, t);
        
        // Text configuration
        const text = comp.data.text || "";
        const customFontSize = itemStyleSetting.fontSize || "26px";
        const fontSizePx = parseInt(customFontSize, 10);
        const resolvedFontSize = getDynamicFontSize(text, isNaN(fontSizePx) ? 26 : fontSizePx, fontScale);

        // Standardized padding format like "01"
        const indexStr = String(idx + 1).padStart(2, "0");

        return (
          <AnimatedBlock
            key={idx}
            animation={animConfig.animation}
            delaySeconds={animConfig.delay}
          >
            <div style={cardStyle}>
              {/* Step indicator header */}
              <div style={{ display: "grid", gap: "6px" }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                  color: isAccent ? (isLight ? "#ffffff" : "#fca5a5") : accentColor,
                  fontFamily: styles.fontFamily
                }}>
                  {indexStr}
                </div>
                {/* Thin divider line */}
                <div style={{
                  width: "28px",
                  height: "2px",
                  background: isAccent ? "rgba(255,255,255,0.4)" : `rgba(${rgb}, 0.3)`
                }} />
              </div>
              
              {/* Main text content */}
              <div style={{
                fontSize: resolvedFontSize,
                lineHeight: 1.15,
                fontWeight: itemStyleSetting.fontWeight || (isAccent ? 820 : 720),
                color: isAccent 
                  ? "#ffffff" 
                  : (isLight ? "#1e293b" : "rgb(245, 243, 255)"),
                fontFamily: styles.fontFamily,
                marginTop: "4px",
                wordBreak: "break-word"
              }}>
                {text}
              </div>
            </div>
          </AnimatedBlock>
        );
      })}
    </div>
  );
};
