import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getDynamicFontSize, resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";
import { highlightHeadingText } from "../../../components/layout/UIBlocks";

export const IntroEvidenceTimelineMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
  titleText,
  category,
  theme,
  highlightWords,
}) => {
  const frame = useCurrentFrame();
  const { width: viewportWidth, fps, durationInFrames } = useVideoConfig();

  // Separate rendering logic based on template ID
  if (t.id === "TimelineBeamRail") {
    // -------------------------------------------------------------
    // Horizontal Panning Timeline with Grid Zoom-Out (Timeline Beam Rail)
    // -------------------------------------------------------------
    const visibleComps = otherComps.slice(0, 4); // Limit to max 4 cards
    const N = visibleComps.length;

    // 1. Calculate trigger frames by dividing half of the scene duration equally among cards
    const halfDuration = Math.round(durationInFrames / 2);
    const interval = N > 1 ? halfDuration / (N - 1) : 0;
    const triggerFrames = visibleComps.map((_, idx) => Math.round(idx * interval));

    const lastTrigger = triggerFrames[N - 1]; // This is exactly halfDuration

    // Compute scrollX and lineProgressX dynamically using triggerFrames
    let lineProgressX = 0;
    let scrollX = 0;

    // Segment 0: 0 to triggerFrames[0] (which is 0)
    if (frame < triggerFrames[0]) {
      lineProgressX = 0;
      scrollX = 0;
    } else {
      lineProgressX = viewportWidth / 2;
      scrollX = 0;
    }

    // Subsequent segments
    for (let i = 1; i < N; i++) {
      const prevTrigger = triggerFrames[i - 1];
      const currTrigger = triggerFrames[i];
      const panStart = prevTrigger;
      const panEnd = currTrigger;

      if (frame >= panStart) {
        scrollX = interpolate(frame, [panStart, panEnd], [(i - 1) * viewportWidth, i * viewportWidth], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
        lineProgressX = interpolate(frame, [panStart, panEnd], [(i - 0.5) * viewportWidth, (i + 0.5) * viewportWidth], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
      }
    }

    if (frame > lastTrigger) {
      scrollX = (N - 1) * viewportWidth;
      lineProgressX = (N - 0.5) * viewportWidth;
    }

    // 2. Line coordinates (relative to viewport center)
    const panningLineStartX = -viewportWidth / 2 - scrollX;
    const panningLineEndX = lineProgressX - viewportWidth / 2 - scrollX;

    const zoomedLineStartX = -290;
    const zoomedLineEndX = 290;

    // Zoom-out phase starts 30 frames after the last card has appeared, takes 25 frames
    const zoomOutStart = lastTrigger + 30;
    const zoomOutEnd = zoomOutStart + 25;

    // Interpolate line boundaries during Zoom-out phase
    const lineX1 = interpolate(frame, [zoomOutStart, zoomOutEnd], [panningLineStartX, zoomedLineStartX], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    const lineX2 = interpolate(frame, [zoomOutStart, zoomOutEnd], [panningLineEndX, zoomedLineEndX], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });

    const lineLeft = viewportWidth / 2 + lineX1;
    const lineWidth = lineX2 - lineX1;

    // Header parameters
    const mainTitle = titleText || "Code Ra Video";
    const bottomCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");
    const hasCategory = !!bottomCategory;

    // Card dimensions: Active phase is 420x320, zoom-out shrinks to 380x280 to fit side-by-side
    const cardWidth = interpolate(frame, [zoomOutStart, zoomOutEnd], [420, 380], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    const cardHeight = interpolate(frame, [zoomOutStart, zoomOutEnd], [320, 280], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    const cardPadding = interpolate(frame, [zoomOutStart, zoomOutEnd], [24, 20], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });
    const cardBaseFontSize = interpolate(frame, [zoomOutStart, zoomOutEnd], [30, 22], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    });

    return (
      <div style={{
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        zIndex: 5
      }}>
        {/* Absolute Top Header (Always centered and fully visible) */}
        <div style={{
          position: "absolute",
          top: "80px",
          left: "40px",
          right: "40px",
          zIndex: 10
        }}>
          <AnimatedBlock animation="slide-down" delaySeconds={0.2}>
            <div style={{ display: "grid", gap: "14px", width: "100%" }}>
              {hasCategory && (
                <div style={{
                  width: "fit-content",
                  borderRadius: "999px",
                  padding: "8px 14px",
                  background: isLight ? "rgba(0,0,0,0.05)" : "rgba(2, 6, 23, 0.78)",
                  color: isLight ? "#1f2937" : "rgb(255, 255, 255)",
                  border: `1px solid rgba(${rgb}, 0.4)`,
                  fontSize: "14px",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  fontFamily: styles.fontFamily
                }}>{bottomCategory}</div>
              )}
              <div style={{
                fontSize: `${Math.round(72 * fontScale)}px`,
                lineHeight: 1.25,
                fontWeight: 950,
                color: isLight ? "#1f2937" : "rgb(248, 250, 252)",
                textTransform: "uppercase",
                fontFamily: styles.fontFamily,
                textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.6) 0px 15px 35px, rgba(${rgb}, 0.15) 0px 0px 25px`
              }}>
                {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
              </div>
            </div>
          </AnimatedBlock>
        </div>

        {/* Middle Section: Timeline Rail Container */}
        <div style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "55%",
          height: "400px",
          transform: "translateY(-50%)",
          overflow: "visible"
        }}>
          {/* Horizontal Timeline Line */}
          <div style={{
            position: "absolute",
            left: `${lineLeft}px`,
            width: `${lineWidth}px`,
            top: "50%",
            transform: "translateY(-50%)",
            height: "6px",
            borderRadius: "999px",
            background: `linear-gradient(90deg, ${accentColor}, ${darkAccentColor})`,
            boxShadow: `0 0 14px ${accentColor}`,
            zIndex: 1
          }} />

          {/* Render Sections (Cards + Nodes) */}
          {visibleComps.map((comp, idx) => {
            const triggerFrame = triggerFrames[idx];

            // Node scale on timeline
            const nodeScale = interpolate(frame, [triggerFrame - 8, triggerFrame], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            // Card emergence animation values (perfectly synchronized when node appears)
            const cardYOffsetActive = interpolate(frame, [triggerFrame, triggerFrame + 12], [50, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });
            const cardOpacity = interpolate(frame, [triggerFrame, triggerFrame + 12], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            // Grid Coordinates for Zoom-Out Phase
            // Dot coordinates (X, Y) relative to viewport center
            const panningX = idx * viewportWidth - scrollX;
            const panningY = 0;

            let zoomedX = 0;
            if (idx === 0) zoomedX = -250;
            else if (idx === 1) zoomedX = 250;
            else if (idx === 2) zoomedX = (N === 3) ? 0 : -250;
            else if (idx === 3) zoomedX = 250;

            const zoomedY = 0;

            // Transition dot coordinates
            const x = interpolate(frame, [zoomOutStart, zoomOutEnd], [panningX, zoomedX], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });
            const y = interpolate(frame, [zoomOutStart, zoomOutEnd], [panningY, zoomedY], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            // Symmetrical vertical offsets:
            // Active phase is height 320 -> offset -190px (bottom sits 30px above line)
            // Zoom-out is height 280 -> offset -170px (above) or +170px (below)
            const panningCardYOffset = -190; 
            const zoomedCardYOffset = (idx === 0 || idx === 1) ? -170 : 170; 

            const cardYOffsetTranslate = interpolate(frame, [zoomOutStart, zoomOutEnd], [panningCardYOffset, zoomedCardYOffset], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            // Card scale zooms slightly to 0.95 during final view
            const scale = interpolate(frame, [zoomOutStart, zoomOutEnd], [1.0, 0.95], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp"
            });

            // Card vertical Y translation combining emergence offset and row position offset
            const totalCardY = cardYOffsetTranslate + cardYOffsetActive;

            const sectionStyle: React.CSSProperties = {
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
              width: "0px",
              height: "0px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxSizing: "border-box",
              zIndex: 2
            };

            return (
              <div key={comp.id || idx} style={sectionStyle}>
                {/* Card Container (Centered dynamically as a moderate squarish box) */}
                <div style={{
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  transform: `translate(-50%, calc(-50% + ${totalCardY}px))`,
                  opacity: cardOpacity,
                  width: `${cardWidth}px`, 
                  height: `${cardHeight}px`, 
                  borderRadius: "24px", 
                  padding: resolvePadding(`${cardPadding}px`, paddingScale), 
                  background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 16, 30, 0.82)",
                  border: `1.5px solid ${accentColor}33`,
                  boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(16px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center", 
                  alignItems: "flex-start",     // Left align items horizontally
                  textAlign: "left",           // Left align text
                  gap: "12px",
                  zIndex: 3
                }}>
                  <div style={{
                    fontSize: "12px",
                    fontWeight: 900,
                    color: accentColor,
                    fontFamily: styles.fontFamily,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase"
                  }}>
                    PHASE 0{idx + 1}
                  </div>
                  <div style={{
                    fontSize: getDynamicFontSize(comp.data?.text || "", cardBaseFontSize, fontScale), 
                    fontWeight: 800,
                    color: isLight ? "#1f2937" : "#ffffff",
                    fontFamily: styles.fontFamily,
                    lineHeight: 1.35
                  }}>
                    {comp.data?.text || ""}
                  </div>
                </div>

                {/* Node Dot (Centered exactly at X, Y relative to timeline line) */}
                <div style={{
                  position: "absolute",
                  left: "0px",
                  top: "0px",
                  transform: `translate(-50%, -50%) scale(${nodeScale})`,
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: `4px solid ${accentColor}`,
                  boxShadow: `0 0 15px ${accentColor}`,
                  zIndex: 2
                }} />
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    // -------------------------------------------------------------
    // Classic Vertical Timeline (Intro Evidence Timeline Image)
    // -------------------------------------------------------------
    const mainTitle = titleText || "Code Ra Video";
    const bottomCategory = category || (t.categoryPill?.text?.trim().toLowerCase() !== "ai viết video" && t.categoryPill?.text?.trim().toLowerCase() !== "ai viet video" ? t.categoryPill?.text : "");
    const hasCategory = !!bottomCategory;

    const stepConfigs = [
      {
        num: "01",
        badgeText: "FIRST SIGNAL",
        marginLeft: "0px",
        maxWidth: "580px",
        isHighlighted: false
      },
      {
        num: "02",
        badgeText: "THEN EVIDENCE",
        marginLeft: "64px",
        maxWidth: "520px",
        isHighlighted: false
      },
      {
        num: "03",
        badgeText: "NOW IMPACT",
        marginLeft: "0px",
        maxWidth: "580px",
        isHighlighted: true 
      }
    ];

    const renderedConfigs = stepConfigs.slice(0, otherComps.length);

    return (
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "920px",
        minHeight: "1050px",
        alignSelf: "center",
        zIndex: 5,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between"
      }}>
        {/* Top Section: Timeline Box Area */}
        <div style={{ position: "relative", width: "100%", height: "620px" }}>
          {/* Vertical gradient timeline line */}
          <div style={{
            position: "absolute",
            left: "26px", 
            top: "15px",
            bottom: "15px",
            width: "4px",
            borderRadius: "999px",
            background: `linear-gradient(180deg, rgb(253, 230, 138), ${accentColor}, ${darkAccentColor})`,
            boxShadow: `rgba(${rgb}, 0.26) 0px 0px 24px`,
            pointerEvents: "none",
            zIndex: 2
          }} />

          {/* Timeline content wrapper */}
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            zIndex: 3
          }}>
            {renderedConfigs.map((config, idx) => {
              const comp = otherComps[idx];
              const textVal = comp?.data?.text || "";

              const animConfig = comp
                ? getAnimationConfig(comp, idx, "slide-right", 0.15 + idx * 0.12, t)
                : { animation: "slide-right" as const, delay: 0.15 + idx * 0.12 };

              const isHighlighted = config.isHighlighted;

              let nodeBg = "";
              let nodeBorder = "";
              let nodeShadow = "";

              let cardBg = "";
              let cardBorder = "";
              let cardShadow = "";
              let cardTextColor = "";

              if (isHighlighted) {
                nodeBg = `linear-gradient(135deg, ${accentColor}, ${darkAccentColor})`;
                nodeBorder = `2px solid ${accentColor}`;
                nodeShadow = `rgba(${rgb}, 0.3) 0px 0px 22px`;

                cardBg = isLight
                  ? `linear-gradient(90deg, #ffffff, rgba(${rgb}, 0.08))`
                  : (styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || `linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(${rgb}, 0.15))`);
                cardBorder = `2px solid ${accentColor}`;
                cardShadow = isLight
                  ? `rgba(0,0,0,0.1) 0px 20px 46px, rgba(${rgb},0.15) 0px 0px 22px`
                  : `rgba(0, 0, 0, 0.4) 0px 24px 56px, rgba(${rgb}, 0.25) 0px 0px 32px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset`;
                cardTextColor = isLight ? "#0f172a" : "rgb(249, 247, 255)";
              } else {
                nodeBg = isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(15, 23, 42, 0.9)";
                nodeBorder = isLight ? `2px solid rgba(${rgb}, 0.4)` : `2px solid rgba(${rgb}, 0.6)`;
                nodeShadow = "none";

                cardBg = isLight
                  ? "linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))"
                  : (styles?.cardStyle?.background || styles?.cardStyle?.backgroundColor || "linear-gradient(90deg, rgba(2, 6, 23, 0.82), rgba(15, 23, 42, 0.54))");
                cardBorder = isLight
                  ? "1px solid rgba(0,0,0,0.08)"
                  : `1px solid rgba(${rgb}, 0.36)`;
                cardShadow = isLight
                  ? "rgba(0, 0, 0, 0.04) 0px 18px 40px"
                  : `rgba(0, 0, 0, 0.34) 0px 20px 46px, rgba(${rgb}, 0.1) 0px 0px 22px, rgba(255, 255, 255, 0.06) 0px 0px 0px 1px inset`;
                cardTextColor = isLight ? "#1e293b" : "rgb(249, 247, 255)";
              }

              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "54px minmax(0px, 1fr)",
                    alignItems: "center",
                    gap: "18px",
                    maxWidth: config.maxWidth,
                    marginLeft: config.marginLeft,
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
                  <div style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "999px",
                    background: nodeBg,
                    border: nodeBorder,
                    boxShadow: nodeShadow,
                    color: isHighlighted ? "#ffffff" : accentColor,
                    display: "grid",
                    placeItems: "center",
                    fontSize: "15px",
                    fontWeight: 900,
                    letterSpacing: "0.08em",
                    fontFamily: styles.fontFamily,
                    zIndex: 4
                  }}>
                    {config.num}
                  </div>

                  <AnimatedBlock animation={animConfig.animation} delaySeconds={animConfig.delay}>
                    <div style={{
                      display: "grid",
                      gap: "8px",
                      borderRadius: "18px",
                      padding: "16px 18px",
                      background: cardBg,
                      border: cardBorder,
                      boxShadow: cardShadow,
                      backdropFilter: "blur(16px)",
                      boxSizing: "border-box"
                    }}>
                      <div style={{
                        color: isHighlighted ? accentColor : accentColor,
                        fontSize: "11px",
                        fontWeight: 900,
                        letterSpacing: "0.17em",
                        textTransform: "uppercase",
                        fontFamily: styles.fontFamily
                      }}>
                        {config.badgeText}
                      </div>
                      <div style={{
                        fontSize: `${Math.round(29 * fontScale)}px`,
                        lineHeight: 1.4,
                        fontWeight: 900,
                        letterSpacing: "-0.04em",
                        textTransform: "uppercase",
                        color: cardTextColor,
                        fontFamily: styles.fontFamily
                      }}>
                        {textVal}
                      </div>
                    </div>
                  </AnimatedBlock>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Headline */}
        <AnimatedBlock animation="slide-up" delaySeconds={0.5}>
          <div style={{
            display: "grid",
            gap: "18px",
            width: "100%",
            paddingBottom: "16px",
            boxSizing: "border-box"
          }}>
            {hasCategory && (
              <div style={{
                width: "fit-content",
                borderRadius: "999px",
                padding: "10px 16px",
                background: isLight ? "rgba(0,0,0,0.05)" : "rgba(2, 6, 23, 0.78)",
                color: isLight ? "#1f2937" : "rgb(255, 255, 255)",
                border: `1px solid rgba(${rgb}, 0.4)`,
                fontSize: "18px",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                boxShadow: isLight ? "none" : `rgba(0, 0, 0, 0.32) 0px 18px 40px, rgba(${rgb}, 0.12) 0px 0px 22px`,
                fontFamily: styles.fontFamily
              }}>
                {bottomCategory}
              </div>
            )}

            <div style={{
              maxWidth: "820px",
              fontSize: `${Math.round(106 * fontScale)}px`,
              lineHeight: 1.32,
              fontWeight: 900,
              letterSpacing: "-0.075em",
              color: isLight ? "#1f2937" : "rgb(248, 250, 252)",
              textTransform: "uppercase",
              fontFamily: styles.fontFamily,
              textShadow: isLight ? "none" : `rgba(0, 0, 0, 0.62) 0px 22px 54px, rgba(${rgb}, 0.14) 0px 0px 34px`
            }}>
              {highlightHeadingText(mainTitle, accentColor, theme, highlightWords)}
            </div>
          </div>
        </AnimatedBlock>
      </div>
    );
  }
};
