import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";

export const IntroSplitHeadlineMode: React.FC<ModeRendererProps> = ({
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
  category
}) => {
  const rawTitle = titleText || "Code Ra Video";
  const words = rawTitle.trim().split(/\s+/);

  let line1 = "";
  let line2 = "";
  let line3 = "";

  if (words.length >= 3) {
    const total = words.length;
    // Distribute: line1 gets 1st chunk (left), line2 gets middle (right), line3 gets rest (left)
    const size1 = Math.ceil(total / 3);
    const size3 = Math.floor(total / 3);

    line1 = words.slice(0, size1).join(" ");
    line2 = words.slice(size1, total - size3).join(" ");
    line3 = words.slice(total - size3).join(" ");
  } else if (words.length === 2) {
    line1 = words[0];
    line2 = "";
    line3 = words[1];
  } else {
    line1 = "CODE";
    line2 = "RA";
    line3 = "VIDEO";
  }

  // Category Tag
  const categoryText = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");
  const hasCategory = !!categoryText;

  // Accent colors
  const yellowColor = "rgb(253, 230, 138)";
  const redColor = "rgb(239, 68, 68)";

  // Sub-cards icons
  const cardIcons = [
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isLight ? accentColor : redColor} strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </svg>,
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isLight ? accentColor : yellowColor} strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>,
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isLight ? accentColor : "rgb(255, 200, 87)"} strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  ];

  const cardsData = otherComps.slice(0, 3).map((comp, idx) => {
    const text = comp?.data?.text?.trim() || "";
    const words = text.split(/\s+/);
    const badge = words[0] || "";
    const restText = words.slice(1).join(" ");
    
    return {
      badge,
      text: restText || text,
      borderColor: idx === 0 
        ? (isLight ? `rgba(${rgb}, 0.28)` : "rgba(239, 68, 68, 0.333)")
        : (idx === 1 ? (isLight ? `rgba(${rgb}, 0.2)` : "rgba(253, 230, 138, 0.333)") : (isLight ? `rgba(${rgb}, 0.2)` : "rgba(255, 200, 87, 0.333)")),
      badgeColor: idx === 0
        ? (isLight ? accentColor : redColor)
        : (idx === 1 ? (isLight ? `rgba(${rgb}, 0.8)` : yellowColor) : (isLight ? `rgba(${rgb}, 0.8)` : "rgb(255, 200, 87)")),
      isAccent: idx === 0
    };
  });

  const activeCards = cardsData;

  // subtitle height estimate — cards sit just above it
  // Cards bottom: subtitle is "bottom: 300px" in a 1920px canvas
  // Cards should sit just above subtitle → bottom ≈ 300px + subtitleHeight(~80px) + gap(50px) = 430px
  const cardsBottom = 430;

  return (
    <div style={{
      position: "absolute",
      left: "-86px",
      top: 0,
      width: "1080px",
      height: "1920px",
      pointerEvents: "none",
      fontFamily: styles.fontFamily,
      boxSizing: "border-box"
    }}>

      {/* Content box: left=86, top=86, width=908, height=1748 */}
      <div style={{
        position: "absolute",
        left: "86px",
        top: "86px",
        width: "908px",
        height: "1748px",
        pointerEvents: "none"
      }}>

        {/* ── HEADLINE GROUP (zigzag: left / right / left) ── */}
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width: "720px",
          top: "72px",
          display: "flex",
          flexDirection: "column",
          gap: "4px"
        }}>

          {/* Category Pill — căn trái */}
          {hasCategory && (
            <AnimatedBlock animation="slide-up" delaySeconds={0.1}>
              <div style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "14px"
              }}>
                <div style={{
                  borderRadius: "999px",
                  padding: "10px 20px",
                  background: isLight ? "rgba(0,0,0,0.05)" : "rgba(2, 6, 23, 0.6)",
                  border: isLight ? `1px solid rgba(${rgb}, 0.25)` : "1px solid rgba(255, 255, 255, 0.18)",
                  color: isLight ? accentColor : "rgb(248, 250, 252)",
                  backdropFilter: "blur(14px)",
                  fontSize: "17px",
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase" as const
                }}>
                  {categoryText}
                </div>
              </div>
            </AnimatedBlock>
          )}

          {/* Line 1 — WHITE, căn TRÁI */}
          {line1 && (
            <AnimatedBlock animation="slide-left" delaySeconds={0.2}>
              <div style={{
                color: isLight ? "#0f172a" : "#ffffff",
                fontSize: `${Math.round(112 * fontScale)}px`,
                lineHeight: 0.93,
                fontWeight: 950,
                letterSpacing: "-0.095em",
                textAlign: "left",
                textTransform: "uppercase" as const,
                textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.66) 0px 26px 64px, rgba(${rgb}, 0.15) 0px 0px 34px`
              }}>
                {line1}
              </div>
            </AnimatedBlock>
          )}

          {/* Line 2 — YELLOW/accent, căn PHẢI */}
          {line2 && (
            <AnimatedBlock animation="slide-right" delaySeconds={0.32}>
              <div style={{
                color: isLight ? accentColor : yellowColor,
                fontSize: `${Math.round(112 * fontScale)}px`,
                lineHeight: 0.93,
                fontWeight: 950,
                letterSpacing: "-0.095em",
                textAlign: "right",
                textTransform: "uppercase" as const,
                textShadow: isLight
                  ? "none"
                  : `rgba(0, 0, 0, 0.66) 0px 26px 64px, rgba(253, 230, 138, 0.22) 0px 0px 48px`
              }}>
                {line2}
              </div>
            </AnimatedBlock>
          )}

          {/* Line 3 — RED, căn TRÁI */}
          {line3 && (
            <AnimatedBlock animation="slide-left" delaySeconds={0.44}>
              <div style={{
                color: isLight ? (darkAccentColor || accentColor) : redColor,
                fontSize: `${Math.round(112 * fontScale)}px`,
                lineHeight: 0.93,
                fontWeight: 950,
                letterSpacing: "-0.095em",
                textAlign: "left",
                textTransform: "uppercase" as const,
                textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.66) 0px 26px 64px, rgba(239, 68, 68, 0.22) 0px 0px 48px`
              }}>
                {line3}
              </div>
            </AnimatedBlock>
          )}
        </div>
      </div>

      {/* ── 3 CARDS — đặt trên outer 1080px wrapper, căn GIỮA tuyệt đối ── */}
      <div style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        bottom: `${cardsBottom}px`,
        width: "860px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "stretch",
        gap: "12px"
      }}>
        {activeCards.map((card, idx) => {
          const comp = otherComps[idx];
          const animConfig = comp
            ? getAnimationConfig(comp, idx, "slide-up", 0.58 + idx * 0.12, t)
            : { animation: "slide-up" as const, delay: 0.58 + idx * 0.12 };

          let cardBg = "";
          let cardBorder = "";
          let cardTextColor = "";
          let cardShadow = "";

          if (card.isAccent) {
            cardBg = isLight
              ? `linear-gradient(135deg, rgba(255,255,255,0.98), rgba(${rgb}, 0.15))`
              : `linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(${rgb}, 0.15))`;
            cardBorder = `1px solid ${accentColor}`;
            cardTextColor = isLight ? "#0f172a" : "rgb(248, 250, 252)";
            cardShadow = isLight
              ? `rgba(0, 0, 0, 0.08) 0px 18px 38px, rgba(${rgb}, 0.1) 0px 0px 18px`
              : `rgba(0, 0, 0, 0.22) 0px 18px 38px, rgba(${rgb}, 0.08) 0px 0px 18px`;
          } else {
            cardBg = isLight
              ? "rgba(255, 255, 255, 0.94)"
              : "rgba(2, 6, 23, 0.58)";
            cardBorder = `1px solid ${card.borderColor}`;
            cardTextColor = isLight ? "#1e293b" : "rgb(248, 250, 252)";
            cardShadow = isLight
              ? "rgba(0, 0, 0, 0.04) 0px 12px 28px"
              : `rgba(0, 0, 0, 0.22) 0px 18px 38px, rgba(${rgb}, 0.05) 0px 0px 18px`;
          }

          return (
            <div key={idx} style={{ flex: "1 1 0", minWidth: 0 }}>
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={{
                  minHeight: "78px",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  background: cardBg,
                  border: cardBorder,
                  backdropFilter: "blur(14px)",
                  boxShadow: cardShadow,
                  display: "grid",
                  alignContent: "center",
                  gap: "6px",
                  textAlign: "center",
                  boxSizing: "border-box"
                }}>
                  {/* Icon + Badge */}
                  <div style={{
                    color: card.badgeColor,
                    fontSize: "12px",
                    lineHeight: 1,
                    fontWeight: 900,
                    letterSpacing: "0.18em",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    textTransform: "uppercase" as const
                  }}>
                    {cardIcons[idx]}
                    <span>{card.badge}</span>
                  </div>

                  {/* Text content */}
                  <div style={{
                    color: cardTextColor,
                    fontSize: `${Math.round(25 * fontScale)}px`,
                    lineHeight: 1.02,
                    fontWeight: 880,
                    letterSpacing: "-0.035em",
                    textTransform: "uppercase" as const
                  }}>
                    {card.text}
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
