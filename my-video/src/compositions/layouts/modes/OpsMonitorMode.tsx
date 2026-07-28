import React from "react";
import { useCurrentFrame, interpolate } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { getAnimationConfig, getDynamicFontSize } from "./LayoutNestedRenderers";

const SYS_VALUES = [46, 77, 84, 63, 32, 32, 80, 82];

export const OpsMonitorMode: React.FC<ModeRendererProps> = ({
  otherComps,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale
}) => {
  const frame = useCurrentFrame();

  const validItems = otherComps
    .slice(0, 3)
    .map((comp) => {
      if (!comp || !comp.data?.text?.trim()) return null;
      return { text: comp.data.text.trim(), comp };
    })
    .filter(Boolean) as { text: string; comp: any }[];

  // Animated blink for MONITORING LIVE dot
  const liveBlink = interpolate(frame, [0, 15, 30], [1, 0.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp"
  });

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: "880px",
        display: "flex",
        flexDirection: "column",
        alignSelf: "center",
        zIndex: 5,
        boxSizing: "border-box"
      }}
    >
      {/* Main OPS Monitor Panel */}
      <div
        style={{
          width: "100%",
          borderRadius: "24px",
          background: isLight
            ? "rgba(255, 255, 255, 0.45)"
            : "linear-gradient(180deg, rgba(12, 18, 32, 0.97) 0%, rgba(6, 10, 20, 0.99) 100%)",
          border: isLight
            ? "1.5px solid rgba(0, 0, 0, 0.08)"
            : `2px solid rgba(${rgb}, 0.3)`,
          boxShadow: isLight
            ? "0 24px 64px rgba(0, 0, 0, 0.06), inset 0 0 30px rgba(255, 255, 255, 0.8)"
            : `0 24px 64px rgba(0, 0, 0, 0.6), 0 0 20px rgba(${rgb}, 0.1)`,
          padding: "20px 22px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "14px"
        }}
      >
        {/* Split Panel Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "18px",
            width: "100%",
            height: "500px",
            alignItems: "stretch"
          }}
        >
          {/* ===== LEFT: Metric Cards ===== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "8px",
              width: "38%",
              flexShrink: 0,
              height: "100%"
            }}
          >
            {(validItems.length > 0 ? validItems : [
              { text: "Metric 1", comp: null },
              { text: "Metric 2", comp: null },
              { text: "Metric 3", comp: null }
            ]).map((item, idx) => {
              const metricLabel = `METRIC-${idx + 1}`;
              const dynamicFontSize = getDynamicFontSize(item.text, 22, fontScale);
              const animConfig = item.comp
                ? getAnimationConfig(item.comp, idx, "scale-in", 0.1 + idx * 0.15, t)
                : { animation: "scale-in" as const, delay: 0.1 + idx * 0.15 };

              return (
                <AnimatedBlock
                  key={idx}
                  animation={animConfig.animation}
                  delaySeconds={animConfig.delay}
                  style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}
                >
                  <div
                    style={{
                      flex: 1,
                      borderRadius: "16px",
                      background: isLight
                        ? (styles.cardStyle.background || styles.cardStyle.backgroundColor || "rgba(255, 255, 255, 0.9)")
                        : "rgba(20, 28, 48, 0.85)",
                      border: isLight
                        ? (styles.cardStyle.border || "1px solid rgba(0, 0, 0, 0.08)")
                        : `1.5px solid rgba(${rgb}, 0.2)`,
                      borderLeftWidth: "3px",
                      borderLeftColor: accentColor,
                      padding: "14px 16px",
                      boxSizing: "border-box",
                      boxShadow: isLight
                        ? "0 4px 14px rgba(0, 0, 0, 0.04)"
                        : `0 4px 14px rgba(0, 0, 0, 0.3), inset 0 0 12px rgba(${rgb}, 0.05)`,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: "6px",
                      height: "100%"
                    }}
                  >
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                        color: accentColor,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        fontFamily: styles.fontFamily
                      }}
                    >
                      {metricLabel}
                    </span>
                    <span
                      style={{
                        fontSize: dynamicFontSize,
                        lineHeight: 1.25,
                        fontWeight: 850,
                        color: isLight ? "#191919" : "#ffffff",
                        fontFamily: styles.fontFamily
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                </AnimatedBlock>
              );
            })}
          </div>

          {/* ===== RIGHT: SYS Progress Bars ===== */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              flex: 1,
              height: "100%"
            }}
          >
            {SYS_VALUES.map((targetPct, idx) => {
              const barFill = interpolate(
                frame,
                [20 + idx * 4, 80 + idx * 4],
                [0, targetPct],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              );

              return (
                <AnimatedBlock
                  key={idx}
                  animation="slide-in-right"
                  delaySeconds={0.05 + idx * 0.07}
                  style={{ width: "100%" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%"
                    }}
                  >
                    {/* SYS Label */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: isLight ? "rgba(25, 25, 25, 0.55)" : "rgba(255, 255, 255, 0.55)",
                        letterSpacing: "0.08em",
                        fontFamily: styles.fontFamily,
                        minWidth: "40px",
                        textAlign: "right",
                        flexShrink: 0
                      }}
                    >
                      {`SYS-${idx + 1}`}
                    </span>

                    {/* Progress Track */}
                    <div
                      style={{
                        flex: 1,
                        height: "10px",
                        borderRadius: "6px",
                        background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.07)",
                        overflow: "hidden",
                        position: "relative"
                      }}
                    >
                      {/* Filled Bar */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: `${barFill}%`,
                          borderRadius: "6px",
                          background: `linear-gradient(90deg, rgba(${rgb}, 0.6) 0%, ${accentColor} 60%, rgba(${rgb}, 0.9) 100%)`,
                          boxShadow: `0 0 8px rgba(${rgb}, 0.45)`,
                          transition: "width 0.05s linear"
                        }}
                      />
                    </div>

                    {/* Percentage Value */}
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 800,
                        color: isLight ? "rgba(25, 25, 25, 0.8)" : "rgba(255, 255, 255, 0.7)",
                        fontFamily: styles.fontFamily,
                        minWidth: "34px",
                        textAlign: "left",
                        flexShrink: 0
                      }}
                    >
                      {`${targetPct}%`}
                    </span>
                  </div>
                </AnimatedBlock>
              );
            })}
          </div>
        </div>

        {/* Footer: MONITORING LIVE status */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "7px",
            paddingTop: "10px",
            borderTop: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.07)"
          }}
        >
          <div
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: accentColor || "#ef4444",
              boxShadow: `0 0 10px ${accentColor || "#ef4444"}`,
              opacity: liveBlink
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 900,
              color: accentColor || "#ef4444",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily: styles.fontFamily
            }}
          >
            MONITORING LIVE
          </span>
        </div>
      </div>
    </div>
  );
};
