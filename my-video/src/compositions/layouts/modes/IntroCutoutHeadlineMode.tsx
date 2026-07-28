import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const IntroCutoutHeadlineMode: React.FC<ModeRendererProps> = ({
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
  theme,
  highlightWords
}) => {
  const mainTitle = titleText || "Code Ra Video";

  // Split title to extract the first word dynamically for the bottom category badge
  const cleanTitleWords = mainTitle
    .trim()
    .split(/\s+/)
    .map(w => w.replace(/[:.,!?]/g, "").toUpperCase())
    .filter(w => w.length > 0);
  const bottomBadgeText = cleanTitleWords[0] || "AI";

  const isCountdown = t.id === "IntroKineticCountdownImage";

  // Data for the 3 slanted cards at the top
  const cardsData = [
    { text: otherComps[0]?.data?.text || "AI viết video", icon: "zap", defaultRot: -2, defaultWidth: isCountdown ? "720px" : "360px", defaultLeft: isCountdown ? "40px" : "40px", defaultTop: "0px", align: "flex-start" as const },
    { text: otherComps[1]?.data?.text || "Từ code", icon: "arrow", defaultRot: 2, defaultWidth: isCountdown ? "680px" : "390px", defaultRight: isCountdown ? "40px" : "82px", defaultTop: "140px", align: "flex-end" as const },
    { text: otherComps[2]?.data?.text || "Ra video", icon: "star", defaultRot: -1.4, defaultWidth: isCountdown ? "740px" : "500px", defaultLeft: isCountdown ? "40px" : "76px", defaultTop: "295px", align: "flex-start" as const }
  ];

  // Limit rendering to existing otherComps (max 3 cards)
  const renderedCards = cardsData.slice(0, Math.min(3, otherComps.length || 3));

  // SVG Icon Renderer
  const renderIcon = (type: string, isAccentCard: boolean) => {
    const iconColor = isAccentCard ? "#ffffff" : accentColor;
    if (type === "zap") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    }
    if (type === "arrow") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "900px",
      minHeight: "1000px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>

      {/* Top Section: Scattered slanted cards */}
      <div style={{ position: "relative", width: "100%", height: "480px" }}>
        {renderedCards.map((card, idx) => {
          const comp = otherComps[idx];
          const itemStyleSetting = t.items?.itemStyles?.[idx] || {};
          const isAccent = itemStyleSetting.useAccentBg;
          const rotation = itemStyleSetting.rotation !== undefined
            ? itemStyleSetting.rotation
            : (t.items?.rotations?.[idx + 1] !== undefined
              ? t.items.rotations[idx + 1]
              : (t.items?.rotations?.[idx] !== undefined
                ? t.items.rotations[idx]
                : card.defaultRot));

          // Animations
          const animConfig = comp
            ? getAnimationConfig(comp, idx, "slide-up", 0.15 + idx * 0.12, t)
            : { animation: "slide-up" as const, delay: 0.15 + idx * 0.12 };

          // Styling
          let bgStyle = "";
          let borderStyle = "";
          let textColor = "";
          let badgeColor = "";
          let boxShadow = "";

          if (isAccent) {
            bgStyle = `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`;
            borderStyle = `1px solid rgba(255, 255, 255, 0.4)`;
            textColor = "#ffffff";
            badgeColor = "rgba(255, 255, 255, 0.8)";
            boxShadow = isLight
              ? `rgba(0,0,0,0.16) 0px 22px 52px, rgba(${rgb}, 0.2) 0px 0px 26px`
              : `rgba(0, 0, 0, 0.34) 0px 22px 52px, rgba(${rgb}, 0.14) 0px 0px 26px`;
          } else {
            bgStyle = isLight
              ? "rgba(255, 255, 255, 0.94)"
              : "rgba(2, 6, 23, 0.78)";
            borderStyle = isLight
              ? `1px solid rgba(${rgb}, 0.22)`
              : `1px solid rgba(${rgb}, 0.3)`;
            textColor = isLight ? "#1e293b" : "rgb(248, 250, 252)";
            badgeColor = accentColor;
            boxShadow = isLight
              ? "rgba(0, 0, 0, 0.06) 0px 18px 44px"
              : `rgba(0, 0, 0, 0.34) 0px 22px 52px, rgba(${rgb}, 0.14) 0px 0px 26px`;
          }

          // Parse label badge dynamically
          const pos = t.positions?.[idx + 1];
          const nested = pos?.nestedStructure;

          let cardBadge = "AI";
          if (nested) {
            if (nested.titleText && /^\d+$/.test(nested.titleText.trim())) {
              cardBadge = nested.titleText.trim();
            } else if (nested.badgeText) {
              cardBadge = nested.badgeText;
            } else {
              const cardWords = card.text.trim().split(/\s+/);
              cardBadge = cardWords[0]?.toUpperCase() || "AI";
            }
          } else {
            const cardWords = card.text.trim().split(/\s+/);
            cardBadge = cardWords[0]?.toUpperCase() || "AI";
          }

          const cardWrapperStyle: React.CSSProperties = {
            position: "absolute",
            top: card.defaultTop,
            left: card.defaultLeft || undefined,
            right: card.defaultRight || undefined,
            width: card.defaultWidth,
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "center center",
            zIndex: idx + 5
          };

          return (
            <div key={idx} style={cardWrapperStyle}>
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={{
                  width: "100%",
                  borderRadius: "16px",
                  padding: resolvePadding(isCountdown ? "20px 24px" : "16px 18px", paddingScale),
                  background: bgStyle,
                  border: borderStyle,
                  boxShadow: boxShadow,
                  backdropFilter: "blur(12px)",
                  display: "grid",
                  gap: "8px",
                  boxSizing: "border-box"
                }}>
                  {isCountdown ? (
                    <div style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "24px"
                    }}>
                      <div style={{
                        fontSize: `${Math.round(36 * fontScale)}px`,
                        fontWeight: 900,
                        color: badgeColor,
                        fontFamily: styles.fontFamily,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        {renderIcon(card.icon, isAccent)}
                        <span>{cardBadge}</span>
                      </div>
                      <div style={{
                        fontSize: `${Math.round(32 * fontScale)}px`,
                        lineHeight: 1.02,
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        textTransform: "uppercase",
                        color: textColor,
                        fontFamily: styles.fontFamily
                      }}>
                        {card.text}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Card badge header */}
                      <div style={{
                        fontSize: "13px",
                        lineHeight: 1,
                        fontWeight: 900,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: badgeColor,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}>
                        {renderIcon(card.icon, isAccent)}
                        <span>{cardBadge}</span>
                      </div>
                      {/* Card content text */}
                      <div style={{
                        fontSize: `${Math.round(28 * fontScale)}px`,
                        lineHeight: 1.02,
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        textTransform: "uppercase",
                        color: textColor,
                        fontFamily: styles.fontFamily
                      }}>
                        {card.text}
                      </div>
                    </>
                  )}
                </div>
              </AnimatedBlock>
            </div>
          );
        })}
      </div>

      {/* Bottom Section: Headline block */}
      <AnimatedBlock animation="slide-up" delaySeconds={0.5}>
        <div style={{
          display: "grid",
          gap: "20px",
          width: "100%",
          paddingBottom: "24px",
          boxSizing: "border-box"
        }}>
          {/* Bottom badge */}
          <div style={{
            borderRadius: "999px",
            padding: "10px 16px",
            background: isLight ? "rgba(0,0,0,0.05)" : "rgba(2, 6, 23, 0.76)",
            border: `1px solid rgba(${rgb}, 0.4)`,
            color: accentColor,
            fontSize: "18px",
            fontWeight: 900,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            boxShadow: isLight ? "none" : `rgba(0, 0, 0, 0.28) 0px 18px 40px, rgba(${rgb}, 0.1) 0px 0px 22px`,
            backdropFilter: "blur(12px)",
            width: "fit-content",
            fontFamily: styles.fontFamily
          }}>
            {bottomBadgeText}
          </div>

          {/* Main Title */}
          <div style={{
            fontSize: `${Math.round(108 * fontScale)}px`,
            lineHeight: 1.32,
            fontWeight: 900,
            letterSpacing: "-0.085em",
            color: isLight ? "#1f2937" : "rgb(248, 250, 252)",
            textTransform: "uppercase",
            maxWidth: "820px",
            fontFamily: styles.fontFamily,
            textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.6) 0px 22px 54px, rgba(${rgb}, 0.125) 0px 0px 30px`
          }}>
            {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
          </div>

          {/* Bottom gradient divider line */}
          <div style={{
            width: "220px",
            height: "6px",
            borderRadius: "999px",
            background: `linear-gradient(90deg, ${accentColor}, rgb(253, 230, 138))`,
            boxShadow: `rgba(${rgb}, 0.19) 0px 0px 28px`
          }} />
        </div>
      </AnimatedBlock>
    </div>
  );
};
