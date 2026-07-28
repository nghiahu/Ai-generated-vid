import React from "react";
import { useCurrentFrame } from "remotion";
import { AnimatedBlock } from "../../../components/layout/AnimatedBlock";
import { ModeRendererProps } from "./LayoutModeTypes";
import { resolvePadding, getAnimationConfig, getDynamicFontSize } from "./LayoutNestedRenderers";

export const VennSpheresMode: React.FC<ModeRendererProps> = ({
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

  // Dynamically derive 3 harmonious theme colors from active theme's accentColor (rgb)
  const themeColors = (() => {
    const mainRgb = rgb || "59, 130, 246";
    const [r, g, b] = mainRgb.split(",").map(n => parseInt(n.trim(), 10) || 100);

    // Sphere 1: Primary Accent Color of Theme
    const c1Accent = accentColor || `rgb(${mainRgb})`;
    const c1Glow = `rgba(${mainRgb}, 0.45)`;

    // Sphere 2: Harmonious Analogous Shift 1 (warm/gold tint of active theme)
    const r2 = Math.min(255, Math.floor(r * 0.85 + 50));
    const g2 = Math.min(255, Math.floor(g * 0.9 + 40));
    const b2 = Math.max(0, Math.floor(b * 0.5));
    const c2Rgb = `${r2}, ${g2}, ${b2}`;
    const c2Accent = `rgb(${c2Rgb})`;
    const c2Glow = `rgba(${c2Rgb}, 0.45)`;

    // Sphere 3: Harmonious Analogous Shift 2 (cool/purple-indigo tint of active theme)
    const r3 = Math.max(0, Math.floor(r * 0.6 + 40));
    const g3 = Math.max(0, Math.floor(g * 0.5 + 20));
    const b3 = Math.min(255, Math.floor(b * 1.1 + 45));
    const c3Rgb = `${r3}, ${g3}, ${b3}`;
    const c3Accent = `rgb(${c3Rgb})`;
    const c3Glow = `rgba(${c3Rgb}, 0.45)`;

    return [
      { accentColor: c1Accent, glowColor: c1Glow, rgb: mainRgb },
      { accentColor: c2Accent, glowColor: c2Glow, rgb: c2Rgb },
      { accentColor: c3Accent, glowColor: c3Glow, rgb: c3Rgb }
    ];
  })();

  // 3 interlocked overlapping Venn glass spheres matching Reference Image 2
  const sphereConfigs = [
    {
      left: 250,
      top: 0,
      size: 340,
      fontSize: "22px",
      fontWeight: 860,
      padding: "45px 36px",
      floatPhase: 0,
      floatAmp: 4,
      zIndex: 3
    },
    {
      left: 80,
      top: 175,
      size: 340,
      fontSize: "22px",
      fontWeight: 860,
      padding: "45px 36px",
      floatPhase: 2,
      floatAmp: 6,
      zIndex: 2
    },
    {
      left: 420,
      top: 175,
      size: 340,
      fontSize: "22px",
      fontWeight: 860,
      padding: "45px 36px",
      floatPhase: 4,
      floatAmp: 5,
      zIndex: 1
    }
  ];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "840px",
      height: "530px",
      alignSelf: "center",
      zIndex: 5,
      boxSizing: "border-box"
    }}>
      {bubbleItems.map((item, idx) => {
        const config = sphereConfigs[idx];
        const palette = themeColors[idx % themeColors.length];
        if (!config || !palette) return null;

        const animConfig = item.comp 
          ? getAnimationConfig(item.comp, idx, "scale-in", 0.2 + idx * 0.1, t)
          : { animation: "scale-in" as const, delay: 0.2 + idx * 0.1 };

        const floatY = getFloatOffset(config.floatPhase, config.floatAmp);
        const size = config.size;

        const bgStyle = isLight
          ? `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.95) 0%, transparent 45%), linear-gradient(135deg, ${palette.glowColor}, rgba(255, 255, 255, 0.88))`
          : `radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.25) 0%, transparent 45%), linear-gradient(135deg, ${palette.glowColor}, rgba(10, 18, 36, 0.78))`;

        const borderStyle = `2.5px solid ${palette.accentColor}`;
        const boxShadow = isLight
          ? `0 15px 35px ${palette.glowColor}, inset 0 0 15px rgba(255, 255, 255, 0.8)`
          : `0 0 35px ${palette.glowColor}, inset 0 0 20px ${palette.glowColor}`;
        const textColor = isLight ? "#0f172a" : "rgb(248, 250, 252)";

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
                  lineHeight: 1.3,
                  fontWeight: config.fontWeight,
                  color: textColor,
                  fontFamily: styles.fontFamily,
                  textShadow: isLight ? "none" : `0 0 18px ${config.glowColor}`,
                  wordBreak: "break-word",
                  maxHeight: "180px",
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
