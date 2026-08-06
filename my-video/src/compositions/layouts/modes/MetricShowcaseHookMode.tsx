import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";

function parseNumbers(valueStr: string): { n1: number; n2: number | null; suffix: string } {
  if (!valueStr) return { n1: 0, n2: null, suffix: "" };
  
  // Look for range "X - Y", "X đến Y", "X to Y" (with decimals/dots)
  const rangeRegex = /(\d+(?:[.,]\d+)?)\s*(?:-|đến|to)\s*(\d+(?:[.,]\d+)?)/i;
  const match = valueStr.match(rangeRegex);
  
  if (match) {
    const rawN1 = parseFloat(match[1].replace(/\./g, "").replace(/,/g, "."));
    const rawN2 = parseFloat(match[2].replace(/\./g, "").replace(/,/g, "."));
    const suffix = valueStr.replace(match[0], "").trim();
    return {
      n1: isNaN(rawN1) ? 0 : rawN1,
      n2: isNaN(rawN2) ? 0 : rawN2,
      suffix
    };
  }
  
  // Single number case
  const singleRegex = /(\d+(?:[.,]\d+)?)/;
  const singleMatch = valueStr.match(singleRegex);
  if (singleMatch) {
    const rawN = parseFloat(singleMatch[1].replace(/\./g, "").replace(/,/g, "."));
    const suffix = valueStr.replace(singleMatch[0], "").trim();
    return {
      n1: isNaN(rawN) ? 0 : rawN,
      n2: null,
      suffix
    };
  }
  
  return { n1: 0, n2: null, suffix: valueStr };
}

