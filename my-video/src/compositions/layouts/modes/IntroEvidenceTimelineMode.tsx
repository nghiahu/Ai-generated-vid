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

  // 1. Setup frame timelines dynamically
  const panDuration = 25; 
  const showDuration = 10; 
  const segmentLength = panDuration + showDuration; 
  const panEndFrame = segmentLength * (N - 1) + 15; 

  // Compute scrollX and lineProgressX dynamically
  let lineProgressX = 0;
  let scrollX = 0;

  for (let i = 0; i < N; i++) {
    const startF = i === 0 ? 0 : i * segmentLength - 10;
    const endF = i === 0 ? 10 : i * segmentLength + 15;
    
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
  // Panning line segment bounds
  const panningLineStartX = -viewportWidth / 2 - scrollX;
  const panningLineEndX = lineProgressX - viewportWidth / 2 - scrollX;

  // Zoomed-out line segment bounds
  const zoomedLineStartX = -250;
  const zoomedLineEndX = 250;

  // Interpolate line boundaries during Zoom-out phase
  const lineX1 = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningLineStartX, zoomedLineStartX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });
  const lineX2 = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningLineEndX, zoomedLineEndX], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", zIndex: 5 }}>
      {/* SVG Line (Renders from x1 to x2 relative to viewport center) */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
        <line
          x1={`${viewportWidth / 2 + lineX1}`}
          y1="50%"
          x2={`${viewportWidth / 2 + lineX2}`}
          y2="50%"
          stroke={`url(#timeline-grad-${accentColor.replace("#", "")})`}
          strokeWidth="6"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 10px ${accentColor}88)`
          }}
        />
        <defs>
          <linearGradient id={`timeline-grad-${accentColor.replace("#", "")}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={accentColor} />
            <stop offset="100%" stopColor={darkAccentColor} />
          </linearGradient>
        </defs>
      </svg>

      {/* Render Sections (Cards + Nodes) */}
      {visibleComps.map((comp, idx) => {
        const sectionCenterFrame = idx * segmentLength + 10;

        // Node scale on timeline
        const nodeScale = interpolate(frame, [sectionCenterFrame - 12, sectionCenterFrame - 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Card emergence animation values
        const cardYOffsetActive = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame + 2], [100, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });
        const cardOpacity = interpolate(frame, [sectionCenterFrame - 8, sectionCenterFrame + 2], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // 3. Grid Coordinates for Zoom-Out Phase
        // Dot coordinates (X, Y) relative to viewport center
        const panningX = idx * viewportWidth - scrollX;
        const panningY = 0;

        let zoomedX = 0;
        if (idx === 0) zoomedX = -200;
        else if (idx === 1) zoomedX = 200;
        else if (idx === 2) zoomedX = (N === 3) ? 0 : -200;
        else if (idx === 3) zoomedX = 200;

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

        // Card vertical offset (from above-the-line to below-the-line for Card 2 & 3)
        const panningCardYOffset = -180; // above dot
        const zoomedCardYOffset = (idx === 0 || idx === 1) ? -180 : 180; // Row 1 above line, Row 2 below line

        const cardYOffsetTranslate = interpolate(frame, [panEndFrame + 10, panEndFrame + 35], [panningCardYOffset, zoomedCardYOffset], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        // Card scale zooms slightly to 0.95 (perfect fit for 2 columns in 1080px)
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
              width: "360px",
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
                fontSize: getDynamicFontSize(comp.data?.text || "", 24, fontScale),
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
