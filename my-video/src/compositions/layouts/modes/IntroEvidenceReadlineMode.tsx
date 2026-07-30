import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const IntroEvidenceReadlineMode: React.FC<ModeRendererProps> = ({
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
  const mainTitle = titleText || "Code Ra Video";

  // Category pill tag at the bottom
  const bottomCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");

  // Slanted evidence card configurations
  const cardConfigs = [
    {
      left: "10px",
      top: "56px",
      width: "560px",
      rotation: -1,
      id: "R1",
      badgeText: "REDLINE EVIDENCE",
      isHighlighted: false
    },
    {
      right: "24px",
      top: "220px",
      width: "520px",
      rotation: 1.4,
      id: "R2",
      badgeText: "REDLINE EVIDENCE",
      isHighlighted: false
    },
    {
      left: "48px",
      top: "390px",
      width: "600px",
      rotation: -0.6,
      id: "R3",
      badgeText: "REDLINE EVIDENCE",
      isHighlighted: true // Third card is highlighted by default in design
    }
  ];

  // Limit rendering to existing otherComps (max 3 cards) without hardcoded fallbacks
  const renderedConfigs = cardConfigs.slice(0, otherComps.length);

  const hasCategory = !!bottomCategory;

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

      {/* Top Section: Evidence border + Slanted cards */}
      <div style={{ position: "relative", width: "100%", height: "580px" }}>

        {/* Outer dotted/transparent border frame */}
        <div style={{
          position: "absolute",
          inset: "0px -10px",
          borderRadius: "28px",
          border: isLight ? "1px solid rgba(0,0,0,0.08)" : `1px solid rgba(${rgb}, 0.25)`,
          boxShadow: isLight ? "none" : `rgba(${rgb}, 0.06) 0px 0px 46px inset`,
          pointerEvents: "none",
          zIndex: 2
        }} />

        {renderedConfigs.map((config, idx) => {
          const comp = otherComps[idx];
          const textVal = comp?.data?.text || "";

          // Animation configs
          const animConfig = comp
            ? getAnimationConfig(comp, idx, "slide-left", 0.15 + idx * 0.12, t)
            : { animation: "slide-left" as const, delay: 0.15 + idx * 0.12 };

          const isHighlighted = config.isHighlighted;

          // Theme-based coloring
          let cardBg = "";
          let cardBorder = "";
          let cardShadow = "";
          let cardTextColor = "";

          if (isHighlighted) {
            cardBg = isLight
              ? `linear-gradient(90deg, rgba(255,255,255,0.98), rgba(${rgb}, 0.08))`
              : (styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || `linear-gradient(90deg, rgba(2, 6, 23, 0.88), rgba(${rgb}, 0.15))`);
            cardBorder = `1px solid ${accentColor}`;
            cardShadow = isLight
              ? `rgba(0,0,0,0.12) 0px 24px 58px, rgba(${rgb},0.2) 0px 0px 28px`
              : `rgba(0, 0, 0, 0.44) 0px 24px 58px, rgba(${rgb}, 0.22) 0px 0px 34px`;
            cardTextColor = isLight ? "#0f172a" : "rgb(249, 247, 255)";
          } else {
            cardBg = isLight
              ? "linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))"
              : (styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || "linear-gradient(90deg, rgba(2, 6, 23, 0.84), rgba(15, 23, 42, 0.58))");
            cardBorder = isLight
              ? "1px solid rgba(0,0,0,0.08)"
              : `1px solid rgba(${rgb}, 0.3)`;
            cardShadow = isLight
              ? "rgba(0, 0, 0, 0.05) 0px 18px 40px"
              : `rgba(0, 0, 0, 0.38) 0px 20px 48px, rgba(${rgb}, 0.1) 0px 0px 24px`;
            cardTextColor = isLight ? "#1e293b" : "rgb(249, 247, 255)";
          }

          return (
            <div
              key={idx}
              style={{
                position: "absolute",
                top: config.top,
                left: config.left || undefined,
                right: config.right || undefined,
                width: config.width,
                transform: `rotate(${config.rotation}deg)`,
                transformOrigin: "center center",
                zIndex: idx + 5
              }}
            >
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={{ display: "grid", gap: "8px" }}>
                  {/* Accent horizontal red bar on top of the card */}
                  <div style={{
                    width: "100%",
                    height: "5px",
                    borderRadius: "999px",
                    background: `linear-gradient(90deg, ${accentColor}, ${idx % 2 === 0 ? "transparent" : accentColor}, ${idx % 2 === 0 ? accentColor : "transparent"})`,
                    boxShadow: `rgba(${rgb}, 0.33) 0px 0px 24px`
                  }} />

                  {/* Card Container */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "62px minmax(0px, 1fr)",
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
                    {/* Badge R1/R2/R3 */}
                    <div style={{
                      width: "62px",
                      height: "52px",
                      borderRadius: "14px",
                      background: `rgba(${rgb}, 0.12)`,
                      border: `1px solid rgba(${rgb}, 0.45)`,
                      display: "grid",
                      placeItems: "center",
                      color: accentColor,
                      fontSize: "16px",
                      fontWeight: 900,
                      letterSpacing: "0.08em",
                      fontFamily: styles.fontFamily
                    }}>
                      {config.id}
                    </div>

                    {/* Content col */}
                    <div style={{ display: "grid", gap: "5px" }}>
                      <div style={{
                        color: accentColor,
                        fontSize: "11px",
                        fontWeight: 900,
                        letterSpacing: "0.17em",
                        textTransform: "uppercase",
                        fontFamily: styles.fontFamily
                      }}>
                        {config.badgeText}
                      </div>
                      <div style={{
                        fontSize: `${Math.round(28 * fontScale)}px`,
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
              background: accentColor,
              color: "#ffffff",
              border: isLight ? `1px solid rgba(255,255,255,0.4)` : "1px solid rgba(255, 255, 255, 0.18)",
              fontSize: "18px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              boxShadow: `rgba(0, 0, 0, 0.32) 0px 18px 40px, rgba(${rgb}, 0.25) 0px 0px 22px`,
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
            textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.62) 0px 22px 54px, rgba(${rgb}, 0.18) 0px 0px 34px`
          }}>
            {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
          </div>
        </div>
      </AnimatedBlock>

    </div>
  );
};
