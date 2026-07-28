import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";

// Map 0-100 → gauge label + color
function getGaugeInfo(v: number): { label: string; color: string } {
  if (v < 20) return { label: "Extreme Fear",  color: "#ef4444" };
  if (v < 40) return { label: "Fear",          color: "#fca5a5" };
  if (v < 60) return { label: "Neutral",        color: "#f59e0b" };
  if (v < 80) return { label: "Greed",          color: "#86efac" };
  return           { label: "Extreme Greed",   color: "#22c55e" };
}

// Polar point on a semicircle (r=80, cx=100, cy=100, 180°→0° = left→right)
// angle in degrees, 0=right, 90=top, 180=left
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
}

// Build SVG arc path segment from startDeg → endDeg (both in 0-180 range, left→right)
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 0 ${e.x} ${e.y}`;
}

export const FearGreedMode: React.FC<ModeRendererProps> = ({
  otherComps,
  resolvedPositions,
  t,
  accentColor,
  rgb,
  isLight,
  styles,
  fontScale,
  paddingScale
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Target value from template (nestedStructure.titleText = "35") or default 50
  const pos = resolvedPositions?.[0];
  const rawValue = parseInt(pos?.nestedStructure?.titleText || "50", 10);
  const targetValue = isNaN(rawValue) ? 50 : Math.max(0, Math.min(100, rawValue));

  // ── Animations ────────────────────────────────────────────────────────
  const gaugeInFrame  = Math.round(0.3 * fps);
  const needleStart   = Math.round(0.6 * fps);
  const countStart    = Math.round(0.8 * fps);

  // Arc draw-in: animate strokeDashoffset from full to 0
  const ARC_LEN = Math.PI * 80; // half circumference of r=80 circle (≈251)
  const arcProgress = interpolate(frame - gaugeInFrame, [0, 24], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1)
  });
  const dashOffset = ARC_LEN * (1 - arcProgress);

  // Needle swing: animates from far-left (175°) to target angle
  // 0 → 180°, 100 → 0° in SVG space
  const targetAngleDeg = 180 - (targetValue / 100) * 180;
  const needleAngle = interpolate(frame - needleStart, [0, 30], [175, targetAngleDeg], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1)  // bouncy spring
  });

  // Number count-up
  const animValue = Math.round(interpolate(frame - countStart, [0, 28], [0, targetValue], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1)
  }));

  const { label: gaugeLabel, color: labelColor } = getGaugeInfo(animValue);

  // Pills: user content first, template pills as fallback
  const templatePills: string[] = pos?.nestedStructure?.pills || [];
  const pills = otherComps.slice(0, 3).map((c: any, i: number) => // eslint-disable-line @typescript-eslint/no-explicit-any
    c?.data?.text || templatePills[i] || ""
  );

  // SVG gauge constants
  const CX = 100, CY = 105, R = 80;
  // The needle endpoint at current angle
  const needleTip = polar(CX, CY, R - 8, needleAngle);
  const needleBase1 = polar(CX, CY, 6, needleAngle + 90);
  const needleBase2 = polar(CX, CY, 6, needleAngle - 90);

  const cardStyle: React.CSSProperties = {
    borderRadius: "38px",
    background: isLight
      ? "rgba(255, 255, 255, 0.9)"
      : "linear-gradient(rgba(24, 18, 8, 0.45), rgba(2, 6, 23, 0.28))",
    border: isLight ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.22)",
    boxShadow: isLight
      ? "0 28px 70px rgba(0,0,0,0.08)"
      : `rgba(0,0,0,0.24) 0px 28px 70px, rgba(255,255,255,0.06) 0px 0px 0px 1px inset, rgba(${rgb},0.094) 0px 0px 34px`,
    backdropFilter: "blur(8px) saturate(1.08)",
    padding: resolvePadding("42px 46px 36px", paddingScale),
    width: "100%",
    maxWidth: t.container?.maxWidth || "940px",
    display: "grid",
    gap: "28px",
    gridTemplateRows: "auto auto",
    boxSizing: "border-box",
    zIndex: 5
  };

  return (
    <AnimatedBlock animation="scale-in" delaySeconds={0.1}>
      <div style={cardStyle}>

        {/* ── Gauge SVG ─────────────────────────────────────────────── */}
        <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>

          {/* Big value + label — above the gauge */}
          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div style={{
              fontSize: `${Math.round(112 * fontScale)}px`,
              lineHeight: 1,
              fontWeight: 950,
              letterSpacing: "-0.08em",
              color: isLight ? "#1e293b" : "rgb(248,250,252)",
              fontFamily: styles.fontFamily
            }}>
              {animValue}
            </div>
            <div style={{
              fontSize: "18px",
              fontWeight: 850,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: labelColor,
              fontFamily: styles.fontFamily,
              marginTop: "4px"
            }}>
              {gaugeLabel}
            </div>
          </div>

          {/* SVG gauge — fills width, viewBox keeps aspect */}
          <div style={{ position: "relative", width: "100%", maxWidth: "560px" }}>
            <svg viewBox="0 0 200 120" style={{ width: "100%", overflow: "visible" }}>

              {/* Track background */}
              <path
                d={arcPath(CX, CY, R, 0, 180)}
                fill="none"
                stroke={isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.1)"}
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Colored arc: Fear (red) — left portion 90°→180° */}
              <path
                d={arcPath(CX, CY, R, 90, 180)}
                fill="none"
                stroke="rgb(239,68,68)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={ARC_LEN}
                strokeDashoffset={dashOffset}
                opacity="0.88"
              />
              {/* Neutral (amber) — 45°→90° */}
              <path
                d={arcPath(CX, CY, R, 45, 91)}
                fill="none"
                stroke="rgb(245,158,11)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={ARC_LEN}
                strokeDashoffset={dashOffset}
                opacity="0.88"
              />
              {/* Greed (green) — 0°→45° */}
              <path
                d={arcPath(CX, CY, R, 0, 46)}
                fill="none"
                stroke="rgb(34,197,94)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={ARC_LEN}
                strokeDashoffset={dashOffset}
                opacity="0.88"
              />

              {/* Needle — tapered triangle */}
              <polygon
                points={`${needleTip.x},${needleTip.y} ${needleBase1.x},${needleBase1.y} ${needleBase2.x},${needleBase2.y}`}
                fill={accentColor}
                filter={`drop-shadow(0 0 6px rgba(${rgb},0.7))`}
              />

              {/* Hub dot */}
              <circle
                cx={CX}
                cy={CY}
                r="7"
                fill={accentColor}
                stroke={isLight ? "rgba(255,255,255,0.9)" : "rgba(2,6,23,0.7)"}
                strokeWidth="3.5"
                filter={`drop-shadow(0 0 8px rgba(${rgb},0.6))`}
              />

              {/* FEAR label */}
              <text x="8" y={CY + 22} fontSize="10" fontWeight="900"
                letterSpacing="1.5" textAnchor="start"
                fill="rgb(252,165,165)" fontFamily={styles.fontFamily}
                style={{ textTransform: "uppercase" }}>
                FEAR
              </text>
              {/* GREED label */}
              <text x="192" y={CY + 22} fontSize="10" fontWeight="900"
                letterSpacing="1.5" textAnchor="end"
                fill="rgb(134,239,172)" fontFamily={styles.fontFamily}
                style={{ textTransform: "uppercase" }}>
                GREED
              </text>
            </svg>
          </div>
        </div>

        {/* ── Pill tags (3 columns) ─────────────────────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(pills.filter(Boolean).length || 3, 3)}, minmax(0,1fr))`,
          gap: "12px"
        }}>
          {pills.slice(0, 3).map((pill, idx) => {
            const comp = otherComps[idx];
            const animCfg = comp
              ? getAnimationConfig(comp, idx, "slide-up", 1.0 + idx * 0.1, t)
              : { animation: "slide-up" as const, delay: 1.0 + idx * 0.1 };
            const pillText = pill || `Item ${idx + 1}`;
            return (
              <AnimatedBlock key={idx} animation={animCfg.animation} delaySeconds={animCfg.delay}>
                <div style={{
                  borderRadius: "20px",
                  padding: "16px 14px",
                  background: isLight ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.04)",
                  border: isLight ? "1px solid rgba(0,0,0,0.09)" : "1px solid rgba(255,255,255,0.16)",
                  boxShadow: "rgba(0,0,0,0.14) 0px 14px 32px",
                  backdropFilter: "blur(6px)",
                  color: isLight ? "#92400e" : "rgb(253,230,138)",
                  fontSize: `${Math.round(21 * fontScale)}px`,
                  lineHeight: 1.12,
                  fontWeight: 760,
                  fontFamily: styles.fontFamily,
                  textAlign: "center"
                }}>
                  {pillText}
                </div>
              </AnimatedBlock>
            );
          })}
        </div>

      </div>
    </AnimatedBlock>
  );
};
