import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";

export const AnimatedBlock: React.FC<{
  readonly animation: string;
  readonly delaySeconds: number;
  readonly children: React.ReactNode;
  readonly style?: React.CSSProperties;
}> = ({ animation, delaySeconds, children, style: customStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = Math.round(delaySeconds * fps);
  const relativeFrame = frame - startFrame;

  // Use a smoother spring config (less stiff, more damped for premium look)
  const spr = spring({
    frame: Math.max(0, relativeFrame),
    fps,
    config: { damping: 18, mass: 1, stiffness: 80 },
  });

  // Custom bouncy spring for physical swing/drop animations
  const bouncySpr = spring({
    frame: Math.max(0, relativeFrame),
    fps,
    config: { damping: 11, mass: 1.1, stiffness: 85 },
  });

  const linearProgress = Math.min(Math.max(0, relativeFrame) / Math.round(fps * 0.5), 1);

  let style: React.CSSProperties = {};

  if (relativeFrame < 0) {
    // Keep children mounted to prevent DOM layout thrashing, just hide them with initial state
    style = {
      opacity: 0,
      transform: animation === "slide-up" ? "translateY(80px)" : 
                 animation === "slide-down" ? "translateY(-200px) rotate(-15deg)" : 
                 animation === "scale-in" ? "scale(0.5)" : 
                 animation === "slide-left" ? "translateX(150px)" : 
                 animation === "slide-right" ? "translateX(-150px)" : "none",
      filter: animation === "blur-in" ? "blur(25px)" : "none",
      transformOrigin: animation === "slide-down" ? "center top" : undefined
    };
  } else {
    switch (animation) {
      case "slide-up": {
        const translateY = interpolate(spr, [0, 1], [80, 0]);
        style = { opacity: spr, transform: `translateY(${translateY}px)` };
        break;
      }
      case "slide-down": {
        const translateY = interpolate(bouncySpr, [0, 1], [-200, 0]);
        const rotateVal = interpolate(bouncySpr, [0, 1], [-15, 0]);
        style = { 
          opacity: bouncySpr, 
          transform: `translateY(${translateY}px) rotate(${rotateVal}deg)`,
          transformOrigin: "center top"
        };
        break;
      }
      case "scale-in": {
        const scale = interpolate(spr, [0, 1], [0.5, 1]);
        style = { opacity: spr, transform: `scale(${scale})` };
        break;
      }
      case "blur-in": {
        const blurVal = interpolate(linearProgress, [0, 1], [25, 0]);
        style = { opacity: linearProgress, filter: `blur(${blurVal}px)` };
        break;
      }
      case "slide-left": {
        const translateXLeft = interpolate(spr, [0, 1], [150, 0]);
        style = { opacity: spr, transform: `translateX(${translateXLeft}px)` };
        break;
      }
      case "slide-right": {
        const translateXRight = interpolate(spr, [0, 1], [-150, 0]);
        style = { opacity: spr, transform: `translateX(${translateXRight}px)` };
        break;
      }
      case "fade-in":
      default: {
        style = { opacity: linearProgress };
        break;
      }
    }
  }

  return (
    <div style={{ ...style, width: "100%", willChange: "transform, opacity", ...customStyle }}>
      {children}
    </div>
  );
};
