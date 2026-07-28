import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

export const AIHubGridOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Low speed orbits for two massive glowing blobs of light
  const x1 = interpolate(Math.sin(frame * 0.008), [-1, 1], [0, 100]);
  const y1 = interpolate(Math.cos(frame * 0.008), [-1, 1], [0, 100]);

  const x2 = interpolate(Math.cos(frame * 0.01), [-1, 1], [100, 0]);
  const y2 = interpolate(Math.sin(frame * 0.01), [-1, 1], [100, 0]);

  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none", zIndex: 1 }}>
      {/* Subtle Coordinate Tech Grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(59, 130, 246, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1px, transparent 1px)",
        backgroundSize: "80px 80px"
      }} />

      {/* Floating Neon Glow Circle 1 (Cyan) */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        backgroundColor: "#00f0ff",
        filter: "blur(120px)",
        opacity: 0.1,
        left: `calc(10% + ${x1}px)`,
        top: `calc(15% + ${y1}px)`,
        transform: "translate(-50%, -50%)"
      }} />

      {/* Floating Neon Glow Circle 2 (Blue) */}
      <div style={{
        position: "absolute",
        width: "700px",
        height: "700px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        filter: "blur(140px)",
        opacity: 0.12,
        right: `calc(5% + ${x2}px)`,
        bottom: `calc(10% + ${y2}px)`,
        transform: "translate(50%, 50%)"
      }} />
    </AbsoluteFill>
  );
};
