import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig } from "./LayoutNestedRenderers";

// Split a raw text string into { headline, subtitle }
// headline = first 2-3 meaningful words  (shown large)
// subtitle  = rest of the string          (shown small below)
function splitCardContent(raw: string): { headline: string; subtitle: string } {
  const text = (raw || "").trim();
  const words = text.split(/\s+/).filter(Boolean);

  // Heuristic: headline = first 3 words (or fewer if total ≤ 3)
  const splitAt = words.length <= 4 ? words.length : 3;
  const headline = words.slice(0, splitAt).join(" ");
  const subtitle = words.slice(splitAt).join(" ");
  return { headline, subtitle };
}

export const EarningsSnapshotMode: React.FC<ModeRendererProps> = ({
  otherComps,
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

  const visibleComps = otherComps.slice(0, 4);
  const defaultPercentages = [83, 47, 69, 55];

  // ── Outer container ─────────────────────────────────────────────────────
  const containerStyle: React.CSSProperties = {
    borderRadius: "36px",
    background: isLight
      ? "rgba(255, 255, 255, 0.72)"
      : "linear-gradient(rgba(8, 16, 28, 0.34), rgba(2, 6, 23, 0.18))",
    border: isLight
      ? "1px solid rgba(0, 0, 0, 0.08)"
      : "1px solid rgba(255, 255, 255, 0.22)",
    boxShadow: isLight
      ? "0 26px 62px rgba(0, 0, 0, 0.06)"
      : `rgba(0, 0, 0, 0.22) 0px 30px 78px, rgba(255, 255, 255, 0.08) 0px 0px 0px 1px inset, rgba(${rgb}, 0.094) 0px 0px 34px`,
    backdropFilter: "blur(9px) saturate(1.08)",
    padding: resolvePadding("36px", paddingScale),
    minHeight: "720px",
    display: "grid",
    gridTemplateColumns: "1.25fr 1fr",
    gap: "28px",
    alignItems: "stretch",
    width: "100%",
    maxWidth: t.container.maxWidth || "1020px",
    zIndex: 5,
    boxSizing: "border-box",
    flexShrink: 0
  };

  return (
    <div style={containerStyle}>
      {/* ── Left Column: one card per otherComp ──────────────────────────── */}
      <div style={{ display: "grid", gap: "12px" }}>
        {visibleComps.map((comp, idx) => {
          const isFirst = idx === 0;
          const rawText = comp?.data?.text || "";
          const { headline, subtitle } = splitCardContent(rawText);
          const badgeNum = String(idx + 1).padStart(2, "0");

          const animConfig = getAnimationConfig(
            comp,
            idx,
            "slide-right",
            0.3 + idx * 0.1,
            t
          );

          const cardStyle: React.CSSProperties = {
            borderRadius: "24px",
            padding: "20px 26px",
            background: isFirst
              ? isLight ? `rgba(${rgb}, 0.08)` : `rgba(${rgb}, 0.11)`
              : isLight ? "rgba(0, 0, 0, 0.025)" : "rgba(255, 255, 255, 0.04)",
            border: isFirst
              ? `1px solid rgba(${rgb}, ${isLight ? 0.28 : 0.38})`
              : isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: isLight ? "none" : "rgba(0, 0, 0, 0.14) 0px 14px 38px",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "6px",
            boxSizing: "border-box",
            minHeight: "174px"
          };

          return (
            <AnimatedBlock
              key={comp.id || idx}
              animation={animConfig.animation}
              delaySeconds={animConfig.delay}
              style={{ height: "100%" }}
            >
              <div style={cardStyle}>
                {/* Numbered badge */}
                <div style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: isFirst
                    ? accentColor
                    : isLight ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)",
                  fontFamily: styles.fontFamily
                }}>
                  {badgeNum}
                </div>

                {/* Headline (2-3 first words, shown big) */}
                <div style={{
                  fontSize: `${Math.round(28 * fontScale)}px`,
                  lineHeight: 1.1,
                  fontWeight: 850,
                  color: isLight ? "#1e293b" : "rgb(248, 250, 252)",
                  fontFamily: styles.fontFamily
                }}>
                  {headline}
                </div>

                {/* Subtitle (remaining words, shown small & muted) */}
                {subtitle && (
                  <div style={{
                    fontSize: `${Math.round(14 * fontScale)}px`,
                    lineHeight: 1.4,
                    fontWeight: 600,
                    color: isLight ? "#64748b" : "rgba(248, 250, 252, 0.45)",
                    fontFamily: styles.fontFamily,
                    maxWidth: "92%"
                  }}>
                    {subtitle}
                  </div>
                )}
              </div>
            </AnimatedBlock>
          );
        })}
      </div>

      {/* ── Right Column: Progress bars stretched to full height ─────────── */}
      <AnimatedBlock animation="slide-left" delaySeconds={0.8} style={{ height: "100%" }}>
        <div style={{
          background: isLight ? "rgba(0, 0, 0, 0.025)" : "rgba(255, 255, 255, 0.04)",
          border: isLight ? "1px solid rgba(0, 0, 0, 0.06)" : "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "28px",
          padding: resolvePadding("28px 24px", paddingScale),
          boxShadow: isLight ? "none" : "rgba(255, 255, 255, 0.043) 0px 0px 0px 1px inset, rgba(0, 0, 0, 0.14) 0px 18px 44px",
          backdropFilter: "blur(6px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          gap: "20px",
          boxSizing: "border-box",
          height: "100%"
        }}>
          {visibleComps.map((comp, idx) => {
            const rawText = comp?.data?.text || "";
            // Use first word of comp as bar label (keeps it tight)
            const label = rawText.split(/\s+/)[0] || `#${idx + 1}`;
            
            const rawVal = comp?.data?.value;
            let pct = defaultPercentages[idx] ?? 50;
            if (rawVal) {
              const parsed = parseInt(String(rawVal).replace(/[^\d]/g, ""), 10);
              if (!isNaN(parsed)) {
                pct = Math.min(100, Math.max(0, parsed));
              }
            }

            const barStartFrame = Math.round((1.0 + idx * 0.15) * fps);
            const barRelativeFrame = frame - barStartFrame;
            const currentPct = Math.round(interpolate(barRelativeFrame, [0, 22], [0, pct], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1)
            }));

            return (
              <div key={idx} style={{ display: "grid", gap: "8px" }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  color: isLight ? "#475569" : "rgb(203, 213, 225)",
                  fontSize: "13px",
                  fontWeight: 750,
                  fontFamily: styles.fontFamily,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em"
                }}>
                  <span>{label}</span>
                  <span style={{
                    fontWeight: 900,
                    fontSize: "16px",
                    color: isLight ? accentColor : accentColor
                  }}>{currentPct}%</span>
                </div>

                <div style={{
                  height: "16px",
                  borderRadius: "999px",
                  background: isLight ? "rgba(0, 0, 0, 0.06)" : "rgba(255, 255, 255, 0.1)",
                  overflow: "hidden"
                }}>
                  <div style={{
                    height: "100%",
                    width: `${currentPct}%`,
                    borderRadius: "999px",
                    background: accentColor,
                    boxShadow: `rgba(${rgb}, 0.45) 0px 0px 22px`
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      </AnimatedBlock>
    </div>
  );
};
