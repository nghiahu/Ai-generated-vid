import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export const SakuraOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const petalCount = 18;

  // Pseudo-random seed generation
  const petals = Array.from({ length: petalCount }).map((_, i) => {
    const seed = i * 456.78;
    const xSpeed = 1.0 + (Math.sin(seed) + 1) * 1.5;
    const ySpeed = 2.0 + (Math.cos(seed) + 1) * 2.5;
    const scale = 0.4 + (Math.sin(seed * 2) + 1) * 0.4;
    const startX = (seed * 123) % width;
    const swayAmp = 15 + (Math.cos(seed * 3) + 1) * 15;
    
    // Calculate current coordinates
    const currentY = (ySpeed * frame) % (height + 100) - 50;
    const sway = Math.sin(frame * 0.03 + seed) * swayAmp;
    const currentX = (startX + frame * xSpeed + sway) % width;
    const rotation = (frame * (ySpeed * 0.25) + seed) % 360;

    return { x: currentX, y: currentY, scale, rotation, id: i };
  });

  return (
    <div style={{ position: "absolute", width: "100%", height: "100%", zIndex: 5, overflow: "hidden", pointerEvents: "none" }}>
      {petals.map((p) => (
        <svg
          key={p.id}
          viewBox="0 0 100 100"
          style={{
            position: "absolute",
            width: "35px",
            height: "35px",
            left: `${p.x}px`,
            top: `${p.y}px`,
            transform: `scale(${p.scale}) rotate(${p.rotation}deg)`,
            transformOrigin: "center",
            opacity: 0.85
          }}
        >
          {/* Cherry blossom petal path */}
          <path
            d="M 50,5 C 40,30 20,40 25,65 C 30,85 50,95 50,95 C 50,95 70,85 75,65 C 80,40 60,30 50,5 Z"
            fill="#FFB7C5"
          />
        </svg>
      ))}
    </div>
  );
};
