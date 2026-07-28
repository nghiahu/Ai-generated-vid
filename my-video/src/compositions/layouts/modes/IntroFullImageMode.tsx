import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const IntroFullImageMode: React.FC<ModeRendererProps> = ({
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

  // Category badge
  const categoryText = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");
  const hasCategory = !!categoryText;

  // Limit rendering to existing otherComps (max 3 pills) without hardcoded fallbacks
  const renderedPills = otherComps.slice(0, 3).map((comp, idx) => {
    return {
      num: `0${idx + 1}`,
      text: comp?.data?.text?.trim() || "",
      isHighlighted: idx === 0
    };
  }).filter(p => p.text !== "");

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      width: "100%",
      maxWidth: "920px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box"
    }}>

      {/* Category Pill Tag */}
      {hasCategory && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.15}>
          <div style={{
            width: "fit-content",
            borderRadius: "999px",
            padding: "10px 16px",
            background: isLight ? "rgba(0,0,0,0.05)" : "rgba(2, 6, 23, 0.78)",
            color: accentColor,
            border: `1px solid rgba(${rgb}, 0.38)`,
            fontSize: "18px",
            fontWeight: 900,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            boxShadow: isLight ? "none" : `rgba(0, 0, 0, 0.28) 0px 18px 40px, rgba(${rgb}, 0.12) 0px 0px 22px`,
            backdropFilter: "blur(12px)",
            marginBottom: "24px",
            fontFamily: styles.fontFamily
          }}>
            {categoryText}
          </div>
        </AnimatedBlock>
      )}

      {/* Giant Main Title */}
      <AnimatedBlock animation="scale-in" delaySeconds={0.3}>
        <div style={{
          fontSize: `${Math.round(86 * fontScale)}px`,
          lineHeight: 1.32,
          fontWeight: 900,
          letterSpacing: "-0.075em",
          color: isLight ? "#1f2937" : "rgb(248, 250, 252)",
          textTransform: "uppercase",
          fontFamily: styles.fontFamily,
          textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.62) 0px 22px 54px, rgba(${rgb}, 0.15) 0px 0px 34px`,
          marginBottom: "28px"
        }}>
          {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
        </div>
      </AnimatedBlock>

      {/* Horizontal Divider Line */}
      <AnimatedBlock animation="scale-in" delaySeconds={0.4}>
        <div style={{
          width: "220px",
          height: "6px",
          borderRadius: "999px",
          background: `linear-gradient(90deg, ${accentColor}, rgb(253, 230, 138))`,
          boxShadow: `rgba(${rgb}, 0.19) 0px 0px 28px`,
          marginBottom: "64px"
        }} />
      </AnimatedBlock>

      {/* Horizontal Pills Row */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        width: "100%"
      }}>
        {renderedPills.map((pill, idx) => {
          const comp = otherComps[idx];
          const animConfig = comp
            ? getAnimationConfig(comp, idx, "slide-up", 0.5 + idx * 0.12, t)
            : { animation: "slide-up" as const, delay: 0.5 + idx * 0.12 };

          const isHighlighted = pill.isHighlighted;

          // Theme colors for the sub-pills
          let pillBg = "";
          let pillBorder = "";
          let pillShadow = "";
          let pillTextColor = "";
          let dotColor = "";

          if (isHighlighted) {
            pillBg = isLight
              ? `linear-gradient(135deg, rgba(255,255,255,0.98), rgba(${rgb}, 0.1))`
              : `linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(${rgb}, 0.15))`;
            pillBorder = `1.5px solid ${accentColor}`;
            pillShadow = isLight
              ? `rgba(0,0,0,0.1) 0px 12px 28px`
              : `rgba(0, 0, 0, 0.44) 0px 20px 48px, rgba(${rgb}, 0.2) 0px 0px 24px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset`;
            pillTextColor = isLight ? "#0f172a" : "rgb(248, 250, 252)";
            dotColor = accentColor;
          } else {
            pillBg = isLight
              ? "rgba(255, 255, 255, 0.92)"
              : "rgba(15, 23, 42, 0.72)";
            pillBorder = isLight
              ? "1px solid rgba(0,0,0,0.06)"
              : `1px solid rgba(${rgb}, 0.28)`;
            pillShadow = isLight
              ? "rgba(0, 0, 0, 0.04) 0px 8px 18px"
              : `rgba(0, 0, 0, 0.3) 0px 12px 30px, rgba(255, 255, 255, 0.05) 0px 0px 0px 1px inset`;
            pillTextColor = isLight ? "rgba(0, 0, 0, 0.76)" : "rgba(255, 255, 255, 0.76)";
            dotColor = `rgba(${rgb}, 0.4)`;
          }

          return (
            <div key={idx}>
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                <div style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "10px",
                  borderRadius: "18px",
                  padding: "14px 22px",
                  background: pillBg,
                  border: pillBorder,
                  boxShadow: pillShadow,
                  backdropFilter: "blur(12px)",
                  boxSizing: "border-box"
                }}>
                  {/* Glowing dot */}
                  <span style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "999px",
                    background: dotColor,
                    boxShadow: isHighlighted ? `rgba(${rgb}, 0.8) 0px 0px 12px` : "none"
                  }} />

                  {/* Step number */}
                  <span style={{
                    fontSize: "13px",
                    fontWeight: 900,
                    color: isHighlighted ? accentColor : `rgba(${rgb}, 0.76)`,
                    fontFamily: styles.fontFamily
                  }}>
                    {pill.num}
                  </span>

                  {/* Text value */}
                  <span style={{
                    fontSize: `${Math.round(26 * fontScale)}px`,
                    fontWeight: 900,
                    color: pillTextColor,
                    textTransform: "uppercase",
                    letterSpacing: "-0.02em",
                    fontFamily: styles.fontFamily
                  }}>
                    {pill.text}
                  </span>
                </div>
              </AnimatedBlock>
            </div>
          );
        })}
      </div>

    </div>
  );
};
