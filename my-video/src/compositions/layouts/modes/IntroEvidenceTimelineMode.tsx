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
}) => {
  const frame = useCurrentFrame();
  const { width: viewportWidth } = useVideoConfig();
  const visibleComps = otherComps.slice(0, 4); // Limit to max 4 cards
  const N = visibleComps.length;

  // 1. Setup frame timelines dynamically (slower, matching exact content block appearances)
  const panDuration = 35; 
  const showDuration = 15; 
  const segmentLength = panDuration + showDuration; 
  const panEndFrame = segmentLength * (N - 1) + 20; 

  // Compute scrollX and lineProgressX dynamically
  let lineProgressX = 0;
  let scrollX = 0;

  for (let i = 0; i < N; i++) {
    const startF = i === 0 ? 0 : i * segmentLength - 10;
    const endF = i === 0 ? 15 : i * segmentLength + 25; 
    
    if (frame >= startF) {
      const prevVal = i === 0 ? 0 : (i - 0.5) * viewportWidth;
      const targetVal = (i + 0.5) * viewportWidth;
      lineProgressX = interpolate(frame, [startF, endF], [prevVal, targetVal], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    }
    
    if (i > 0 && frame >= startF) {
      scrollX = interpolate(frame, [startF, endF], [(i - 1) * viewportWidth, i * viewportWidth], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp"
      });
    }
  }

  if (frame > panEndFrame) {
    scrollX = (N - 1) * viewportWidth;
    lineProgressX = (N - 0.5) * viewportWidth;
  }

  // 2. Line coordinates (relative to viewport center)
  const panningLineStartX = -viewportWidth / 2 - scrollX;
  const panningLineEndX = lineProgressX - viewportWidth / 2 - scrollX;

  const zoomedLineStartX = -280;
  const zoomedLineEndX = 280;

  // Interpolate line boundaries during Zoom-out phase
  const lineX1 = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningLineStartX, zoomedLineStartX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const lineX2 = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningLineEndX, zoomedLineEndX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  const lineLeft = viewportWidth / 2 + lineX1;
  const lineWidth = lineX2 - lineX1;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", zIndex: 5 }}>
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
        const sectionCenterFrame = idx === 0 ? 15 : idx * segmentLength + 25;

        // Node scale on timeline
        const nodeScale = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Card emergence animation values (perfectly synchronized when node appears)
        const cardYOffsetActive = interpolate(frame, [sectionCenterFrame, sectionCenterFrame + 10], [50, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
        const cardOpacity = interpolate(frame, [sectionCenterFrame, sectionCenterFrame + 10], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // 3. Grid Coordinates for Zoom-Out Phase
        // Dot coordinates (X, Y) relative to viewport center
        const panningX = idx * viewportWidth - scrollX;
        const panningY = 0;

        let zoomedX = 0;
        if (idx === 0) zoomedX = -230;
        else if (idx === 1) zoomedX = 230;
        else if (idx === 2) zoomedX = (N === 3) ? 0 : -230;
        else if (idx === 3) zoomedX = 230;

        const zoomedY = 0;

        // Transition dot coordinates
        const x = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningX, zoomedX], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
        const y = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningY, zoomedY], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Card vertical offset (goes from center 0 to above/below the line in zoom-out)
        const panningCardYOffset = 0; // Exactly centered in viewport during active panning
        const zoomedCardYOffset = (idx === 0 || idx === 1) ? -160 : 160; 

        const cardYOffsetTranslate = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningCardYOffset, zoomedCardYOffset], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Card scale zooms slightly to 0.95 during final view
        const scale = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [1.0, 0.95], {
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
            {/* Card Container */}
            <div style={{
              position: "absolute",
              transform: `translate(-50%, calc(-50% + ${totalCardY}px))`,
              opacity: cardOpacity,
              width: "440px", // Giant cards for premium legibility
              borderRadius: "24px",
              padding: resolvePadding("24px", paddingScale),
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
                fontSize: "13px",
                fontWeight: 900,
                color: accentColor,
                fontFamily: styles.fontFamily,
                letterSpacing: "0.1em"
              }}>
                PHASE 0{idx + 1}
              </div>
              <div style={{
                fontSize: getDynamicFontSize(comp.data?.text || "", 26, fontScale),
                fontWeight: 800,
                color: isLight ? "#1f2937" : "#ffffff",
                fontFamily: styles.fontFamily,
                lineHeight: 1.3
              }}>
                {comp.data?.text || ""}
              </div>
            </div>

            {/* Node Dot (Centered exactly at X, Y relative to timeline line) */}
            <div style={{
              position: "absolute",
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
  );
};
