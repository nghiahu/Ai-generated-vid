import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding } from "./LayoutNestedRenderers";

function parseNumbers(valueStr: string): { n1: number; n2: number | null; suffix: string } {
  if (!valueStr) return { n1: 0, n2: null, suffix: "" };
  
  // Look for range "X - Y" or "X-Y" (with decimals/dots)
  const rangeRegex = /(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)/;
  const match = valueStr.match(rangeRegex);
  
  if (match) {
    const rawN1 = parseFloat(match[1].replace(/\./g, "").replace(/,/g, "."));
    const rawN2 = parseFloat(match[2].replace(/\./g, "").replace(/,/g, "."));
    const suffix = valueStr.replace(match[0], "").trim();
    return {
      n1: isNaN(rawN1) ? 0 : rawN1,
      n2: isNaN(rawN2) ? 0 : rawN2,
      suffix
    };
  }
  
  // Single number case
  const singleRegex = /(\d+(?:[.,]\d+)?)/;
  const singleMatch = valueStr.match(singleRegex);
  if (singleMatch) {
    const rawN = parseFloat(singleMatch[1].replace(/\./g, "").replace(/,/g, "."));
    const suffix = valueStr.replace(singleMatch[0], "").trim();
    return {
      n1: isNaN(rawN) ? 0 : rawN,
      n2: null,
      suffix
    };
  }
  
  return { n1: 0, n2: null, suffix: valueStr };
}

export const MetricShowcaseHookMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  titleText
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find components based on their parsed role
  const badgeComp = otherComps.find(c => c.data?.type === "badge_row" || c.type === "badge_row");
  const highlightComp = otherComps.find(c => c.data?.type === "subheader" || c.type === "subheader");
  const metricComp = otherComps.find(c => c.data?.type === "metric" || c.type === "metric");
  const cardComp = otherComps.find(c => c.data?.type === "card" || c.type === "card");
  const terminalComp = otherComps.find(c => c.data?.type === "terminal" || c.type === "terminal");

  // Animations start config
  const countStart = Math.round(0.8 * fps);
  
  const rawValue = metricComp?.data?.value || "";
  const { n1, n2, suffix } = parseNumbers(rawValue);

  // Number counting interpolation
  const animN1 = Math.round(interpolate(frame - countStart, [0, 30], [0, n1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  }));

  const animN2 = n2 !== null ? Math.round(interpolate(frame - countStart, [0, 30], [0, n2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  })) : null;

  const cardStyle: React.CSSProperties = {
    borderRadius: "38px",
    background: isLight
      ? "rgba(255, 255, 255, 0.9)"
      : "linear-gradient(rgba(24, 18, 8, 0.45), rgba(2, 6, 23, 0.28))",
    border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.22)",
    boxShadow: isLight
      ? "0 28px 70px rgba(0,0,0,0.08)"
      : `rgba(0,0,0,0.24) 0px 28px 70px, rgba(255,255,255,0.06) 0px 0px 0px 1px inset, rgba(${rgb},0.094) 0px 0px 34px`,
    backdropFilter: "blur(8px) saturate(1.08)",
    padding: resolvePadding("42px 46px 36px", paddingScale),
    width: "100%",
    maxWidth: t.container?.maxWidth || "940px",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    boxSizing: "border-box",
    zIndex: 5
  };

  return (
    <AnimatedBlock animation="scale-in" delaySeconds={0.1}>
      <div style={cardStyle}>
        {/* Title / Heading */}
        {titleText && (
          <div style={{
            fontSize: `${Math.round(84 * fontScale)}px`,
            lineHeight: 1.1,
            fontWeight: 950,
            letterSpacing: "-0.05em",
            textAlign: "center",
            color: isLight ? "#1e293b" : "rgb(248,250,252)",
            fontFamily: styles.fontFamily,
            textShadow: isLight ? "none" : `0 4px 16px rgba(${rgb}, 0.2)`
          }}>
            {titleText}
          </div>
        )}

        {/* Badges */}
        {badgeComp && badgeComp.data?.badges && (
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {badgeComp.data.badges.map((badge: string, idx: number) => (
              <span key={idx} style={{
                borderRadius: "20px",
                padding: "8px 16px",
                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)"}`,
                color: accentColor,
                fontWeight: 700,
                fontSize: "18px",
                fontFamily: styles.fontFamily
              }}>
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Subheader / Highlight Alert Bar */}
        {highlightComp && (
          <div style={{
            alignSelf: "center",
            borderRadius: "16px",
            border: `1px solid ${accentColor}`,
            boxShadow: `0 0 15px rgba(${rgb}, 0.25)`,
            padding: "12px 24px",
            background: `rgba(${rgb}, 0.04)`,
            color: isLight ? "#1e293b" : "rgb(248,250,252)",
            fontSize: "20px",
            fontWeight: 700,
            textAlign: "center",
            fontFamily: styles.fontFamily
          }}>
            🔥 {highlightComp.data.text}
          </div>
        )}

        {/* Metric Area */}
        {metricComp && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "10px 0" }}>
            <div style={{
              fontSize: `${Math.round(108 * fontScale)}px`,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.07em",
              color: accentColor,
              fontFamily: styles.fontFamily,
              display: "flex",
              alignItems: "baseline",
              gap: "10px"
            }}>
              {/* Values */}
              <span>
                {n2 !== null ? `${animN1.toLocaleString("vi-VN")} - ${animN2.toLocaleString("vi-VN")}` : animN1.toLocaleString("vi-VN")}
              </span>
              {suffix && (
                <span style={{
                  fontSize: `${Math.round(48 * fontScale)}px`,
                  fontWeight: 800,
                  color: isLight ? "#475569" : "#94a3b8",
                  letterSpacing: "normal",
                  marginLeft: "8px"
                }}>
                  {suffix}
                </span>
              )}
            </div>
            {metricComp.data?.subtext && (
              <div style={{
                fontSize: "20px",
                fontWeight: 800,
                color: isLight ? "#64748b" : "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                marginTop: "12px",
                fontFamily: styles.fontFamily
              }}>
                {metricComp.data.subtext}
              </div>
            )}
          </div>
        )}

        {/* Card Component */}
        {cardComp && (
          <div style={{
            borderRadius: "24px",
            padding: "24px",
            background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
            border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.12)",
            boxShadow: "rgba(0,0,0,0.12) 0px 10px 24px",
            color: isLight ? "#334155" : "#e2e8f0",
            fontSize: "22px",
            fontWeight: 700,
            fontFamily: styles.fontFamily,
            lineHeight: 1.3
          }}>
            💡 {cardComp.data.text}
          </div>
        )}

        {/* Terminal Command Prompt */}
        {terminalComp && (
          <div style={{
            borderRadius: "14px",
            padding: "16px 20px",
            background: "#090d16",
            border: "1px solid #1e293b",
            fontFamily: "monospace",
            fontSize: "18px",
            color: "#38bdf8",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
            boxSizing: "border-box"
          }}>
            <span style={{ color: "#f43f5e" }}>$</span>
            <span>{terminalComp.data.text}</span>
          </div>
        )}
      </div>
    </AnimatedBlock>
  );
};
