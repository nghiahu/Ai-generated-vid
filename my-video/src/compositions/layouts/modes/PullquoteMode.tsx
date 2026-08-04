import React from "react";
import { ModeRendererProps } from "./LayoutModeTypes";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";

// Custom inline SVGs for checklist/layers, rocket, and sparkles icons
const LayersIcon = ({ color }: { color: string }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="m12 3-10 5 10 5 10-5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </svg>
);

const RocketIcon = ({ color }: { color: string }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="M4.5 16.5c-1.5 1.26-2 3.43-2 3.43s2.17-.5 3.43-2" />
    <path d="M22 2s-5.5 2-8 7.5L9 14.5l-3-3-1.5 1.5 5 5 1.5-1.5L14.5 15l5.5-6C20 6.5 22 2 22 2Z" />
    <path d="M9 15 2 22l3-3 4-4Z" />
  </svg>
);

const SparklesIcon = ({ color }: { color: string }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke={color} 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    style={{ flexShrink: 0 }}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

export const PullquoteMode: React.FC<ModeRendererProps> = ({
  otherComps,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  theme,
  highlightWords
}) => {
  // Helper to extract badge and clean text (e.g., "Chỉ có ba bước (3 BƯỚC)" -> badge: "3 BƯỚC", text: "Chỉ có ba bước")
  const parseCardData = (comp: any) => {
    if (!comp) return null;
    let text = comp.data?.text || "";
    let badge = "";
    
    if (comp.data?.badges && comp.data.badges.length > 0) {
      badge = comp.data.badges[0];
    } else {
      const match = text.match(/[\(\[](.*?)[\)\]]/);
      if (match) {
        badge = match[1];
        text = text.replace(/[\(\[](.*?)[\)\]]/, "").trim();
      }
    }
    return { text, badge };
  };

  // Helper to detect if a text represents a footer
  const isFooterText = (text: string) => {
    if (!text) return false;
    const clean = text.trim();
    if (/^\d{4},/.test(clean)) return true;
    if (clean.toLowerCase().includes("nhưng thật ra") || clean.toLowerCase().includes("thực ra")) return true;
    return false;
  };

  // First point otherComps[0] is the quote text inside the card
  const quoteText = otherComps[0]?.data?.text || "";

  // The remaining components represent subpoints and optionally a footer
  const remainingComps = [...otherComps.slice(1)];
  let footerText = "";

  if (remainingComps.length > 0) {
    const lastComp = remainingComps[remainingComps.length - 1];
    const lastText = lastComp.data?.text || "";
    if (isFooterText(lastText)) {
      footerText = lastText;
      remainingComps.pop(); // remove from cards list
    }
  }

  // Parse remaining points into sub-cards
  const subCardsData = remainingComps.map(comp => parseCardData(comp)).filter(Boolean) as { text: string; badge: string }[];

  // Helper to choose card icon and color based on index
  const getCardIcon = (idx: number) => {
    const iconIndex = idx % 3;
    if (iconIndex === 0) {
      return {
        Icon: <LayersIcon color={isLight ? "#4f46e5" : "#818cf8"} />,
        color: isLight ? "#4f46e5" : "#818cf8"
      };
    } else if (iconIndex === 1) {
      return {
        Icon: <RocketIcon color={isLight ? "#0891b2" : "#22d3ee"} />,
        color: isLight ? "#0891b2" : "#22d3ee"
      };
    } else {
      return {
        Icon: <SparklesIcon color={isLight ? "#10b981" : "#34d399"} />,
        color: isLight ? "#10b981" : "#34d399"
      };
    }
  };

  // Helper to compute card width dynamically based on the total number of cards to prevent overflow/gaps
  const getCardWidth = (totalCards: number) => {
    if (totalCards <= 1) return "100%";
    if (totalCards === 2) return "calc((100% - 16px) / 2)";
    return "calc((100% - 32px) / 3)";
  };

  // Helper to highlight the first word/token in the footer in accent color (e.g. "2026, nhưng thật ra" -> "2026," is highlighted)
  const renderHighlightedFooter = (text: string) => {
    if (!text) return "";
    const parts = text.trim().split(" ");
    if (parts.length === 0) return "";
    const firstWord = parts[0];
    const rest = parts.slice(1).join(" ");
    return (
      <div style={{
        fontSize: `${28 * fontScale}px`,
        fontWeight: "700",
        color: isLight ? "#475569" : "#cbd5e1",
        fontFamily: styles.fontFamily,
        textAlign: "center",
        marginTop: "32px",
        letterSpacing: "-0.01em"
      }}>
        <span style={{ color: accentColor, fontWeight: "900" }}>{firstWord} </span>
        <span>{rest}</span>
      </div>
    );
  };

  // Glassmorphic styling for main quote card
  const cardBg = isLight ? "rgba(255, 255, 255, 0.75)" : "rgba(10, 15, 30, 0.55)";
  const cardBorder = isLight ? "1px solid rgba(0, 0, 0, 0.08)" : `1px solid rgba(${rgb}, 0.25)`;
  const cardGlow = isLight
    ? `0 20px 40px rgba(0, 0, 0, 0.05), 0 0 20px rgba(${rgb}, 0.06)`
    : `0 24px 64px rgba(0, 0, 0, 0.45), 0 0 40px rgba(${rgb}, 0.18), rgba(255, 255, 255, 0.02) 0px 0px 0px 1px inset`;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: "860px",
      boxSizing: "border-box",
      zIndex: 5
    }}>
      {/* 1. Main Quote Box */}
      {quoteText && (
        <AnimatedBlock animation="scale-in" delaySeconds={0.25}>
          <div style={{
            position: "relative",
            width: "100%",
            maxWidth: "860px",
            minHeight: "380px",
            background: cardBg,
            border: cardBorder,
            borderRadius: "28px",
            padding: "72px 48px",
            boxShadow: cardGlow,
            backdropFilter: "blur(16px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            overflow: "hidden"
          }}>
            {/* Absolute quote marks */}
            <span style={{
              position: "absolute",
              left: "32px",
              top: "24px",
              fontSize: "120px",
              fontFamily: "Georgia, serif",
              lineHeight: 1,
              color: isLight ? "rgba(0, 0, 0, 0.05)" : `rgba(${rgb}, 0.15)`,
              pointerEvents: "none",
              userSelect: "none"
            }}>
              “
            </span>
            <span style={{
              position: "absolute",
              right: "32px",
              bottom: "-24px",
              fontSize: "120px",
              fontFamily: "Georgia, serif",
              lineHeight: 1,
              color: isLight ? "rgba(0, 0, 0, 0.05)" : `rgba(${rgb}, 0.15)`,
              pointerEvents: "none",
              userSelect: "none"
            }}>
              ”
            </span>

            {/* Conversation Badge */}
            <div style={{
              border: isLight ? "1px solid rgba(0, 0, 0, 0.12)" : `1px solid rgba(${rgb}, 0.4)`,
              borderRadius: "999px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: "900",
              color: isLight ? "#1e293b" : "#38bdf8",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "20px",
              background: isLight ? "rgba(0, 0, 0, 0.02)" : `rgba(${rgb}, 0.08)`,
              zIndex: 2,
              fontFamily: styles.fontFamily
            }}>
              CONVERSATION QUOTE
            </div>

            {/* Centered Large Quote */}
            <div style={{
              fontSize: `${48 * fontScale}px`,
              fontWeight: "800",
              color: isLight ? "#0f172a" : "#f8fafc",
              lineHeight: 1.35,
              textAlign: "center",
              maxWidth: "88%",
              zIndex: 2,
              fontFamily: styles.fontFamily,
              letterSpacing: "-0.02em"
            }}>
              "{quoteText}"
            </div>
          </div>
        </AnimatedBlock>
      )}

      {/* 2. Side-by-side Cards Container (Wrapping Grid) */}
      {subCardsData.length > 0 && (
        <div style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: "16px",
          width: "100%",
          maxWidth: "860px",
          marginTop: "24px",
          justifyContent: "flex-start",
          boxSizing: "border-box"
        }}>
          {subCardsData.map((card, idx) => {
            const { Icon, color } = getCardIcon(idx);
            return (
              <AnimatedBlock 
                key={idx}
                animation="slide-up" 
                delaySeconds={0.5 + idx * 0.12}
                style={{ width: getCardWidth(subCardsData.length), flexShrink: 0 }}
              >
                <div style={{
                  background: isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(15, 23, 42, 0.35)",
                  border: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "20px",
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "16px",
                  boxSizing: "border-box",
                  height: "100%",
                  boxShadow: isLight ? "0 8px 24px rgba(0,0,0,0.02)" : "0 8px 24px rgba(0,0,0,0.2)"
                }}>
                  {Icon}
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start" }}>
                    {card.badge && (
                      <span style={{ 
                        fontSize: "11px", 
                        fontWeight: "900", 
                        color: color, 
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontFamily: styles.fontFamily
                      }}>
                        {card.badge}
                      </span>
                    )}
                    <span style={{ 
                      fontSize: `${20 * fontScale}px`, 
                      fontWeight: "800", 
                      color: isLight ? "#1e293b" : "#f1f5f9",
                      fontFamily: styles.fontFamily,
                      textAlign: "left"
                    }}>
                      {card.text}
                    </span>
                  </div>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      )}

      {/* 3. Bottom Footer Text */}
      {footerText && (
        <AnimatedBlock animation="slide-up" delaySeconds={0.78 + subCardsData.length * 0.12}>
          {renderHighlightedFooter(footerText)}
        </AnimatedBlock>
      )}
    </div>
  );
};

