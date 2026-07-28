import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";

export const CandlestickBreakoutMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  parentDelay
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pills = otherComps.map(c => c.data.text).slice(0, 4);

  const containerStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: t.container.maxWidth || "860px",
    zIndex: 5
  };

  const chartCardStyle: React.CSSProperties = {
    height: "620px",
    borderRadius: "34px",
    background: isLight 
      ? "rgba(255, 255, 255, 0.72)"
      : "linear-gradient(rgba(2, 6, 23, 0.32), rgba(3, 7, 18, 0.18))",
    border: isLight 
      ? "1px solid rgba(0, 0, 0, 0.08)"
      : "1px solid rgba(255, 255, 255, 0.22)",
    boxShadow: isLight
      ? "0 26px 62px rgba(0, 0, 0, 0.06), 0 0px 0px 1px rgba(255, 255, 255, 0.5) inset"
      : "rgba(0, 0, 0, 0.2) 0px 26px 62px, rgba(255, 255, 255, 0.06) 0px 0px 0px 1px inset",
    backdropFilter: "blur(8px) saturate(1.08)",
    position: "relative",
    overflow: "hidden",
    padding: "54px 56px",
    boxSizing: "border-box",
    width: "100%"
  };

  const gridTops = [86, 198, 310, 422];
  const barHeights = [92, 120.573, 116.459, 126.222, 172.067, 229.608, 253.94, 220.751, 201.589, 348, 348];
  
  const getBarColor = (idx: number) => {
    const isYellow = idx === 1 || idx === 3 || idx === 5 || idx === 7;
    return isYellow ? "#FDE68A" : accentColor;
  };

  // Animate the red breakout line (rises up from bottom grid line at 422px to 199px)
  const lineStartFrame = Math.round((parentDelay + 0.6) * fps);
  const lineRelativeFrame = frame - lineStartFrame;
  const lineTranslateY = interpolate(lineRelativeFrame, [0, 18], [223, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const lineScaleX = interpolate(lineRelativeFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  });
  const lineOpacity = interpolate(lineRelativeFrame, [0, 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div style={containerStyle}>
      <AnimatedBlock animation="scale-in" delaySeconds={parentDelay + 0.2}>
        <div style={chartCardStyle}>
          {/* Grid lines */}
          {gridTops.map((top, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: "36px",
                right: "36px",
                top: `${top}px`,
                height: "1px",
                background: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(148, 163, 184, 0.14)"
              }}
            />
          ))}

          {/* Breakout horizontal red line rising and drawing */}
          <div
            style={{
              position: "absolute",
              left: "46px",
              right: "46px",
              top: "199px",
              height: "3px",
              background: accentColor,
              boxShadow: `rgba(${rgb}, 0.45) 0px 0px 26px`,
              opacity: lineOpacity,
              transform: `translateY(${lineTranslateY}px) scaleX(${lineScaleX})`,
              transformOrigin: "left center"
            }}
          />

          {/* Bars Container */}
          <div
            style={{
              position: "absolute",
              left: "60px",
              right: "60px",
              bottom: "70px",
              height: "420px",
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between"
            }}
          >
            {barHeights.map((h, idx) => {
              const isLast = idx === barHeights.length - 1;
              const barColor = getBarColor(idx);
              
              // Direct Frame Animation logic for sequential scale Y growth
              const barStartFrame = Math.round((parentDelay + 0.4 + idx * 0.08) * fps);
              const barRelativeFrame = frame - barStartFrame;
              
              const barScaleY = interpolate(barRelativeFrame, [0, 16], [0.02, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.bezier(0.16, 1, 0.3, 1)
              });
              const barOpacity = interpolate(barRelativeFrame, [0, 5], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp"
              });

              return (
                <div
                  key={idx}
                  style={{
                    width: "46px",
                    height: `${h}px`,
                    borderRadius: "12px",
                    background: barColor,
                    boxShadow: isLast ? `${accentColor}55 0px 0px 30px` : "none",
                    boxSizing: "border-box",
                    opacity: barOpacity,
                    transform: `scaleY(${barScaleY})`,
                    transformOrigin: "bottom center"
                  }}
                />
              );
            })}
          </div>

          {/* Bottom Dynamic Pills */}
          <div
            style={{
              position: "absolute",
              left: "42px",
              right: "42px",
              bottom: "28px",
              display: "flex",
              gap: "10px"
            }}
          >
            {pills.map((pillText, idx) => (
              <AnimatedBlock key={idx} animation="slide-up" delaySeconds={parentDelay + 1.2 + idx * 0.1}>
                <div
                  style={{
                    borderRadius: "999px",
                    padding: "10px 15px",
                    background: isLight 
                      ? "rgba(0, 0, 0, 0.04)"
                      : "rgba(15, 23, 42, 0.34)",
                    border: isLight
                      ? "1px solid rgba(0, 0, 0, 0.08)"
                      : "1px solid rgba(255, 255, 255, 0.18)",
                    boxShadow: isLight
                      ? "0 4px 12px rgba(0,0,0,0.03)"
                      : "rgba(0, 0, 0, 0.16) 0px 14px 32px",
                    backdropFilter: "blur(6px)",
                    color: isLight ? "#1e293b" : "#e2e8f0",
                    fontSize: `${Math.round(18 * fontScale)}px`,
                    fontWeight: 780,
                    fontFamily: styles.fontFamily,
                    textTransform: "uppercase"
                  }}
                >
                  {pillText}
                </div>
              </AnimatedBlock>
            ))}
          </div>
        </div>
      </AnimatedBlock>
    </div>
  );
};
