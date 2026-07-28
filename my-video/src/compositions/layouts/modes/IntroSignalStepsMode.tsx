import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig, getDynamicFontSize } from "./LayoutNestedRenderers";

export const IntroSignalStepsMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale
}) => {
  const frame = useCurrentFrame();

  const validItems = otherComps
    .slice(0, 3)
    .map((comp) => {
      if (!comp || !comp.data?.text?.trim()) return null;
      return {
        text: comp.data.text.trim(),
        comp
      };
    })
    .filter(Boolean) as { text: string; comp: any }[];

  // Total rail height for SVG line connecting badges
  const railLength = 230;
  const railProgress = interpolate(frame, [15, 65], [railLength, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "880px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        alignSelf: "center",
        zIndex: 5,
        boxSizing: "border-box",
        padding: "10px 0"
      }}
    >
      {/* SVG Vertical Signal Rail Connecting Badges */}
      <svg
        style={{
          position: "absolute",
          left: "28px",
          top: "40px",
          width: "10px",
          height: `${railLength}px`,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "visible"
        }}
      >
        {/* Background Track Line */}
        <line
          x1="5"
          y1="0"
          x2="5"
          y2={railLength}
          stroke={`rgba(${rgb}, 0.2)`}
          strokeWidth="3.5"
        />
        {/* Animated Signal Rail Beam */}
        <line
          x1="5"
          y1="0"
          x2="5"
          y2={railLength}
          stroke={accentColor}
          strokeWidth="4"
          strokeDasharray={railLength}
          strokeDashoffset={railProgress}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
        />
      </svg>

      {/* Staggered Step Items (01, 02, 03) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          position: "relative",
          zIndex: 2
        }}
      >
        {validItems.map((item, idx) => {
          const badgeNum = `0${idx + 1}`;
          const isFirst = idx === 0;
          const isSecond = idx === 1;
          const isThird = idx === 2;

          const animConfig = item.comp
            ? getAnimationConfig(item.comp, idx, "scale-in", 0.2 + idx * 0.15, t)
            : { animation: "scale-in" as const, delay: 0.2 + idx * 0.15 };

          const badgeBg = isFirst
            ? accentColor
            : isSecond
              ? (isLight ? "rgba(15, 23, 42, 0.88)" : "rgba(30, 41, 59, 0.95)")
              : (isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(8, 17, 37, 0.95)");

          const badgeBorder = isThird
            ? `3px solid ${accentColor}`
            : `2.5px solid ${isFirst ? "#ffffff" : `rgba(${rgb}, 0.4)`}`;

          const badgeTextColor = isFirst
            ? "#ffffff"
            : isThird
              ? accentColor
              : "#ffffff";

          const cardBg = isFirst
            ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
            : isSecond
              ? (isLight
                ? "rgba(15, 23, 42, 0.92)"
                : "rgba(15, 23, 42, 0.85)")
              : (isLight
                ? "rgba(255, 255, 255, 0.92)"
                : "rgba(8, 17, 37, 0.88)");

          const cardBorder = isFirst
            ? "none"
            : isSecond
              ? `2px solid rgba(${rgb}, 0.35)`
              : `2.5px solid ${accentColor}`;

          const cardShadow = isFirst
            ? `0 14px 36px rgba(${rgb}, 0.4), 0 0 18px rgba(${rgb}, 0.25)`
            : isThird
              ? `0 0 28px rgba(${rgb}, 0.35)`
              : "0 10px 28px rgba(0, 0, 0, 0.2)";

          const textColor = isFirst || isSecond ? "#ffffff" : (isLight ? "#0f172a" : "#ffffff");

          // Dynamic font size fitting to guarantee clean single/double line fit
          const dynamicFontSize = getDynamicFontSize(item.text, 24, fontScale);

          return (
            <div
              key={idx}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "16px",
                paddingLeft: isSecond ? "48px" : "0px",
                width: "100%",
                boxSizing: "border-box"
              }}
            >
              <AnimatedBlock
                animation={animConfig.animation}
                delaySeconds={animConfig.delay}
                style={{ width: "100%" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "16px",
                    width: "100%"
                  }}
                >
                  {/* Step Badge Circle */}
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: badgeBg,
                      border: badgeBorder,
                      boxShadow: isFirst ? `0 0 20px ${accentColor}` : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      fontWeight: 900,
                      color: badgeTextColor,
                      fontFamily: styles.fontFamily,
                      flexShrink: 0,
                      zIndex: 3
                    }}
                  >
                    {badgeNum}
                  </div>

                  {/* Step Card Content - Fixed Uniform Height & Width */}
                  <div
                    style={{
                      flex: 1,
                      minHeight: "88px",
                      borderRadius: "20px",
                      padding: resolvePadding("20px 28px", paddingScale),
                      background: cardBg,
                      border: cardBorder,
                      boxShadow: cardShadow,
                      backdropFilter: "blur(16px)",
                      display: "flex",
                      alignItems: "center",
                      boxSizing: "border-box"
                    }}
                  >
                    <span
                      style={{
                        fontSize: dynamicFontSize,
                        lineHeight: 1.25,
                        fontWeight: 900,
                        color: textColor,
                        fontFamily: styles.fontFamily,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                        wordBreak: "break-word"
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                </div>
              </AnimatedBlock>
            </div>
          );
        })}
      </div>
    </div>
  );
};
