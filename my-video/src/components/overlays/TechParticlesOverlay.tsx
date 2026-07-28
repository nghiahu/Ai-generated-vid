import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const TechParticlesOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const digitCount = 12;

  const digits = Array.from({ length: digitCount }).map((_, i) => {
    const seed = i * 987.65;
    const startX = (seed * 87) % width;
    const ySpeed = 3.0 + (Math.sin(seed) + 1) * 2.0;
    const scale = 0.8 + (Math.cos(seed * 3) + 1) * 0.4;
    const currentY = height - ((frame * ySpeed) % (height + 100));
    const digit = Math.sin(seed + frame * 0.05) > 0 ? "1" : "0";
    const opacity = 0.15 + (Math.sin(frame * 0.08 + seed) + 1) * 0.2;

    return { x: startX, y: currentY, val: digit, scale, opacity, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 5, overflow: "hidden", pointerEvents: "none" }}>
      {/* Light digital scan grid */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />
      {digits.map((d) => (
        <span
          key={d.id}
          style={{
            position: "absolute",
            left: `${d.x}px`,
            top: `${d.y}px`,
            fontSize: "24px",
            fontFamily: "monospace",
            fontWeight: "bold",
            color: "#00E5FF",
            opacity: d.opacity,
            transform: `scale(${d.scale})`,
            textShadow: "0 0 8px rgba(0, 229, 255, 0.5)"
          }}
        >
          {d.val}
        </span>
      ))}
    </div>
  );
};
