import React from "react";
import { useCurrentFrame } from "remotion";

export const LightLeaksOverlay: React.FC = () => {
  const frame = useCurrentFrame();

  // Pulse opacity and position slowly
  const orangeOpacity = 0.16 + Math.sin(frame * 0.015) * 0.05;
  const cyanOpacity = 0.12 + Math.cos(frame * 0.018) * 0.04;

  const orangeSwayX = Math.sin(frame * 0.01) * 40;
  const cyanSwayY = Math.cos(frame * 0.012) * 40;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 2, overflow: "hidden", pointerEvents: "none" }}>
      {/* Top Right Orange Light Leak */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: `${-200 + orangeSwayX}px`,
          width: "700px",
          height: "700px",
          borderRadius: "50%",
          backgroundColor: "rgba(249, 115, 22, 0.9)",
          filter: "blur(120px)",
          opacity: orangeOpacity,
          transform: "translateZ(0)"
        }}
      />
      {/* Bottom Left Cyan Light Leak */}
      <div
        style={{
          position: "absolute",
          bottom: `${-250 + cyanSwayY}px`,
          left: "-250px",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          backgroundColor: "rgba(0, 229, 255, 0.8)",
          filter: "blur(130px)",
          opacity: cyanOpacity,
          transform: "translateZ(0)"
        }}
      />
    </div>
  );
};
