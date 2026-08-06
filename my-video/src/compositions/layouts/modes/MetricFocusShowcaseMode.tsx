import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { CategoryPill } from "../../../components/atoms/VideoAtoms";

function parseNumbers(valueStr: any): { prefix: string; n1: number; n2: number | null; suffix: string } {
  const str = String(valueStr || "").trim();
  if (!str) return { prefix: "", n1: 0, n2: null, suffix: "" };
  
  // Look for range "X - Y", "X đến Y", "X to Y" (with decimals/dots)
  const rangeRegex = /(\d+(?:[.,]\d+)?)\s*(?:-|đến|to)\s*(\d+(?:[.,]\d+)?)/i;
  const match = str.match(rangeRegex);
  
  if (match) {
    const rawN1 = parseFloat(match[1].replace(/\./g, "").replace(/,/g, "."));
    const rawN2 = parseFloat(match[2].replace(/\./g, "").replace(/,/g, "."));
    const matchIndex = str.indexOf(match[0]);
    const prefix = str.substring(0, matchIndex).trim();
    const suffix = str.substring(matchIndex + match[0].length).trim();
    return {
      prefix,
      n1: isNaN(rawN1) ? 0 : rawN1,
      n2: isNaN(rawN2) ? 0 : rawN2,
      suffix
    };
  }
  
  // Single number case
  const singleRegex = /(\d+(?:[.,]\d+)?)/;
  const singleMatch = str.match(singleRegex);
  if (singleMatch) {
    const rawN = parseFloat(singleMatch[1].replace(/\./g, "").replace(/,/g, "."));
    const matchIndex = str.indexOf(singleMatch[0]);
    const prefix = str.substring(0, matchIndex).trim();
    const suffix = str.substring(matchIndex + singleMatch[0].length).trim();
    return {
      prefix,
      n1: isNaN(rawN) ? 0 : rawN,
      n2: null,
      suffix
    };
  }
  
  return { prefix: "", n1: 0, n2: null, suffix: str };
}

