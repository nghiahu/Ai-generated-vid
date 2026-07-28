import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export interface AccentGlowBackgroundProps {
  accentColor: string;
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  if (!hex) return `rgba(255, 183, 197, ${alpha})`;
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const AccentGlowBackground: React.FC<AccentGlowBackgroundProps> = ({ accentColor }) => {
  const frame = useCurrentFrame();

  const glowColor = hexToRgba(accentColor || "#FFB7C5", 0.18);

  // Slow movement and pulse for the glow bubbles
  const bubble1SwayX = interpolate(Math.sin(frame * 0.015), [-1, 1], [-120, 120]);
  const bubble1SwayY = interpolate(Math.cos(frame * 0.012), [-1, 1], [-80, 80]);
  const bubble1Scale = interpolate(Math.sin(frame * 0.01), [-1, 1], [0.9, 1.25]);

  const bubble2SwayX = interpolate(Math.cos(frame * 0.018), [-1, 1], [100, -100]);
  const bubble2SwayY = interpolate(Math.sin(frame * 0.014), [-1, 1], [80, -80]);
  const bubble2Scale = interpolate(Math.cos(frame * 0.008), [-1, 1], [0.85, 1.15]);

  // Calculate grid scrolling offset
  const gridOffsetY = (frame * 0.8) % 60;

  return (
    <AbsoluteFill style={{ backgroundColor: "#060813", overflow: "hidden", zIndex: 0 }}>
      {/* Background radial gradient mesh */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 50% 50%, #0c0f24 0%, #03040a 100%)"
        }} 
      />

      {/* Tech Grid Background (Overlay) */}
      <div style={{
        position: "absolute",
        top: "-60px",
        left: 0,
        width: "100%",
        height: "calc(100% + 60px)",
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1.5px, transparent 1.5px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1.5px, transparent 1.5px)
        `,
        backgroundSize: "60px 60px",
        transform: `translateY(${gridOffsetY}px)`,
        pointerEvents: "none"
      }} />


      {/* Bubble 1 (Center Right Glow) */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          right: "5%",
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          backgroundColor: glowColor,
          filter: "blur(140px)",
          transform: `translate(${bubble1SwayX}px, ${bubble1SwayY}px) scale(${bubble1Scale}) translateZ(0)`,
          opacity: 0.9,
          pointerEvents: "none"
        }}
      />

      {/* Bubble 2 (Bottom Left Glow) */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "-10%",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          backgroundColor: glowColor,
          filter: "blur(150px)",
          transform: `translate(${bubble2SwayX}px, ${bubble2SwayY}px) scale(${bubble2Scale}) translateZ(0)`,
          opacity: 0.85,
          pointerEvents: "none"
        }}
      />
    </AbsoluteFill>
  );
};
