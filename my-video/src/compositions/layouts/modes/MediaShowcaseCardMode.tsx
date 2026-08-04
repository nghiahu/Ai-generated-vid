import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";

export const MediaShowcaseCardMode: React.FC<ModeRendererProps> = ({
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
  // Parse dynamic points (up to 3)
  const points = otherComps.slice(0, 3).map(comp => comp.data?.text || "").filter(Boolean);

  // Phone Mockup / Showcase Card styles
  const phoneBg = isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(10, 15, 30, 0.7)";
  const phoneBorder = isLight ? "1px solid rgba(0, 0, 0, 0.08)" : `1px solid rgba(${rgb}, 0.25)`;
  const phoneGlow = isLight
    ? "0 35px 70px rgba(0, 0, 0, 0.07)"
    : `0 40px 90px rgba(0, 0, 0, 0.55), 0 0 60px rgba(${rgb}, 0.2), rgba(255, 255, 255, 0.02) 0px 0px 0px 1px inset`;

  // Render a premium mobile dashboard app UI (scaled up)
  const renderMockAppUI = () => {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: isLight ? "#ffffff" : "#070a13",
        color: isLight ? "#1e293b" : "#f8fafc",
        padding: "28px 24px",
        boxSizing: "border-box",
        fontFamily: styles.fontFamily
      }}>
        {/* Mock App Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "36px",
          marginTop: "4px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${accentColor}, #3b82f6)`,
              boxShadow: `0 0 10px rgba(${rgb}, 0.35)`
            }} />
            <span style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.05em", textTransform: "uppercase" }}>yup_app</span>
          </div>
          <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: isLight ? "#cbd5e1" : "#1e293b" }} />
        </div>

        {/* Big Circular Ring Progress KPI */}
        <div style={{
          background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)",
          border: phoneBorder,
          borderRadius: "24px",
          padding: "36px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "36px",
          boxSizing: "border-box"
        }}>
          <div style={{
            position: "relative",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            border: `10px solid ${isLight ? "#f1f5f9" : "#131927"}`,
            borderTopColor: accentColor,
            borderRightColor: accentColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "18px",
            boxShadow: isLight ? "none" : `0 0 16px rgba(${rgb}, 0.12)`
          }}>
            <span style={{ fontSize: "26px", fontWeight: "900", color: isLight ? "#0f172a" : "#ffffff" }}>85%</span>
          </div>
          <div style={{ width: "100px", height: "8px", background: isLight ? "#cbd5e1" : "#1e293b", borderRadius: "4px" }} />
        </div>

        {/* Activity Feed mockup */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{
            background: isLight ? "#f8fafc" : "rgba(255,255,255,0.03)",
            border: phoneBorder,
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: accentColor }} />
            <div style={{ flex: 1, height: "10px", background: isLight ? "#cbd5e1" : "#1e293b", borderRadius: "5px" }} />
          </div>
          <div style={{
            background: isLight ? "#f8fafc" : "rgba(255,255,255,0.03)",
            border: phoneBorder,
            borderRadius: "14px",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#eab308" }} />
            <div style={{ flex: 1, height: "10px", background: isLight ? "#cbd5e1" : "#1e293b", borderRadius: "5px" }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      maxWidth: "1000px",
      boxSizing: "border-box",
      gap: "36px",
      zIndex: 5,
      padding: "0 20px"
    }}>
      {/* Left Column: Large Smartphone Showcase Card */}
      <div style={{ width: "50%", display: "flex", justifyContent: "center" }}>
        <AnimatedBlock animation="scale-in" delaySeconds={0.25}>
          <div style={{
            position: "relative",
            width: "440px",
            height: "660px",
            background: phoneBg,
            border: isLight ? "10px solid #1e293b" : "10px solid rgba(15, 23, 42, 0.95)",
            borderRadius: "52px",
            boxShadow: phoneGlow,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box"
          }}>
            {/* Smartphone Speaker notch */}
            <div style={{
              width: "90px",
              height: "18px",
              background: isLight ? "#1e293b" : "#0f172a",
              borderRadius: "0 0 12px 12px",
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{ width: "36px", height: "3px", background: "#475569", borderRadius: "1.5px" }} />
            </div>

            {/* Status bar */}
            <div style={{
              height: "36px",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 28px",
              boxSizing: "border-box",
              fontSize: "11px",
              fontWeight: "bold",
              color: isLight ? "#64748b" : "#94a3b8",
              background: isLight ? "#ffffff" : "#070a13",
              zIndex: 5,
              paddingTop: "6px"
            }}>
              <span>09:41</span>
              <div style={{ display: "flex", gap: "8px" }}>
                <span>5G</span>
                <span>100%</span>
              </div>
            </div>

            {/* Screen area */}
            <div style={{
              flex: 1,
              position: "relative",
              background: isLight ? "#ffffff" : "#020617",
              overflow: "hidden"
            }}>
              {renderMockAppUI()}
            </div>
          </div>
        </AnimatedBlock>
      </div>

      {/* Right Column: Staggered Vertical List of subpoints */}
      <div style={{
        width: "48%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        boxSizing: "border-box"
      }}>
        {points.map((text, idx) => (
          <AnimatedBlock 
            key={idx}
            animation="slide-right" 
            delaySeconds={0.4 + idx * 0.15}
          >
            <div style={{
              background: isLight ? "rgba(255, 255, 255, 0.9)" : "rgba(10, 15, 30, 0.5)",
              border: isLight ? "1px solid rgba(0, 0, 0, 0.05)" : `1px solid rgba(${rgb}, 0.25)`,
              borderLeft: `6px solid ${accentColor}`,
              borderRadius: "24px",
              padding: "20px 24px",
              boxShadow: isLight ? "0 10px 30px rgba(0,0,0,0.02)" : "0 12px 35px rgba(0,0,0,0.35)",
              backdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "18px",
              boxSizing: "border-box",
              width: "100%"
            }}>
              {/* Point Number Badge */}
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: isLight ? "rgba(0,0,0,0.03)" : `rgba(${rgb}, 0.12)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: "14px",
                  fontWeight: "900",
                  color: accentColor,
                  fontFamily: styles.fontFamily
                }}>
                  {`0${idx + 1}`}
                </span>
              </div>

              {/* Point Text */}
              <span style={{
                fontSize: `${22 * fontScale}px`,
                fontWeight: "800",
                color: isLight ? "#1e293b" : "#cbd5e1",
                fontFamily: styles.fontFamily,
                textAlign: "left",
                lineHeight: 1.3
              }}>
                {text}
              </span>
            </div>
          </AnimatedBlock>
        ))}
      </div>
    </div>
  );
};
