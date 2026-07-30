import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";

export const IntroBriefingCardMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  titleText
}) => {
  // Extract content
  const mainTitle = titleText || "CODE RA VIDEO";
  
  // Split main title to extract labels dynamically (no colons/commas, uppercase)
  const cleanTitleWords = mainTitle
    .trim()
    .split(/\s+/)
    .map(w => w.replace(/[:.,!?]/g, "").toUpperCase())
    .filter(w => w.length > 0);

  const labelLeft = cleanTitleWords[0] || "AI";
  const labelRight = cleanTitleWords[1] || "CODE";
  const labelCard = cleanTitleWords[2] || "VIDEO";

  // Split main title into two lines for design parity inside the box
  const titleWords = mainTitle.split(" ");
  const titleLine1 = titleWords.slice(0, Math.ceil(titleWords.length / 2)).join(" ");
  const titleLine2 = titleWords.slice(Math.ceil(titleWords.length / 2)).join(" ");

  // Build pill data ONLY from real AI-generated points — no hardcoded fallbacks.
  // If fewer than 3 points exist, render fewer pills. Never fake content.
  const ICONS = ["zap", "arrow", "star"] as const;
  const pillData = otherComps.slice(0, 3).map((comp, i) => {
    if (!comp || !comp.data?.text?.trim()) return null;
    const words = comp.data.text.trim().split(/\s+/);
    const badge = words[0] || "";
    const text = words.slice(1).join(" ");
    return { badge, text, icon: ICONS[i] || "star" };
  }).filter(Boolean) as { badge: string; text: string; icon: "zap" | "arrow" | "star" }[];

  // Styles for the main card (now shorter because pills are moved outside)
  const wrapperCardStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    maxWidth: t.container?.maxWidth || "900px",
    minHeight: "480px",
    borderRadius: "38px",
    padding: resolvePadding("54px 36px 44px", paddingScale),
    background: styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || (isLight 
      ? "rgba(255, 255, 255, 0.85)"
      : "linear-gradient(rgba(2, 6, 23, 0.45), rgba(15, 23, 42, 0.28))"),
    border: styles?.cardStyle?.border || (isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255, 255, 255, 0.12)"),
    boxShadow: styles?.cardStyle?.boxShadow || (isLight 
      ? "0 28px 70px rgba(0,0,0,0.06)" 
      : "rgba(0, 0, 0, 0.24) 0px 30px 78px"),
    backdropFilter: "blur(14px) saturate(1.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "24px",
    boxSizing: "border-box",
    zIndex: 5,
    overflow: "hidden"
  };

  const watermarkStyle: React.CSSProperties = {
    position: "absolute",
    right: "34px",
    top: "52px",
    opacity: isLight ? 0.06 : 0.16,
    color: isLight ? "#000000" : "rgba(255, 255, 255, 0.12)",
    fontSize: "156px",
    lineHeight: 0.82,
    fontWeight: 900,
    letterSpacing: "-0.08em",
    textTransform: "uppercase",
    pointerEvents: "none",
    fontFamily: styles.fontFamily,
    zIndex: 1
  };

  const renderIcon = (type: string, isAccentPill: boolean) => {
    const iconColor = isAccentPill ? "#ffffff" : accentColor;
    if (type === "zap") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    }
    if (type === "arrow") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", maxWidth: "900px" }}>
      {/* 1. Main Briefing Card */}
      <AnimatedBlock animation="scale-in" delaySeconds={0.1}>
        <div style={wrapperCardStyle}>
          <div style={{
            position: "absolute",
            inset: 0,
            background: isLight 
              ? "radial-gradient(circle at 18% 18%, rgba(239, 68, 68, 0.04), transparent 24%)" 
              : `radial-gradient(circle at 18% 18%, rgba(${rgb}, 0.094), transparent 24%), radial-gradient(circle at 82% 76%, rgba(208, 89, 108, 0.094), transparent 30%)`,
            pointerEvents: "none",
            zIndex: 1
          }} />

          <div style={watermarkStyle}>AI</div>

          <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "18px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                borderRadius: "999px",
                padding: "10px 16px",
                background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(2, 6, 23, 0.74)",
                border: `1px solid rgba(${rgb}, 0.4)`,
                color: isLight ? "#1e293b" : "rgb(248, 250, 252)",
                fontSize: "16px",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                backdropFilter: "blur(14px)"
              }}>
                <span style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: accentColor,
                  boxShadow: `rgba(${rgb}, 0.6) 0px 0px 18px`
                }} />
                {labelLeft}
              </div>
              <div style={{
                color: isLight ? "rgba(0, 0, 0, 0.58)" : "rgba(255, 255, 255, 0.58)",
                fontSize: "15px",
                fontWeight: 900,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontFamily: styles.fontFamily
              }}>
                {labelRight}
              </div>
            </div>

            {/* Central block */}
            <div style={{
              borderRadius: "30px",
              padding: "38px 32px 40px",
              background: isLight 
                ? "rgba(0, 0, 0, 0.02)"
                : "linear-gradient(rgba(2, 6, 23, 0.5), rgba(15, 23, 42, 0.34))",
              border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255, 255, 255, 0.12)",
              boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.02)" : "rgba(0, 0, 0, 0.24) 0px 30px 78px",
              backdropFilter: "blur(12px)",
              display: "grid",
              gap: "24px"
            }}>
              <div style={{
                width: "fit-content",
                borderRadius: "12px",
                padding: "9px 12px",
                background: `rgba(${rgb}, 0.15)`,
                border: `1px solid ${accentColor}`,
                color: accentColor,
                fontSize: "14px",
                fontWeight: 900,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontFamily: styles.fontFamily
              }}>
                {labelCard}
              </div>

              <div style={{
                display: "grid",
                gap: "8px",
                textTransform: "uppercase",
                width: "100%",
                borderRadius: "24px",
                padding: "24px 22px",
                border: `2px solid rgba(${rgb}, 0.5)`,
                boxShadow: isLight 
                  ? "rgba(0, 0, 0, 0.05) 0px 10px 30px" 
                  : `rgba(0, 0, 0, 0.34) 0px 24px 62px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px, rgba(${rgb}, 0.125) 0px 0px 34px`,
                background: isLight ? "rgba(255, 255, 255, 0.7)" : "rgba(2, 6, 23, 0.2)"
              }}>
                <div style={{
                  fontSize: `${Math.round(100 * fontScale)}px`,
                  lineHeight: 1.02,
                  fontWeight: 900,
                  letterSpacing: "-0.07em",
                  color: isLight ? "#1e293b" : "rgb(248, 250, 252)",
                  fontFamily: styles.fontFamily,
                  textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.35) 0px 20px 48px, rgba(${rgb}, 0.125) 0px 0px 28px`
                }}>
                  {titleLine1}
                </div>
                {titleLine2 && (
                  <div style={{
                    fontSize: `${Math.round(86 * fontScale)}px`,
                    lineHeight: 1.02,
                    fontWeight: 900,
                    letterSpacing: "-0.07em",
                    color: accentColor,
                    fontFamily: styles.fontFamily,
                    textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.35) 0px 20px 48px, rgba(${rgb}, 0.125) 0px 0px 28px`
                  }}>
                    {titleLine2}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AnimatedBlock>

      {/* 2. List of 3 pills rendered OUTSIDE of the main briefing card */}
      <div style={{ display: "grid", gap: "12px", width: "100%" }}>
        {pillData.map((pill, idx) => {
          const comp = otherComps[idx];
          const animCfg = comp
            ? getAnimationConfig(comp, idx, "slide-up", 0.4 + idx * 0.1, t)
            : { animation: "slide-up" as const, delay: 0.4 + idx * 0.1 };

          const pillAccent = idx === pillData.length - 1; // Last REAL item is the highlighted one

          let bgStyle = "";
          let borderStyle = "";
          let textColor = "";
          let badgeColor = "";

          if (pillAccent) {
            // Primary Highlight Card: fully colored with accent colors
            bgStyle = `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`;
            borderStyle = `1px solid ${accentColor}`;
            textColor = "#ffffff";
            badgeColor = "rgba(255, 255, 255, 0.8)";
          } else {
            // Subtle theme card using opacity variants of theme rgb
            bgStyle = isLight 
              ? `rgba(${rgb}, 0.04)`
              : "rgba(2, 6, 23, 0.42)";
            borderStyle = isLight
              ? `1px solid rgba(${rgb}, 0.12)`
              : `1px solid rgba(${rgb}, 0.24)`;
            textColor = isLight ? "#1e293b" : "rgb(248, 250, 252)";
            badgeColor = accentColor;
          }

          return (
            <AnimatedBlock key={idx} animation={animCfg.animation} delaySeconds={animCfg.delay}>
              <div style={{
                minHeight: "84px",
                borderRadius: "20px",
                padding: "16px 20px",
                background: bgStyle,
                border: borderStyle,
                display: "grid",
                gridTemplateColumns: "58px 1fr",
                alignItems: "center",
                gap: "18px",
                backdropFilter: "blur(10px)",
                boxShadow: isLight 
                  ? "none" 
                  : (pillAccent ? `rgba(0, 0, 0, 0.22) 0px 16px 38px, rgba(${rgb}, 0.18) 0px 0px 24px` : `rgba(0, 0, 0, 0.16) 0px 14px 34px`)
              }}>
                {/* Icon container */}
                <div style={{
                  width: "58px",
                  height: "58px",
                  borderRadius: "16px",
                  background: pillAccent
                    ? "rgba(255, 255, 255, 0.2)"
                    : (isLight ? `rgba(${rgb}, 0.06)` : `rgba(${rgb}, 0.133)`),
                  border: pillAccent
                    ? "1px solid rgba(255, 255, 255, 0.4)"
                    : `1px solid rgba(${rgb}, 0.3)`,
                  display: "grid",
                  placeItems: "center"
                }}>
                  {renderIcon(pill.icon, pillAccent)}
                </div>

                {/* Text container */}
                <div style={{
                  color: textColor,
                  fontSize: `${Math.round(38 * fontScale)}px`,
                  lineHeight: 1.45,
                  fontWeight: pillAccent ? 900 : 840,
                  letterSpacing: "-0.04em",
                  textTransform: "uppercase",
                  fontFamily: styles.fontFamily
                }}>
                  <span style={{ 
                    color: badgeColor, 
                    textShadow: (isLight || pillAccent) ? "none" : `rgba(${rgb}, 0.21) 0px 0px 18px` 
                  }}>
                    {pill.badge}
                  </span>
                  <span> {pill.text}</span>
                </div>
              </div>
            </AnimatedBlock>
          );
        })}
      </div>
    </div>
  );
};
