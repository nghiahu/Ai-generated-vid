import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";

export const CircularProgressMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  isLight,
  styles,
  gap
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Extract circle progress value and label from Point #1
  const metricComp = otherComps[0];
  const metricValueText = String(metricComp?.data?.value || metricComp?.data?.text || "0");
  const parsedValue = parseInt(metricValueText.replace(/[^\d]/g, ""), 10);
  const targetValue = isNaN(parsedValue) ? 0 : Math.min(100, Math.max(0, parsedValue));
  const metricLabel = metricComp?.data?.text || "";

  // 2. Extract remaining comps for cards underneath
  const cardComps = otherComps.slice(1, 4);

  // 3. SVG Circle Math
  const R = 70;
  const C = 2 * Math.PI * R; // ~439.82

  const startFrame = Math.round(0.3 * fps);
  const durationFrames = Math.round(1.0 * fps);

  // Smooth ease-out-quint animation for circle and text counter
  const progress = interpolate(frame - startFrame, [0, durationFrames], [0, targetValue], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 1, 0.5, 1),
  });

  const strokeDashoffset = C * (1 - progress / 100);

  // Container styling
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: t.container?.maxWidth || "960px",
    zIndex: 5,
  };

  const circleSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    marginBottom: "20px",
  };

  const numberOverlayStyle: React.CSSProperties = {
    position: "absolute",
    top: "35%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "58px",
    fontWeight: 950,
    color: accentColor,
    fontFamily: styles.fontFamily,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "24px",
    fontWeight: 800,
    color: isLight ? "#1f2937" : "#ffffff",
    fontFamily: styles.fontFamily,
    marginTop: "16px",
    textAlign: "center",
    maxWidth: "500px",
    lineHeight: 1.3,
  };

  const cardsContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    gap: gap !== undefined ? `${gap}px` : (t.container?.gap || "24px"),
    width: "100%",
    justifyContent: "center",
    marginTop: "24px",
  };

  const cardStyle: React.CSSProperties = {
    flex: 1,
    borderRadius: "24px",
    padding: "24px",
    background: isLight
      ? "rgba(255, 255, 255, 0.88)"
      : "rgba(255, 255, 255, 0.05)",
    border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)"}`,
    boxShadow: `0 14px 34px rgba(0, 0, 0, 0.15)`,
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxSizing: "border-box",
    minHeight: "140px",
  };

  const badgeStyle: React.CSSProperties = {
    fontSize: "16px",
    fontWeight: 900,
    color: accentColor,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    fontFamily: styles.fontFamily,
  };

  const textStyle: React.CSSProperties = {
    fontSize: "20px",
    fontWeight: 800,
    color: isLight ? "#1f2937" : "#ffffff",
    lineHeight: 1.3,
    fontFamily: styles.fontFamily,
  };

  const animCircleConfig = metricComp
    ? getAnimationConfig(metricComp, 0, "scale-in", 0, t)
    : { animation: "scale-in", delay: 0.1 };

  return (
    <div style={containerStyle}>
      <AnimatedBlock animation={animCircleConfig.animation} delaySeconds={0.1}>
        <div style={circleSectionStyle}>
          <div style={{ position: "relative", width: "200px", height: "200px" }}>
            <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)"}
                strokeWidth="14"
              />
              {/* Glowing animated progress */}
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={accentColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div style={numberOverlayStyle}>
              {Math.round(progress)}%
            </div>
          </div>
          <div style={labelStyle}>{metricLabel}</div>
        </div>
      </AnimatedBlock>

      {/* Cards underneath */}
      {cardComps.length > 0 && (
        <div style={cardsContainerStyle}>
          {cardComps.map((comp, idx) => {
            const animCardConfig = getAnimationConfig(comp, idx, "slide-up", 1.2 + 0.3 * idx, t);
            return (
              <AnimatedBlock key={comp.id || idx} animation={animCardConfig.animation} delaySeconds={animCardConfig.delay}>
                <div style={cardStyle}>
                  <div style={badgeStyle}>CHỈ TIÊU {String(idx + 1).padStart(2, "0")}</div>
                  <div style={textStyle}>{comp?.data?.text || ""}</div>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      )}
    </div>
  );
};
