import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig } from "./LayoutNestedRenderers";
import { parseNumbers as parseNumbersUtil } from "../../../utils/numberParser";
import { Terminal, Layers, Cpu, Target, Zap } from "lucide-react";

const parseCardContent = (comp: { data?: { text?: string; value?: string; subtext?: string } }) => {
  const text = comp.data?.text || "";
  const value = comp.data?.value || "";
  const subtext = comp.data?.subtext || "";

  if (value || subtext) {
    return { value, title: text, subtext };
  }

  // Matches metrics like "+100%", "2025", "360°", "100+" at the start
  const metricRegex = /^([+-]?\d+(?:\.\d+)?%?[+-°]?|[a-zA-Z]{1,3}\s*\d+)\s+([^-—:(]+)(?:[-—:(]+(.*)\)?)?$/i;
  const match = text.match(metricRegex);
  if (match) {
    return {
      value: match[1].trim(),
      title: match[2].trim(),
      subtext: match[3] ? match[3].replace(/\)$/, "").trim() : ""
    };
  }

  const splitMatch = text.match(/^([^—:-]+)\s*[—:-]\s*(.*)$/);
  if (splitMatch) {
    return {
      value: "",
      title: splitMatch[1].trim(),
      subtext: splitMatch[2].trim()
    };
  }

  return { value: "", title: text, subtext: "" };
};

const getCardTheme = (idx: number, isLight: boolean) => {
  switch (idx) {
    case 0:
      return {
        color: "#f97316",
        icon: <Terminal size={24} color="#f97316" />,
        bg: isLight ? "rgba(249, 115, 22, 0.05)" : "rgba(249, 115, 22, 0.08)",
        border: isLight ? "rgba(249, 115, 22, 0.2)" : "rgba(249, 115, 22, 0.3)"
      };
    case 1:
      return {
        color: "#3b82f6",
        icon: <Layers size={24} color="#3b82f6" />,
        bg: isLight ? "rgba(59, 130, 246, 0.05)" : "rgba(59, 130, 246, 0.08)",
        border: isLight ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.3)"
      };
    case 2:
      return {
        color: "#0d9488",
        icon: <Cpu size={24} color="#0d9488" />,
        bg: isLight ? "rgba(13, 148, 136, 0.05)" : "rgba(13, 148, 136, 0.08)",
        border: isLight ? "rgba(13, 148, 136, 0.2)" : "rgba(13, 148, 136, 0.3)"
      };
    case 3:
      return {
        color: "#eab308",
        icon: <Target size={24} color="#eab308" />,
        bg: isLight ? "rgba(234, 179, 8, 0.05)" : "rgba(234, 179, 8, 0.08)",
        border: isLight ? "rgba(234, 179, 8, 0.2)" : "rgba(234, 179, 8, 0.3)"
      };
    default:
      return {
        color: "#a855f7",
        icon: <Zap size={24} color="#a855f7" />,
        bg: isLight ? "rgba(168, 85, 247, 0.05)" : "rgba(168, 85, 247, 0.08)",
        border: isLight ? "rgba(168, 85, 247, 0.2)" : "rgba(168, 85, 247, 0.3)"
      };
  }
};

