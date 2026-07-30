import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const IntroEvidenceTimelineMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  titleText,
  category,
  theme,
  highlightWords
}) => {
  const frame = useCurrentFrame();
  const lineProgress = interpolate(frame, [10, 50], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const beamY = interpolate(frame, [15, 65], [0, 96], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const isBeamVisible = frame > 15 && frame < 70;
  const mainTitle = titleText || "Code Ra Video";

  // Category pill tag at the bottom
  const bottomCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");
  const hasCategory = !!bottomCategory;

  // Timeline step configurations matching the design
  const stepConfigs = [
    {
      num: "01",
      badgeText: "FIRST SIGNAL",
      marginLeft: "0px",
      maxWidth: "580px",
      isHighlighted: false
    },
    {
      num: "02",
      badgeText: "THEN EVIDENCE",
      marginLeft: "64px",
      maxWidth: "520px",
      isHighlighted: false
    },
    {
      num: "03",
      badgeText: "NOW IMPACT",
      marginLeft: "0px",
      maxWidth: "580px",
      isHighlighted: true // Highlight the final step
    }
  ];

  // Limit rendering to existing otherComps (max 3 steps) without hardcoded fallbacks
  const renderedConfigs = stepConfigs.slice(0, otherComps.length);

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "920px",
      minHeight: "1050px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>

      {/* Top Section: Timeline Box Area */}
      <div style={{ position: "relative", width: "100%", height: "620px" }}>

        {/* Vertical gradient timeline line */}
        <div style={{
          position: "absolute",
          left: "26px", // Centered exactly at the middle of the 54px circles (26px + 27px circle radius = 53px)
          top: "15px",
          height: `${lineProgress * 0.95}%`, // grows timeline line dynamically
          width: "4px",
          borderRadius: "999px",
          background: `linear-gradient(180deg, rgb(253, 230, 138), ${accentColor}, ${darkAccentColor})`,
          boxShadow: `rgba(${rgb}, 0.26) 0px 0px 24px`,
          pointerEvents: "none",
          zIndex: 2
        }} />

        {/* Traveling light beam particle */}
        {isBeamVisible && (
          <div style={{
            position: "absolute",
            left: "22px", // Centered on the 4px line (26px - 4px radius = 22px)
            top: `${beamY}%`,
            width: "12px",
            height: "24px",
            borderRadius: "6px",
            background: "#ffffff",
            boxShadow: `0 0 15px #ffffff, 0 0 30px ${accentColor}`,
            zIndex: 4,
            pointerEvents: "none",
            opacity: 0.95
          }} />
        )}

        {/* Timeline content wrapper */}
        <div style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          zIndex: 3
        }}>
          {renderedConfigs.map((config, idx) => {
            const comp = otherComps[idx];
            const textVal = comp?.data?.text || "";

            // Animation configs
            const animConfig = comp
              ? getAnimationConfig(comp, idx, "slide-right", 0.15 + idx * 0.12, t)
              : { animation: "slide-right" as const, delay: 0.15 + idx * 0.12 };

            const isHighlighted = config.isHighlighted;

            // Custom style matching both Light & Dark Theme
            let nodeBg = "";
            let nodeBorder = "";
            let nodeShadow = "";

            let cardBg = "";
            let cardBorder = "";
            let cardShadow = "";
            let cardTextColor = "";

            if (isHighlighted) {
              // Circle Node styling
              nodeBg = `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`;
              nodeBorder = `2px solid ${accentColor}`;
              nodeShadow = `rgba(${rgb}, 0.3) 0px 0px 22px`;

              // Card styling
              cardBg = isLight
                ? `linear-gradient(90deg, #ffffff, rgba(${rgb}, 0.08))`
                : (styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || `linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(${rgb}, 0.15))`);
              cardBorder = `2px solid ${accentColor}`;
              cardShadow = isLight
                ? `rgba(0,0,0,0.1) 0px 20px 46px, rgba(${rgb},0.15) 0px 0px 22px`
                : `rgba(0, 0, 0, 0.4) 0px 24px 56px, rgba(${rgb}, 0.25) 0px 0px 32px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset`;
              cardTextColor = isLight ? "#0f172a" : "rgb(249, 247, 255)";
            } else {
              // Circle Node styling
              nodeBg = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.9)";
              nodeBorder = isLight ? `2px solid rgba(${rgb}, 0.4)` : `2px solid rgba(${rgb}, 0.6)`;
              nodeShadow = "none";

              // Card styling
              cardBg = isLight
                ? "linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))"
                : (styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || "linear-gradient(90deg, rgba(2, 6, 23, 0.82), rgba(15, 23, 42, 0.54))");
              cardBorder = isLight
                ? "1px solid rgba(0,0,0,0.08)"
                : `1px solid rgba(${rgb}, 0.36)`;
              cardShadow = isLight
                ? "rgba(0, 0, 0, 0.04) 0px 18px 40px"
                : `rgba(0, 0, 0, 0.34) 0px 20px 46px, rgba(${rgb}, 0.1) 0px 0px 22px, rgba(255, 255, 255, 0.06) 0px 0px 0px 1px inset`;
              cardTextColor = isLight ? "#1e293b" : "rgb(249, 247, 255)";
            }

            return (
              <div
                key={idx}
                style={{
                  display: "grid",
                  gridTemplateColumns: "54px minmax(0px, 1fr)",
                  alignItems: "center",
                  gap: "18px",
                  maxWidth: config.maxWidth,
                  marginLeft: config.marginLeft,
                  width: "100%",
                  boxSizing: "border-box"
                }}
              >
                {/* 1. Circle step node */}
                <div style={{
                  width: "54px",
                  height: "54px",
                  borderRadius: "999px",
                  background: nodeBg,
                  border: nodeBorder,
                  boxShadow: nodeShadow,
                  color: isHighlighted ? "#ffffff" : accentColor,
                  display: "grid",
                  placeItems: "center",
                  fontSize: "15px",
                  fontWeight: 900,
                  letterSpacing: "0.08em",
                  fontFamily: styles.fontFamily,
                  zIndex: 4
                }}>
                  {config.num}
                </div>

                {/* 2. Side content card */}
                <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                  <div style={{
                    display: "grid",
                    gap: "8px",
                    borderRadius: "18px",
                    padding: "16px 18px",
                    background: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    backdropFilter: "blur(16px)",
                    boxSizing: "border-box"
                  }}>
                    {/* Badge */}
                    <div style={{
                      color: isHighlighted ? accentColor : accentColor,
                      fontSize: "11px",
                      fontWeight: 900,
                      letterSpacing: "0.17em",
                      textTransform: "uppercase",
                      fontFamily: styles.fontFamily
                    }}>
                      {config.badgeText}
                    </div>
                    {/* Step Title text */}
                    <div style={{
                      fontSize: `${Math.round(29 * fontScale)}px`,
                      lineHeight: 1.4,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      textTransform: "uppercase",
                      color: cardTextColor,
                      fontFamily: styles.fontFamily
                    }}>
                      {textVal}
                    </div>
                  </div>
                </AnimatedBlock>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Headline */}
      <AnimatedBlock animation="slide-up" delaySeconds={0.5}>
        <div style={{
          display: "grid",
          gap: "18px",
          width: "100%",
          paddingBottom: "16px",
          boxSizing: "border-box"
        }}>
          {/* Badge pill */}
          {hasCategory && (
            <div style={{
              width: "fit-content",
              borderRadius: "999px",
              padding: "10px 16px",
              background: isLight ? "rgba(0,0,0,0.05)" : "rgba(2, 6, 23, 0.78)",
              color: isLight ? "#1f2937" : "rgb(255, 255, 255)",
              border: `1px solid rgba(${rgb}, 0.4)`,
              fontSize: "18px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              boxShadow: isLight ? "none" : `rgba(0, 0, 0, 0.32) 0px 18px 40px, rgba(${rgb}, 0.12) 0px 0px 22px`,
              fontFamily: styles.fontFamily
            }}>
              {bottomCategory}
            </div>
          )}

          {/* Main Title */}
          <div style={{
            maxWidth: "820px",
            fontSize: `${Math.round(106 * fontScale)}px`,
            lineHeight: 1.32,
            fontWeight: 900,
            letterSpacing: "-0.075em",
            color: isLight ? "#1f2937" : "rgb(248, 250, 252)",
            textTransform: "uppercase",
            fontFamily: styles.fontFamily,
            textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.62) 0px 22px 54px, rgba(${rgb}, 0.14) 0px 0px 34px`
          }}>
            {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
          </div>
        </div>
      </AnimatedBlock>

    </div>
  );
};
