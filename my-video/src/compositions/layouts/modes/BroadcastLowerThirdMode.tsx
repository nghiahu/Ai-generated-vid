import React from "react";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig, 
  renderNestedCardContent 
} from "./LayoutNestedRenderers";

export const BroadcastLowerThirdMode: React.FC<ModeRendererProps> = ({
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
  gap,
  activeCardTextColor,
  activeCardBadgeColor,
  inactiveCardTextColor
}) => {
  const topComp = otherComps[0];
  const listItems = otherComps.slice(1);

  if (!topComp) return null;

  const itemStyleSetting = t.items.itemStyles[0] || { fontSize: "28px", fontWeight: "800" };
  const pos = resolvedPositions[0] || { left: "0px", top: "0px", width: "100%", height: "auto" };

  const containerStyle: React.CSSProperties = {
    display: "grid",
    gap: gap !== undefined ? `${Math.min(gap, 18)}px` : "18px",
    width: "100%",
    maxWidth: "860px",
    zIndex: 5,
    textAlign: "left"
  };

  const cardStyle: React.CSSProperties = {
    borderRadius: itemStyleSetting.borderRadius || "30px",
    padding: resolvePadding(itemStyleSetting.padding || "20px 22px", paddingScale),
    background: itemStyleSetting.useAccentBg
      ? `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
      : styles.cardStyle.background || styles.cardStyle.backgroundColor,
    border: itemStyleSetting.useAccentBg ? "none" : styles.cardStyle.border || `1px solid rgba(${rgb}, 0.4)`,
    boxShadow: itemStyleSetting.useAccentBg ? "none" : styles.cardStyle.boxShadow || `rgba(0, 0, 0, 0.3) 0px 24px 60px`,
    backdropFilter: "blur(16px) saturate(1.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
    width: "100%",
    minHeight: "180px"
  };

  const borderListStyle: React.CSSProperties = {
    display: "grid",
    gap: "9px",
    paddingLeft: "20px",
    borderLeft: `4px solid ${accentColor}`,
    boxSizing: "border-box",
    textAlign: "left",
    marginTop: "8px"
  };

  const cardAnim = getAnimationConfig(topComp, 0, "scale-in", 0.3, t);

  return (
    <div style={containerStyle}>
      {/* Top Card */}
      <AnimatedBlock animation={cardAnim.animation} delaySeconds={cardAnim.delay}>
        <div style={cardStyle}>
          {pos.nestedStructure ? (
            renderNestedCardContent({
              ns: {
                ...pos.nestedStructure,
                badgeText: otherComps[1]?.data.text || pos.nestedStructure.badgeText
              },
              comp: topComp,
              idx: 0,
              isAccentCard: itemStyleSetting.useAccentBg,
              parentDelay: cardAnim.delay,
              otherComps,
              accentColor,
              rgb,
              isLight,
              darkAccentColor,
              styles,
              fontScale,
              activeCardTextColor,
              activeCardBadgeColor,
              inactiveCardTextColor
            })
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ fontSize: getDynamicFontSize(topComp.data.text, 28, fontScale), fontWeight: 800, color: activeCardTextColor, fontFamily: styles.fontFamily }}>
                {topComp.data.text}
              </div>
            </div>
          )}
        </div>
      </AnimatedBlock>

      {/* Bottom list items with left accent border */}
      {listItems.length > 0 && (
        <AnimatedBlock animation="slide-up" delaySeconds={cardAnim.delay + 0.2}>
          <div style={borderListStyle}>
            {listItems.map((comp, idx) => {
              const isSecondLine = idx === 1;
              const size = idx === 0 ? 44 : 30;
              const weight = isSecondLine ? 720 : 840;
              const textColor = isSecondLine 
                ? (isLight ? darkAccentColor : "rgb(254, 202, 202)") 
                : (isLight ? "#0f172a" : "rgb(254, 242, 242)");
              const textShadow = !isSecondLine && !isLight 
                ? `rgba(${rgb}, 0.2) 0px 0px 22px` 
                : undefined;
              const itemAnim = getAnimationConfig(comp, idx, "slide-up", cardAnim.delay + 0.3 + idx * 0.1, t);

              return (
                <AnimatedBlock key={comp.id || idx} animation={itemAnim.animation} delaySeconds={itemAnim.delay}>
                  <div style={{
                    fontSize: `${Math.round(size * fontScale)}px`,
                    lineHeight: 1.08,
                    fontWeight: weight,
                    color: textColor,
                    textShadow: textShadow,
                    marginLeft: idx < 2 ? `${Math.round(16 * fontScale)}px` : "0px",
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase"
                  }}>
                    {comp.data.text}
                  </div>
                </AnimatedBlock>
              );
            })}
          </div>
        </AnimatedBlock>
      )}
    </div>
  );
};
