import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const EmberSparksOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const sparkCount = 28;

  const sparks = Array.from({ length: sparkCount }).map((_, i) => {
    const seed = i * 654.32;
    const startX = (seed * 83) % width;
    const ySpeed = 1.8 + (Math.sin(seed) + 1) * 1.5;
    const scale = 0.5 + (Math.cos(seed * 2) + 1) * 0.6;
    const currentY = height - ((frame * ySpeed) % (height + 100));
    const sway = Math.sin(frame * 0.03 + seed) * (10 + (i % 5) * 5);
    const currentX = (startX + sway) % width;
    
    // Fade out as it rises
    const progress = (height - currentY) / height;
    const opacity = Math.max(0, 0.7 - progress * 0.7);

    return { x: currentX, y: currentY, scale, opacity, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 3, overflow: "hidden", pointerEvents: "none" }}>
      {sparks.map((s) => (
        <div
          key={s.id}
          style={{
            position: "absolute",
            left: `${s.x}px`,
            top: `${s.y}px`,
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: "#ff7b00",
            boxShadow: "0 0 10px #ff6600, 0 0 4px #ffaa00",
            opacity: s.opacity,
            transform: `scale(${s.scale})`,
          }}
        />
      ))}
    </div>
  );
};
