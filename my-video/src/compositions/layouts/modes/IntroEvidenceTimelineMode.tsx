import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getDynamicFontSize, resolvePadding } from "./LayoutNestedRenderers";

export const IntroEvidenceTimelineMode: React.FC<ModeRendererProps> = ({
  otherComps,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale,
}) => {
  const frame = useCurrentFrame();
  const visibleComps = otherComps.slice(0, 4); // Limit to max 4 cards
  const N = visibleComps.length;

  // 1. Setup frame timelines
  const panDuration = 25; // frames to pan between sections
  const showDuration = 10; // frames holding on section
  const segmentLength = panDuration + showDuration; // 35 frames per section
  const panEndFrame = segmentLength * (N - 1) + 15; // end of horizontal panning phase

  // 2. Interpolate Zoom/Scale and Translation
  const targetScale = Math.max(0.24, 0.8 / N);
  const scale = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [1.0, targetScale], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  // Calculate translateX panning offset
  let currentTranslateX = 0; // in percent of section width
  for (let i = 1; i < N; i++) {
    const startF = i * segmentLength - 10;
    const endF = i * segmentLength + 15;
    if (frame >= startF) {
      const stepVal = interpolate(frame, [startF, endF], [-(i - 1) * 100, -i * 100], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp"
      });
      currentTranslateX = stepVal;
    }
  }

  // Zoom-out transition resets translation back to 0% to center the full row
  const translateX = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [currentTranslateX / N, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  // 3. Draw horizontal timeline beam line
  const lineEndProgress = interpolate(frame, [0, panEndFrame], [0, N * 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  const outerContainerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    zIndex: 5
  };

  const scrollContainerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "row",
    width: `${N * 100}%`,
    height: "100%",
    transform: `scale(${scale}) translateX(${translateX}%)`,
    transformOrigin: "center center",
    alignItems: "center",
    position: "relative",
  };

  return (
    <div style={outerContainerStyle}>
      <div style={scrollContainerStyle}>
        
        {/* Continuous Horizontal Timeline Line */}
        <div style={{
          position: "absolute",
          left: 0,
          right: `${100 - (lineEndProgress / N)}%`,
          height: "6px",
          background: `linear-gradient(90deg, ${accentColor}, ${darkAccentColor})`,
          boxShadow: `0 0 12px ${accentColor}`,
          zIndex: 1
        }} />

        {/* Sections */}
        {visibleComps.map((comp, idx) => {
          const sectionCenterFrame = idx * segmentLength + 10;
          
          // Card slides up from line when current section is reached
          const cardY = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame + 2], [100, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });
          const cardOpacity = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame + 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });

          // Section Node on the timeline
          const nodeScale = interpolate(frame, [sectionCenterFrame - 12, sectionCenterFrame - 2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });

          const sectionStyle: React.CSSProperties = {
            width: `${100 / N}%`,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            boxSizing: "border-box"
          };

          return (
            <div key={comp.id || idx} style={sectionStyle}>
              {/* Card Container above the line */}
              <div style={{
                position: "absolute",
                bottom: "55%", // Above horizontal center line
                transform: `translateY(${cardY}px)`,
                opacity: cardOpacity,
                width: "280px",
                borderRadius: "22px",
                padding: resolvePadding("22px", paddingScale),
                background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 16, 30, 0.8)",
                border: `1.5px solid ${accentColor}33`,
                boxShadow: "0 20px 45px rgba(0,0,0,0.35)",
                backdropFilter: "blur(12px)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                zIndex: 3
              }}>
                <div style={{
                  fontSize: "12px",
                  fontWeight: 900,
                  color: accentColor,
                  fontFamily: styles.fontFamily,
                  letterSpacing: "0.1em"
                }}>
                  PHASE 0{idx + 1}
                </div>
                <div style={{
                  fontSize: getDynamicFontSize(comp.data?.text || "", 22, fontScale),
                  fontWeight: 800,
                  color: isLight ? "#1f2937" : "#ffffff",
                  fontFamily: styles.fontFamily,
                  lineHeight: 1.3
                }}>
                  {comp.data?.text || ""}
                </div>
              </div>

              {/* Node Dot on the timeline */}
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
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
};
