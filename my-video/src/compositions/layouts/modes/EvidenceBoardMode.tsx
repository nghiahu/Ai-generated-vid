import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, resolveItemColors, getAnimationConfig } from "./LayoutNestedRenderers";

export const EvidenceBoardMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  activeCardTextColor,
  activeCardBadgeColor,
  inactiveCardTextColor
}) => {
  const visibleComps = otherComps.slice(0, 4);

  // Accent luminance — for auto text-on-accent contrast
  const isAccentLight = (() => {
    const vals = rgb.split(",").map((n) => parseInt(n.trim()));
    return 0.299 * (vals[0] || 239) + 0.587 * (vals[1] || 68) + 0.114 * (vals[2] || 68) > 180;
  })();

  // Small rotations, alternating like the HTML original (-0.4, 0.6, -0.8, ...)
  const defaultRotations = [-0.4, 0.6, -0.8, 0.3];
  // Alternating alignment: start | center | end to give a staggered board feel
  const alignments: React.CSSProperties["justifySelf"][] = ["flex-start", "center", "flex-end", "flex-start"];

  const listContainerStyle: React.CSSProperties = {
    display: "grid",
    gap: t.container?.gap || "18px",
    width: "100%",
    maxWidth: t.container?.maxWidth || "920px",
    zIndex: 5
  };

  return (
    <div style={listContainerStyle}>
      {visibleComps.map((comp, idx) => {
        const item = t.items?.itemStyles?.[idx % (t.items?.itemStyles?.length || 1)] || {};
        const pos = resolvedPositions?.[idx % (resolvedPositions?.length || 1)];

        const colors = resolveItemColors({
          item,
          accentColor,
          darkAccentColor,
          styles,
          rgb,
          isLight,
          isAccentLight
        });

        // Per-card rotation from JSON or fallback defaults
        const rotation =
          t.items?.rotations?.[idx] !== undefined
            ? t.items.rotations[idx]
            : defaultRotations[idx % defaultRotations.length];

        // Badge label from nestedStructure pills or fallback "Proof N"
        const badgeText: string =
          pos?.nestedStructure?.pills?.[0] ||
          `Proof ${idx + 1}`;

        // Main text: actual user content first, fall back to template sample
        const mainText: string =
          comp?.data?.text ||
          pos?.nestedStructure?.titleText ||
          "";

        // Is this card the "accent/active" card?
        const isAccentCard: boolean = !!item.useAccentBg;

        // Determine badge/line color — always use accentColor
        // Active (accent bg) card: inverted text on accent bg
        // Inactive card: accent color on subtle bg
        const badgeColor: string = isAccentCard
          ? (isAccentLight ? "#1e293b" : "#ffffff")
          : accentColor;
        const badgeBg: string = `rgba(${rgb}, 0.094)`;
        const badgeBorder: string = `rgba(${rgb}, 0.333)`;
        const lineGradient: string = `linear-gradient(90deg, rgba(${rgb}, 0.667), transparent)`;

        // On light themes: always use dark text (accent bg is a light tint → white text invisible)
        // On dark themes: accent card = white text, normal card = near-white
        const textColor: string = isLight
          ? "#1e293b"
          : (isAccentCard ? "#fff7f7" : "rgb(255, 241, 242)");

        const cardStyle: React.CSSProperties = {
          width: "100%",
          maxWidth: item.scale && item.scale > 1 ? "860px" : "800px",
          justifySelf: alignments[idx % alignments.length],
          minHeight: "176px",
          borderRadius: item.borderRadius || "22px",
          padding: resolvePadding(item.padding || "20px 24px 22px", paddingScale),
          background: isAccentCard
            ? (isLight
              ? `linear-gradient(rgba(${rgb}, 0.12), rgba(${rgb}, 0.06))`
              : `linear-gradient(rgba(${rgb}, 0.22), rgba(${rgb}, 0.08))`)
            : (isLight
              ? "rgba(255,255,255,0.72)"
              : "rgba(255, 255, 255, 0.03)"),
          border: `1px solid ${colors.borderRgba}`,
          boxShadow: isAccentCard
            ? `rgba(0,0,0,0.22) 0px 18px 40px, rgba(${rgb}, 0.18) 0px 0px 28px`
            : (item.useThemeBorder
              ? `rgba(0,0,0,0.22) 0px 20px 48px, rgba(253, 230, 138, 0.14) 0px 0px 28px`
              : `rgba(0,0,0,0.22) 0px 18px 40px`),
          backdropFilter: `blur(${item.backdropBlur || "6px"}) saturate(1.06)`,
          display: "grid",
          gap: "14px",
          alignContent: "space-between",
          transform: `rotate(${rotation}deg) scale(${item.scale || 1})`,
          boxSizing: "border-box"
        };

        const animConfig = getAnimationConfig(comp, idx, "slide-up", 0.1 + idx * 0.15, t);

        return (
          <AnimatedBlock
            key={comp.id || idx}
            animation={animConfig.animation}
            delaySeconds={animConfig.delay}
          >
            <div style={cardStyle}>
              {/* Top row: badge pill + accent divider line */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                alignItems: "center",
                gap: "14px"
              }}>
                {/* Badge pill */}
                <div style={{
                  minWidth: "108px",
                  padding: "10px 12px 8px",
                  borderRadius: "999px",
                  background: badgeBg,
                  border: `1px solid ${badgeBorder}`,
                  fontSize: "15px",
                  fontWeight: 900,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: badgeColor,
                  textAlign: "center",
                  fontFamily: styles.fontFamily,
                  whiteSpace: "nowrap"
                }}>
                  {badgeText}
                </div>

                {/* Accent horizontal line */}
                <div style={{
                  height: "4px",
                  borderRadius: "999px",
                  background: lineGradient
                }} />
              </div>

              {/* Main text content */}
              <div style={{
                fontSize: `${Math.round(36 * fontScale)}px`,
                lineHeight: 1.06,
                fontWeight: isAccentCard ? 820 : 760,
                color: textColor,
                textAlign: "left",
                fontFamily: styles.fontFamily,
                textShadow: isAccentCard ? undefined : (item.useThemeBorder ? `rgba(253, 230, 138, 0.157) 0px 0px 20px` : undefined)
              }}>
                {mainText}
              </div>
            </div>
          </AnimatedBlock>
        );
      })}
    </div>
  );
};
