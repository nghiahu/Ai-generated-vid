import React from "react";
import { useCurrentFrame, interpolate, useVideoConfig } from "remotion";
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
  isVertical,
}) => {
  const frame = useCurrentFrame();
  const { width: viewportWidth } = useVideoConfig();
  const visibleComps = otherComps.slice(0, 4); // Limit to max 4 cards
  const N = visibleComps.length;

  // 1. Setup frame timelines
  const panDuration = 25; 
  const showDuration = 10; 
  const segmentLength = panDuration + showDuration; 
  const panEndFrame = segmentLength * (N - 1) + 15; 

  // 2. Camera scroll position (scrollX) during panning phase
  let scrollX = 0; 
  for (let i = 1; i < N; i++) {
    const startF = i * segmentLength - 10;
    const endF = i * segmentLength + 15;
    if (frame >= startF) {
      scrollX = interpolate(frame, [startF, endF], [(i - 1) * viewportWidth, i * viewportWidth], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp"
      });
    }
  }

  // 3. Static horizontal timeline line scale & opacity
  const lineScaleX = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lineOpacity = interpolate(frame, [panEndFrame + 10, panEndFrame + 25], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", zIndex: 5 }}>
      {/* Static Horizontal Timeline Line */}
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        transform: `translateY(-50%) scaleX(${lineScaleX})`,
        height: "6px",
        background: `linear-gradient(90deg, ${accentColor}, ${darkAccentColor})`,
        boxShadow: `0 0 12px ${accentColor}`,
        opacity: lineOpacity,
        zIndex: 1
      }} />

      {/* Render Sections (Cards + Nodes) */}
      {visibleComps.map((comp, idx) => {
        const sectionCenterFrame = idx * segmentLength + 10;

        // Card emergence
        const cardYOffset = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame + 2], [100, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
        const cardOpacity = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame + 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Node scale on timeline
        const nodeScale = interpolate(frame, [sectionCenterFrame - 12, sectionCenterFrame - 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Calculate card coordinates dynamically
        // Panning position
        const panningX = idx * viewportWidth - scrollX;
        const panningY = 0;

        // Zoomed final position: 
        // - Vertical (9:16): vertical stack of cards in center (X = 0, Y is stacked)
        // - Landscape (16:9): horizontal row of cards in center (X is row, Y = 0)
        const zoomedX = isVertical ? 0 : (idx - (N - 1) / 2) * 320;
        const zoomedY = isVertical ? (idx - (N - 1) / 2) * 310 : 0;

        // Smooth transition to zoomed out layout
        const x = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningX, zoomedX], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
        const y = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningY, zoomedY], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Card scale: stays 1.0 during panning, zooms slightly down to 0.85/0.8 (NOT tiny 0.3)
        const scale = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [1.0, isVertical ? 0.85 : 0.8], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        const sectionStyle: React.CSSProperties = {
          position: "absolute",
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale})`,
          width: "320px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxSizing: "border-box",
          zIndex: 2
        };

        return (
          <div key={comp.id || idx} style={sectionStyle}>
            {/* Card Container */}
            <div style={{
              position: "absolute",
              bottom: "54%", // Above node dot
              transform: `translateY(${cardYOffset}px)`,
              opacity: cardOpacity,
              width: "300px",
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

            {/* Node Dot */}
            <div style={{
              position: "absolute",
              top: "50%",
              transform: `translateY(-50%) scale(${nodeScale})`,
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
  );
};