export const CircularProgressMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  isLight,
  styles,
  gap,
  titleText,
  accentColor,
  rgb
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  console.log("[CircularProgressMode] RENDER. otherComps:", otherComps);

  // 1. Search for percentage in title text first (e.g. "100% MCP Servers" -> 100)
  let targetValue = 0;
  let hasExtractedFromTitle = false;
  let metricComp: (typeof otherComps)[number] | null = null;
  const titlePctMatch = titleText ? titleText.match(/(\d+(?:\.\d+)?)\s*%/i) : null;

  if (titlePctMatch) {
    const val = parseInt(titlePctMatch[1], 10);
    if (!isNaN(val)) {
      targetValue = Math.min(100, Math.max(0, val));
      hasExtractedFromTitle = true;
    }
  }

  // Fallback to first point if not found in title
  if (!hasExtractedFromTitle) {
    metricComp = otherComps[0];
    const metricValueText = String(metricComp?.data?.value || metricComp?.data?.text || "0");
    const parsedValue = parseInt(metricValueText.replace(/[^\d]/g, ""), 10);
    targetValue = isNaN(parsedValue) ? 0 : Math.min(100, Math.max(0, parsedValue));
  }

  // 2. Extract remaining comps for cards underneath
  // If we got the metric from the title, we can display all points as cards (slice 0 to 4)
  // Otherwise, we skip the first point as it is used for the circle (slice 1 to 5)
  const cardComps = hasExtractedFromTitle ? otherComps.slice(0, 4) : otherComps.slice(1, 5);

  // 3. SVG Circle Math
  const R = 70;
  const C = 2 * Math.PI * R; // ~439.82

  const startFrame = Math.round(0.3 * fps);
  const durationFrames = Math.round(1.0 * fps);

  // Smooth ease-out-quint animation for circle and text counter
  const progress = interpolate(frame - startFrame, [0, durationFrames], [0, targetValue], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 1, 0.5, 1),
  });

  const strokeDashoffset = C * (1 - progress / 100);

  // Container styling
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: t.container?.maxWidth || "960px",
    zIndex: 5,
    flexShrink: 0
  };

  const circleSectionStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    marginBottom: "20px",
  };

  const textToShow = `${Math.round(progress)}%`;
  const dynamicFontSize = textToShow.length >= 4 ? "105px" : textToShow.length === 3 ? "120px" : "135px";

  const numberOverlayStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: dynamicFontSize,
    fontWeight: 950,
    color: accentColor,
    fontFamily: styles.fontFamily,
    textShadow: `0 8px 30px rgba(${rgb}, 0.25)`
  };

  const cardsContainerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: gap !== undefined ? `${gap}px` : (t.container?.gap || "20px"),
    width: "100%",
    marginTop: "24px",
    boxSizing: "border-box",
    padding: "0 20px",
  };

  const cardStyle: React.CSSProperties = {
    width: "100%",
    height: "240px", // Fixed height to guarantee all cards are equal
    borderRadius: "28px",
    padding: "24px",
    background: isLight ? "rgba(255, 255, 255, 0.88)" : "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)"}`,
    boxShadow: `0 14px 34px rgba(0, 0, 0, 0.15)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center", // Vertically center content
    textAlign: "center",
    boxSizing: "border-box",
    backdropFilter: "blur(8px)",
  };

  const animCircleConfig = metricComp
    ? getAnimationConfig(metricComp, 0, "scale-in", 0, t)
    : { animation: "scale-in", delay: 0.1 };

  return (
    <div style={containerStyle}>
      <AnimatedBlock animation={animCircleConfig.animation} delaySeconds={0.1}>
        <div style={circleSectionStyle}>
          <div style={{ position: "relative", width: "480px", height: "480px" }}>
            <svg viewBox="0 0 200 200" style={{ width: "100%", height: "100%" }}>
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.08)"}
                strokeWidth="14"
              />
              {/* Glowing animated progress */}
              <circle
                cx="100"
                cy="100"
                r={R}
                fill="none"
                stroke={accentColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={strokeDashoffset}
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div style={numberOverlayStyle}>
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </AnimatedBlock>

      {/* Premium Cards Grid underneath */}
      {cardComps.length > 0 && (
        <div style={cardsContainerStyle}>
          {cardComps.map((comp, idx) => {
            const { value, title, subtext } = parseCardContent(comp);
            const theme = getCardTheme(idx, isLight);

            // Stagger delays for entrance and count-up animations
            const animCardConfig = getAnimationConfig(comp, idx, "slide-up", 1.2 + 0.25 * idx, t);
            const cardStartFrame = startFrame + durationFrames + 5 + (idx * 8);

            // Parse numeric component and suffix for count-up
            const { n1, suffix } = parseNumbersUtil(value);
            const hasDigits = /\d+/.test(value);

            const cardProgress = interpolate(frame - cardStartFrame, [0, 25], [0, n1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.25, 1, 0.5, 1),
            });

            const animatedValue = Math.round(cardProgress);

            const individualCardStyle: React.CSSProperties = {
              ...cardStyle,
              background: isLight
                ? `linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(243, 244, 246, 0.92) 60%, ${theme.bg} 100%)`
                : `linear-gradient(135deg, rgba(10, 16, 28, 0.92) 0%, rgba(8, 12, 24, 0.82) 60%, ${theme.bg} 100%)`, // Premium dark slate theme background with gradient
              border: `1.5px solid ${theme.border}`, // Glowing theme border color
              boxShadow: isLight
                ? "0 10px 30px rgba(0, 0, 0, 0.04)"
                : `0 14px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(0, 0, 0, 0.25)`,
            };

            // Scale font size based on text length to fit the fixed height
            const titleFontSize = title.length > 25 ? "15px" : title.length > 15 ? "18px" : "21px";
            const subtextFontSize = subtext.length > 30 ? "13px" : "15px";

            return (
              <AnimatedBlock key={comp.id || idx} animation={animCardConfig.animation} delaySeconds={animCardConfig.delay}>
                <div style={individualCardStyle}>
                  {/* Circular/Square Icon Badge */}
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: theme.bg,
                    border: `1.5px solid ${theme.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "14px"
                  }}>
                    {theme.icon}
                  </div>

                  {/* Large Metric Number */}
                  {value && (
                    <div style={{
                      fontSize: "52px",
                      fontWeight: 950,
                      color: theme.color,
                      fontFamily: styles.fontFamily,
                      lineHeight: 1.1,
                      letterSpacing: "-0.03em"
                    }}>
                      {hasDigits ? (
                        <>
                          {animatedValue}
                          {suffix && <span style={{ fontSize: "32px", fontWeight: 800, marginLeft: "2px" }}>{suffix}</span>}
                        </>
                      ) : (
                        value
                      )}
                    </div>
                  )}

                  {/* Card Title */}
                  <div style={{
                    fontSize: titleFontSize,
                    fontWeight: 800,
                    color: isLight ? "#1e293b" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    marginTop: "8px",
                    lineHeight: 1.2
                  }}>
                    {title}
                  </div>

                  {/* Card Subtitle */}
                  {subtext && (
                    <div style={{
                      fontSize: subtextFontSize,
                      fontWeight: 500,
                      color: isLight ? "#475569" : "#94a3b8",
                      fontFamily: styles.fontFamily,
                      marginTop: "6px",
                      lineHeight: 1.3
                    }}>
                      {subtext}
                    </div>
                  )}
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      )}
    </div>
  );
};
