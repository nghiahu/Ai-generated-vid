import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getDynamicFontSize, resolvePadding } from "./LayoutNestedRenderers";

export const TimelineShiftMode: React.FC<ModeRendererProps> = ({
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
  const visibleComps = otherComps.slice(0, 3); // Max 3 steps for zig-zag
  const N = visibleComps.length;

  // 1. Coordinates for the path (in percentages of container)
  const startPt = { x: 15, y: 15 };
  const cardPts = [
    { x: 32, y: 38 },
    { x: 68, y: 60 },
    { x: 32, y: 82 }
  ];

  // 2. Animate the starting node (Frame 0-25)
  const startScale = interpolate(frame, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const startX = interpolate(frame, [12, 25], [50, startPt.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const startY = interpolate(frame, [12, 25], [50, startPt.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 3. Interpolate the traveling projectile ball position (Frame 25-100)
  let ballX = startPt.x;
  let ballY = startPt.y;
  const isBallActive = frame >= 25 && frame < (25 + N * 25);

  if (isBallActive) {
    const segmentIdx = Math.min(N - 1, Math.floor((frame - 25) / 25));
    const segmentFrame = (frame - 25) % 25;
    const fromPt = segmentIdx === 0 ? startPt : cardPts[segmentIdx - 1];
    const toPt = cardPts[segmentIdx];
    ballX = interpolate(segmentFrame, [0, 25], [fromPt.x, toPt.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    ballY = interpolate(segmentFrame, [0, 25], [fromPt.y, toPt.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  } else if (frame >= (25 + N * 25)) {
    ballX = cardPts[N - 1].x;
    ballY = cardPts[N - 1].y;
  }

  // 4. Animate drawing of connecting line trails
  const renderLineSegment = (from: { x: number; y: number }, to: { x: number; y: number }, startF: number, endF: number, id: number) => {
    if (frame < startF) return null;
    const curX = interpolate(frame, [startF, endF], [from.x, to.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const curY = interpolate(frame, [startF, endF], [from.y, to.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
      <line
        key={id}
        x1={`${from.x}%`}
        y1={`${from.y}%`}
        x2={`${curX}%`}
        y2={`${curY}%`}
        stroke={accentColor}
        strokeWidth="4"
        strokeLinecap="round"
        style={{
          filter: `drop-shadow(0 0 8px ${accentColor})`
        }}
      />
    );
  };

  const animStyles = `
    @keyframes timeline-card-float-left {
      0% { transform: translate(-50%, -50%) scale(1.0) translateY(0px); }
      50% { transform: translate(-50%, -50%) scale(1.0) translateY(-6px); }
      100% { transform: translate(-50%, -50%) scale(1.0) translateY(0px); }
    }
    @keyframes timeline-card-float-right {
      0% { transform: translate(-50%, -50%) scale(1.0) translateY(0px); }
      50% { transform: translate(-50%, -50%) scale(1.0) translateY(6px); }
      100% { transform: translate(-50%, -50%) scale(1.0) translateY(0px); }
    }
  `;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 5 }}>
      <style>{animStyles}</style>
      
      {/* Dynamic SVG Trail Line */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
        {renderLineSegment(startPt, cardPts[0], 25, 50, 0)}
        {N > 1 && renderLineSegment(cardPts[0], cardPts[1], 50, 75, 1)}
        {N > 2 && renderLineSegment(cardPts[1], cardPts[2], 75, 100, 2)}
      </svg>

      {/* Starting Node */}
      <div style={{
        position: "absolute",
        left: `${startX}%`,
        top: `${startY}%`,
        transform: `translate(-50%, -50%) scale(${startScale})`,
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background: "#ffffff",
        border: `3px solid ${accentColor}`,
        boxShadow: `0 0 15px ${accentColor}`,
        zIndex: 3
      }} />

      {/* Traveling Projectile Ball */}
      {(frame >= 25 && frame < (25 + N * 25)) && (
        <div style={{
          position: "absolute",
          left: `${ballX}%`,
          top: `${ballY}%`,
          transform: "translate(-50%, -50%)",
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "#ffffff",
          boxShadow: `0 0 20px #ffffff, 0 0 40px ${accentColor}`,
          zIndex: 4
        }} />
      )}

      {/* Render Spring-Popping Cards */}
      {visibleComps.map((comp, idx) => {
        const pt = cardPts[idx];
        const triggerFrame = 50 + idx * 25;
        const isLeft = idx % 2 === 0;
        
        // Spring scale interpolation: starts at 0, overshoots to 1.1, settles at 1.0
        const scale = interpolate(frame, [triggerFrame, triggerFrame + 6, triggerFrame + 12], [0, 1.1, 1.0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp"
        });

        if (frame < triggerFrame) return null;

        const isFullyIn = frame >= (triggerFrame + 12);

        const cardStyle: React.CSSProperties = {
          position: "absolute",
          left: `${pt.x}%`,
          top: `${pt.y}%`,
          transform: `translate(-50%, -50%) scale(${scale})`,
          width: "360px",
          borderRadius: "20px",
          padding: resolvePadding("20px", paddingScale),
          background: isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(10, 16, 30, 0.8)",
          border: `1.5px solid ${accentColor}44`,
          boxShadow: `0 15px 35px rgba(0, 0, 0, 0.3), 0 0 20px rgba(${rgb}, 0.1)`,
          backdropFilter: "blur(12px)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          boxSizing: "border-box",
          zIndex: 2,
          animation: isFullyIn 
            ? (isLeft ? "timeline-card-float-left 5s ease-in-out infinite" : "timeline-card-float-right 5s ease-in-out infinite") 
            : undefined
        };

        return (
          <div key={comp.id || idx} style={cardStyle}>
            <div style={{
              fontSize: "12px",
              fontWeight: 900,
              color: accentColor,
              fontFamily: styles.fontFamily,
              letterSpacing: "0.1em"
            }}>
              STEP 0{idx + 1}
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
        );
      })}
    </div>
  );
};
