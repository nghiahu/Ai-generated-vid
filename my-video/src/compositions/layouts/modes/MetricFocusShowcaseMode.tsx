import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { CategoryPill } from "../../../components/atoms/VideoAtoms";
import { parseNumbers } from "../../../utils/numberParser";


export const MetricFocusShowcaseMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  isVertical,
  styles,
  fontScale,
  highlightWords,
  category
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 1. Resolve Metric and Subtext components
  let metricValue = "";
  let metricSubtext = "";
  let usedMetricCompId = "";

  const explicitMetric = otherComps.find(c => c.type === "hero_metric" || c.type === "metric");
  if (explicitMetric) {
    metricValue = explicitMetric.data?.value || explicitMetric.data?.text || "";
    metricSubtext = explicitMetric.data?.subtext || "";
    usedMetricCompId = explicitMetric.id;
  } else {
    // Search for first text point containing a digit as fallback
    const metricCandidate = otherComps.find(c => c.data?.text && /\d+/.test(c.data.text));
    if (metricCandidate) {
      const text = metricCandidate.data.text;
      const metricRegex = /(\d+(?:\s*(?:-|đến|to)\s*\d+)?\s*(?:triệu|tr|sao|k|%|usd|đ|vnd|triệu\/tháng|fork|tools|skills|b|m)?)/i;
      const match = text.match(metricRegex);
      if (match) {
        metricValue = match[0].trim();
        metricSubtext = text.replace(match[0], "").replace(/^[-\s:.,=]+/g, "").replace(/[-\s:.,=]+$/g, "").trim();
        usedMetricCompId = metricCandidate.id;
      }
    }
  }

  // Fallback to highlightWords if metric is still not resolved
  if (!metricValue && highlightWords && highlightWords.length > 0) {
    metricValue = highlightWords[0];
    metricSubtext = /\d+/.test(highlightWords[0]) ? "Thông số nổi bật" : "Từ khóa nổi bật";
  }

  // 2. Resolve Category Pill
  const cleanCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "") || (metricValue ? `${metricValue} ${metricSubtext}`.toUpperCase() : "");

  // 3. Filter Badge Rows (Pills in the middle)
  let badgeComps = otherComps.filter(c => c.type === "badge_row" || (c.data?.badges && c.data.badges.length > 0));
  if (badgeComps.length === 0) {
    badgeComps = [
      { id: "mock-badges-1", type: "badge_row", data: { badges: ["Python", "Java", "Go"] } },
      { id: "mock-badges-2", type: "badge_row", data: { badges: ["COBOL", "JCL", "ABAP"] } },
      { id: "mock-badges-3", type: "badge_row", data: { badges: ["Terraform", "Solidity"] } },
      { id: "mock-badges-4", type: "badge_row", data: { badges: ["77 CWE được map"] } }
    ] as (typeof otherComps);
  }

  // 4. Progress Card Components (Bottom cards)
  let cardComps = otherComps.filter(c => 
    c.id !== usedMetricCompId && 
    c.type === "card" &&
    c.data?.text
  );
  if (cardComps.length === 0) {
    cardComps = [
      { id: "mock-card-1", type: "card", data: { text: "Remediate S10", value: "$10", subtext: "60%" } },
      { id: "mock-card-2", type: "card", data: { text: "Detect S1-S9", value: "$25", subtext: "100%" } }
    ] as (typeof otherComps);
  }

  // Animations configuration
  const countStart = Math.round(0.8 * fps);
  
  const { prefix, n1, n2, suffix } = parseNumbers(metricValue);
  const hasDigits = /\d+/.test(metricValue);

  // Number counting interpolation
  const rawAnimN1 = interpolate(frame - countStart, [0, 25], [0, n1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });

  const rawAnimN2 = n2 !== null ? interpolate(frame - countStart, [0, 25], [0, n2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  }) : null;

  const isN1Decimal = n1 % 1 !== 0;
  let animN1Text = isN1Decimal 
    ? rawAnimN1.toFixed(1) 
    : Math.round(rawAnimN1).toLocaleString("vi-VN");
  if (isN1Decimal && metricValue.includes(",")) {
    animN1Text = animN1Text.replace(".", ",");
  }

  const isN2Decimal = n2 !== null && n2 % 1 !== 0;
  let animN2Text = n2 !== null 
    ? (isN2Decimal ? rawAnimN2.toFixed(1) : Math.round(rawAnimN2).toLocaleString("vi-VN")) 
    : "";
  if (isN2Decimal && metricValue.includes(",")) {
    animN2Text = animN2Text.replace(".", ",");
  }

  const isLongMetric = metricValue.length > 6;
  const useColumnLayout = isVertical && (!hasDigits || isLongMetric);

  const getDynamicFontSize = () => {
    const base = isVertical ? 250 : 210;
    const len = metricValue.length;
    if (hasDigits) {
      if (len > 8) return Math.round(base * 0.6 * fontScale);
      if (len > 5) return Math.round(base * 0.8 * fontScale);
      return Math.round(base * fontScale);
    } else {
      if (len > 20) return Math.round(base * 0.3 * fontScale);
      if (len > 15) return Math.round(base * 0.38 * fontScale);
      if (len > 10) return Math.round(base * 0.48 * fontScale);
      if (len > 6) return Math.round(base * 0.65 * fontScale);
      return Math.round(base * 0.85 * fontScale);
    }
  };

  const dynamicFontSize = getDynamicFontSize();

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: isVertical ? "100%" : (t.container?.maxWidth || "940px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: isVertical ? "52px" : "28px",
    boxSizing: "border-box",
    zIndex: 5,
    paddingLeft: isVertical ? "32px" : "20px",
    paddingRight: isVertical ? "32px" : "20px"
  };

  const resolvedCardStyle: React.CSSProperties = {
    ...styles.cardStyle,
    background: isLight
      ? `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 244, 246, 0.92) 100%)`
      : `linear-gradient(135deg, rgba(8, 17, 37, 0.72) 0%, rgba(3, 7, 18, 0.88) 100%)`, // Matches premium theme gradient
    boxShadow: isLight
      ? "0 10px 30px rgba(0, 0, 0, 0.04)"
      : `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px rgba(${rgb}, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.06)`, // Glowing shadow matching theme accent color
    display: "flex",
    flexDirection: "column",
    gap: isVertical ? "28px" : "18px",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    padding: isVertical ? "32px 40px" : "24px 30px"
  };

  return (
    <div style={containerStyle}>
      
      {/* 1. Category Pill */}
      {cleanCategory && (
        <AnimatedBlock animation="slide-down" delaySeconds={0.15}>
          <CategoryPill
            text={cleanCategory}
            bgRgba={isLight ? "rgba(0, 0, 0, 0.04)" : "rgba(255, 255, 255, 0.05)"}
            borderRgba={isLight ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)"}
            textRgba={accentColor}
            hasDot={true}
            dotRgba={accentColor}
            fontSize={isVertical ? "20px" : "17px"}
            fontFamily={styles.fontFamily}
          />
        </AnimatedBlock>
      )}

      {/* 2. Main Metric (Side-by-side or Stacked Layout) */}
      {metricValue && (
        <AnimatedBlock animation="scale-in" delaySeconds={0.3}>
          <div style={{
            display: "flex",
            flexDirection: useColumnLayout ? "column" : "row",
            alignItems: useColumnLayout ? "flex-start" : "center",
            justifyContent: "flex-start",
            gap: useColumnLayout ? "12px" : (isVertical ? "32px" : "24px"),
            marginTop: "10px",
            marginBottom: "10px",
            width: "100%"
          }}>
            {/* Left huge count-up number (accentColor from theme) */}
            <div style={{
              fontSize: `${dynamicFontSize}px`,
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: "-0.06em",
              color: accentColor,
              fontFamily: styles.fontFamily,
              textShadow: isLight ? "none" : `0 8px 32px rgba(${rgb}, 0.35)`,
              display: "flex",
              alignItems: "baseline",
              flexWrap: "nowrap",
              flexShrink: 0,
              wordBreak: "keep-all",
              maxWidth: "100%"
            }}>
              {hasDigits ? (
                <>
                  {prefix && <span style={{ marginRight: "4px" }}>{prefix}</span>}
                  <span>
                    {n2 !== null ? `${animN1Text} - ${animN2Text}` : animN1Text}
                  </span>
                  {suffix && (
                    <span style={{
                      fontSize: isVertical ? `${Math.round(130 * fontScale)}px` : `${Math.round(110 * fontScale)}px`,
                      fontWeight: 900,
                      color: accentColor,
                      marginLeft: "8px",
                      textTransform: "lowercase"
                    }}>
                      {suffix}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: accentColor }}>{metricValue}</span>
              )}
            </div>

            {/* Right stacked subtext */}
            {metricSubtext && (
              <AnimatedBlock animation="slide-left" delaySeconds={0.5}>
                <div style={{
                  fontSize: isVertical ? `${Math.round(64 * fontScale)}px` : `${Math.round(48 * fontScale)}px`,
                  fontWeight: 900,
                  color: isLight ? "#111111" : "#ffffff",
                  fontFamily: styles.fontFamily,
                  textAlign: "left",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  maxWidth: isVertical ? "550px" : "450px",
                  wordBreak: "break-word"
                }}>
                  {metricSubtext}
                </div>
              </AnimatedBlock>
            )}
          </div>
        </AnimatedBlock>
      )}

      {/* 3. Stacked Badges (Pills using theme tokens) */}
      {badgeComps.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          {badgeComps.map((badgeComp, bIdx) => {
            const badges = badgeComp.data?.badges || [];
            return (
              <AnimatedBlock key={badgeComp.id} animation="slide-up" delaySeconds={0.45 + bIdx * 0.15}>
                <div style={{ display: "flex", justifyContent: "flex-start", gap: "14px", flexWrap: "wrap", width: "100%" }}>
                  {badges.map((badge: string, idx: number) => {
                    const isOrangeRow = bIdx % 2 === 0;
                    
                    // Deriving colors to make pills highly readable and aligned with theme
                    const pillColor = isOrangeRow ? accentColor : (isLight ? "#334155" : "#e2e8f0");
                    const pillBg = isOrangeRow 
                      ? (isLight ? "rgba(0, 0, 0, 0.04)" : `rgba(${rgb}, 0.08)`) 
                      : (isLight ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.04)");
                    const pillBorder = isOrangeRow 
                      ? `rgba(${rgb}, 0.25)` 
                      : (isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)");

                    return (
                      <span key={idx} style={{
                        borderRadius: "24px",
                        padding: isVertical ? "12px 24px" : "8px 18px",
                        background: pillBg,
                        border: `1.5px solid ${pillBorder}`,
                        color: pillColor,
                        fontWeight: 800,
                        fontSize: isVertical ? "26px" : "20px",
                        fontFamily: styles.fontFamily,
                        display: "inline-flex",
                        alignItems: "center"
                      }}>
                        {badge}
                      </span>
                    );
                  })}
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      )}

      {/* 4. Bottom Progress Card Container */}
      {cardComps.length > 0 && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.7}>
          <div style={resolvedCardStyle}>
            {cardComps.map((cardComp, idx) => {
              const cardText = cardComp.data?.text || "";
              const cardValue = cardComp.data?.value || "";
              
              // Resolve percentage fill (default fallbacks if not a parsed percentage)
              let percentage = 75;
              if (idx === 0) percentage = 60;
              if (idx === 1) percentage = 100;
              if (idx === 2) percentage = 45;
              
              const pctMatch = (cardValue + " " + (cardComp.data?.subtext || "")).match(/(\d+)%/);
              if (pctMatch) {
                percentage = parseInt(pctMatch[1], 10);
              } else {
                const numMatch = cardValue.match(/(\d+)/);
                if (numMatch) {
                  const numVal = parseInt(numMatch[1], 10);
                  if (numVal > 0 && numVal <= 100) {
                    percentage = numVal;
                  }
                }
              }
              
              const barFill = interpolate(
                frame,
                [50 + idx * 5, 75 + idx * 5],
                [0, percentage],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) }
              );

              // Colors based on theme accent (first bar uses accentColor, second is standard soft red/coral alert)
              const progressBarColor = idx === 0 
                ? accentColor 
                : (isLight ? "#c2410c" : "#f87171"); // Accent or Soft red/coral for alert
              const progressRgb = idx === 0 
                ? rgb 
                : "239, 68, 68";

              return (
                <div key={cardComp.id} style={{ display: "grid", gap: "8px", width: "100%" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    width: "100%"
                  }}>
                    <span style={{
                      fontSize: isVertical ? "26px" : "22px",
                      fontWeight: 800,
                      color: isLight ? "#111111" : "#ffffff",
                      fontFamily: styles.fontFamily
                    }}>
                      {cardText}
                    </span>
                    <span style={{
                      fontSize: isVertical ? "24px" : "20px",
                      fontWeight: 900,
                      color: progressBarColor,
                      fontFamily: styles.fontFamily
                    }}>
                      {cardValue}
                    </span>
                  </div>
                  
                  {/* Progress Track */}
                  <div style={{
                    height: isVertical ? "14px" : "10px",
                    borderRadius: "6px",
                    background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)",
                    overflow: "hidden",
                    position: "relative",
                    width: "100%"
                  }}>
                    {/* Filled Bar */}
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${barFill}%`,
                      borderRadius: "6px",
                      background: progressBarColor,
                      boxShadow: isLight ? "none" : `0 0 8px rgba(${progressRgb}, 0.4)`
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </AnimatedBlock>
      )}
    </div>
  );
};
