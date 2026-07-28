import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig, getDynamicFontSize } from "./LayoutNestedRenderers";

export const IntroMapPinsMode: React.FC<ModeRendererProps> = ({
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

  // Bezier path dash animation
  const routeDashLength = 950;
  const routeProgress = interpolate(frame, [10, 75], [routeDashLength, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  // Location Pin coordinates on grid (880x480 canvas)
  const pinPositions = [
    { x: 210, y: 220, dotX: 210, dotY: 340, label: "PIN-1" },
    { x: 440, y: 150, dotX: 440, dotY: 280, label: "PIN-2" },
    { x: 650, y: 290, dotX: 650, dotY: 230, label: "PIN-3" }
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "880px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        alignSelf: "center",
        zIndex: 5,
        boxSizing: "border-box"
      }}
    >
      {/* Main Location Path Dark Window Frame */}
      <div
        style={{
          width: "100%",
          borderRadius: "26px",
          background: isLight
            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(248, 250, 252, 0.98) 100%)"
            : "linear-gradient(180deg, rgba(10, 16, 30, 0.95) 0%, rgba(5, 10, 20, 0.98) 100%)",
          border: isLight ? `2px solid rgba(${rgb}, 0.25)` : `2px solid rgba(${rgb}, 0.35)`,
          boxShadow: isLight 
            ? `0 20px 48px rgba(168, 35, 42, 0.08), 0 0 20px rgba(${rgb}, 0.08)`
            : `0 24px 64px rgba(0, 0, 0, 0.55), 0 0 25px rgba(${rgb}, 0.15)`,
          padding: "24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        {/* Top Window Bar: LOCATION PATH & pins badge */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            paddingBottom: "8px",
            borderBottom: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: accentColor,
                boxShadow: `0 0 10px ${accentColor}`
              }}
            />
            <span
              style={{
                fontSize: "13px",
                fontWeight: 900,
                color: accentColor,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: styles.fontFamily
              }}
            >
              LOCATION PATH
            </span>
          </div>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: isLight ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.5)",
              letterSpacing: "0.12em",
              textTransform: "lowercase",
              fontFamily: styles.fontFamily
            }}
          >
            pins
          </span>
        </div>

        {/* Expanded Central Map Canvas Area */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "480px",
            borderRadius: "18px",
            overflow: "hidden",
            background: isLight ? "rgba(240, 240, 248, 0.35)" : "rgba(3, 7, 18, 0.5)"
          }}
        >
          {/* SVG Background Grid & Dashed Route Lines */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none"
            }}
          >
            <defs>
              {/* Grid pattern */}
              <pattern
                id="mapGridPattern"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke={`rgba(${rgb}, 0.08)`}
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Grid Mesh */}
            <rect width="100%" height="100%" fill="url(#mapGridPattern)" />

            {/* Curved Dashed Route Path (Dual Stroke) */}
            <path
              d="M 110 390 Q 280 440 450 280 T 730 200"
              fill="none"
              stroke={darkAccentColor}
              strokeWidth="4.5"
              strokeDasharray="14 10"
              strokeDashoffset={routeProgress + 12}
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M 110 390 Q 280 440 450 280 T 730 200"
              fill="none"
              stroke={accentColor}
              strokeWidth="4.5"
              strokeDasharray="14 10"
              strokeDashoffset={routeProgress}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 8px ${accentColor})` }}
            />

            {/* Path Anchor Dots */}
            {validItems.map((_, idx) => {
              const pos = pinPositions[idx];
              if (!pos) return null;
              return (
                <circle
                  key={idx}
                  cx={pos.dotX}
                  cy={pos.dotY}
                  r="7"
                  fill={accentColor}
                  style={{ filter: `drop-shadow(0 0 10px ${accentColor})` }}
                />
              );
            })}
          </svg>

          {/* Render 3 Enlarged Location Pins & Cards */}
          {validItems.map((item, idx) => {
            const pos = pinPositions[idx];
            if (!pos) return null;

            const dynamicFontSize = getDynamicFontSize(item.text, 22, fontScale);

            const animConfig = item.comp
              ? getAnimationConfig(item.comp, idx, "scale-in", 0.25 + idx * 0.18, t)
              : { animation: "scale-in" as const, delay: 0.25 + idx * 0.18 };

            return (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 3
                }}
              >
                <AnimatedBlock
                  animation={animConfig.animation}
                  delaySeconds={animConfig.delay}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center"
                    }}
                  >
                    {/* Glowing Teardrop Pin Marker SVG Icon */}
                    <div
                      style={{
                        marginBottom: "6px",
                        color: accentColor,
                        filter: `drop-shadow(0 0 12px ${accentColor})`
                      }}
                    >
                      <svg
                        width="42"
                        height="42"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                          fill={`rgba(${rgb}, 0.35)`}
                          stroke={accentColor}
                          strokeWidth="2.2"
                        />
                        <circle cx="12" cy="9" r="3.2" fill="#ffffff" />
                      </svg>
                    </div>

                    {/* Enlarged Pin Card Window */}
                    <div
                      style={{
                        borderRadius: "18px",
                        background: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(15, 23, 42, 0.92)",
                        border: `1.8px solid rgba(${rgb}, 0.45)`,
                        padding: resolvePadding("14px 22px", paddingScale),
                        boxShadow: `0 10px 24px rgba(0, 0, 0, 0.45), 0 0 16px rgba(${rgb}, 0.3)`,
                        backdropFilter: "blur(14px)",
                        textAlign: "center",
                        maxWidth: "260px",
                        boxSizing: "border-box"
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 900,
                          color: accentColor,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          marginBottom: "4px"
                        }}
                      >
                        {pos.label}
                      </div>
                      <div
                        style={{
                          fontSize: dynamicFontSize,
                          lineHeight: 1.28,
                          fontWeight: 850,
                          color: isLight ? "#0f172a" : "#ffffff",
                          fontFamily: styles.fontFamily,
                          textTransform: "uppercase"
                        }}
                      >
                        {item.text}
                      </div>
                    </div>
                  </div>
                </AnimatedBlock>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
