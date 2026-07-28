import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const DossierNotesMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  voiceover,
  titleText,
  theme,
  highlightWords
}) => {
  const visibleComps = otherComps.slice(0, 3);
  const cardTitle = titleText || t.positions[1]?.nestedStructure?.titleText || "SUMMARY";
  const descText = voiceover || (otherComps[3] ? otherComps[3].data.text : "");

  const yellowColor = "#FDE68A";
  const yellowRgb = "253, 230, 138";

  const containerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1.25fr 0.9fr",
    gap: "18px",
    width: "100%",
    maxWidth: t.container.maxWidth || "1000px",
    zIndex: 5,
    boxSizing: "border-box",
    alignItems: "stretch"
  };

  const leftCardStyle: React.CSSProperties = {
    display: "grid",
    gap: "14px",
    borderRadius: "28px",
    padding: resolvePadding("24px", paddingScale),
    background: isLight 
      ? "rgba(255, 255, 255, 0.72)"
      : "linear-gradient(rgba(255, 255, 255, 0.047), rgba(255, 255, 255, 0.02))",
    border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: `rgba(0, 0, 0, 0.2) 0px 24px 58px`,
    backdropFilter: "blur(8px) saturate(1.08)",
    boxSizing: "border-box",
    height: "100%"
  };

  const rightCardStyle: React.CSSProperties = {
    borderRadius: "28px",
    padding: resolvePadding("26px 24px", paddingScale),
    background: isLight
      ? "rgba(255, 255, 255, 0.85)"
      : "linear-gradient(rgba(18, 10, 10, 0.34), rgba(8, 10, 18, 0.22))",
    borderLeft: `8px solid ${accentColor}`,
    borderTop: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.18)",
    borderRight: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.18)",
    borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.18)",
    backdropFilter: "blur(8px) saturate(1.08)",
    boxShadow: `rgba(0, 0, 0, 0.2) 0px 24px 58px`,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "390px",
    boxSizing: "border-box",
    height: "100%",
    textAlign: "left"
  };

  const rotations = [-2.4, 1.6, -1.2];

  return (
    <div style={containerStyle}>
      {/* Left Column - Stack of rotated evidence cards */}
      <AnimatedBlock animation="scale-in" delaySeconds={0.3}>
        <div style={leftCardStyle}>
          {visibleComps.map((comp, idx) => {
            const rot = rotations[idx % rotations.length];
            const isFirst = idx === 0;
            const isLast = idx === 2;

            // Border color settings matching mockup
            const cardBorder = isLight
              ? isFirst
                ? "1px solid rgba(0, 0, 0, 0.06)"
                : isLast
                  ? `1px solid rgba(${rgb}, 0.35)`
                  : `1px solid rgba(${rgb}, 0.2)`
              : isFirst 
                ? `1px solid rgba(${yellowRgb}, 0.2)`
                : isLast
                  ? `1px solid rgba(${rgb}, 0.4)`
                  : `1px solid rgba(${rgb}, 0.2)`;

            const cardShadow = isLight
              ? "none"
              : isLast
                ? `rgba(0, 0, 0, 0.22) 0px 18px 38px, rgba(${rgb}, 0.133) 0px 0px 24px`
                : "rgba(0, 0, 0, 0.22) 0px 18px 34px";

            const animConfig = getAnimationConfig(comp, idx, "slide-up", 0.4 + idx * 0.12, t);

            return (
              <AnimatedBlock key={comp.id || idx} animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={{
                  borderRadius: "18px",
                  padding: resolvePadding("20px 22px", paddingScale),
                  background: isLight 
                    ? isFirst
                      ? "rgba(0, 0, 0, 0.02)"
                      : `rgba(${rgb}, 0.06)`
                    : isFirst
                      ? "rgba(8, 10, 18, 0.34)"
                      : `rgba(${rgb}, 0.094)`,
                  border: cardBorder,
                  boxShadow: cardShadow,
                  display: "grid",
                  gap: "10px",
                  textAlign: "left",
                  transform: `rotate(${rot}deg)`,
                  transformOrigin: "center center"
                }}>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: isLight 
                      ? (isFirst ? "#854d0e" : accentColor)
                      : (isFirst ? yellowColor : accentColor),
                    fontFamily: styles.fontFamily
                  }}>
                    Evidence {idx + 1}
                  </div>
                  <div style={{
                    fontSize: `${Math.round(34 * fontScale)}px`,
                    lineHeight: 1.12,
                    fontWeight: 740,
                    letterSpacing: "-0.03em",
                    color: isLight ? "#1e293b" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase"
                  }}>
                    {comp.data.text}
                  </div>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      </AnimatedBlock>

      {/* Right Column - Summary Details card */}
      <AnimatedBlock animation="slide-up" delaySeconds={0.8}>
        <div style={rightCardStyle}>
          {/* Top block */}
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{
              fontSize: "13px",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: accentColor,
              fontFamily: styles.fontFamily
            }}>
              Summary
            </div>
            <div style={{
              fontSize: `${Math.round(44 * fontScale)}px`,
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              color: isLight ? "#0f172a" : "#ffffff",
              fontFamily: styles.fontFamily,
              textTransform: "uppercase"
            }}>
              {highlightHeadingText(cardTitle, accentColor, theme, highlightWords)}
            </div>
          </div>

          {/* Bottom block - Paragraph description */}
          {descText && (
            <div style={{
              fontSize: `${Math.round(21 * fontScale)}px`,
              lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.35,
              color: isLight ? "#334155" : "rgba(249, 247, 255, 0.8)",
              fontFamily: styles.fontFamily
            }}>
              {descText}
            </div>
          )}
        </div>
      </AnimatedBlock>
    </div>
  );
};
