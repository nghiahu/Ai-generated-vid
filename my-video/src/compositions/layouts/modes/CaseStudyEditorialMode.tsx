import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const CaseStudyEditorialMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  voiceover,
  titleText,
  gap,
  theme,
  highlightWords
}) => {
  // Real content from AI-generated points (already filtered of empty items upstream)
  const beforeText = otherComps[0]?.data?.text?.trim() || "";
  const afterText = otherComps[1]?.data?.text?.trim() || "";
  const noteText = otherComps[2]?.data?.text?.trim() || "";

  // titleText = scene.heading (AI-generated). Never fall back to ns.titleText (design placeholder).
  const cardTitle = titleText?.trim() || "";
  const descText = voiceover?.trim() || (otherComps[3]?.data?.text?.trim() ?? "");

  const yellowColor = "#FDE68A";
  const yellowRgb = "253, 230, 138";

  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: t.container.maxWidth || "860px",
    gap: gap !== undefined ? `${Math.min(gap, 20)}px` : "20px",
    zIndex: 5
  };

  // Row heights and card paddings
  const itemStyleSetting = t.items.itemStyles[0] || {};
  const borderRadius = itemStyleSetting.borderRadius || "28px";
  const padding = resolvePadding(itemStyleSetting.padding || "28px 28px 24px", paddingScale);

  const topCardStyle: React.CSSProperties = {
    display: "grid",
    gap: "18px",
    borderRadius: borderRadius,
    padding: padding,
    background: isLight 
      ? "rgba(255, 255, 255, 0.72)"
      : "linear-gradient(rgba(15, 23, 42, 0.34), rgba(2, 6, 23, 0.18))",
    border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: `rgba(0, 0, 0, 0.2) 0px 24px 58px`,
    backdropFilter: "blur(8px) saturate(1.08)",
    boxSizing: "border-box",
    width: "100%"
  };

  const bottomCardStyle: React.CSSProperties = {
    borderRadius: "26px",
    padding: resolvePadding("24px 26px", paddingScale),
    background: isLight
      ? "rgba(255, 255, 255, 0.85)"
      : "linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))",
    border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(7px) saturate(1.06)",
    boxShadow: `rgba(0, 0, 0, 0.2) 0px 24px 58px`,
    display: "grid",
    gridTemplateColumns: "220px minmax(0px, 1fr)",
    gap: "24px",
    alignItems: "center",
    boxSizing: "border-box",
    width: "100%"
  };

  // Animation delay calculations
  const beforeAnim = getAnimationConfig({ data: {} }, 0, "slide-up", 0.3, t);
  const afterAnim = getAnimationConfig({ data: {} }, 1, "slide-up", 0.5, t);
  const noteAnim = getAnimationConfig({ data: {} }, 2, "slide-up", 0.7, t);
  const bottomAnim = getAnimationConfig({ data: {} }, 3, "scale-in", 0.9, t);

  return (
    <div style={containerStyle}>
      {/* Top Stacked Card */}
      <div style={topCardStyle}>
        {/* BEFORE Row */}
        {otherComps[0] && (
          <AnimatedBlock animation={beforeAnim.animation} delaySeconds={beforeAnim.delay}>
            <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr)", gap: "18px", alignItems: "stretch" }}>
              {/* Left Yellow Badge */}
              <div style={{
                borderRadius: "18px",
                padding: "18px 16px",
                background: isLight ? `rgba(${yellowRgb}, 0.25)` : `rgba(${yellowRgb}, 0.094)`,
                border: isLight ? `1px solid rgba(${yellowRgb}, 0.45)` : `1px solid rgba(${yellowRgb}, 0.25)`,
                display: "grid",
                alignContent: "space-between",
                minHeight: "130px",
                boxSizing: "border-box"
              }}>
                <div style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: isLight ? "#b45309" : yellowColor }}>
                  Before
                </div>
                <div style={{ fontSize: "44px", lineHeight: 1, fontWeight: 900, color: isLight ? "#b45309" : yellowColor }}>
                  1
                </div>
              </div>
              {/* Right content box */}
              <div style={{
                borderRadius: "22px",
                padding: "24px",
                background: isLight ? `rgba(${yellowRgb}, 0.08)` : "rgba(255, 255, 255, 0.03)",
                borderLeft: `6px solid ${isLight ? "#b45309" : yellowColor}`,
                boxShadow: isLight ? "none" : `rgba(${yellowRgb}, 0.086) 0px 0px 0px 1px inset`,
                display: "grid",
                alignItems: "center",
                minHeight: "130px",
                boxSizing: "border-box",
                textAlign: "left"
              }}>
                <div style={{
                  fontSize: `${Math.round(30 * fontScale)}px`,
                  fontWeight: 760,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  color: isLight ? "#1e293b" : "rgb(249, 247, 255)"
                }}>
                  {beforeText}
                </div>
              </div>
            </div>
          </AnimatedBlock>
        )}

        {/* AFTER Row */}
        {otherComps[1] && (
          <AnimatedBlock animation={afterAnim.animation} delaySeconds={afterAnim.delay}>
            <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0px, 1fr)", gap: "18px", alignItems: "stretch" }}>
              {/* Left Accent Badge */}
              <div style={{
                borderRadius: "18px",
                padding: "18px 16px",
                background: isLight ? `rgba(${rgb}, 0.08)` : `rgba(${rgb}, 0.094)`,
                border: isLight ? `1px solid rgba(${rgb}, 0.25)` : `1px solid rgba(${rgb}, 0.25)`,
                display: "grid",
                alignContent: "space-between",
                minHeight: "130px",
                boxSizing: "border-box"
              }}>
                <div style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: accentColor }}>
                  After
                </div>
                <div style={{ fontSize: "44px", lineHeight: 1, fontWeight: 900, color: accentColor }}>
                  2
                </div>
              </div>
              {/* Right content box */}
              <div style={{
                borderRadius: "22px",
                padding: "24px",
                background: isLight ? `rgba(${rgb}, 0.04)` : "rgba(255, 255, 255, 0.03)",
                borderLeft: `6px solid ${accentColor}`,
                boxShadow: isLight ? "none" : `rgba(${rgb}, 0.086) 0px 0px 0px 1px inset`,
                display: "grid",
                alignItems: "center",
                minHeight: "130px",
                boxSizing: "border-box",
                textAlign: "left"
              }}>
                <div style={{
                  fontSize: `${Math.round(30 * fontScale)}px`,
                  fontWeight: 760,
                  lineHeight: 1.15,
                  letterSpacing: "-0.03em",
                  color: isLight ? "#1e293b" : "rgb(249, 247, 255)"
                }}>
                  {afterText}
                </div>
              </div>
            </div>
          </AnimatedBlock>
        )}

        {/* NOTE Row */}
        {otherComps[2] && (
          <AnimatedBlock animation={noteAnim.animation} delaySeconds={noteAnim.delay}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0px, 1fr))", gap: "14px", textAlign: "left" }}>
              <div style={{
                minHeight: "100px",
                borderRadius: "18px",
                padding: "18px",
                background: isLight ? `rgba(${rgb}, 0.05)` : `rgba(${rgb}, 0.08)`,
                border: isLight ? `1px solid rgba(${rgb}, 0.22)` : `1px solid rgba(${rgb}, 0.333)`,
                display: "grid",
                alignContent: "space-between",
                gap: "10px",
                boxSizing: "border-box"
              }}>
                <div style={{ fontSize: "14px", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: isLight ? "#64748b" : "rgba(249, 247, 255, 0.45)" }}>
                  Note
                </div>
                <div style={{ fontSize: `${Math.round(24 * fontScale)}px`, lineHeight: 1.16, fontWeight: 680, color: isLight ? "#334155" : "rgba(249, 247, 255, 0.87)" }}>
                  {noteText}
                </div>
              </div>
            </div>
          </AnimatedBlock>
        )}
      </div>

      {/* Bottom CASE STUDY Card */}
      <AnimatedBlock animation={bottomAnim.animation} delaySeconds={bottomAnim.delay}>
        <div style={bottomCardStyle}>
          {/* Left Case Info */}
          <div style={{ display: "grid", gap: "12px", justifyItems: "start", textAlign: "left" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "0.28em", textTransform: "uppercase", color: accentColor }}>
              Case File
            </div>
            <div style={{ width: "72px", height: "5px", borderRadius: "999px", background: accentColor, boxShadow: `rgba(${rgb}, 0.4) 0px 0px 18px` }} />
            <div style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: isLight ? "#64748b" : "rgba(249, 247, 255, 0.5)" }}>
              Case Study
            </div>
          </div>
          {/* Right Case Content */}
          <div style={{ display: "grid", gap: "10px", textAlign: "left" }}>
            <div style={{ fontSize: `${Math.round(36 * fontScale)}px`, lineHeight: 1.1, fontWeight: 900, letterSpacing: "-0.04em", color: isLight ? "#0f172a" : "#ffffff", textTransform: "uppercase" }}>
              {highlightHeadingText(cardTitle, accentColor, theme, highlightWords)}
            </div>
            {descText && (
              <div style={{ fontSize: `${Math.round(20 * fontScale)}px`, lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.35, color: isLight ? "#334155" : "rgba(249, 247, 255, 0.8)" }}>
                {descText}
              </div>
            )}
          </div>
        </div>
      </AnimatedBlock>
    </div>
  );
};
