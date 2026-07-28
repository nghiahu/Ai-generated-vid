import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const DefaultBokehOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const orbCount = 5;

  const orbs = Array.from({ length: orbCount }).map((_, i) => {
    const seed = i * 234.56;
    const startX = (seed * 43) % width;
    const startY = (seed * 89) % height;
    
    // Slow drifting animation paths
    const currentX = startX + Math.sin(frame * 0.01 + seed) * 100;
    const currentY = startY + Math.cos(frame * 0.008 + seed) * 100;
    const size = 150 + (Math.sin(frame * 0.005 + seed) + 1) * 100;
    const opacity = 0.1 + (Math.cos(frame * 0.015 + seed) + 1) * 0.1;
    const color = i % 2 === 0 ? "rgba(99, 102, 241, 0.4)" : "rgba(236, 72, 153, 0.3)"; // Indigo and Pink bokeh

    return { x: currentX, y: currentY, size, opacity, color, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 4, overflow: "hidden", pointerEvents: "none" }}>
      {orbs.map((orb) => (
        <div
          key={orb.id}
          style={{
            position: "absolute",
            left: `${orb.x - orb.size / 2}px`,
            top: `${orb.y - orb.size / 2}px`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            borderRadius: "50%",
            backgroundColor: orb.color,
            opacity: orb.opacity,
            filter: "blur(50px)",
            transform: "translateZ(0)"
          }}
        />
      ))}
    </div>
  );
};