export const MetricFocusShowcaseMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
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
      const metricRegex = /(\d+(?:\s*(?:-|đến|to)\s*\d+)?\s*(?:triệu|tr|sao|k|%|usd|đ|vnd|triệu\/tháng|fork|tools|skills)?)/i;
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
    ] as any[];
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
    ] as any[];
  }

  // Animations configuration
  const countStart = Math.round(0.8 * fps);
  
  const { prefix, n1, n2, suffix } = parseNumbers(metricValue);
  const hasDigits = /\d+/.test(metricValue);

  // Number counting interpolation
  const animN1 = Math.round(interpolate(frame - countStart, [0, 25], [0, n1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  }));

  const animN2 = n2 !== null ? Math.round(interpolate(frame - countStart, [0, 25], [0, n2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  })) : null;

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: t.container?.maxWidth || "940px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "28px",
    boxSizing: "border-box",
    zIndex: 5,
    paddingLeft: "20px"
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
            fontFamily={styles.fontFamily}
          />
        </AnimatedBlock>
      )}

      {/* 2. Main Metric (Side-by-side Layout) */}
      {metricValue && (
        <AnimatedBlock animation="scale-in" delaySeconds={0.3}>
          <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "24px",
            marginTop: "10px",
            marginBottom: "10px",
            width: "100%"
          }}>
            {/* Left huge orange count-up number */}
            <div style={{
              fontSize: `${Math.round(210 * fontScale)}px`,
              lineHeight: 0.95,
              fontWeight: 950,
              letterSpacing: "-0.06em",
              color: "#f97316", // Orange accent
              fontFamily: styles.fontFamily,
              textShadow: "0 8px 32px rgba(249, 115, 22, 0.3)",
              display: "flex",
              alignItems: "baseline",
              flexShrink: 0
            }}>
              {hasDigits ? (
                <>
                  {prefix && <span style={{ marginRight: "4px" }}>{prefix}</span>}
                  <span>
                    {n2 !== null && animN2 !== null ? `${animN1.toLocaleString("vi-VN")} - ${animN2.toLocaleString("vi-VN")}` : animN1.toLocaleString("vi-VN")}
                  </span>
                  {suffix && (
                    <span style={{
                      fontSize: `${Math.round(110 * fontScale)}px`,
                      fontWeight: 900,
                      color: "#f97316",
                      marginLeft: "8px",
                      textTransform: "lowercase"
                    }}>
                      {suffix}
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "#f97316" }}>{metricValue}</span>
              )}
            </div>

            {/* Right stacked subtext */}
            {metricSubtext && (
              <AnimatedBlock animation="slide-left" delaySeconds={0.5}>
                <div style={{
                  fontSize: `${Math.round(52 * fontScale)}px`,
                  fontWeight: 900,
                  color: isLight ? "#1e293b" : "#f8fafc",
                  fontFamily: styles.fontFamily,
                  textAlign: "left",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                  maxWidth: "500px",
                  wordBreak: "break-word"
                }}>
                  {metricSubtext}
                </div>
              </AnimatedBlock>
            )}
          </div>
        </AnimatedBlock>
      )}

      {/* 3. Stacked Badges (Pills) */}
      {badgeComps.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
          {badgeComps.map((badgeComp, bIdx) => {
            const badges = badgeComp.data?.badges || [];
            return (
              <AnimatedBlock key={badgeComp.id} animation="slide-up" delaySeconds={0.45 + bIdx * 0.15}>
                <div style={{ display: "flex", justifyContent: "flex-start", gap: "14px", flexWrap: "wrap", width: "100%" }}>
                  {badges.map((badge: string, idx: number) => {
                    const isOrangeRow = bIdx % 2 === 0;
                    return (
                      <span key={idx} style={{
                        borderRadius: "24px",
                        padding: "10px 20px",
                        background: isOrangeRow ? "rgba(249, 115, 22, 0.08)" : "rgba(20, 184, 166, 0.08)",
                        border: `1px solid ${isOrangeRow ? "rgba(249, 115, 22, 0.25)" : "rgba(20, 184, 166, 0.25)"}`,
                        color: isOrangeRow ? "#f97316" : "#2dd4bf",
                        fontWeight: 800,
                        fontSize: "22px",
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
          <div style={{
            background: isLight ? "rgba(0, 0, 0, 0.025)" : "rgba(10, 20, 35, 0.5)",
            border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "24px 30px",
            boxShadow: "rgba(0, 0, 0, 0.16) 0px 10px 30px",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            width: "100%",
            maxWidth: "760px",
            boxSizing: "border-box"
          }}>
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

              // Staggered premium visual colors
              const progressColors = ["#f97316", "#ef4444", "#2dd4bf", "#fbbf24"];
              const progressBarColor = progressColors[idx % progressColors.length];
              const progressRgb = idx % 4 === 0 ? "249, 115, 22" : (idx % 4 === 1 ? "239, 68, 68" : (idx % 4 === 2 ? "45, 212, 191" : "251, 191, 36"));

              return (
                <div key={cardComp.id} style={{ display: "grid", gap: "8px", width: "100%" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    width: "100%"
                  }}>
                    <span style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: isLight ? "#1e293b" : "#f8fafc",
                      fontFamily: styles.fontFamily
                    }}>
                      {cardText}
                    </span>
                    <span style={{
                      fontSize: "20px",
                      fontWeight: 900,
                      color: progressBarColor,
                      fontFamily: styles.fontFamily
                    }}>
                      {cardValue}
                    </span>
                  </div>
                  
                  {/* Progress Track */}
                  <div style={{
                    height: "10px",
                    borderRadius: "6px",
                    background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.07)",
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
                      boxShadow: `0 0 8px rgba(${progressRgb}, 0.4)`
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
