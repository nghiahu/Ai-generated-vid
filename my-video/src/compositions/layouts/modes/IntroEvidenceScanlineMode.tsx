import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const IntroEvidenceScanlineMode: React.FC<ModeRendererProps> = ({
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
  const mainTitle = titleText || "Code Ra Video";

  // Category pill tag at the bottom
  const bottomCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");
  const hasCategory = !!bottomCategory;

  // Animate the scanline to loop back and forth (0 -> 580 -> 0) infinitely, slowed down
  const cycleDuration = 180; // ~6 seconds per full loop at 30fps
  const relativeFrame = frame % cycleDuration;
  const scanlineTop = interpolate(
    relativeFrame,
    [0, 80, 95, 165, 180], // Down for 80 frames (2.6s), pause 15 frames, up for 70 frames (2.3s), pause 15 frames
    [0, 580, 580, 0, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    }
  );

  // Slanted evidence card configurations
  const cardConfigs = [
    {
      left: "24px",
      top: "45px",
      width: "430px",
      icon: "zap",
      isHighlighted: false
    },
    {
      right: "24px",
      top: "220px",
      width: "440px",
      icon: "arrow",
      isHighlighted: false
    },
    {
      left: "32px",
      top: "395px",
      width: "500px",
      icon: "star",
      isHighlighted: true // Third card is highlighted by default in design
    }
  ];

  // Limit rendering to existing otherComps (max 3 cards) without hardcoded fallbacks
  const renderedConfigs = cardConfigs.slice(0, otherComps.length);

  // SVG Icon Renderer
  const renderIcon = (type: string, isAccentCard: boolean) => {
    const iconColor = isAccentCard ? "#ffffff" : accentColor;
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
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "920px",
      minHeight: "1020px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>

      {/* Top Section: Grid Board Box + Slanted cards + scanline */}
      <div style={{ position: "relative", width: "100%", height: "580px" }}>

        {/* Outer Grid Board Frame */}
        <div style={{
          position: "absolute",
          inset: "0px -10px",
          borderRadius: "30px",
          border: isLight ? `1.5px solid rgba(${rgb}, 0.25)` : `1.5px solid rgba(${rgb}, 0.45)`,
          boxShadow: isLight
            ? "rgba(0, 0, 0, 0.05) 0px 18px 44px"
            : `rgba(0, 0, 0, 0.44) 0px 24px 64px, rgba(${rgb}, 0.1) 0px 0px 44px inset`,
          backgroundImage: isLight
            ? "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)"
            : "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          pointerEvents: "none",
          zIndex: 2
        }} />

        {/* Horizontal glowing Scanline */}
        <div style={{
          position: "absolute",
          left: "-10px",
          right: "-10px",
          top: `${scanlineTop}px`, // Dynamically interpolated scanner position
          height: "4px",
          borderRadius: "999px",
          background: `linear-gradient(90deg, transparent, rgb(253, 230, 138), ${accentColor}, transparent)`,
          boxShadow: `rgba(${rgb}, 0.45) 0px 0px 28px, rgba(239, 68, 68, 0.28) 0px 0px 42px`,
          opacity: 0.86,
          pointerEvents: "none",
          zIndex: 3
        }} />

        {renderedConfigs.map((config, idx) => {
          const comp = otherComps[idx];
          const textVal = comp?.data?.text || "";

          // Animation configs
          const animConfig = comp
            ? getAnimationConfig(comp, idx, "slide-right", 0.15 + idx * 0.12, t)
            : { animation: "slide-right" as const, delay: 0.15 + idx * 0.12 };

          const isHighlighted = config.isHighlighted;

          // Theme-based coloring (sharper, higher contrast and crisp borders)
          let cardBg = "";
          let cardBorder = "";
          let cardShadow = "";
          let cardTextColor = "";

          if (isHighlighted) {
            cardBg = isLight
              ? `linear-gradient(90deg, #ffffff, rgba(${rgb}, 0.12))`
              : `linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(${rgb}, 0.16))`;
            cardBorder = `1.5px solid ${accentColor}`;
            cardShadow = isLight
              ? `rgba(15, 23, 42, 0.08) 0px 24px 48px, rgba(${rgb}, 0.1) 0px 0px 16px`
              : `rgba(0, 0, 0, 0.44) 0px 24px 62px, rgba(${rgb}, 0.2) 0px 0px 24px, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset`;
            cardTextColor = isLight ? "#0f172a" : "rgb(249, 247, 255)";
          } else {
            cardBg = isLight
              ? "rgba(255, 255, 255, 0.98)"
              : "rgba(15, 23, 42, 0.96)";
            cardBorder = isLight
              ? `1px solid rgba(${rgb}, 0.15)`
              : `1px solid rgba(255, 255, 255, 0.06)`;
            cardShadow = isLight
              ? "rgba(15, 23, 42, 0.04) 0px 18px 40px"
              : `rgba(0, 0, 0, 0.44) 0px 20px 48px, rgba(255, 255, 255, 0.04) 0px 0px 0px 1px inset`;
            cardTextColor = isLight ? "#1e293b" : "rgb(249, 247, 255)";
          }

          // Parse label badge dynamically from first word of card text
          const cardWords = textVal.trim().split(/\s+/);
          const cardBadge = cardWords[0]?.toUpperCase() || "AI";

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: config.top,
                left: config.left || undefined,
                right: config.right || undefined,
                width: config.width,
                zIndex: idx + 5
              }}
            >
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "54px minmax(0px, 1fr)",
                  alignItems: "center",
                  gap: "14px",
                  width: "100%",
                  borderRadius: "18px",
                  padding: "14px 16px",
                  background: cardBg,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  backdropFilter: "blur(16px)",
                  boxSizing: "border-box"
                }}>
                  {/* Circle box for Icon */}
                  <div style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "16px",
                    background: `rgba(${rgb}, 0.13)`,
                    border: `1px solid rgba(${rgb}, 0.44)`,
                    display: "grid",
                    placeItems: "center",
                    boxSizing: "border-box"
                  }}>
                    {renderIcon(config.icon, isHighlighted)}
                  </div>

                  {/* Content col */}
                  <div style={{ display: "grid", gap: "6px" }}>
                    <div style={{
                      color: accentColor,
                      fontSize: "11px",
                      fontWeight: 900,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      fontFamily: styles.fontFamily
                    }}>
                      <span>{cardBadge}</span>
                    </div>
                    <div style={{
                      fontSize: `${Math.round(29 * fontScale)}px`,
                      lineHeight: 1.04,
                      fontWeight: 900,
                      letterSpacing: "-0.04em",
                      textTransform: "uppercase",
                      color: cardTextColor,
                      fontFamily: styles.fontFamily
                    }}>
                      {textVal}
                    </div>
                  </div>
                </div>
              </AnimatedBlock>
            </div>
          );
        })}
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
            textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.62) 0px 22px 54px, rgba(${rgb}, 0.14) 0px 0px 34px`,
            textWrap: "balance" as any
          }}>
            {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
          </div>
        </div>
      </AnimatedBlock>

    </div>
  );
};
