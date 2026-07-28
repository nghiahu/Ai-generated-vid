import React from "react";
import { useCurrentFrame } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig, getDynamicFontSize } from "./LayoutNestedRenderers";

export const OrbitalBubblesMode: React.FC<ModeRendererProps> = ({
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

  const bubbleItems = otherComps.slice(0, 3).map((comp) => {
    if (!comp || !comp.data?.text?.trim()) return null;
    return {
      text: comp.data.text.trim(),
      comp
    };
  }).filter(Boolean) as { text: string; comp: any }[];

  const getFloatOffset = (phase: number, amp: number) => {
    return Math.sin(frame / 15 + phase) * amp;
  };

  // Dynamically derive 3 harmonious palette colors from active theme's accentColor (rgb)
  const themeColors = (() => {
    const mainRgb = rgb || "59, 130, 246";
    const [r, g, b] = mainRgb.split(",").map(n => parseInt(n.trim(), 10) || 100);

    const c1Accent = accentColor || `rgb(${mainRgb})`;
    const c1Glow = `rgba(${mainRgb}, 0.45)`;

    const r2 = Math.min(255, Math.floor(r * 0.85 + 50));
    const g2 = Math.min(255, Math.floor(g * 0.9 + 40));
    const b2 = Math.max(0, Math.floor(b * 0.5));
    const c2Rgb = `${r2}, ${g2}, ${b2}`;
    const c2Accent = `rgb(${c2Rgb})`;
    const c2Glow = `rgba(${c2Rgb}, 0.4)`;

    const r3 = Math.max(0, Math.floor(r * 0.6 + 40));
    const g3 = Math.max(0, Math.floor(g * 0.5 + 20));
    const b3 = Math.min(255, Math.floor(b * 1.1 + 45));
    const c3Rgb = `${r3}, ${g3}, ${b3}`;
    const c3Accent = `rgb(${c3Rgb})`;
    const c3Glow = `rgba(${c3Rgb}, 0.4)`;

    return [
      { accentBorder: c1Accent, accentGlow: c1Glow, rgb: mainRgb, isMain: true },
      { accentBorder: c2Accent, accentGlow: c2Glow, rgb: c2Rgb, isMain: false },
      { accentBorder: c3Accent, accentGlow: c3Glow, rgb: c3Rgb, isMain: false }
    ];
  })();

  // Orbital Solar System bubble configs matching Reference Image 1
  const bubbleConfigs = [
    {
      left: 260,
      top: 150,
      size: 320,
      fontSize: "24px",
      fontWeight: 900,
      padding: "40px 30px",
      floatPhase: 0,
      floatAmp: 4,
      zIndex: 5
    },
    {
      left: 70,
      top: 60,
      size: 200,
      fontSize: "16px",
      fontWeight: 850,
      padding: "24px 18px",
      floatPhase: 2,
      floatAmp: 6,
      zIndex: 4
    },
    {
      left: 570,
      top: 340,
      size: 190,
      fontSize: "15px",
      fontWeight: 850,
      padding: "22px 16px",
      floatPhase: 4,
      floatAmp: 5,
      zIndex: 4
    }
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "840px",
      height: "560px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box"
    }}>
      {/* Background Thin Orbital Ring Line */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 2 }}>
        <circle
          cx="420"
          cy="280"
          r="260"
          fill="none"
          stroke={isLight ? `rgba(${rgb}, 0.2)` : `rgba(${rgb}, 0.3)`}
          strokeWidth="1.5"
          strokeDasharray="6 6"
        />
        <circle
          cx="420"
          cy="280"
          r="190"
          fill="none"
          stroke={isLight ? `rgba(${rgb}, 0.12)` : `rgba(${rgb}, 0.15)`}
          strokeWidth="1"
        />
      </svg>

      {bubbleItems.map((item, idx) => {
        const config = bubbleConfigs[idx];
        const palette = themeColors[idx % themeColors.length];
        if (!config || !palette) return null;

        const animConfig = item.comp 
          ? getAnimationConfig(item.comp, idx, "scale-in", 0.2 + idx * 0.1, t)
          : { animation: "scale-in" as const, delay: 0.2 + idx * 0.1 };

        const floatY = getFloatOffset(config.floatPhase, config.floatAmp);
        const size = config.size;

        const bgStyle = palette.isMain
          ? (isLight
              ? `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.95) 0%, transparent 60%), linear-gradient(135deg, rgba(${palette.rgb}, 0.25), rgba(255, 255, 255, 0.92))`
              : `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.3) 0%, transparent 55%), linear-gradient(135deg, rgba(${palette.rgb}, 0.35), rgba(15, 23, 42, 0.85))`)
          : (isLight
              ? `linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(${palette.rgb}, 0.15))`
              : `linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(${palette.rgb}, 0.25))`);

        const borderStyle = `2.5px solid ${palette.accentBorder}`;
        const boxShadow = isLight
          ? `0 15px 35px rgba(0, 0, 0, 0.08), 0 0 20px ${palette.accentGlow}`
          : `0 20px 45px rgba(0, 0, 0, 0.5), 0 0 30px ${palette.accentGlow}`;
        const textColor = isLight ? "#0f172a" : "#ffffff";

        return (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${config.left}px`,
              top: `${config.top}px`,
              width: `${size}px`,
              height: `${size}px`,
              transform: `translateY(${floatY}px)`,
              zIndex: config.zIndex
            }}
          >
            <AnimatedBlock 
              animation={animConfig.animation} 
              delaySeconds={animConfig.delay}
              style={{ height: "100%" }}
            >
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                padding: resolvePadding(config.padding, paddingScale),
                background: bgStyle,
                border: borderStyle,
                boxShadow: boxShadow,
                backdropFilter: "blur(16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                boxSizing: "border-box",
                textTransform: "uppercase"
              }}>
                <div style={{
                  fontSize: getDynamicFontSize(item.text, parseInt(config.fontSize, 10), fontScale),
                  lineHeight: 1.25,
                  fontWeight: config.fontWeight,
                  color: textColor,
                  fontFamily: styles.fontFamily,
                  wordBreak: "break-word",
                  maxHeight: `${size - 40}px`,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {item.text}
                </div>
              </div>
            </AnimatedBlock>
          </div>
        );
      })}
    </div>
  );
};
