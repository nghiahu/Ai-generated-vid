import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";

export const IntroMediaHeroMode: React.FC<ModeRendererProps> = ({
  otherComps,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  imageUrl,
  theme,
  highlightWords
}) => {
  // Parse dynamic subpoints (up to 3)
  const subPoints = otherComps.slice(0, 3).map(comp => comp.data?.text || "").filter(Boolean);

  // Helper to check if imageUrl is a default background asset or invalid
  const isDefaultImage = (url: string) => {
    if (!url) return true;
    const lower = url.toLowerCase();
    
    // Check for invalid/empty/undefined placeholder values
    if (
      lower === "undefined" || 
      lower === "null" || 
      lower.endsWith("/undefined") || 
      lower.endsWith("/null") ||
      lower.includes("placeholder")
    ) {
      return true;
    }
    
    return lower.includes("bg") || lower.includes("background") || lower.includes("circuit") || lower.includes("bokeh");
  };

  // Mockup card style
  const cardBg = isLight ? "rgba(255, 255, 255, 0.75)" : "rgba(10, 15, 30, 0.55)";
  const cardBorder = isLight ? "1px solid rgba(0, 0, 0, 0.08)" : `1px solid rgba(${rgb}, 0.25)`;
  const cardGlow = isLight
    ? "0 20px 40px rgba(0, 0, 0, 0.05)"
    : `0 24px 64px rgba(0, 0, 0, 0.45), 0 0 40px rgba(${rgb}, 0.18), rgba(255, 255, 255, 0.02) 0px 0px 0px 1px inset`;

  // Render a premium mock video editor web app UI
  const renderMockWebUI = () => {
    return (
      <div style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        background: isLight ? "#f8fafc" : "#070a13",
        color: isLight ? "#1e293b" : "#f8fafc"
      }}>
        {/* Left Sidebar */}
        <div style={{
          width: "56px",
          background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
          borderRight: cardBorder,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "16px 0",
          gap: "20px",
          boxSizing: "border-box"
        }}>
          <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: accentColor, opacity: 0.8 }} />
          <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: isLight ? "#cbd5e1" : "#334155" }} />
          <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: isLight ? "#cbd5e1" : "#334155" }} />
          <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: isLight ? "#cbd5e1" : "#334155" }} />
        </div>

        {/* Main Work Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Internal Header */}
          <div style={{
            height: "44px",
            borderBottom: cardBorder,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            boxSizing: "border-box"
          }}>
            <span style={{ fontSize: "12px", fontWeight: "800", opacity: 0.8, letterSpacing: "0.05em", fontFamily: styles.fontFamily }}>
              PROJECT_WORKSPACE / EDITING
            </span>
            <div style={{ display: "flex", flexDirection: "row", gap: "8px" }}>
              <div style={{ width: "64px", height: "20px", borderRadius: "4px", background: isLight ? "#e2e8f0" : "#1e293b" }} />
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: isLight ? "#cbd5e1" : "#334155" }} />
            </div>
          </div>

          {/* Panels */}
          <div style={{ flex: 1, display: "flex", flexDirection: "row", padding: "16px", gap: "16px", boxSizing: "border-box" }}>
            {/* Left video preview panel */}
            <div style={{
              flex: 1.3,
              background: isLight ? "rgba(0,0,0,0.03)" : "rgba(0,0,0,0.45)",
              borderRadius: "12px",
              border: cardBorder,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden"
            }}>
              {/* Play Button Icon */}
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 16px rgba(0,0,0,0.15)"
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </div>
            </div>

            {/* Right parameter editor panel */}
            <div style={{
              flex: 0.8,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              justifyContent: "flex-start"
            }}>
              <div style={{
                background: isLight ? "#e2e8f0" : `rgba(${rgb}, 0.12)`,
                border: cardBorder,
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <div style={{ width: "40px", height: "6px", background: accentColor, borderRadius: "2px" }} />
                <div style={{ width: "90%", height: "10px", background: isLight ? "#cbd5e1" : "#334155", borderRadius: "3px" }} />
              </div>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: cardBorder,
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <div style={{ width: "50px", height: "6px", background: isLight ? "#cbd5e1" : "#334155", borderRadius: "2px" }} />
                <div style={{ width: "80%", height: "10px", background: isLight ? "#cbd5e1" : "#334155", borderRadius: "3px" }} />
              </div>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: cardBorder,
                borderRadius: "8px",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}>
                <div style={{ width: "30px", height: "6px", background: isLight ? "#cbd5e1" : "#334155", borderRadius: "2px" }} />
                <div style={{ width: "60%", height: "10px", background: isLight ? "#cbd5e1" : "#334155", borderRadius: "3px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      width: "100%",
      maxWidth: "860px",
      boxSizing: "border-box",
      zIndex: 5
    }}>
      {/* 1. Main Media Hero Mockup Card */}
      <AnimatedBlock animation="scale-in" delaySeconds={0.25}>
        <div style={{
          width: "100%",
          maxWidth: "760px",
          height: "380px",
          background: cardBg,
          border: cardBorder,
          borderRadius: "24px",
          boxShadow: cardGlow,
          backdropFilter: "blur(16px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          marginBottom: "40px",
          transform: "perspective(1200px) rotateX(8deg) rotateY(-6deg) rotateZ(2deg) scale(0.94)",
          transformStyle: "preserve-3d"
        }}>
          {/* macOS Style Mockup Header Bar */}
          <div style={{
            height: "40px",
            background: isLight ? "rgba(0, 0, 0, 0.03)" : "rgba(255, 255, 255, 0.03)",
            borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            padding: "0 18px",
            boxSizing: "border-box",
            justifyContent: "space-between",
            flexShrink: 0
          }}>
            {/* Window Controls */}
            <div style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#eab308" }} />
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#22c55e" }} />
            </div>

            {/* Mock Address Bar */}
            <div style={{
              width: "360px",
              height: "24px",
              background: isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(15, 23, 42, 0.5)",
              border: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.06)",
              borderRadius: "6px",
              fontSize: "11px",
              color: isLight ? "#64748b" : "#94a3b8",
              fontFamily: "monospace",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              letterSpacing: "0.02em"
            }}>
              preview.yupvid.ai/media_hero
            </div>

            {/* Right Spacer */}
            <div style={{ width: "52px" }} />
          </div>

          {/* Media Content Area */}
          <div style={{
            flex: 1,
            position: "relative",
            background: isLight ? "#f8fafc" : "#020617",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {renderMockWebUI()}
          </div>
        </div>
      </AnimatedBlock>

      {/* 2. Premium Staggered Vertical List of subpoints */}
      {subPoints.length > 0 && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          width: "100%",
          maxWidth: "760px",
          boxSizing: "border-box",
          marginTop: "12px",
          perspective: "1000px"
        }}>
          {subPoints.map((text, idx) => {
            const isLeft = idx % 2 === 0;
            return (
              <AnimatedBlock 
                key={idx}
                animation={isLeft ? "slide-left" : "slide-right"} 
                delaySeconds={0.65 + idx * 0.15}
                style={{
                  width: "82%",
                  alignSelf: isLeft ? "flex-start" : "flex-end",
                  flexShrink: 0
                }}
              >
                <div style={{
                  background: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(10, 15, 30, 0.5)",
                  border: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : `1px solid rgba(${rgb}, 0.25)`,
                  borderRadius: "20px",
                  padding: "16px 24px",
                  boxShadow: isLight
                    ? "0 10px 25px rgba(0,0,0,0.03)"
                    : `0 12px 30px rgba(0, 0, 0, 0.35), rgba(${rgb}, 0.08) 0px 0px 15px`,
                  backdropFilter: "blur(12px)",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "18px",
                  boxSizing: "border-box",
                  transform: `rotateY(${isLeft ? "5deg" : "-5deg"})`,
                  transformStyle: "preserve-3d"
                }}>
                  {/* Glowing Neon Number Badge */}
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "12px",
                    background: isLight ? "rgba(0,0,0,0.04)" : `rgba(${rgb}, 0.15)`,
                    border: isLight ? "1px solid rgba(0,0,0,0.08)" : `1px solid ${accentColor}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isLight ? "none" : `0 0 10px rgba(${rgb}, 0.25)`,
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: "16px",
                      fontWeight: "900",
                      color: accentColor,
                      fontFamily: styles.fontFamily
                    }}>
                      {`0${idx + 1}`}
                    </span>
                  </div>

                  {/* Point Text */}
                  <span style={{
                    fontSize: `${20 * fontScale}px`,
                    fontWeight: "800",
                    color: isLight ? "#1e293b" : "#f1f5f9",
                    fontFamily: styles.fontFamily,
                    textAlign: "left",
                    lineHeight: 1.3
                  }}>
                    {text}
                  </span>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      )}
    </div>
  );
};
