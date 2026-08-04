import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const ChapterStackMode: React.FC<ModeRendererProps> = ({
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
  // In the HTML template, Card 0 (main card) contains the headline/title text
  const mainTitle = titleText || "Code Ra Video";

  // Dynamic base font size for the main card (Card 0) based on title length
  let baseCard0FontSize = 84;
  if (mainTitle.length > 35) {
    baseCard0FontSize = 52;
  } else if (mainTitle.length > 25) {
    baseCard0FontSize = 62;
  } else if (mainTitle.length > 15) {
    baseCard0FontSize = 72;
  }

  // Other cards contain point text
  const cardsData = [
    { text: mainTitle, icon: "none", defaultRot: -2, defaultWidth: 860, defaultHeight: 224 },
    { text: otherComps[0]?.data?.text || "AI viết video", icon: "zap", defaultRot: -7, defaultWidth: 650, defaultHeight: 132 },
    { text: otherComps[1]?.data?.text || "Từ code", icon: "arrow", defaultRot: 5, defaultWidth: 620, defaultHeight: 132 },
    { text: otherComps[2]?.data?.text || "Ra video", icon: "star", defaultRot: -3, defaultWidth: 670, defaultHeight: 132 }
  ];

  // Specific layout configurations using relative positioning and margin-top for dynamic stack behavior
  const layoutConfigs = [
    {
      // Card 0: Main card top center
      left: "0px",
      marginTop: "100px",
      width: "100%",
      maxWidth: "860px",
      zIndex: 10,
      isAccent: false,
      hasBadge: true,
      hasBorderDashed: true
    },
    {
      // Card 1: Left tilted card
      left: "40px",
      marginTop: "90px",
      width: "630px",
      zIndex: 8,
      isAccent: true, // Use accent gradient fill
      hasBadge: true,
      hasBorderDashed: true
    },
    {
      // Card 2: Right tilted card
      left: "200px",
      marginTop: "38px",
      width: "600px",
      zIndex: 7,
      isAccent: false,
      hasBadge: true,
      hasBorderDashed: true
    },
    {
      // Card 3: Bottom left tilted card
      left: "60px",
      marginTop: "38px",
      width: "640px",
      zIndex: 6,
      isAccent: false,
      hasBadge: true,
      hasBorderDashed: true
    }
  ];

  // Limit rendering to existing otherComps + main card (max 4 cards)
  const renderedCardsCount = Math.min(4, 1 + otherComps.length);
  const activeConfigs = layoutConfigs.slice(0, renderedCardsCount);

  // SVG Icon Renderer
  const renderIcon = (type: string, isAccentCard: boolean) => {
    const iconColor = isAccentCard ? "#ffffff" : accentColor;
    if (type === "zap") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    }
    if (type === "arrow") {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    );
  };

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "920px",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      minHeight: "960px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box"
    }}>
      {activeConfigs.map((config, idx) => {
        const card = cardsData[idx];
        const itemStyleSetting = t.items?.itemStyles?.[idx] || {};

        // Define animation configs
        // Card 0 animate first, then sequentially
        const delay = 0.15 + idx * 0.15;
        const animationType = idx === 0 ? "scale-in" : "slide-down";

        const isAccent = config.isAccent;
        const rotation = t.items?.rotations?.[idx] !== undefined ? t.items?.rotations?.[idx] : card.defaultRot;

        // Custom style matching both Light & Dark Theme
        let bgStyle = "";
        let borderStyle = "";
        let textColor = "";
        let dashedBorderColor = "";
        let boxShadow = "";

        if (isAccent) {
          bgStyle = `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`;
          borderStyle = `3px solid rgba(255, 255, 255, 0.72)`;
          textColor = "#ffffff";
          dashedBorderColor = "rgba(255, 255, 255, 0.6)";
          boxShadow = isLight
            ? `rgba(0,0,0,0.18) 0px 24px 62px, rgba(${rgb},0.24) 0px 0px 22px`
            : `rgba(0, 0, 0, 0.46) 0px 32px 82px, rgba(${rgb}, 0.22) 0px 0px 42px`;
        } else {
          bgStyle = isLight
            ? "rgba(248, 250, 252, 0.92)"
            : "linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.85))";
          borderStyle = isLight
            ? `3px solid ${accentColor}`
            : `3px solid rgba(255, 255, 255, 0.24)`;
          textColor = isLight ? "#0f172a" : "rgb(248, 250, 252)";
          dashedBorderColor = isLight ? `rgba(${rgb}, 0.38)` : "rgba(255, 255, 255, 0.16)";
          boxShadow = isLight
            ? "rgba(0, 0, 0, 0.08) 0px 18px 42px"
            : `rgba(0, 0, 0, 0.42) 0px 28px 70px, rgba(${rgb}, 0.15) 0px 0px 34px`;
        }

        const parsedBadge = card.text.split(/\s+/)[0]?.toUpperCase() || "AI";

        return (
          <div
            key={idx}
            style={{
              position: "relative",
              left: config.left,
              marginTop: config.marginTop,
              width: config.width,
              maxWidth: config.maxWidth,
              alignSelf: idx === 0 ? "center" : "flex-start",
              zIndex: config.zIndex,
              transform: `rotate(${rotation}deg)`,
              transformOrigin: idx % 2 === 0 ? "left center" : "right center"
            }}
          >
            <AnimatedBlock animation={animationType} delaySeconds={delay}>
              <div style={{
                position: "relative",
                minHeight: idx === 0 ? "200px" : "132px",
                borderRadius: idx === 0 ? "24px" : "18px",
                padding: idx === 0 ? "30px 34px" : "24px 30px",
                background: bgStyle,
                border: borderStyle,
                boxShadow: boxShadow,
                backdropFilter: "blur(12px)",
                display: "grid",
                alignContent: "center",
                gap: "10px",
                boxSizing: "border-box"
              }}>
                {/* 1. Inner dashed border decoration */}
                {config.hasBorderDashed && (
                  <div style={{
                    position: "absolute",
                    inset: "10px",
                    borderRadius: idx === 0 ? "18px" : "12px",
                    border: `2px dashed ${dashedBorderColor}`,
                    pointerEvents: "none"
                  }} />
                )}

                {/* 2. Badge header row inside card */}
                {config.hasBadge && (
                  <div style={{
                    position: "relative",
                    fontSize: "14px",
                    fontWeight: 900,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: isAccent ? "rgba(255, 255, 255, 0.72)" : accentColor,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    {card.icon !== "none" && renderIcon(card.icon, isAccent)}
                    <span>{parsedBadge}</span>
                  </div>
                )}

                {/* 3. Main Text */}
                <div style={{
                  position: "relative",
                  fontSize: idx === 0
                    ? `${Math.round(baseCard0FontSize * fontScale)}px`
                    : `${Math.round(40 * fontScale)}px`,
                  lineHeight: idx === 0 ? 1.05 : 0.98,
                  fontWeight: 900,
                  letterSpacing: "-0.045em",
                  textTransform: "uppercase",
                  color: textColor,
                  fontFamily: styles.fontFamily,
                  wordBreak: "break-word"
                }}>
                  {idx === 0 ? highlightHeadingText(card.text, accentColor, theme, highlightWords) : card.text}
                </div>
              </div>
            </AnimatedBlock>
          </div>
        );
      })}
    </div>
  );
};
