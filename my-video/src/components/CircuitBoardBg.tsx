import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface CircuitBoardBgProps {
  /** Primary glow color, defaults to #00d4ff (electric cyan) */
  glowColor?: string;
  /** Opacity của circuit SVG layer, 0–1, defaults 0.09 */
  circuitOpacity?: number;
}

/**
 * CircuitBoardBg — Background layer cho fintech_edu theme.
 * Renders 3 stacked layers:
 *   1. Deep navy gradient base
 *   2. Circuit board SVG grid (inline, không fetch network)
 *   3. Animated glow orbs (pulse)
 */
export const CircuitBoardBg: React.FC<CircuitBoardBgProps> = ({
  glowColor = "#00d4ff",
  circuitOpacity = 0.25,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Glow orb pulse: cycle qua 3s loop
  const pulseProgress = (frame % (fps * 3)) / (fps * 3); // 0→1 mỗi 3 giây
  const orbOpacity = 0.3 + 0.3 * Math.sin(pulseProgress * Math.PI * 2);

  // Parse glowColor sang rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const c = hex.replace("#", "");
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const glowRgba = (alpha: number) => hexToRgba(glowColor, alpha);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        zIndex: 0,
      }}
    >
      {/* Layer 1: Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(160deg, #0028a0 0%, #001060 50%, #000A3A 100%)",
        }}
      />

      {/* Layer 2: Circuit board SVG pattern */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: circuitOpacity,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* 40x40 grid cell */}
          <pattern id="circuit-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            {/* Horizontal line */}
            <line x1="0" y1="20" x2="40" y2="20" stroke={glowColor} strokeWidth="0.5" />
            {/* Vertical line */}
            <line x1="20" y1="0" x2="20" y2="40" stroke={glowColor} strokeWidth="0.5" />
            {/* Node dot at center */}
            <circle cx="20" cy="20" r="1.5" fill={glowColor} opacity="1.3" />
            {/* Node dot at corners */}
            <circle cx="0" cy="0" r="1" fill={glowColor} opacity="0.8" />
            <circle cx="40" cy="0" r="1" fill={glowColor} opacity="0.8" />
            <circle cx="0" cy="40" r="1" fill={glowColor} opacity="0.8" />
            <circle cx="40" cy="40" r="1" fill={glowColor} opacity="0.8" />
          </pattern>
          {/* Larger diagonal trace pattern — circuit runs */}
          <pattern id="circuit-traces" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            {/* Horizontal trace */}
            <line x1="0" y1="60" x2="60" y2="60" stroke={glowColor} strokeWidth="1" opacity="0.5" />
            {/* Right-angle trace */}
            <line x1="60" y1="60" x2="60" y2="20" stroke={glowColor} strokeWidth="1" opacity="0.5" />
            <line x1="60" y1="20" x2="120" y2="20" stroke={glowColor} strokeWidth="1" opacity="0.5" />
            {/* Junction dots */}
            <circle cx="60" cy="60" r="3" fill={glowColor} opacity="0.7" />
            <circle cx="60" cy="20" r="3" fill={glowColor} opacity="0.7" />
          </pattern>
        </defs>
        {/* Grid fill */}
        <rect width="100%" height="100%" fill="url(#circuit-grid)" />
        {/* Trace overlay, lower opacity */}
        <rect width="100%" height="100%" fill="url(#circuit-traces)" opacity="0.5" />
      </svg>

      {/* Layer 3: Glow orbs */}
      {/* Bottom-left orb */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "-100px",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${glowRgba(orbOpacity)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {/* Top-right orb */}
      <div
        style={{
          position: "absolute",
          top: "-80px",
          right: "-80px",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(100, 180, 255, ${orbOpacity * 0.7}) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      {/* Center subtle orb */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "300px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse, ${glowRgba(orbOpacity * 0.4)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
