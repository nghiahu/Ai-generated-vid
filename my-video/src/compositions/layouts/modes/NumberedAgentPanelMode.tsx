import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { ModeRendererProps } from "./LayoutModeTypes";
import { CategoryPill } from "../../../components/atoms/VideoAtoms";

// Unicode number circles ①②③④
const NUMBER_CHARS = ["①", "②", "③", "④"];

export const NumberedAgentPanelMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  isVertical,
  styles,
  fontScale,
  voiceover,
  category,
  titleText,
  highlightWords,
}) => {
  const frame = useCurrentFrame();

  // 1. Category pill text
  const cleanCategory =
    category ||
    (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" &&
      t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video"
      ? t.categoryPill?.text
      : "") ||
    "BƯỚC";

  // 2. Resolve numbered cards from script (feature_card or card type)
  const cardItems = otherComps.filter(
    (c) =>
      (c.type === "feature_card" || c.type === "card") &&
      c.data?.text?.trim()
  );

  const resolvedCards =
    cardItems.length > 0
      ? cardItems.slice(0, 4)
      : [
        { id: "fb1", data: { text: "Security Architect", subtext: "soi lại thiết kế bản vá" } },
        { id: "fb2", data: { text: "Penetration Tester", subtext: "thử phá chính bản vá đó" } },
        { id: "fb3", data: { text: "Cross-Repo Analyzer", subtext: "bắt khi fix trái ≥ 2 repo" } },
      ];

  // 3. Bottom insight bar — prefer short voiceover, else last card subtext
  const insightText =
    voiceover && voiceover.trim().length < 100
      ? voiceover.trim()
      : resolvedCards[resolvedCards.length - 1]?.data?.subtext || "";

  // Word to highlight in bold inside insight bar
  const hw = highlightWords?.[0] || "";

  // Sizes — card container x1.5, text stays original size
  const titleFontSize = Math.round((isVertical ? 80 : 96) * fontScale);
  const cardFontSize = isVertical ? 28 : 34;       // original text size
  const subtextFontSize = isVertical ? 16 : 20;    // original text size
  const badgeSize = isVertical ? 78 : 96;          // 1.5x (was 52/64)
  const badgeFontSize = isVertical ? 22 : 28;      // original badge font
  const cardGap = isVertical ? 24 : 30;            // 1.5x (was 16/20)
  const STAGGER = 8; // frames between card animations

  // Individual element animations (no full-container fade to avoid blank screen)

  // Card style helpers — contrast-aware
  const itemStyles: any[] = t.items?.itemStyles || []; // eslint-disable-line @typescript-eslint/no-explicit-any
  const getCardBg = (idx: number) => {
    const s = itemStyles[idx] || itemStyles[itemStyles.length - 1] || {};
    if (s.useAccentBg) {
      // First card: solid accent tint
      return isLight ? `rgba(${rgb}, 0.22)` : `rgba(${rgb}, 0.28)`;
    }
    if (s.useSubtleThemeBg) {
      // Non-first cards: visible glass effect
      return isLight
        ? "rgba(255, 255, 255, 0.38)"
        : "rgba(0, 0, 0, 0.35)";
    }
    return isLight ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.25)";
  };
  const getCardBorder = (idx: number) => {
    const s = itemStyles[idx] || itemStyles[itemStyles.length - 1] || {};
    if (s.useAccentBorder) {
      return `2px solid rgba(${rgb}, 0.7)`;
    }
    if (s.useThemeBorder) {
      return isLight
        ? "1.5px solid rgba(255, 255, 255, 0.65)"
        : "1.5px solid rgba(255, 255, 255, 0.18)";
    }
    return isLight
      ? "1px solid rgba(255,255,255,0.50)"
      : "1px solid rgba(255,255,255,0.12)";
  };
  // Badge bg for non-first cards — visible on any background
  const getBadgeBg = (idx: number) => {
    if (idx === 0) return accentColor;
    return isLight ? "rgba(255,255,255,0.55)" : `rgba(${rgb}, 0.22)`;
  };
  // Badge text color
  const getBadgeColor = (idx: number) => {
    if (idx === 0) return isLight ? "#000000" : "#ffffff";
    return isLight ? accentColor : accentColor;
  };

  // Render highlight text — splits on hw and wraps in <strong>
  const renderInsight = (text: string) => {
    if (!hw || !text.includes(hw)) return text;
    const parts = text.split(hw);
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && (
          <strong style={{ color: accentColor, fontStyle: "normal", fontWeight: 800 }}>
            {hw}
          </strong>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: isVertical ? "56px 64px" : "80px 100px",
        paddingTop: isVertical ? "320px" : "400px",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        position: "relative",
        fontFamily: styles.fontFamily,
      }}
    >
      {/* Category Pill */}
      {cleanCategory && (
        <div style={{
          marginBottom: isVertical ? 16 : 22,
          opacity: interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          transform: `translateY(${interpolate(frame, [0, 12], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
        }}>
          <CategoryPill
            text={cleanCategory}
            bgRgba={t.categoryPill?.bgRgba || "rgba(2,6,23,0.72)"}
            borderRgba={t.categoryPill?.borderRgba || `rgba(${rgb},0.4)`}
            textRgba={t.categoryPill?.textRgba || "rgba(255,255,255,0.92)"}
            dotRgba={accentColor}
            fontFamily={styles.fontFamily}
          />
        </div>
      )}

      {/* Heading */}
      {titleText && (
        <div
          style={{
            fontSize: titleFontSize,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: styles.titleColor || (isLight ? "#111111" : "#ffffff"),
            marginBottom: isVertical ? 22 : 36,
            maxWidth: isVertical ? "92%" : "880px",
            textShadow: t.title?.useAccentTextShadow
              ? `0 0 60px rgba(${rgb},0.45)`
              : undefined,
            opacity: interpolate(frame, [2, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }),
            transform: `translateY(${interpolate(frame, [2, 18], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}px)`,
          }}
        >
          {titleText}
        </div>
      )}

      {/* Numbered Cards List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: cardGap,
          width: "100%",
          maxWidth: isVertical ? "100%" : "880px",
        }}
      >
        {resolvedCards.map((card, idx) => {
          const delay = idx * STAGGER;
          const cardProgress = interpolate(frame - delay, [0, 22], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          });
          const cardY = interpolate(frame - delay, [0, 22], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <div
              key={card.id || idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: isVertical ? 24 : 30,
                background: getCardBg(idx),
                border: getCardBorder(idx),
                borderRadius: isVertical ? 24 : 30,
                padding: isVertical ? "30px 32px" : "36px 40px",
                opacity: cardProgress,
                transform: `translateY(${cardY}px)`,
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                boxShadow:
                  idx === 0
                    ? `0 4px 28px rgba(${rgb},0.22)`
                    : "0 2px 10px rgba(0,0,0,0.12)",
              }}
            >
              {/* Number Badge Circle */}
              <div
                style={{
                  width: badgeSize,
                  height: badgeSize,
                  minWidth: badgeSize,
                  borderRadius: "50%",
                  background: getBadgeBg(idx),
                  border: idx === 0 ? `2px solid rgba(${rgb}, 0.7)` : `2px solid rgba(${rgb}, 0.45)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: badgeFontSize,
                  fontWeight: 900,
                  color: getBadgeColor(idx),
                  flexShrink: 0,
                  fontFamily: styles.fontFamily,
                }}
              >
                {NUMBER_CHARS[idx] || `${idx + 1}`}
              </div>

              {/* Title + Subtitle */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div
                  style={{
                    fontSize: cardFontSize,
                    fontWeight: 800,
                    color: styles.titleColor || (isLight ? "#111111" : "#ffffff"),
                    lineHeight: 1.2,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {card.data.text}
                </div>
                {card.data.subtext && (
                  <div
                    style={{
                      fontSize: subtextFontSize,
                      fontWeight: 400,
                      color: isLight
                        ? "rgba(0,0,0,0.52)"
                        : "rgba(255,255,255,0.52)",
                      lineHeight: 1.4,
                    }}
                  >
                    {card.data.subtext}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Insight Bar */}
      {insightText && (
        <div
          style={{
            marginTop: isVertical ? 18 : 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: interpolate(
              frame - resolvedCards.length * STAGGER - 4,
              [0, 18],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
            transform: `translateY(${interpolate(
              frame - resolvedCards.length * STAGGER - 4,
              [0, 18],
              [10, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )}px)`,
            background: `rgba(${rgb}, 0.07)`,
            border: `1px solid rgba(${rgb}, 0.22)`,
            borderRadius: isVertical ? 10 : 12,
            padding: isVertical ? "9px 14px" : "11px 18px",
            maxWidth: isVertical ? "100%" : "860px",
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: isVertical ? 16 : 18, flexShrink: 0 }}>
            💡
          </span>

          {/* Italic text with optional bold highlight */}
          <span
            style={{
              fontSize: isVertical ? 12 : 14,
              fontStyle: "italic",
              color: isLight
                ? "rgba(0,0,0,0.65)"
                : "rgba(255,255,255,0.65)",
              lineHeight: 1.5,
              fontFamily: styles.fontFamily,
            }}
          >
            {renderInsight(insightText)}
          </span>
        </div>
      )}
    </div>
  );
};
