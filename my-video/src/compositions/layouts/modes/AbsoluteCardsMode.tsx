import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { 
  getInitials, 
  getDynamicFontSize, 
  resolvePadding, 
  getAnimationConfig, 
  renderNestedCardContent 
} from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const AbsoluteCardsMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  isVertical,
  styles,
  fontScale,
  paddingScale,
  activeCardTextColor,
  activeCardBadgeColor,
  inactiveCardTextColor,
  titleText,
  category,
  voiceover,
  theme,
  highlightWords
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isWindingRoadmap = t.id === "AIHubGrid2" || t.id === "WindingRoadmap";
  const visibleComps = isWindingRoadmap ? otherComps.slice(0, 5) : otherComps.slice(0, 3);
  const titleComp = otherComps.find(c => c.type === "title");
  const isAIHubGrid3 = t.id === "AIHubGrid3";

  if (isAIHubGrid3) {
    const textPoints = otherComps.filter(c => c.type !== "title" && c.data?.text);
    const sections: { header: string; bullets: string[] }[] = [];
    let currentSection: { header: string; bullets: string[] } | null = null;
    let calloutText = "";
    let footerText = "";

    for (let i = 0; i < textPoints.length; i++) {
      const text = textPoints[i].data.text.trim();
      
      // Assign the last item as footer text if we have enough points
      if (i === textPoints.length - 1 && textPoints.length > 3) {
        footerText = text;
        continue;
      }
      // Assign the second-to-last item as callout text if we have enough points
      if (i === textPoints.length - 2 && textPoints.length > 4) {
        calloutText = text;
        continue;
      }

      if (text.endsWith(":") || text.startsWith("In ") || text.startsWith("Trong ")) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { header: text, bullets: [] };
      } else {
        if (!currentSection) {
          currentSection = { header: "Highlights", bullets: [] };
        }
        currentSection.bullets.push(text);
      }
    }
    if (currentSection) {
      sections.push(currentSection);
    }

    const renderHighlightedTitle = (text: string) => {
      const parts = text.split(" ");
      if (parts.length === 0) return null;
      const firstWord = parts[0];
      const rest = parts.slice(1).join(" ");
      return (
        <h1 style={{
          fontSize: isVertical ? `${Math.round(54 * fontScale)}px` : `${Math.round(76 * fontScale)}px`,
          lineHeight: 1.1,
          fontWeight: 900,
          color: isLight ? "#111827" : "#ffffff",
          fontFamily: styles.fontFamily,
          textTransform: "uppercase",
          margin: 0,
          letterSpacing: "-0.03em"
        }}>
          <span style={{ color: accentColor, textShadow: isLight ? "none" : `0 0 20px rgba(${rgb}, 0.4)` }}>
            {firstWord}{" "}
          </span>
          {rest}
        </h1>
      );
    };

    return (
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: isVertical ? "40px" : "60px",
        boxSizing: "border-box",
        textAlign: "left"
      }}>
        {/* Title Group */}
        {titleText && (
          <div style={{ marginBottom: "40px", marginTop: isVertical ? "120px" : "40px" }}>
            <AnimatedBlock animation="slide-up" delaySeconds={0.1}>
              {renderHighlightedTitle(titleText)}
            </AnimatedBlock>
          </div>
        )}

        {/* Dynamic Content Columns / Rows */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "32px",
          maxWidth: "860px",
          width: "100%"
        }}>
          {sections.map((section, sIdx) => (
            <AnimatedBlock key={sIdx} animation="slide-up" delaySeconds={0.2 + sIdx * 0.15}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <h2 style={{
                  fontSize: "26px",
                  fontWeight: 800,
                  color: isLight ? "#111827" : "#ffffff",
                  fontFamily: styles.fontFamily,
                  margin: 0,
                  textTransform: "uppercase"
                }}>
                  {section.header}
                </h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {section.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-start",
                      gap: "12px",
                      paddingLeft: "8px"
                    }}>
                      <span style={{ color: accentColor, fontSize: "24px", lineHeight: "30px", fontWeight: 900 }}>
                        →
                      </span>
                      <span style={{
                        fontSize: "20px",
                        lineHeight: "28px",
                        fontWeight: 500,
                        color: isLight ? "#334155" : "rgba(255, 255, 255, 0.82)",
                        fontFamily: styles.fontFamily
                      }}>
                        {bullet}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedBlock>
          ))}

          {/* Callout box */}
          {calloutText && (
            <AnimatedBlock animation="scale-in" delaySeconds={0.6}>
              <div style={{
                borderRadius: "16px",
                background: isLight 
                  ? "rgba(241, 245, 249, 0.95)" 
                  : "linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
                border: `2px solid ${accentColor}`,
                boxShadow: isLight ? "none" : `0 0 20px rgba(${rgb}, 0.25)`,
                padding: "22px 28px",
                width: "100%",
                boxSizing: "border-box"
              }}>
                <p style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: isLight ? "#0f172a" : "#ffffff",
                  margin: 0,
                  lineHeight: 1.35,
                  fontFamily: styles.fontFamily
                }}>
                  {calloutText}
                </p>
              </div>
            </AnimatedBlock>
          )}

          {/* Footer paragraph */}
          {footerText && (
            <AnimatedBlock animation="slide-up" delaySeconds={0.8}>
              <p style={{
                fontSize: "18px",
                lineHeight: 1.45,
                fontWeight: 500,
                color: isLight ? "#64748b" : "rgba(255, 255, 255, 0.65)",
                margin: 0,
                fontFamily: styles.fontFamily
              }}>
                {footerText}
              </p>
            </AnimatedBlock>
          )}
        </div>
      </div>
    );
  }

  const isSelectorWheelRadio = t.id === "SelectorWheelRadio";

  if (isSelectorWheelRadio) {
    const optionComps = otherComps.slice(0, 3);
    
    // Concentric pulse rings scaling and opacity based on current video frame
    const ring1Scale = interpolate(frame, [0, 90], [1.0, 1.45], { extrapolateRight: "clamp" });
    const ring1Opacity = interpolate(frame, [0, 90], [0.35, 0], { extrapolateRight: "clamp" });
    
    const ring2Scale = interpolate(frame, [20, 110], [1.0, 1.45], { extrapolateRight: "clamp" });
    const ring2Opacity = interpolate(frame, [20, 110], [0.35, 0], { extrapolateRight: "clamp" });

    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
        {/* Glowing concentric background rings SVG */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
          <circle
            cx={454}
            cy={285}
            r={79 * ring1Scale}
            fill="none"
            stroke={accentColor}
            strokeWidth={2}
            opacity={ring1Opacity}
          />
          <circle
            cx={454}
            cy={285}
            r={79 * ring2Scale}
            fill="none"
            stroke={accentColor}
            strokeWidth={2}
            opacity={ring2Opacity}
          />
        </svg>

        {/* 1. Static SELECT center circle */}
        {(() => {
          const centerPos = resolvedPositions[0];
          return (
            <div style={{
              position: "absolute",
              left: centerPos.left,
              top: centerPos.top,
              width: centerPos.width,
              height: centerPos.height,
              zIndex: 10
            }}>
              <AnimatedBlock animation="scale-in" delaySeconds={0.15} style={{ height: "100%" }}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "999px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(243, 244, 246, 0.95))"
                    : "linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 41, 59, 0.75))",
                  border: `2.5px solid ${accentColor}`,
                  boxShadow: isLight ? `0 8px 30px rgba(${rgb}, 0.15)` : `0 0 25px rgba(${rgb}, 0.45)`,
                  display: "grid",
                  placeItems: "center"
                }}>
                  <span style={{
                    fontSize: "24px",
                    fontWeight: 900,
                    color: isLight ? "#1f2937" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    letterSpacing: "0.08em"
                  }}>
                    SELECT
                  </span>
                </div>
              </AnimatedBlock>
            </div>
          );
        })()}

        {/* 2. Outer dynamic option cards */}
        {optionComps.map((comp, idx) => {
          const optionIdx = idx + 1; // Maps to positions 1, 2, 3
          const pos = resolvedPositions[optionIdx] || { left: "0px", top: "0px", width: "100%", height: "auto" };
          const itemStyleSetting = t.items.itemStyles[optionIdx] || { fontSize: "28px" };
          const rotation = t.items.rotations[optionIdx] || 0;

          const text = comp.data?.text || "";
          const isSelected = text.startsWith("*");
          const cleanText = isSelected ? text.slice(1).trim() : text;

          const cardWrapperStyle: React.CSSProperties = {
            position: "absolute",
            left: pos.left,
            top: pos.top,
            width: pos.width,
            height: pos.height,
            zIndex: parseInt(pos.zIndex || "1"),
            transform: `rotate(${rotation}deg)`,
            boxSizing: "border-box"
          };

          const cardInnerStyle: React.CSSProperties = {
            width: pos.width,
            height: pos.height,
            borderRadius: itemStyleSetting.borderRadius || "26px",
            padding: resolvePadding(itemStyleSetting.padding || "20px 22px", paddingScale),
            background: isSelected
              ? `linear-gradient(135deg, rgba(${rgb}, 0.2), rgba(${rgb}, 0.08))`
              : isLight
                ? "rgba(255, 255, 255, 0.85)"
                : "rgba(255, 255, 255, 0.03)",
            border: isSelected
              ? `2.5px solid ${accentColor}`
              : isLight
                ? "1.5px solid rgba(0, 0, 0, 0.08)"
                : `1.5px solid rgba(${rgb}, 0.22)`,
            boxShadow: isSelected
              ? isLight
                ? `rgba(${rgb}, 0.18) 0px 12px 28px`
                : `rgba(${rgb}, 0.25) 0px 15px 35px, 0px 0px 20px rgba(${rgb}, 0.35)`
              : "none",
            backdropFilter: "blur(16px) saturate(1.15)",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            boxSizing: "border-box",
            overflow: "hidden"
          };

          const animConfig = getAnimationConfig(comp, idx, "scale-in", 0.3, t);
          const badgeLabel = pos.nestedStructure?.badgeText || `Option ${String.fromCharCode(65 + idx)}`;

          return (
            <div key={comp.id || idx} style={cardWrapperStyle}>
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay} style={{ height: "100%" }}>
                <div style={cardInnerStyle}>
                  {/* Left Column: Radio button indicator */}
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: `2.5px solid ${isSelected ? accentColor : (isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.45)")}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "18px",
                    flexShrink: 0,
                    boxShadow: isSelected ? `0 0 10px rgba(${rgb}, 0.5)` : "none",
                    background: isLight ? "rgba(255,255,255,0.8)" : "transparent"
                  }}>
                    {isSelected && (
                      <div style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: accentColor,
                        boxShadow: `0 0 8px ${accentColor}`
                      }} />
                    )}
                  </div>

                  {/* Right Column: Text content */}
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    textAlign: "left",
                    justifyContent: "center",
                    overflow: "hidden"
                  }}>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 900,
                      letterSpacing: "0.15em",
                      color: isSelected ? accentColor : (isLight ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.55)"),
                      textTransform: "uppercase",
                      marginBottom: "4px"
                    }}>
                      {badgeLabel}
                    </span>
                    <span style={{
                      fontSize: getDynamicFontSize(cleanText, 22, fontScale),
                      lineHeight: 1.15,
                      fontWeight: isSelected ? 800 : 700,
                      color: isLight ? "#1f2937" : "#ffffff",
                      fontFamily: styles.fontFamily,
                      textTransform: "uppercase"
                    }}>
                      {cleanText}
                    </span>
                  </div>
                </div>
              </AnimatedBlock>
            </div>
          );
        })}
      </div>
    );
  }

  const isFlywheel = t.id === "AIHubGrid1" || t.id === "Flywheel";

  if (isFlywheel) {
    const flywheelComps = otherComps.slice(0, 3);
    const bottomBarComps = otherComps.slice(3, 6);

    const parseFlywheelPoint = (text: string) => {
      if (!text) return { title: "STAGE", subtitle: "", desc: "" };
      const parts = text.split(/[:\-]/);
      if (parts.length === 1) {
        return { title: text.trim(), subtitle: "", desc: "" };
      }
      if (parts.length === 2) {
        return { title: parts[0]?.trim() || "STAGE", subtitle: parts[1]?.trim() || "", desc: "" };
      }
      return {
        title: parts[0]?.trim() || "STAGE",
        subtitle: parts[1]?.trim() || "",
        desc: parts.slice(2).join(" - ").trim() || ""
      };
    };

    const renderHighlightedText = (text: string) => {
      if (!text) return "";
      const words = text.trim().split(/\s+/);
      if (words.length <= 3) return text;
      const normalPart = words.slice(0, words.length - 2).join(" ");
      const highlightPart = words.slice(words.length - 2).join(" ");
      return (
        <>
          {normalPart}{" "}
          <span style={{ color: accentColor, fontWeight: 900 }}>{highlightPart}</span>
        </>
      );
    };

    const renderIcon = (idx: number) => {
      if (idx === 0) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        );
      }
      if (idx === 1) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        );
      }
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="12" r="6" />
          <circle cx="15" cy="12" r="6" />
        </svg>
      );
    };

    const renderBottomIcon = (idx: number) => {
      if (idx === 0) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        );
      }
      if (idx === 1) {
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
          </svg>
        );
      }
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    };

    // Circle coordinate definitions centered at (540, 1247) with radius 265px (using absolute screen coordinates)
    const circleConfigs = [
      { left: 400, top: 842, size: 280, floatPhase: 0 },
      { left: 630, top: 1240, size: 280, floatPhase: 2 },
      { left: 170, top: 1240, size: 280, floatPhase: 4 }
    ];

    const arrowProgress = interpolate(frame, [25, 80], [450, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
      <div style={{ position: "relative", width: "1080px", height: "1920px", overflow: "visible" }}>
        {/* Defs for arrow marker */}
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <marker id="flywheel-arrow" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={accentColor} />
            </marker>
          </defs>
        </svg>

        {/* 1. Header Group (Title & Subtitle) */}
        {titleText && (
          <div style={{
            position: "absolute",
            left: "126px",
            top: "380px",
            width: "828px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            textAlign: "left"
          }}>
            <AnimatedBlock animation="slide-up" delaySeconds={0.15}>
              <h1 style={{
                fontSize: `${Math.round(86 * fontScale)}px`,
                lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.05,
                fontWeight: 900,
                color: isLight ? "#111827" : "#ffffff",
                fontFamily: styles.fontFamily,
                textTransform: "uppercase",
                margin: 0,
                letterSpacing: "-0.04em",
                textShadow: isLight ? "none" : `0 0 20px rgba(${rgb}, 0.25)`
              }}>
                {highlightHeadingText(titleText, accentColor, theme, highlightWords)}
              </h1>
            </AnimatedBlock>

            <AnimatedBlock animation="slide-up" delaySeconds={0.25}>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Orange Divider */}
                <div style={{
                  width: "120px",
                  height: "5px",
                  borderRadius: "999px",
                  background: `linear-gradient(90deg, ${accentColor}, transparent)`
                }} />
                {voiceover && (
                  <p style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: isLight ? "rgba(17, 24, 39, 0.88)" : "rgba(255, 255, 255, 0.58)",
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase",
                    margin: 0,
                    letterSpacing: "0.08em",
                    lineHeight: theme === "ai_hub_grid" ? 1.5 : undefined
                  }}>
                    {voiceover}
                  </p>
                )}
              </div>
            </AnimatedBlock>
          </div>
        )}

        {/* 2. Central Flywheel Loop SVGs */}
        <svg viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "visible" }}>
          {/* Inner dotted orbit */}
          <circle cx="540" cy="1247" r="140" fill="none" stroke={`rgba(${rgb}, 0.18)`} strokeWidth="2.5" strokeDasharray="6 6" />

          {/* Dotted outer connection path */}
          <circle cx="540" cy="1247" r="265" fill="none" stroke={`rgba(${rgb}, 0.22)`} strokeWidth="3" strokeDasharray="10 10" />

          {/* Arrow 1: Top to Right */}
          <path
            d="M 672 1018 A 265 265 0 0 1 801 1293"
            fill="none"
            stroke={accentColor}
            strokeWidth="4.5"
            strokeDasharray={450}
            strokeDashoffset={arrowProgress}
            markerEnd="url(#flywheel-arrow)"
            style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
          />

          {/* Arrow 2: Right to Left */}
          <path
            d="M 710 1450 A 265 265 0 0 1 370 1450"
            fill="none"
            stroke={accentColor}
            strokeWidth="4.5"
            strokeDasharray={450}
            strokeDashoffset={arrowProgress}
            markerEnd="url(#flywheel-arrow)"
            style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
          />

          {/* Arrow 3: Left to Top */}
          <path
            d="M 279 1293 A 265 265 0 0 1 449 998"
            fill="none"
            stroke={accentColor}
            strokeWidth="4.5"
            strokeDasharray={450}
            strokeDashoffset={arrowProgress}
            markerEnd="url(#flywheel-arrow)"
            style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
          />
        </svg>

        {/* 3. Center Hub Label */}
        <AnimatedBlock animation="fade" delaySeconds={0.4}>
          <div style={{
            position: "absolute",
            left: "470px",
            top: "1177px",
            width: "140px",
            height: "140px",
            borderRadius: "999px",
            background: isLight
              ? "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 240, 240, 0.95))"
              : "linear-gradient(135deg, rgba(8, 17, 37, 0.95), rgba(3, 7, 18, 0.92))",
            border: isLight ? `2.5px solid rgba(${rgb}, 0.25)` : `2.5px solid rgba(${rgb}, 0.4)`,
            boxShadow: `0 14px 44px rgba(0,0,0,0.4), inset 0 0 14px rgba(${rgb}, 0.22)`,
            display: "grid",
            placeContent: "center",
            textAlign: "center",
            boxSizing: "border-box"
          }}>
            {/* Core Icon */}
            <div style={{ color: accentColor, justifySelf: "center", marginBottom: "4px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <div style={{
              fontSize: "10px",
              fontWeight: 900,
              color: isLight ? "rgba(0, 0, 0, 0.6)" : "rgba(255, 255, 255, 0.58)",
              fontFamily: styles.fontFamily,
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              lineHeight: 1.15,
              padding: "0 8px"
            }}>
              {category || "GROWTH"}
            </div>
          </div>
        </AnimatedBlock>

        {/* 4. Render the 3 Stages */}
        {flywheelComps.map((comp, idx) => {
          const config = circleConfigs[idx];
          if (!config) return null;
          const { title, subtitle, desc } = parseFlywheelPoint(comp.data.text);

          const animConfig = getAnimationConfig(comp, idx, "scale-in", 0.35 + idx * 0.15, t);
          const floatY = Math.sin(frame / 16 + config.floatPhase) * 6;

          return (
            <div
              key={comp.id || idx}
              style={{
                position: "absolute",
                left: `${config.left}px`,
                top: `${config.top}px`,
                width: `${config.size}px`,
                height: `${config.size}px`,
                transform: `translateY(${floatY}px)`,
                zIndex: 4,
                transition: "transform 0.1s ease-out"
              }}
            >
              <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay} style={{ height: "100%" }}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "999px",
                  padding: "24px",
                  background: isLight
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 245, 0.9) 100%)"
                    : "linear-gradient(135deg, rgba(8, 17, 37, 0.95) 0%, rgba(3, 7, 18, 0.88) 100%)",
                  border: isLight 
                    ? `1.5px solid rgba(${rgb}, 0.25)`
                    : `1.5px solid rgba(${rgb}, 0.35)`,
                  boxShadow: isLight
                    ? `rgba(0,0,0,0.06) 0px 18px 38px, rgba(${rgb}, 0.08) 0px 0px 0px 1px inset`
                    : `rgba(0,0,0,0.3) 0px 22px 50px, rgba(${rgb}, 0.12) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.22) 0px -16px 36px inset`,
                  backdropFilter: "blur(16px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  boxSizing: "border-box",
                  position: "relative"
                }}>
                  {/* Number Badge */}
                  <div style={{
                    position: "absolute",
                    top: "-15px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "36px",
                    height: "36px",
                    borderRadius: "999px",
                    background: accentColor,
                    color: "#ffffff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "16px",
                    fontWeight: 900,
                    border: "2px solid #ffffff",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.15)"
                  }}>
                    {idx + 1}
                  </div>

                  {/* Icon */}
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "16px",
                    background: `rgba(${rgb}, 0.08)`,
                    border: `1px solid rgba(${rgb}, 0.25)`,
                    display: "grid",
                    placeItems: "center",
                    color: accentColor,
                    marginBottom: "10px"
                  }}>
                    {renderIcon(idx)}
                  </div>

                  {/* Title */}
                  <div style={{
                    fontSize: `${Math.round(23 * fontScale)}px`,
                    fontWeight: 900,
                    color: isLight ? "#111111" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    textAlign: "center",
                    marginBottom: "2px"
                  }}>
                    {title}
                  </div>

                  {/* Subtitle */}
                  {subtitle && (
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 900,
                      color: accentColor,
                      fontFamily: styles.fontFamily,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      textAlign: "center",
                      marginBottom: "6px"
                    }}>
                      {subtitle}
                    </div>
                  )}

                  {/* Description */}
                  {desc && (
                    <div style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      color: isLight ? "rgba(0, 0, 0, 0.65)" : "rgba(255, 255, 255, 0.65)",
                      fontFamily: styles.fontFamily,
                      textAlign: "center",
                      lineHeight: 1.3,
                      padding: "0 8px"
                    }}>
                      {desc}
                    </div>
                  )}
                </div>
              </AnimatedBlock>
            </div>
          );
        })}

        {/* 5. Bottom Bar (Additional stages details) */}
        {bottomBarComps.length > 0 && (
          <AnimatedBlock animation="slide-up" delaySeconds={0.8}>
            <div style={{
              position: "absolute",
              left: "126px",
              right: "126px",
              bottom: "186px",
              height: "170px",
              borderRadius: "24px",
              background: isLight 
                ? "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 240, 240, 0.8) 100%)" 
                : "linear-gradient(135deg, rgba(8, 17, 37, 0.6) 0%, rgba(3, 7, 18, 0.4) 100%)",
              border: isLight ? `1px solid rgba(0, 0, 0, 0.1)` : `1px solid rgba(255, 255, 255, 0.08)`,
              backdropFilter: "blur(10px)",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px 10px",
              boxSizing: "border-box",
              boxShadow: "rgba(0,0,0,0.16) 0px 12px 28px"
            }}>
              {bottomBarComps.map((comp, idx) => (
                <div key={idx} style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "14px",
                  padding: "0 14px",
                  borderRight: idx < bottomBarComps.length - 1 ? "1px solid rgba(255, 255, 255, 0.08)" : "none"
                }}>
                  <div style={{ color: accentColor, flexShrink: 0 }}>
                    {renderBottomIcon(idx)}
                  </div>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: isLight ? "#222222" : "rgba(255, 255, 255, 0.8)",
                    fontFamily: styles.fontFamily,
                    lineHeight: 1.35
                  }}>
                    {renderHighlightedText(comp.data.text)}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedBlock>
        )}
      </div>
    );
  }

  const screenHeight = isVertical ? 1920 : 1080;
  const startY = isVertical ? 380 : 180;
  const stepGap = 180;

  const isMapPins = t.id === "IntroMapPinsImage";
  const roadmapProgress = interpolate(frame, [10, 95], [2500, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Pin points coordinates
  const pin1 = { x: 80, y: 176 };
  const pin2 = { x: 580, y: 266 };
  const pin3 = { x: 330, y: 488 };

  // Calculate distances for strokeDashoffset
  const dist1 = 508;
  const dist2 = 334;

  // Path drawing progress
  const progress1 = interpolate(frame, [20, 50], [dist1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const progress2 = interpolate(frame, [55, 85], [dist2, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Location marker scales
  const scalePin1 = interpolate(frame, [5, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scalePin2 = interpolate(frame, [50, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scalePin3 = interpolate(frame, [85, 100], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
      {visibleComps.map((comp, idx) => {
        const pos = resolvedPositions[idx % resolvedPositions.length] || { left: "0px", top: "0px", width: "100%", height: "auto" };
        const itemStyleSetting = t.items.itemStyles[idx % t.items.itemStyles.length] || { fontSize: "28px", fontWeight: "700" };
        const rotation = t.items.rotations[idx % t.items.rotations.length] || 0;

        const cardWrapperStyle: React.CSSProperties = {
          position: "absolute",
          left: isWindingRoadmap ? "95px" : pos.left,
          top: isWindingRoadmap ? `${startY + idx * stepGap - 55}px` : pos.top,
          width: isWindingRoadmap ? "320px" : pos.width,
          height: isWindingRoadmap ? "110px" : pos.height,
          zIndex: parseInt(pos.zIndex || "1"),
          transform: `rotate(${rotation}deg) scale(${itemStyleSetting.scale || 1})`,
          transformOrigin: "center center",
          boxSizing: "border-box"
        };

        const isAccentCard = itemStyleSetting.useAccentBg;
        const isBubble = itemStyleSetting.borderRadius === "999px" || itemStyleSetting.borderRadius === "50%";

        const cardInnerStyle: React.CSSProperties = {
          width: pos.width,
          height: pos.height,
          borderRadius: itemStyleSetting.borderRadius || "30px",
          padding: resolvePadding(itemStyleSetting.padding, paddingScale),
          background: isAccentCard
            ? isBubble
              ? `radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.22), transparent 36%), linear-gradient(145deg, ${accentColor}, ${darkAccentColor})`
              : `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`
            : isBubble
              ? `radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.45), transparent 45%), linear-gradient(145deg, rgba(${rgb}, 0.05) 0%, rgba(${rgb}, 0.22) 100%)`
              : styles.cardStyle.background || styles.cardStyle.backgroundColor,
          border: isAccentCard
            ? `none`
            : styles.cardStyle.border || `1px solid rgba(${rgb}, 0.38)`,
          boxShadow: isBubble
            ? isLight
              ? `rgba(${rgb}, 0.15) 0px 20px 50px, rgba(255, 255, 255, 0.4) 0px 0px 0px 1px inset, rgba(255, 255, 255, 0.25) 0px -15px 30px inset`
              : `rgba(0, 0, 0, 0.3) 0px 24px 60px, rgba(255, 255, 255, 0.12) 0px 0px 0px 1px inset, rgba(255, 255, 255, 0.08) 0px -15px 30px inset`
            : isAccentCard
              ? isLight
                ? `rgba(${rgb}, 0.2) 0px 20px 50px, ${accentColor}4D 0px 0px 30px, rgba(255, 255, 255, 0.4) 0px 0px 0px 1px inset`
                : `rgba(0, 0, 0, 0.4) 0px 30px 88px, ${accentColor}33 0px 0px 36px, rgba(255, 255, 255, 0.12) 0px 0px 0px 1px inset`
              : styles.cardStyle.boxShadow || `rgba(0, 0, 0, 0.26) 0px 18px 48px, rgba(${rgb}, 0.12) 0px 0px 22px`,
          backdropFilter: "blur(16px) saturate(1.15)",
          display: isBubble ? "grid" : "flex",
          placeItems: isBubble ? "center" : "stretch",
          alignContent: isBubble ? "center" : "stretch",
          justifyContent: isBubble ? "center" : "space-between",
          flexDirection: isBubble ? undefined : "column",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
          textTransform: "uppercase"
        };

        const circleStyle: React.CSSProperties = {
          position: "absolute",
          right: "-38px",
          top: "-38px",
          width: isAccentCard ? "178px" : "124px",
          height: isAccentCard ? "178px" : "124px",
          borderRadius: "999px",
          border: isAccentCard
            ? `1px solid rgba(255, 255, 255, 0.15)`
            : `1px solid rgba(${rgb}, 0.26)`,
          boxShadow: isAccentCard
            ? `rgba(255, 255, 255, 0.05) 0px 0px 38px`
            : `rgba(${rgb}, 0.094) 0px 0px 38px`,
          pointerEvents: "none"
        };

        const initials = getInitials(comp.data.text);
        const isFirst = idx === 0;
        const subtext = isFirst ? (titleComp?.data.text || "") : (otherComps[0]?.data.text || "");

        const parsedBaseSize = isBubble ? (pos.width === "318px" ? 38 : 23) : (isFirst ? 76 : 30);
        const dynamicFontSize = getDynamicFontSize(comp.data.text, parsedBaseSize, fontScale);

        const parsedDescBaseSize = isFirst ? 30 : 23;
        const dynamicDescFontSize = getDynamicFontSize(subtext, parsedDescBaseSize, fontScale);

        let animConfig = getAnimationConfig(comp, idx, "scale-in", 0.5, t);
        if (isMapPins) {
          const delays = [0.3, 1.83, 3.0]; // synced with path arrivals (frames 10, 55, 90)
          animConfig = { animation: "scale-in" as const, delay: delays[idx] || 0.5 };
        }
        const activeCardDescColor = isLight ? "rgba(0, 0, 0, 0.72)" : "rgba(255, 255, 255, 0.85)";

        if (isWindingRoadmap) {
          const delay = (10 + (idx / visibleComps.length) * 75) / fps;
          return (
            <div key={comp.id || idx} style={cardWrapperStyle}>
              <AnimatedBlock animation="scale-in" delaySeconds={delay}>
                <div style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "999px",
                  background: isLight 
                    ? "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.88) 100%)" 
                    : "linear-gradient(135deg, rgba(8, 17, 37, 0.72) 0%, rgba(3, 7, 18, 0.58) 100%)",
                  border: isLight ? `1.5px solid rgba(0, 0, 0, 0.08)` : `1.5px solid rgba(${rgb}, 0.25)`,
                  boxShadow: isLight ? "rgba(0,0,0,0.06) 0px 8px 24px" : `0 0 25px rgba(${rgb}, 0.12)`,
                  backdropFilter: "blur(12px)",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  padding: "8px 16px",
                  boxSizing: "border-box",
                  overflow: "hidden"
                }}>
                  {/* Glowing Double-Ring Circle Icon */}
                  <div style={{
                    width: "78px",
                    height: "78px",
                    borderRadius: "50%",
                    border: `3.5px solid ${accentColor}`,
                    boxShadow: `0 0 20px rgba(${rgb}, 0.65)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(3, 7, 18, 0.95)"
                  }}>
                    {idx === 0 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "36px", height: "36px" }}>
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <circle cx="12" cy="14" r="3" />
                        <line x1="14.2" y1="16.2" x2="17.5" y2="19.5" />
                      </svg>
                    )}
                    {idx === 1 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "36px", height: "36px" }}>
                        <circle cx="11" cy="11" r="6" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    )}
                    {idx === 2 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: "36px", height: "36px" }}>
                        <line x1="4" y1="8" x2="20" y2="8" />
                        <line x1="4" y1="16" x2="20" y2="16" />
                        <circle cx="9" cy="8" r="2" fill="none" />
                        <circle cx="15" cy="16" r="2" fill="none" />
                      </svg>
                    )}
                    {idx === 3 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "36px", height: "36px" }}>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    )}
                    {idx >= 4 && (
                      <svg viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: "36px", height: "36px" }}>
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <path d="m9 14 2 2 4-4" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Step Label & Text */}
                  <div style={{
                    marginLeft: "18px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "left"
                  }}>
                    <span style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: accentColor,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "2px",
                      opacity: 0.85
                    }}>
                      STEP 0{idx + 1}
                    </span>
                    <span style={{
                      fontSize: "22px",
                      fontWeight: 800,
                      color: isLight ? "#111827" : "#ffffff",
                      fontFamily: styles.fontFamily,
                      lineHeight: 1.15
                    }}>
                      {comp.data.text}
                    </span>
                  </div>
                </div>
              </AnimatedBlock>
            </div>
          );
        }

        return (
          <div key={comp.id || idx} style={cardWrapperStyle}>
            <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
              <div style={cardInnerStyle}>
                {!isBubble && <div style={circleStyle} />}
                {pos.nestedStructure ? (
                  renderNestedCardContent({
                    ns: pos.nestedStructure,
                    comp,
                    idx,
                    isAccentCard,
                    parentDelay: animConfig.delay,
                    otherComps,
                    accentColor,
                    rgb,
                    isLight,
                    darkAccentColor,
                    styles,
                    fontScale,
                    activeCardTextColor,
                    activeCardBadgeColor,
                    inactiveCardTextColor,
                    theme
                  })
                ) : isBubble ? (
                  <div style={{
                    fontSize: dynamicFontSize,
                    lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.05,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: isAccentCard ? activeCardTextColor : inactiveCardTextColor,
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase",
                    textAlign: "center",
                    padding: "10px",
                    textShadow: isAccentCard ? "none" : isLight ? "none" : "rgba(255, 255, 255, 0.16) 0px 0px 22px"
                  }}>
                    {comp.data.text}
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gap: isFirst ? "14px" : "8px" }}>
                      <div style={{
                        fontSize: isFirst ? "16px" : "13px",
                        fontWeight: 900,
                        letterSpacing: "0.26em",
                        color: isAccentCard ? activeCardBadgeColor : accentColor,
                        fontFamily: styles.fontFamily,
                        opacity: isAccentCard ? 0.8 : 1
                      }}>
                        {initials}
                      </div>
                      <div style={{
                        fontSize: dynamicFontSize,
                        lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.08,
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        color: isAccentCard ? activeCardTextColor : inactiveCardTextColor,
                        fontFamily: styles.fontFamily
                      }}>
                        {comp.data.text}
                      </div>
                    </div>
                    {isFirst && (
                      <div style={{
                        maxWidth: "560px",
                        fontSize: dynamicDescFontSize,
                        lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.15,
                        fontWeight: 780,
                        color: activeCardDescColor,
                        fontFamily: styles.fontFamily
                      }}>
                        {subtext}
                      </div>
                    )}
                  </>
                )}
              </div>
            </AnimatedBlock>
          </div>
        );
      })}
      {isMapPins && (
        <svg style={{ position: "absolute", left: 0, top: 0, width: "1080px", height: "1920px", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
          {/* Connection Line 1 */}
          <line
            x1={pin1.x}
            y1={pin1.y}
            x2={pin2.x}
            y2={pin2.y}
            stroke={accentColor}
            strokeWidth={4}
            strokeDasharray={dist1}
            strokeDashoffset={progress1}
            strokeLinecap="round"
            style={{ opacity: frame >= 20 ? 0.75 : 0 }}
          />
          {/* Connection Line 2 */}
          <line
            x1={pin2.x}
            y1={pin2.y}
            x2={pin3.x}
            y2={pin3.y}
            stroke={accentColor}
            strokeWidth={4}
            strokeDasharray={dist2}
            strokeDashoffset={progress2}
            strokeLinecap="round"
            style={{ opacity: frame >= 55 ? 0.75 : 0 }}
          />

          {/* Location Dot 1 */}
          <g transform={`translate(${pin1.x}, ${pin1.y}) scale(${scalePin1})`} style={{ transformOrigin: "center" }}>
            <circle r={14} fill={accentColor} opacity={0.3} />
            <circle r={7} fill={accentColor} />
          </g>
          {/* Location Dot 2 */}
          <g transform={`translate(${pin2.x}, ${pin2.y}) scale(${scalePin2})`} style={{ transformOrigin: "center" }}>
            <circle r={14} fill={accentColor} opacity={0.3} />
            <circle r={7} fill={accentColor} />
          </g>
          {/* Location Dot 3 */}
          <g transform={`translate(${pin3.x}, ${pin3.y}) scale(${scalePin3})`} style={{ transformOrigin: "center" }}>
            <circle r={14} fill={accentColor} opacity={0.3} />
            <circle r={7} fill={accentColor} />
          </g>
        </svg>
      )}
      {isWindingRoadmap && (() => {
        let pathD = `M 150 0 L 150 ${startY}`;
        for (let i = 0; i < visibleComps.length; i++) {
          const y = startY + i * stepGap;
          if (i < visibleComps.length - 1) {
            pathD += ` L 150 ${y + 30}`;
            pathD += ` Q 150 ${y + 60} 180 ${y + 60}`;
            pathD += ` L 430 ${y + 60}`;
            pathD += ` Q 460 ${y + 60} 460 ${y + 90}`;
            pathD += ` L 460 ${y + stepGap - 60}`;
            pathD += ` Q 460 ${y + stepGap - 30} 430 ${y + stepGap - 30}`;
            pathD += ` L 180 ${y + stepGap - 30}`;
            pathD += ` Q 150 ${y + stepGap - 30} 150 ${y + stepGap}`;
          }
        }
        pathD += ` L 150 ${screenHeight}`;

        return (
          <>
            <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, overflow: "visible" }}>
              <path
                d={pathD}
                fill="none"
                stroke={accentColor}
                strokeWidth={5}
                strokeDasharray={2500}
                strokeDashoffset={roadmapProgress}
                strokeLinecap="round"
                style={{ opacity: 0.8, filter: `drop-shadow(0 0 8px ${accentColor})` }}
              />
            </svg>

            {titleText && (
              <div style={{
                position: "absolute",
                left: isVertical ? "540px" : "1020px",
                top: isVertical ? "380px" : "280px",
                width: isVertical ? "500px" : "780px",
                display: "flex",
                flexDirection: "column",
                gap: isVertical ? "16px" : "24px",
                textAlign: "left"
              }}>
                <AnimatedBlock animation="slide-up" delaySeconds={0.2}>
                  <h1 style={{
                    fontSize: isVertical ? `${Math.round(54 * fontScale)}px` : `${Math.round(76 * fontScale)}px`,
                    fontWeight: 900,
                    color: isLight ? "#111827" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.05,
                    textTransform: "uppercase",
                    margin: 0,
                    textShadow: isLight ? "none" : `0 0 20px rgba(${rgb}, 0.25)`
                  }}>
                    {titleText}
                  </h1>
                </AnimatedBlock>
                
                {otherComps[5] && (
                  <AnimatedBlock animation="slide-up" delaySeconds={0.5}>
                    <p style={{
                      fontSize: isVertical ? "20px" : "28px",
                      fontWeight: 500,
                      color: isLight ? "rgba(17, 24, 39, 0.7)" : "rgba(255, 255, 255, 0.7)",
                      fontFamily: styles.fontFamily,
                      lineHeight: theme === "ai_hub_grid" ? 1.5 : 1.4,
                      margin: 0
                    }}>
                      {otherComps[5].data.text}
                    </p>
                  </AnimatedBlock>
                )}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};