export const MetricShowcaseHookMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  titleText,
  highlightWords
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find components based on their parsed role or content
  const terminalComp = otherComps.find(c => c.type === "terminal" || (c.data?.text && c.data.text.startsWith("$")));
  
  const badgeComp = otherComps.find(c => c.type === "badge_row" || c.data?.badges?.length > 0);
  
  const highlightComp = otherComps.find(c => c.type === "subheader");

  // Robust Metric Component parsing
  let metricValue = "";
  let metricSubtext = "";
  let usedMetricCompId = "";

  // 1. Check if there is an explicit hero_metric component
  const explicitMetric = otherComps.find(c => c.type === "hero_metric");
  if (explicitMetric) {
    metricValue = explicitMetric.data?.value || "";
    metricSubtext = explicitMetric.data?.subtext || "";
    usedMetricCompId = explicitMetric.id;
  } else {
    // 2. Fallback: Search for first text point containing a digit (e.g. "Lương khởi điểm 20 triệu")
    const metricCandidate = otherComps.find(c => c.data?.text && /\d+/.test(c.data.text));
    if (metricCandidate) {
      const text = metricCandidate.data.text;
      // Regex to match ranges like "15 - 20 triệu", "15 đến 20 triệu", "4.600 sao", "20 triệu", "18 tools"
      const metricRegex = /(\d+(?:\s*(?:-|đến|to)\s*\d+)?\s*(?:triệu|tr|sao|k|%|usd|đ|vnd|triệu\/tháng|fork|tools|skills)?)/i;
      const match = text.match(metricRegex);
      if (match) {
        metricValue = match[0].trim();
        // The remaining text becomes the subtext (e.g. "Lương khởi điểm 20 triệu" -> "Lương khởi điểm")
        metricSubtext = text.replace(match[0], "").replace(/^[-\s:.,=]+/g, "").replace(/[-\s:.,=]+$/g, "").trim();
        usedMetricCompId = metricCandidate.id;
      }
    }
  }

  // 3. Fallback to highlightWords if metric is still not resolved
  if (!metricValue && highlightWords && highlightWords.length > 0 && /\d+/.test(highlightWords[0])) {
    metricValue = highlightWords[0];
    metricSubtext = "Thông số nổi bật";
  }

  // Secondary Cards: Use all text components that were NOT used as a metric, terminal, badge, or highlight
  const cardComps = otherComps.filter(c => 
    c.id !== usedMetricCompId && 
    c.type !== "terminal" && 
    c.type !== "badge_row" && 
    c.type !== "hero_metric" && 
    c.type !== "subheader" &&
    c.data?.text &&
    !c.data.text.startsWith("$")
  );

  // Animations start config
  const countStart = Math.round(0.8 * fps);
  
  const { n1, n2, suffix } = parseNumbers(metricValue);

  // Number counting interpolation
  const animN1 = Math.round(interpolate(frame - countStart, [0, 30], [0, n1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  }));

  const animN2 = n2 !== null ? Math.round(interpolate(frame - countStart, [0, 30], [0, n2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  })) : null;

  // Visual Theme Colors matching reference: White, Orange, Teal Green
  const metricColor = "#f97316"; // Bright Orange
  const metricRgb = "249, 115, 22";
  const cardTealColor = isLight ? "#0d9488" : "#2dd4bf"; // Teal / Mint Green

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: t.container?.maxWidth || "940px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start", // Left align
    gap: "28px",
    boxSizing: "border-box",
    zIndex: 5,
    paddingLeft: "20px"
  };

  return (
    <div style={containerStyle}>
      {/* 1. Title / Heading (Left aligned, capitalized white) */}
      {titleText && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.15}>
          <div style={{
            fontSize: `${Math.round(108 * fontScale)}px`,
            lineHeight: 0.95,
            fontWeight: 950,
            letterSpacing: "-0.07em",
            textAlign: "left",
            textTransform: "uppercase",
            color: isLight ? "#1e293b" : "#ffffff",
            fontFamily: styles.fontFamily,
            textShadow: isLight ? "none" : `0 4px 24px rgba(255, 255, 255, 0.18)`,
            marginBottom: "10px",
            width: "100%",
            wordBreak: "break-word"
          }}>
            {titleText}
          </div>
        </AnimatedBlock>
      )}

      {/* 2. Badges / Pills (Left aligned) */}
      {badgeComp && badgeComp.data?.badges && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.3}>
          <div style={{ display: "flex", justifyContent: "flex-start", gap: "14px", flexWrap: "wrap", marginBottom: "10px", width: "100%" }}>
            {badgeComp.data.badges.map((badge: string, idx: number) => {
              const hasStar = badge.toLowerCase().includes("sao") || badge.toLowerCase().includes("star");
              return (
                <span key={idx} style={{
                  borderRadius: "24px",
                  padding: "10px 20px",
                  background: isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.14)"}`,
                  color: isLight ? "#334155" : "#e2e8f0",
                  fontWeight: 800,
                  fontSize: "20px",
                  fontFamily: styles.fontFamily,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}>
                  {hasStar && <span style={{ color: "#fbbf24" }}>★</span>}
                  <span>{badge}</span>
                </span>
              );
            })}
          </div>
        </AnimatedBlock>
      )}

      {/* 3. Subheader / Highlight Alert Bar (Left aligned) */}
      {highlightComp && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.45}>
          <div style={{
            borderRadius: "16px",
            border: `1.5px solid ${accentColor}`,
            boxShadow: `0 0 20px rgba(${rgb}, 0.25)`,
            padding: "14px 28px",
            background: isLight ? `rgba(${rgb}, 0.05)` : "rgba(0,0,0,0.4)",
            color: accentColor,
            fontSize: "22px",
            fontWeight: 800,
            textAlign: "left",
            fontFamily: styles.fontFamily,
            letterSpacing: "0.02em",
            maxWidth: "760px",
            boxSizing: "border-box"
          }}>
            🔥 {highlightComp.data.text}
          </div>
        </AnimatedBlock>
      )}

      {/* 4. Metric Area (Left aligned, Bright Orange counter) */}
      {metricValue && (
        <AnimatedBlock animation="scale-in" delaySeconds={0.6}>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            marginTop: "15px",
            marginBottom: "15px",
            width: "100%"
          }}>
            <div style={{
              fontSize: `${Math.round(124 * fontScale)}px`,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.06em",
              color: metricColor,
              fontFamily: styles.fontFamily,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "flex-start",
              width: "100%",
              textShadow: `0 8px 30px rgba(${metricRgb}, 0.25)`
            }}>
              <span>
                {n2 !== null ? `${animN1.toLocaleString("vi-VN")} - ${animN2.toLocaleString("vi-VN")}` : animN1.toLocaleString("vi-VN")}
              </span>
              {suffix && (
                <span style={{
                  fontSize: `${Math.round(72 * fontScale)}px`,
                  fontWeight: 900,
                  color: metricColor,
                  letterSpacing: "-0.02em",
                  marginLeft: "12px",
                  textTransform: "lowercase"
                }}>
                  {suffix}
                </span>
              )}
            </div>
            {metricSubtext && (
              <div style={{
                fontSize: "22px",
                fontWeight: 800,
                color: isLight ? "#475569" : "#94a3b8",
                letterSpacing: "0.05em",
                marginTop: "14px",
                fontFamily: styles.fontFamily,
                textAlign: "left"
              }}>
                {metricSubtext}
              </div>
            )}
          </div>
        </AnimatedBlock>
      )}

      {/* 5. Secondary Info Cards (Stack of multiple cards, Teal/Mint Green colored) */}
      {cardComps.map((cardComp, idx) => {
        const cardText = cardComp.data?.text || "";
        let cardPrefix = cardText;
        let cardSuffix = "";
        if (cardText.includes("+")) {
          const parts = cardText.split("+");
          cardPrefix = parts[0].trim();
          cardSuffix = "+ " + parts.slice(1).join("+").trim();
        } else if (cardText.includes("-")) {
          const parts = cardText.split("-");
          cardPrefix = parts[0].trim();
          cardSuffix = "- " + parts.slice(1).join("-").trim();
        } else {
          const numPrefixMatch = cardText.match(/^(\d+\s*\w+)\s+(.*)$/);
          if (numPrefixMatch) {
            cardPrefix = numPrefixMatch[1];
            cardSuffix = numPrefixMatch[2];
          }
        }
        return (
          <AnimatedBlock key={cardComp.id} animation="slide-up" delaySeconds={0.7 + idx * 0.15}>
            <div style={{
              borderRadius: "24px",
              padding: "20px 30px",
              background: isLight ? "rgba(13, 148, 136, 0.05)" : "rgba(20, 184, 166, 0.08)",
              border: `1px solid ${isLight ? "rgba(13, 148, 136, 0.2)" : "rgba(20, 184, 166, 0.2)"}`,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: cardSuffix ? "space-between" : "flex-start",
              gap: "16px",
              width: "100%",
              maxWidth: "760px",
              boxSizing: "border-box",
              backdropFilter: "blur(8px)"
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: 900,
                color: cardTealColor,
                fontFamily: styles.fontFamily,
                whiteSpace: "nowrap"
              }}>
                {cardPrefix}
              </div>
              {cardSuffix && (
                <div style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: isLight ? "#475569" : "#94a3b8",
                  fontFamily: styles.fontFamily,
                  lineHeight: 1.25,
                  textAlign: "left"
                }}>
                  {cardSuffix}
                </div>
              )}
            </div>
          </AnimatedBlock>
        );
      })}

      {/* 6. Terminal Prompt (Left aligned) */}
      {terminalComp && terminalComp.data?.text && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.9 + cardComps.length * 0.15}>
          <div style={{
            borderRadius: "14px",
            padding: "18px 24px",
            background: "#080c14",
            border: `1px solid ${accentColor}`,
            boxShadow: `0 0 10px rgba(${rgb}, 0.15)`,
            fontFamily: "monospace",
            fontSize: "20px",
            fontWeight: 700,
            color: accentColor,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            maxWidth: "600px",
            boxSizing: "border-box",
            marginTop: "10px"
          }}>
            <span style={{ color: "#f43f5e" }}>$</span>
            <span>{terminalComp.data.text}</span>
          </div>
        </AnimatedBlock>
      )}
    </div>
  );
};
