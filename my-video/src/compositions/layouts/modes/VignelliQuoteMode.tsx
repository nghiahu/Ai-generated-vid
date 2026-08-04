import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";

export const VignelliQuoteMode: React.FC<ModeRendererProps> = ({
  otherComps,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  theme,
  titleText,
  category,
  highlightWords
}) => {
  // Helper to highlight digits in red/accentColor
  const renderHighlightedTitle = (text: string) => {
    if (!text) return "";
    const parts = text.split(/(\d+)/g);
    return parts.map((part, i) => {
      if (/^\d+$/.test(part)) {
        return (
          <span key={i} style={{ color: "#ef4444", fontWeight: "950" }}>
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Helper to format sticker text (e.g. "RAG = 3 Bước" -> "/RAG = 3 BƯỚC")
  const renderStickerText = (text: string) => {
    if (!text) return "";
    const upper = text.toUpperCase();
    const formatted = upper.startsWith("/") ? upper : `/${upper}`;
    const parts = formatted.split(/(\d+)/g);
    return parts.map((part, i) => {
      if (/^\d+$/.test(part)) {
        return (
          <span key={i} style={{ color: "#f87171" }}>
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Parse dynamic notes from otherComps
  const noteItems = otherComps.map(comp => comp.data?.text || "").filter(Boolean);
  const displayCategory = category || "RESEARCH PREVIEW";

  // Wood texture and clipboard styles
  const boardBg = "linear-gradient(135deg, #d99b52 0%, #b87b31 100%)";
  const boardBorder = "4px solid #87541b";
  const boardShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(184, 123, 49, 0.15)";

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
      {/* 2. Clipboard Container */}
      <AnimatedBlock animation="slide-up" delaySeconds={0.4}>
        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "780px",
          minHeight: "620px",
          background: boardBg,
          border: boardBorder,
          borderRadius: "28px",
          boxShadow: boardShadow,
          padding: "24px 24px 24px 24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* Metallic Silver Clip on top */}
          <div style={{
            position: "absolute",
            top: "-16px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "160px",
            height: "36px",
            background: "linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)",
            border: "2px solid #94a3b8",
            borderRadius: "8px",
            boxShadow: "0 6px 12px rgba(0,0,0,0.25), inset 0 2px 2px rgba(255,255,255,0.6)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px",
            boxSizing: "border-box"
          }}>
            {/* Left Rivet */}
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #94a3b8, #475569)",
              boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)"
            }} />
            {/* Clip Grip Detail */}
            <div style={{
              width: "80px",
              height: "4px",
              background: "#94a3b8",
              borderRadius: "2px"
            }} />
            {/* Right Rivet */}
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #94a3b8, #475569)",
              boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)"
            }} />
          </div>

          {/* Lined Paper sheet */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: "#fdfbf7",
            borderRadius: "16px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
            padding: "48px 36px 28px 36px",
            boxSizing: "border-box",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch"
          }}>
            {/* Red notebook margin vertical line */}
            <div style={{
              position: "absolute",
              left: "54px",
              top: 0,
              bottom: 0,
              width: "1.5px",
              background: "rgba(239, 68, 68, 0.4)",
              zIndex: 2
            }} />

            {/* A. DYMO label writer header */}
            <div style={{
              fontSize: "13px",
              fontWeight: "900",
              color: "#94a3b8",
              fontFamily: "monospace",
              letterSpacing: "0.15em",
              textAlign: "center",
              marginBottom: "24px",
              zIndex: 3
            }}>
              DYMO - LABELWRITER - #132
            </div>

            {/* B. Highlight sticker label */}
            {titleText && (
              <div style={{
                alignSelf: "center",
                background: "linear-gradient(90deg, #1e3a8a 0%, #1e1b4b 50%, #7f1d1d 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                padding: "20px 36px",
                boxShadow: "0 12px 24px rgba(0,0,0,0.22), 0 2px 4px rgba(0,0,0,0.1)",
                color: "#ffffff",
                fontSize: `${36 * fontScale}px`,
                fontWeight: "900",
                fontFamily: styles.fontFamily,
                textAlign: "center",
                letterSpacing: "0.02em",
                marginBottom: "24px",
                zIndex: 3,
                maxWidth: "92%"
              }}>
                {renderStickerText(titleText)}
              </div>
            )}

            {/* C. Category Row */}
            <div style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "28px",
              zIndex: 3
            }}>
              <span style={{
                fontSize: "12px",
                fontWeight: "900",
                color: "#64748b",
                letterSpacing: "0.08em",
                marginRight: "8px",
                textTransform: "uppercase",
                fontFamily: styles.fontFamily
              }}>
                CATEGORY:
              </span>
              <span style={{
                background: "#fef08a",
                color: "#854d0e",
                borderRadius: "4px",
                padding: "4px 14px",
                fontSize: "12px",
                fontWeight: "900",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                fontFamily: styles.fontFamily,
                boxShadow: "0 2px 4px rgba(234,179,8,0.15)"
              }}>
                {displayCategory}
              </span>
            </div>

            {/* D. - NOTES - spacer */}
            <div style={{
              fontSize: "12px",
              fontWeight: "900",
              color: "#cbd5e1",
              letterSpacing: "0.25em",
              textAlign: "center",
              textTransform: "uppercase",
              marginBottom: "24px",
              zIndex: 3,
              fontFamily: styles.fontFamily
            }}>
              - NOTES -
            </div>

            {/* E. Note lines */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              zIndex: 3,
              flex: 1
            }}>
              {noteItems.map((note, idx) => {
                // First note has a highlighted strip style to match the mockup
                const isFirst = idx === 0;
                return (
                  <AnimatedBlock 
                    key={idx} 
                    animation="slide-up" 
                    delaySeconds={0.6 + idx * 0.15}
                  >
                    <div style={{
                      background: isFirst ? "#fef9c3" : "rgba(248, 250, 252, 0.6)",
                      borderLeft: isFirst ? "4px solid #eab308" : "4px solid #cbd5e1",
                      border: isFirst ? undefined : "1px solid rgba(0,0,0,0.05)",
                      borderRadius: "6px",
                      padding: "16px 20px 16px 28px",
                      boxShadow: isFirst ? "0 4px 10px rgba(234,179,8,0.08)" : "0 2px 4px rgba(0,0,0,0.02)",
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      boxSizing: "border-box"
                    }}>
                      <span style={{
                        fontSize: `${24 * fontScale}px`,
                        fontWeight: "800",
                        color: isFirst ? "#854d0e" : "#334155",
                        textAlign: "left",
                        fontFamily: styles.fontFamily,
                        lineHeight: 1.3
                      }}>
                        {note}
                      </span>
                    </div>
                  </AnimatedBlock>
                );
              })}
            </div>

          </div>
        </div>
      </AnimatedBlock>
    </div>
  );
};
