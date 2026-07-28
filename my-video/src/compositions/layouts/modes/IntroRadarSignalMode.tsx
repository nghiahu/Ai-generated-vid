import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";

export const IntroRadarSignalMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  darkAccentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale
}) => {
  const frame = useCurrentFrame();

  const validItems = otherComps
    .slice(0, 3)
    .map((comp) => {
      if (!comp || !comp.data?.text?.trim()) return null;
      return {
        text: comp.data.text.trim(),
        comp
      };
    })
    .filter(Boolean) as { text: string; comp: any }[];

  // 360 degree rotation angle driven by Remotion frame
  const sweepAngle = (frame * 2.8) % 360;

  // Radar Center Coordinates inside a 900x560 container area
  const centerX = 450;
  const centerY = 260;

  // Target radar blip nodes (angle in degrees, distance from center in px)
  const nodeConfigs = [
    {
      angleDeg: 45,
      dist: 160,
      cardStyle: { right: "20px", top: "40px", width: "400px" },
      pulseDelay: 0
    },
    {
      angleDeg: 215,
      dist: 175,
      cardStyle: { left: "20px", top: "280px", width: "400px" },
      pulseDelay: 15
    },
    {
      angleDeg: 325,
      dist: 165,
      cardStyle: { right: "20px", top: "370px", width: "400px" },
      pulseDelay: 30
    }
  ];

  // Calculate Cartesian coordinates for blips
  const blipPositions = nodeConfigs.map((cfg) => {
    const rad = (cfg.angleDeg * Math.PI) / 180;
    const x = centerX + cfg.dist * Math.cos(rad);
    const y = centerY - cfg.dist * Math.sin(rad);
    return { x, y, ...cfg };
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "920px",
        height: "580px",
        alignSelf: "center",
        zIndex: 5,
        boxSizing: "border-box"
      }}
    >
      {/* Seamless Conic-Gradient Radar Sweep Trail */}
      <div
        style={{
          position: "absolute",
          left: `${centerX - 310}px`,
          top: `${centerY - 310}px`,
          width: "620px",
          height: "620px",
          borderRadius: "50%",
          transform: `rotate(${sweepAngle}deg)`,
          transformOrigin: "center center",
          background: `conic-gradient(from 15deg at 50% 50%, transparent 0deg, rgba(${rgb}, 0.02) 10deg, rgba(${rgb}, 0.12) 30deg, rgba(${rgb}, 0.30) 55deg, rgba(${rgb}, 0.55) 75deg, transparent 75deg, transparent 360deg)`,
          pointerEvents: "none",
          zIndex: 1,
          WebkitMaskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 310px, transparent 311px)",
          maskImage: "radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 310px, transparent 311px)"
        }}
      />

      {/* Central SVG Sonar Radar Screen */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
          zIndex: 2
        }}
      >
        <defs>
          {/* Glow filter for radar sweep line */}
          <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer and Inner Radar Rings */}
        <circle cx={centerX} cy={centerY} r={80} fill="none" stroke={`rgba(${rgb}, 0.2)`} strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx={centerX} cy={centerY} r={160} fill="none" stroke={`rgba(${rgb}, 0.28)`} strokeWidth="1.5" />
        <circle cx={centerX} cy={centerY} r={240} fill="none" stroke={`rgba(${rgb}, 0.22)`} strokeWidth="1.5" strokeDasharray="8 6" />
        <circle cx={centerX} cy={centerY} r={310} fill="none" stroke={`rgba(${rgb}, 0.14)`} strokeWidth="1.5" />

        {/* Crosshair Axes */}
        <line x1={centerX - 320} y1={centerY} x2={centerX + 320} y2={centerY} stroke={`rgba(${rgb}, 0.22)`} strokeWidth="1" strokeDasharray="6 6" />
        <line x1={centerX} y1={centerY - 270} x2={centerX} y2={centerY + 270} stroke={`rgba(${rgb}, 0.22)`} strokeWidth="1" strokeDasharray="6 6" />

        {/* Rotating Intense Leading Scanner Beam Line */}
        <g transform={`rotate(${sweepAngle}, ${centerX}, ${centerY})`}>
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + 310}
            y2={centerY}
            stroke={accentColor}
            strokeWidth="5"
            filter="url(#radarGlow)"
            opacity="0.9"
          />
          <line
            x1={centerX}
            y1={centerY}
            x2={centerX + 310}
            y2={centerY}
            stroke="#ffffff"
            strokeWidth="2"
            opacity="0.95"
          />
        </g>

        {/* Pulsing Radar Core Hub */}
        <circle cx={centerX} cy={centerY} r={12} fill={accentColor} opacity="0.9" filter="url(#radarGlow)" />
        <circle cx={centerX} cy={centerY} r={5} fill="#ffffff" />
      </svg>

      {/* Target Radar Blips & Leader Lines */}
      {validItems.map((item, idx) => {
        const blip = blipPositions[idx];
        if (!blip) return null;

        // Angle difference relative to current sweep angle for ripple animation
        const angleDiff = Math.abs((sweepAngle - blip.angleDeg + 360) % 360);
        const isScanned = angleDiff < 30 || angleDiff > 330;
        const rippleScale = isScanned
          ? interpolate(angleDiff, [0, 30], [1.8, 1.0], { extrapolateRight: "clamp" })
          : 1;

        const animConfig = item.comp
          ? getAnimationConfig(item.comp, idx, "scale-in", 0.25 + idx * 0.15, t)
          : { animation: "scale-in" as const, delay: 0.25 + idx * 0.15 };

        return (
          <React.Fragment key={idx}>
            {/* Blip Target Node SVG Component */}
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 2,
                overflow: "visible"
              }}
            >
              {/* Leader Connection Line from Blip Node to Card */}
              <line
                x1={blip.x}
                y1={blip.y}
                x2={idx === 1 ? blip.x - 60 : blip.x + 60}
                y2={blip.y}
                stroke={accentColor}
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity={isScanned ? 0.9 : 0.4}
              />

              {/* Pulsing Radar Blip Node */}
              <circle
                cx={blip.x}
                cy={blip.y}
                r={14 * rippleScale}
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                opacity={isScanned ? 0.8 : 0.3}
              />
              <circle cx={blip.x} cy={blip.y} r={7} fill={accentColor} />
              <circle cx={blip.x} cy={blip.y} r={3} fill="#ffffff" />
            </svg>

            {/* Signal Info Glassmorphic Card */}
            <div
              style={{
                position: "absolute",
                ...blip.cardStyle,
                zIndex: 4,
                boxSizing: "border-box"
              }}
            >
              <AnimatedBlock
                animation={animConfig.animation}
                delaySeconds={animConfig.delay}
              >
                <div
                  style={{
                    width: "100%",
                    borderRadius: "20px",
                    padding: resolvePadding("18px 22px", paddingScale),
                    background: isLight
                      ? "linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(243, 244, 246, 0.88) 100%)"
                      : "linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.75) 100%)",
                    border: `2px solid rgba(${rgb}, ${isScanned ? 0.85 : 0.35})`,
                    boxShadow: isScanned
                      ? isLight
                        ? `0 10px 30px rgba(${rgb}, 0.22), 0 0 15px rgba(${rgb}, 0.3)`
                        : `0 0 30px rgba(${rgb}, 0.4), inset 0 0 15px rgba(${rgb}, 0.2)`
                      : isLight
                        ? "0 8px 24px rgba(0, 0, 0, 0.08)"
                        : "0 10px 30px rgba(0, 0, 0, 0.35)",
                    backdropFilter: "blur(16px)",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "14px",
                    boxSizing: "border-box"
                  }}
                >
                  {/* Badge Radar Signal Icon */}
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      borderRadius: "12px",
                      background: `rgba(${rgb}, 0.15)`,
                      border: `1.5px solid ${accentColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: accentColor,
                      flexShrink: 0
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" />
                      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                    </svg>
                  </div>

                  {/* Card Text Content */}
                  <div
                    style={{
                      fontSize: `${Math.round(20 * fontScale)}px`,
                      lineHeight: 1.35,
                      fontWeight: 750,
                      color: isLight ? "#0f172a" : "#ffffff",
                      fontFamily: styles.fontFamily,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em"
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              </AnimatedBlock>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
